import { Buffer } from "node:buffer";
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import process from "node:process";
import { Readable } from "node:stream";

import { onRequest } from "firebase-functions/v2/https";
import { onValueCreated } from "firebase-functions/v2/database";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { hashData, normalizeNameForHash, sendMetaCapiEvent } from "./capi_helper.js";
import { createAdminLandingHandlers } from "./_lib/adminLandings.js";

let defaultApp = null;
let firestoreDb = null;
let crmAdminApp = null;
let crmDb = null;
let crmFirestoreDb = null;

const META_CAPI_ACCESS_TOKEN_SECRET = defineSecret("META_CAPI_ACCESS_TOKEN");
const S3_ACCESS_KEY_SECRET = defineSecret("S3_ACCESS_KEY");
const S3_SECRET_KEY_SECRET = defineSecret("S3_SECRET_KEY");
const STORAGE_MEDIA_TOKEN_SECRET = defineSecret("STORAGE_MEDIA_TOKEN_SECRET");
const DISABLED_SECRET_VALUE = "__DISABLED__";

const getMetaCapiAccessToken = () => {
  const accessToken = String(META_CAPI_ACCESS_TOKEN_SECRET.value() || "").trim();
  return accessToken === DISABLED_SECRET_VALUE ? "" : accessToken;
};

const getDefaultApp = () => {
  if (!defaultApp) {
    defaultApp = initializeApp();
  }
  return defaultApp;
};

const getFirestoreDb = () => {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getDefaultApp());
  }
  return firestoreDb;
};

const getCrmAdminApp = () => {
  if (!crmAdminApp) {
    const databaseURL =
      process.env.CRM_DATABASE_URL ||
      "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app";
    const hostname = new URL(databaseURL).hostname;
    const inferredProjectId = hostname.match(/^(.+?)-default-rtdb(?:\.|$)/)?.[1] || "";
    const projectId = String(process.env.CRM_PROJECT_ID || inferredProjectId).trim();
    if (!projectId) {
      throw new Error("CRM_PROJECT_ID is not configured");
    }
    crmAdminApp = initializeApp({ databaseURL, projectId }, "crm-admin");
  }
  return crmAdminApp;
};

const getCrmDatabase = () => {
  if (!crmDb) crmDb = getDatabase(getCrmAdminApp());
  return crmDb;
};

const getCrmFirestore = () => {
  if (!crmFirestoreDb) crmFirestoreDb = getFirestore(getCrmAdminApp());
  return crmFirestoreDb;
};

const STORAGE_MEDIA_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const STORAGE_MEDIA_MAX_RANGE_BYTES = 8 * 1024 * 1024;
const MAX_JSON_BODY_BYTES = 1024 * 1024;
const SUPER_ADMIN_EMAILS = new Set(["mongcoaching@gmail.com"]);
const PROTECTED_MULTIPART_PATHS = new Set([
  "/api/s3-multipart/abort",
  "/api/s3-multipart/complete",
  "/api/s3-multipart/init",
  "/api/s3-multipart/sign-part",
]);
const PROTECTED_ADMIN_LANDING_PATHS = new Set([
  "/api/admin/landings",
  "/api/admin/landings/delete",
  "/api/admin/landings/repair-sources",
  "/api/admin/landings/routing",
  "/api/admin/landings/save",
  "/api/admin/landings/schedule",
]);
const PUBLIC_BANK_SETTING_FIELDS = [
  "accountName",
  "accountNo",
  "bankId",
  "bankName",
  "branch",
  "isEnabled",
  "qrTemplate",
  "transferPrefix",
];
const RATE_LIMIT_POLICIES = new Map([
  ["/api/crm-leads", { limit: 8, windowMs: 10 * 60 * 1000 }],
  ["/api/newsletter", { limit: 5, windowMs: 60 * 60 * 1000 }],
  ["/api/orders", { limit: 10, windowMs: 10 * 60 * 1000 }],
  ["/api/post-feedback", { limit: 5, windowMs: 10 * 60 * 1000 }],
  ["/api/post-view", { limit: 120, windowMs: 60 * 1000 }],
  ["/api/course-view", { limit: 120, windowMs: 60 * 1000 }],
  ["/api/storage-share", { limit: 120, windowMs: 60 * 1000 }],
]);
const rateLimitBuckets = new Map();

const getHeader = (headers, name) => {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return String(headers.get(name) || "");
  }

  const normalizedName = name.toLowerCase();
  const value = headers[normalizedName] ?? headers[name];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
};

const getClientIp = (request) => {
  const forwardedFor = getHeader(request?.headers, "x-forwarded-for")
    .split(",")[0]
    .trim();
  return forwardedFor || String(request?.ip || "unknown").trim() || "unknown";
};

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const verifyRequestUser = async (request, { required = true } = {}) => {
  const authorization = getHeader(request?.headers, "authorization").trim();
  const match = /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(authorization);
  if (!match) {
    if (!required) return null;
    throw createHttpError(401, "Authentication required");
  }

  try {
    return await getAdminAuth(getDefaultApp()).verifyIdToken(match[1]);
  } catch {
    throw createHttpError(401, "Invalid or expired authentication");
  }
};

const requireAdminRequest = async (request) => {
  const user = await verifyRequestUser(request);
  const email = String(user.email || "").trim().toLowerCase();
  if (SUPER_ADMIN_EMAILS.has(email) && user.email_verified === true) return user;

  const profile = await getFirestoreDb().collection("users").doc(user.uid).get();
  if (!profile.exists || String(profile.data()?.role || "").toLowerCase() !== "admin") {
    throw createHttpError(403, "Administrator access required");
  }

  return user;
};

