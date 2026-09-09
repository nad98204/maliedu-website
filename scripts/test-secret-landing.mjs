import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { buildSecretLead, normalizeSecretPhone, SECRET_LANDING_PATH, validateSecretContact } from "../src/landing-templates/bi-mat-luat-hap-dan/config.js";
import { isSecretLandingPath } from "../src/styles/landingPaths.js";
import { isFunnelLandingPath } from "../src/utils/funnelLandingPaths.js";

const config = { landingPageId: "test-secret", active_source_key: "1768973703248_ads_2_k55", course_k: "K55", targetFunnel: "ADS", is_maintenance: false };
const contact = { name: "  Khách Kiểm Thử  ", phone: "+84 912 345 678" };
const input = { contact, config, url: `https://luathapdan.vn${SECRET_LANDING_PATH}?utm_source=facebook&utm_medium=cpc&utm_campaign=loa-k55&utm_content=video-1&utm_term=audience-2` };
const originalFetch = globalThis.fetch;
let server, submitToCRM, resolveConfig;
before(async () => {
  server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: "custom" });
  ({ submitToCRM } = await server.ssrLoadModule("/src/services/crmService.js"));
  ({ resolveKhoiThongLandingConfig: resolveConfig } = await server.ssrLoadModule("/src/landing-templates/khoi-thong-dong-tien/landingConfig.js"));
});
after(async () => { globalThis.fetch = originalFetch; await server?.close(); });

test("accepts Vietnamese mobile numbers including +84 and rejects malformed contacts", () => {
  assert.equal(normalizeSecretPhone(contact.phone), "0912345678");
  assert.equal(normalizeSecretPhone("84912345678"), "0912345678");
  assert.deepEqual(validateSecretContact(contact), {});
  for (const phone of ["123", "0000000000", "09123456789", "091234567x", "+1 555 123 4567"]) assert.ok(validateSecretContact({ ...contact, phone }).phone);
  assert.ok(validateSecretContact({ ...contact, name: " " }).name);
});

test("preserves the distinct source, current K, landing attribution and all ad UTMs", () => {
  const lead = buildSecretLead({ ...input, browserData: { fbp: "test-fbp", fbc: "test-fbc" }, eventIds: { lead: "lead-id", registration: "registration-id" } });
  assert.equal(lead.source_key, config.active_source_key);
  assert.equal(lead.course_k, "K55");
  assert.equal(lead.phone, "0912345678");
  assert.equal(lead.name, "Khách Kiểm Thử");
  assert.equal(lead.landingPageSlug, SECRET_LANDING_PATH.slice(1));
  assert.deepEqual([lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content, lead.utm_term], ["facebook", "cpc", "loa-k55", "video-1", "audience-2"]);
  assert.equal(lead.fbc, "test-fbc");
  assert.equal(lead.lead_event_id, "lead-id");
  assert.equal(lead.meta_event_id, "registration-id");
  assert.equal(lead.fbEventValue, 0, "free registrations never claim revenue");
});

test("fails closed for missing configuration and maintenance instead of using a stale K", () => {
  for (const invalid of [null, {}, { ...config, landingPageId: "" }, { ...config, active_source_key: "" }, { ...config, course_k: "" }, { ...config, is_maintenance: true }]) {
    assert.throws(() => buildSecretLead({ ...input, config: invalid }));
  }
  const updated = buildSecretLead({ ...input, config: { ...config, course_k: "K56", active_source_key: "1768973703248_ads_2_k56" } });
  assert.equal(updated.source_key, "1768973703248_ads_2_k56");
  assert.equal(updated.course_k, "K56");
});

test("sends the existing CRM API contract to funnels/ads without losing campaign data", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/crm-leads", "test cannot write to a live CRM");
    request = JSON.parse(options.body);
    return new Response(JSON.stringify({ success: true, id: "mock-lead" }), { status: 200 });
  };
  const result = await submitToCRM(buildSecretLead(input));
  assert.equal(result.id, "mock-lead");
  assert.equal(request.nodePath, "funnels/ads");
  assert.equal(request.payload.createdVia, "landing");
  assert.equal(request.payload.source_key, config.active_source_key);
  assert.equal(request.payload.batchName, "K55");
  assert.equal(request.payload.cpContent, "video-1");
  assert.equal(request.payload.cpTerm, "audience-2");
  assert.equal(request.payload.assigned_to, "", "CRM remains responsible for Sale assignment");
  assert.equal(request.payload.landingPageId, "test-secret");
});

