import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Copy, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LandingRoutingEditor({ landing, options, currentFunnel, health, busy, onReview }) {
  const [courseK, setCourseK] = useState(landing.course_k || '');
  const [funnel, setFunnel] = useState(currentFunnel);
  useEffect(() => { setCourseK(landing.course_k || ''); setFunnel(currentFunnel); }, [landing.course_k, landing.active_source_key, currentFunnel]);
  const dirty = courseK.trim().toUpperCase() !== landing.course_k || funnel !== currentFunnel;
  const valid = /^K\d+$/.test(courseK.trim().toUpperCase());
  return <div className="mt-4 border-t border-slate-100 pt-4">
    <div className="grid gap-3 sm:grid-cols-[100px_minmax(0,1fr)_150px]">
      <div>
        <label htmlFor={'batch-' + landing.id} className="mb-1.5 block text-xs font-semibold text-slate-600">Khóa K</label>
        <input id={'batch-' + landing.id} value={courseK} disabled={busy} onChange={event => setCourseK(event.target.value.toUpperCase())}
          aria-invalid={!valid} maxLength={16} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#8B2E2E] focus:ring-2 focus:ring-[#8B2E2E]/15 disabled:opacity-60" />
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mã nguồn đang dùng</label>
        <button type="button" title={'Sao chép ' + landing.active_source_key} onClick={async () => {
          try { await navigator.clipboard.writeText(landing.active_source_key); toast.success('Đã sao chép mã nguồn'); }
          catch { toast.error('Chưa sao chép được. Bạn thử lại nhé.'); }
        }} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-slate-600 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-[#8B2E2E]">
          <code className="min-w-0 break-all text-xs">{landing.active_source_key}</code><Copy size={14} className="shrink-0" />
        </button>
      </div>
      <div>
        <label htmlFor={'funnel-' + landing.id} className="mb-1.5 block text-xs font-semibold text-slate-600">Phễu nhận lead</label>
        <select id={'funnel-' + landing.id} value={funnel} disabled={busy} onChange={event => setFunnel(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#8B2E2E] focus:ring-2 focus:ring-[#8B2E2E]/15 disabled:opacity-60">
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
    </div>
    {!valid && <p className="mt-2 text-xs text-rose-700" role="alert">Nhập khóa theo dạng K58.</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className={'flex items-center gap-1.5 text-xs font-medium ' + (health?.ok && !dirty ? 'text-emerald-700' : 'text-amber-800')}>
        {health?.ok && !dirty ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
        {dirty ? 'Có thay đổi chưa lưu' : health?.ok ? 'Khớp với cấu hình CRM' : 'Cần kiểm tra cấu hình'}
      </div>
      <div className="flex gap-2">
        {dirty && <button type="button" disabled={busy} onClick={() => { setCourseK(landing.course_k || ''); setFunnel(currentFunnel); }} className="min-h-11 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100">Hủy</button>}
        <button type="button" disabled={!dirty || !valid || busy} onClick={() => onReview({ courseK: courseK.trim().toUpperCase(), funnelType: funnel })}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#8B2E2E] px-3 text-xs font-bold text-white hover:bg-[#722525] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"><Save size={14} />Xem trước & lưu</button>
      </div>
    </div>
    {!health?.ok && <ul className="mt-2 space-y-1 text-xs text-amber-800">{health?.issues.map(issue => <li key={issue.code}>• {issue.message}</li>)}</ul>}
  </div>;
}
