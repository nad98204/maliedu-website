import { useEffect } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useLocation } from "react-router-dom";

import { crmFirestore } from "../firebase";
import { ensureMetaPixel, initMetaPixel } from "../utils/metaPixel";

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
    landingPagesPromise = getDocs(collection(crmFirestore, "landing_pages")).then((snapshot) =>
      snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })),
    );
  }

  return landingPagesPromise;
};

const getPublicLandingConfig = async () => {
  if (!publicLandingConfigPromise) {
    publicLandingConfigPromise = getDoc(
      doc(crmFirestore, "public_settings", "landing_config"),
    ).then((snapshot) => (snapshot.exists() ? snapshot.data() : {}));
  }

  return publicLandingConfigPromise;
};

const getLandingIdHints = (pathname) => {
  const normalizedPath = normalizePath(pathname);
  const hints = new Set();
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] === "landing" && segments[1]) {
    hints.add(segments[1]);
  }

  if (
    normalizedPath === "/cam-on-khoi-thong" ||
    normalizedPath.includes("khoi-thong-dong-tien")
  ) {
    hints.add("khoi-thong-dong-tien");
  }

  return hints;
};

const pickPixelId = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const resolvePixelIdForPath = async (pathname) => {
  const normalizedPath = normalizePath(pathname);

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

    const landingIdHints = getLandingIdHints(normalizedPath);
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

const FacebookPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    let isCancelled = false;
    const locationSignature =
      location.key || `${location.pathname}${location.search}${location.hash}`;

    const trackPageView = async () => {
      ensureMetaPixel();

      const pixelId = await resolvePixelIdForPath(location.pathname);
      if (isCancelled || !pixelId) return;

      initMetaPixel(pixelId);

      if (typeof window === "undefined" || typeof window.fbq !== "function") return;
      if (window.__maliLastTrackedPageView === locationSignature) return;

      window.__maliLastTrackedPageView = locationSignature;
      window.fbq("track", "PageView");
    };

    trackPageView();

    return () => {
      isCancelled = true;
    };
  }, [location.hash, location.key, location.pathname, location.search]);

  return null;
};

export default FacebookPixelTracker;
