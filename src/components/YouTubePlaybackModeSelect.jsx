import { normalizeYouTubePlaybackMode, YOUTUBE_PLAYBACK_MODES } from '../utils/courseVideo';

export default function YouTubePlaybackModeSelect({ value, onChange, label = 'Cách xem video YouTube', compact = false }) {
  return (
    <label className={`block min-w-0 ${compact ? '' : 'space-y-2'}`}>
      {!compact && <span className="block text-xs font-bold text-slate-600">Cách xem video YouTube</span>}
      <select
        aria-label={label}
        value={normalizeYouTubePlaybackMode(value)}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/10 ${compact ? 'min-h-9 px-2 text-[11px]' : 'min-h-11 px-3 text-sm'}`}
      >
        {YOUTUBE_PLAYBACK_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
      </select>
      {!compact && (
        <p className="text-xs leading-relaxed text-slate-500">
          {normalizeYouTubePlaybackMode(value) === 'external'
            ? 'Học viên bấm nút để mở YouTube ở tab mới, rồi quay lại trang học. Link sẽ hiển thị; không theo dõi tự động thời gian xem. Chế độ này không bỏ được hạn chế bản quyền, khu vực hoặc quyền riêng tư của YouTube.'
            : 'Cần bật “Cho phép nhúng” trên YouTube. Có thể dùng video “Không công khai”; ai có link vẫn xem được. Không thể giấu tuyệt đối link hoặc logo YouTube.'}
        </p>
      )}
    </label>
  );
}
