import { CRM_FIREBASE_PUBLIC_CONFIG } from "../constants/crmFirebasePublicConfig";

const FIRESTORE_DOCUMENTS_URL = `https://firestore.googleapis.com/v1/projects/${CRM_FIREBASE_PUBLIC_CONFIG.projectId}/databases/(default)/documents`;

const requestCache = new Map();

const decodeFirestoreValue = (value = {}) => {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if ("bytesValue" in value) return value.bytesValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ("mapValue" in value) {
    return decodeFirestoreFields(value.mapValue.fields || {});
  }
  return undefined;
};

const decodeFirestoreFields = (fields = {}) =>
  Object.fromEntries(
    Object.entries(fields)
      .map(([key, value]) => [key, decodeFirestoreValue(value)])
      .filter(([, value]) => value !== undefined),
  );

const decodeDocument = (document) => {
  if (!document?.name) return null;
  return {
    __documentId: document.name.split("/").pop(),
    ...decodeFirestoreFields(document.fields || {}),
  };
};

const encodeFirestoreValue = (value) => {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  return { stringValue: String(value) };
};

const cachedRequest = (key, request) => {
  if (!requestCache.has(key)) {
    const promise = request().catch((error) => {
      requestCache.delete(key);
      throw error;
    });
    requestCache.set(key, promise);
  }
  return requestCache.get(key);
};

const assertOk = async (response) => {
  if (response.ok) return response;

  let message = `Firestore REST request failed (${response.status})`;
  try {
    const payload = await response.json();
    if (payload?.error?.message) message = payload.error.message;
  } catch {
    // Keep the status-only message when the response is not JSON.
  }
  throw new Error(message);
};

export const getPublicFirestoreDocument = async (collectionId, documentId, fields = []) => {
  if (!collectionId || !documentId) return null;

  const url = new URL(`${FIRESTORE_DOCUMENTS_URL}/${encodeURIComponent(collectionId)}/${encodeURIComponent(documentId)}`);
  fields.forEach((fieldPath) => url.searchParams.append("mask.fieldPaths", fieldPath));
  const cacheKey = `get:${url}`;

  return cachedRequest(cacheKey, async () => {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (response.status === 404) return null;
    await assertOk(response);
    return decodeDocument(await response.json());
  });
};

export const queryPublicFirestoreDocuments = async ({
  collectionId,
  fieldPath,
  value,
  fields = [],
  limit = 1,
}) => {
  if (!collectionId || !fieldPath || value === undefined) return [];

  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      select: { fields: fields.map((selectedField) => ({ fieldPath: selectedField })) },
      where: {
        fieldFilter: {
          field: { fieldPath },
          op: "EQUAL",
          value: encodeFirestoreValue(value),
        },
      },
      limit,
    },
  };
  const cacheKey = `query:${JSON.stringify(body)}`;

  return cachedRequest(cacheKey, async () => {
    const response = await fetch(`${FIRESTORE_DOCUMENTS_URL}:runQuery`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    await assertOk(response);
    const payload = await response.json();
    return payload.map((item) => decodeDocument(item.document)).filter(Boolean);
  });
};

export const normalizePublicLandingPath = (path = "") => {
  try {
    return decodeURIComponent(String(path).split("?")[0].split("#")[0])
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "") || "root";
  } catch {
    return String(path).split("?")[0].split("#")[0].toLowerCase().replace(/^\/+|\/+$/g, "") || "root";
  }
};

export const PUBLIC_LANDING_CONFIG_FIELDS = [
  "active_source_key",
  "course_k",
  "ctaScheduleLabel",
  "eventStart",
  "fbCurrency",
  "fbEventValue",
  "fbPixel",
  "funnel_type",
  "is_maintenance",
  "name",
  "slug",
  "sourceKey",
  "source_key",
  "targetFunnel",
  "thankYouCountdownSeconds",
  "thankYouZaloLink",
  "zaloLink",
];

export const findPublicLandingConfig = async ({
  path,
  sourceKey,
  landingPageId,
  fields = PUBLIC_LANDING_CONFIG_FIELDS,
} = {}) => {
  if (landingPageId) {
    const byDocumentId = await getPublicFirestoreDocument("landing_pages", landingPageId, fields);
    if (byDocumentId) return byDocumentId;
  }

  const normalizedSourceKey = String(sourceKey || "").trim().toLowerCase();
  if (normalizedSourceKey) {
    const bySourceKey = await queryPublicFirestoreDocuments({
      collectionId: "landing_pages",
      fieldPath: "active_source_key",
      value: normalizedSourceKey,
      fields,
    });
    if (bySourceKey[0]) return bySourceKey[0];
  }

  const normalizedPath = normalizePublicLandingPath(
    path || (typeof window !== "undefined" ? window.location.pathname : ""),
  );
  if (normalizedPath !== "root") {
    const slugCandidates = [`/${normalizedPath}`, normalizedPath];
    for (const slug of slugCandidates) {
      const bySlug = await queryPublicFirestoreDocuments({
        collectionId: "landing_pages",
        fieldPath: "slug",
        value: slug,
        fields,
      });
      if (bySlug[0]) return bySlug[0];
    }
  }

  return null;
};
