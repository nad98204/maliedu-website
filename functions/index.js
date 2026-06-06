import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import process from "node:process";
import { Readable } from "node:stream";

import { onRequest } from "firebase-functions/v2/https";
import { onValueCreated } from "firebase-functions/v2/database";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { hashData, normalizeNameForHash, sendMetaCapiEvent } from "./capi_helper.js";

initializeApp();
const firestore = getFirestore();
const CRM_DATABASE_URL =
  process.env.CRM_DATABASE_URL ||
  "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app";
const crmAdminApp = initializeApp({ databaseURL: CRM_DATABASE_URL }, "crm-admin");
const crmDatabase = getDatabase(crmAdminApp);
const STORAGE_MEDIA_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const STORAGE_MEDIA_MAX_RANGE_BYTES = 8 * 1024 * 1024;

import { onRequestPost as onAbort } from "./api/s3-multipart/abort.js";
import { onRequestPost as onComplete } from "./api/s3-multipart/complete.js";
import { onRequestGet as onHealth } from "./api/s3-multipart/health.js";
import { onRequestPost as onInit } from "./api/s3-multipart/init.js";
import { onRequestPost as onSignPart } from "./api/s3-multipart/sign-part.js";
import { createJsonResponse } from "./_lib/s3MultipartV3.js";

