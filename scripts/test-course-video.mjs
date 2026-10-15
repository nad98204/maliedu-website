import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import puppeteer from 'puppeteer';
import { execFileSync } from 'node:child_process';

// Exercise the real component while keeping media requests local and pending.
// Accelerate only its 20-second watchdog, not React or browser timers.
test('course video survives delayed data and stalled events', { timeout: 60000 }, async t => {
  const server = await createServer({
    configFile: false,
    plugins: [react(), {
      name: 'course-video-regression',
      enforce: 'pre',
      transform(source, id) {
        if (process.env.COURSE_VIDEO_BASELINE === '1' && id.replaceAll('\\', '/').endsWith('/src/components/VideoWrapper.jsx')) {
          return execFileSync('git', ['show', 'HEAD:src/components/VideoWrapper.jsx'], { encoding: 'utf8' });
        }
      },
      resolveId(id) {
        if (id === '/__course_video_entry.js') return '\0course-video-entry';
      },
      load(id) {
        if (id !== '\0course-video-entry') return;
        return `
          import React from 'react';
          import { createRoot } from 'react-dom/client';
          import VideoWrapper from '/src/components/VideoWrapper.jsx';
          function TestPlayer() {
            const [playing, setPlaying] = React.useState(false);
            return React.createElement(VideoWrapper, {
              videoUrl: window.__source || window.location.origin + '/__course_video.mp4',
              videoProvider: window.__provider || 's3', currentLessonId: 'lesson-0-4',
              title: 'Bài học', playing, setPlaying,
              onEnded: () => { window.__ended = (window.__ended || 0) + 1; }
            });
          }
          createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode, null, React.createElement(TestPlayer)));
        `;
      },
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (req.url === '/__course_video.mp4') {
            req.on('close', () => res.destroy());
            return;
          }
          if (req.url !== '/__course_video') return next();
          res.setHeader('Content-Type', 'text/html');
          res.end(await vite.transformIndexHtml(req.url,
            '<div id="root"></div><script type="module" src="/__course_video_entry.js"></script>'));
        });
      },
    }],
    server: { host: '127.0.0.1', port: 0 },
    logLevel: 'error',
  });
  let browser;
  try {
    await server.listen();
    browser = await puppeteer.launch({ channel: 'chrome', headless: true });
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    const open = async ({ source = '', provider = 's3' } = {}) => {
      const page = await browser.newPage();
      await page.evaluateOnNewDocument(({ source, provider }) => {
        window.__source = source;
        window.__provider = provider;
        if (provider === 'youtube') {
          window.__youtubePlayers = [];
          window.YT = { Player: class {
            constructor(iframe, { events }) {
              this.iframe = iframe;
              this.events = events;
              this.state = -1;
              window.__youtubePlayers.push(this);
              queueMicrotask(() => events.onReady({ target: this }));
            }
            getDuration() { return 240; }
            getCurrentTime() { return 10; }
            getPlayerState() { return this.state; }
            playVideo() { this.state = 1; this.events.onStateChange({ data: 1 }); }
            pauseVideo() { this.state = 2; this.events.onStateChange({ data: 2 }); }
            destroy() { this.iframe.remove(); }
          }};
        }
        const schedule = window.setTimeout.bind(window);
        window.setTimeout = (callback, ms, ...args) => schedule(callback, ms === 20000 ? 500 : ms, ...args);
      }, { source, provider });
      if (provider === 'youtube') {
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (request.url().startsWith('https://www.youtube-nocookie.com/')) {
            return void request.respond({ status: 200, contentType: 'text/html', body: '<a id="watch" href="https://www.youtube.com/watch?v=M7lc1UVf-VE" target="_blank">YouTube</a>' });
          }
          void request.continue();
        });
      }
      await page.goto(`${origin}/__course_video`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(provider === 'youtube' ? 'iframe' : 'video');
      return page;
    };
    await t.test('slow initial load keeps the media element available to recover', async () => {
      const page = await open();
      await new Promise(resolve => setTimeout(resolve, 800));
      assert.ok(await page.$('video'), 'watchdog must not destroy a slow-loading video');
      assert.ok(await page.evaluate(() => document.body.textContent.includes('Video đang tải chậm')));
      await page.$eval('video', video => video.dispatchEvent(new Event('loadedmetadata')));
      await page.waitForFunction(() => !document.body.textContent.includes('Video đang tải chậm'));
      await page.close();
    });
    await t.test('stalled download does not stop video whose clock keeps advancing', async () => {
      const page = await open();
      await page.$eval('video', video => {
        video.dispatchEvent(new Event('loadedmetadata'));
        Object.defineProperty(video, 'paused', { configurable: true, value: false });
        Object.defineProperty(video, 'readyState', { configurable: true, value: 2 });
        window.__originalVideo = video;
      });
      await page.$eval('video', video => video.dispatchEvent(new Event('stalled')));
      for (let index = 0; index < 6; index++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        await page.evaluate(index => {
          const video = window.__originalVideo;
          Object.defineProperty(video, 'currentTime', { configurable: true, value: index + 1 });
          video.dispatchEvent(new Event('timeupdate'));
        }, index);
      }
      assert.equal(await page.evaluate(() => document.querySelector('video') === window.__originalVideo), true,
        'a transient stalled event must not unmount active playback');
      assert.equal(await page.evaluate(() => document.body.textContent.includes('Video đang tải chậm')), false);
      await page.close();
    });
    await t.test('paused video survives a stalled prefetch', async () => {
      const page = await open();
      await page.$eval('video', video => {
        video.dispatchEvent(new Event('loadedmetadata'));
        video.dispatchEvent(new Event('stalled'));
      });
      await new Promise(resolve => setTimeout(resolve, 800));
      assert.ok(await page.$('video'), 'paused playback must survive a stalled prefetch');
      await page.close();
    });
    await t.test('manual retry restores position after metadata loads', async () => {
      const page = await open();
      await page.$eval('video', video => {
        video.dispatchEvent(new Event('loadedmetadata'));
        Object.defineProperty(video, 'currentTime', { configurable: true, value: 143 });
        video.dispatchEvent(new Event('timeupdate'));
        window.__originalVideo = video;
      });
      await page.evaluate(() => [...document.querySelectorAll('button')]
        .find(button => button.textContent.includes('Video không chạy? Tải lại')).click());
      await page.waitForFunction(() => document.querySelector('video') !== window.__originalVideo);
      await page.$eval('video', video => {
        // Browsers can report position zero before replacement metadata arrives.
        Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 0 });
        video.dispatchEvent(new Event('timeupdate'));
        Object.defineProperty(video, 'duration', { configurable: true, value: 8292 });
        video.dispatchEvent(new Event('loadedmetadata'));
      });
      assert.equal(await page.$eval('video', video => video.currentTime), 143);
      await page.close();
    });
    await t.test('a real media decode failure still shows recovery controls', async () => {
      const page = await open();
      await page.$eval('video', video => {
        Object.defineProperty(video, 'error', { configurable: true, value: { code: 3 } });
        video.dispatchEvent(new Event('error'));
      });
      await page.waitForFunction(() => document.body.textContent.includes('Thiết bị không giải mã được'));
      assert.ok(await page.evaluate(() => [...document.querySelectorAll('button')]
        .some(button => button.textContent.trim() === 'Tải lại video')));
      await page.close();
    });
    await t.test('YouTube mounts safely in StrictMode and embedded links cannot open a tab', async () => {
      const page = await open({ source: 'https://youtu.be/M7lc1UVf-VE', provider: 'youtube' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const embed = await page.$eval('iframe', iframe => ({ src: iframe.src, sandbox: iframe.getAttribute('sandbox'), referrer: iframe.referrerPolicy }));
      assert.ok(embed.src.startsWith('https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?'));
      assert.ok(embed.src.includes('origin='));
      assert.equal(embed.referrer, 'strict-origin-when-cross-origin');
      assert.ok(!/allow-popups|allow-top-navigation/.test(embed.sandbox));
      const frame = await (await page.$('iframe')).contentFrame();
      await frame.waitForSelector('#watch');
      const before = (await browser.pages()).length;
      await frame.click('#watch');
      await new Promise(resolve => setTimeout(resolve, 150));
      assert.equal((await browser.pages()).length, before);
      await page.evaluate(() => window.__youtubePlayers.at(-1).playVideo());
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.ok(await page.$('iframe'), 'parent playback updates must keep the player mounted');
      await page.evaluate(() => window.__youtubePlayers.at(-1).events.onStateChange({ data: 0 }));
      assert.equal(await page.evaluate(() => window.__ended), 1);
      assert.deepEqual(errors, []);
      await page.close();
    });
    await t.test('YouTube embedding restrictions show an actionable message', async () => {
      const page = await open({ source: 'https://youtu.be/M7lc1UVf-VE', provider: 'youtube' });
      await page.evaluate(() => window.__youtubePlayers.at(-1).events.onError({ data: 150 }));
      await page.waitForFunction(() => document.body.textContent.includes('Cho phép nhúng'));
      await page.close();
    });
  } finally {
    await browser?.close();
    await server.close();
  }
});
