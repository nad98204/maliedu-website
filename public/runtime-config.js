// Runtime overrides template for production deploys.
// The build step overwrites dist/runtime-config.js from env when available.
// Only non-sensitive S3 location data belongs here. Upload credentials stay server-side.
window.__MALI_RUNTIME_CONFIG__ = window.__MALI_RUNTIME_CONFIG__ || {};
window.__MALI_RUNTIME_CONFIG__.s3 = window.__MALI_RUNTIME_CONFIG__.s3 || {
  region: '',
  endpoint: '',
  bucket: '',
};