const ALLOWED_CRM_FUNNEL_PATHS = new Set([
  "funnels/ads",
  "funnels/leader",
  "funnels/thuonghieu",
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

  const name = String(payload.name || "").trim();
  const phone = normalizeLeadPhone(payload.phone);
  const phoneDigits = phone.replace(/\D/g, "");

  if (name.length < 2 || phoneDigits.length < 9 || phoneDigits.length > 15) {
    return createJsonResponse({ error: "Invalid lead contact info" }, 400);
  }

  const leadRef = crmDatabase.ref(nodePath).push();
  await leadRef.set({
    ...payload,
    name,
    phone,
    createdAt: payload.createdAt || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  });

  return createJsonResponse({ success: true, id: leadRef.key });
};

const onGetStorageShare = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const fileId = String(requestUrl.searchParams.get("id") || "").trim();

  if (!fileId || fileId.length > 200 || fileId.includes("/")) {
    return createJsonResponse({ error: "Media not found" }, 404);
  }

  const fileSnapshot = await firestore.collection("storage_files").doc(fileId).get();

  if (!fileSnapshot.exists) {
    return createJsonResponse({ error: "Media not found" }, 404);
  }

  const file = fileSnapshot.data() || {};
  const type = String(file.type || "");
  const isShareableMedia = type.startsWith("image/") || type.startsWith("video/");

  if (!file.isPublic || file.isDeleted || !isShareableMedia || !file.url) {
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

const ROUTES = new Map([
  ["POST /api/crm-leads", onCreateCrmLead],
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

const getStorageMediaTokenSecret = () =>
  process.env.STORAGE_MEDIA_TOKEN_SECRET ||
  process.env.VITE_S3_SECRET_KEY ||
  process.env.S3_SECRET_KEY ||
  "";

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

  const fileSnapshot = await firestore.collection("storage_files").doc(fileId).get();
  const file = fileSnapshot.exists ? fileSnapshot.data() || {} : {};
  const type = String(file.type || "");
  const isVideo = type.startsWith("video/");

  if (!fileSnapshot.exists || !file.isPublic || file.isDeleted || !isVideo || !file.url) {
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
  },
  async (event) => {
    const leadData = event.data.val();
    if (!leadData) return;

    // Chỉ xử lý nếu có ID sự kiện tracking
    const leadEventId = leadData.lead_event_id;
    const metaEventId = leadData.meta_event_id;
    if (!leadEventId && !metaEventId) {
      console.log("[CAPI] No tracking IDs found for lead:", event.params.leadId);
      return;
    }

    try {
      const pixelId = leadData.fbPixel || "1526874981588150"; // Fallback to default
      const landingPageId = leadData.landingPageId;
      
      let fbCapiToken = "";
      let fbPixel = pixelId;

      // Lấy cấu hình Pixel/Token từ Firestore
      if (landingPageId) {
        const lpDoc = await firestore.collection("landing_pages").doc(landingPageId).get();
        if (lpDoc.exists) {
          const config = lpDoc.data();
          fbCapiToken = config.fbCapiToken;
          fbPixel = config.fbPixel || pixelId;
        }
      }

      // Nếu landing page không có token riêng, lấy ở config chung
      if (!fbCapiToken) {
        const configDoc = await firestore.collection("public_settings").doc("landing_config").get();
        if (configDoc.exists) {
          fbCapiToken = configDoc.data().fbCapiToken;
        }
      }

      if (!fbCapiToken) {
        console.log(`[CAPI] No Capi Token found in Firestore, using hardcoded fallback.`);
        fbCapiToken = "EAAOUx21ZARaYBQ6jZAiffdq7ZCsCj7Xko24I8De60ufxpJ0ZBNGE1dbbJBI8MDDeZB8n37IhzpUPZAahSZA69WFnDiTAB9wwfriQIoeKQUjVj6pzIumRzDCXHLGATDxJOAlZAiz3wIdYhwo0aTwoZAEFNTBZCRVKDZC7OvjtZBfQ1TUHXAdWFAii06GZBGRRe5I8ZBSsm51QZDZD";
      }

      if (!fbCapiToken) {
        console.error("[CAPI] No CAPI Token found for lead:", event.params.leadId);
        return;
      }

      // Chuẩn bị User Data (Hashing server-side để đảm bảo an toàn)
      const rawPhone = leadData.phone || "";
      const normalizedPhone = rawPhone.replace(/\D/g, "").replace(/^0/, "84");
      const hashedPhone = normalizedPhone ? hashData(normalizedPhone) : "";

      const rawName = leadData.name || "";
      const nameParts = rawName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
      const lastName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";
      const hashedFn = firstName ? hashData(normalizeNameForHash(firstName)) : "";
      const hashedLn = lastName ? hashData(normalizeNameForHash(lastName)) : "";
      const hashedExternalId = hashData(event.params.leadId);

      const userData = {
        ...(hashedPhone ? { ph: [hashedPhone] } : {}),
        ...(hashedFn ? { fn: [hashedFn] } : {}),
        ...(hashedLn ? { ln: [hashedLn] } : {}),
        ...(hashedExternalId ? { external_id: [hashedExternalId] } : {}),
        ...(leadData.fbp ? { fbp: leadData.fbp } : {}),
        ...(leadData.fbc ? { fbc: leadData.fbc } : {}),
        ...(leadData.clientIp ? { client_ip_address: leadData.clientIp } : {}),
        client_user_agent: leadData.userAgent || "",
      };

      const commonParams = {
        pixelId: fbPixel,
        accessToken: fbCapiToken,
        userData,
        sourceUrl: leadData.sourceUrl || "",
        testEventCode: leadData.test_event_code || "",
      };

      // Gửi sự kiện Lead
      if (leadEventId) {
        const result = await sendMetaCapiEvent({
          ...commonParams,
          eventName: "Lead",
          eventId: leadEventId,
          customData: { 
            content_name: leadData.courseName || "Đăng ký Landing",
            value: Number(leadData.fbEventValue) || 110000,
            currency: leadData.fbCurrency || "VND"
          },
        });
        console.log(`[CAPI] Meta Response (Lead):`, JSON.stringify(result));
      }

      // Gửi sự kiện CompleteRegistration
      if (metaEventId) {
        const result = await sendMetaCapiEvent({
          ...commonParams,
          eventName: "CompleteRegistration",
          eventId: metaEventId,
          customData: {
            content_name: leadData.courseName || "Xác nhận Đăng ký Landing",
            value: Number(leadData.fbEventValue) || 110000,
            currency: leadData.fbCurrency || "VND",
            status: true
          },
        });
        console.log(`[CAPI] Meta Response (CompleteRegistration):`, JSON.stringify(result));
      }

      console.log(`[CAPI] Finished processing lead: ${event.params.leadId}`);
    } catch (error) {
      console.error("[CAPI] Critical Error:", error);
    }
  }
);

export const uploadApi = onRequest(
  {
    region: "asia-southeast1",
  },
  async (request, response) => {
    const normalizedPath = normalizeRequestPath(request);
    if (request.method.toUpperCase() === "GET" && normalizedPath === "/api/storage-media") {
      try {
        return await handleStorageMediaRequest(request, response);
      } catch (error) {
        console.error("Storage media proxy error:", error);
        return response.status(500).set("cache-control", "no-store").send("Unable to load media");
      }
    }

    const routeKey = `${request.method.toUpperCase()} ${normalizedPath}`;
    const handler = ROUTES.get(routeKey);

    if (!handler) {
      return sendWebResponse(
        createJsonResponse(
          { error: `Upload route not found: ${routeKey}` },
          404,
        ),
        response,
      );
    }

    try {
      const result = await handler({
        request: createRequestAdapter(request),
        env: process.env,
      });

      return sendWebResponse(result, response);
    } catch (error) {
      return sendWebResponse(
        createJsonResponse(
          {
            error:
              error?.message ||
              "Unexpected upload API error",
          },
          error?.status || 500,
        ),
        response,
      );
    }
  },
);
