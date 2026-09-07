import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import puppeteer from 'puppeteer';

// Render the real page and service. Only authentication, surrounding chrome and HTTP
// are replaced; no credentials or requests are sent to Firebase/Bunny/production.
const AUTH_MODULE = '\0hypnosis-test-auth';
const testPlugin = {
  name: 'hypnosis-security-test', enforce: 'pre',
  resolveId(source) {
    if (source === '/__hypnosis_test.js') return '\0hypnosis-test-entry';
    if (source === 'firebase/auth' || source === '../firebase') return AUTH_MODULE;
    if (source.endsWith('/components/SEO') || source.endsWith('/components/AuthModal')) return '\0hypnosis-test-empty';
    if (source.endsWith('/utils/affiliateService')) return '\0hypnosis-test-affiliate';
  },
  load(id) {
    if (id === AUTH_MODULE) return `
      const callbacks = new Set();
      const makeUser = uid => uid ? { uid, email: uid + '@test.invalid', getIdToken: async () => 'test-token-' + uid } : null;
      export const auth = { currentUser: makeUser(window.__initialUid) };
      export const onAuthStateChanged = (_, cb) => { callbacks.add(cb); queueMicrotask(() => cb(auth.currentUser)); return () => callbacks.delete(cb); };
      window.__testAuth = uid => { auth.currentUser = makeUser(uid); callbacks.forEach(cb => cb(auth.currentUser)); };
    `;
    if (id === '\0hypnosis-test-empty') return 'export default () => null;';
    if (id === '\0hypnosis-test-affiliate') return 'export const getAffiliateByUserId = async () => null;';
    if (id === '\0hypnosis-test-entry') return `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { MemoryRouter } from 'react-router';
      import Page from '/src/pages/ThoiMien.jsx';
      createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter, {
        initialEntries: [window.__initialRoute || '/thoi-mien-cua-toi?autoPlay=paid']
      }, React.createElement(Page)));
    `;
  },
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== '/__hypnosis_test') return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml(req.url, '<div id="root"></div><script type="module" src="/__hypnosis_test.js"></script>'));
    });
  },
};
const track = { id: 'paid', title: 'Protected test audio', isFree: false, price: 199000, available: true, category: 'wealth', duration: '30:00' };
const signed = { provider: 'bunny', playbackUrl: 'https://iframe.mediadelivery.net/embed/738609/11111111-1111-4111-8111-111111111111?token=test-signed&expires=9999999999', expires: 9999999999 };

