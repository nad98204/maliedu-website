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
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    );

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const htmlToTextBlocks = (value, maxLength = 12000) => {
  const text = decodeBasicEntities(value || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote|section|article)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength)
    .trim();

  return text
    .split("\n")
    .filter(Boolean)
    .map((paragraph) => `      <p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
};

const createPrerenderBodyHtml = ({
  title,
  description,
  content,
  links = [],
  statusMessage,
}) => {
  const contentHtml = htmlToTextBlocks(content);
  const linksHtml = links.length
    ? [
        '      <nav aria-label="Nội dung liên quan">',
        ...links.map(
          ({ href, label }) =>
            `        <a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`,
        ),
        "      </nav>",
      ].join("\n")
    : "";

  return [
    '    <main data-seo-prerender-body="true" style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:Arial,sans-serif;line-height:1.7;color:#173e35">',
    `      <h1>${escapeHtml(title)}</h1>`,
    `      <p>${escapeHtml(description)}</p>`,
    statusMessage ? `      <p><strong>${escapeHtml(statusMessage)}</strong></p>` : "",
    contentHtml,
    linksHtml,
    "    </main>",
  ]
    .filter(Boolean)
    .join("\n");
};

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

const isExpiredDeadline = (value) => {
  if (!value) return false;
  const deadline = new Date(`${value}T23:59:59+07:00`);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
};

const toEmploymentType = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("part") || normalized.includes("bán thời gian")) {
    return "PART_TIME";
  }
  if (normalized.includes("contract") || normalized.includes("hợp đồng")) {
    return "CONTRACTOR";
  }
  if (normalized.includes("intern") || normalized.includes("thực tập")) {
    return "INTERN";
  }
  return "FULL_TIME";
};

const parseSalaryRange = (value) => {
  const amounts = String(value || "")
    .match(/\d[\d.,]*/g)
    ?.map((amount) => Number(amount.replace(/[.,]/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  if (!amounts?.length) return undefined;
  const [minValue, maxValue = minValue] = amounts;
  return {
    "@type": "MonetaryAmount",
    currency: "VND",
    value: {
      "@type": "QuantitativeValue",
      minValue,
      maxValue,
      unitText: "MONTH",
    },
  };
};

const formatCurrencyVnd = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`
    : "";
};

const dynamicLinks = { courses: [], posts: [], jobs: [] };

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
    prerenderBodyHtml:
      input.prerenderBodyHtml ||
      createPrerenderBodyHtml({
        title: resolved.title,
        description: resolved.description,
      }),
  };
  if (Array.isArray(input.preloadImages) && input.preloadImages.length > 0) {
    manifestRoute.preloadImages = input.preloadImages;
  }
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
  prerenderBodyHtml,
  robots =
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  sitemap = true,
}) => {
  const seo = addManifestRoute(routePath, {
    title,
    description: toPlainText(description) || undefined,
    image,
    type,
    robots,
    sitemap,
    prerenderBodyHtml,
  });
  const jsonLd = createJsonLd?.(seo);
  if (Array.isArray(jsonLd) && jsonLd.length > 0) {
    seo.jsonLd = jsonLd;
  }
  if (sitemap) {
    addSitemapEntry({
      path: routePath,
      seo,
      lastmod,
    });
  }
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
    const courseTitle = data.seoTitle || data.name || data.title || "Khóa học";
    const courseDescription =
      data.seoDescription ||
      data.shortDescription ||
      data.description ||
      "Khóa học trực tuyến tại Mali Edu.";
    addDynamicRoute({
      path: routePath,
      title: courseTitle,
      description: courseDescription,
      image: data.thumbnailUrl || data.imageUrl,
      type: "product",
      lastmod: toDateString(data.updatedAt || data.createdAt),
      prerenderBodyHtml: createPrerenderBodyHtml({
        title: courseTitle,
        description: toPlainText(courseDescription),
        content: [data.description, data.content].filter(Boolean).join("\n"),
        links: [{ href: routePath, label: "Xem thông tin và đăng ký khóa học" }],
      }),
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
    const displayedPrice = formatCurrencyVnd(data.salePrice || data.price);
    dynamicLinks.courses.push({
      href: routePath,
      label: displayedPrice ? `${courseTitle} – ${displayedPrice}` : courseTitle,
    });
    counters.courses += 1;
  });

  postDocuments.forEach((document) => {
    const data = document.data;
    const slug = String(data.slug || document.id || "").trim();
    if (!slug) return;
    const routePath = `/tin-tuc/${slug}`;
    const postTitle = data.seoTitle || data.title || "Bài viết";
    const postDescription =
      data.seoDescription ||
      data.excerpt ||
      data.summary ||
      "Bài viết mới từ Mali Edu.";
    const publicationValue = data.publishedAt || data.publishAt || data.createdAt;
    const publishedAt = toDateString(publicationValue);
    const modifiedAt = toDateString(data.updatedAt || publicationValue);
    addDynamicRoute({
      path: routePath,
      title: postTitle,
      description: postDescription,
      image: data.thumbnailUrl || data.imageUrl,
      type: "article",
      lastmod: modifiedAt,
      prerenderBodyHtml: createPrerenderBodyHtml({
        title: postTitle,
        description: toPlainText(postDescription),
        content: data.content,
        links: [{ href: "/tin-tuc", label: "Xem thêm bài viết từ Mali Edu" }],
      }),
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
    dynamicLinks.posts.push({ href: routePath, label: postTitle });
    counters.posts += 1;
  });

  jobDocuments.forEach((document) => {
    const data = document.data;
    if (data.isPublished === false) return;
    const slug = String(data.slug || document.id || "").trim();
    if (!slug) return;
    const routePath = `/tuyen-dung/${slug}`;
    const jobTitle = data.title || "Cơ hội nghề nghiệp";
    const jobDescription =
      data.seoDescription ||
      data.excerpt ||
      data.description ||
      `Khám phá cơ hội nghề nghiệp ${jobTitle} tại Mali Edu.`;
    const expired = isExpiredDeadline(data.deadline);
    const datePosted = toDateString(data.createdAt) || generatedOn;
    const baseSalary = parseSalaryRange(data.salary);
    addDynamicRoute({
      path: routePath,
      title: `${jobTitle} - Tuyển dụng Mali Edu`,
      description: jobDescription,
      image: data.thumbnailUrl || data.imageUrl,
      type: "article",
      lastmod: toDateString(data.updatedAt || data.createdAt),
      robots: expired
        ? "noindex,nofollow"
        : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      sitemap: !expired,
      prerenderBodyHtml: createPrerenderBodyHtml({
        title: jobTitle,
        description: toPlainText(jobDescription),
        content: data.description,
        statusMessage: expired
          ? "Vị trí tuyển dụng này đã hết hạn nhận hồ sơ."
          : `Hạn nhận hồ sơ: ${data.deadline || "đang mở"}`,
        links: [{ href: "/tuyen-dung", label: "Xem các vị trí tuyển dụng khác" }],
      }),
      createJsonLd: expired
        ? undefined
        : (seo) => [
            {
              "@context": "https://schema.org",
              "@type": "JobPosting",
              title: jobTitle,
              description: data.description || seo.description,
              datePosted,
              ...(data.deadline
                ? { validThrough: `${data.deadline}T23:59:59+07:00` }
                : {}),
              employmentType: toEmploymentType(data.jobType),
              hiringOrganization: organizationSchema,
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Hà Nội",
                  addressCountry: "VN",
                },
              },
              ...(baseSalary ? { baseSalary } : {}),
              directApply: true,
              url: seo.url,
            },
            createBreadcrumbSchema([
              { name: "Trang chủ", url: `${SITE_URL}/` },
              { name: "Tuyển dụng", url: `${SITE_URL}/tuyen-dung` },
              { name: jobTitle, url: seo.url },
            ]),
          ],
    });
    if (!expired) {
      dynamicLinks.jobs.push({ href: routePath, label: jobTitle });
      counters.jobs += 1;
    }
  });
}