test("rejects API failures without reporting a successful registration", async () => {
  let writes = 0;
  globalThis.fetch = async (url) => {
    assert.equal(url, "/api/crm-leads");
    writes++;
    return new Response(JSON.stringify({ error: "Mock CRM unavailable" }), { status: 503 });
  };
  await assert.rejects(() => submitToCRM(buildSecretLead(input)), /Không thể gửi đăng ký/);
  assert.equal(writes, 1);
});

test("resolves the shared schedule and Zalo; refresh reads a changed admin K and maintenance flag", async () => {
  let currentK = "K55";
  let maintenance = false;
  const encode = fields => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, typeof v === "boolean" ? { booleanValue: v } : { stringValue: v }]));
  globalThis.fetch = async (url) => {
    assert.ok(String(url).startsWith("https://firestore.googleapis.com/"));
    const isQuery = String(url).endsWith(":runQuery");
    const fields = isQuery
      ? { active_source_key: `1768973703248_ads_2_${currentK.toLowerCase()}`, course_k: currentK, is_maintenance: maintenance, thankYouZaloLink: "https://zalo.me/g/old-test-group" }
      : { eventStart: "2027-09-11T20:00:00+07:00", ctaScheduleLabel: "11–14/09 · 20h", thankYouZaloLink: "https://zalo.me/g/shared-test-group", thankYouCountdownSeconds: "300" };
    const doc = { name: `projects/test/databases/(default)/documents/${isQuery ? "landing_pages/test-secret" : "public_settings/khoi_thong_dong_tien_schedule"}`, fields: encode(fields) };
    return new Response(JSON.stringify(isQuery ? [{ document: doc }] : doc), { status: 200 });
  };
  const first = await resolveConfig({ path: SECRET_LANDING_PATH, fresh: true });
  assert.equal(first.zaloLink, "https://zalo.me/g/shared-test-group");
  assert.equal(first.ctaScheduleLabel, "11–14/09 · 20h");
  assert.equal(first.landingPageId, "test-secret");
  currentK = "K56";
  maintenance = true;
  const latest = await resolveConfig({ path: SECRET_LANDING_PATH, fresh: true });
  assert.equal(latest.course_k, "K56");
  assert.equal(latest.active_source_key, "1768973703248_ads_2_k56");
  assert.throws(() => buildSecretLead({ ...input, config: latest }), /tạm ngưng/);
});

test("new routes reuse the original landing styles and prerender their own hero and form", async () => {
  const original = await readFile("dist/dao-tao/khoi-thong-dong-tien.html", "utf8");
  const sharedStyles = original.match(/<style data-landing-css>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(sharedStyles);
  assert.ok(!original.includes("nhưng DÒNG TIỀN VẪN CHƯA THAY ĐỔI?"));
  for (const path of [SECRET_LANDING_PATH, "/landing/bi-mat-luat-hap-dan"]) {
    assert.ok(isSecretLandingPath(path));
    assert.ok(isFunnelLandingPath(path));
    const html = await readFile(`dist${path}.html`, "utf8");
    assert.equal(html.match(/<style data-landing-css>([\s\S]*?)<\/style>/)?.[1], sharedStyles);
    assert.ok(html.includes('name="landing-hydrated-html"'));
    assert.ok(html.includes('id="secret-name"'));
    assert.ok(html.includes('id="secret-phone"'));
    assert.ok(html.includes("Luật Hấp Dẫn"));
    assert.ok(html.includes("nhưng DÒNG TIỀN VẪN CHƯA THAY ĐỔI?"));
    assert.ok(html.includes('imagesrcset="/assets/landing/khoi-thong-dong-tien/'));
    assert.ok(!html.includes("secret-book"));
  }
});
