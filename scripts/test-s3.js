import { signMultipartUploadPart, createMultipartUpload } from '../functions/_lib/s3Multipart.js';

(async () => {
  const env = {
    VITE_S3_ENDPOINT: 'https://s3-hn1-api.longvan.vn',
    VITE_S3_REGION: 'hn1',
    VITE_S3_ACCESS_KEY: 'TAJOBJEYD7NSX6XWZYPE',
    VITE_S3_SECRET_KEY: 'JwE7LFmRt8YL2v0yvr4e2ALhRZmNWjPMpUUvS85P',
    VITE_S3_BUCKET: 'video-khoa-hoc'
  };

  try {
    const init = await createMultipartUpload(env, {
      fileName: 'test.txt',
      fileSize: 11, // "hello world"
      contentType: 'text/plain',
      folder: 'test'
    });
    
    console.log('Init:', init);
    
    const sign = await signMultipartUploadPart(env, {
      key: init.key,
      uploadId: init.uploadId,
      partNumber: 1
    });
    
    console.log('Sign URL:', sign.url);
    
    const res = await fetch(sign.url, {
       method: 'PUT',
       body: 'hello world'
    });
    
    console.log('S3 Status:', res.status);
    console.log('S3 Response:', await res.text());
  } catch (err) {
    console.error(err);
  }
})();