const setPrerenderBody = (routePath, { content, links = [] }) => {
  const route = routeManifest.get(routePath);
  if (!route) return;
  route.prerenderBodyHtml = createPrerenderBodyHtml({
    title: route.title,
    description: route.description,
    content,
    links,
  });
};

setPrerenderBody("/", {
  content:
    "Mali Edu là hệ sinh thái đào tạo về Luật Hấp Dẫn, khai mở tiềm thức, chữa lành nội tâm và phát triển thịnh vượng. Các chương trình trọng tâm gồm Luật Hấp Dẫn, Khơi Thông Dòng Tiền và Vút Tốc Mục Tiêu. Học viên có thể học trực tuyến hoặc đăng ký tư vấn lộ trình phù hợp.",
  links: [
    { href: "/dao-tao/luat-hap-dan", label: "Chương trình Luật Hấp Dẫn" },
    { href: "/dao-tao/khoi-thong-dong-tien", label: "Chương trình Khơi Thông Dòng Tiền" },
    { href: "/dao-tao/vut-toc-muc-tieu", label: "Chương trình Vút Tốc Mục Tiêu" },
    ...dynamicLinks.courses,
    ...dynamicLinks.posts,
    { href: "/lien-he", label: "Đăng ký tư vấn cùng Mali Edu" },
  ],
});
setPrerenderBody("/khoa-hoc", {
  content: "Danh sách khóa học trực tuyến đang được xuất bản tại Mali Edu.",
  links: dynamicLinks.courses,
});
setPrerenderBody("/tin-tuc", {
  content: "Các bài viết, câu chuyện học viên và kiến thức chuyển hóa mới nhất từ Mali Edu.",
  links: dynamicLinks.posts,
});
setPrerenderBody("/tuyen-dung", {
  content:
    dynamicLinks.jobs.length > 0
      ? "Các vị trí đang nhận hồ sơ tại Mali Edu."
      : "Hiện chưa có vị trí tuyển dụng nào còn hạn nhận hồ sơ.",
  links: dynamicLinks.jobs,
});

if (dynamicLinks.courses.length >= 3) {
  const courseListRoute = routeManifest.get("/khoa-hoc");
  courseListRoute.jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: dynamicLinks.courses.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}${course.href}`,
      })),
    },
  ];
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
