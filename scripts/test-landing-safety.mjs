import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { getLandingHealth, assertExpectedRouting, assertRoutingBatch } from '../functions/_lib/landingHealth.js';
import { assertLandingRegistrationConfig } from '../src/utils/landingRegistrationConfig.js';
import { createAdminLandingHandlers } from '../functions/_lib/adminLandings.js';
import { TestDb } from '../functions/_lib/affiliateTestDb.js';

const originalFetch = globalThis.fetch;
let server, publicReader;
before(async () => {
  server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  publicReader = await server.ssrLoadModule('/src/utils/publicFirestore.js');
});
afterEach(() => { globalThis.fetch = originalFetch; });
after(async () => { await server.close(); });

test('registration rejects missing, inconsistent and maintenance config; never invents K41', () => {
  const valid = { landingPageId: 'main', active_source_key: 'ads_k58', course_k: 'K58', targetFunnel: 'ADS' };
  assert.equal(assertLandingRegistrationConfig(valid), valid);
  for (const value of [null, {}, { ...valid, course_k: '' }, { ...valid, active_source_key: 'ads_k57' }, { ...valid, is_maintenance: true }, { ...valid, targetFunnel: 'unknown' }]) assert.throws(() => assertLandingRegistrationConfig(value));
});

test('submit-time fresh reads replace cached K and fail on outage instead of reusing stale configuration', async () => {
  let batch = 'K58';
  globalThis.fetch = async () => Response.json({ name: 'projects/test/databases/(default)/documents/landing_pages/fresh-test', fields: { course_k: { stringValue: batch } } });
  const read = fresh => publicReader.getPublicFirestoreDocument('landing_pages', 'fresh-test', ['course_k'], { fresh });
  assert.equal((await read(false)).course_k, 'K58');
  batch = 'K59';
  assert.equal((await read(true)).course_k, 'K59');
  globalThis.fetch = async () => { throw new Error('Network outage'); };
  await assert.rejects(read(true), /Network outage/);
});

test('mapping health finds duplicate owners, source/K and target-funnel mismatches', () => {
  const landing = { id: 'main', active_source_key: 'ads_k58', course_k: 'K58', targetFunnel: 'ADS' };
  assert.equal(getLandingHealth([landing], { ads_k58: { landingPageId: 'main', targetK: 'K58', targetFunnel: 'ADS' } }).healthy, 1);
  const health = getLandingHealth([landing, { ...landing, id: 'other' }], { ads_k58: { landingPageId: 'wrong', targetK: 'K57', targetFunnel: 'LEADER' } });
  assert.equal(health.healthy, 0);
  assert.ok(health.byId.main.issues.some(issue => issue.code === 'duplicate'));
  assert.throws(() => assertRoutingBatch('ads_k57', 'K58'));
  assert.throws(() => assertExpectedRouting(landing, { expectedCourseK: 'K57' }), error => error.status === 409);
  assert.doesNotThrow(() => assertExpectedRouting({ ...landing, funnel_type: 'organic' }, { expectedFunnel: 'organic' }));
});

test('backend transaction rejects stale edits and commits matching landing/source updates together', async () => {
  const db = new TestDb().seed('landing_pages/main', { name: 'Main', slug: '/main', active_source_key: 'ads_k58', course_k: 'K58', targetFunnel: 'ADS' })
    .seed('source_configs/ads_k58', { landingPageId: 'main', targetK: 'K58', targetFunnel: 'ADS', targetCourseId: 'course' });
  const handlers = createAdminLandingHandlers({ createJsonResponse: value => value, getCrmFirestore: () => db });
  const update = { landingId: 'main', sourceKey: 'ads_k59', courseK: 'K59', funnelType: 'ads', expectedSourceKey: 'ads_k58', expectedCourseK: 'K57' };
  const request = updates => new Request('https://example.test/api/admin/landings/routing', { method: 'POST', body: JSON.stringify({ updates }) });
  await assert.rejects(handlers.updateRouting({ request: request([update]), adminUser: { uid: 'admin' } }), error => error.status === 409);
  assert.equal(db.read('landing_pages/main').course_k, 'K58');
  await handlers.updateRouting({ request: request([{ ...update, expectedCourseK: 'K58' }]), adminUser: { uid: 'admin' } });
  assert.equal(db.read('landing_pages/main').course_k, 'K59');
  assert.equal(db.read('source_configs/ads_k59').targetK, 'K59');
});