const enforceRateLimit = (request, path) => {
  const policy = RATE_LIMIT_POLICIES.get(path);
  if (!policy) return;

  const now = Date.now();
  const key = `${path}:${getClientIp(request)}`;
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    return;
  }
  if (current.count >= policy.limit) {
    throw createHttpError(429, "Too many requests. Please try again later.");
  }
  current.count += 1;

  if (rateLimitBuckets.size > 5000) {
    for (const [bucketKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }
};

import { onRequestPost as onAbort } from "./api/s3-multipart/abort.js";
import { onRequestPost as onComplete } from "./api/s3-multipart/complete.js";
import { onRequestGet as onHealth } from "./api/s3-multipart/health.js";
import { onRequestPost as onInit } from "./api/s3-multipart/init.js";
import { onRequestPost as onSignPart } from "./api/s3-multipart/sign-part.js";
import { createJsonResponse } from "./_lib/s3MultipartV3.js";

const ALLOWED_CRM_FUNNEL_PATHS = new Set([
  "funnels/ads",
  "funnels/brand",
  "funnels/leader",
  // Giữ tương thích với các bản landing cũ trong thời gian chuyển đổi.
  "funnels/thuonghieu",
]);
const CRM_ALLOWED_FIELDS = new Set([
  "assignedName",
  "assigned_to",
  "batchName",
  "batch_id",
  "courseName",
  "course_k",
  "cpCampaign",
  "cpContent",
  "cpMedium",
  "cpSource",
  "cpTerm",
  "customerNote",
  "email",
  "fbCurrency",
  "fbEventValue",
  "fbc",
  "fbp",
  "funnel_channel",
  "funnel_type",
  "ghiChu",
  "ghi_chu",
  "hasRegisteredLHD",
  "is_learned_loa",
  "landingPageId",
  "landingPageSlug",
  "lead_event_id",
  "leaderName",
  "leaderSlug",
  "leaderUtm",
  "leader_utm",
  "meta_event_id",
  "name",
  "note",
  "other_referrer_name",
  "phone",
  "referrer",
  "referrer_type",
  "registered_loa",
  "remarks",
  "sourceUrl",
  "source_key",
  "source_type",
  "staff_in_charge",
  "targetFunnel",
  "test_event_code",
  "utm_owner",
  "utm_owner_slug",
]);
const CRM_LONG_TEXT_FIELDS = new Set([
  "customerNote",
  "ghiChu",
  "ghi_chu",
  "note",
  "remarks",
  "sourceUrl",
]);

const normalizeCrmNodePath = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

const normalizeLeadPhone = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

const sanitizeCrmPayload = (payload) => {
  const sanitized = {};
  for (const [key, rawValue] of Object.entries(payload)) {
    if (!CRM_ALLOWED_FIELDS.has(key)) continue;

    if (typeof rawValue === "boolean") {
      sanitized[key] = rawValue;
      continue;
    }
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      sanitized[key] = rawValue;
      continue;
    }

    const maxLength = CRM_LONG_TEXT_FIELDS.has(key) ? 2000 : 300;
    sanitized[key] = String(rawValue ?? "").trim().slice(0, maxLength);
  }
  return sanitized;
};

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSearchKeywords = ({ name, phone }) => {
  const words = normalizeSearchText(name).split(" ").filter(Boolean);
  const digits = String(phone || "").replace(/\D/g, "");
  return [...new Set([
    ...words,
    words.join(" "),
    digits,
    digits.slice(-9),
  ].filter(Boolean))].slice(0, 30);
};

const DEFAULT_META_PIXEL_ID = "1526874981588150";

const resolveLeadMetaPixelId = async (leadData = {}) => {
  let pixelId = String(process.env.META_PIXEL_ID || DEFAULT_META_PIXEL_ID).trim();
  const landingPageId = String(leadData.landingPageId || "").trim();

  if (landingPageId && /^[a-zA-Z0-9_-]{1,150}$/.test(landingPageId)) {
    try {
      const landingSnapshot = await getCrmFirestore()
        .collection("landing_pages")
        .doc(landingPageId)
        .get();
      const configuredPixelId = String(landingSnapshot.data()?.fbPixel || "").trim();
      if (/^\d{5,30}$/.test(configuredPixelId)) {
        pixelId = configuredPixelId;
      }
    } catch (error) {
      console.warn("[CAPI] Could not resolve landing Pixel ID; using the default:", error);
    }
  }

  return /^\d{5,30}$/.test(pixelId) ? pixelId : DEFAULT_META_PIXEL_ID;
};

