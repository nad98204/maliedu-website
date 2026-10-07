import { auth } from '../firebase';

export async function loadReferralIntake() {
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập tài khoản quản trị.');
  const leads = [];
  const params = new URLSearchParams({ limit: '100' });
  let page = 0;
  while (true) {
    params.set('page', String(page++));
    const request = async refresh => fetch(`/api/admin/referral-leads?${params}`, {
      headers: { Authorization: `Bearer ${await user.getIdToken(refresh)}` },
    });
    let response = await request(false);
    if (response.status === 401) response = await request(true);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Chưa tải được đăng ký mới.');
    leads.push(...result.leads);
    params.set('snapshot', String(result.snapshot));
    if (leads.length >= result.total || !result.leads.length) return leads;
  }
}
