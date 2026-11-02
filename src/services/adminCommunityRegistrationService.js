import { auth } from '../firebase';

export async function loadCommunityRegistrations(signal) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập tài khoản quản trị.');
  const registrations = [];
  let cursor = '';
  let course;
  do {
    const request = async refresh => fetch('/api/admin/community-registrations' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''), {
      headers: { Authorization: `Bearer ${await user.getIdToken(refresh)}` }, signal,
    });
    let response = await request(false);
    if (response.status === 401) response = await request(true);
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.registrations)) throw new Error(result.error || 'Chưa tải được danh sách đăng ký.');
    registrations.push(...result.registrations);
    course = result.course;
    if (result.nextCursor && result.nextCursor === cursor) throw new Error('Chưa tải đủ danh sách. Vui lòng làm mới.');
    cursor = result.nextCursor || '';
  } while (cursor);
  return { course, registrations };
}

export function communityRegistrationsCsv(rows) {
  const escape = value => {
    let cell = String(value ?? '');
    // Neutralize spreadsheet formulas in user-supplied fields.
    if (/^[\s]*[=+@-]/.test(cell) || /^0\d+$/.test(cell)) cell = "'" + cell;
    return '"' + cell.replace(/"/g, '""') + '"';
  };
  const records = [['Họ tên', 'Số điện thoại / Zalo', 'Email', 'Chương trình', 'Ngày đăng ký (giờ Việt Nam)', 'Nguồn', 'Chiến dịch'],
    ...rows.map(row => [row.name, row.phone, row.email, row.courseName,
      row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '', row.utm?.utm_source, row.utm?.utm_campaign])];
  return '\uFEFF' + records.map(row => row.map(escape).join(',')).join('\r\n');
}
