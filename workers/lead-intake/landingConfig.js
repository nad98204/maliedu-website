import { fail } from './payload.js';

const MANAGED_PATHS = new Set([
  'dao-tao/khoi-thong-dong-tien', 'dao-tao/khoi-thong-dong-tien-leader',
  'dao-tao/khoi-thong-dong-tien-thuonghieu', 'dao-tao/bi-mat-luat-hap-dan',
]);
const normalizePath = value => String(value || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').toLowerCase();

// Read one small public configuration document; never load leads or customer data.
export async function validateManagedLanding(lead, { fetcher = fetch } = {}) {
  const payload = lead.payload;
  let sourcePath = '';
  try { sourcePath = normalizePath(new URL(payload.sourceUrl).pathname); } catch { /* Optional URL. */ }
  const path = normalizePath(payload.landingPageSlug) || sourcePath;
  if (!MANAGED_PATHS.has(path) && !MANAGED_PATHS.has(sourcePath)) return;
  if (!payload.landingPageId || !/^[a-zA-Z0-9_-]{1,160}$/.test(payload.landingPageId)) fail(409, 'Lớp học vừa được cập nhật. Bạn vui lòng tải lại trang rồi gửi lại.');
  const url = new URL('https://firestore.googleapis.com/v1/projects/dangpkkzxy/databases/(default)/documents/landing_pages/' + payload.landingPageId);
  for (const field of ['slug', 'active_source_key', 'course_k', 'targetFunnel', 'funnel_type', 'is_maintenance']) url.searchParams.append('mask.fieldPaths', field);
  let response;
  try { response = await fetcher(url, { signal: AbortSignal.timeout(5000) }); }
  catch { fail(503, 'Chưa kiểm tra được lớp học đang nhận đăng ký. Bạn vui lòng giữ thông tin và thử lại.'); }
  if (!response.ok) fail(response.status === 404 ? 409 : 503, 'Chưa xác nhận được lớp học. Bạn vui lòng tải lại trang rồi thử lại.');
  const document = await response.json();
  const value = key => document.fields?.[key]?.stringValue || '';
  if (document.fields?.is_maintenance?.booleanValue) fail(409, 'Lớp học đang tạm ngưng nhận đăng ký.');
  const configuredFunnel = String(value('targetFunnel') || value('funnel_type')).toLowerCase();
  const funnel = configuredFunnel.includes('leader') ? 'leader' : /brand|thuonghieu/.test(configuredFunnel) ? 'brand' : configuredFunnel === 'ads' ? 'ads' : '';
  const batch = value('course_k').toUpperCase();
  if (!/^K\d+$/.test(batch) || !funnel || normalizePath(value('slug')) !== path ||
      value('active_source_key') !== payload.source_key || lead.nodePath !== 'funnels/' + funnel ||
      [payload.course_k, payload.batchName].filter(Boolean).some(k => String(k).toUpperCase() !== batch) ||
      ![payload.course_k, payload.batchName].some(Boolean)) {
    fail(409, 'Khóa K hoặc phễu vừa thay đổi. Bạn vui lòng tải lại trang và gửi lại; thông tin chưa được đăng ký vào lớp cũ.');
  }
}
