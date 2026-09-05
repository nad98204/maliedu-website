import { auth } from '../firebase';

const request = async (path, { payload, user, signal } = {}) => {
  const isPublic = path === '/hypnosis/catalog';
  const currentUser = user || auth.currentUser;
  if (!isPublic && !currentUser) throw new Error('Vui lòng đăng nhập để tiếp tục.');
  const token = !isPublic ? await currentUser.getIdToken() : null;
  const response = await fetch(`/api${path}`, {
    method: payload === undefined ? 'GET' : 'POST',
    credentials: 'same-origin', cache: 'no-store', signal,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || 'Không thể tải dữ liệu thôi miên. Vui lòng thử lại.');
  return data;
};

export const getHypnosisCatalog = async (signal) => {
  const data = await request('/hypnosis/catalog', { signal });
  if (!Array.isArray(data.tracks)) throw new Error('Danh mục thôi miên không hợp lệ.');
  return data.tracks.map(track => ({
    ...track,
    price: typeof track.price === 'number' ? `${track.price.toLocaleString('vi-VN')}đ` : track.price,
    originalPrice: typeof track.originalPrice === 'number' && track.originalPrice > 0
      ? `${track.originalPrice.toLocaleString('vi-VN')}đ` : '',
  }));
};
export const getHypnosisLibrary = async (user, signal) =>
  (await request('/hypnosis/library', { user, signal })).trackIds;
export const claimHypnosisTrack = (trackId, user) => request('/hypnosis/claim', { payload: { trackId }, user });
export const getHypnosisPlayback = (trackId, user, signal) => request('/hypnosis/playback', { payload: { trackId }, user, signal });
export const saveHypnosisTrack = (track, createOnly = false) =>
  request('/admin/hypnosis', { payload: { action: 'save', trackId: track.id, track, createOnly } });
export const deleteHypnosisTrack = (trackId) => request('/admin/hypnosis', { payload: { action: 'delete', trackId } });
export const saveHypnosisCommission = (trackId, data) => request('/admin/hypnosis', { payload: { action: 'commission', trackId, data } });
export const previewHypnosisTrack = (track) => request('/admin/hypnosis', { payload: { action: 'preview', track } });
