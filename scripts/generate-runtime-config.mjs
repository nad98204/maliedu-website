import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const outputPath = path.join(distDir, "runtime-config.js");

const loadedEnv = loadEnv("production", projectRoot, "");
const env = {
  ...loadedEnv,
  ...process.env,
};

const getTrimmedValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const s3Config = {
  region: getTrimmedValue(env.VITE_S3_REGION) || "hn1",
  endpoint: getTrimmedValue(env.VITE_S3_ENDPOINT),
  accessKeyId: getTrimmedValue(env.VITE_S3_ACCESS_KEY),
  secretAccessKey: getTrimmedValue(env.VITE_S3_SECRET_KEY),
  bucket: getTrimmedValue(env.VITE_S3_BUCKET),
};

const missingKeys = [
  ["VITE_S3_ENDPOINT", s3Config.endpoint],
  ["VITE_S3_ACCESS_KEY", s3Config.accessKeyId],
  ["VITE_S3_SECRET_KEY", s3Config.secretAccessKey],
  ["VITE_S3_BUCKET", s3Config.bucket],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingKeys.length) {
  console.warn(
    `[runtime-config] Missing S3 values: ${missingKeys.join(
      ", ",
    )}. dist/runtime-config.js will still be generated, but uploads can fail.`,
  );
}

const runtimeConfigContent = `// Auto-generated during build.
// Edit the deployed /runtime-config.js only for emergency hotfixes.
window.__MALI_RUNTIME_CONFIG__ = window.__MALI_RUNTIME_CONFIG__ || {};
window.__MALI_RUNTIME_CONFIG__.s3 = ${JSON.stringify(s3Config, null, 2)};
`;

await mkdir(distDir, { recursive: true });
await writeFile(outputPath, runtimeConfigContent, "utf8");

console.log(`[runtime-config] Generated ${path.relative(projectRoot, outputPath)}`);
