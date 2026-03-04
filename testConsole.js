import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
