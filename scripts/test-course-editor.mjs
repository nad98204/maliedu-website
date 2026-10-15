import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import puppeteer from 'puppeteer';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isCourseEditorPath } from '../src/utils/courseEditorRoute.js';
import { getAdminModuleByPathname } from '../src/utils/adminAccess.js';

test('course editor URLs retain course-module permissions', () => {
  for (const path of ['/admin/courses/new', '/admin/courses/k11/edit']) {
    assert.equal(isCourseEditorPath(path), true);
    assert.equal(getAdminModuleByPathname(path), 'courses');
  }
  for (const path of ['/admin/courses', '/admin/courses-extra/new', '/khoa-hoc/new']) {
    assert.equal(isCourseEditorPath(path), false);
  }
});

// Render the real editor and admin layout; Firebase and uploads are local mocks.
// No production accounts, course reads or course writes are used by these tests.
const plugin = {
  name: 'course-editor-test', enforce: 'pre',
  resolveId(source) {
    if (source === '/__course_editor_entry.js') return '\0editor-entry';
    if (source === 'firebase/firestore') return '\0editor-db';
    if (source === 'firebase/auth') return '\0editor-auth';
    if (source === '../../firebase' || source === '../firebase') return '\0editor-firebase';
    if (['./AdminCategories', './AdminCoupons', './AdminInstructors', '../../components/S3VideoUploader'].includes(source)) return '\0editor-empty';
    if (source === '../../components/RichTextEditor') return '\0editor-richtext';
    if (source === '../../utils/instructorSyncService') return '\0editor-instructors';
    if (source === '../../utils/s3UploadService') return '\0editor-s3';
    if (source === '../../utils/bunnyStreamService') return '\0editor-bunny';
    if (source === '../../utils/bunnyStorageService') return '\0editor-storage';
  },
  load(id) {
    if (id === '\0editor-empty') return 'export default () => null;';
    if (id === '\0editor-richtext') return `import React from 'react'; export default ({value='',onChange}) => React.createElement('textarea',{value,onChange:e=>onChange(e.target.value),'aria-label':'Nội dung'});`;
    if (id === '\0editor-instructors') return 'export const loadLatestCourseInstructors = async c => c.instructors || [];';
    if (id === '\0editor-firebase') return "export const db = {}; export const crmFirestore = {}; export const auth = { currentUser: {uid:'test-admin',email:'mongcoaching@gmail.com'} };";
    if (id === '\0editor-auth') return "export const onAuthStateChanged=(_,cb)=>{queueMicrotask(()=>cb({uid:'test-admin',email:'mongcoaching@gmail.com'}));return()=>{}};export const signOut=async()=>{};";
    if (id === '\0editor-s3') return 'export const uploadFileToS3 = async () => {throw Error("Unexpected upload")}; export const uploadVideoToS3=uploadFileToS3;';
    if (id === '\0editor-bunny') return 'export const uploadVideoToBunny = async () => {throw Error("Unexpected upload")};';
    if (id === '\0editor-storage') return 'export const uploadAudioToBunny = async () => {throw Error("Unexpected upload")}; export const uploadImageToBunny=uploadAudioToBunny;';
    if (id === '\0editor-db') return `
      const course={name:'Khóa học K11 thử nghiệm',slug:'k11',isForSale:false,isPublished:false,freeLessonsCount:0,
        categories:['luat-hap-dan'],instructors:[{name:'Giảng viên thử nghiệm',title:'Coach',avatar:'',bio:''}],
        curriculum:[{id:'section-1',title:'Chương thử nghiệm',lessons:[{id:'lesson-1',title:'Bài thử nghiệm',contentType:'video',isFreePreview:false}]}]};
      const data={courses:{k11:course},course_content:{k11:{courseId:'k11',curriculum:[{id:'section-1',title:'Chương thử nghiệm',lessons:[{id:'lesson-1',title:'Bài thử nghiệm',contentType:'video',videoProvider:'s3',videoId:'https://test.invalid/video.mp4'}]}],courseResources:[]}},categories:{cat:{name:'Luật Hấp Dẫn',slug:'luat-hap-dan'}},instructors:{},landing_pages:{}};
      window.__editorWrites=[];window.__editorReads=[];
      const snapshot=(id,value)=>({id,exists:()=>value!==undefined,data:()=>structuredClone(value)});
      export const collection=(_,name)=>({name});
      export const doc=(base,name,id)=>({name:base.name||name,id:base.name?name||'new-course':id});
      export const query=(ref)=>ref;export const orderBy=()=>null;
      export const getDoc=async ref=>{window.__editorReads.push(ref.name+'/'+ref.id);return snapshot(ref.id,data[ref.name]?.[ref.id]);};
      export const getDocs=async ref=>{window.__editorReads.push(ref.name+'/*');return{docs:Object.entries(data[ref.name]||{}).map(([id,v])=>snapshot(id,v))}};
      export const onSnapshot=(ref,cb)=>{queueMicrotask(async()=>cb(await getDocs(ref)));return()=>{}};
      export const writeBatch=()=>{const writes=[];return{set:(ref,value)=>writes.push({ref,value}),commit:async()=>{for(const w of writes){(data[w.ref.name]??={})[w.ref.id]=w.value;window.__editorWrites.push(w)}}}};
    `;
    if (id === '\0editor-entry') return `
      import React from 'react';import{createRoot}from'react-dom/client';
      import{BrowserRouter,Routes,Route,useLocation}from'react-router';
      import Page from '/src/pages/admin/AdminCourses.jsx';import AdminLayout from '/src/layouts/AdminLayout.jsx';
      import{isCourseEditorPath}from'/src/utils/courseEditorRoute.js';import '/src/index.css';
      function Shell(){const l=useLocation();return React.createElement(React.Fragment,null,
        !isCourseEditorPath(l.pathname)&&React.createElement('div',{'data-site-header':true},'Site header'),
        React.createElement(Routes,null,React.createElement(Route,{path:'/admin',element:React.createElement(AdminLayout)},
          ...['courses','courses/new','courses/:courseId/edit'].map(path=>React.createElement(Route,{key:path,path,element:React.createElement(Page)})))))}
      createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Shell)));
    `;
  },
  configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (!req.url.startsWith('/admin/courses')) return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml(req.url, '<div id="root"></div><script type="module" src="/__course_editor_entry.js"></script>'));
    });
  },
};

