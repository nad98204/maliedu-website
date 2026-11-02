// Local Vite only: use the developer's existing Application Default Credentials.
// No credential or Admin SDK code is included in the browser or Pages functions.
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { createCommunityRegistrationHandlers } from '../functions/_lib/communityRegistrations.js';

const buckets = new Map();
const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } });
export async function communityDevApi({ request, clientIp = 'local' }) {
  const path = new URL(request.url).pathname;
  const admin = path === '/api/admin/community-registrations';
  if (request.method !== (admin ? 'GET' : 'POST')) return json({ error: 'Method not allowed' }, 405);
  try {
    if (Number(request.headers.get('content-length')) > 32768) return json({ error: 'Dữ liệu gửi quá lớn.' }, 413);
    const app = getApps().find(app => app.name === 'community-local-api') || initializeApp({
      credential: applicationDefault(), projectId: 'maliedu-web',
    }, 'community-local-api');
    const handlers = createCommunityRegistrationHandlers({ getDb: () => getFirestore(app), fieldValue: FieldValue, json });
    if (admin) {
      const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') || '');
      if (!match) return json({ error: 'Vui lòng đăng nhập tài khoản quản trị.' }, 401);
      let adminUser;
      try { adminUser = await getAuth(app).verifyIdToken(match[1]); }
      catch { return json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }, 401); }
      return await handlers.list({ request, adminUser });
    }
    const now = Date.now();
    const previous = buckets.get(clientIp);
    const bucket = previous?.until > now ? previous : { until: now + 600000, count: 0 };
    if (++bucket.count > 8) return json({ error: 'Bạn đã gửi nhiều lần. Vui lòng chờ ít phút rồi thử lại.' }, 429);
    buckets.set(clientIp, bucket);
    if (buckets.size > 1000) for (const [key, item] of buckets) if (item.until <= now) buckets.delete(key);
    return await handlers.register({ request });
  } catch (error) {
    const status = error.status || 503;
    return json({ error: status < 500 ? error.message : 'Chưa kết nối được dữ liệu website. Vui lòng giữ thông tin và thử lại.' }, status);
  }
}
