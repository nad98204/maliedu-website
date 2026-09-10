import { crmReadToken } from './googleAuth.js';
import { claimLead, markFailed, markSynced } from './store.js';

const databaseUrl = env => String(env.CRM_DATABASE_URL || 'https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/+$/, '');
const crmError = (status, publicMessage) => Object.assign(new Error(publicMessage || 'CRM unavailable'), { status, publicMessage });

export async function deliverToCrm(row, env, { fetcher = fetch, getReadToken = crmReadToken } = {}) {
  const token = await getReadToken(env, fetcher);
  const url = `${databaseUrl(env)}/${row.node_path}/${encodeURIComponent(row.id)}.json`;
  const read = async () => {
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw crmError(response.status);
    return response.json();
  };
  const matches = record => record?.websiteRegistrationId === row.id;
  const existing = await read();
  if (existing !== null) {
    if (!matches(existing)) throw crmError(409, 'Mã đăng ký đã tồn tại ở CRM với thông tin khác. Cần kiểm tra.');
    return;
  }
  // Deliberately unauthenticated: existing CRM rules only permit creation, never
  // an overwrite. Firebase conditional writes require read permission, so the
  // atomic !data.exists() rule is the create-only guard for this anonymous PUT.
  // The reader credential has no write permission in the project.
  const response = await fetcher(url, { method: 'PUT', headers: {
    'Content-Type': 'application/json',
  }, body: row.payload_json, signal: AbortSignal.timeout(10000) });
  if (response.ok) {
    const result = await response.json();
    if (matches(result)) return;
    throw crmError(502, 'CRM chưa trả về xác nhận hợp lệ; hệ thống sẽ kiểm tra lại.');
  }
  // A competing delivery may have created the record after our read. Check it
  // instead of overwriting it or treating all permission failures as success.
  if ([401, 403, 412].includes(response.status) && matches(await read())) return;
  throw crmError(response.status);
}

export async function syncLead(db, id, env, dependencies = {}) {
  const row = await claimLead(db, id);
  if (!row) return false;
  try {
    await deliverToCrm(row, env, dependencies);
    await markSynced(db, row);
    return true;
  } catch (error) {
    await markFailed(db, row, error);
    // Log only operational metadata, never contact details or credentials.
    console.warn('lead_sync_pending', { id, attempt: row.attempts, status: error.status || 503 });
    return false;
  }
}

export async function sweepPending(env, dependencies = {}) {
  const db = env.LEAD_DB;
  const now = Date.now();
  const rows = await db.prepare(`SELECT id FROM lead_intake WHERE sync_status != 'synced'
    AND next_attempt_at <= ? AND locked_until <= ? ORDER BY next_attempt_at LIMIT 8`).bind(now, now).all();
  // At most eight records per tick keeps recovery within the free-tier subrequest
  // budget even when each record needs a read, a write and a race check.
  const results = await Promise.allSettled(rows.results.map(row => syncLead(db, row.id, env, dependencies)));
  const failures = results.filter(result => result.status === 'rejected');
  if (failures.length) console.error('lead_sweep_storage_failure', { count: failures.length });
  await db.batch([
    db.prepare('DELETE FROM intake_rate_limits WHERE expires_at < ?').bind(now),
    db.prepare(`INSERT INTO intake_health (id, last_run_at, processed) VALUES ('scheduled', ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_run_at = excluded.last_run_at, processed = excluded.processed`)
      .bind(now, results.filter(result => result.status === 'fulfilled' && result.value).length),
  ]);
}
