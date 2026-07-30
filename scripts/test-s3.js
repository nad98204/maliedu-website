import process from "node:process";

import { loadEnv } from "vite";

import {
  abortMultipartUpload,
  createMultipartUpload,
  validateHealthcheck,
} from "../functions/_lib/s3MultipartV3.js";

const loadedEnv = loadEnv("development", process.cwd(), "");
const env = { ...loadedEnv, ...process.env };

validateHealthcheck(env);
const upload = await createMultipartUpload(env, {
  contentType: "text/plain",
  fileName: "security-smoke-test.txt",
  fileSize: 32,
  folder: "files/security-tests",
});

await abortMultipartUpload(env, {
  key: upload.key,
  uploadId: upload.uploadId,
});

console.log("S3 server-side signing smoke test passed.");
