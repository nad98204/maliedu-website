import { useEffect, useState } from "react";

/** Ảnh tiêu đề hero (S3 Long Van): LCP, poster video, og:image route — một nguồn để đồng bộ URL. */
export const KHOI_THONG_HERO_BANNER_URL =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1777910467237-372116712-banner-optimized.jpg";

export const KHOI_THONG_DONG_TIEN_CONFIG = {
  eventStart: "2026-05-21T20:00:00+07:00",
  ctaScheduleLabel: "20h00, 21-22-23-24/05",
  zaloLink: "https://zalo.me/g/nqn15yafhgiwrjembzxn",
  thankYouCountdownSeconds: 5 * 60,
};

export const KHOI_THONG_SCHEDULE_CONFIG_DOC_ID = "khoi_thong_dong_tien_schedule";

const normalizePath = (path = "") => {
  try {
    return decodeURIComponent(String(path).split("?")[0].split("#")[0])
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "") || "root";
  } catch {
    return String(path).split("?")[0].split("#")[0].toLowerCase().replace(/^\/+|\/+$/g, "") || "root";
  }
};

const normalizeSourceKey = (value = "") => String(value || "").trim().toLowerCase();

export const resolveKhoiThongLandingConfig = async ({ path, sourceKey, landingPageId } = {}) => {
  const [{ crmFirestore }, { collection, doc, getDoc, getDocs }] = await Promise.all([
    import("../../firebase"),
    import("firebase/firestore"),
  ]);

  const [querySnap, scheduleSnap] = await Promise.all([
    getDocs(collection(crmFirestore, "landing_pages")),
    getDoc(doc(crmFirestore, "public_settings", KHOI_THONG_SCHEDULE_CONFIG_DOC_ID)),
  ]);
  const docs = querySnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const sharedSchedule = scheduleSnap.exists() ? scheduleSnap.data() : {};
  const requestPath = normalizePath(path || (typeof window !== "undefined" ? window.location.pathname : ""));
  const requestSourceKey = normalizeSourceKey(sourceKey);

  const match =
    (landingPageId && docs.find((item) => item.id === landingPageId)) ||
    (requestSourceKey && docs.find((item) => normalizeSourceKey(item.active_source_key) === requestSourceKey)) ||
    docs.find((item) => {
      const configSlug = normalizePath(item.slug || "");
      return configSlug !== "root" && configSlug === requestPath;
    }) ||
    docs.find((item) => {
      const configSlug = normalizePath(item.slug || "");
      return (
        (item.id === "khoi-thong-dong-tien" || configSlug === "dao-tao/khoi-thong-dong-tien") &&
        requestPath.includes("khoi-thong-dong-tien") &&
        !requestPath.includes("leader") &&
        !requestPath.includes("thuonghieu")
      );
    });

  if (!match) {
    return {
      ...KHOI_THONG_DONG_TIEN_CONFIG,
      eventStart: sharedSchedule.eventStart || KHOI_THONG_DONG_TIEN_CONFIG.eventStart,
      ctaScheduleLabel: sharedSchedule.ctaScheduleLabel || KHOI_THONG_DONG_TIEN_CONFIG.ctaScheduleLabel,
      thankYouCountdownSeconds: Number(sharedSchedule.thankYouCountdownSeconds) || KHOI_THONG_DONG_TIEN_CONFIG.thankYouCountdownSeconds,
    };
  }

  return {
    ...KHOI_THONG_DONG_TIEN_CONFIG,
    ...match,
    zaloLink: match.thankYouZaloLink || match.zaloLink || KHOI_THONG_DONG_TIEN_CONFIG.zaloLink,
    eventStart: sharedSchedule.eventStart || match.eventStart || KHOI_THONG_DONG_TIEN_CONFIG.eventStart,
    ctaScheduleLabel: sharedSchedule.ctaScheduleLabel || match.ctaScheduleLabel || KHOI_THONG_DONG_TIEN_CONFIG.ctaScheduleLabel,
    thankYouCountdownSeconds: Number(sharedSchedule.thankYouCountdownSeconds) || Number(match.thankYouCountdownSeconds) || KHOI_THONG_DONG_TIEN_CONFIG.thankYouCountdownSeconds,
    landingPageId: match.id,
  };
};

export const useKhoiThongLandingConfig = (options = {}) => {
  const [config, setConfig] = useState(KHOI_THONG_DONG_TIEN_CONFIG);

  useEffect(() => {
    let cancelled = false;

    resolveKhoiThongLandingConfig(options)
      .then((nextConfig) => {
        if (!cancelled) setConfig(nextConfig);
      })
      .catch(() => {
        if (!cancelled) setConfig(KHOI_THONG_DONG_TIEN_CONFIG);
      });

    return () => {
      cancelled = true;
    };
  }, [options.path, options.sourceKey, options.landingPageId]);

  return config;
};
