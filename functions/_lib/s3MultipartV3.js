const encoder = new TextEncoder();

const DEFAULT_REGION = "hn1";
const DEFAULT_PART_SIZE = 10 * 1024 * 1024;
const MIN_PART_SIZE = 5 * 1024 * 1024;
const MAX_PARTS = 10000;
const MAX_PRESIGN_EXPIRY_SECONDS = 900;

const trimString = (value) =>
  typeof value === "string" ? value.trim() : "";

const encodeRfc3986 = (value = "") =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const encodeObjectKey = (key = "") =>
  key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeRfc3986(segment))
    .join("/");

const normalizeHeaderValue = (value) =>
  String(value).trim().replace(/\s+/g, " ");

const getAmzDate = (date) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return `${iso.slice(0, 8)}T${iso.slice(9, 15)}Z`;
};

const getDateStamp = (date) => date.toISOString().slice(0, 10).replace(/-/g, "");

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

const toUint8Array = (value) => {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return encoder.encode(String(value));
};

const sha256Hex = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", toUint8Array(value));
  return toHex(digest);
};

const hmac = async (key, value) => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toUint8Array(key),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value)),
  );
};

const getSigningKey = async (secretAccessKey, dateStamp, region) => {
  const kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
};

const getCanonicalQueryString = (entries = []) =>
  entries
    .map(([name, value]) => [
      encodeRfc3986(name),
      encodeRfc3986(value == null ? "" : String(value)),
    ])
    .sort(([leftName, leftValue], [rightName, rightValue]) => {
      if (leftName === rightName) {
        return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      }
      return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
    })
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

const getCanonicalHeaders = (headers) =>
  Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), normalizeHeaderValue(value)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");

const getSignedHeaders = (headers) =>
  Object.keys(headers)
    .map((name) => name.toLowerCase())
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .join(";");

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const createObjectUrl = (endpoint, bucket, key) => {
  const baseUrl = new URL(stripTrailingSlash(endpoint));
  const basePath = baseUrl.pathname.replace(/\/$/, "");
  const encodedBucket = encodeRfc3986(bucket);
  const encodedKey = encodeObjectKey(key);

  baseUrl.pathname = `${basePath}/${encodedBucket}/${encodedKey}`.replace(
    /\/{2,}/g,
    "/",
  );

  return baseUrl;
};

