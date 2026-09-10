import { createJsonResponse } from "../_lib/s3MultipartV3.js";

const DEFAULT_CRM_DATABASE_URL =
  "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app";

const ALLOWED_CRM_FUNNEL_PATHS = new Set([
  "funnels/ads",
  "funnels/brand",
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

const ALLOWED_FIELDS = new Set([
  "assignedName", "assigned_to", "batchName", "batch_id", "courseName", "course_k",
  "cpCampaign", "cpContent", "cpMedium", "cpSource", "cpTerm", "customerNote", "email",
  "fbCurrency", "fbEventValue", "fbc", "fbp", "funnel_channel", "funnel_type",
  "ghiChu", "ghi_chu", "hasRegisteredLHD", "is_learned_loa", "landingPageId",
  "landingPageSlug", "lead_event_id", "leaderName", "leaderSlug", "leaderUtm",
  "leader_utm", "meta_event_id", "name", "note", "other_referrer_name", "phone",
  "referrer", "referrer_type", "registered_loa", "remarks", "sourceUrl", "source_key",
  "source_type", "staff_in_charge", "targetFunnel", "test_event_code", "utm_owner",
  "utm_owner_slug", "introducedBy",
]);
const LONG_TEXT_FIELDS = new Set([
  "customerNote", "ghiChu", "ghi_chu", "note", "remarks", "sourceUrl",
]);
const MAX_BODY_BYTES = 32 * 1024;

const jsonResponse = (data, status = 200) => {
  const response = createJsonResponse(data, status);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
};
const createErrorResponse = (message, status = 400) => jsonResponse({ error: message }, status);

const sanitizePayload = (payload) => Object.fromEntries(
  Object.entries(payload)
    .filter(([key]) => ALLOWED_FIELDS.has(key))
    .map(([key, value]) => [key,
      typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))
        ? value
        : String(value ?? "").trim().slice(0, LONG_TEXT_FIELDS.has(key) ? 2000 : 300),
    ]),
);

export async function onRequestPost(context) {
  try {
    if (Number(context.request.headers.get("content-length")) > MAX_BODY_BYTES) {
      return createErrorResponse("Request body is too large", 413);
    }
    const rawBody = await context.request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return createErrorResponse("Request body is too large", 413);
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return createErrorResponse("Invalid JSON payload", 400);
    }
    const nodePath = normalizeCrmNodePath(body?.nodePath);
    const payload = body?.payload;

    if (!ALLOWED_CRM_FUNNEL_PATHS.has(nodePath)) {
      return createErrorResponse("Invalid CRM funnel path", 400);
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return createErrorResponse("Invalid CRM payload", 400);
    }

    const name = String(payload.name || "").trim();
    const phone = normalizeLeadPhone(payload.phone);
    const phoneDigits = phone.replace(/\D/g, "");
    const sourceKey = String(payload.source_key || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();

    if (name.length < 2 || name.length > 120 || phoneDigits.length < 9 || phoneDigits.length > 15 ||
      !/^[0-9+ ().-]{9,20}$/.test(phone) || !/^[a-zA-Z0-9_-]{2,100}$/.test(sourceKey) ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return createErrorResponse("Invalid lead contact info", 400);
    }

    const databaseUrl = String(context.env?.CRM_DATABASE_URL || DEFAULT_CRM_DATABASE_URL).replace(/\/+$/, "");
    const now = new Date().toISOString();
    const response = await fetch(`${databaseUrl}/${nodePath}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sanitizePayload(payload),
        name,
        phone,
        email,
        source_key: sourceKey,
        status: "NEW",
        createdVia: "landing",
        createdAt: now,
        receivedAt: now,
        clientIp: context.request.headers.get("CF-Connecting-IP") || "",
        userAgent: (context.request.headers.get("user-agent") || "").slice(0, 500),
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.name) {
      return createErrorResponse("CRM database is temporarily unavailable", 502);
    }

    return jsonResponse({ success: true, id: result.name });
  } catch {
    return createErrorResponse("CRM submission is temporarily unavailable", 502);
  }
}
