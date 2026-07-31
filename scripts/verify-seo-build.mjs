import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeRoutePath } from "../src/seo/routeSeo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const manifestPath = path.join(projectRoot, ".seo-build", "routes.json");

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const routeFilePath = (routePath) => {
  const normalized = normalizeRoutePath(routePath);
  return normalized === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, `${normalized.replace(/^\//, "")}.html`);
};

const countMatches = (value, pattern) => (value.match(pattern) || []).length;
const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const metaContentFromHtml = (html, attributeName, attributeValue) => {
  const tag = html.match(
    new RegExp(
      `<meta\\b[^>]*\\b${escapeRegExp(attributeName)}=["']${escapeRegExp(attributeValue)}["'][^>]*>`,
      "i",
    ),
  )?.[0];
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || "";
};
const canonicalFromHtml = (html) =>
  html.match(
    /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i,
  )?.[1] || "";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const sitemap = await readFile(path.join(distDir, "sitemap.xml"), "utf8");
const spaHtml = await readFile(path.join(distDir, "spa.html"), "utf8");
const redirects = await readFile(path.join(distDir, "_redirects"), "utf8");
const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");

const expectedRobots = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin/",
  "",
  "Sitemap: https://luathapdan.vn/sitemap.xml",
].join("\n");

assert(
  robots.replace(/\r\n/g, "\n").trim() === expectedRobots,
  "robots.txt không đúng chính sách crawl đã duyệt.",
);
for (const crawler of [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
]) {
  const crawlerBlock = new RegExp(
    `User-agent:\\s*${escapeRegExp(crawler)}[\\s\\S]*?Disallow:\\s*/(?:\\s|$)`,
    "i",
  );
  assert(
    !crawlerBlock.test(robots),
    `robots.txt đang chặn ${crawler}.`,
  );
}

assert(
  countMatches(spaHtml, /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi) === 0,
  "spa.html không được chứa canonical tĩnh.",
);
assert(
  countMatches(spaHtml, /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi) === 0,
  "spa.html không được chứa robots tĩnh.",
);
assert(
  !/^\s*\/\*\s+\/index\.html\s+200\s*$/m.test(redirects),
  "_redirects vẫn còn wildcard SPA rewrite gây soft 404.",
);

const routeMap = new Map(manifest.routes.map((route) => [route.path, route]));

for (const route of manifest.routes) {
  const filePath = routeFilePath(route.path);
  try {
    await access(filePath);
  } catch {
    errors.push(`Thiếu HTML cho route ${route.path}`);
    continue;
  }

  const html = await readFile(filePath, "utf8");
  assert(
    countMatches(html, /<title\b[^>]*>/gi) === 1,
    `${route.path}: phải có đúng một title.`,
  );
  assert(
    countMatches(
      html,
      /<meta\b[^>]*\bname=["']description["'][^>]*>/gi,
    ) === 1,
    `${route.path}: phải có đúng một meta description.`,
  );
  assert(
    countMatches(
      html,
      /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,
    ) === 1,
    `${route.path}: phải có đúng một meta robots.`,
  );
  assert(
    countMatches(
      html,
      /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,
    ) === 1,
    `${route.path}: phải có đúng một canonical.`,
  );
  assert(
    canonicalFromHtml(html) === route.url,
    `${route.path}: canonical không khớp ${route.url}.`,
  );
  for (const property of [
    "og:type",
    "og:url",
    "og:title",
    "og:description",
    "og:image",
  ]) {
    assert(
      countMatches(
        html,
        new RegExp(
          `<meta\\b[^>]*\\bproperty=["']${escapeRegExp(property)}["'][^>]*>`,
          "gi",
        ),
      ) === 1,
      `${route.path}: phải có đúng một thẻ ${property}.`,
    );
  }
  assert(
    metaContentFromHtml(html, "property", "og:url") === route.url,
    `${route.path}: og:url không khớp canonical.`,
  );
  assert(
    !html.includes("https://maliedu.vn"),
    `${route.path}: còn sót domain maliedu.vn trong HTML.`,
  );
}

const sitemapUrls = Array.from(
  sitemap.matchAll(/<loc>(https:\/\/luathapdan\.vn[^<]*)<\/loc>/g),
  (match) => match[1],
);

assert(sitemapUrls.length > 0, "Sitemap không có URL.");
assert(
  !/<changefreq>|<priority>/i.test(sitemap),
  "Sitemap không nên chứa changefreq hoặc priority.",
);
assert(
  new Set(sitemapUrls).size === sitemapUrls.length,
  "Sitemap có URL trùng lặp.",
);

const sitemapUrlBlocks = Array.from(
  sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g),
  (match) => match[1],
);
assert(
  sitemapUrlBlocks.length === sitemapUrls.length,
  "Không đọc được đầy đủ các khối URL trong sitemap.",
);
for (const block of sitemapUrlBlocks) {
  assert(
    countMatches(block, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) === 1,
    "Mỗi URL sitemap phải có đúng một lastmod dạng YYYY-MM-DD.",
  );
}

for (const urlValue of sitemapUrls) {
  const url = new URL(urlValue);
  const routePath = normalizeRoutePath(url.pathname);
  assert(
    url.pathname === "/" || !url.pathname.endsWith("/"),
    `Sitemap chứa URL có dấu / cuối: ${urlValue}`,
  );
  assert(routeMap.has(routePath), `Sitemap URL thiếu route manifest: ${urlValue}`);
  try {
    await access(routeFilePath(routePath));
  } catch {
    errors.push(`Sitemap URL thiếu HTML đích: ${urlValue}`);
  }
}

const findNestedIndexFiles = async (directory, relative = "") => {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const nextRelative = path.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findNestedIndexFiles(absolute, nextRelative)));
    } else if (entry.name === "index.html" && relative) {
      found.push(nextRelative);
    }
  }
  return found;
};

const nestedIndexes = await findNestedIndexFiles(distDir);
assert(
  nestedIndexes.length === 0,
  `Còn route dạng thư mục gây redirect dấu / cuối: ${nestedIndexes.join(", ")}`,
);

if (errors.length) {
  throw new Error(`[seo-verify]\n- ${errors.join("\n- ")}`);
}

console.log(
  `[seo-verify] Đạt: ${manifest.routes.length} HTML route-specific, ${sitemapUrls.length} sitemap URL.`,
);
