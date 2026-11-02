import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

// Real referral management UI. All auth, Firestore and HTTP are replaced with
// fixtures, so this never reads employee/customer details or creates live codes.
const origin = process.env.GRATITUDE_TEST_ORIGIN || 'http://localhost:5174';
const directory = '.cache/gratitude-referrals';
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(directory + '/index.html', `<div id="root"></div><script type="module">
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import '/src/index.css'; import Page from '/src/pages/admin/AdminReferralCustomers.jsx';
  createRoot(document.getElementById('root')).render(React.createElement(Page));
</script>`);
const browser = await puppeteer.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const js = body => request.respond({ contentType: 'application/javascript', body });
    const json = (body, status = 200) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/src/firebase.js') return js(`export const db={};export const auth={currentUser:{uid:'owner',email:'mongcoaching@gmail.com',getIdToken:async()=> 'test-token'}};`);
    if (url.pathname.includes('/firebase_auth.js')) return js(`export const onAuthStateChanged=(auth,fn)=>{queueMicrotask(()=>fn(auth.currentUser));return()=>{}};`);
    if (url.pathname.includes('/firebase_firestore.js')) return js(`
      const row=(id,data)=>({id,data:()=>data});
      const partners=[row('employee-a',{code:'employee-a',userId:'staff',name:'Nhân viên mẫu A',email:'a@example.test',isActive:true})];
      export const collection=(_,path)=>({path});
      export const doc=(_,collection,id)=>({path:collection+'/'+id,id});
      export const orderBy=()=>null;export const query=(ref)=>ref;
      export const serverTimestamp=()=>Date.now();
      export const getDocs=async ref=>({docs:ref.path==='referral_partners'?partners:ref.path==='users'?[
        row('staff',{role:'admin',displayName:'Nhân viên mẫu A',email:'a@example.test'}),
        row('staff-b',{role:'admin',displayName:'Nhân viên mẫu B',email:'b@example.test'})
      ]:ref.path==='leads'?[
        row('community_${'a'.repeat(64)}',{name:'Học viên 21 ngày mẫu',phone:'0912345678',source:'21-ngay-long-biet-on',courseId:'21-ngay-long-biet-on',referralCode:'employee-a',status:'contacted',note:'Ghi chú giữ nguyên',createdAt:1793574000000}),
        row('goal-old',{name:'Học viên khóa cũ mẫu',phone:'0987654321',source:'chinh-phuc-muc-tieu',courseId:'chinh-phuc-muc-tieu',referralCode:'cong-ty',status:'new',createdAt:1000})
      ]:[]});
      export const onSnapshot=(_,fn)=>{queueMicrotask(()=>fn({exists:()=>true,data:()=>({activeRunId:'chinh-phuc-muc-tieu',runs:[{id:'chinh-phuc-muc-tieu',name:'Chinh Phục Mục Tiêu',status:'active',startsAt:0}]})}));return()=>{}};
      export const setDoc=async(ref,data)=>{(window.__writes||=[]).push({path:ref.path,data});if(ref.path.startsWith('referral_partners/'))partners.push(row(ref.id,data));};
      export const runTransaction=async()=>{throw new Error('Ending existing courses is outside this test');};
    `);
    // One source is deliberately offline: website/gratitude rows must still show.
    if (url.pathname === '/api/admin/referral-leads') return json({ error: 'Nguồn Chinh Phục Mục Tiêu đang thử ngoại tuyến' }, 503);
    if (url.pathname === '/api/admin/community-registrations') return json({ nextCursor: null, registrations: [{
      id: 'a'.repeat(64), name: 'Học viên 21 ngày mẫu', phone: '0912345678', source: '21-ngay-long-biet-on', courseId: '21-ngay-long-biet-on', referralCode: 'employee-a', status: 'new', createdAt: '2026-11-02T00:00:00Z', utm: {},
    }] });
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return request.continue();
    return request.abort();
  });
  await page.goto(origin + '/' + directory + '/index.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('Học viên 21 ngày mẫu'));
  assert.ok(await page.$eval('[role="alert"]', el => el.innerText.includes('Chinh Phục')));
  assert.ok(await page.$$eval('select option', options => options.some(option => option.value === '21-ngay-long-biet-on')));
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Xem data 21 ngày').click());
  await page.waitForFunction(() => document.querySelector('tbody')?.innerText.includes('Học viên 21 ngày mẫu'));
  assert.equal(await page.$$eval('tbody tr', rows => rows.length), 1, 'the registration and its mirror are one row');
  assert.ok(await page.$eval('tbody', el => el.innerText.includes('Nhân viên mẫu A')));
  assert.equal(await page.$eval('tbody input', el => el.value), 'Ghi chú giữ nguyên');
  assert.equal(await page.$eval('tbody select', el => el.value), 'contacted');
  assert.equal(await page.$eval('tbody', el => el.innerText.includes('Học viên khóa cũ mẫu')), false);
  await page.screenshot({ path: directory + '/customers.png', fullPage: true });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Link nhân viên 21 ngày').click());
  await page.waitForSelector('select[aria-label="Khóa dùng link nhân viên"]');
  assert.equal(await page.$eval('select[aria-label="Khóa dùng link nhân viên"]', el => el.value), '21-ngay-long-biet-on');
  await page.waitForFunction(() => [...document.querySelectorAll('a')].some(a => a.href.includes('/dao-tao/21-ngay-long-biet-on?ref=employee-a')));
  assert.ok(await page.$$eval('a', nodes => nodes.some(a => a.href.endsWith('/dao-tao/21-ngay-long-biet-on'))), 'company direct link');
  const accountSelect = await page.$('form select:not([aria-label])');
  await accountSelect.select('staff-b');
  await page.evaluate(() => document.querySelector('form').requestSubmit());
  await page.waitForFunction(() => window.__writes?.some(write => write.path.startsWith('referral_partners/')));
  const writes = await page.evaluate(() => window.__writes);
  const partner = writes.find(write => write.path.startsWith('referral_partners/'));
  assert.equal(partner.data.userId, 'staff-b');
  assert.ok(partner.data.code);
  assert.ok(writes.some(write => write.path === 'users/staff-b' && write.data.referralCode === partner.data.code));
  await page.waitForFunction(code => [...document.querySelectorAll('a')].some(a => a.href.includes('/dao-tao/21-ngay-long-biet-on?ref=' + code)), {}, partner.data.code);
  await page.screenshot({ path: directory + '/employee-links.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS referral UI: 21-day filter, employee attribution, no duplicate rows, existing notes, partial outage, company/employee links and new code creation');
} finally { await browser.close(); }
