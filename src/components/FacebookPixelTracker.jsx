import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { isFunnelLandingPath } from "../utils/funnelLandingPaths";
import { ensureMetaPixel, getMetaBrowserData, initMetaPixel, trackMetaEventForPixel } from "../utils/metaPixel";

const DEFAULT_PIXEL_ID = "1526874981588150";

let landingPagesPromise = null;
let publicLandingConfigPromise = null;

const normalizePath = (path) => {
  if (!path) return "/";

  const cleanPath = path.split("?")[0].split("#")[0];
  return cleanPath.replace(/\/+$/, "") || "/";
};

const getLandingPages = async () => {
  if (!landingPagesPromise) {
    landingPagesPromise = (async () => {
      const [{ crmFirestore }, { collection, getDocs }] = await Promise.all([
        import("../firebase"),
        import("firebase/firestore"),
      ]);
      const snapshot = await getDocs(collection(crmFirestore, "landing_pages"));
      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
    })();
  }

  return landingPagesPromise;
};

const getPublicLandingConfig = async () => {
  if (!publicLandingConfigPromise) {
    publicLandingConfigPromise = (async () => {
      const [{ crmFirestore }, { doc, getDoc }] = await Promise.all([
        import("../firebase"),
        import("firebase/firestore"),
      ]);
      const snapshot = await getDoc(doc(crmFirestore, "public_settings", "landing_config"));
      return snapshot.exists() ? snapshot.data() : {};
    })();
  }

  return publicLandingConfigPromise;
};

const getLandingIdHints = (pathname, search = "") => {
  const normalizedPath = normalizePath(pathname);
  const hints = new Set();
  const segments = normalizedPath.split("/").filter(Boolean);
  const requestedFunnel = new URLSearchParams(search).get("funnel")?.toLowerCase() || "";

  if (segments[0] === "landing" && segments[1]) {
    hints.add(segments[1]);
  }

  if (normalizedPath === "/cam-on-khoi-thong") {
    hints.add(requestedFunnel === "leader" ? "khoi-thong-dong-tien-leader" : "khoi-thong-dong-tien");
  } else if (normalizedPath.includes("khoi-thong-dong-tien-leader")) {
    hints.add("khoi-thong-dong-tien-leader");
  } else if (normalizedPath.includes("khoi-thong-dong-tien")) {
    hints.add("khoi-thong-dong-tien");
  }

  return hints;
};

const pickPixelId = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const resolvePixelIdForPath = async (pathname, search = "") => {
  const normalizedPath = normalizePath(pathname);

  if (isFunnelLandingPath(normalizedPath)) {
    return DEFAULT_PIXEL_ID;
  }

  try {
    const landingPages = await getLandingPages();
    const matchedBySlug = landingPages.find((item) => {
      const slug = normalizePath(item.slug || "");
      return slug !== "/" && (slug === normalizedPath || normalizedPath.startsWith(`${slug}/`));
    });

    const slugPixelId = pickPixelId(matchedBySlug?.fbPixel);
    if (slugPixelId) {
      return slugPixelId;
    }

    const landingIdHints = getLandingIdHints(normalizedPath, search);
    if (landingIdHints.size > 0) {
      const matchedById = landingPages.find((item) => landingIdHints.has(item.id));
      const idPixelId = pickPixelId(matchedById?.fbPixel);
      if (idPixelId) {
        return idPixelId;
      }
    }
  } catch (error) {
    console.error("Error resolving landing pixel:", error);
    landingPagesPromise = null;
  }

  try {
    const publicLandingConfig = await getPublicLandingConfig();
    const publicPixelId = pickPixelId(publicLandingConfig?.fbPixel);
    if (publicPixelId) {
      return publicPixelId;
    }
  } catch (error) {
    console.error("Error resolving default pixel:", error);
    publicLandingConfigPromise = null;
  }

  return DEFAULT_PIXEL_ID;
};

/** Trì hoãn inject fbevents.js (không đổi TTL cache của Meta nhưng giảm tranh chấp với LCP/FCP lần đầu). */
const scheduleMetaPixelFlush = (fn) => {
  if (typeof window === "undefined") return () => {};
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => fn(), { timeout: 4000 });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(() => fn(), 200);
  return () => window.clearTimeout(id);
};

const FacebookPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    let isCancelled = false;
    const locationSignature =
      location.key || `${location.pathname}${location.search}${location.hash}`;

    let cancelScheduled = () => {};

    const trackPageView = async () => {
      const pixelId = await resolvePixelIdForPath(location.pathname, location.search);
      if (isCancelled || !pixelId) return;

      const { fbp, fbc } = getMetaBrowserData(location.search);
      const browserUserData = {
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
      };

      cancelScheduled = scheduleMetaPixelFlush(() => {
        if (isCancelled) return;
        ensureMetaPixel();
        initMetaPixel(pixelId, browserUserData);
        window.__maliCurrentPixelId = pixelId;

        if (typeof window === "undefined" || typeof window.fbq !== "function") return;
        if (window.__maliLastTrackedPageView === locationSignature) return;

        window.__maliLastTrackedPageView = locationSignature;
        trackMetaEventForPixel(pixelId, "PageView");
      });
    };

    trackPageView();

    return () => {
      isCancelled = true;
      cancelScheduled();
    };
  }, [location.hash, location.key, location.pathname, location.search]);

  return null;
};

export default FacebookPixelTracker;
