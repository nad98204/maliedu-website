import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { onRequest } from "../functions/api/_middleware.js";
import { onRequestPost } from "../functions/api/crm-leads.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const lead = {
  name: "  Khach Kiem Thu  ", phone: "8497 253 7633", source_key: "test_ads_k55",
  course_k: "K55", batchName: "K55", cpSource: "facebook", cpCampaign: "test-campaign",
  landingPageSlug: "dao-tao/khoi-thong-dong-tien", fbEventValue: 0,
};
const context = (body = { nodePath: "funnels/ads", payload: lead }) => ({
  request: new Request("https://example.test/api/crm-leads", {
    method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }),
  env: {},
});

test("registration reaches CRM once while the Firebase hosting backend is unavailable", async () => {
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app/funnels/ads.json");
    assert.equal(options.method, "POST");
    const data = JSON.parse(options.body);
    assert.equal(data.phone, "84972537633");
    assert.equal(data.name, "Khach Kiem Thu");
    for (const key of ["source_key", "course_k", "batchName", "cpSource", "cpCampaign", "landingPageSlug", "fbEventValue"]) {
      assert.equal(data[key], lead[key]);
    }
    assert.equal(data.status, "NEW");
    assert.equal(data.createdVia, "landing");
    assert.equal(data.clientIp, "192.0.2.1");
    assert.ok(Number.isFinite(Date.parse(data.createdAt)));
    writes++;
    return Response.json({ name: "mock-lead" });
  };
  const ctx = context();
  ctx.next = () => onRequestPost(ctx);
  const response = await onRequest(ctx);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, id: "mock-lead" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(writes, 1);
});

test("all supported funnels including brand use their exact CRM path", async () => {
  for (const funnel of ["ads", "leader", "brand", "thuonghieu"]) {
    globalThis.fetch = async url => {
      assert.ok(url.endsWith(`/funnels/${funnel}.json`));
      return Response.json({ name: "mock-id" });
    };
    assert.equal((await onRequestPost(context({ nodePath: `funnels/${funnel}`, payload: lead }))).status, 200);
  }
});

test("rejects invalid contacts, paths, JSON and oversized requests before writing", async () => {
  globalThis.fetch = async () => { assert.fail("invalid requests must not reach CRM"); };
  for (const body of [
    "{", { nodePath: "security", payload: lead }, { nodePath: "funnels/ads", payload: [] },
    ...[{ phone: "123" }, { phone: "abcd123456789" }, { name: "x" }, { name: "x".repeat(121) },
      { source_key: "" }, { source_key: "../security" }, { email: "invalid" }]
      .map(overrides => ({ nodePath: "funnels/ads", payload: { ...lead, ...overrides } })),
  ]) {
    assert.equal((await onRequestPost(context(body))).status, 400);
  }
  assert.equal((await onRequestPost(context("x".repeat(32769)))).status, 413);
});

test("server controls timestamps, state, IP and field allowlist", async () => {
  globalThis.fetch = async (_, options) => {
    const data = JSON.parse(options.body);
    assert.equal(data.status, "NEW");
    assert.equal(data.createdVia, "landing");
    assert.notEqual(data.createdAt, "spoofed");
    assert.equal(data.clientIp, "192.0.2.1");
    assert.equal(data.admin, undefined);
    assert.equal(data.note.length, 2000);
    return Response.json({ name: "mock-id" });
  };
  const response = await onRequestPost(context({ nodePath: "funnels/ads", payload: {
    ...lead, status: "WON", createdVia: "admin", createdAt: "spoofed", clientIp: "spoofed",
    admin: true, note: "x".repeat(2500),
  } }));
  assert.equal(response.status, 200);
});

test("failed or ambiguous CRM writes never report success and are never retried", async () => {
  for (const failure of [() => Response.json({ error: "Permission denied" }, { status: 401 }),
    () => Response.json({}), () => new Response("not json"), () => { throw Error("network error"); }]) {
    let attempts = 0;
    globalThis.fetch = async () => { attempts++; return failure(); };
    const response = await onRequestPost(context());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).success, undefined);
    assert.equal(attempts, 1);
  }
});

test("other APIs retain the existing Firebase proxy and GET cannot read CRM", async () => {
  const result = await onRequest({ request: new Request("https://example.test/api/crm-leads") });
  assert.equal(result.status, 405);
  globalThis.fetch = async request => {
    assert.equal(request.url, "https://maliedu-web.web.app/api/orders");
    return Response.json({ error: "upstream unavailable" }, { status: 503 });
  };
  const result2 = await onRequest({ request: new Request("https://example.test/api/orders") });
  assert.equal(result2.status, 503);
});
