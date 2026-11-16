import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManagedLanding } from '../workers/lead-intake/landingConfig.js';

const lead = { nodePath: 'funnels/ads', payload: { landingPageId: 'main-landing', landingPageSlug: 'dao-tao/khoi-thong-dong-tien', source_key: 'ads_k58', course_k: 'K58', batchName: 'K58' } };
const document = { slug: '/dao-tao/khoi-thong-dong-tien', active_source_key: 'ads_k58', course_k: 'K58', targetFunnel: 'ADS' };
const options = data => ({ fetcher: async url => {
  assert.match(String(url), /landing_pages\/main-landing/);
  return Response.json({ fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === 'boolean' ? { booleanValue: value } : { stringValue: value }])) });
} });
test('managed intake accepts matching current configuration and rejects stale K, wrong funnel and maintenance', async () => {
  await validateManagedLanding(lead, options(document));
  for (const data of [{ ...document, course_k: 'K59', active_source_key: 'ads_k59' }, { ...document, targetFunnel: 'LEADER' }, { ...document, is_maintenance: true }]) await assert.rejects(validateManagedLanding(lead, options(data)), error => error.status === 409);
  await assert.rejects(validateManagedLanding(lead, { fetcher: async () => { throw new Error('outage'); } }), error => error.status === 503);
});
test('non-K website events keep their batch contract without a managed-landing lookup', async () => {
  await validateManagedLanding({ nodePath: 'funnels/ads', payload: { source_key: 'chinh_phuc_muc_tieu_web', batchName: 'event-1', landingPageSlug: '/khoa-hoc/chinh-phuc-muc-tieu' } }, { fetcher: () => assert.fail('Must not query K configuration') });
});
