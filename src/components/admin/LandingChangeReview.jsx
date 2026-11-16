import { useEffect, useRef } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

export default function LandingChangeReview({ review, landings, busy, onClose, onApply }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} aria-labelledby="landing-review-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/50">
    <div className="flex items-center justify-between border-b border-slate-100 p-5">
      <h2 id="landing-review-title" className="text-lg font-bold text-slate-900">{review.title}</h2>
      <button type="button" disabled={busy} aria-label="Đóng xem trước" onClick={onClose} className="rounded-lg p-3 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
    </div>
    <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
      <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"><AlertTriangle size={18} className="mt-1 shrink-0" />Áp dụng cho đăng ký tiếp theo. Lead đã nhận và người phụ trách hiện tại được giữ nguyên.</p>
      {review.updates.map(update => {
        const previous = landings.find(row => row.id === update.landingId);
        return <div key={update.landingId} className="rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">{previous?.name || update.landingId}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600"><span>{previous?.course_k} · {previous?.targetFunnel}</span><ArrowRight size={14} /><strong className="text-[#8B2E2E]">{update.courseK || previous?.course_k} · {update.funnelType.toUpperCase()}</strong></div>
          <code className="mt-3 block break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{update.sourceKey}</code>
        </div>;
      })}
      {review.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{review.error}</p>}
    </div>
    <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
      <button type="button" autoFocus disabled={busy} onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Quay lại</button>
      <button type="button" disabled={busy} onClick={onApply} className="min-h-11 rounded-xl bg-[#8B2E2E] px-4 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Đang lưu…' : `Xác nhận lưu ${review.updates.length} landing`}</button>
    </div>
  </dialog>;
}
