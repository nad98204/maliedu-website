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
const prerenderRouteMetaName = "seo-prerender-route";

const normalizePath = (pathname = "/") => {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.replace(/\/+$/, "") || "/";
  } catch {
    return pathname.replace(/\/+$/, "") || "/";
  }
};

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isStaticAssetPath = (pathname) =>
  pathname.startsWith("/assets/") ||
  pathname === "/robots.txt" ||
  pathname === "/sitemap.xml" ||
  pathname === "/runtime-config.js" ||
  /\.[a-z0-9]{2,8}$/i.test(pathname);

const isExpectedAssetContentType = (pathname, contentType) => {
  if (/\.m?js$/i.test(pathname)) {
    return /(?:java|ecma)script/i.test(contentType);
  }
  if (/\.css$/i.test(pathname)) {
    return /text\/css/i.test(contentType);
  }
  return true;
};

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

const serveStaticAsset = async (context, pathname) => {
  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";
  const invalidAsset =
    !response.ok || !isExpectedAssetContentType(pathname, contentType);

  if (!invalidAsset) return response;

  return cloneWithHeaders(response, {
    "Cache-Control": "no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
};

const serveSpaShell = async (context, { noindex = false } = {}) => {
  if (!context.env?.ASSETS) {
    const response = await context.next();
    return noindex
      ? cloneWithHeaders(response, { "X-Robots-Tag": NOINDEX_ROBOTS })
      : response;
  }

  const shellUrl = new URL("/spa", context.request.url);
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

const servePrerenderedRoute = async (context, pathname) => {
  if (!context.env?.ASSETS) return null;

  const assetUrl = new URL(context.request.url);
  // Cloudflare Pages resolves this pretty path to the generated `<path>.html`.
  assetUrl.pathname = pathname;
  assetUrl.search = "";

  const assetRequest = new Request(assetUrl, {
    // A GET is required even for incoming HEAD requests so the route marker
    // can be verified before accepting the asset as route-specific HTML.
    method: "GET",
    headers: context.request.headers,
  });
  const response = await context.env.ASSETS.fetch(assetRequest);
  const contentType = response.headers.get("Content-Type") || "";

  if (!response.ok || !/text\/html/i.test(contentType)) return null;

  const html = await response.clone().text();
  const encodedPath = escapeRegExp(encodeURIComponent(pathname));
  const markerPattern = new RegExp(
    `<meta\\b[^>]*\\bname=["']${prerenderRouteMetaName}["'][^>]*\\bcontent=["']${encodedPath}["'][^>]*>`,
    "i",
  );
  if (!markerPattern.test(html)) return null;

  const nextResponse = cloneWithHeaders(response, {
    "Cache-Control": "public, max-age=0, must-revalidate",
  });
  return new Response(
    context.request.method === "HEAD" ? null : nextResponse.body,
    {
      status: nextResponse.status,
      statusText: nextResponse.statusText,
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
  const filters = [
    {
      fieldFilter: {
        field: { fieldPath: "slug" },
        op: "EQUAL",
        value: { stringValue: slug },
      },
    },
  ];
  if (requirePublished) {
    filters.push({
      fieldFilter: {
        field: { fieldPath: "isPublished" },
        op: "EQUAL",
        value: { booleanValue: true },
      },
    });
  }

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
          ...(filters.length === 1
            ? filters[0]
            : {
                compositeFilter: {
                  op: "AND",
                  filters,
                },
              }),
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
  if (exists !== true) {
    const slugExists = await fetchDocumentBySlug({
      collection: rule.collection,
      slug,
      requirePublished: rule.requirePublished,
      firebaseConfig,
    });
    if (slugExists !== null) exists = slugExists;
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
  if (pathname.startsWith("/api/")) {
    return context.next();
  }
  if (isStaticAssetPath(pathname)) return serveStaticAsset(context, pathname);

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
    if (exists !== true) return renderNotFound(request);

    if (dynamicRule.prefix === "/bai-viet/") {
      const canonicalUrl = new URL(request.url);
      canonicalUrl.pathname = `/tin-tuc/${slug}`;
      canonicalUrl.search = "";
      return new Response(null, {
        status: 301,
        headers: {
          Location: canonicalUrl.toString(),
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const prerenderedResponse = await servePrerenderedRoute(context, pathname);
    if (prerenderedResponse) return prerenderedResponse;

    // A published route without a current prerender can still hydrate as an SPA.
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
