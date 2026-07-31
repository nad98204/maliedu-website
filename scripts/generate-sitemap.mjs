import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  getResolvedSeo,
  normalizeRoutePath,
  ROUTE_SEO,
  SITE_URL,
  STATIC_LASTMOD,
} from "../src/seo/routeSeo.js";
import { MALI_LOGO_URL } from "../src/constants/brandAssets.js";
import { FIREBASE_PUBLIC_CONFIG } from "../src/constants/firebasePublicConfig.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const localEnvPath = path.join(projectRoot, ".env");
if (fs.existsSync(localEnvPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(localEnvPath);
}

const isTruthy = (value) =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const allowStaticOnly = isTruthy(process.env.ALLOW_STATIC_SITEMAP);
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

let db = null;
let usePublicFirestore = false;
if (projectId && clientEmail && rawPrivateKey) {
  let admin;
  try {
    admin = require("firebase-admin");
  } catch {
    throw new Error(
      "firebase-admin chưa được cài đặt. Chạy npm install trước khi sinh sitemap.",
    );
  }
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  db = admin.firestore();
  console.log(`[sitemap] Đã kết nối Firestore project ${projectId}.`);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  let admin;
  try {
    admin = require("firebase-admin");
  } catch {
    throw new Error(
      "firebase-admin chưa được cài đặt. Chạy npm install trước khi sinh sitemap.",
    );
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  db = admin.firestore();
  console.log("[sitemap] Đã kết nối Firestore bằng Application Default Credentials.");
} else {
  usePublicFirestore = true;
  console.log(
    "[sitemap] Không có Firebase Admin credentials; dùng Firestore REST công khai cho nội dung đã xuất bản.",
  );
}

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;");

const decodeBasicEntities = (value) =>
  String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const toPlainText = (value, maxLength = 160) => {
  const text = decodeBasicEntities(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

const toDateString = (value) => {
  if (!value) return undefined;
  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().split("T")[0];
};

const sitemapEntries = new Map();
const routeManifest = new Map();
const generatedOn = new Date().toISOString().split("T")[0];
const counters = {
  static: 0,
  courses: 0,
  posts: 0,
  jobs: 0,
};

const organizationSchema = {
  "@type": "Organization",
  name: "Mali Edu",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: MALI_LOGO_URL,
  },
};

const createBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

const addManifestRoute = (routePath, input = {}) => {
  const normalizedPath = normalizeRoutePath(routePath);
  const resolved = getResolvedSeo({
    ...input,
    url: input.url || normalizedPath,
  });
  const manifestRoute = {
    path: normalizedPath,
    title: resolved.title,
    description: resolved.description,
    image: resolved.image,
    url: resolved.url,
    type: resolved.type,
    robots: resolved.robots,
    sitemap: input.sitemap ?? resolved.sitemap ?? false,
  };
  if (Array.isArray(input.jsonLd) && input.jsonLd.length > 0) {
    manifestRoute.jsonLd = input.jsonLd;
  }
  routeManifest.set(normalizedPath, manifestRoute);
  return routeManifest.get(normalizedPath);
};

const addSitemapEntry = ({
  path: routePath,
  seo,
  lastmod,
}) => {
  const normalizedPath = normalizeRoutePath(routePath);
  sitemapEntries.set(normalizedPath, {
    loc: seo.url,
    lastmod: lastmod || generatedOn,
  });
};

for (const [routePath, routeConfig] of Object.entries(ROUTE_SEO)) {
  const seo = addManifestRoute(routePath, routeConfig);
  if (routeConfig.sitemap) {
    addSitemapEntry({
      path: routePath,
      seo,
      lastmod: routeConfig.lastmod || STATIC_LASTMOD,
    });
    counters.static += 1;
  }
}

const addDynamicRoute = ({
  path: routePath,
  title,
  description,
  image,
  type = "article",
  lastmod,
  createJsonLd,
}) => {
  const seo = addManifestRoute(routePath, {
    title,
    description: toPlainText(description) || undefined,
    image,
    type,
    robots:
      "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    sitemap: true,
  });
  const jsonLd = createJsonLd?.(seo);
  if (Array.isArray(jsonLd) && jsonLd.length > 0) {
    seo.jsonLd = jsonLd;
  }
  addSitemapEntry({
    path: routePath,
    seo,
    lastmod,
  });
};

const decodeFirestoreValue = (value = {}) => {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nestedValue]) => [
        key,
        decodeFirestoreValue(nestedValue),
      ]),
    );
  }
  return undefined;
};

const decodeRestDocument = (document) => ({
  id: String(document.name || "").split("/").pop(),
  data: Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [
      key,
      decodeFirestoreValue(value),
    ]),
  ),
});

const fetchPublicCollection = async (collectionName, { publishedOnly }) => {
  const { apiKey, projectId: publicProjectId } = FIREBASE_PUBLIC_CONFIG;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${publicProjectId}/databases/(default)/documents:runQuery?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${SITE_URL}/`,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          ...(publishedOnly
            ? {
                where: {
                  fieldFilter: {
                    field: { fieldPath: "isPublished" },
                    op: "EQUAL",
                    value: { booleanValue: true },
                  },
                },
              }
            : {}),
          limit: 1000,
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Firestore REST không đọc được collection ${collectionName} (HTTP ${response.status}).`,
    );
  }
  const results = await response.json();
  return results
    .map((item) => item.document)
    .filter(Boolean)
    .map(decodeRestDocument);
};

const fetchAdminCollection = async (collectionName, { publishedOnly }) => {
  let query = db.collection(collectionName);
  if (publishedOnly) query = query.where("isPublished", "==", true);
  const snapshot = await query.get();
  return snapshot.docs.map((document) => ({
    id: document.id,
    data: document.data(),
  }));
};

