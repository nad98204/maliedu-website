import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTE_SEO, getResolvedSeo, normalizeRoutePath } from "../src/seo/routeSeo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const distIndexPath = path.join(distDir, "index.html");

const escapeAttribute = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const replaceOrThrow = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) {
    throw new Error(`Khong tim thay the ${label} trong dist/index.html`);
  }

  return html.replace(pattern, replacement);
};

const applySeoToHtml = (html, seo) => {
  let nextHtml = html;

  nextHtml = replaceOrThrow(
    nextHtml,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeAttribute(seo.title)}</title>`,
    "title"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bname="description"[^>]*>/i,
    `<meta name="description" content="${escapeAttribute(seo.description)}" />`,
    "meta description"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeAttribute(seo.url)}" />`,
    "canonical"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="og:type"[^>]*>/i,
    `<meta property="og:type" content="${escapeAttribute(seo.type)}" />`,
    "og:type"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="og:url"[^>]*>/i,
    `<meta property="og:url" content="${escapeAttribute(seo.url)}" />`,
    "og:url"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeAttribute(seo.title)}" />`,
    "og:title"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeAttribute(seo.description)}" />`,
    "og:description"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="og:image"[^>]*>/i,
    `<meta property="og:image" content="${escapeAttribute(seo.image)}" />`,
    "og:image"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="twitter:url"[^>]*>/i,
    `<meta property="twitter:url" content="${escapeAttribute(seo.url)}" />`,
    "twitter:url"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="twitter:title"[^>]*>/i,
    `<meta property="twitter:title" content="${escapeAttribute(seo.title)}" />`,
    "twitter:title"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="twitter:description"[^>]*>/i,
    `<meta property="twitter:description" content="${escapeAttribute(seo.description)}" />`,
    "twitter:description"
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta\b[^>]*\bproperty="twitter:image"[^>]*>/i,
    `<meta property="twitter:image" content="${escapeAttribute(seo.image)}" />`,
    "twitter:image"
  );

  return nextHtml;
};

const generateRouteHtml = async () => {
  const baseHtml = await readFile(distIndexPath, "utf8");

  for (const routePath of Object.keys(ROUTE_SEO)) {
    const normalizedPath = normalizeRoutePath(routePath);
    const outputDir = path.join(distDir, normalizedPath.replace(/^\//, ""));
    const outputPath = path.join(outputDir, "index.html");
    const seo = getResolvedSeo(normalizedPath);
    const html = applySeoToHtml(baseHtml, seo);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, html, "utf8");

    console.log(`Generated SEO HTML for ${normalizedPath}`);
  }
};

generateRouteHtml().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
