import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  await page.goto('http://localhost:5173/admin/storage', { waitUntil: 'networkidle0' });
  
  // Set up auth or state if necessary. Actually the /api/s3-multipart does not check auth! It uses Cloudflare env.
  // We can just run the upload function manually in the page context!
  
  try {
    const result = await page.evaluate(async () => {
      window.logUpload = [];
      const _log = (m) => window.logUpload.push(m);
      _log('Getting file function');
      
      try {
        const fileContent = "hello world";
        const file = new File([fileContent], "test.txt", { type: "text/plain" });
        
        // requestJson is in src/utils/s3UploadService.js
        // Instead of calling the module (which isn't exposed globally), let's just fetch /api/s3-multipart/init directly!
        
        _log('Fetching /init');
        const resInit = await fetch('/api/s3-multipart/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, fileSize: file.size, folder: 'test' })
        });
        
        _log('Init response status: ' + resInit.status);
        const initText = await resInit.text();
        _log('Init body: ' + initText);
        
        if (resInit.ok) {
           const initData = JSON.parse(initText);
           _log('Fetching /sign-part');
           const resSign = await fetch('/api/s3-multipart/sign-part', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({ key: initData.key, uploadId: initData.uploadId, partNumber: 1 })
           });
           _log('Sign-part status: ' + resSign.status);
           const signText = await resSign.text();
           _log('Sign body: ' + signText);
           
           if (resSign.ok) {
              const signData = JSON.parse(signText);
              
              let uploadUrl = signData.url;
              if (uploadUrl.includes('s3-hn1-api.longvan.vn')) {
                 const urlObj = new URL(uploadUrl);
                 uploadUrl = '/s3-proxy' + urlObj.pathname + urlObj.search;
              }
              
              _log('Uploading to proxied url: ' + uploadUrl);
              
              const resS3 = await fetch(uploadUrl, {
                 method: 'PUT',
                 body: file
              });
              
              _log('S3 response status: ' + resS3.status);
              _log('S3 response: ' + await resS3.text());
              
              const etag = resS3.headers.get('ETag') || resS3.headers.get('etag');
              _log('ETag: ' + etag);
           }
        }
      } catch (e) {
         _log('Exception: ' + e.message);
      }
      return window.logUpload;
    });
    console.log(result.join('\n'));
  } catch(e) {
    console.log('Script Error:', e);
  }
  
  await browser.close();
})();
