import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import puppeteer from 'puppeteer';

// Isolated UI test: no authenticated browser profile and no production requests.
const fixtures = [
  ['main-landing', 'Landing Page Chính', 'ads', 'ads_2'],
  ['leader', 'Leader - Khơi Thông Dòng Tiền', 'leader', 'leader'],
  ['brand', 'Thương hiệu - Khơi Thông Dòng Tiền', 'brand', 'brand'],
  ['loa', 'Luật Hấp Dẫn - Khơi Thông Dòng Tiền', 'ads', 'ads'],
];
const landings = fixtures.map(([id, name, funnel, source]) => ({ id, name, slug: '/dao-tao/' + id, course_k: 'K58', active_source_key: source + '_k58', targetFunnel: funnel.toUpperCase(), funnel_type: funnel, is_maintenance: false }));
const workspace = { landings, checkedAt: new Date().toISOString(), crmUsers: [], courses: [{ id: 'course', name: 'Khơi Thông Dòng Tiền', batches: ['K58', 'K59'] }],
  sourceConfigs: Object.fromEntries(landings.map(row => [row.active_source_key, { landingPageId: row.id, targetK: row.course_k, targetFunnel: row.targetFunnel, targetCourseId: 'course' }])),
  schedule: { eventStart: '2026-10-21T20:00:00+07:00', ctaScheduleLabel: '21–23/10 · 20h00', thankYouCountdownSeconds: 300, thankYouZaloLink: 'https://zalo.me/g/fixture' } };
const mockService = `
window.__landingWorkspace=${JSON.stringify(workspace)}; window.__landingWrites=[];
export const getAdminLandingWorkspace=async()=>structuredClone(window.__landingWorkspace);
export const updateLandingRoutingBatch=async({updates})=>{
 if(window.__landingConflict)throw new Error('Landing vừa được thay đổi ở máy khác. Vui lòng làm mới và kiểm tra lại.');
 window.__landingWrites.push(updates);
 for(const update of updates){const row=window.__landingWorkspace.landings.find(r=>r.id===update.landingId);Object.assign(row,{course_k:update.courseK,active_source_key:update.sourceKey,targetFunnel:update.funnelType.toUpperCase(),funnel_type:update.funnelType});window.__landingWorkspace.sourceConfigs[update.sourceKey]={landingPageId:row.id,targetK:row.course_k,targetFunnel:row.targetFunnel};}
 return updates;
};
export const repairAdminLandingSources=async()=>({summary:{conflicts:0,missingSources:0,claimable:0,orphans:0}});
export const saveSharedLandingSchedule=async({schedule})=>schedule;
export const deleteLandingWithSource=async()=>{throw new Error('Not available in fixture');};
export const saveLandingWithSource=async()=>{throw new Error('Not available in fixture');};
`;
await fs.mkdir('.cache', { recursive: true });
await fs.writeFile('.cache/admin-landings-entry.jsx', `import React from 'react';import {createRoot} from 'react-dom/client';import {Toaster} from 'react-hot-toast';import AdminLandings from '/src/pages/admin/AdminLandings.jsx';import '/src/index.css';createRoot(document.getElementById('root')).render(<><Toaster/><AdminLandings/></>);`);
const output = path.resolve(process.env.LANDING_UI_OUTPUT || '.cache/admin-landings-ui');
await fs.mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4187, strictPort: true, hmr: false }, plugins: [{
  name: 'isolated-landing-fixtures', enforce: 'pre',
  resolveId(id, importer) {
    const owner = importer?.replace(/\\/g, '/');
    if (owner?.includes('/AdminLandings.jsx') && id.includes('adminLandingService')) return '\0landing-service-fixture';
    if (owner?.includes('/AdminLandings.jsx') && id === '../../firebase') return '\0landing-firebase-fixture';
  },
  load(id) {
    if (id === '\0landing-service-fixture') return mockService;
    if (id === '\0landing-firebase-fixture') return 'export const crmFirestore={};export const crmRealtimeDB={};';
  },
  configureServer(vite) {
    vite.middlewares.use('/__landing-test', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml('/__landing-test', '<html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="root"></div><script type="module" src="/.cache/admin-landings-entry.jsx"></script></body></html>'));
    });
  },
}] });
await server.listen();
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);
const browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => new URL(request.url()).hostname === '127.0.0.1' ? request.continue() : request.abort());
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('pageerror:', error.message); });
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4187/__landing-test', { waitUntil: 'networkidle0' });
  try { await page.waitForSelector('#batch-main-landing', { timeout: 15000 }); }
  catch (error) { console.error(await page.$eval('body', row => row.innerText.slice(0, 1500))); await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); throw error; }
  const clickText = text => page.evaluate(value => {
    const button = [...document.querySelectorAll('button')].find(row => row.textContent.trim() === value);
    if (!button) throw new Error('Missing button: ' + value); button.click();
  }, text);
  const reviewMain = () => page.$eval('#batch-main-landing', node => [...node.closest('.group').querySelectorAll('button')].find(row => row.textContent.includes('Xem trước & lưu')).click());
  const typeBatch = async value => { await page.click('#batch-main-landing'); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.type('#batch-main-landing', value); };
  await typeBatch('K59');
  await page.click('h1');
  assert.equal(await page.evaluate(() => window.__landingWrites.length), 0, 'Blur never saves routing');
  await reviewMain(); await page.waitForSelector('dialog[open]');
  assert.match(await page.$eval('dialog', row => row.innerText), /K58.*ADS[\s\S]*K59/);
  await page.keyboard.press('Escape'); await page.waitForSelector('dialog', { hidden: true });
  assert.equal(await page.evaluate(() => window.__landingWrites.length), 0, 'Cancel never saves');
  await reviewMain(); await clickText('Xác nhận lưu 1 landing');
  await page.waitForSelector('dialog', { hidden: true });
  assert.equal(await page.evaluate(() => window.__landingWrites[0][0].expectedCourseK), 'K58');
  assert.equal(await page.$eval('#batch-main-landing', row => row.value), 'K59');
  await page.evaluate(() => { window.__landingConflict = true; });
  await typeBatch('K60'); await reviewMain(); await clickText('Xác nhận lưu 1 landing');
  await page.waitForFunction(() => document.querySelector('dialog [role="alert"]')?.textContent.includes('máy khác'));
  assert.equal(await page.evaluate(() => window.__landingWrites.length), 1, 'Stale edit is not committed');
  await clickText('Quay lại');
  assert.ok(await page.evaluate(() => document.body.innerText.includes('Lịch học đã qua')));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile has no horizontal overflow');
  await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, viewports: [1440, 390], screenshots: output, checked: ['no blur save', 'review/cancel', 'guarded save', 'stale edit feedback', 'past schedule warning', 'responsive overflow'] }));
} finally {
  await browser.close();
  await server.close();
}
