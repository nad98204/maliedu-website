import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const requiredS3Keys = [
  "region",
  "endpoint",
  "bucket",
];

const rawTarget = process.argv[2] || "dist/runtime-config.js";
const isUrlTarget = /^https?:\/\//i.test(rawTarget);
const resolvedFilePath = isUrlTarget
  ? rawTarget
  : path.resolve(projectRoot, rawTarget);

const getSourceCode = async () => {
  if (isUrlTarget) {
    const response = await fetch(rawTarget);

    if (!response.ok) {
      throw new Error(
        `[runtime-config] Failed to fetch ${rawTarget}: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  return readFile(resolvedFilePath, "utf8");
};

const checkMultipartHealth = async () => {
  if (!isUrlTarget) {
    return;
  }

  const targetUrl = new URL(rawTarget);
  const healthUrl = new URL("/api/s3-multipart/health", targetUrl.origin);
  const response = await fetch(healthUrl);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(
      `[runtime-config] Multipart healthcheck failed at ${healthUrl.toString()}`,
    );
  }
};

try {
  const sourceCode = await getSourceCode();
  const sandbox = { window: {} };

  vm.createContext(sandbox);
  vm.runInContext(sourceCode, sandbox, {
    filename: isUrlTarget ? rawTarget : resolvedFilePath,
  });

  const runtimeConfig = sandbox.window.__MALI_RUNTIME_CONFIG__ || {};
  const s3Config = runtimeConfig.s3 || {};

  const missingKeys = requiredS3Keys.filter((key) => {
    const value = s3Config[key];
    return typeof value !== "string" || !value.trim();
  });

  if (missingKeys.length) {
    throw new Error(
      `[runtime-config] Invalid ${rawTarget}. Missing S3 values: ${missingKeys.join(", ")}`,
    );
  }

  await checkMultipartHealth();
  console.log(`[runtime-config] OK: ${rawTarget}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
