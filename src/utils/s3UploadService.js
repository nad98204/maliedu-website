const MULTIPART_API_BASE = "/api/s3-multipart";
const DIRECT_S3_REGION =
  import.meta.env.VITE_S3_REGION || "hn1";
const DIRECT_S3_ENDPOINT =
  import.meta.env.VITE_S3_ENDPOINT || "";
const DIRECT_S3_ACCESS_KEY =
  import.meta.env.VITE_S3_ACCESS_KEY || "";
const DIRECT_S3_SECRET_KEY =
  import.meta.env.VITE_S3_SECRET_KEY || "";
const DIRECT_S3_BUCKET =
  import.meta.env.VITE_S3_BUCKET || "";
const DEFAULT_PART_SIZE = 10 * 1024 * 1024;
const MIN_PART_SIZE = 5 * 1024 * 1024;
const MAX_PARTS = 10000;
const MAX_PRESIGN_EXPIRY_SECONDS = 900;

const isPlainObject = (value) =>
  value != null && typeof value === "object" && !Array.isArray(value);

const looksLikeHtmlDocument = (contentType = "", bodyText = "") => {
  const normalizedContentType = contentType.toLowerCase();
  const normalizedBody = bodyText.trim().toLowerCase();

  return (
    normalizedContentType.includes("text/html") ||
    normalizedBody.startsWith("<!doctype html") ||
    normalizedBody.startsWith("<html")
  );
};

const parseJsonBody = (bodyText) => {
  if (!bodyText.trim()) {
    return null;
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return null;
  }
};

const getErrorMessage = (payload, fallbackMessage) => {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallbackMessage;
};

const ensureRequiredFields = (payload, requiredFields, path) => {
  const missingFields = requiredFields.filter((field) => {
    const value = payload?.[field];
    return value == null || (typeof value === "string" && !value.trim());
  });

  if (missingFields.length > 0) {
    throw new Error(
      `Upload API response for ${path} is missing: ${missingFields.join(", ")}`,
    );
  }
};

const isValidHttpUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

const isProductionHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return /(^|\.)luathapdan\.vn$/i.test(window.location.hostname);
};

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

const getDateStamp = (date) =>
  date.toISOString().slice(0, 10).replace(/-/g, "");

const toHex = (buffer) =>
  Array.from(
    new Uint8Array(buffer),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");

const toUint8Array = (value) => {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return new TextEncoder().encode(String(value));
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
    await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)),
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

      return leftName < rightName ? -1 : 1;
    })
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

const getCanonicalHeaders = (headers) =>
  Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), normalizeHeaderValue(value)])
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");

const getSignedHeaders = (headers) =>
  Object.keys(headers)
    .map((name) => name.toLowerCase())
    .sort((a, b) => (a < b ? -1 : 1))
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

const hasDirectS3Config = () =>
  [
    DIRECT_S3_ENDPOINT,
    DIRECT_S3_ACCESS_KEY,
    DIRECT_S3_SECRET_KEY,
    DIRECT_S3_BUCKET,
  ].every((value) => trimString(value));

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

  const responseText = await response.text();

  if (!response.ok) {
    const message =
      readXmlValue(responseText, "Message") ||
      `${response.status} ${response.statusText}`.trim();

    throw new Error(`Direct S3 request failed: ${message}`);
  }

  return responseText;
};

