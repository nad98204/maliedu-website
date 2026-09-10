import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Download, LoaderCircle, Megaphone, RefreshCw, Search } from 'lucide-react';
import AdminDataAdsHistory from './AdminDataAdsHistory';
import { exportLeadIntake, requestLeadIntake } from '../../services/leadIntakeService';

const states = {
  pending: { text: 'Chờ đồng bộ', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  sending: { text: 'Đang gửi', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  synced: { text: 'Đã đồng bộ', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  attention: { text: 'Cần xử lý', style: 'bg-red-50 text-red-700 border-red-200' },
};
const time = value => value ? new Date(value).toLocaleString('vi-VN') : '—';
const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/10';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-secret-wax hover:text-secret-wax disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminDataAds() {
  const [view, setView] = useState('current');
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sync, setSync] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState('');
  const [exporting, setExporting] = useState(false);
  const sequence = useRef(0);
  const filters = { search: searchTerm, sync, from, to };
  const fetchRows = useCallback(async (quiet = false) => {
    const current = ++sequence.current;
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ search: searchTerm, sync, from, to, page: String(page), limit: '20' });
      const data = await requestLeadIntake('?' + params);
      if (current !== sequence.current) return;
      setResult(data); setError('');
    } catch (e) { if (current === sequence.current) setError(e.message); }
    finally { if (current === sequence.current) setLoading(false); }
  }, [searchTerm, sync, from, to, page]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearchTerm(search); setPage(0); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (view !== 'current') return;
    const counter = sequence;
    fetchRows();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') fetchRows(true); }, 15000);
    return () => { clearInterval(timer); counter.current++; };
  }, [fetchRows, view]);

  async function retry(id) {
    setRetrying(id);
    try { await requestLeadIntake('/retry', { method: 'POST', body: JSON.stringify({ id }) }); await fetchRows(true); }
    catch (e) { setError(e.message); }
    finally { setRetrying(''); }
  }
  async function download() {
    setExporting(true);
    try { await exportLeadIntake(filters); }
    catch (e) { setError(e.message); }
    finally { setExporting(false); }
  }
  const summary = result?.summary || {};
  const pendingTooLong = summary.oldestPendingAt && Date.now() - summary.oldestPendingAt > 600000;
  const schedulerStale = summary.pending > 0 && (!result?.health?.last_run_at || Date.now() - result.health.last_run_at > 300000);
  const tabs = <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nguồn dữ liệu đăng ký">
    {[['current', 'Đăng ký mới · Tự đồng bộ CRM'], ['history', 'Dữ liệu trước nâng cấp']].map(([key, label]) =>
      <button key={key} role="tab" aria-selected={view === key} onClick={() => setView(key)}
        className={buttonClass + (view === key ? ' !border-secret-wax !bg-secret-wax !text-white' : '')}>{label}</button>)}
  </div>;
  if (view === 'history') return <><div className="bg-slate-50 px-4 pt-6 md:px-8">{tabs}</div><AdminDataAdsHistory /></>;
  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div><h1 className="flex items-center gap-3 text-2xl font-black uppercase md:text-3xl"><Megaphone className="text-secret-wax" />Quản lý Data Ads</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Đăng ký được lưu tại website trước và tự chuyển sang CRM. Khách đang chờ đồng bộ vẫn đã đăng ký thành công.</p></div>
        <button className={buttonClass} onClick={() => fetchRows()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Làm mới</button>
      </div>
      {tabs}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Đã lưu tại website', summary.total || 0, Megaphone, 'text-slate-700'], ['Đã đồng bộ CRM', summary.synced || 0, CheckCircle2, 'text-emerald-700'],
          ['Chờ đồng bộ', summary.pending || 0, Clock3, 'text-amber-700'], ['Cần xử lý', summary.attention || 0, AlertTriangle, 'text-red-700']].map(([label, value, Icon, color]) =>
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><div className={'mb-2 flex items-center gap-2 text-xs font-bold ' + color}><Icon size={16} />{label}</div><div className="text-3xl font-black">{result ? value : '—'}</div></div>)}
      </div>
      {(pendingTooLong || schedulerStale || summary.attention > 0) && <div role="status" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle size={20} className="shrink-0" /><div><strong>Có đăng ký cần theo dõi.</strong> Dữ liệu vẫn được lưu trên website.
          {schedulerStale ? ' Tiến trình tự động chưa cập nhật gần đây; cần kiểm tra kết nối.' : ' Hệ thống tiếp tục thử gửi lại. Bạn có thể lọc danh sách hoặc xuất dữ liệu để liên hệ khách.'}</div>
      </div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}{result ? ' Danh sách bên dưới là lần tải thành công gần nhất.' : ''}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm theo tên hoặc số điện thoại" className={inputClass + ' w-full pl-9'} placeholder="Tìm tên, số điện thoại..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select aria-label="Đồng bộ CRM" className={inputClass} value={sync} onChange={e => { setSync(e.target.value); setPage(0); }}><option value="all">Tất cả đồng bộ</option>{Object.entries(states).map(([key, state]) => <option key={key} value={key}>{state.text}</option>)}</select>
          <input type="date" aria-label="Từ ngày" className={inputClass} value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} />
          <input type="date" aria-label="Đến ngày" className={inputClass} value={to} onChange={e => { setTo(e.target.value); setPage(0); }} />
          <button className={buttonClass} onClick={download} disabled={exporting || !result?.total}>{exporting ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}Xuất danh sách</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Khách đăng ký', 'Nguồn / Khóa K', 'Ngày đăng ký', 'Đồng bộ CRM', 'Lần thử gần nhất', 'Thao tác'].map(title => <th key={title} className="px-4 py-3">{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !result ? <tr><td colSpan={6} className="p-12 text-center text-slate-500">Đang tải đăng ký...</td></tr> : !result?.leads.length ? <tr><td colSpan={6} className="p-12 text-center text-slate-500">{error ? 'Chưa tải được dữ liệu.' : 'Chưa có đăng ký phù hợp. Dữ liệu trước nâng cấp vẫn có ở tab bên cạnh.'}</td></tr> : result.leads.map(lead => {
                const state = states[lead.syncStatus] || states.pending;
                return <tr key={lead.id} className="align-top hover:bg-slate-50/70"><td className="px-4 py-4"><div className="font-bold">{lead.name}</div><a className="mt-1 block font-mono text-xs text-slate-600" href={'tel:' + lead.phone}>{lead.phone}</a></td>
                  <td className="max-w-52 px-4 py-4"><div className="break-all text-xs font-semibold text-indigo-700">{lead.source}</div><span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs">{lead.batchName || 'Chưa có khóa K'}</span></td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{time(lead.createdAt)}</td>
                  <td className="max-w-64 px-4 py-4"><span className={'inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ' + state.style}>{state.text}</span>{lead.lastError && <p className="mt-2 text-xs leading-relaxed text-red-700">{lead.lastError}</p>}{lead.syncedAt && <p className="mt-2 text-xs text-slate-500">{time(lead.syncedAt)}</p>}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500"><div>{time(lead.lastAttemptAt)}</div><div className="mt-1">{lead.attempts} lần thử</div>{lead.syncStatus !== 'synced' && <div className="mt-1">Thử lại: {time(lead.nextAttemptAt)}</div>}</td>
                  <td className="px-4 py-4">{lead.syncStatus !== 'synced' && <button className={buttonClass} onClick={() => retry(lead.id)} disabled={Boolean(retrying) || lead.syncStatus === 'sending'}><RefreshCw size={14} className={retrying === lead.id ? 'animate-spin' : ''} />Gửi lại</button>}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>{result?.total || 0} đăng ký · Tự cập nhật mỗi 15 giây</span><div className="flex items-center gap-3"><button className={buttonClass} onClick={() => setPage(p => p - 1)} disabled={loading || page === 0}>Trước</button><span>Trang {page + 1}</span><button className={buttonClass} onClick={() => setPage(p => p + 1)} disabled={loading || !result || (page + 1) * result.pageSize >= result.total}>Sau</button></div>
        </div>
      </div>
    </div>
  </div>;
}
