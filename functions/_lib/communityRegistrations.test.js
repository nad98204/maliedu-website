import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TestDb, testFieldValue } from './affiliateTestDb.js';
import { createCommunityRegistrationHandlers, GRATITUDE_COURSE, normalizeCommunityPhone, registrationKey } from './communityRegistrations.js';

const payload = { courseId: GRATITUDE_COURSE.id, name: 'Học viên thử nghiệm', phone: '+84 912 345 678', email: '', consent: true };
const path = 'community_courses/' + GRATITUDE_COURSE.id;
const setup = () => {
  const db = new TestDb();
  const handlers = createCommunityRegistrationHandlers({ getDb: () => db, fieldValue: testFieldValue,
    json: (body, status = 200, headers = {}) => Response.json(body, { status, headers }) });
  return { db, ...handlers };
};
const req = (body = payload) => ({ request: new Request('https://example.test/api/community-registrations', { method: 'POST', body: JSON.stringify(body) }) });
const admin = { uid: 'owner', email: 'mongcoaching@gmail.com', email_verified: true };
const listReq = (adminUser = admin, query = '') => ({ adminUser, request: new Request('https://example.test/api/admin/community-registrations' + query) });

test('the landing and server agree on course identity and Zalo link', async () => {
  const config = JSON.parse(await readFile(new URL('../../src/landing-templates/danh-thuc-long-biet-on/config.json', import.meta.url), 'utf8'));
  assert.equal(config.courseId, GRATITUDE_COURSE.id);
  assert.equal(config.name, GRATITUDE_COURSE.name);
  assert.equal(config.zaloUrl, GRATITUDE_COURSE.zaloUrl);
  assert.equal(config.startDate, GRATITUDE_COURSE.startDate);
});
test('normalizes Vietnamese mobile numbers and rejects invalid numbers', () => {
  for (const value of ['0912345678', '84912345678', '+84 912 345 678', '0912.345.678']) assert.equal(normalizeCommunityPhone(value), '0912345678');
  for (const value of ['123456', '0212345678', '+1 912345678', 'a0912345678', null]) assert.equal(normalizeCommunityPhone(value), '');
});
test('persists a free course and registration atomically in the website database', async () => {
  const { db, register } = setup();
  const response = await register(req({ ...payload, utm: { utm_source: 'facebook', unknown: 'ignore' }, pagePath: '/dao-tao/21-ngay-long-biet-on?private=discard' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { success: true, courseId: GRATITUDE_COURSE.id, zaloUrl: GRATITUDE_COURSE.zaloUrl });
  const saved = db.read(path + '/registrations/' + registrationKey('0912345678'));
  assert.equal(saved.phone, '0912345678'); assert.equal(saved.name, payload.name);
  assert.equal(saved.pagePath, '/dao-tao/21-ngay-long-biet-on');
  assert.equal(saved.utm.utm_source, 'facebook'); assert.equal(saved.utm.unknown, undefined);
  assert.equal(db.read(path).registrationCount, 1); assert.equal(db.read(path).price, 0);
});
test('concurrent retries and alternate phone formats do not duplicate or overwrite personal data', async () => {
  const { db, register } = setup();
  await register(req());
  const responses = await Promise.all(Array.from({ length: 12 }, () => register(req({ ...payload, phone: '0912345678', name: 'Do not overwrite', email: 'changed@example.test' }))));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(db.read(path).registrationCount, 1);
  assert.equal(db.read(path + '/registrations/' + registrationKey('0912345678')).name, payload.name);
});
test('employee attribution is saved with the referral row and cannot be reassigned on retry', async () => {
  const { db, register } = setup();
  await register(req({ ...payload, referralCode: 'nhan-vien-a' }));
  const key = registrationKey('0912345678');
  assert.equal(db.read(path + '/registrations/' + key).referralCode, 'nhan-vien-a');
  assert.equal(db.read('leads/community_' + key).referralCode, 'nhan-vien-a');
  assert.equal(db.read('leads/community_' + key).courseId, GRATITUDE_COURSE.id);
  assert.equal(db.read('leads/community_' + key).source, GRATITUDE_COURSE.id);
  await register(req({ ...payload, referralCode: 'nhan-vien-b', name: 'Changed' }));
  assert.equal(db.read('leads/community_' + key).referralCode, 'nhan-vien-a');
  assert.equal(db.read('leads/community_' + key).name, payload.name);
  assert.equal(db.read(path).registrationCount, 1);
});
test('direct registrations belong to the company and old registrations mirror their original data', async () => {
  const { db, register } = setup();
  await register(req());
  const key = registrationKey('0912345678');
  assert.equal(db.read('leads/community_' + key).referralCode, 'cong-ty');
  const legacy = setup();
  legacy.db.seed(path + '/registrations/' + key, { name: 'Original legacy name', phone: '0912345678', createdAt: new Date(1000), courseId: GRATITUDE_COURSE.id });
  legacy.db.seed(path, { registrationCount: 1 });
  await legacy.register(req({ ...payload, referralCode: 'new-employee' }));
  assert.equal(legacy.db.read('leads/community_' + key).name, 'Original legacy name');
  assert.equal(legacy.db.read('leads/community_' + key).referralCode, 'cong-ty');
  assert.equal(legacy.db.read(path).registrationCount, 1);
});
test('referral administrators can view this course without the separate community module', async () => {
  const { db, register, list } = setup();
  await register(req());
  db.seed('users/referral-staff', { role: 'admin', allowedModules: ['referral-customers'] });
  const result = await (await list(listReq({ uid: 'referral-staff' }))).json();
  assert.equal(result.registrations[0].referralCode, 'cong-ty');
});
test('rejects malformed forms, wrong course, missing consent and spam without writing', async () => {
  const { db, register } = setup();
  for (const body of [null, [], { ...payload, courseId: 'other' }, { ...payload, name: 'a' }, { ...payload, phone: '123' }, { ...payload, email: 'no-email' }, { ...payload, consent: false }, { ...payload, website: 'spam.test' }]) {
    await assert.rejects(register(req(body)), error => error.status === 400);
  }
  assert.equal(db.records.size, 0);
});
test('a failed database write never acknowledges registration success', async () => {
  const handlers = createCommunityRegistrationHandlers({ getDb: () => ({ collection: () => ({ doc: () => ({}) }), runTransaction: async () => { throw new Error('database offline'); } }), fieldValue: testFieldValue, json: () => assert.fail('must not acknowledge failed save') });
  await assert.rejects(handlers.register(req()), /database offline/);
});
test('only verified owner or admins with the dedicated module may read registrations', async () => {
  const { db, register, list } = setup();
  await register(req());
  await assert.rejects(list(listReq(null)), error => error.status === 401);
  await assert.rejects(list(listReq({ ...admin, email_verified: false })), error => error.status === 403);
  db.seed('users/staff', { role: 'admin', allowedModules: ['students'] });
  await assert.rejects(list(listReq({ uid: 'staff' })), error => error.status === 403);
  db.seed('users/staff', { role: 'admin', allowedModules: ['community-registrations'] });
  const response = await list(listReq({ uid: 'staff' }));
  const result = await response.json();
  assert.equal(result.registrations.length, 1); assert.equal(result.total, 1);
  assert.equal(result.registrations[0].phone, '0912345678');
});
test('admin pagination includes every registration without repetition and validates cursors', async () => {
  const { db, list } = setup();
  for (let i = 0; i < 205; i++) {
    const id = i.toString(16).padStart(64, '0');
    db.seed(path + '/registrations/' + id, { name: 'Học viên ' + i, phone: '0912345678', email: '', courseId: GRATITUDE_COURSE.id, courseName: GRATITUDE_COURSE.name, createdAt: new Date(100000 + i) });
  }
  db.seed(path, { registrationCount: 205 });
  const first = await (await list(listReq())).json();
  assert.equal(first.registrations.length, 200); assert.ok(first.nextCursor);
  const next = await (await list(listReq(admin, '?cursor=' + first.nextCursor))).json();
  assert.equal(next.registrations.length, 5); assert.equal(next.nextCursor, null);
  assert.equal(new Set([...first.registrations, ...next.registrations].map(row => row.id)).size, 205);
  await assert.rejects(list(listReq(admin, '?cursor=bad')), error => error.status === 400);
});
