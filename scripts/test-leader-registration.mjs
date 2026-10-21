import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

const origin = process.env.LANDING_TEST_ORIGIN || "http://127.0.0.1:4173";
const executablePath = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
const browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const route = "/dao-tao/khoi-thong-dong-tien-leader";
const dialog = "#leader-registration-dialog[open]";
const results = [];
await fs.mkdir(".cache/leader-registration", { recursive: true });

async function setup(width, height, { leader = true, hash = false } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errors = [];
  const leads = [];
  const control = { rejectLead: true };
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    const json = (body, status = 200) => request.respond({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) });
    if (url.pathname === "/api/crm-leads") {
      leads.push(JSON.parse(request.postData()));
      return json(control.rejectLead ? { success: false, error: "Mock CRM unavailable" } : { success: true, id: "popup-test-lead" }, control.rejectLead ? 503 : 200);
    }
    if (url.hostname === "connect.facebook.net") return request.respond({ contentType: "application/javascript", body: "window.__pixelCalls=[];window.fbq.callMethod=function(){window.__pixelCalls.push(Array.from(arguments))};window.fbq.queue.forEach(args=>window.fbq.callMethod(...args));window.fbq.queue=[];" });
    if (url.hostname === "firestore.googleapis.com") {
      if (request.method() === "OPTIONS") return request.respond({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST" } });
      const fields = Object.fromEntries(Object.entries({ fbPixel: "1526874981588150", course_k: "K41", eventStart: "2027-09-05T20:00:00+07:00" }).map(([key, value]) => [key, { stringValue: value }]));
      const document = { name: "projects/test/databases/(default)/documents/landing_pages/leader", fields };
      return json(url.pathname.endsWith(":runQuery") ? [{ document }] : document);
    }
    if (url.origin === origin && !url.pathname.startsWith("/api/")) return request.continue();
    // All external writes, analytics, CRM and affiliate requests are mocked.
    return json({});
  });
  const params = new URLSearchParams({ utm_source: "popup-test", utm_campaign: "leader-popup", fbclid: "TEST_ONLY" });
  if (leader) params.set("l", "vantruong");
  await page.goto(`${origin}${route}?${params}${hash ? "#dang-ky" : ""}`, { waitUntil: "networkidle0" });
  await page.waitForSelector('[data-registration-source="BannerChinh"]');
  return { page, context, errors, leads, control };
}

