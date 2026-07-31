import { FIREBASE_PUBLIC_CONFIG } from "../src/constants/firebasePublicConfig.js";
import {
  DYNAMIC_CONTENT_ROUTES,
  NOINDEX_ROBOTS,
  PRIVATE_SPA_PREFIXES,
  PUBLIC_SPA_PREFIXES,
  ROUTE_SEO,
} from "../src/seo/siteRoutes.js";

const exactRoutes = new Set(Object.keys(ROUTE_SEO));
const cacheSeconds = 300;

const normalizePath = (pathname = "/") => {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.replace(/\/+$/, "") || "/";
  } catch {
    return pathname.replace(/\/+$/, "") || "/";
  }
};

const isStaticAssetPath = (pathname) =>
  pathname.startsWith("/assets/") ||
  pathname === "/robots.txt" ||
  pathname === "/sitemap.xml" ||
  pathname === "/runtime-config.js" ||
  /\.[a-z0-9]{2,8}$/i.test(pathname);

const cloneWithHeaders = (response, additionalHeaders = {}) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(additionalHeaders)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const serveSpaShell = async (context, { noindex = false } = {}) => {
  if (!context.env?.ASSETS) {
    const response = await context.next();
    return noindex
      ? cloneWithHeaders(response, { "X-Robots-Tag": NOINDEX_ROBOTS })
      : response;
  }

  const shellUrl = new URL("/spa.html", context.request.url);
  const shellRequest = new Request(shellUrl, {
    method: context.request.method === "HEAD" ? "HEAD" : "GET",
    headers: context.request.headers,
  });
  const response = await context.env.ASSETS.fetch(shellRequest);
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };
  if (noindex) headers["X-Robots-Tag"] = NOINDEX_ROBOTS;

  const nextResponse = cloneWithHeaders(response, headers);
  return new Response(
    context.request.method === "HEAD" ? null : nextResponse.body,
    {
      status: 200,
      headers: nextResponse.headers,
    },
  );
};

const renderNotFound = (request) => {
  const body = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Không tìm thấy trang - Mali Edu</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#fffaf1;color:#173e35}
      main{min-height:100vh;display:grid;place-items:center;padding:32px}.card{max-width:620px;text-align:center}
      .code{color:#a72c25;font-weight:800;letter-spacing:.25em;text-transform:uppercase}
      h1{font-family:Georgia,serif;font-size:clamp(2.25rem,7vw,4rem);margin:18px 0}
      p{color:#5d6663;line-height:1.7}a{display:inline-block;margin-top:22px;padding:13px 24px;border-radius:999px;background:#a72c25;color:white;text-decoration:none;font-weight:700}
    </style>
  </head>
  <body>
    <main><section class="card"><div class="code">Lỗi 404</div><h1>Không tìm thấy trang</h1>
    <p>Đường dẫn có thể đã thay đổi hoặc nội dung không còn tồn tại.</p>
    <a href="/">Về trang chủ</a></section></main>
  </body>
</html>`;

  return new Response(request.method === "HEAD" ? null : body, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=60",
      "X-Robots-Tag": NOINDEX_ROBOTS,
    },
  });
};

const publishedFieldAllows = (fields, requirePublished) => {
  if (!requirePublished) {
    return fields?.isPublished?.booleanValue !== false;
  }
  return fields?.isPublished?.booleanValue === true;
};

const fetchDocumentById = async ({
  collection,
  slug,
  requirePublished,
  firebaseConfig,
}) => {
  const { apiKey, projectId } = firebaseConfig;
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/` +
    `${encodeURIComponent(collection)}/${encodeURIComponent(slug)}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    headers: { Referer: "https://luathapdan.vn/" },
  });
  if (response.status === 404) return false;
  if (!response.ok) return null;
  const document = await response.json();
  return publishedFieldAllows(document.fields, requirePublished);
};

const fetchDocumentBySlug = async ({
  collection,
  slug,
  requirePublished,
  firebaseConfig,
}) => {
  const { apiKey, projectId } = firebaseConfig;
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery` +
    `?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://luathapdan.vn/",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: "slug" },
            op: "EQUAL",
            value: { stringValue: slug },
          },
        },
        limit: 1,
      },
    }),
  });
  if (!response.ok) return null;
  const results = await response.json();
  const document = results.find((item) => item.document)?.document;
  if (!document) return false;
  return publishedFieldAllows(document.fields, requirePublished);
};

const dynamicDocumentExists = async (context, rule, slug) => {
  const cacheKey = new Request(
    new URL(
      `/__seo-route-cache/${rule.collection}/${encodeURIComponent(slug)}`,
      context.request.url,
    ),
  );
  const edgeCache = globalThis.caches?.default;
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null;
  if (cached) return (await cached.text()) === "1";

  const firebaseConfig = {
    apiKey:
      context.env?.FIREBASE_WEB_API_KEY || FIREBASE_PUBLIC_CONFIG.apiKey,
    projectId:
      context.env?.FIREBASE_PROJECT_ID || FIREBASE_PUBLIC_CONFIG.projectId,
  };
  let exists = await fetchDocumentById({
    collection: rule.collection,
    slug,
    requirePublished: rule.requirePublished,
    firebaseConfig,
  });
  if (exists === false) {
    exists = await fetchDocumentBySlug({
      collection: rule.collection,
      slug,
      requirePublished: rule.requirePublished,
      firebaseConfig,
    });
  }

  if (exists !== null && edgeCache) {
    const cacheResponse = new Response(exists ? "1" : "0", {
      headers: { "Cache-Control": `public, max-age=${cacheSeconds}` },
    });
    context.waitUntil?.(edgeCache.put(cacheKey, cacheResponse));
  }
  return exists;
};

export async function onRequest(context) {
  const { request } = context;
  if (!["GET", "HEAD"].includes(request.method)) return context.next();

  const pathname = normalizePath(new URL(request.url).pathname);
  if (pathname.startsWith("/api/") || isStaticAssetPath(pathname)) {
    return context.next();
  }

  if (exactRoutes.has(pathname)) {
    const response = await context.next();
    return ROUTE_SEO[pathname].robots.startsWith("noindex")
      ? cloneWithHeaders(response, { "X-Robots-Tag": NOINDEX_ROBOTS })
      : response;
  }

  const dynamicRule = DYNAMIC_CONTENT_ROUTES.find((rule) =>
    pathname.startsWith(rule.prefix),
  );
  if (dynamicRule) {
    const slug = pathname.slice(dynamicRule.prefix.length);
    if (!slug || slug.includes("/")) return renderNotFound(request);
    const exists = await dynamicDocumentExists(context, dynamicRule, slug);
    if (exists === false) return renderNotFound(request);
    // Fail open if Firestore is temporarily unavailable; existing pages remain usable.
    return serveSpaShell(context);
  }

  if (PRIVATE_SPA_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return serveSpaShell(context, { noindex: true });
  }

  if (PUBLIC_SPA_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return serveSpaShell(context);
  }

  return renderNotFound(request);
}
