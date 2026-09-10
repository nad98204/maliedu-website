import { fail } from './payload.js';

const encoder = new TextEncoder();
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const encode = value => base64url(encoder.encode(JSON.stringify(value)));
const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
let readerToken;
let readerKey;
let signingKeys;

export async function crmReadToken(env, fetcher = fetch) {
  const credentials = JSON.parse(env.CRM_READER_SERVICE_ACCOUNT || '{}');
  if (!credentials.client_email || !credentials.private_key) fail(503, 'Thiếu cấu hình kết nối CRM.');
  if (readerToken?.email === credentials.client_email && readerToken.expires > Date.now() + 60000) return readerToken.value;
  if (readerKey?.pem !== credentials.private_key) {
    const pem = credentials.private_key.replace(/-----[^-]+-----|\s/g, '');
    readerKey = { pem: credentials.private_key, value: await crypto.subtle.importKey('pkcs8', decode(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']) };
  }
  const now = Math.floor(Date.now() / 1000);
  const jwt = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', readerKey.value, encoder.encode(jwt));
  const response = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST',
    signal: AbortSignal.timeout(10000), body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${jwt}.${base64url(new Uint8Array(signature))}`,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) fail(503, 'Không xác thực được kết nối CRM.');
  readerToken = { email: credentials.client_email, value: result.access_token, expires: Date.now() + result.expires_in * 1000 };
  return readerToken.value;
}

export async function verifyFirebaseToken(token, projectId, fetcher = fetch) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) fail(401, 'Vui lòng đăng nhập lại.');
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || !header.kid || claims.aud !== projectId ||
      claims.iss !== `https://securetoken.google.com/${projectId}` ||
      typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128 ||
      !Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now + 30 ||
      !Number.isFinite(claims.auth_time) || claims.auth_time > now + 30) fail(401, 'Vui lòng đăng nhập lại.');
    if (!signingKeys || signingKeys.expires <= Date.now()) {
      const response = await fetcher('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) fail(503, 'Chưa xác thực được phiên quản trị.');
      const result = await response.json();
      signingKeys = { keys: result.keys, expires: Date.now() + 3600000 };
    }
    const jwk = signingKeys.keys.find(key => key.kid === header.kid);
    if (!jwk) { signingKeys = null; fail(401, 'Vui lòng đăng nhập lại.'); }
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`))) fail(401, 'Vui lòng đăng nhập lại.');
    return claims;
  } catch (error) { if (error.status) throw error; fail(401, 'Vui lòng đăng nhập lại.'); }
}

export async function requireDataAdsAdmin(request, env, fetcher = fetch) {
  const token = /^Bearer ([A-Za-z0-9._~-]+)$/i.exec(request.headers.get('authorization') || '')?.[1];
  if (!token) fail(401, 'Vui lòng đăng nhập tài khoản quản trị.');
  const projectId = env.WEBSITE_FIREBASE_PROJECT_ID || 'maliedu-web';
  const user = await verifyFirebaseToken(token, projectId, fetcher);
  if (user.email === 'mongcoaching@gmail.com' && user.email_verified === true) return user;
  const response = await fetcher(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(user.sub)}`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) fail(response.status >= 500 ? 503 : 403, 'Không xác nhận được quyền xem Data Ads.');
  const fields = (await response.json()).fields || {};
  if (fields.role?.stringValue !== 'admin') fail(403, 'Bạn chưa có quyền quản trị.');
  if (fields.allowedModules) {
    if (!fields.allowedModules.arrayValue) fail(403, 'Bạn chưa có quyền xem Data Ads.');
    const modules = (fields.allowedModules.arrayValue.values || []).map(v => v.stringValue);
    if (modules.length && !modules.includes('data-ads')) fail(403, 'Bạn chưa có quyền xem Data Ads.');
  }
  return user;
}
