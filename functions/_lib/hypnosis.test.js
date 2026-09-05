import test from 'node:test';
import assert from 'node:assert/strict';
import { createHypnosisHandlers, publicHypnosisTrack, hypnosisMedia, orderGrantsHypnosis,
  hasHypnosisAdminModule, grantHypnosisOrderAccess } from './hypnosis.js';
import { createBunnyEmbedPlayback } from './bunnyStream.js';

const VIDEO = '11111111-1111-4111-8111-111111111111';
const ENV = { BUNNY_STREAM_LIBRARY_ID: '738609', BUNNY_STREAM_TOKEN_KEY: 'test-secret', HYPNOSIS_BUNNY_SECURITY_CONFIRMED: 'true' };
const paidTrack = { title: 'Paid', price: '199.000đ', isFree: false, audioProvider: 'bunny', videoId: VIDEO };
const freeTrack = { title: 'Free', price: 0, isFree: true, audioProvider: 'url', audioUrl: 'https://example.com/free.mp3' };
const order = { status: 'completed', userId: 'buyer', items: [{ id: 'paid', productType: 'hypnosis', price: 199000 }] };
const access = { userId: 'buyer', trackId: 'paid', status: 'active', orderId: 'order1' };

// In-memory Admin SDK substitute. Tests exercise handler decisions, not live data.
function setup(overrides = {}, env = ENV) {
  const data = new Map(Object.entries({
    'hypnosis_audios/paid': paidTrack, 'hypnosis_audios/free': freeTrack,
    'orders/order1': order, 'user_audios/buyer_paid': access,
    'users/admin': { role: 'admin', allowedModules: ['hypnosis'] },
    'users/limited': { role: 'admin', allowedModules: ['students'] },
    'users/affiliate': { role: 'admin', allowedModules: ['affiliates'] },
    ...overrides,
  }).filter(([,value]) => value !== null));
  const snapshot = path => ({ id: path.split('/')[1], exists: data.has(path), data: () => data.get(path) });
  const collection = name => ({
    doc(id) {
      const path = `${name}/${id}`;
      return { path, get: async () => snapshot(path), delete: async () => data.delete(path),
        update: async value => { if (!data.has(path)) throw Error('missing'); data.set(path, { ...data.get(path), ...value }); } };
    },
    get: async () => ({ docs: [...data.keys()].filter(p => p.startsWith(name + '/')).map(snapshot) }),
    where(field, operator, value) { assert.equal(operator, '=='); return { get: async () => ({ docs:
      [...data.keys()].filter(p => p.startsWith(name + '/') && data.get(p)[field] === value).map(snapshot) }) }; },
  });
  const writes = () => {
    const pending = [];
    return { get: ref => ref.get(), set: (ref, value) => pending.push([ref.path, value]),
      commit: async () => { for (const [path,value] of pending) data.set(path,value); } };
  };
  const db = { collection, batch: writes, runTransaction: async fn => { const tx = writes(); await fn(tx); await tx.commit(); } };
  const fieldValue = { serverTimestamp: () => 123 };
  const calls = [];
  const handlers = createHypnosisHandlers({ getDb: () => db, getEnv: () => env, fieldValue,
    verifyUser: async request => { if (!request.user) throw Object.assign(Error('auth'), { status: 401 }); return request.user; },
    json: data => data,
    signPlayback: async (...args) => { calls.push(args); return createBunnyEmbedPlayback(...args); },
  });
  return { handlers, data, calls, db, fieldValue };
}
const request = (payload = {}, uid = 'buyer') => ({ request: { user: uid ? { uid } : null, json: async () => payload } });
const rejectsStatus = (promise, status) => assert.rejects(promise, error => error.status === status);