const directMultipartUploadToS3 = async (file, onProgress, folder, fallbackContentType) => {
  if (!hasDirectS3Config()) {
    throw new Error("Missing direct S3 browser configuration.");
  }

  const contentType = file.type || fallbackContentType;
  const key = `${sanitizeFolder(folder)}/${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}-${sanitizeFileName(file.name)}`;
  const partSize = getPartSize(file.size);

  if (onProgress) {
    onProgress(0);
  }

  const initResponseText = await sendSignedS3Request({
    method: "POST",
    endpoint: DIRECT_S3_ENDPOINT,
    bucket: DIRECT_S3_BUCKET,
    key,
    region: DIRECT_S3_REGION,
    accessKeyId: DIRECT_S3_ACCESS_KEY,
    secretAccessKey: DIRECT_S3_SECRET_KEY,
    queryEntries: [["uploads", ""]],
    extraHeaders: {
      "content-type": contentType,
      "x-amz-acl": "public-read",
    },
  });

  const uploadId = readXmlValue(initResponseText, "UploadId");
  if (!uploadId) {
    throw new Error("Direct S3 init did not return an UploadId.");
  }

  const totalParts = Math.ceil(file.size / partSize);
  const partProgress = new Map();
  const completedParts = [];

  const reportProgress = () => {
    if (!onProgress) {
      return;
    }

    const uploadedBytes = Array.from(partProgress.values()).reduce(
      (total, value) => total + value,
      0,
    );
    const percent = Math.min(99, Math.round((uploadedBytes / file.size) * 100));
    onProgress(percent);
  };

  const partsToUpload = [];
  for (let i = 1; i <= totalParts; i++) {
    partsToUpload.push(i);
  }

  const uploadWorker = async () => {
    while (partsToUpload.length > 0) {
      const partNumber = partsToUpload.shift();
      const start = (partNumber - 1) * partSize;
      const end = Math.min(file.size, start + partSize);
      const blob = file.slice(start, end);
      const url = await createPresignedUrl({
        method: "PUT",
        endpoint: DIRECT_S3_ENDPOINT,
        bucket: DIRECT_S3_BUCKET,
        key,
        region: DIRECT_S3_REGION,
        accessKeyId: DIRECT_S3_ACCESS_KEY,
        secretAccessKey: DIRECT_S3_SECRET_KEY,
        queryEntries: [
          ["partNumber", String(partNumber)],
          ["uploadId", uploadId],
        ],
      });

      const etag = await uploadPart(url, blob, (loadedBytes) => {
        partProgress.set(partNumber, loadedBytes);
        reportProgress();
      });

      partProgress.set(partNumber, blob.size);
      completedParts.push({
        PartNumber: partNumber,
        ETag: etag,
      });
      reportProgress();
    }
  };

  const workers = [];
  for (let i = 0; i < Math.min(4, totalParts); i++) {
    workers.push(uploadWorker());
  }

  try {
    await Promise.all(workers);

    const completeBody = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<CompleteMultipartUpload>",
      ...completedParts
        .sort((left, right) => left.PartNumber - right.PartNumber)
        .map(
          (part) =>
            `<Part><PartNumber>${part.PartNumber}</PartNumber><ETag>${escapeXml(
              part.ETag,
            )}</ETag></Part>`,
        ),
      "</CompleteMultipartUpload>",
    ].join("");

    await sendSignedS3Request({
      method: "POST",
      endpoint: DIRECT_S3_ENDPOINT,
      bucket: DIRECT_S3_BUCKET,
      key,
      region: DIRECT_S3_REGION,
      accessKeyId: DIRECT_S3_ACCESS_KEY,
      secretAccessKey: DIRECT_S3_SECRET_KEY,
      queryEntries: [["uploadId", uploadId]],
      extraHeaders: {
        "content-type": "application/xml",
      },
      body: completeBody,
    });

    if (onProgress) {
      onProgress(100);
    }

    return createPublicObjectUrl(DIRECT_S3_ENDPOINT, DIRECT_S3_BUCKET, key);
  } catch (error) {
    try {
      await sendSignedS3Request({
        method: "DELETE",
        endpoint: DIRECT_S3_ENDPOINT,
        bucket: DIRECT_S3_BUCKET,
        key,
        region: DIRECT_S3_REGION,
        accessKeyId: DIRECT_S3_ACCESS_KEY,
        secretAccessKey: DIRECT_S3_SECRET_KEY,
        queryEntries: [["uploadId", uploadId]],
      });
    } catch {
      // Ignore abort cleanup failures after the main upload has already failed.
    }

    throw error;
  }
};

const requestJson = async (path, payload, { requiredFields = [] } = {}) => {
  const response = await fetch(`${MULTIPART_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (looksLikeHtmlDocument(contentType, bodyText)) {
    throw new Error(
      "Upload API returned HTML instead of JSON. Check Firebase Hosting rewrite for /api/**.",
    );
  }

  const data = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, `Upload request failed: ${response.status}`),
    );
  }

  if (!isPlainObject(data)) {
    throw new Error(
      `Upload API returned an invalid JSON payload for ${path}.`,
    );
  }

  ensureRequiredFields(data, requiredFields, path);

  return data;
};

const uploadPart = (url, blob, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag =
          xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag");

        if (!etag) {
          reject(
            new Error(
              "S3 upload succeeded but ETag was not exposed. Check S3 CORS ExposeHeaders.",
            ),
          );
          return;
        }

        resolve(etag);
        return;
      }

      reject(new Error(`Upload part failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload part failed due to a network error"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload part was aborted"));
    };

    xhr.send(blob);
  });