test('full-page course editor navigation and responsive layout', { timeout: 120000 }, async t => {
  const server = await createServer({ configFile: false, plugins: [plugin, react()], server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  let browser;
  try {
    await server.listen();
    browser = await puppeteer.launch({ channel: 'chrome', headless: true });
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    const errors = [];
    const open = async (path, width = 1440) => {
      const page = await browser.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.accept());
      await page.setViewport({ width, height: 900 });
      await page.setRequestInterception(true);
      page.on('request', request => void (request.url().startsWith(origin) ? request.continue() : request.abort()));
      await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
      return page;
    };
    await t.test('edit opens a separate URL and full viewport from the Offline list', async () => {
      const page = await open('/admin/courses');
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Offline'));
      await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Offline').click());
      await page.waitForSelector('button[title="Chỉnh sửa"]');
      await page.click('button[title="Chỉnh sửa"]');
      await page.waitForSelector('[data-course-editor]');
      assert.ok(page.url().endsWith('/admin/courses/k11/edit'));
      assert.equal(await page.$('aside'), null);
      assert.equal(await page.$('[data-site-header]'), null);
      assert.equal(await page.$('table'), null);
      assert.deepEqual(await page.$eval('[data-course-editor]', el => ({ width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height })), { width:1440,height:900 });
      await page.click('button[aria-label="Quay lại danh sách khóa học"]');
      await page.waitForSelector('button[title="Chỉnh sửa"]');
      assert.ok(page.url().endsWith('/admin/courses'));
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      await page.close();
    });
    await t.test('direct edit survives reload, preserves private content and saves', async () => {
      const page = await open('/admin/courses/k11/edit');
      await page.waitForSelector('[data-course-editor]');
      assert.equal(await page.$eval('input[name="name"]', el => el.value), 'Khóa học K11 thử nghiệm');
      assert.equal(await page.evaluate(() => window.__editorReads.includes('courses/*')), false);
      await page.reload({ waitUntil:'domcontentloaded' });
      await page.waitForSelector('[data-course-editor]');
      await page.evaluate(() => [...document.querySelectorAll('button')].find(b=>b.textContent.includes('Lộ trình bài học')).click());
      await page.waitForFunction(() => [...document.querySelectorAll('input')].some(input => input.value === 'Chương thử nghiệm'));
      if (process.env.COURSE_EDITOR_SCREENSHOTS) await page.screenshot({ path: join(tmpdir(), 'maliedu-course-editor-desktop.png') });
      await page.evaluate(() => [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Lưu khóa học').click());
      await page.waitForFunction(() => location.pathname === '/admin/courses');
      const writes = await page.evaluate(() => window.__editorWrites);
      assert.equal(writes.length,2);
      assert.equal(writes.find(w=>w.ref.name==='course_content').value.curriculum[0].lessons[0].videoId,'https://test.invalid/video.mp4');
      assert.equal(writes.find(w=>w.ref.name==='courses').value.curriculum[0].lessons[0].videoId,undefined);
      assert.equal(writes.find(w=>w.ref.name==='courses').value.freeLessonsCount,0);
      await page.close();
    });
    await t.test('mobile editor has no page overflow and save stays on screen', async () => {
      const page = await open('/admin/courses/k11/edit',390);
      await page.waitForSelector('[data-course-editor]');
      await page.$eval('#course-editor-form', el=>{el.scrollTop=el.scrollHeight});
      const layout=await page.evaluate(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Lưu khóa học');const r=button.getBoundingClientRect();return{width:document.documentElement.scrollWidth,viewport:innerWidth,buttonTop:r.top,buttonBottom:r.bottom,height:innerHeight}});
      assert.equal(layout.width,layout.viewport);
      assert.ok(layout.buttonTop>=0&&layout.buttonBottom<=layout.height);
      assert.equal(await page.$('aside'),null);
      if (process.env.COURSE_EDITOR_SCREENSHOTS) await page.screenshot({ path: join(tmpdir(), 'maliedu-course-editor-mobile.png') });
      await page.close();
    });
    await t.test('new and duplicated courses have independent URLs', async () => {
      const page=await open('/admin/courses/new');await page.waitForSelector('[data-course-editor]');
      assert.equal(await page.$eval('input[name="name"]',el=>el.value),'');
      await page.goto(origin+'/admin/courses/new?copy=k11',{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-course-editor]');
      assert.equal(await page.$eval('input[name="name"]',el=>el.value),'[Bản sao] Khóa học K11 thử nghiệm');
      assert.equal(await page.evaluate(()=>window.__editorWrites.length),0);
      await page.close();
    });
    await t.test('unknown course displays recovery instead of an empty form',async()=>{
      const page=await open('/admin/courses/missing/edit');await page.waitForSelector('[role="alert"]');
      assert.ok(await page.$eval('[role="alert"]',el=>el.textContent.includes('Không tìm thấy')));
      assert.equal(await page.$('#course-editor-form'),null);
      assert.equal(await page.evaluate(()=>window.__editorWrites.length),0);
      await page.close();
    });
    assert.deepEqual(errors,[]);
  } finally {
    await browser?.close();
    await server.close();
  }
});