test('public catalog allowlist strips audio URLs, IDs, provider and unexpected nested data', async () => {
  const source = { ...paidTrack, audioUrl: 'https://private.example/audio', secret: 'secret',
    howToUse: [{ step: 'a', desc: 'b', audioUrl: 'secret' }], effects: [{ audioUrl: 'secret' }, 'relax'] };
  const sanitized = publicHypnosisTrack('paid', source);
  assert.equal(sanitized.price, 199000);
  assert.equal(JSON.stringify(sanitized).includes('secret'), false);
  assert.equal(sanitized.audioUrl, undefined);
  assert.equal(sanitized.videoId, undefined);
  assert.equal(sanitized.audioProvider, undefined);
  const { handlers } = setup({ 'hypnosis_audios/draft': { ...paidTrack, isPublished: false } });
  assert.deepEqual((await handlers.catalog()).tracks.map(t => t.id), ['paid', 'free']);
});

test('media parsing rejects direct paid URLs, malicious hosts, credentials and another library', () => {
  for (const raw of ['https://example.com/paid.mp3', `https://iframe.mediadelivery.net.evil.test/embed/738609/${VIDEO}`,
    `https://evil.test/?iframe.mediadelivery.net/embed/738609/${VIDEO}`, `https://iframe.mediadelivery.net/embed/123/${VIDEO}`,
    `https://u:p@iframe.mediadelivery.net/embed/738609/${VIDEO}`, 'javascript:alert(1)', 'http://example.com/a.mp3']) {
    assert.equal(hypnosisMedia({ ...paidTrack, audioUrl: raw }, '738609'), null);
  }
  assert.deepEqual(hypnosisMedia({ ...paidTrack, audioUrl: `https://iframe.mediadelivery.net/embed/738609/${VIDEO}?token=stale` }, '738609'), { provider: 'bunny', videoId: VIDEO });
});

test('anonymous callers cannot claim, list library or play', async () => {
  const { handlers, calls } = setup();
  await rejectsStatus(handlers.claim(request({ trackId: 'free' }, null)), 401);
  await rejectsStatus(handlers.library(request({}, null)), 401);
  await rejectsStatus(handlers.playback(request({ trackId: 'paid' }, null)), 401);
  assert.equal(calls.length, 0);
});

test('claim checks server price class, ignores client isFree/price/owner and grants only the caller', async () => {
  const { handlers, data } = setup();
  await rejectsStatus(handlers.claim(request({ trackId: 'paid', isFree: true, price: 0 })), 403);
  await handlers.claim(request({ trackId: 'free', userId: 'victim' }));
  assert.equal(data.get('user_audios/buyer_free').userId, 'buyer');
  assert.equal(data.has('user_audios/victim_free'), false);
  const result = await handlers.playback(request({ trackId: 'free' }));
  assert.equal(result.playbackUrl, freeTrack.audioUrl);
});

test('unpaid access, forged order references, refunded orders and revoked/expired access are denied', async () => {
  for (const changes of [
    { 'user_audios/buyer_paid': null },
    { 'user_audios/buyer_paid': { ...access, orderId: 'missing' } },
    { 'orders/order1': { ...order, userId: 'victim' } },
    { 'orders/order1': { ...order, status: 'pending' } },
    { 'orders/order1': { ...order, status: 'cancelled' } },
    { 'orders/order1': { ...order, items: [{ id: 'other', productType: 'hypnosis' }] } },
    { 'user_audios/buyer_paid': { ...access, status: 'revoked' } },
    { 'user_audios/buyer_paid': { ...access, expiresAt: 1 } },
    { 'user_audios/buyer_paid': { ...access, isFree: true, orderId: '' } },
  ]) {
    const { handlers, calls } = setup(changes);
    await rejectsStatus(handlers.playback(request({ trackId: 'paid' })), 403);
    assert.deepEqual((await handlers.library(request())).trackIds, []);
    assert.equal(calls.length, 0);
  }
});

test('a legitimate purchase returns only a signed expiring URL for the stored video', async () => {
  const { handlers, calls } = setup();
  const result = await handlers.playback(request({ trackId: 'paid', videoId: 'attacker-video' }));
  const url = new URL(result.playbackUrl);
  assert.equal(url.pathname, `/embed/738609/${VIDEO}`);
  assert.match(url.searchParams.get('token'), /^[0-9a-f]{64}$/);
  assert(result.expires > Date.now()/1000 && result.expires <= Date.now()/1000 + 901);
  assert.equal(calls.length, 1);
  assert.deepEqual((await handlers.library(request())).trackIds, ['paid']);
});

