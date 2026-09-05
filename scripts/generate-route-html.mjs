import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { normalizeRoutePath } from "../src/seo/routeSeo.js";
import { isKhoiThongStylePath } from "../src/styles/landingPaths.js";
import { HERO_TITLE, HERO_TITLE_SRCSET, HERO_TITLE_SIZES, HERO_POSTER, HERO_POSTER_SRCSET, HERO_POSTER_SIZES } from "../src/landing-templates/khoi-thong-dong-tien/heroAssets.js";

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

const injectPrerenderRouteMarker = (html, routePath) => {
  const normalizedPath = normalizeRoutePath(routePath);
  const marker =
    `    <meta name="seo-prerender-route" ` +
    `content="${escapeAttribute(encodeURIComponent(normalizedPath))}" />`;

  return replaceOrThrow(
    html,
    /<\/head>/i,
    `${marker}\n  </head>`,
    "đóng head để chèn prerender route marker",
  );
};

const injectJsonLd = (html, schemas = []) => {
  if (!Array.isArray(schemas) || schemas.length === 0) return html;

  const scripts = schemas
    .map(
      (schema) =>
        `    <script data-rh="true" data-seo-json-ld="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");

  return replaceOrThrow(
    html,
    /<\/head>/i,
    `${scripts}\n  </head>`,
    "đóng head để chèn JSON-LD",
  );
};

const injectPreloadImages = (html, images = []) => {
  if (!Array.isArray(images) || images.length === 0) return html;

  const links = images
    .filter((image) => image?.href)
    .map(
      (image) =>
        `    <link rel="preload" as="image" href="${escapeAttribute(image.href)}" fetchpriority="high"${
          image.media ? ` media="${escapeAttribute(image.media)}"` : ""
        } />`,
    )
    .join("\n");

  return replaceOrThrow(
    html,
    /<\/head>/i,
    `${links}\n  </head>`,
    "đóng head để chèn preload ảnh",
  );
};

const injectPrerenderBody = (html, bodyHtml) => {
  if (!bodyHtml) return html;
  return replaceOrThrow(
    html,
    /<div\s+id=["']root["']>\s*<\/div>/i,
    `<div id="root">\n${bodyHtml}\n  </div>`,
    "root để chèn nội dung prerender",
  );
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

  nextHtml = injectJsonLd(nextHtml, seo.jsonLd);
  nextHtml = injectPreloadImages(nextHtml, seo.preloadImages);
  nextHtml = injectPrerenderBody(nextHtml, seo.prerenderBodyHtml);
  return injectPrerenderRouteMarker(nextHtml, seo.path);
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
const assets = JSON.parse(await readFile(path.join(distDir, ".vite/manifest.json"), "utf8"));
const landingCss = await readFile(path.join(distDir, assets["src/styles/landing.css"].file), "utf8");
const { renderLanding } = await import(pathToFileURL(path.join(projectRoot, ".seo-build/ssr/landing-ssr.js")));

const addRouteResources = (html, routePath) => {
  const landing = isKhoiThongStylePath(routePath);
  const cssEntry = assets[landing ? "src/styles/landing.css" : "src/index.css"];
  if (!cssEntry) throw new Error(`Missing stylesheet for ${routePath}`);
  // The small funnel stylesheet paints the prerendered hero without a CSS round trip.
  // RouteStyles reuses this style on hydration; client navigations load the CSS chunk.
  const links = [landing
    ? `<style data-landing-css>${landingCss}</style>`
    : `<link rel="stylesheet" crossorigin href="/${cssEntry.file}">`];
  if (landing) {
    html = html.replace(/<link\b[^>]*href="https:\/\/(?:s3-hn1-api\.longvan\.vn|fonts\.gstatic\.com|fonts\.googleapis\.com)[^"]*"[^>]*>\s*/g, "");
  }
  if (landing && routePath !== "/cam-on-khoi-thong") {
    for (const [href, srcset, sizes] of [[HERO_POSTER, HERO_POSTER_SRCSET, HERO_POSTER_SIZES], [HERO_TITLE, HERO_TITLE_SRCSET, HERO_TITLE_SIZES]]) {
      links.unshift(`<link rel="preload" as="image" type="image/avif" href="${href}" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high">`);
    }
    // Hydrated HTML paints independently; avoid preloading the JS dependency graph
    // ahead of the hero images. Vite loads those modules when hydration needs them.
  }
  return html.replace(/(<meta charset="UTF-8"\s*\/>)/, `$1\n${links.join("\n")}`);
};

if (!Array.isArray(manifest.routes) || manifest.routes.length === 0) {
  throw new Error("SEO route manifest trống hoặc không hợp lệ.");
}

await writeFile(path.join(distDir, "spa.html"), addRouteResources(createSpaShell(baseHtml), "/"), "utf8");

for (const route of manifest.routes) {
  const outputPath = outputPathForRoute(route.path);
  const hasHero = isKhoiThongStylePath(route.path) && route.path !== "/cam-on-khoi-thong";
  const rendered = hasHero ? await renderLanding(route.path) : null;
  let html = addRouteResources(applySeoToHtml(baseHtml, rendered ? { ...route, prerenderBodyHtml: rendered } : route), route.path);
  if (rendered) html = html.replace("</head>", '<meta name="landing-hydrated-html" content="true">\n</head>');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

console.log(
  `[route-html] Đã sinh ${manifest.routes.length} HTML route-specific và SPA shell.`,
);
