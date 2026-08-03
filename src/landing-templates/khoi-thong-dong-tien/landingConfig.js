import { useEffect, useState } from "react";
import {
  findPublicLandingConfig,
  getPublicFirestoreDocument,
} from "../../utils/publicFirestore";

/** Ảnh tiêu đề hero (S3 Long Van): LCP, poster video, og:image route — một nguồn để đồng bộ URL. */
export const KHOI_THONG_HERO_BANNER_URL =
  "/assets/landing/khoi-thong-dong-tien/hero-title.webp";

export const KHOI_THONG_DONG_TIEN_CONFIG = {
  eventStart: "2026-08-11T20:00:00+07:00",
  ctaScheduleLabel: "11-12-13-14/08 – 20h00",
  zaloLink: "https://zalo.me/g/nqn15yafhgiwrjembzxn",
  thankYouCountdownSeconds: 5 * 60,
};

export const KHOI_THONG_SCHEDULE_CONFIG_DOC_ID = "khoi_thong_dong_tien_schedule";

const DEFAULT_EVENT_START_MS = new Date(KHOI_THONG_DONG_TIEN_CONFIG.eventStart).getTime();

const isCurrentSchedule = (eventStart) => {
  const eventStartMs = new Date(eventStart).getTime();
  return Number.isFinite(eventStartMs) && eventStartMs >= DEFAULT_EVENT_START_MS;
};

export const resolveKhoiThongLandingConfig = async ({ path, sourceKey, landingPageId } = {}) => {
  const [match, sharedSchedule] = await Promise.all([
    findPublicLandingConfig({ path, sourceKey, landingPageId }),
    getPublicFirestoreDocument(
      "public_settings",
      KHOI_THONG_SCHEDULE_CONFIG_DOC_ID,
      ["eventStart", "ctaScheduleLabel", "thankYouCountdownSeconds", "thankYouZaloLink"],
    ),
  ]);
  const schedule = sharedSchedule || {};
  const sharedEventSchedule = isCurrentSchedule(schedule.eventStart) ? schedule : {};
  const landingEventSchedule = isCurrentSchedule(match?.eventStart) ? match : {};

  if (!match) {
    return {
      ...KHOI_THONG_DONG_TIEN_CONFIG,
      zaloLink: schedule.thankYouZaloLink || KHOI_THONG_DONG_TIEN_CONFIG.zaloLink,
      eventStart: sharedEventSchedule.eventStart || KHOI_THONG_DONG_TIEN_CONFIG.eventStart,
      ctaScheduleLabel: sharedEventSchedule.ctaScheduleLabel || KHOI_THONG_DONG_TIEN_CONFIG.ctaScheduleLabel,
      thankYouCountdownSeconds: Number(schedule.thankYouCountdownSeconds) || KHOI_THONG_DONG_TIEN_CONFIG.thankYouCountdownSeconds,
    };
  }

  return {
    ...KHOI_THONG_DONG_TIEN_CONFIG,
    ...match,
    zaloLink: schedule.thankYouZaloLink || match.thankYouZaloLink || match.zaloLink || KHOI_THONG_DONG_TIEN_CONFIG.zaloLink,
    eventStart: sharedEventSchedule.eventStart || landingEventSchedule.eventStart || KHOI_THONG_DONG_TIEN_CONFIG.eventStart,
    ctaScheduleLabel: sharedEventSchedule.ctaScheduleLabel || landingEventSchedule.ctaScheduleLabel || KHOI_THONG_DONG_TIEN_CONFIG.ctaScheduleLabel,
    thankYouCountdownSeconds: Number(schedule.thankYouCountdownSeconds) || Number(match.thankYouCountdownSeconds) || KHOI_THONG_DONG_TIEN_CONFIG.thankYouCountdownSeconds,
    landingPageId: match.__documentId,
  };
};

export const useKhoiThongLandingConfig = (options = {}) => {
  const [config, setConfig] = useState(KHOI_THONG_DONG_TIEN_CONFIG);
  const { path, sourceKey, landingPageId } = options;

  useEffect(() => {
    let cancelled = false;

    resolveKhoiThongLandingConfig({ path, sourceKey, landingPageId })
      .then((nextConfig) => {
        if (!cancelled) setConfig(nextConfig);
      })
      .catch(() => {
        if (!cancelled) setConfig(KHOI_THONG_DONG_TIEN_CONFIG);
      });

    return () => {
      cancelled = true;
    };
  }, [path, sourceKey, landingPageId]);

  return config;
};
