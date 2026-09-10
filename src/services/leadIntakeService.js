import { auth } from '../firebase';

export async function requestLeadIntake(path = '', options = {}, refresh = false) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập tài khoản quản trị.');
  const response = await fetch(`/api/admin/lead-intake${path}`, {
    ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken(refresh)}` },
  });
  if (response.status === 401 && !refresh) return requestLeadIntake(path, options, true);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Chưa tải được danh sách đăng ký. Vui lòng thử lại.');
  return result;
}

const csvCell = value => {
  let text = String(value ?? '');
  // Prevent names/notes being executed as formulas by spreadsheet software.
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
export async function exportLeadIntake(filters) {
  const params = new URLSearchParams(filters);
  params.set('limit', '100');
  let page = 0, loaded = 0;
  const lines = [['Mã đăng ký', 'Họ tên', 'Điện thoại', 'Nguồn', 'Khóa K', 'Ngày đăng ký', 'Đồng bộ CRM', 'Số lần thử', 'Lỗi gần nhất'].map(csvCell).join(',')];
  const labels = { pending: 'Chờ đồng bộ', sending: 'Đang gửi', synced: 'Đã đồng bộ', attention: 'Cần xử lý' };
  while (true) {
    params.set('page', String(page++));
    const result = await requestLeadIntake(`?${params}`);
    params.set('snapshot', String(result.snapshot));
    for (const lead of result.leads) lines.push([
      lead.id, lead.name, `'${lead.phone}`, lead.source, lead.batchName,
      new Date(lead.createdAt).toLocaleString('vi-VN'), labels[lead.syncStatus], lead.attempts, lead.lastError,
    ].map(csvCell).join(','));
    loaded += result.leads.length;
    if (loaded >= result.total || !result.leads.length) break;
    if (loaded >= 50000) throw new Error('Danh sách quá lớn. Vui lòng lọc theo khoảng ngày nhỏ hơn để xuất.');
  }
  const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = `dang-ky-website-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