test('missing Bunny security confirmation fails closed for playback and sale availability', async () => {
  const { handlers, calls } = setup({}, { ...ENV, HYPNOSIS_BUNNY_SECURITY_CONFIRMED: '' });
  await rejectsStatus(handlers.playback(request({ trackId: 'paid' })), 503);
  assert.equal((await handlers.catalog()).tracks.find(t => t.id === 'paid').available, false);
  assert.equal(calls.length, 0);
});

test('existing direct paid media cannot be played even after payment', async () => {
  const { handlers } = setup({ 'hypnosis_audios/paid': { ...paidTrack, audioProvider: 'url', audioUrl: 'https://example.com/paid.mp3' } });
  await rejectsStatus(handlers.playback(request({ trackId: 'paid' })), 409);
});

test('limited admins cannot save/delete/preview or modify commissions without the module', async () => {
  const { handlers } = setup();
  for (const action of ['save', 'delete', 'preview', 'commission']) {
    await rejectsStatus(handlers.adminPost(request({ action, trackId: 'paid', track: paidTrack }, 'limited')), 403);
  }
  await rejectsStatus(handlers.adminPost(request({ action: 'delete', trackId: 'paid' }, 'affiliate')), 403);
  assert.equal(hasHypnosisAdminModule({ uid: 'a', email: 'mongcoaching@gmail.com', email_verified: false }, {}, 'hypnosis'), false);
});

test('admin save keeps media private, allows drafts, rejects paid direct sources and preserves creation date', async () => {
  const { handlers, data } = setup();
  await handlers.adminPost(request({ action: 'save', trackId: 'new', track: { ...paidTrack, id: 'wrong', createdAt: 'forged', isPublished: true } }, 'admin'));
  assert.equal(data.get('hypnosis_audios/new').id, 'new');
  assert.equal(data.get('hypnosis_audios/new').createdAt, 123);
  assert.equal(data.get('hypnosis_audios/new').audioUrl, '');
  assert.equal(data.get('hypnosis_audios/new').videoId, VIDEO);
  await handlers.adminPost(request({ action: 'save', trackId: 'draft', track: { ...paidTrack, videoId: '' } }, 'admin'));
  assert.equal(data.get('hypnosis_audios/draft').isPublished, false);
  await rejectsStatus(handlers.adminPost(request({ action: 'save', trackId: 'unsafe', track: { ...paidTrack, audioUrl: 'https://example.com/paid.mp3' } }, 'admin')), 400);
  await handlers.adminPost(request({ action: 'save', createOnly: true, trackId: 'new', track: { ...paidTrack, title: 'overwrite' } }, 'admin'));
  assert.equal(data.get('hypnosis_audios/new').title, 'Paid');
});

test('affiliate manager can change only commission fields', async () => {
  const { handlers, data } = setup();
  await handlers.adminPost(request({ action: 'commission', trackId: 'paid', data: { affiliateCommissionPercent: 20, isFree: true, price: 0, audioUrl: 'evil', title: 'evil' } }, 'affiliate'));
  assert.equal(data.get('hypnosis_audios/paid').isFree, false);
  assert.equal(data.get('hypnosis_audios/paid').price, paidTrack.price);
  assert.equal(data.get('hypnosis_audios/paid').title, 'Paid');
  assert.equal(data.get('hypnosis_audios/paid').affiliateCommissionPercent, 20);
});

test('mixed orders cannot turn a course item into hypnosis access', async () => {
  const mixed = { ...order, productType: 'hypnosis', items: [...order.items, { id: 'course1', productType: 'course' }] };
  assert.equal(orderGrantsHypnosis(mixed, 'buyer', 'course1'), false);
  const { db, fieldValue, data } = setup();
  await grantHypnosisOrderAccess({ db, fieldValue, order: mixed, orderId: 'order1' });
  assert.equal(data.has('user_audios/buyer_course1'), false);
  assert.equal(data.get('user_audios/buyer_paid').status, 'active');
});
