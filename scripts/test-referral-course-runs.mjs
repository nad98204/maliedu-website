import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_REFERRAL_RUNS, GRATITUDE_REFERRAL_COURSE, getReferralCourseOptions, finishReferralRun, mergeReferralLeads, resolveReferralRun } from '../src/utils/referralCourseRuns.js';
import { createTestDb } from './helpers/intake-test-db.mjs';
import { parseLead } from '../workers/lead-intake/payload.js';
import { persistLead, listLeads, referralLead } from '../workers/lead-intake/store.js';
import { handleRequest } from '../workers/lead-intake/index.js';

const cutoff = Date.parse('2026-10-07T12:00:00+07:00');
const config = finishReferralRun(DEFAULT_REFERRAL_RUNS, 'chinh-phuc-muc-tieu', '10-11-12/10/2026', cutoff);

test('the 21-day course has its own path and never changes existing goal-run partitions', () => {
  const options = getReferralCourseOptions(config);
  assert.equal(options[0].id, GRATITUDE_REFERRAL_COURSE.id);
  assert.equal(options[0].path, '/dao-tao/21-ngay-long-biet-on');
  assert.equal(options.length, 3);
  assert.equal(config.runs.length, 2);
  assert.equal(resolveReferralRun({ courseId: GRATITUDE_REFERRAL_COURSE.id, createdAt: cutoff + 100 }, config), GRATITUDE_REFERRAL_COURSE.id);
  const link = new URL(options[0].path, 'https://example.test');
  link.searchParams.set('ref', 'employee-a');
  assert.equal(link.pathname, '/dao-tao/21-ngay-long-biet-on');
  const lead = { id: 'community_test', source: GRATITUDE_REFERRAL_COURSE.id, courseId: GRATITUDE_REFERRAL_COURSE.id, referralCode: 'employee-a', createdAt: cutoff + 100, status: 'new' };
  const merged = mergeReferralLeads([{ ...lead, status: 'contacted', note: 'Keep note' }], [lead], config);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].courseId, GRATITUDE_REFERRAL_COURSE.id);
  assert.equal(merged[0].source, GRATITUDE_REFERRAL_COURSE.id);
  assert.equal(merged[0].referralCode, 'employee-a');
  assert.equal(merged[0].status, 'contacted');
  assert.equal(merged[0].note, 'Keep note');
});

test('ending a run preserves its history and partitions registrations at the confirmed boundary', () => {
  assert.equal(DEFAULT_REFERRAL_RUNS.runs[0].status, 'active');
  assert.equal(config.runs[0].status, 'ended');
  assert.equal(config.runs[0].endsAt, cutoff);
  assert.equal(resolveReferralRun({ courseId: 'chinh-phuc-muc-tieu', createdAt: cutoff - 1 }, config), 'chinh-phuc-muc-tieu');
  assert.equal(resolveReferralRun({ courseId: 'chinh-phuc-muc-tieu', createdAt: cutoff }, config), config.activeRunId);
  assert.equal(resolveReferralRun({ courseId: config.activeRunId, createdAt: cutoff - 1 }, config), config.activeRunId);
  assert.throws(() => finishReferralRun(config, 'chinh-phuc-muc-tieu', 'Next', cutoff + 1));
  assert.throws(() => finishReferralRun(DEFAULT_REFERRAL_RUNS, 'chinh-phuc-muc-tieu', '', cutoff));
});

test('merging receipt IDs keeps employee attribution, existing notes/status and repeat customers across runs', () => {
  const history = [{ id: 'old', phone: '0901234567', source: 'chinh-phuc-muc-tieu', referralCode: 'tue-duc', createdAt: cutoff - 1 },
    { id: 'new', source: 'chinh-phuc-muc-tieu', note: 'Follow up', status: 'registered' }];
  const intake = [{ id: 'new', phone: '0901234567', source: 'chinh_phuc_muc_tieu_web', referralCode: 'tue-duc', courseId: config.activeRunId, createdAt: cutoff },
    { id: 'other', source: 'unrelated' }];
  const result = mergeReferralLeads(history, intake, config);
  assert.equal(result.length, 2);
  const current = result.find(lead => lead.id === 'new');
  assert.equal(current.referralCode, 'tue-duc');
  assert.equal(current.status, 'registered');
  assert.equal(current.note, 'Follow up');
  assert.equal(current.courseId, config.activeRunId);
  assert.equal(result.find(lead => lead.id === 'old').courseId, 'chinh-phuc-muc-tieu');
});

test('referral API rejects anonymous reads and exposes only the selected course attribution', async () => {
  const db = createTestDb();
  try {
    const response = await handleRequest(new Request('https://example.test/api/admin/referral-leads'), { LEAD_DB: db }, {});
    assert.equal(response.status, 401);
    for (const [source, id] of [['chinh_phuc_muc_tieu_web', 'a'.repeat(20)], ['other_source', 'b'.repeat(20)]]) {
      const request = new Request('https://example.test/api/crm-leads', { method: 'POST', body: JSON.stringify({
        nodePath: 'funnels/ads', submissionId: id, payload: { name: 'Test person', phone: '0901234567',
          source_key: source, landingPageId: config.activeRunId, referrer: 'tue-duc', courseName: '10-11-12/10', fbp: 'private-tracking' },
      }) });
      await persistLead(db, await parseLead(request));
    }
    const result = await listLeads(db, new URLSearchParams({ source: 'chinh_phuc_muc_tieu_web' }), referralLead);
    assert.equal(result.total, 1);
    assert.equal(result.leads[0].courseId, config.activeRunId);
    assert.equal(result.leads[0].referralCode, 'tue-duc');
    assert.equal(result.leads[0].fbp, undefined);
  } finally { db.close(); }
});
