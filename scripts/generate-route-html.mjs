import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeRoutePath } from "../src/seo/routeSeo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const distIndexPath = path.join(distDir, "index.html");
const manifestPath = path.join(projectRoot, ".seo-build", "routes.json");

const escapeAttribute = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const replaceOrThrow = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) {
    throw new Error(`Không tìm thấy thẻ ${label} trong dist/index.html`);
  }
  return html.replace(pattern, replacement);
};

const applySeoToHtml = (html, seo) => {
  let nextHtml = html;

  nextHtml = replaceOrThrow(
    nextHtml,
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title data-rh="true">${escapeAttribute(seo.title)}</title>`,
    "title",
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bname=["']description["'][^>]*>/i,
    `<meta data-rh="true" name="description" content="${escapeAttribute(seo.description)}" />`,
    "meta description",
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bname=["']robots["'][^>]*>/i,
    `<meta data-rh="true" name="robots" content="${escapeAttribute(seo.robots)}" />`,
    "meta robots",
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<link\b[^>]*\brel=["']canonical["'][^>]*>/i,
    `<link data-rh="true" rel="canonical" href="${escapeAttribute(seo.url)}" />`,
    "canonical",
  );

  const replacements = [
    [
      /<meta\b[^>]*\bproperty=["']og:type["'][^>]*>/i,
      `<meta data-rh="true" property="og:type" content="${escapeAttribute(seo.type)}" />`,
      "og:type",
    ],
    [
      /<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/i,
      `<meta data-rh="true" property="og:url" content="${escapeAttribute(seo.url)}" />`,
      "og:url",
    ],
    [
      /<meta\b[^>]*\bproperty=["']og:title["'][^>]*>/i,
      `<meta data-rh="true" property="og:title" content="${escapeAttribute(seo.title)}" />`,
      "og:title",
    ],
    [
      /<meta\b[^>]*\bproperty=["']og:description["'][^>]*>/i,
      `<meta data-rh="true" property="og:description" content="${escapeAttribute(seo.description)}" />`,
      "og:description",
    ],
    [
      /<meta\b[^>]*\bproperty=["']og:image["'][^>]*>/i,
      `<meta data-rh="true" property="og:image" content="${escapeAttribute(seo.image)}" />`,
      "og:image",
    ],
    [
      /<meta\b[^>]*\b(?:name|property)=["']twitter:url["'][^>]*>/i,
      `<meta data-rh="true" name="twitter:url" content="${escapeAttribute(seo.url)}" />`,
      "twitter:url",
    ],
    [
      /<meta\b[^>]*\b(?:name|property)=["']twitter:title["'][^>]*>/i,
      `<meta data-rh="true" name="twitter:title" content="${escapeAttribute(seo.title)}" />`,
      "twitter:title",
    ],
    [
      /<meta\b[^>]*\b(?:name|property)=["']twitter:description["'][^>]*>/i,
      `<meta data-rh="true" name="twitter:description" content="${escapeAttribute(seo.description)}" />`,
      "twitter:description",
    ],
    [
      /<meta\b[^>]*\b(?:name|property)=["']twitter:image["'][^>]*>/i,
      `<meta data-rh="true" name="twitter:image" content="${escapeAttribute(seo.image)}" />`,
      "twitter:image",
    ],
  ];

  for (const [pattern, replacement, label] of replacements) {
    nextHtml = replaceOrThrow(nextHtml, pattern, replacement, label);
  }

  return nextHtml;
};

const createSpaShell = (html) =>
  html
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/i, "")
    .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>\s*/i, "");

const outputPathForRoute = (routePath) => {
  const normalizedPath = normalizeRoutePath(routePath);
  if (normalizedPath === "/") return distIndexPath;

  const relativePath = normalizedPath.replace(/^\//, "");
  if (
    !relativePath ||
    relativePath.includes("..") ||
    /[<>:"|?*\\]/.test(relativePath)
  ) {
    throw new Error(`Route không an toàn để sinh HTML: ${routePath}`);
  }

  return path.join(distDir, `${relativePath}.html`);
};

const baseHtml = await readFile(distIndexPath, "utf8");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (!Array.isArray(manifest.routes) || manifest.routes.length === 0) {
  throw new Error("SEO route manifest trống hoặc không hợp lệ.");
}

await writeFile(path.join(distDir, "spa.html"), createSpaShell(baseHtml), "utf8");

for (const route of manifest.routes) {
  const outputPath = outputPathForRoute(route.path);
  const html = applySeoToHtml(baseHtml, route);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

console.log(
  `[route-html] Đã sinh ${manifest.routes.length} HTML route-specific và SPA shell.`,
);
