// Audio documents are private. Only this allowlist may reach the public catalog.
const TEXT_FIELDS = [
  'title', 'benefit', 'description', 'category', 'segment', 'duration', 'authorId',
  'author', 'authorTitle', 'authorRole', 'authorAvatar', 'authorBio', 'coverImage',
  'coverImageSquare', 'coverImageBanner', 'brainwave', 'frequency',
  'recommendedCycle', 'bestTime', 'audioQuality', 'targetAudience', 'detailedGuide',
  'guidePreparation', 'guideRoutine', 'guidePhenomena', 'guideBonus',
  'affiliateBuyerVoucherText',
];
const NUMBER_FIELDS = ['durationSec', 'listens', 'affiliateCommissionPercent',
  'affiliateCommissionAmount', 'affiliateBuyerDiscountPercent'];
const LIST_FIELDS = ['tags', 'effects', 'precautions', 'authorCredentials'];
const COMMISSION_FIELDS = ['isAffiliateEnabled', 'affiliateCommissionType',
  'affiliateCommissionPercent', 'affiliateCommissionAmount', 'affiliateBuyerDiscountPercent',
  'affiliateBuyerVoucherText'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);

export const hypnosisPrice = (value) => {
  const price = typeof value === 'number' ? value : Number(String(value || '').replace(/\D/g, ''));
  return Number.isSafeInteger(price) && price >= 0 ? price : null;
};

export const publicHypnosisTrack = (id, data = {}) => {
  const result = { id, isFree: data.isFree === true, isAffiliateEnabled: data.isAffiliateEnabled !== false };
  for (const field of TEXT_FIELDS) {
    if (typeof data[field] === 'string') result[field] = data[field].slice(0, 30000);
  }
  for (const field of NUMBER_FIELDS) {
    if (data[field] === null || (typeof data[field] === 'number' && Number.isFinite(data[field]))) result[field] = data[field];
  }
  for (const field of LIST_FIELDS) {
    if (Array.isArray(data[field])) result[field] = data[field].filter(v => typeof v === 'string').slice(0, 100);
  }
  result.price = data.isFree === true ? 0 : hypnosisPrice(data.price);
  result.originalPrice = hypnosisPrice(data.originalPrice);
  result.affiliateCommissionType = data.affiliateCommissionType === 'fixed' ? 'fixed' : 'percent';
  if (Array.isArray(data.howToUse)) {
    result.howToUse = data.howToUse.slice(0, 100).map(item => ({
      step: typeof item?.step === 'string' ? item.step : '',
      desc: typeof item?.desc === 'string' ? item.desc : '',
    }));
  }
  return result;
};

