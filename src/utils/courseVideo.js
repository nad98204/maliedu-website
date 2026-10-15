import { getYouTubeVideoId } from './videoUtils.js';

export const COURSE_VIDEO_PROVIDERS = Object.freeze([
  { value: 's3', label: 'S3' },
  { value: 'bunny', label: 'Bunny Stream' },
  { value: 'youtube', label: 'Link YouTube' },
]);

export const YOUTUBE_PLAYBACK_MODES = Object.freeze([
  { value: 'embed', label: 'Xem trong trang học' },
  { value: 'external', label: 'Mở trên YouTube (tab mới)' },
]);

export const normalizeYouTubePlaybackMode = (mode) => mode === 'external' ? 'external' : 'embed';

export const getCourseYouTubeId = (value) => {
  const source = typeof value === 'string' ? value.trim() : '';
  return /^[A-Za-z0-9_-]{11}$/.test(source) ? source : getYouTubeVideoId(source);
};

export const getCourseYouTubeWatchUrl = (value) => {
  const id = getCourseYouTubeId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : '';
};

export const normalizeCourseVideoProvider = (provider, source = '') => {
  if (provider === 'bunny') return 'bunny';
  if (provider === 'youtube' || getYouTubeVideoId(source)) return 'youtube';
  return 's3';
};

export const getCourseVideoValidationError = (lesson = {}) => {
  if (normalizeCourseVideoProvider(lesson.videoProvider, lesson.videoId) !== 'youtube') return '';
  return getCourseYouTubeId(lesson.videoId) ? '' : 'Vui lòng nhập link video YouTube hợp lệ (không dùng link kênh hoặc danh sách phát).';
};