test('hypnosis browser authorization regressions', { timeout: 90000 }, async t => {
  const server = await createServer({ configFile: false, plugins: [testPlugin, react()],
    server: { host: '127.0.0.1', port: 5192, strictPort: true }, logLevel: 'error' });
  let browser;
  try {
    await server.listen();
    browser = await puppeteer.launch({ channel: process.env.PUPPETEER_CHANNEL || 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
    const open = async ({ uid = null, owns = false, holdPlayback = false, free = false, route } = {}) => {
      const page = await browser.newPage();
      const requests = [], errors = [];
      let held;
      await page.evaluateOnNewDocument(({ userId, route }) => {
        window.__initialUid = userId;
        window.__initialRoute = route;
        // The historical attack must not grant access anymore.
        localStorage.setItem('maliedu_owned_audio_ids', '["paid"]');
      }, { userId: uid, route });
      page.on('pageerror', error => errors.push(error.message));
      await page.setRequestInterception(true);
      page.on('request', req => {
        const url = new URL(req.url());
        if (url.pathname.startsWith('/api/')) {
          requests.push({ path: url.pathname, authorization: req.headers().authorization, body: req.postData() });
          const respond = body => req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
          if (url.pathname === '/api/hypnosis/catalog') return void respond({ tracks: [{ ...track, isFree: free }] });
          if (url.pathname === '/api/hypnosis/library') return void respond({ trackIds: owns && req.headers().authorization === 'Bearer test-token-buyer' ? ['paid'] : [] });
          if (url.pathname === '/api/hypnosis/playback') {
            if (holdPlayback) { held = () => respond(signed).catch(() => {}); return; }
            return void respond(signed);
          }
          if (url.pathname === '/api/hypnosis/guide') return void respond({ guide: { guidePreparation: 'PRIVATE_GUIDE_SENTINEL' } });
          if (url.pathname === '/api/hypnosis/claim') return void respond({ success: true, trackId: 'paid' });
          return void req.abort();
        }
        if (url.origin !== 'http://127.0.0.1:5192') return void req.abort();
        return void req.continue();
      });
      await page.goto('http://127.0.0.1:5192/__hypnosis_test', { waitUntil: holdPlayback ? 'networkidle2' : 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 10000 });
      assert.deepEqual(errors, []);
      return { page, requests, release: () => held?.(), errors };
    };
    await t.test('guest with forged cache and autoPlay does not request or mount a player', async () => {
      const { page, requests } = await open();
      assert.equal(requests.some(r => r.path.endsWith('/playback')), false);
      assert.equal(await page.$eval('audio', audio => audio.getAttribute('src')), null);
      assert.equal(await page.$('iframe'), null);
      assert.equal(await page.evaluate(() => localStorage.getItem('maliedu_owned_audio_ids')), null);
      await page.close();
    });
    await t.test('logged-in nonbuyer cannot autoplay a paid track', async () => {
      const { page, requests } = await open({ uid: 'buyer' });
      assert.equal(requests.some(r => r.path.endsWith('/playback')), false);
      assert.equal(await page.$('iframe'), null);
      await page.close();
    });
    await t.test('buyer uses the authenticated playback API and logout removes the source', async () => {
      const { page, requests } = await open({ uid: 'buyer', owns: true });
      await page.waitForSelector('iframe');
      assert.equal(requests.find(r => r.path.endsWith('/playback')).authorization, 'Bearer test-token-buyer');
      assert.match(await page.$eval('iframe', frame => frame.src), /token=test-signed/);
      await page.evaluate(() => window.__testAuth(null));
      await page.waitForFunction(() => !document.querySelector('iframe') && !document.querySelector('audio')?.getAttribute('src'));
      await page.close();
    });
    await t.test('a late playback response from the previous account is discarded', async () => {
      const { page, requests, release } = await open({ uid: 'buyer', owns: true, holdPlayback: true });
      assert(requests.some(r => r.path.endsWith('/playback')));
      await page.evaluate(() => window.__testAuth('other'));
      await release();
      await page.waitForNetworkIdle({ idleTime: 200 });
      assert.equal(await page.$('iframe'), null);
      assert.equal(await page.$eval('audio', audio => audio.getAttribute('src')), null);
      await page.close();
    });
    await t.test('private guide content is fetched on demand with authentication', async () => {
      const { page, requests } = await open({ uid: 'buyer', owns: true });
      await page.$$eval('button', buttons => buttons.find(button => button.textContent.trim() === 'Hướng dẫn').click());
      await page.waitForFunction(() => document.body.textContent.includes('PRIVATE_GUIDE_SENTINEL'));
      assert.equal(requests.find(r => r.path.endsWith('/guide')).authorization, 'Bearer test-token-buyer');
      await page.evaluate(() => window.__testAuth(null));
      await page.waitForFunction(() => !document.body.textContent.includes('PRIVATE_GUIDE_SENTINEL'));
      await page.close();
    });
    await t.test('free claim completes on the server before opening the owned player', async () => {
      const { page, requests } = await open({ uid: 'buyer', free: true, route: '/thoi-mien' });
      await page.$$eval('button', buttons => buttons.find(button => button.textContent.trim() === 'Nhận 0đ').click());
      await page.waitForSelector('iframe');
      const claimIndex = requests.findIndex(r => r.path.endsWith('/claim'));
      const playbackIndex = requests.findIndex(r => r.path.endsWith('/playback'));
      assert(claimIndex >= 0 && playbackIndex > claimIndex);
      assert.equal(requests[claimIndex].authorization, 'Bearer test-token-buyer');
      await page.close();
    });
  } finally {
    await browser?.close();
    await server.close();
  }
});
