import assert from "node:assert/strict";
import fs from "node:fs/promises";
import puppeteer from "puppeteer";

const origin = process.env.LANDING_TEST_ORIGIN || "http://127.0.0.1:4173";
const browser = await puppeteer.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const results = [];
await fs.mkdir(".cache/landing-tests", { recursive: true });

async function testFunnel(funnel, width = 412) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width, height: 915, deviceScaleFactor: 1 });
  const errors = [];
  const requests = [];
  const leads = [];
  let rejectLead = true;
  const path = `/dao-tao/khoi-thong-dong-tien${funnel === "ads" ? "" : `-${funnel}`}`;
  page.on("pageerror", error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on("request", async request => {
    const url = new URL(request.url());
    requests.push(request.url());
    const json = (body, status = 200) => request.respond({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) });
    if (url.pathname === "/api/crm-leads") {
      leads.push(JSON.parse(request.postData()));
      return json(rejectLead ? { success: false, error: "Mock CRM unavailable" } : { success: true, id: "mock-lead-id" }, rejectLead ? 503 : 200);
    }
    if (url.hostname === "connect.facebook.net") return request.respond({ contentType: "application/javascript", body: `window.__pixelCalls = []; window.fbq.callMethod = function(){window.__pixelCalls.push(Array.from(arguments))}; window.fbq.queue.forEach(args => window.fbq.callMethod(...args)); window.fbq.queue = [];` });
    if (url.hostname === "firestore.googleapis.com") {
      if (request.method() === "OPTIONS") return request.respond({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,GET" } });
      const fields = Object.fromEntries(Object.entries({ fbPixel: "1526874981588150", course_k: "K41", sourceKey: "1768973703248", eventStart: "2027-09-05T20:00:00+07:00", ctaScheduleLabel: "05-06-07-08/09 – 20h00" }).map(([key, value]) => [key, { stringValue: value }]));
      const document = { name: `projects/test/databases/(default)/documents/landing_pages/${funnel}`, fields };
      return json(url.pathname.endsWith(":runQuery") ? [{ document }] : document);
    }
    if (url.origin === origin && !url.pathname.startsWith("/api/")) return request.continue();
    // Tests never write real CRM, CAPI, affiliate or analytics data.
    return json({});
  });
  await page.goto(`${origin}${path}?utm_source=perf-test&utm_campaign=lcp&fbclid=TEST_ONLY`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.querySelector('img[alt="Khơi Thông Dòng Tiền"]')?.complete);
  assert.equal(await page.$$("iframe").then(items => items.length), 0, "video must wait for click");
  assert(!requests.some(url => /assets\/firebase-|assets\/index\.esm-/.test(url)), "Firebase must not load on initial viewport");
  assert(!requests.some(url => /hero-title-v2-.*\.webp/.test(url)), "AVIF browsers must not download a duplicate WebP hero");
  const before = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, calls: window.__pixelCalls || [] }));
  assert(before.width <= before.viewport, "no horizontal overflow");
  if (funnel !== "thuonghieu") assert.equal(before.calls.filter(call => call[2] === "PageView").length, 1);
  else assert.equal(before.calls.length, 0, "brand funnel must keep tracking disabled");
  await page.screenshot({ path: `.cache/landing-tests/${funnel}-${width}.png` });
  for (const button of await page.$$('button[aria-label="Phát video Bánh xe cuộc đời"]')) {
    if (await button.boundingBox()) { await button.click(); break; }
  }
  assert.equal(await page.$$("iframe").then(items => items.length), 1);
  await page.click('a[href="#dang-ky"]');
  await page.waitForSelector('input[placeholder="Nhập họ và tên đầy đủ"]', { visible: true });
  await page.type('input[placeholder="Nhập họ và tên đầy đủ"]', "Kiểm thử hiệu suất");
  await page.type('input[type="tel"]', "0900000000");
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.body.innerText.includes("Không thể gửi đăng ký về CRM"), { timeout: 8000 }).catch(async error => {
    console.log(JSON.stringify({ funnel, errors, leads, form: await page.$eval("form", form => ({ text: form.innerText, inputs: [...form.querySelectorAll("input")].map(input => ({ type: input.type, value: input.value, valid: input.validity.valid, validation: input.validationMessage })) })) }));
    throw error;
  });
  assert.equal(new URL(page.url()).pathname, path, "CRM failure must keep form on landing");
  rejectLead = false;
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => location.pathname === "/cam-on-khoi-thong");
  await page.waitForFunction(() => document.body.innerText.includes("ĐĂNG KÝ") || document.body.innerText.includes("Đăng ký"));
  const submitted = leads.at(-1);
  assert.equal(submitted.nodePath, `funnels/${funnel === "thuonghieu" ? "brand" : funnel}`);
  assert.equal(submitted.payload.cpSource, "perf-test");
  assert.equal(submitted.payload.cpCampaign, "lcp");
  assert.equal(submitted.payload.phone, "0900000000");
  assert.equal(submitted.payload.source_key, funnel === "thuonghieu" ? "thuonghieu_web_k41" : "1768973703248_k41");
  assert.equal(submitted.payload.batchName, "K41");
  if (funnel !== "thuonghieu") await page.waitForFunction(() => window.__pixelCalls?.some(call => call[2] === "CompleteRegistration"));
  const calls = await page.evaluate(() => window.__pixelCalls || []);
  if (funnel !== "thuonghieu") {
    assert.equal(calls.filter(call => call[2] === "InitiateCheckout").length, 1);
    assert(submitted.payload.fbc.endsWith(".TEST_ONLY"), "fbclid attribution must reach CRM");
    assert.equal(calls.filter(call => call[2] === "Lead").length, 1);
    assert.equal(calls.filter(call => call[2] === "CompleteRegistration").length, 1);
    assert.equal(calls.find(call => call[2] === "Lead")[4].eventID, submitted.payload.lead_event_id);
    assert.equal(calls.find(call => call[2] === "CompleteRegistration")[4].eventID, submitted.payload.meta_event_id);
  } else assert.equal(calls.length, 0);
  assert.deepEqual(errors, [], "no hydration/runtime errors");
  results.push({ funnel, width, passed: true, crm: "mocked", pixel: "mocked", checks: ["hydration", "video-on-click", "CTA-to-form", "CRM-error-retry", "CRM-payload", "UTM", "Meta-event-dedup"] });
  await context.close();
}

async function testPrerender() {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setJavaScriptEnabled(false);
  for (const width of [412, 1440]) {
    await page.setViewport({ width, height: 915 });
    await page.goto(`${origin}/dao-tao/khoi-thong-dong-tien`, { waitUntil: "networkidle0" });
    const hero = await page.$('img[alt="Khơi Thông Dòng Tiền"]');
    assert((await hero.boundingBox())?.height > 100, "hero must paint without JavaScript");
    await page.screenshot({ path: `.cache/landing-tests/prerender-${width}.png` });
  }
  results.push({ test: "hero-visible-without-javascript", widths: [412, 1440], passed: true });
  await context.close();
}

try {
  await testPrerender();
  await testFunnel("ads");
  await testFunnel("thuonghieu");
  await testFunnel("ads", 1440);
  console.log(JSON.stringify(results, null, 2));
  await fs.writeFile(".cache/landing-tests/results.json", JSON.stringify(results, null, 2));
} finally { await browser.close(); }
