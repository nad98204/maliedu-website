// Runtime overrides template for production deploys.
// The build step overwrites dist/runtime-config.js from env when available.
// Client-side S3 keys are public. Prefer presigned uploads for stricter security.
window.__MALI_RUNTIME_CONFIG__ = window.__MALI_RUNTIME_CONFIG__ || {};
window.__MALI_RUNTIME_CONFIG__.s3 = window.__MALI_RUNTIME_CONFIG__.s3 || {
  region: '',
  endpoint: '',
  bucket: '',
};
