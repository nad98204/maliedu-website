export const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export const json = (body, status = 200) => Response.json(body, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
} });
export const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
export const sha256 = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
  .map(byte => byte.toString(16).padStart(2, '0')).join('');

const paths = new Set(['funnels/ads', 'funnels/leader', 'funnels/brand', 'funnels/thuonghieu']);
const fields = new Set([
  'assignedName', 'assigned_to', 'batchName', 'batch_id', 'courseName', 'course_k',
  'cpCampaign', 'cpContent', 'cpMedium', 'cpSource', 'cpTerm', 'customerNote', 'email',
  'fbCurrency', 'fbEventValue', 'fbc', 'fbp', 'funnel_channel', 'funnel_type',
  'ghiChu', 'ghi_chu', 'hasRegisteredLHD', 'is_learned_loa', 'landingPageId',
  'landingPageSlug', 'lead_event_id', 'leaderName', 'leaderSlug', 'leaderUtm',
  'leader_utm', 'meta_event_id', 'name', 'note', 'other_referrer_name', 'phone',
  'referrer', 'referrer_type', 'registered_loa', 'remarks', 'sourceUrl', 'source_key',
  'source_type', 'staff_in_charge', 'targetFunnel', 'test_event_code', 'utm_owner',
  'utm_owner_slug', 'introducedBy',
]);
const longFields = new Set(['customerNote', 'ghiChu', 'ghi_chu', 'note', 'remarks', 'sourceUrl']);

export async function readJson(request, maxBytes = 32768) {
  if (Number(request.headers.get('content-length')) > maxBytes) fail(413, 'Dữ liệu gửi quá lớn.');
  // Stream the body so a missing Content-Length cannot bypass the memory bound.
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); fail(413, 'Dữ liệu gửi quá lớn.'); }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { fail(400, 'Dữ liệu đăng ký không hợp lệ.'); }
}

export async function parseLead(request, now = Date.now()) {
  const body = await readJson(request);
  const nodePath = String(body?.nodePath || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!paths.has(nodePath)) fail(400, 'Phễu đăng ký không hợp lệ.');
  const input = body?.payload;
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Dữ liệu đăng ký không hợp lệ.');
  const name = String(input.name || '').trim();
  const phone = String(input.phone || '').trim().replace(/\s+/g, '');
  const phoneDigits = phone.replace(/\D/g, '');
  const email = String(input.email || '').trim().toLowerCase();
  const sourceKey = String(input.source_key || '').trim();
  if (name.length < 2 || name.length > 120 || phoneDigits.length < 9 || phoneDigits.length > 15 ||
    !/^[0-9+ ().-]{9,20}$/.test(phone) || !/^[a-zA-Z0-9_-]{2,100}$/.test(sourceKey) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fail(400, 'Vui lòng kiểm tra họ tên và số điện thoại.');
  const payload = Object.fromEntries(Object.entries(input).filter(([key]) => fields.has(key)).map(([key, value]) => [
    key, typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))
      ? value : String(value ?? '').trim().slice(0, longFields.has(key) ? 2000 : 300),
  ]));
  const fingerprint = await sha256(JSON.stringify([nodePath, normalizeSearch(name), phoneDigits.replace(/^84(?=\d{9}$)/, '0'),
    email, sourceKey, payload.course_k || payload.batchName || '', payload.landingPageId || '', payload.referrer || '']));
  const clientId = body.submissionId || request.headers.get('Idempotency-Key');
  if (clientId && !/^[a-zA-Z0-9_-]{16,100}$/.test(clientId)) fail(400, 'Mã đăng ký không hợp lệ.');
  // Old cached clients lack an idempotency key. Give them bounded deduplication too.
  const id = clientId ? `web_${clientId}` : `web_legacy_${await sha256(`${fingerprint}:${Math.floor(now / 1800000)}`)}`;
  return { id, fingerprint, nodePath, payload: {
    ...payload, name, phone, email, source_key: sourceKey, status: 'NEW', createdVia: 'landing',
    createdAt: new Date(now).toISOString(), receivedAt: new Date(now).toISOString(),
    websiteRegistrationId: id,
    clientIp: request.headers.get('X-Lead-Client-IP') || '',
    userAgent: (request.headers.get('user-agent') || '').slice(0, 500),
  } };
}