const uploadObjectToS3 = async (
  file,
  onProgress,
  { folder = "files", fallbackContentType = "application/octet-stream" } = {},
) => {
  if (!file) {
    throw new Error("Khong tim thay file de tai len.");
  }

  if (!file.size) {
    throw new Error("Khong ho tro upload file rong.");
  }

  let uploadSession = null;

  try {
    if (onProgress) {
      onProgress(0);
    }

    uploadSession = await requestJson(
      "/init",
      {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || fallbackContentType,
        folder,
      },
      {
        requiredFields: ["uploadId", "key", "partSize"],
      },
    );

    if (
      !Number.isInteger(uploadSession.partSize) ||
      uploadSession.partSize <= 0
    ) {
      throw new Error("Upload API returned an invalid partSize.");
    }

    const fallbackPublicUrl = isValidHttpUrl(uploadSession.publicUrl)
      ? uploadSession.publicUrl
      : "";

    const totalParts = Math.ceil(file.size / uploadSession.partSize);
    if (!Number.isInteger(totalParts) || totalParts <= 0) {
      throw new Error("Khong the chia file thanh cac phan hop le de upload.");
    }

    const partProgress = new Map();
    const completedParts = [];

    const reportProgress = () => {
      if (!onProgress) {
        return;
      }

      const uploadedBytes = Array.from(partProgress.values()).reduce(
        (total, value) => total + value,
        0,
      );
      const percent = Math.min(99, Math.round((uploadedBytes / file.size) * 100));
      onProgress(percent);
    };

    const partsToUpload = [];
    for (let i = 1; i <= totalParts; i++) {
      partsToUpload.push(i);
    }

    const uploadWorker = async () => {
      while (partsToUpload.length > 0) {
        const partNumber = partsToUpload.shift();
        const start = (partNumber - 1) * uploadSession.partSize;
        const end = Math.min(file.size, start + uploadSession.partSize);
        const blob = file.slice(start, end);

        const signPartResponse = await requestJson(
          "/sign-part",
          {
            key: uploadSession.key,
            uploadId: uploadSession.uploadId,
            partNumber,
          },
          {
            requiredFields: ["url"],
          },
        );

        const { url } = signPartResponse;
        if (!isValidHttpUrl(url)) {
          throw new Error("Upload API returned an invalid signed upload URL.");
        }

        const etag = await uploadPart(url, blob, (loadedBytes) => {
          partProgress.set(partNumber, loadedBytes);
          reportProgress();
        });

        partProgress.set(partNumber, blob.size);
        completedParts.push({
          PartNumber: partNumber,
          ETag: etag,
        });
        reportProgress();
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(4, totalParts); i++) {
      workers.push(uploadWorker());
    }
    await Promise.all(workers);

    const completedUpload = await requestJson("/complete", {
      key: uploadSession.key,
      uploadId: uploadSession.uploadId,
      parts: completedParts,
    });

    if (onProgress) {
      onProgress(100);
    }

    const resolvedPublicUrl = isValidHttpUrl(completedUpload.publicUrl)
      ? completedUpload.publicUrl
      : fallbackPublicUrl;

    if (!resolvedPublicUrl) {
      throw new Error(
        "Upload completed but the API did not return a valid publicUrl.",
      );
    }

    return resolvedPublicUrl;
  } catch (error) {
    if (uploadSession?.key && uploadSession?.uploadId) {
      requestJson("/abort", {
        key: uploadSession.key,
        uploadId: uploadSession.uploadId,
      }).catch(() => {});
    }

    console.error("Loi khi upload file len Long Van S3:", error);
    throw new Error(`Upload file that bai, vui long thu lai: ${error.message}`);
  }
};

export const uploadVideoToS3 = async (file, onProgress) => {
  try {
    return await uploadObjectToS3(file, onProgress, {
      folder: "videos",
      fallbackContentType: "video/mp4",
    });
  } catch (error) {
    const canFallbackToDirectBrowserUpload =
      file?.type?.startsWith("video/") &&
      hasDirectS3Config() &&
      (
        isProductionHost() ||
        /Upload API returned HTML|Upload API returned an invalid JSON payload|Upload request failed/i.test(
          error?.message || "",
        )
      );

    if (!canFallbackToDirectBrowserUpload) {
      throw error;
    }

    console.warn(
      "Upload API is unavailable, falling back to direct browser S3 upload:",
      error,
    );

    return directMultipartUploadToS3(file, onProgress, "videos", "video/mp4");
  }
};

export const uploadFileToS3 = async (file, onProgress, options = {}) =>
  uploadObjectToS3(file, onProgress, {
    folder: "files",
    fallbackContentType: "application/octet-stream",
    ...options,
  });
