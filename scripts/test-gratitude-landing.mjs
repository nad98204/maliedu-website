import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

// Exercise the real landing and registration service; intercept all HTTP outside
// the local preview and replace registration responses. No real leads are saved.
const origin = process.env.GRATITUDE_TEST_ORIGIN || 'http://localhost:5174';
const browser = await puppeteer.launch({ headless: true, channel: 'chrome' });
await fs.mkdir('.cache/gratitude-tests', { recursive: true });
try {
  for (const width of process.env.GRATITUDE_ADMIN_ONLY ? [] : [1440, 390, 320]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: width === 1440 ? 1000 : 844, deviceScaleFactor: 1 });
    const errors = [];
    const posts = [];
    let status = 503;
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (url.pathname === '/api/affiliate') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      if (url.pathname === '/api/community-registrations') {
        posts.push(JSON.parse(request.postData()));
        return request.respond({ status, contentType: 'application/json', body: JSON.stringify(status === 200
          ? { success: true, courseId: '21-ngay-long-biet-on', zaloUrl: 'https://zalo.me/g/xxoif3llvmgmr2tm4irv' }
          : { error: 'Chưa thể lưu đăng ký. Vui lòng thử lại.' }) });
      }
      if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return request.continue();
      return request.abort();
    });
    await page.goto(origin + '/dao-tao/21-ngay-long-biet-on?ref=nhan-vien-a&utm_source=kiem-thu&utm_campaign=21-ngay', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.g21-hero');
    await page.evaluate(() => document.fonts.ready);
    for (const img of await page.$$('.g21-page img')) {
      await img.evaluate(el => el.scrollIntoView());
      await page.waitForFunction(el => el.complete && el.naturalWidth > 0, {}, img);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(await page.$$eval('h1', nodes => nodes.length), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow at ' + width);
    assert.equal(await page.$eval('.g21-page', el => /Facebook|CỘNG ĐỒNG LUẬT HẤP DẪN/.test(el.innerText)), false);
    assert.equal(await page.$$eval('.g21-page img', nodes => nodes.every(img => img.complete && img.naturalWidth > 0)), true);
    assert.equal(await page.$$eval('main', nodes => nodes.length), 1);
    if (width === 1440) await page.screenshot({ path: '.cache/gratitude-tests/preview-desktop.png' });
    await page.screenshot({ path: `.cache/gratitude-tests/landing-${width}.png`, fullPage: true });
    assert.equal(await page.$('.g21-menu'), null);
    assert.equal(await page.$$eval('.g21-links a', links => links.every(link => {
      const bounds = link.getBoundingClientRect();
      const header = document.querySelector('.g21-header').getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.top >= header.top && bounds.bottom <= header.bottom;
    })), true, 'navigation text is visible without opening a menu');
    if (width === 390) await page.screenshot({ path: '.cache/gratitude-tests/mobile-text-navigation.png' });
    const triggers = ['.g21-hero [data-registration-trigger]', '.g21-register-prompt [data-registration-trigger]', '.g21-invite [data-registration-trigger]',
      '.g21-nav-cta', ...(width <= 720 ? ['.g21-mobile-cta'] : [])];
    for (const trigger of triggers) {
      const button = await page.$(trigger);
      await button.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      // Measure at the click itself, after Puppeteer finishes positioning the button.
      await button.evaluate(el => el.addEventListener('click', () => { window.__beforeModalScroll = window.scrollY; }, { capture: true, once: true }));
      await button.click();
      await page.waitForSelector('.g21-dialog[open] .g21-form');
      const scrollChange = await page.evaluate(() => window.scrollY - window.__beforeModalScroll);
      assert.ok(Math.abs(scrollChange) <= 2, `${width}px ${trigger}: opening form changed scroll by ${scrollChange}px`);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'g21-name');
      assert.equal(await page.$$eval('.g21-form > input', inputs => inputs.length), 2);
      assert.equal(await page.$('.g21-form input[type="email"]'), null);
      assert.equal(await page.$('.g21-form input[type="checkbox"]'), null);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.g21-dialog').open);
      assert.equal(await button.evaluate(el => document.activeElement === el), true, 'closing returns focus to opener');
    }
    await page.click('.g21-hero [data-registration-trigger]');
    await page.type('#g21-name', 'Học viên kiểm thử');
    await page.click('.g21-dialog-close');
    await page.click('.g21-hero [data-registration-trigger]');
    assert.equal(await page.$eval('#g21-name', el => el.value), 'Học viên kiểm thử', 'closing preserves entered name');
    await page.mouse.click(2, 2);
    await page.waitForFunction(() => !document.querySelector('.g21-dialog').open);
    await page.click('.g21-hero [data-registration-trigger]');
    await page.screenshot({ path: `.cache/gratitude-tests/form-${width}.png` });
    await page.type('#g21-phone', '12345');
    await page.click('.g21-form button[type="submit"]');
    await page.waitForSelector('.g21-error');
    assert.equal(posts.length, 0, 'invalid phone is never submitted');
    await page.$eval('#g21-phone', el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.focus('#g21-phone');
    await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
    await page.type('#g21-phone', '+84 912 345 678');
    await page.click('.g21-form button[type="submit"]');
    await page.waitForFunction(() => document.querySelector('.g21-error')?.textContent.includes('Chưa thể lưu'));
    assert.equal(await page.$('.g21-success'), null, 'API failure cannot show success');
    assert.equal(await page.$eval('#g21-name', el => el.value), 'Học viên kiểm thử');
    status = 429;
    await page.click('.g21-form button[type="submit"]');
    await page.waitForFunction(() => document.querySelector('.g21-error')?.textContent.includes('nhiều lần'));
    status = 200;
    await page.click('.g21-form button[type="submit"]');
    await page.waitForSelector('.g21-success');
    assert.equal(posts.at(-1).phone, '0912345678');
    assert.equal(posts.at(-1).courseId, '21-ngay-long-biet-on');
    assert.equal(posts.at(-1).consent, true);
    assert.equal(Object.hasOwn(posts.at(-1), 'email'), false);
    assert.equal(posts.at(-1).utm.utm_source, 'kiem-thu');
    assert.equal(posts.at(-1).referralCode, 'nhan-vien-a');
    assert.equal(await page.$eval('.g21-success a', el => el.href), 'https://zalo.me/g/xxoif3llvmgmr2tm4irv');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'g21-success');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `.cache/gratitude-tests/success-${width}.png`, fullPage: false });
    console.log(`PASS ${width}px: every registration button opens the two-field modal, close/Escape/backdrop, preserved inputs, validation, API errors/retry and Zalo link`);
    await page.close();
  }
  const harness = '.cache/gratitude-tests/admin-qa.html';
  await fs.writeFile(harness, `<div id="root"></div><script type="module">
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import '/src/index.css';
    import Admin from '/src/pages/admin/AdminCommunityRegistrations.jsx';
    createRoot(document.getElementById('root')).render(React.createElement(Admin));
  </script>`);
  const page = await browser.newPage();
  const fixture = Array.from({ length: 26 }, (_, i) => ({
    id: String(i), name: i === 0 ? 'Nguyễn Học Viên' : i === 1 ? '=1+1' : 'Học viên mẫu ' + i,
    phone: '0912345678', email: '', courseName: 'Thử thách 21 ngày', createdAt: '2026-11-02T00:00:00Z', utm: {},
  }));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/src/firebase.js') return request.respond({ contentType: 'application/javascript', body: `export const auth={currentUser:{getIdToken:async()=> 'test-token'}};` });
    if (url.pathname === '/api/admin/community-registrations') return request.respond({ contentType: 'application/json', body: JSON.stringify({ registrations: fixture, nextCursor: null }) });
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return request.continue();
    return request.abort();
  });
  await page.goto(origin + '/' + harness, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 25);
  await page.screenshot({ path: '.cache/gratitude-tests/admin.png', fullPage: true });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Sau').click());
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1);
  await page.type('input[aria-label="Tìm tên, số điện thoại hoặc email"]', 'nguyen');
  await page.waitForFunction(() => document.querySelector('tbody')?.innerText.includes('Nguyễn Học Viên'));
  assert.equal(await page.$$eval('tbody tr', rows => rows.length), 1);
  await page.focus('input[aria-label="Tìm tên, số điện thoại hoặc email"]');
  await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 25);
  await page.evaluate(() => { URL.createObjectURL = blob => { blob.text().then(text => window.__csv = text); return 'blob:mock-csv'; }; });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Xuất CSV')).click());
  await page.waitForFunction(() => !!window.__csv);
  const csv = await page.evaluate(() => window.__csv);
  assert.ok(csv.includes("\"'=1+1\""), 'CSV must neutralize formulas');
  assert.ok(csv.includes("\"'0912345678\""), 'CSV must preserve phone leading zero');
  assert.equal(csv.split('\r\n').length, 27);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: '.cache/gratitude-tests/admin.png' });
  console.log('PASS admin: list, pagination, accent-insensitive search, full CSV export and spreadsheet formula protection');
  await page.close();
} finally { await browser.close(); }
