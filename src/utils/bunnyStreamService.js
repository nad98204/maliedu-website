import * as tus from "tus-js-client";

import { auth } from "../firebase";

const BUNNY_API_BASE = "/api/bunny-stream";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024 * 1024;

const parseJsonBody = (value) => {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const requestJson = async (
  path,
  payload,
  { user = auth.currentUser, requireAuth = false, retryAfterRefresh = true } = {},
) => {
  if (requireAuth && !user) {
    throw new Error("Vui lòng đăng nhập tài khoản quản trị trước khi tải video.");
  }

  const token = user
    ? await user.getIdToken(!retryAfterRefresh)
    : null;
  const response = await fetch(`${BUNNY_API_BASE}${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && user && retryAfterRefresh) {
    return requestJson(path, payload, {
      user,
      requireAuth,
      retryAfterRefresh: false,
    });
  }

  const bodyText = await response.text();
  const data = parseJsonBody(bodyText);
  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" && data.error.trim()
        ? data.error.trim()
        : `Bunny Stream request failed (${response.status})`,
    );
  }

  return data;
};

const validateVideoFile = (file) => {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Vui lòng chọn một tệp video hợp lệ.");
  }
  if (!String(file.type || "").startsWith("video/")) {
    throw new Error("Bunny Stream chỉ nhận tệp video.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video vượt quá dung lượng tối đa 100 GB.");
  }
};

export const uploadVideoToBunny = async (file, onProgress) => {
  validateVideoFile(file);
  const credentials = await requestJson(
    "/create-upload",
    {
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
    { requireAuth: true },
  );

  const requiredFields = [
    "endpoint",
    "expirationTime",
    "libraryId",
    "signature",
    "videoId",
  ];
  const missingFields = requiredFields.filter(
    (field) => credentials?.[field] == null || credentials[field] === "",
  );
  if (missingFields.length) {
    throw new Error(`Bunny Stream thiếu thông tin tải lên: ${missingFields.join(", ")}`);
  }

  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: credentials.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      removeFingerprintOnSuccess: true,
      headers: {
        AuthorizationSignature: String(credentials.signature),
        AuthorizationExpire: String(credentials.expirationTime),
        LibraryId: String(credentials.libraryId),
        VideoId: String(credentials.videoId),
      },
      metadata: {
        filetype: file.type,
        title: file.name,
      },
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        const percent = bytesTotal > 0
          ? Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100))
          : 0;
        onProgress?.(percent);
      },
      onSuccess: resolve,
    });

    upload.findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch(reject);
  });

  return {
    videoId: String(credentials.videoId),
    videoProvider: "bunny",
    status: "processing",
  };
};

export const getBunnyPlayback = async ({ courseId, lessonId, videoId, user }) => {
  if (!courseId || !lessonId || !videoId) {
    throw new Error("Thiếu thông tin bài học Bunny Stream.");
  }

  return requestJson(
    "/playback",
    { courseId, lessonId, videoId },
    { user, requireAuth: false },
  );
};
