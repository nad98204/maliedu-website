import { createJsonResponse } from "../_lib/s3MultipartV3.js";

const DEFAULT_CRM_DATABASE_URL =
  "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app";

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

const createErrorResponse = (message, status = 400) =>
  createJsonResponse({ error: message }, status);

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
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

    if (name.length < 2 || phoneDigits.length < 9 || phoneDigits.length > 15) {
      return createErrorResponse("Invalid lead contact info", 400);
    }

    const databaseUrl = String(context.env.CRM_DATABASE_URL || DEFAULT_CRM_DATABASE_URL).replace(/\/+$/, "");
    const response = await fetch(`${databaseUrl}/${nodePath}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        name,
        phone,
        createdAt: payload.createdAt || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.name) {
      return createErrorResponse(result?.error || `CRM database error (${response.status})`, response.status || 500);
    }

    return createJsonResponse({ success: true, id: result.name });
  } catch (error) {
    return createErrorResponse(error?.message || "Unexpected CRM API error", 500);
  }
}