// Never accept lookalike hosts, arbitrary iframe URLs or videos from another library.
export const hypnosisMedia = (track, libraryId) => {
  const raw = String(track.audioUrl || '').trim();
  let videoId = '';
  if (UUID.test(raw)) videoId = raw;
  else if (raw) {
    let url;
    try { url = new URL(raw); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (url.hostname === 'iframe.mediadelivery.net') {
      const match = /^\/embed\/(\d+)\/([^/]+)\/?$/.exec(url.pathname);
      if (!match || match[1] !== String(libraryId) || !UUID.test(match[2])) return null;
      videoId = match[2];
    } else if (track.isFree === true && track.audioProvider !== 'bunny') {
      return { provider: 'url', playbackUrl: url.toString() };
    } else return null;
  } else if (UUID.test(String(track.videoId || ''))) videoId = track.videoId;
  if (!videoId || !/^\d+$/.test(String(libraryId))) return null;
  return { provider: 'bunny', videoId: videoId.toLowerCase() };
};

export const hypnosisSecurityReady = (env) =>
  env.HYPNOSIS_BUNNY_SECURITY_CONFIRMED === 'true'
  && Boolean(env.BUNNY_STREAM_TOKEN_KEY && env.BUNNY_STREAM_TOKEN_KEY !== '__DISABLED__');

export const isHypnosisOrderItem = (item, order) =>
  item.productType === 'hypnosis' || (!item.productType && order.productType === 'hypnosis');

export const orderGrantsHypnosis = (order, uid, trackId) => {
  if (!order || order.status !== 'completed' || order.userId !== uid) return false;
  const items = Array.isArray(order.items) && order.items.length
    ? order.items : [{ id: order.trackId || order.courseId, productType: order.productType }];
  return items.some(item => isHypnosisOrderItem(item, order) && (item.id || item.courseId) === trackId);
};

export const hasHypnosisAdminModule = (user, profile, module) => {
  if (user?.email === 'mongcoaching@gmail.com' && user.email_verified === true) return true;
  if (!user?.uid || profile?.role !== 'admin') return false;
  const modules = profile.allowedModules;
  return modules == null || (Array.isArray(modules) && (!modules.length || modules.includes(module)));
};

export const createHypnosisHandlers = ({ getDb, verifyUser, fieldValue, getEnv, signPlayback, json }) => {
  const admin = async (request, module = 'hypnosis') => {
    const user = await verifyUser(request);
    const profile = await getDb().collection('users').doc(user.uid).get();
    if (!hasHypnosisAdminModule(user, profile.data(), module)) fail(403, 'Bạn không có quyền quản lý mục này.');
    return user;
  };
  const readTrack = async (id) => {
    if (!validId(id)) fail(400, 'Mã bản thôi miên không hợp lệ.');
    const snapshot = await getDb().collection('hypnosis_audios').doc(id).get();
    if (!snapshot.exists) fail(404, 'Không tìm thấy bản thôi miên.');
    return snapshot.data();
  };
  const hasAccess = async (uid, id, track, existingAccess) => {
    const access = existingAccess || (await getDb().collection('user_audios').doc(`${uid}_${id}`).get()).data();
    if (!access || access.userId !== uid || access.trackId !== id || access.status !== 'active') return false;
    if (access.expiresAt != null) {
      const expiry = typeof access.expiresAt.toMillis === 'function' ? access.expiresAt.toMillis() : new Date(access.expiresAt).getTime();
      if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;
    }
    if (track.isFree === true) return true;
    // Old rules allowed users to forge access documents. Never trust the document alone.
    if (!validId(access.orderId)) return false;
    const order = await getDb().collection('orders').doc(access.orderId).get();
    return orderGrantsHypnosis(order.data(), uid, id);
  };
  const catalog = async () => {
    const snapshot = await getDb().collection('hypnosis_audios').get();
    const env = getEnv();
    return json({ tracks: snapshot.docs.filter(d => d.data().isPublished !== false).map(d => {
      const track = d.data();
      const media = hypnosisMedia(track, env.BUNNY_STREAM_LIBRARY_ID);
      return { ...publicHypnosisTrack(d.id, track),
        available: Boolean(media && (media.provider !== 'bunny' || hypnosisSecurityReady(env))) };
    }) });
  };
  const library = async ({ request }) => {
    const user = await verifyUser(request);
    const snapshot = await getDb().collection('user_audios').where('userId', '==', user.uid).get();
    const ids = await Promise.all(snapshot.docs.map(async d => {
      const access = d.data();
      if (!validId(access.trackId) || d.id !== `${user.uid}_${access.trackId}`) return null;
      const track = await getDb().collection('hypnosis_audios').doc(access.trackId).get();
      return track.exists && track.data().isPublished !== false && await hasAccess(user.uid, access.trackId, track.data(), access)
        ? access.trackId : null;
    }));
    return json({ trackIds: ids.filter(Boolean) });
  };
  const claim = async ({ request }) => {
    const user = await verifyUser(request);
    const { trackId } = await request.json();
    if (!validId(trackId)) fail(400, 'Mã bản thôi miên không hợp lệ.');
    const db = getDb();
    await db.runTransaction(async transaction => {
      const track = await transaction.get(db.collection('hypnosis_audios').doc(trackId));
      const data = track.data();
      if (!track.exists || data.isPublished === false) fail(404, 'Không tìm thấy bản thôi miên.');
      if (data.isFree !== true) fail(403, 'Bản này cần thanh toán trước khi mở khóa.');
      const env = getEnv();
      const media = hypnosisMedia(data, env.BUNNY_STREAM_LIBRARY_ID);
      if (!media || (media.provider === 'bunny' && !hypnosisSecurityReady(env))) fail(409, 'Bản ghi chưa sẵn sàng để nghe.');
      transaction.set(db.collection('user_audios').doc(`${user.uid}_${trackId}`), {
        userId: user.uid, trackId, isFree: true, price: 0, status: 'active',
        createdAt: fieldValue.serverTimestamp(),
      });
    });
    return json({ success: true, trackId });
  };
  const playback = async ({ request }) => {
    const user = await verifyUser(request);
    const { trackId } = await request.json();
    const track = await readTrack(trackId);
    if (track.isPublished === false || !await hasAccess(user.uid, trackId, track)) fail(403, 'Bạn chưa có quyền nghe bản này.');
    return playbackResponse(track);
  };
  const playbackResponse = async (track) => {
    const env = getEnv();
    const media = hypnosisMedia(track, env.BUNNY_STREAM_LIBRARY_ID);
    if (!media) fail(409, 'Bản ghi chưa có nguồn phát được bảo vệ. Vui lòng liên hệ quản trị.');
    if (media.provider === 'bunny') {
      if (!hypnosisSecurityReady(env)) fail(503, 'Nguồn phát đang được cấu hình bảo mật.');
      return json(await signPlayback(env, media.videoId, 15 * 60));
    }
    return json(media);
  };
  const adminPost = async ({ request }) => {
    const body = await request.json();
    const { action, trackId } = body;
    await admin(request, action === 'commission' ? 'affiliates' : 'hypnosis');
    if (action === 'preview') {
      // Preview unsaved uploads as well, but only for an authorized hypnosis admin.
      return playbackResponse(body.track || await readTrack(trackId));
    }
    if (!validId(trackId)) fail(400, 'Mã bản thôi miên không hợp lệ.');
    const db = getDb();
    const ref = db.collection('hypnosis_audios').doc(trackId);
    if (action === 'delete') { await ref.delete(); return json({ success: true }); }
    if (action === 'commission') {
      const data = publicHypnosisTrack(trackId, body.data);
      const update = Object.fromEntries(COMMISSION_FIELDS.filter(f => data[f] !== undefined).map(f => [f, data[f]]));
      await ref.update({ ...update, updatedAt: fieldValue.serverTimestamp() });
      return json({ success: true });
    }
    if (action !== 'save') fail(400, 'Thao tác không hợp lệ.');
    const input = body.track || {};
    const data = publicHypnosisTrack(trackId, input);
    if (!data.title?.trim()) fail(400, 'Vui lòng nhập tiêu đề bản thôi miên.');
    if (!data.isFree && (!data.price || data.price < 0)) fail(400, 'Bản trả phí cần có giá hợp lệ lớn hơn 0.');
    const env = getEnv();
    const media = hypnosisMedia(input, env.BUNNY_STREAM_LIBRARY_ID);
    if ((input.audioUrl || input.videoId) && !media) fail(400, 'Bản trả phí cần nguồn Bunny Stream đúng thư viện; liên kết trực tiếp chỉ dành cho bài miễn phí.');
    // An empty source is a draft. Never silently publish it or sell sample audio.
    Object.assign(data, {
      audioUrl: media?.provider === 'url' ? media.playbackUrl : '',
      videoId: media?.provider === 'bunny' ? media.videoId : '',
      audioProvider: media?.provider || 'bunny',
      isPublished: Boolean(media) && input.isPublished !== false,
      updatedAt: fieldValue.serverTimestamp(),
    });
    await db.runTransaction(async transaction => {
      const current = await transaction.get(ref);
      if (body.createOnly && current.exists) return;
      transaction.set(ref, { ...data, createdAt: current.data()?.createdAt || fieldValue.serverTimestamp() });
    });
    return json({ success: true, isPublished: data.isPublished });
  };
  return { catalog, library, claim, playback, adminPost };
};

// Server-only fulfillment for manually approved orders. Playback still checks the order.
export const grantHypnosisOrderAccess = async ({ db, fieldValue, order, orderId }) => {
  if (order.status !== 'completed' || !order.userId || !validId(orderId)) return;
  const items = Array.isArray(order.items) && order.items.length ? order.items
    : [{ id: order.trackId || order.courseId, productType: order.productType }];
  const tracks = items.filter(item => isHypnosisOrderItem(item, order) && validId(item.id || item.courseId));
  if (!tracks.length) return;
  const batch = db.batch();
  for (const item of tracks) {
    const trackId = item.id || item.courseId;
    batch.set(db.collection('user_audios').doc(`${order.userId}_${trackId}`), {
      userId: order.userId, trackId, orderId, status: 'active', isFree: false,
      price: item.price || 0, createdAt: fieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
};