const createPublicObjectUrl = (endpoint, bucket, key) =>
  `${stripTrailingSlash(endpoint)}/${bucket}/${key}`;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const readXmlValue = (xmlText, tagName) => {
  const matched = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`).exec(
    xmlText,
  );

  return matched?.[1]?.trim() || "";
};

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getPartSize = (fileSize) => {
  const numericSize = Number(fileSize);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return DEFAULT_PART_SIZE;
  }

  const minimumByPartCount = Math.ceil(numericSize / MAX_PARTS);
  const resolvedSize = Math.max(DEFAULT_PART_SIZE, minimumByPartCount);

  return Math.ceil(resolvedSize / MIN_PART_SIZE) * MIN_PART_SIZE;
};

const sanitizeFolder = (folder) => {
  const normalized = trimString(folder || "files")
    .replace(/\\/g, "/")
    .replace(/(^\/+|\/+$)/g, "")
    .replace(/\.{2,}/g, "-")
    .replace(/[^a-zA-Z0-9/_-]/g, "-");

  return normalized || "files";
};

const sanitizeFileName = (fileName) => {
  const normalized = trimString(fileName || "upload.bin").replace(
    /[^a-zA-Z0-9.]/g,
    "-",
  );

  return normalized || "upload.bin";
};

const getS3Env = (env) => {
  const config = {
    region: trimString(env.VITE_S3_REGION) || DEFAULT_REGION,
    endpoint: trimString(env.VITE_S3_ENDPOINT),
    accessKeyId: trimString(env.VITE_S3_ACCESS_KEY),
    secretAccessKey: trimString(env.VITE_S3_SECRET_KEY),
    bucket: trimString(env.VITE_S3_BUCKET),
  };

  const missingKeys = [
    ["VITE_S3_ENDPOINT", config.endpoint],
    ["VITE_S3_ACCESS_KEY", config.accessKeyId],
    ["VITE_S3_SECRET_KEY", config.secretAccessKey],
    ["VITE_S3_BUCKET", config.bucket],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingKeys.length) {
    throw createHttpError(
      500,
      `Missing S3 server configuration: ${missingKeys.join(", ")}`,
    );
  }

  return config;
};

const createPresignedUrl = async ({
  method,
  endpoint,
  bucket,
  key,
  region,
  accessKeyId,
  secretAccessKey,
  queryEntries = [],
  expiresIn = MAX_PRESIGN_EXPIRY_SECONDS,
}) => {
  const requestDate = new Date();
  const amzDate = getAmzDate(requestDate);
  const dateStamp = getDateStamp(requestDate);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const objectUrl = createObjectUrl(endpoint, bucket, key);
  const canonicalUri = objectUrl.pathname;
  const presignedEntries = [
    ...queryEntries,
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKeyId}/${credentialScope}`],
    ["X-Amz-Date", amzDate],
    [
      "X-Amz-Expires",
      String(Math.min(expiresIn, MAX_PRESIGN_EXPIRY_SECONDS)),
    ],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQueryString = getCanonicalQueryString(presignedEntries);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    `host:${objectUrl.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region);
  const signature = toHex(await hmac(signingKey, stringToSign));

  objectUrl.search = getCanonicalQueryString([
    ...presignedEntries,
    ["X-Amz-Signature", signature],
  ]);

  return objectUrl.toString();
};

const sendSignedS3Request = async ({
  method,
  endpoint,
  bucket,
  key,
  region,
  accessKeyId,
  secretAccessKey,
  queryEntries = [],
  extraHeaders = {},
  body = "",
}) => {
  const requestDate = new Date();
  const amzDate = getAmzDate(requestDate);
  const dateStamp = getDateStamp(requestDate);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const objectUrl = createObjectUrl(endpoint, bucket, key);
  const canonicalUri = objectUrl.pathname;
  const canonicalQueryString = getCanonicalQueryString(queryEntries);
  const payloadHash = await sha256Hex(body);
  const headersForSigning = {
    host: objectUrl.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...Object.fromEntries(
      Object.entries(extraHeaders).map(([name, value]) => [
        name.toLowerCase(),
        value,
      ]),
    ),
  };
  const signedHeaders = getSignedHeaders(headersForSigning);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    getCanonicalHeaders(headersForSigning),
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region);
  const signature = toHex(await hmac(signingKey, stringToSign));
  const requestHeaders = new Headers(extraHeaders);

  requestHeaders.set("x-amz-content-sha256", payloadHash);
  requestHeaders.set("x-amz-date", amzDate);
  requestHeaders.set(
    "Authorization",
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  );

  if (canonicalQueryString) {
    objectUrl.search = canonicalQueryString;
  }

  const response = await fetch(objectUrl.toString(), {
    method,
    headers: requestHeaders,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const message =
      readXmlValue(errorText, "Message") ||
      `${response.status} ${response.statusText}`.trim();

    throw createHttpError(
      response.status,
      `S3 request failed: ${message}`,
    );
  }

  return response;
};

export const createJsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const createErrorResponse = (error) => {
  const status = error?.status || 500;
  const message = error?.message || "Unexpected upload error";

  return createJsonResponse({ error: message }, status);
};

export const validateHealthcheck = (env) => {
  getS3Env(env);
  return { ok: true };
};

export const createMultipartUpload = async (env, payload = {}) => {
  const { region, endpoint, accessKeyId, secretAccessKey, bucket } = getS3Env(
    env,
  );
  const folder = sanitizeFolder(payload.folder);
  const fileName = sanitizeFileName(payload.fileName);
  const contentType =
    trimString(payload.contentType) || "application/octet-stream";
  const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const key = `${folder}/${uniqueId}-${fileName}`;
  const partSize = getPartSize(payload.fileSize);
  const response = await sendSignedS3Request({
    method: "POST",
    endpoint,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    queryEntries: [["uploads", ""]],
    extraHeaders: {
      "content-type": contentType,
      "x-amz-acl": "public-read",
    },
  });
  const responseText = await response.text();
  const uploadId = readXmlValue(responseText, "UploadId");

  if (!uploadId) {
    throw createHttpError(
      500,
      "S3 multipart init response did not include an UploadId",
    );
  }

  return {
    uploadId,
    key,
    partSize,
    publicUrl: createPublicObjectUrl(endpoint, bucket, key),
  };
};

export const signMultipartUploadPart = async (env, payload = {}) => {
  const { region, endpoint, accessKeyId, secretAccessKey, bucket } = getS3Env(
    env,
  );
  const key = trimString(payload.key);
  const uploadId = trimString(payload.uploadId);
  const partNumber = Number(payload.partNumber);

  if (!key || !uploadId || !Number.isInteger(partNumber) || partNumber < 1) {
    throw createHttpError(400, "Missing multipart sign-part parameters");
  }

  const url = await createPresignedUrl({
    method: "PUT",
    endpoint,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    queryEntries: [
      ["partNumber", String(partNumber)],
      ["uploadId", uploadId],
    ],
  });

  return { url };
};

export const completeMultipartUpload = async (env, payload = {}) => {
  const { region, endpoint, accessKeyId, secretAccessKey, bucket } = getS3Env(
    env,
  );
  const key = trimString(payload.key);
  const uploadId = trimString(payload.uploadId);
  const parts = Array.isArray(payload.parts) ? payload.parts : [];

  if (!key || !uploadId || parts.length === 0) {
    throw createHttpError(400, "Missing multipart complete parameters");
  }

  const normalizedParts = parts
    .map((part) => ({
      PartNumber: Number(part.PartNumber),
      ETag: trimString(part.ETag),
    }))
    .filter(
      (part) =>
        Number.isInteger(part.PartNumber) &&
        part.PartNumber > 0 &&
        part.ETag,
    )
    .sort((left, right) => left.PartNumber - right.PartNumber);

  if (normalizedParts.length !== parts.length) {
    throw createHttpError(400, "Invalid multipart complete parts payload");
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<CompleteMultipartUpload>",
    ...normalizedParts.map(
      (part) =>
        `<Part><PartNumber>${part.PartNumber}</PartNumber><ETag>${escapeXml(
          part.ETag,
        )}</ETag></Part>`,
    ),
    "</CompleteMultipartUpload>",
  ].join("");

  await sendSignedS3Request({
    method: "POST",
    endpoint,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    queryEntries: [["uploadId", uploadId]],
    extraHeaders: {
      "content-type": "application/xml",
    },
    body,
  });

  return {
    ok: true,
    publicUrl: createPublicObjectUrl(endpoint, bucket, key),
  };
};

export const abortMultipartUpload = async (env, payload = {}) => {
  const { region, endpoint, accessKeyId, secretAccessKey, bucket } = getS3Env(
    env,
  );
  const key = trimString(payload.key);
  const uploadId = trimString(payload.uploadId);

  if (!key || !uploadId) {
    throw createHttpError(400, "Missing multipart abort parameters");
  }

  await sendSignedS3Request({
    method: "DELETE",
    endpoint,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    queryEntries: [["uploadId", uploadId]],
  });

  return { ok: true };
};
