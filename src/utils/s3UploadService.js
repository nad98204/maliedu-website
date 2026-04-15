const MULTIPART_API_BASE = "/api/s3-multipart";

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

    return (
      value == null ||
      (typeof value === "string" && !value.trim())
    );
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
    return (
      parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
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
        const etag = xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag");

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

    if (!Number.isInteger(uploadSession.partSize) || uploadSession.partSize <= 0) {
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
      const percent = Math.min(
        99,
        Math.round((uploadedBytes / file.size) * 100),
      );

      onProgress(percent);
    };

    const CONCURRENCY = 4;
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

            let { url } = signPartResponse;
            if (!isValidHttpUrl(url)) {
                throw new Error("Upload API returned an invalid signed upload URL.");
            }

            if (url.includes('s3-hn1-api.longvan.vn')) {
                const urlObj = new URL(url);
                url = '/s3-proxy' + urlObj.pathname + urlObj.search;
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
    for (let i = 0; i < Math.min(CONCURRENCY, totalParts); i++) {
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
    throw new Error(
      `Upload file that bai, vui long thu lai: ${error.message}`,
    );
  }
};

export const uploadVideoToS3 = async (file, onProgress) =>
  uploadObjectToS3(file, onProgress, {
    folder: "videos",
    fallbackContentType: "video/mp4",
  });

export const uploadFileToS3 = async (file, onProgress, options = {}) =>
  uploadObjectToS3(file, onProgress, {
    folder: "files",
    fallbackContentType: "application/octet-stream",
    ...options,
  });
