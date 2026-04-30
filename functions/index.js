import { Buffer } from "node:buffer";
import process from "node:process";

import { onRequest } from "firebase-functions/v2/https";
import { onValueCreated } from "firebase-functions/v2/database";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { hashData, normalizeNameForHash, sendMetaCapiEvent } from "./capi_helper.js";

initializeApp();
const firestore = getFirestore();

import { onRequestPost as onAbort } from "./api/s3-multipart/abort.js";
import { onRequestPost as onComplete } from "./api/s3-multipart/complete.js";
import { onRequestGet as onHealth } from "./api/s3-multipart/health.js";
import { onRequestPost as onInit } from "./api/s3-multipart/init.js";
import { onRequestPost as onSignPart } from "./api/s3-multipart/sign-part.js";
import { createJsonResponse } from "./_lib/s3MultipartV3.js";

const ROUTES = new Map([
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
        fbCapiToken = "EAAOUx21ZARaYBRfZAG6fz5Qu91I2BHi5rxB3oXZC2sj1B9bihBid363ZCPvoR3sWyMuUAgj9ECQrRDz4I6k1m5kyhG2DuDxTClDK3HXTOKQpvgbOdzZBy1u2Tj21MIokscDTlaZBTZB5ObZBwlXds62pg8tJF2ZC47uVLPCUXyU7OxZBBxRvfIkQCjQ39XqZCgxmL8YgwZDZD";
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
          customData: { content_name: leadData.courseName || "Đăng ký Landing" },
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
            value: leadData.fbEventValue || 0,
            currency: leadData.fbCurrency || "VND",
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
    const routeKey = `${request.method.toUpperCase()} ${normalizeRequestPath(request)}`;
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