const sendCrmLeadMetaEvents = async ({ leadData, leadId }) => {
  const leadEventId = String(leadData?.lead_event_id || "").trim();
  const registrationEventId = String(leadData?.meta_event_id || "").trim();
  if (!leadEventId && !registrationEventId) {
    return { attempted: 0, received: 0 };
  }

  const accessToken = getMetaCapiAccessToken();
  if (!accessToken) {
    console.error("[CAPI] Missing access token for CRM lead:", leadId);
    return { attempted: 0, received: 0 };
  }

  const rawPhone = String(leadData.phone || "");
  const normalizedPhone = rawPhone.replace(/\D/g, "").replace(/^0/, "84");
  const normalizedEmail = String(leadData.email || "").trim().toLowerCase();
  const nameParts = String(leadData.name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
  const lastName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";
  const hashedEmail = normalizedEmail ? hashData(normalizedEmail) : "";
  const hashedPhone = normalizedPhone ? hashData(normalizedPhone) : "";
  const hashedFn = firstName ? hashData(normalizeNameForHash(firstName)) : "";
  const hashedLn = lastName ? hashData(normalizeNameForHash(lastName)) : "";
  const hashedExternalId = leadId ? hashData(String(leadId)) : "";
  const userData = {
    ...(hashedEmail ? { em: [hashedEmail] } : {}),
    ...(hashedPhone ? { ph: [hashedPhone] } : {}),
    ...(hashedFn ? { fn: [hashedFn] } : {}),
    ...(hashedLn ? { ln: [hashedLn] } : {}),
    ...(hashedExternalId ? { external_id: [hashedExternalId] } : {}),
    ...(leadData.fbp ? { fbp: leadData.fbp } : {}),
    ...(leadData.fbc ? { fbc: leadData.fbc } : {}),
    ...(leadData.clientIp ? { client_ip_address: leadData.clientIp } : {}),
    ...(leadData.userAgent ? { client_user_agent: leadData.userAgent } : {}),
  };
  const pixelId = await resolveLeadMetaPixelId(leadData);
  const commonParams = {
    accessToken,
    pixelId,
    sourceUrl: sanitizeEventSourceUrl(leadData.sourceUrl),
    testEventCode: String(leadData.test_event_code || "").trim(),
    userData,
  };
  const configuredEventValue = Number(leadData.fbEventValue);
  const currency = String(leadData.fbCurrency || "VND").trim().toUpperCase();
  const optionalValueData = Number.isFinite(configuredEventValue) && configuredEventValue > 0
    ? {
        value: configuredEventValue,
        currency: /^[A-Z]{3}$/.test(currency) ? currency : "VND",
      }
    : {};
  const events = [
    ...(leadEventId
      ? [{
          eventName: "Lead",
          eventId: leadEventId,
          customData: {
            content_name: leadData.courseName || "Đăng ký Landing",
            ...optionalValueData,
          },
        }]
      : []),
    ...(registrationEventId
      ? [{
          eventName: "CompleteRegistration",
          eventId: registrationEventId,
          customData: {
            content_name: leadData.courseName || "Xác nhận Đăng ký Landing",
            ...optionalValueData,
            status: true,
          },
        }]
      : []),
  ];
  const results = await Promise.all(events.map(async (metaEvent) => {
    const result = await sendMetaCapiEvent({ ...commonParams, ...metaEvent });
    const received = Number(result?.events_received || 0);
    if (result?.error || received < 1) {
      console.error(`[CAPI] Meta rejected ${metaEvent.eventName} for CRM lead ${leadId}:`, result);
    }
    return { eventName: metaEvent.eventName, received };
  }));

  return {
    attempted: results.length,
    received: results.reduce((total, result) => total + result.received, 0),
  };
};

const onCreateCrmLead = async ({ request }) => {
  const body = await request.json();
  const nodePath = normalizeCrmNodePath(body?.nodePath);
  const payload = body?.payload;

  if (!ALLOWED_CRM_FUNNEL_PATHS.has(nodePath)) {
    return createJsonResponse({ error: "Invalid CRM funnel path" }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return createJsonResponse({ error: "Invalid CRM payload" }, 400);
  }

  const sanitizedPayload = sanitizeCrmPayload(payload);
  const name = String(sanitizedPayload.name || "").trim();
  const phone = normalizeLeadPhone(payload.phone);
  const phoneDigits = phone.replace(/\D/g, "");
  const email = String(sanitizedPayload.email || "").trim().toLowerCase();
  const sourceKey = String(sanitizedPayload.source_key || "").trim();

  if (
    name.length < 2 ||
    name.length > 120 ||
    phoneDigits.length < 9 ||
    phoneDigits.length > 15 ||
    !/^[0-9+ ().-]{9,20}$/.test(phone) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    !/^[a-zA-Z0-9_-]{2,100}$/.test(sourceKey)
  ) {
    return createJsonResponse({ error: "Invalid lead contact info" }, 400);
  }

  const now = new Date().toISOString();
  const normalizedPayload = {
    ...sanitizedPayload,
    clientIp: getClientIp(request),
    createdAt: now,
    createdVia: "landing",
    email,
    name,
    phone,
    receivedAt: now,
    source_key: sourceKey,
    status: "NEW",
    userAgent: getHeader(request.headers, "user-agent").slice(0, 500),
  };
  const leadRef = getCrmDatabase().ref(nodePath).push();
  await leadRef.set(normalizedPayload);

  const leadSource = sourceKey === "chinh_phuc_muc_tieu_web"
    ? "chinh-phuc-muc-tieu"
    : sourceKey.startsWith("khoi_thong_dong_tien")
      ? "khoi-thong-dong-tien"
      : sourceKey;
  await getFirestoreDb().collection("leads").add({
    courseId: String(normalizedPayload.landingPageId || ""),
    courseName: String(normalizedPayload.courseName || ""),
    createdAt: Date.now(),
    crmLeadId: leadRef.key,
    landingPageId: String(normalizedPayload.landingPageId || ""),
    landingPageSlug: String(normalizedPayload.landingPageSlug || ""),
    name,
    phone,
    referralCode: String(normalizedPayload.referrer || ""),
    searchKeywords: buildSearchKeywords({ name, phone }),
    searchName: normalizeSearchText(name),
    searchPhone: phoneDigits,
    source: leadSource,
    sourceUrl: String(normalizedPayload.sourceUrl || ""),
    status: "new",
    utmCampaign: String(normalizedPayload.cpCampaign || ""),
    utmMedium: String(normalizedPayload.cpMedium || ""),
    utmSource: String(normalizedPayload.cpSource || ""),
  });

  try {
    const capiResult = await sendCrmLeadMetaEvents({
      leadData: normalizedPayload,
      leadId: leadRef.key,
    });
    console.log(`[CAPI] CRM lead ${leadRef.key} processed:`, capiResult);
  } catch (error) {
    // CRM submission must remain successful even if Meta is temporarily unavailable.
    console.error(`[CAPI] CRM lead ${leadRef.key} tracking failed:`, error);
  }

  return createJsonResponse({ success: true, id: leadRef.key });
};

const onGetStorageShare = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const fileId = String(requestUrl.searchParams.get("id") || "").trim();

  if (!fileId || fileId.length > 200 || fileId.includes("/")) {
    return createJsonResponse({ error: "Media not found" }, 404);
  }

  const fileSnapshot = await getFirestoreDb().collection("storage_files").doc(fileId).get();

  if (!fileSnapshot.exists) {
    return createJsonResponse({ error: "Media not found" }, 404);
  }

  const file = fileSnapshot.data() || {};
  const type = String(file.type || "");
  const isShareableMedia = type.startsWith("image/") || type.startsWith("video/");

  if (
    !file.isPublic ||
    file.isDeleted ||
    !isShareableMedia ||
    !isAllowedStorageUrl(file.url)
  ) {
    return createJsonResponse({ error: "Media not found" }, 404);
  }

  const isVideo = type.startsWith("video/");
  const expires = Math.floor(Date.now() / 1000) + STORAGE_MEDIA_TOKEN_TTL_SECONDS;
  const createMediaPath = (mode) => {
    const token = createStorageMediaToken({
      fileId: fileSnapshot.id,
      expires,
      mode,
    });
    const params = new URLSearchParams({
      id: fileSnapshot.id,
      expires: String(expires),
      mode,
      token,
    });
    return `/api/storage-media?${params.toString()}`;
  };

  return createJsonResponse({
    id: fileSnapshot.id,
    name: String(file.name || "Media Mali Edu"),
    type,
    size: Number(file.size) || 0,
    mediaUrl: isVideo ? createMediaPath("stream") : String(file.url),
    allowDownload: isVideo && file.allowDownload === true,
    downloadUrl: isVideo && file.allowDownload === true ? createMediaPath("download") : null,
    createdAt: file.createdAt?.toDate?.().toISOString() || null,
  });
};

const onIncrementPostView = async ({ request }) => {
  const body = await request.json();
  const postId = String(body?.postId || "").trim();
  const viewerId = String(body?.viewerId || "").trim();

  if (!/^[A-Za-z0-9]{1,128}$/.test(postId) || !/^[A-Za-z0-9-]{16,64}$/.test(viewerId)) {
    return createJsonResponse({ error: "Invalid view payload" }, 400);
  }

  const postRef = getFirestoreDb().collection("posts").doc(postId);
  const viewRef = getFirestoreDb().collection("post_view_events").doc(`${postId}_${viewerId}`);

  const result = await getFirestoreDb().runTransaction(async (transaction) => {
    const [postSnapshot, viewSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(viewRef),
    ]);

    if (!postSnapshot.exists) return { status: 404, body: { error: "Post not found" } };
    const post = postSnapshot.data() || {};
    const publishAt = post.publishAt?.toDate?.();
    if (!post.isPublished || (publishAt && publishAt > new Date())) {
      return { status: 404, body: { error: "Post not found" } };
    }

    const currentViews = Number(post.views || 0);
    if (viewSnapshot.exists) {
      return { status: 200, body: { counted: false, views: currentViews } };
    }

    transaction.set(viewRef, {
      postId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    transaction.update(postRef, { views: FieldValue.increment(1) });
    return { status: 200, body: { counted: true, views: currentViews + 1 } };
  });

  return createJsonResponse(result.body, result.status);
};

const onIncrementCourseView = async ({ request }) => {
  const body = await request.json();
  const courseId = String(body?.courseId || "").trim();
  const viewerId = String(body?.viewerId || "").trim();

  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(courseId) ||
    !/^[A-Za-z0-9-]{16,64}$/.test(viewerId)
  ) {
    return createJsonResponse({ error: "Invalid view payload" }, 400);
  }

  const courseRef = getFirestoreDb().collection("courses").doc(courseId);
  const viewRef = getFirestoreDb()
    .collection("course_view_events")
    .doc(`${courseId}_${viewerId}`);

  const result = await getFirestoreDb().runTransaction(async (transaction) => {
    const [courseSnapshot, viewSnapshot] = await Promise.all([
      transaction.get(courseRef),
      transaction.get(viewRef),
    ]);

    if (!courseSnapshot.exists) {
      return { status: 404, body: { error: "Course not found" } };
    }

    const currentViews = Number(courseSnapshot.data()?.views || 0);
    if (viewSnapshot.exists) {
      return { status: 200, body: { counted: false, views: currentViews } };
    }

    transaction.set(viewRef, {
      courseId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    transaction.update(courseRef, { views: FieldValue.increment(1) });
    return { status: 200, body: { counted: true, views: currentViews + 1 } };
  });

  return createJsonResponse(result.body, result.status);
};

const onGetPublicBankSettings = async () => {
  const snapshot = await getFirestoreDb()
    .collection("system_settings")
    .doc("bank_payment_settings")
    .get();
  const source = snapshot.exists ? snapshot.data() || {} : {};
  const settings = Object.fromEntries(
    PUBLIC_BANK_SETTING_FIELDS.map((field) => [field, source[field] ?? null]),
  );

  return createJsonResponse(settings);
};

const onCreatePostFeedback = async ({ request }) => {
  const body = await request.json();
  const postId = String(body?.postId || "").trim();
  const name = String(body?.name || "Ẩn danh").trim().slice(0, 100);
  const message = String(body?.message || "").trim();

  if (
    !/^[A-Za-z0-9]{1,128}$/.test(postId) ||
    name.length < 1 ||
    message.length < 20 ||
    message.length > 3000
  ) {
    return createJsonResponse({ error: "Invalid feedback" }, 400);
  }

  const postSnapshot = await getFirestoreDb().collection("posts").doc(postId).get();
  const post = postSnapshot.exists ? postSnapshot.data() || {} : {};
  const publishAt = post.publishAt?.toDate?.();
  if (!postSnapshot.exists || !post.isPublished || (publishAt && publishAt > new Date())) {
    return createJsonResponse({ error: "Post not found" }, 404);
  }

  await getFirestoreDb().collection("post_feedback").add({
    createdAt: FieldValue.serverTimestamp(),
    isApproved: false,
    message,
    name,
    postId,
    postSlug: String(post.slug || "").slice(0, 200),
    postTitle: String(post.title || "").slice(0, 300),
    source: "news_detail",
    status: "pending",
  });

  return createJsonResponse({ success: true }, 201);
};

const onCreateNewsletterSubscription = async ({ request }) => {
  const body = await request.json();
  const email = String(body?.email || "").trim().toLowerCase();
  const sourceSlug = String(body?.sourceSlug || "").trim().slice(0, 200);
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[a-zA-Z0-9/_-]{0,200}$/.test(sourceSlug)
  ) {
    return createJsonResponse({ error: "Invalid email" }, 400);
  }

  const subscriberId = createHash("sha256").update(email).digest("hex");
  await getFirestoreDb().collection("newsletter_subscribers").doc(subscriberId).set(
    {
      email,
      lastSubscribedAt: FieldValue.serverTimestamp(),
      source: "news_detail",
      sourceSlug,
    },
    { merge: true },
  );

  return createJsonResponse({ success: true }, 201);
};

const toSerializableValue = (value) => {
  if (value?.toDate) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toSerializableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, toSerializableValue(child)]),
    );
  }
  return value;
};