const fetchCollection = (collectionName, options) =>
  db
    ? fetchAdminCollection(collectionName, options)
    : fetchPublicCollection(collectionName, options);

if (db || usePublicFirestore) {
  let courseDocuments = [];
  let postDocuments = [];
  let jobDocuments = [];

  try {
    [courseDocuments, postDocuments] = await Promise.all([
      fetchCollection("courses", { publishedOnly: true }),
      fetchCollection("posts", { publishedOnly: true }),
    ]);
  } catch (error) {
    if (!allowStaticOnly) {
      throw new Error(
        `[sitemap] Không thể lấy dữ liệu động; build dừng để tránh sitemap thiếu nội dung. ${error.message}`,
      );
    }
    console.warn(
      `[sitemap] ALLOW_STATIC_SITEMAP=true: bỏ qua dữ liệu động. ${error.message}`,
    );
  }

  try {
    jobDocuments = await fetchCollection("jobs", { publishedOnly: false });
  } catch (error) {
    console.warn(
      `[sitemap] Không thể đọc tuyển dụng công khai; bỏ qua URL tuyển dụng động. ${error.message}`,
    );
  }

  courseDocuments.forEach((document) => {
    const data = document.data;
    const slug = String(data.slug || document.id || "").trim();
    if (!slug) return;
    const routePath = `/khoa-hoc/${slug}`;
    addDynamicRoute({
      path: routePath,
      title: data.seoTitle || data.name || data.title || "Khóa học",
      description:
        data.seoDescription ||
        data.shortDescription ||
        data.description ||
        "Khóa học trực tuyến tại Mali Edu.",
      image: data.thumbnailUrl || data.imageUrl,
      type: "product",
      lastmod: toDateString(data.updatedAt || data.createdAt),
      createJsonLd: (seo) => [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: seo.title,
          description: seo.description,
          url: seo.url,
          image: seo.image,
          provider: organizationSchema,
          ...(data.instructorName
            ? {
                instructor: {
                  "@type": "Person",
                  name: data.instructorName,
                },
              }
            : {}),
        },
        createBreadcrumbSchema([
          { name: "Trang chủ", url: `${SITE_URL}/` },
          { name: "Khóa học", url: `${SITE_URL}/khoa-hoc` },
          { name: seo.title, url: seo.url },
        ]),
      ],
    });
    counters.courses += 1;
  });

  postDocuments.forEach((document) => {
    const data = document.data;
    const slug = String(data.slug || document.id || "").trim();
    if (!slug) return;
    const routePath = `/tin-tuc/${slug}`;
    const publishedAt = toDateString(data.createdAt);
    const modifiedAt = toDateString(data.updatedAt || data.createdAt);
    addDynamicRoute({
      path: routePath,
      title: data.seoTitle || data.title || "Bài viết",
      description:
        data.seoDescription ||
        data.excerpt ||
        data.summary ||
        "Bài viết mới từ Mali Edu.",
      image: data.thumbnailUrl || data.imageUrl,
      type: "article",
      lastmod: modifiedAt,
      createJsonLd: (seo) => [
        {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: seo.title,
          description: seo.description,
          image: [seo.image],
          ...(publishedAt ? { datePublished: publishedAt } : {}),
          ...(modifiedAt ? { dateModified: modifiedAt } : {}),
          author: {
            "@type": "Person",
            name: data.author || "Mali Edu",
          },
          publisher: organizationSchema,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": seo.url,
          },
        },
        createBreadcrumbSchema([
          { name: "Trang chủ", url: `${SITE_URL}/` },
          { name: "Tin tức", url: `${SITE_URL}/tin-tuc` },
          { name: seo.title, url: seo.url },
        ]),
      ],
    });
    counters.posts += 1;
  });

  jobDocuments.forEach((document) => {
    const data = document.data;
    if (data.isPublished === false) return;
    const slug = String(data.slug || document.id || "").trim();
    if (!slug) return;
    addDynamicRoute({
      path: `/tuyen-dung/${slug}`,
      title: `${data.title || "Cơ hội nghề nghiệp"} - Tuyển dụng Mali Edu`,
      description:
        data.seoDescription ||
        data.excerpt ||
        data.description ||
        `Khám phá cơ hội nghề nghiệp ${data.title || ""} tại Mali Edu.`,
      image: data.thumbnailUrl || data.imageUrl,
      type: "article",
      lastmod: toDateString(data.updatedAt || data.createdAt),
    });
    counters.jobs += 1;
  });
}

const urlEntry = ({ loc, lastmod }) =>
  [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "  </url>",
  ]
    .join("\n");

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<!-- Sitemap tự động sinh lúc build – ${generatedOn} -->`,
  `<!-- Tổng URL: ${sitemapEntries.size} (tĩnh: ${counters.static}, khóa học: ${counters.courses}, bài viết: ${counters.posts}, tuyển dụng: ${counters.jobs}) -->`,
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
  '  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
  '  http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
  ...Array.from(sitemapEntries.values(), urlEntry),
  "</urlset>",
].join("\n");

const publicDir = path.join(projectRoot, "public");
const manifestDir = path.join(projectRoot, ".seo-build");
const sitemapPath = path.join(publicDir, "sitemap.xml");
const manifestPath = path.join(manifestDir, "routes.json");

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(manifestDir, { recursive: true });
fs.writeFileSync(sitemapPath, `${sitemapXml}\n`, "utf8");
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      siteUrl: SITE_URL,
      counters,
      routes: Array.from(routeManifest.values()),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `[sitemap] Đã sinh ${sitemapEntries.size} URL và ${routeManifest.size} cấu hình HTML SEO.`,
);
