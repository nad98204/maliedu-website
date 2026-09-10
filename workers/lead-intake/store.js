import { fail, normalizeSearch, sha256 } from './payload.js';

export const getLead = (db, id) => db.prepare('SELECT * FROM lead_intake WHERE id = ?').bind(id).first();

export async function persistLead(db, lead, now = Date.now()) {
  const existing = await getLead(db, lead.id);
  if (existing) {
    if (existing.fingerprint !== lead.fingerprint) fail(409, 'Mã đăng ký đã được dùng cho thông tin khác. Vui lòng tải lại trang.');
    return existing;
  }
  const ip = lead.payload.clientIp;
  if (ip) {
    const bucket = await sha256(`${ip}:${Math.floor(now / 600000)}`);
    const count = await db.prepare(`INSERT INTO intake_rate_limits (bucket, requests, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET requests = requests + 1 RETURNING requests`).bind(bucket, now + 1200000).first();
    if (count.requests > 20) fail(429, 'Bạn đã gửi nhiều đăng ký. Vui lòng thử lại sau ít phút.');
  }
  const p = lead.payload;
  // One committed row contains both the immutable registration and its durable work item.
  await db.prepare(`INSERT INTO lead_intake
    (id, fingerprint, node_path, payload_json, name, phone, search_text, source_key, batch_name, created_at, next_attempt_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`).bind(
    lead.id, lead.fingerprint, lead.nodePath, JSON.stringify(p), p.name, p.phone,
    `${normalizeSearch(p.name)} ${p.phone.replace(/\D/g, '')}`, p.source_key, p.course_k || p.batchName || '', now, now,
  ).run();
  const stored = await getLead(db, lead.id);
  if (!stored) fail(503, 'Chưa lưu được đăng ký. Vui lòng giữ thông tin và thử lại.');
  if (stored.fingerprint !== lead.fingerprint) fail(409, 'Mã đăng ký đã được dùng cho thông tin khác.');
  return stored;
}

export async function claimLead(db, id, now = Date.now()) {
  const token = crypto.randomUUID();
  return db.prepare(`UPDATE lead_intake SET sync_status = 'sending', lease_token = ?, locked_until = ?,
    attempts = attempts + 1, last_attempt_at = ? WHERE id = ? AND sync_status != 'synced'
    AND next_attempt_at <= ? AND locked_until <= ? RETURNING *`)
    .bind(token, now + 90000, now, id, now, now).first();
}

export async function markSynced(db, row, now = Date.now()) {
  await db.prepare(`UPDATE lead_intake SET sync_status = 'synced', synced_at = ?, last_error = NULL,
    locked_until = 0, lease_token = NULL WHERE id = ? AND lease_token = ?`)
    .bind(now, row.id, row.lease_token).run();
}

export async function markFailed(db, row, error, now = Date.now()) {
  const status = row.attempts >= 5 || [401, 403, 409].includes(error.status) ? 'attention' : 'pending';
  const delay = Math.min(900000, 60000 * 2 ** Math.min(row.attempts - 1, 4));
  const reason = error.publicMessage || (error.status ? `CRM chưa xác nhận (HTTP ${error.status}).` : 'Không kết nối được CRM; hệ thống sẽ tự thử lại.');
  await db.prepare(`UPDATE lead_intake SET sync_status = ?, next_attempt_at = ?, last_error = ?,
    locked_until = 0, lease_token = NULL WHERE id = ? AND lease_token = ?`)
    .bind(status, now + delay, reason.slice(0, 300), row.id, row.lease_token).run();
}

export async function retryLead(db, id, actor, now = Date.now()) {
  const row = await getLead(db, id);
  if (!row) fail(404, 'Không tìm thấy đăng ký.');
  if (row.sync_status === 'synced') return row;
  if (row.locked_until > now) fail(409, 'Đăng ký đang được gửi. Vui lòng chờ hoàn tất.');
  await db.batch([
    db.prepare(`UPDATE lead_intake SET next_attempt_at = ?, sync_status = 'pending'
      WHERE id = ? AND sync_status != 'synced' AND locked_until <= ?`).bind(now, id, now),
    db.prepare('INSERT INTO intake_audit (lead_id, actor_id, action, created_at) VALUES (?, ?, ?, ?)')
      .bind(id, actor, 'retry', now),
  ]);
  return getLead(db, id);
}

export function listFilter(params) {
  const clauses = [];
  const values = [];
  const status = params.get('sync') || 'all';
  if (status !== 'all') {
    if (!['pending', 'sending', 'synced', 'attention'].includes(status)) fail(400, 'Bộ lọc không hợp lệ.');
    clauses.push('sync_status = ?'); values.push(status);
  }
  const search = normalizeSearch(params.get('search') || '').slice(0, 120);
  if (search) { clauses.push("search_text LIKE ? ESCAPE '\\'"); values.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`); }
  let from = params.get('from'), to = params.get('to');
  for (const date of [from, to]) if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)))) fail(400, 'Ngày lọc không hợp lệ.');
  if (from && to && from > to) [from, to] = [to, from];
  if (from) { clauses.push('created_at >= ?'); values.push(Date.parse(`${from}T00:00:00+07:00`)); }
  if (to) { clauses.push('created_at < ?'); values.push(Date.parse(`${to}T00:00:00+07:00`) + 86400000); }
  const snapshot = Number(params.get('snapshot')) || Date.now();
  clauses.push('created_at <= ?'); values.push(snapshot);
  return { sql: `WHERE ${clauses.join(' AND ')}`, values, snapshot };
}

export const publicLead = row => ({
  id: row.id, name: row.name, phone: row.phone, source: row.source_key, batchName: row.batch_name,
  createdAt: row.created_at, status: 'new', syncStatus: row.sync_status, attempts: row.attempts,
  lastAttemptAt: row.last_attempt_at, nextAttemptAt: row.next_attempt_at, syncedAt: row.synced_at,
  lastError: row.last_error, crmLeadId: row.sync_status === 'synced' ? row.id : null,
});

export async function listLeads(db, params) {
  const { sql, values, snapshot } = listFilter(params);
  const page = Math.max(0, Math.min(100000, Math.floor(Number(params.get('page')) || 0)));
  const pageSize = Math.max(1, Math.min(100, Math.floor(Number(params.get('limit')) || 20)));
  const [rows, total, summary, health] = await Promise.all([
    db.prepare(`SELECT * FROM lead_intake ${sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...values, pageSize, page * pageSize).all(),
    db.prepare(`SELECT COUNT(*) AS count FROM lead_intake ${sql}`).bind(...values).first(),
    db.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) AS synced,
      SUM(CASE WHEN sync_status != 'synced' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN sync_status = 'attention' THEN 1 ELSE 0 END) AS attention,
      MIN(CASE WHEN sync_status != 'synced' THEN created_at END) AS oldestPendingAt FROM lead_intake`).first(),
    db.prepare("SELECT * FROM intake_health WHERE id = 'scheduled'").first(),
  ]);
  return { leads: rows.results.map(publicLead), total: total.count, page, pageSize, snapshot, summary, health };
}
