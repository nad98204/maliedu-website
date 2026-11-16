// CAPI credentials belong in Firebase Secret Manager, never in public Firestore.
// Supply a new token through: firebase functions:secrets:set META_CAPI_ACCESS_TOKEN --project maliedu-web
console.error('Legacy public-token configuration is disabled. Configure META_CAPI_ACCESS_TOKEN in Secret Manager.');
process.exitCode = 1;
