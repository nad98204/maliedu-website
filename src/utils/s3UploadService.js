import { auth } from "../firebase";

const MULTIPART_API_BASE = "/api/s3-multipart";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 * 1024;
const MAX_UPLOAD_PARTS = 10_000;
const UPLOAD_WORKERS = 4;
const DANGEROUS_FILE_EXTENSION =
  /\.(?:css|htm|html|js|mjs|svg|xht|xhtml|xml)$/i;
const DANGEROUS_CONTENT_TYPES = new Set([
  "application/javascript",
  "application/xhtml+xml",
  "image/svg+xml",
  "text/css",
  "text/html",
  "text/javascript",
  "text/xml",
]);

const isPlainObject = (value) =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || (
      import.meta.env.DEV &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
};

const parseJsonBody = (value) => {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getAdminIdToken = async (forceRefresh = false) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Vui lòng đăng nhập tài khoản quản trị trước khi tải tệp.");
  }

  return currentUser.getIdToken(forceRefresh);
};

const requestJson = async (
  path,
  payload,
  { requiredFields = [], retryAfterRefresh = true } = {},
) => {
  const idToken = await getAdminIdToken(!retryAfterRefresh);
  const response = await fetch(`${MULTIPART_API_BASE}${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      authorization: `Bearer ${idToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && retryAfterRefresh) {
    return requestJson(path, payload, {
      requiredFields,
      retryAfterRefresh: false,
    });
  }

  const bodyText = await response.text();
  const data = parseJsonBody(bodyText);

  if (!response.ok) {
    const message =
      typeof data?.error === "string" && data.error.trim()
        ? data.error.trim()
        : `Upload request failed (${response.status})`;
    throw new Error(message);
  }

  if (!isPlainObject(data)) {
    throw new Error("Upload API returned an invalid response.");
  }

  const missingFields = requiredFields.filter((field) => {
    const value = data[field];
    return value == null || (typeof value === "string" && !value.trim());
  });
  if (missingFields.length) {
    throw new Error(`Upload API response is missing: ${missingFields.join(", ")}`);
  }

  return data;
};

const uploadPart = (url, blob, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded);
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload part failed (${xhr.status})`));
        return;
      }

      const etag = xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag");
      if (!etag) {
        reject(new Error("S3 did not expose the uploaded part ETag."));
        return;
      }

      resolve(etag);
    };
    xhr.onerror = () => reject(new Error("Network error while uploading a file part."));
    xhr.onabort = () => reject(new Error("File upload was cancelled."));
    xhr.send(blob);
  });

const validateFile = (file) => {
  if (!file || typeof file.name !== "string") {
    throw new Error("Không tìm thấy tệp để tải lên.");
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("Không hỗ trợ tải lên tệp rỗng.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Tệp vượt quá giới hạn tải lên 20 GB.");
  }

  const contentType = String(file.type || "").toLowerCase();
  if (
    DANGEROUS_FILE_EXTENSION.test(file.name) ||
    DANGEROUS_CONTENT_TYPES.has(contentType)
  ) {
    throw new Error("Định dạng tệp này không được phép vì lý do bảo mật.");
  }
};

const uploadObjectToS3 = async (
  file,
  onProgress,
  { folder = "files", fallbackContentType = "application/octet-stream" } = {},
) => {
  validateFile(file);
  let uploadSession = null;

  try {
    onProgress?.(0);
    uploadSession = await requestJson(
      "/init",
      {
        contentType: file.type || fallbackContentType,
        fileName: file.name,
        fileSize: file.size,
        folder,
      },
      { requiredFields: ["uploadId", "key", "partSize"] },
    );

    if (
      !Number.isInteger(uploadSession.partSize) ||
      uploadSession.partSize <= 0
    ) {
      throw new Error("Upload API returned an invalid part size.");
    }

    const totalParts = Math.ceil(file.size / uploadSession.partSize);
    if (
      !Number.isInteger(totalParts) ||
      totalParts <= 0 ||
      totalParts > MAX_UPLOAD_PARTS
    ) {
      throw new Error("Tệp không thể chia thành số phần tải lên hợp lệ.");
    }

    const remainingParts = Array.from(
      { length: totalParts },
      (_, index) => index + 1,
    );
    const partProgress = new Map();
    const completedParts = [];

    const reportProgress = () => {
      const uploadedBytes = [...partProgress.values()].reduce(
        (total, value) => total + value,
        0,
      );
      onProgress?.(Math.min(99, Math.round((uploadedBytes / file.size) * 100)));
    };

    const worker = async () => {
      while (remainingParts.length) {
        const partNumber = remainingParts.shift();
        const start = (partNumber - 1) * uploadSession.partSize;
        const end = Math.min(file.size, start + uploadSession.partSize);
        const blob = file.slice(start, end);
        const signedPart = await requestJson(
          "/sign-part",
          {
            key: uploadSession.key,
            partNumber,
            uploadId: uploadSession.uploadId,
          },
          { requiredFields: ["url"] },
        );

        if (!isValidHttpUrl(signedPart.url)) {
          throw new Error("Upload API returned an invalid signed URL.");
        }

        const etag = await uploadPart(signedPart.url, blob, (loadedBytes) => {
          partProgress.set(partNumber, loadedBytes);
          reportProgress();
        });
        partProgress.set(partNumber, blob.size);
        completedParts.push({ ETag: etag, PartNumber: partNumber });
        reportProgress();
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(UPLOAD_WORKERS, totalParts) },
        () => worker(),
      ),
    );

    const completedUpload = await requestJson("/complete", {
      key: uploadSession.key,
      parts: completedParts,
      uploadId: uploadSession.uploadId,
    });
    if (!isValidHttpUrl(completedUpload.publicUrl)) {
      throw new Error("Upload completed without a valid public URL.");
    }

    onProgress?.(100);
    return completedUpload.publicUrl;
  } catch (error) {
    if (uploadSession?.key && uploadSession?.uploadId) {
      requestJson("/abort", {
        key: uploadSession.key,
        uploadId: uploadSession.uploadId,
      }).catch(() => {});
    }

    console.error("S3 upload failed:", error);
    throw new Error(`Tải tệp thất bại: ${error.message}`);
  }
};

export const uploadVideoToS3 = (file, onProgress) =>
  uploadObjectToS3(file, onProgress, {
    fallbackContentType: "video/mp4",
    folder: "videos",
  });

export const uploadFileToS3 = (file, onProgress, options = {}) =>
  uploadObjectToS3(file, onProgress, {
    fallbackContentType: "application/octet-stream",
    folder: "files",
    ...options,
  });
