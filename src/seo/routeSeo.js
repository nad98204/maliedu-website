import {
  DEFAULT_IMAGE,
  DEFAULT_SEO,
  INDEX_ROBOTS,
  NOINDEX_ROBOTS,
  ROUTE_SEO,
  SITE_NAME,
  SITE_URL,
  STATIC_LASTMOD,
} from "./siteRoutes.js";

export {
  DEFAULT_IMAGE,
  DEFAULT_SEO,
  INDEX_ROBOTS,
  NOINDEX_ROBOTS,
  ROUTE_SEO,
  SITE_NAME,
  SITE_URL,
  STATIC_LASTMOD,
};

export const normalizeRoutePath = (path = "/") => {
  if (!path) {
    return "/";
  }

  if (/^https?:\/\//i.test(path)) {
    const { pathname } = new URL(path);
    return pathname.replace(/\/+$/, "") || "/";
  }

  const cleanPath = path.split("?")[0].split("#")[0];
  return cleanPath.replace(/\/+$/, "") || "/";
};

export const toAbsoluteUrl = (path = "/") => {
  if (!path) {
    return SITE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = normalizeRoutePath(path);
  return normalizedPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${normalizedPath}`;
};

const withSiteName = (title) => {
  if (!title) {
    return DEFAULT_SEO.title;
  }

  return title.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? title
    : `${title} - ${SITE_NAME}`;
};

export const getResolvedSeo = (input = {}) => {
  const baseSeo =
    typeof input === "string"
      ? { ...DEFAULT_SEO, ...(ROUTE_SEO[normalizeRoutePath(input)] || {}), url: input }
      : { ...DEFAULT_SEO, ...input };

  const normalizedUrl = baseSeo.url || baseSeo.path || "/";

  return {
    title: withSiteName(baseSeo.title),
    description: baseSeo.description || DEFAULT_SEO.description,
    image: toAbsoluteUrl(baseSeo.image || DEFAULT_SEO.image),
    url: toAbsoluteUrl(normalizedUrl),
    type: baseSeo.type || DEFAULT_SEO.type,
    robots: baseSeo.robots || DEFAULT_SEO.robots,
    sitemap: baseSeo.sitemap ?? false,
  };
};

export const getRouteSeo = (path) => getResolvedSeo(path);
