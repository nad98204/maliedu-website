import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, RefreshCw, Search, Sunrise, Users } from 'lucide-react';
import { communityRegistrationsCsv, loadCommunityRegistrations } from '../../services/adminCommunityRegistrationService';
import config from '../../landing-templates/danh-thuc-long-biet-on/config.json';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

export default function AdminCommunityRegistrations() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    loadCommunityRegistrations(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setRows(result.registrations); setLoaded(true); setPage(0);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const filtered = useMemo(() => rows.filter(row => normalize([row.name, row.phone, row.email].join(' ')).includes(normalize(search.trim()))), [rows, search]);
  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const download = () => {
    const blob = new Blob([communityRegistrationsCsv(filtered)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'dang-ky-21-ngay-long-biet-on.csv';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6">
      <div><div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800"><Sunrise size={20} />ĐĂNG KÝ CHƯƠNG TRÌNH CỘNG ĐỒNG</div><h1 className="max-w-3xl text-xl font-bold leading-relaxed md:text-2xl">{config.name}</h1><p className="mt-3 text-sm text-slate-500">Miễn phí · Bắt đầu 29/10/2026 · 5h00 mỗi sáng · 21 ngày liên tục</p><p className="mt-2 text-sm text-slate-500">Danh sách đăng ký được lưu trong website Mali Edu. Đăng ký trên trang và tham gia nhóm Zalo là hai bước riêng.</p></div>
      <a className={buttonClass} href={config.slug} target="_blank" rel="noopener noreferrer">Xem landing <ExternalLink size={16} /></a>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-4"><Users className="text-emerald-700" /><div><p className="text-3xl font-bold">{loaded ? rows.length : '—'}</p><p className="text-xs text-slate-500">Học viên đăng ký · Mỗi số điện thoại một đăng ký</p></div></div><button className={buttonClass} disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Làm mới</button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}{loaded ? ' Danh sách bên dưới là lần tải thành công gần nhất.' : ''}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4"><label className="relative min-w-52 flex-1"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm" aria-label="Tìm tên, số điện thoại hoặc email" placeholder="Tìm tên, số điện thoại, email…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></label><button className={buttonClass} onClick={download} disabled={loading || !filtered.length}><Download size={16} />Xuất CSV {search ? 'đã lọc' : 'toàn bộ'}</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Học viên', 'Điện thoại / Zalo', 'Email', 'Đăng ký lúc (giờ VN)', 'Nguồn'].map(title => <th className="px-5 py-4" key={title}>{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{!loaded && loading ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">Đang tải đăng ký…</td></tr> : !visible.length ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">{error && !loaded ? 'Chưa tải được dữ liệu.' : 'Chưa có đăng ký phù hợp.'}</td></tr> : visible.map(row => <tr key={row.id}><td className="px-5 py-4 font-semibold">{row.name}</td><td className="px-5 py-4"><a href={'tel:' + row.phone}>{row.phone}</a></td><td className="px-5 py-4">{row.email || '—'}</td><td className="px-5 py-4 text-xs">{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}</td><td className="max-w-44 break-words px-5 py-4 text-xs">{row.utm?.utm_source || 'Truy cập trực tiếp'}{row.utm?.utm_campaign && <p className="mt-1 text-slate-500">{row.utm.utm_campaign}</p>}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-500"><span>{filtered.length} đăng ký{search ? ' phù hợp' : ''}</span><div className="flex items-center gap-3"><button className={buttonClass} disabled={page === 0} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page + 1}/{pages}</span><button className={buttonClass} disabled={page + 1 >= pages} onClick={() => setPage(value => value + 1)}>Sau</button></div></div>
    </div>
  </div></div>;
}
