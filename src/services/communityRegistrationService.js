import config from '../landing-templates/danh-thuc-long-biet-on/config.json';

export const normalizeRegistrationPhone = value => {
  let phone = value.trim().replace(/[\s.()-]/g, '');
  if (phone.startsWith('+84')) phone = '0' + phone.slice(3);
  else if (phone.startsWith('84')) phone = '0' + phone.slice(2);
  return /^0[35789]\d{8}$/.test(phone) ? phone : '';
};

export async function submitCommunityRegistration(fields, location = window.location) {
  const params = new URLSearchParams(location.search);
  const referralCode = (params.get('ref') || params.get('leader') || 'cong-ty').trim().toLowerCase();
  const utm = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map(key => [key, params.get(key) || '']));
  let response;
  try {
    response = await fetch('/api/community-registrations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...fields, phone: normalizeRegistrationPhone(fields.phone), courseId: config.courseId, referralCode, pagePath: location.pathname, utm }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new Error('Chưa nhận được xác nhận đăng ký. Bạn hãy kiểm tra kết nối và gửi lại; hệ thống sẽ tránh lưu trùng số điện thoại.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true || result.courseId !== config.courseId) {
    throw new Error(response.status === 429 ? 'Bạn đã gửi nhiều lần. Vui lòng chờ ít phút rồi thử lại.' : result.error || 'Chưa lưu được đăng ký. Vui lòng thử lại sau.');
  }
  return result;
}