const hashOrderAccessToken = (token) =>
  createHash("sha256").update(String(token || "")).digest("hex");

const isValidOrderAccessToken = (token, expectedHash) => {
  if (!token || !/^[a-f0-9]{64}$/i.test(String(expectedHash || ""))) return false;
  const actual = Buffer.from(hashOrderAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const getAuthorizedOrder = async ({ request, orderId }) => {
  if (!/^[A-Za-z0-9]{20}$/.test(orderId)) {
    throw createHttpError(404, "Order not found");
  }

  const reference = getFirestoreDb().collection("orders").doc(orderId);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    throw createHttpError(404, "Order not found");
  }

  const order = snapshot.data() || {};
  const user = await verifyRequestUser(request, { required: false });
  const token = getHeader(request.headers, "x-order-access-token").trim();
  const email = String(user?.email || "").trim().toLowerCase();
  const isAdmin = user
    ? (SUPER_ADMIN_EMAILS.has(email) && user.email_verified === true) || (
      await getFirestoreDb().collection("users").doc(user.uid).get()
    ).data()?.role === "admin"
    : false;
  const canRead =
    isAdmin ||
    (user && order.userId === user.uid) ||
    isValidOrderAccessToken(token, order.guestAccessTokenHash);
  if (!canRead) {
    throw createHttpError(404, "Order not found");
  }

  return { order, reference, snapshot };
};

const normalizeOrderAccessPlan = (plan, fallbackId = "legacy-lifetime") => {
  const accessType = plan?.accessType === "duration" ? "duration" : "lifetime";
  const price = Number(plan?.price);
  const salePrice = plan?.salePrice === null || plan?.salePrice === undefined || plan?.salePrice === ""
    ? null
    : Number(plan.salePrice);
  const effectivePrice = Number.isFinite(salePrice) && salePrice >= 0 && salePrice < price
    ? salePrice
    : price;
  if (!Number.isFinite(effectivePrice) || effectivePrice < 0 || effectivePrice > 1_000_000_000) {
    throw createHttpError(400, "Invalid course plan price");
  }

  const durationValue = accessType === "duration" ? Math.round(Number(plan.durationValue)) : null;
  const durationUnit = ["days", "months", "years"].includes(plan?.durationUnit)
    ? plan.durationUnit
    : "months";
  if (accessType === "duration" && (!Number.isFinite(durationValue) || durationValue < 1 || durationValue > 1200)) {
    throw createHttpError(400, "Invalid course access duration");
  }

  return {
    id: String(plan?.id || fallbackId).slice(0, 80),
    name: String(plan?.name || (accessType === "lifetime" ? "Truy cập vĩnh viễn" : "Gói thời hạn")).slice(0, 160),
    accessType,
    durationValue,
    durationUnit: accessType === "duration" ? durationUnit : null,
    originalPrice: Math.round(Number.isFinite(price) ? price : effectivePrice),
    price: Math.round(effectivePrice),
  };
};

const resolveOrderAccessPlan = (course, requestedPlanId) => {
  const configuredPlans = course?.accessPlansEnabled === true && Array.isArray(course.accessPlans)
    ? course.accessPlans.filter((plan) => plan && plan.isActive !== false)
    : [];

  if (configuredPlans.length === 0) {
    return normalizeOrderAccessPlan({
      id: "legacy-lifetime",
      name: "Truy cập vĩnh viễn",
      accessType: "lifetime",
      price: course.price,
      salePrice: course.salePrice,
    });
  }

  const normalizedRequestedId = String(requestedPlanId || "").trim();
  const selected = normalizedRequestedId
    ? configuredPlans.find((plan) => String(plan.id) === normalizedRequestedId)
    : configuredPlans.find((plan) => String(plan.id) === String(course.defaultAccessPlanId || ""))
      || configuredPlans.find((plan) => plan.isRecommended === true)
      || configuredPlans[0];
  if (!selected) {
    throw createHttpError(400, "Invalid course access plan");
  }
  return normalizeOrderAccessPlan(selected);
};

const onCreateOrder = async ({ request }) => {
  const body = await request.json();
  const requestedItems = Array.isArray(body?.items) ? body.items : [];
  const customerName = String(body?.customerName || "").trim();
  const customerPhone = String(body?.customerPhone || "").trim();
  const customerEmail = String(body?.customerEmail || "").trim().toLowerCase();
  const customerNote = String(body?.customerNote || "").trim().slice(0, 2000);

  if (
    requestedItems.length < 1 ||
    requestedItems.length > 20 ||
    customerName.length < 2 ||
    customerName.length > 120 ||
    !/^[0-9+ ().-]{9,20}$/.test(customerPhone) ||
    customerEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
  ) {
    return createJsonResponse({ error: "Invalid order information" }, 400);
  }

  const itemIds = requestedItems.map((item) => String(item?.id || item?.courseId || "").trim());
  if (itemIds.some((id) => !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
    return createJsonResponse({ error: "Invalid course selection" }, 400);
  }

  const uniqueItemIds = [...new Set(itemIds)];
  if (uniqueItemIds.length !== itemIds.length) {
    return createJsonResponse({ error: "Duplicate course selection" }, 400);
  }

  const courseRefs = uniqueItemIds.map((id) =>
    getFirestoreDb().collection("courses").doc(id),
  );
  const courseSnapshots = await getFirestoreDb().getAll(...courseRefs);
  if (courseSnapshots.some((snapshot) => !snapshot.exists)) {
    return createJsonResponse({ error: "Course not found" }, 404);
  }

  const items = courseSnapshots.map((snapshot, index) => {
    const course = snapshot.data() || {};
    const accessPlan = resolveOrderAccessPlan(course, requestedItems[index]?.accessPlanId);
    return {
      id: snapshot.id,
      name: String(course.name || "Khóa học").slice(0, 300),
      price: accessPlan.price,
      originalPrice: accessPlan.originalPrice,
      accessPlanId: accessPlan.id,
      accessPlanName: accessPlan.name,
      accessType: accessPlan.accessType,
      durationValue: accessPlan.durationValue,
      durationUnit: accessPlan.durationUnit,
      thumbnailUrl: String(course.thumbnailUrl || "").slice(0, 2048),
    };
  });
  const originalAmount = items.reduce((total, item) => total + item.price, 0);

  let couponCode = String(body?.couponCode || "").trim().toUpperCase();
  let discountPercent = 0;
  if (couponCode) {
    if (!/^[A-Z0-9_-]{2,40}$/.test(couponCode)) {
      return createJsonResponse({ error: "Invalid coupon" }, 400);
    }
    const couponSnapshot = await getFirestoreDb()
      .collection("coupons")
      .where("code", "==", couponCode)
      .where("isActive", "==", true)
      .limit(1)
      .get();
    const coupon = couponSnapshot.empty ? null : couponSnapshot.docs[0].data();
    const expiry = coupon?.expiryDate?.toDate?.() || (
      coupon?.expiryDate ? new Date(coupon.expiryDate) : null
    );
    const percentage = Number(coupon?.discountPercent);
    if (
      !coupon ||
      (expiry && (!Number.isFinite(expiry.getTime()) || expiry < new Date())) ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return createJsonResponse({ error: "Coupon is invalid or expired" }, 400);
    }
    discountPercent = percentage;
  } else {
    couponCode = null;
  }

  const user = await verifyRequestUser(request, { required: false });
  const guestAccessToken = user ? null : randomBytes(32).toString("base64url");
  const amount = Math.max(
    0,
    Math.round(originalAmount * (1 - discountPercent / 100)),
  );
  const orderCode = `MALI-${String(Date.now()).slice(-6)}${randomInt(10, 100)}`;
  const order = {
    amount,
    couponCode,
    courseId: items.length === 1 ? items[0].id : "cart-order",
    courseName: items.length === 1
      ? items[0].name
      : `Đơn hàng gồm ${items.length} khóa học`,
    createdAt: FieldValue.serverTimestamp(),
    customerEmail,
    customerName,
    customerNote,
    customerPhone,
    discountPercent,
    items,
    orderCode,
    originalAmount,
    status: "pending",
    updatedAt: FieldValue.serverTimestamp(),
    userEmail: String(user?.email || customerEmail).toLowerCase(),
    userId: user?.uid || null,
    ...(guestAccessToken
      ? { guestAccessTokenHash: hashOrderAccessToken(guestAccessToken) }
      : {}),
  };
  const orderRef = await getFirestoreDb().collection("orders").add(order);

  return createJsonResponse(
    {
      accessToken: guestAccessToken,
      id: orderRef.id,
      orderCode,
    },
    201,
  );
};

const onGetOrder = async ({ request, orderId }) => {
  const { order, snapshot } = await getAuthorizedOrder({ request, orderId });

  const safeOrder = { ...order };
  delete safeOrder.guestAccessTokenHash;
  return createJsonResponse({
    id: snapshot.id,
    ...toSerializableValue(safeOrder),
  });
};

const sanitizeMetaCookie = (value) => {
  const normalized = String(value || "").trim();
  return /^fb\.\d+\.\d{10,13}\.[A-Za-z0-9._-]{1,200}$/.test(normalized)
    ? normalized
    : "";
};

const sanitizeEventSourceUrl = (value) => {
  const normalized = String(value || "").trim().slice(0, 2048);
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const onTrackOrderPurchase = async ({ request, orderId }) => {
  const { order, reference } = await getAuthorizedOrder({ request, orderId });
  const accessToken = getMetaCapiAccessToken();
  const pixelId = String(process.env.META_PIXEL_ID || "1526874981588150").trim();
  if (!accessToken || !/^\d{5,30}$/.test(pixelId)) {
    throw createHttpError(503, "Purchase tracking is not configured");
  }

  const body = await request.json();
  const purchaseValue = Number(order.amount);
  if (String(order.status || "").toLowerCase() !== "completed") {
    throw createHttpError(409, "Purchase is only tracked after payment is completed");
  }
  if (!Number.isFinite(purchaseValue) || purchaseValue <= 0) {
    return createJsonResponse({
      success: true,
      skipped: true,
      reason: "non_positive_purchase_value",
    });
  }

  const claimed = await getFirestoreDb().runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(reference);
    const current = currentSnapshot.data() || {};
    const startedAt = current.metaPurchaseTrackingStartedAt?.toDate?.();
    const claimIsFresh = startedAt
      && Date.now() - startedAt.getTime() < 10 * 60 * 1000;
    if (current.metaPurchaseTrackedAt || claimIsFresh) {
      return false;
    }
    transaction.update(reference, {
      metaPurchaseTrackingStartedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
  if (!claimed) {
    return createJsonResponse({ success: true, alreadyTracked: true });
  }

  const phone = String(order.customerPhone || "")
    .replace(/\D/g, "")
    .replace(/^0/, "84");
  const nameParts = String(order.customerName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.at(-1) || "";
  const lastName = nameParts.slice(0, -1).join(" ");
  const hashedEmail = hashData(String(order.customerEmail || ""));
  const hashedPhone = hashData(phone);
  const hashedFirstName = hashData(normalizeNameForHash(firstName));
  const hashedLastName = hashData(normalizeNameForHash(lastName));
  const userData = {
    ...(hashedEmail ? { em: [hashedEmail] } : {}),
    ...(hashedPhone ? { ph: [hashedPhone] } : {}),
    ...(hashedFirstName ? { fn: [hashedFirstName] } : {}),
    ...(hashedLastName ? { ln: [hashedLastName] } : {}),
    client_ip_address: getClientIp(request),
    client_user_agent: getHeader(request.headers, "user-agent").slice(0, 500),
    ...(sanitizeMetaCookie(body?.fbp) ? { fbp: sanitizeMetaCookie(body.fbp) } : {}),
    ...(sanitizeMetaCookie(body?.fbc) ? { fbc: sanitizeMetaCookie(body.fbc) } : {}),
  };
  const items = Array.isArray(order.items) ? order.items : [];
  const customData = {
    content_name: String(order.courseName || "").slice(0, 300),
    content_ids: items.map((item) => String(item.id || "")).filter(Boolean).slice(0, 20),
    content_type: "product",
    currency: "VND",
    num_items: items.length || 1,
    value: purchaseValue,
  };

  try {
    const result = await sendMetaCapiEvent({
      accessToken,
      customData,
      eventId: String(order.orderCode || orderId),
      eventName: "Purchase",
      pixelId,
      sourceUrl: sanitizeEventSourceUrl(body?.sourceUrl),
      userData,
    });
    if (!result || result.error) {
      throw new Error("Meta rejected the purchase event");
    }
    await reference.update({
      metaPurchaseTrackedAt: FieldValue.serverTimestamp(),
      metaPurchaseTrackingStartedAt: FieldValue.delete(),
    });
    return createJsonResponse({ success: true });
  } catch (error) {
    await reference.update({
      metaPurchaseTrackingErrorAt: FieldValue.serverTimestamp(),
      metaPurchaseTrackingStartedAt: FieldValue.delete(),
    });
    console.error("[CAPI] Purchase tracking failed:", error);
    throw createHttpError(502, "Purchase tracking failed");
  }
};

const adminLandingHandlers = createAdminLandingHandlers({
  createJsonResponse,
  getCrmDatabase,
  getCrmFirestore,
  scheduleDocumentId: "khoi_thong_dong_tien_schedule",
});

const ROUTES = new Map([
  ["GET /api/admin/landings", adminLandingHandlers.getWorkspace],
  ["POST /api/admin/landings/delete", adminLandingHandlers.delete],
  ["POST /api/admin/landings/repair-sources", adminLandingHandlers.repairSources],
  ["POST /api/admin/landings/routing", adminLandingHandlers.updateRouting],
  ["POST /api/admin/landings/save", adminLandingHandlers.save],
  ["POST /api/admin/landings/schedule", adminLandingHandlers.saveSchedule],
  ["GET /api/bank-settings", onGetPublicBankSettings],
  ["POST /api/crm-leads", onCreateCrmLead],
  ["POST /api/newsletter", onCreateNewsletterSubscription],
  ["POST /api/orders", onCreateOrder],
  ["POST /api/course-view", onIncrementCourseView],
  ["POST /api/post-feedback", onCreatePostFeedback],
  ["POST /api/post-view", onIncrementPostView],
  ["GET /api/storage-share", onGetStorageShare],
  ["GET /api/s3-multipart/health", onHealth],
  ["POST /api/s3-multipart/abort", onAbort],
  ["POST /api/s3-multipart/complete", onComplete],
  ["POST /api/s3-multipart/init", onInit],
  ["POST /api/s3-multipart/sign-part", onSignPart],
]);

const normalizeRequestPath = (request) => {
  const rawPath =
    request.path ||
    request.originalUrl ||
    request.url ||
    "/";
  const withoutQuery = rawPath.split("?")[0] || "/";
  const apiIndex = withoutQuery.indexOf("/api/");
  const normalizedPath = apiIndex >= 0
    ? withoutQuery.slice(apiIndex)
    : withoutQuery;

  return normalizedPath.replace(/\/+$/, "") || "/";
};

const getPublicApiError = (error, normalizedPath) => {
  const originalStatus = Number(error?.status) || 500;
  const errorText = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  const isCrmAccessFailure = (
    (PROTECTED_ADMIN_LANDING_PATHS.has(normalizedPath) || normalizedPath === "/api/crm-leads")
    && (
      /permission[_ -]?denied/.test(errorText)
      || /invalid credential/.test(errorText)
      || /default credentials/.test(errorText)
      || /^7\b/.test(errorText.trim())
    )
  );

  if (isCrmAccessFailure) {
    return {
      status: 503,
      body: {
        code: "crm/access-denied",
        error: "Backend Website ch\u01b0a \u0111\u01b0\u1ee3c CRM c\u1ea5p \u0111\u1ee7 quy\u1ec1n truy c\u1eadp.",
      },
    };
  }

  return {
    status: originalStatus,
    body: {
      error: originalStatus >= 500
        ? "Service is temporarily unavailable"
        : error?.message || "Request failed",
      ...(originalStatus < 500 && error?.code ? { code: error.code } : {}),
      ...(originalStatus < 500 && error?.details ? { details: error.details } : {}),
    },
  };
};

const getStorageMediaTokenSecret = () =>
  STORAGE_MEDIA_TOKEN_SECRET.value() || "";

const isAllowedStorageUrl = (value) => {
  const endpoint = String(
    process.env.S3_ENDPOINT || process.env.VITE_S3_ENDPOINT || "",
  ).trim();
  const bucket = String(
    process.env.S3_BUCKET || process.env.VITE_S3_BUCKET || "",
  ).trim();
  if (!endpoint || !bucket) return false;

  try {
    const endpointUrl = new URL(endpoint);
    const candidateUrl = new URL(String(value || ""));
    const endpointPath = endpointUrl.pathname.replace(/\/+$/, "");
    const allowedPathPrefix = `${endpointPath}/${encodeURIComponent(bucket)}/`
      .replace(/\/{2,}/g, "/");
    return (
      endpointUrl.protocol === "https:" &&
      candidateUrl.protocol === "https:" &&
      candidateUrl.origin === endpointUrl.origin &&
      candidateUrl.pathname.startsWith(allowedPathPrefix)
    );
  } catch {
    return false;
  }
};

const createStorageMediaToken = ({ fileId, expires, mode }) => {
  const secret = getStorageMediaTokenSecret();
  if (!secret) {
    throw new Error("Missing storage media token secret");
  }

  return createHmac("sha256", secret)
    .update(`${fileId}:${expires}:${mode}`)
    .digest("base64url");
};

const isValidStorageMediaToken = ({ fileId, expires, mode, token }) => {
  if (!token || !Number.isInteger(expires) || expires < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = createStorageMediaToken({ fileId, expires, mode });
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer);
};

const parseCappedRange = (rangeHeader, totalSize) => {
  const match = /^bytes=(\d+)-(\d*)$/i.exec(String(rangeHeader || "").trim());
  if (!match || !Number.isFinite(totalSize) || totalSize <= 0) return null;

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : totalSize - 1;
  if (!Number.isInteger(start) || !Number.isInteger(requestedEnd) || start >= totalSize || requestedEnd < start) {
    return null;
  }

  return {
    start,
    end: Math.min(requestedEnd, start + STORAGE_MEDIA_MAX_RANGE_BYTES - 1, totalSize - 1),
  };
};

const pipeWebResponseBody = (body, response) =>
  new Promise((resolve, reject) => {
    const stream = Readable.fromWeb(body);
    stream.on("error", reject);
    response.on("finish", resolve);
    response.on("close", resolve);
    stream.pipe(response);
  });

const handleStorageMediaRequest = async (request, response) => {
  const requestUrl = new URL(
    `${request.protocol || "https"}://${request.get("host")}${request.originalUrl || request.url || "/"}`,
  );
  const fileId = String(requestUrl.searchParams.get("id") || "").trim();
  const mode = requestUrl.searchParams.get("mode") === "download" ? "download" : "stream";
  const expires = Number(requestUrl.searchParams.get("expires"));
  const token = String(requestUrl.searchParams.get("token") || "");

  if (!fileId || fileId.includes("/") || !isValidStorageMediaToken({ fileId, expires, mode, token })) {
    return response.status(404).set("cache-control", "no-store").send("Media not found");
  }

  const fileSnapshot = await getFirestoreDb().collection("storage_files").doc(fileId).get();
  const file = fileSnapshot.exists ? fileSnapshot.data() || {} : {};
  const type = String(file.type || "");
  const isVideo = type.startsWith("video/");

  if (
    !fileSnapshot.exists ||
    !file.isPublic ||
    file.isDeleted ||
    !isVideo ||
    !isAllowedStorageUrl(file.url)
  ) {
    return response.status(404).set("cache-control", "no-store").send("Media not found");
  }

  if (mode === "download" && file.allowDownload !== true) {
    return response.status(404).set("cache-control", "no-store").send("Media not found");
  }

  const upstreamHeaders = {};
  if (mode === "stream") {
    const range = parseCappedRange(request.headers.range, Number(file.size));
    if (!range) {
      return response
        .status(416)
        .set({
          "accept-ranges": "bytes",
          "cache-control": "no-store",
          "content-range": `bytes */${Number(file.size) || "*"}`,
        })
        .send("Range request required");
    }
    upstreamHeaders.range = `bytes=${range.start}-${range.end}`;
  }

  const upstream = await fetch(String(file.url), { headers: upstreamHeaders });
  if (!upstream.ok || !upstream.body) {
    return response.status(upstream.status || 502).set("cache-control", "no-store").send("Unable to load media");
  }
  if (mode === "stream" && upstream.status !== 206) {
    return response.status(502).set("cache-control", "no-store").send("Media range streaming unavailable");
  }

  response.status(mode === "stream" ? 206 : 200);
  response.set({
    "accept-ranges": "bytes",
    "cache-control": "private, no-store, max-age=0",
    "content-type": upstream.headers.get("content-type") || type || "video/mp4",
    "content-disposition": mode === "download"
      ? `attachment; filename*=UTF-8''${encodeURIComponent(String(file.name || "video.mp4"))}`
      : "inline",
    "x-content-type-options": "nosniff",
  });

  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentLength) response.set("content-length", contentLength);
  if (contentRange) response.set("content-range", contentRange);

  return pipeWebResponseBody(upstream.body, response);
};

const getRawBodyText = (request) => {
  if (Buffer.isBuffer(request.rawBody) && request.rawBody.length > 0) {
    return request.rawBody.toString("utf8");
  }

  if (typeof request.body === "string") {
    return request.body;
  }

  if (request.body != null && typeof request.body === "object") {
    return JSON.stringify(request.body);
  }

  return "";
};

const createRequestAdapter = (request) => {
  const rawBodyText = getRawBodyText(request);

  return {
    method: request.method,
    url: `${request.protocol || "https"}://${request.get("host")}${request.originalUrl || request.url || "/"}`,
    headers: request.headers,
    json: async () => {
      if (request.body != null && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
        return request.body;
      }

      return JSON.parse(rawBodyText || "{}");
    },
    text: async () => rawBodyText,
  };
};

const sendWebResponse = async (response, expressResponse) => {
  expressResponse.status(response.status);

  response.headers.forEach((value, key) => {
    expressResponse.setHeader(key, value);
  });

  expressResponse.send(await response.text());
};

// --- TRIGGER CAPI KHI CÓ LEAD MỚI VÀO CRM ---
export const onCrmLeadCreated = onValueCreated(
  {
    ref: "funnels/{funnelType}/{leadId}",
    region: "asia-southeast1",
    secrets: [META_CAPI_ACCESS_TOKEN_SECRET],
  },
  async (event) => {
    const leadData = event.data.val();
    if (!leadData) return;
    try {
      const capiResult = await sendCrmLeadMetaEvents({
        leadData,
        leadId: event.params.leadId,
      });
      console.log(`[CAPI] RTDB lead ${event.params.leadId} processed:`, capiResult);
    } catch (error) {
      console.error("[CAPI] Critical Error:", error);
    }
  }
);

export const uploadApi = onRequest(
  {
    invoker: "public",
    region: "asia-southeast1",
    secrets: [
      META_CAPI_ACCESS_TOKEN_SECRET,
      S3_ACCESS_KEY_SECRET,
      S3_SECRET_KEY_SECRET,
      STORAGE_MEDIA_TOKEN_SECRET,
    ],
  },
  async (request, response) => {
    const normalizedPath = normalizeRequestPath(request);
    const method = request.method.toUpperCase();
    const routeKey = `${method} ${normalizedPath}`;

    response.set({
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    });

    try {
      const contentLength = Number(getHeader(request.headers, "content-length"));
      const rawBodyLength = Buffer.isBuffer(request.rawBody)
        ? request.rawBody.length
        : 0;
      if (
        (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) ||
        rawBodyLength > MAX_JSON_BODY_BYTES
      ) {
        throw createHttpError(413, "Request body is too large");
      }

      const orderMatch = /^\/api\/orders\/([A-Za-z0-9]{20})$/.exec(normalizedPath);
      const purchaseMatch =
        /^\/api\/orders\/([A-Za-z0-9]{20})\/meta-purchase$/.exec(normalizedPath);
      enforceRateLimit(
        request,
        orderMatch || purchaseMatch ? "/api/orders" : normalizedPath,
      );

      if (method === "GET" && normalizedPath === "/api/storage-media") {
        return await handleStorageMediaRequest(request, response);
      }

      const adaptedRequest = createRequestAdapter(request);
      if (method === "GET" && orderMatch) {
        const result = await onGetOrder({
          orderId: orderMatch[1],
          request: adaptedRequest,
        });
        return sendWebResponse(result, response);
      }
      if (method === "POST" && purchaseMatch) {
        const result = await onTrackOrderPurchase({
          orderId: purchaseMatch[1],
          request: adaptedRequest,
        });
        return sendWebResponse(result, response);
      }

      const handler = ROUTES.get(routeKey);
      if (!handler) {
        return sendWebResponse(
          createJsonResponse({ error: "API route not found" }, 404),
          response,
        );
      }

      let adminUser = null;
      if (
        PROTECTED_MULTIPART_PATHS.has(normalizedPath)
        || PROTECTED_ADMIN_LANDING_PATHS.has(normalizedPath)
      ) {
        adminUser = await requireAdminRequest(request);
      }
      const result = await handler({
        adminUser,
        request: adaptedRequest,
        env: process.env,
      });

      return sendWebResponse(result, response);
    } catch (error) {
      const publicError = getPublicApiError(error, normalizedPath);
      const { status } = publicError;
      if (status >= 500) {
        console.error(`API error for ${routeKey}:`, error);
      }
      if (normalizedPath === "/api/storage-media") {
        return response
          .status(status >= 400 && status < 500 ? status : 500)
          .set("cache-control", "no-store")
          .send(status >= 400 && status < 500 ? error.message : "Unable to load media");
      }

      return sendWebResponse(
        createJsonResponse(publicError.body, status),
        response,
      );
    }
  },
);

export const publishScheduledPosts = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Asia/Bangkok",
    region: "asia-southeast1",
  },
  async () => {
    const postsCollection = getFirestoreDb().collection("posts");
    const now = new Date();
    let candidateSnapshot;

    try {
      candidateSnapshot = await postsCollection
        .where("isScheduled", "==", true)
        .where("publishAt", "<=", now)
        .orderBy("publishAt", "asc")
        .limit(100)
        .get();
    } catch (error) {
      const isMissingIndex = Number(error?.code) === 9
        || String(error?.message || "").includes("requires an index");
      if (!isMissingIndex) throw error;

      console.warn("Scheduled-post index is unavailable; using safe fallback query.");
      candidateSnapshot = await postsCollection
        .where("isScheduled", "==", true)
        .limit(500)
        .get();
    }

    const duePosts = candidateSnapshot.docs.filter((postSnapshot) => {
      const publishAt = postSnapshot.data().publishAt?.toDate?.();
      return publishAt && publishAt <= now;
    });
    if (duePosts.length === 0) return;

    const batch = getFirestoreDb().batch();
    duePosts.forEach((postSnapshot) => {
      const post = postSnapshot.data();
      batch.update(postSnapshot.ref, {
        isPublished: true,
        isScheduled: false,
        publishedAt: post.publishAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  },
);