async function open(page, source = "BannerChinh") {
  const selector = `[data-registration-source="${source}"]`;
  await page.$eval(selector, (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.click(selector);
  await page.waitForSelector(`${dialog} form`, { visible: true });
  assert.equal(await page.evaluate(() => document.body.style.position), "fixed");
  assert(await page.$eval(dialog, (el) => el.contains(document.activeElement)), "focus enters dialog");
  return { selector, scrollY };
}

async function close(page, { selector, scrollY }, escape = false) {
  if (escape) await page.keyboard.press("Escape");
  else await page.click('[aria-label="Đóng form đăng ký"]');
  await page.waitForFunction(() => !document.querySelector("#leader-registration-dialog").open);
  assert(await page.evaluate((y) => Math.abs(window.scrollY - y) <= 2, scrollY), "closing restores page scroll");
  assert(await page.$eval(selector, (el) => document.activeElement === el), "focus returns to trigger");
  assert.notEqual(await page.evaluate(() => document.body.style.position), "fixed");
}

async function testPopup(width, height) {
  const { page, context, errors, leads, control } = await setup(width, height);
  assert.equal(await page.$("form"), null, "form waits for opening");
  assert.equal(await page.$(dialog), null, "popup starts closed");
  const initialUrl = page.url();
  let trigger = await open(page);
  assert.equal(page.url(), initialUrl, "opening does not change URL/UTM or jump to an anchor");
  await page.click(`${dialog} button[type="submit"]`);
  assert(await page.$(`${dialog} input[aria-invalid="true"]`), "missing fields show inline errors");
  assert.equal(leads.length, 0);
  await page.type(`${dialog} input[autocomplete="name"]`, "Kiểm thử popup");
  await page.type(`${dialog} input[type="tel"]`, "0900000000");
  await page.click(`${dialog} [role="group"][aria-label*="LUẬT HẤP DẪN"] button:last-child`);
  assert(await page.$eval(dialog, (el) => el.textContent.includes("Văn Trường")), "leader link keeps assigned owner");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert(await page.$eval(dialog, (el) => el.contains(document.activeElement)), "keyboard stays inside dialog");
  assert(await page.$eval(dialog, (el) => el.scrollWidth <= innerWidth), "popup fits viewport width");
  await page.screenshot({ path: `.cache/leader-registration/popup-${width}.png` });
  await close(page, trigger, true);

  await page.evaluate(() => window.dispatchEvent(new CustomEvent("khoi-thong:reveal-lazy-sections")));
  await page.waitForSelector('[data-registration-source="VideoHocVien"]');
  const sources = await page.$$eval('[data-registration-source]', (els) => [...new Set(els.map((el) => el.dataset.registrationSource))].filter((source) => source !== "LeaderSticky"));
  for (const source of sources) {
    trigger = await open(page, source);
    assert.equal(await page.$eval(`${dialog} input[autocomplete="name"]`, (el) => el.value), "Kiểm thử popup", "draft survives closing/reopening");
    await close(page, trigger);
  }
  assert(["BannerChinh", "PhanNoiDau", "DoiTuongPhuHop", "KetQuaHocVien", "CauChuyenNguoiSangLap", "VideoHocVien", "LeaderClosing"].every((source) => sources.includes(source)), `every visible section and closing CTA uses popup: ${sources.join(", ")}`);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  if (width < 1024) {
    await page.waitForSelector('[data-registration-source="LeaderSticky"]', { visible: true });
    trigger = await open(page, "LeaderSticky");
    await close(page, trigger);
  } else assert.equal(await page.$eval('[data-registration-source="LeaderSticky"]', (el) => !!el.getClientRects().length), false);

  trigger = await open(page, "LeaderClosing");
  await page.click(`${dialog} button[type="submit"]`);
  await page.waitForSelector(`${dialog} [role="alert"]`, { visible: true });
  assert.equal(new URL(page.url()).pathname, route, "failed CRM keeps popup on landing");
  assert.equal(await page.$eval(`${dialog} input[autocomplete="name"]`, (el) => el.value), "Kiểm thử popup");
  control.rejectLead = false;
  await page.click(`${dialog} button[type="submit"]`);
  await page.waitForFunction(() => location.pathname === "/cam-on-khoi-thong");
  await page.waitForFunction(() => document.body.style.position !== "fixed");
  assert.notEqual(await page.evaluate(() => document.body.style.position), "fixed", "navigation releases scroll lock");
  const submitted = leads.at(-1);
  assert.equal(submitted.nodePath, "funnels/leader");
  assert.equal(submitted.payload.source_key, "1768973783248_k41");
  assert.equal(submitted.payload.cpSource, "popup-test");
  assert.equal(submitted.payload.cpCampaign, "leader-popup");
  assert.equal(submitted.payload.assigned_to, "Văn Trường");
  assert.equal(submitted.payload.registered_loa, "CHƯA HỌC");
  assert.equal(submitted.payload.phone, "0900000000");
  await page.waitForFunction(() => window.__pixelCalls?.some((call) => call[2] === "CompleteRegistration"));
  const calls = await page.evaluate(() => window.__pixelCalls);
  assert.equal(calls.filter((call) => call[2] === "Lead").length, 1, "only accepted CRM creates a Lead");
  assert.equal(calls.find((call) => call[2] === "Lead")[4].eventID, submitted.payload.lead_event_id);
  assert.deepEqual(errors, [], "no runtime/hydration errors");
  results.push({ width, height, sources, passed: true });
  await context.close();
}

async function testOtherReferrerAndLegacyLink() {
  const { page, context, errors, leads, control } = await setup(390, 844, { leader: false, hash: true });
  await page.waitForSelector(`${dialog} form`, { visible: true });
  await page.type(`${dialog} input[autocomplete="name"]`, "Người học kiểm thử");
  await page.type(`${dialog} input[type="tel"]`, "0900000000");
  await page.click(`${dialog} [role="group"][aria-label*="GIỚI THIỆU"] button:last-child`);
  await page.click(`${dialog} [role="group"][aria-label*="LUẬT HẤP DẪN"] button:first-child`);
  await page.click(`${dialog} button[type="submit"]`);
  assert.equal(leads.length, 0, "other referrer requires a name");
  assert(await page.$(`${dialog} input[aria-invalid="true"]`));
  await page.type(`${dialog} input[placeholder="Nhập tên người đã giới thiệu bạn"]`, "Người giới thiệu kiểm thử");
  control.rejectLead = false;
  await page.click(`${dialog} button[type="submit"]`);
  await page.waitForFunction(() => location.pathname === "/cam-on-khoi-thong");
  assert.equal(leads[0].payload.other_referrer_name, "Người giới thiệu kiểm thử");
  assert.equal(leads[0].payload.hasRegisteredLHD, true);
  assert.deepEqual(errors, []);
  results.push({ test: "legacy-anchor-and-other-referrer", passed: true });
  await context.close();
}

async function testOtherFunnels() {
  for (const suffix of ["", "-thuonghieu"]) {
    const { page, context, errors } = await setup(412, 915);
    await page.goto(`${origin}/dao-tao/khoi-thong-dong-tien${suffix}`, { waitUntil: "networkidle0" });
    assert.equal(await page.$("#leader-registration-dialog"), null);
    await page.click('a[data-registration-source="BannerChinh"][href="#dang-ky"]');
    await page.waitForSelector("#dang-ky form", { visible: true });
    await page.waitForFunction(() => window.scrollY > 0);
    assert.deepEqual(errors, []);
    results.push({ test: `existing-anchor-${suffix || "ads"}`, passed: true });
    await context.close();
  }
}

try {
  await testPopup(1440, 1000);
  await testPopup(412, 915);
  await testPopup(320, 700);
  await testPopup(667, 375);
  await testOtherReferrerAndLegacyLink();
  await testOtherFunnels();
  await fs.writeFile(".cache/leader-registration/results.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  // Some system Chrome versions can leave the headless process alive on close.
  const closeTimeout = setTimeout(() => browser.process()?.kill(), 5000);
  try { await browser.close(); } finally { clearTimeout(closeTimeout); }
}
