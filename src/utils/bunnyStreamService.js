import * as tus from "tus-js-client";

import { auth } from "../firebase";

const BUNNY_API_BASE = "/api/bunny-stream";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const PLAYBACK_RETRY_DELAYS_MS = [0, 900, 2_200];
const PLAYBACK_CACHE_MIN_TTL_MS = 60_000;
const playbackCache = new Map();

const wait = (milliseconds) => new Promise((resolve) => {
  globalThis.setTimeout(resolve, milliseconds);
});

const createRequestError = (message, status = 0, cause) => {
  const error = new Error(message);
  error.status = status;
  if (cause) error.cause = cause;
  return error;
};

const isTransientPlaybackError = (error) => {
  const status = Number(error?.status) || 0;
  return status === 0 || status === 408 || status === 429 || status >= 500;
};

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
  {
    user = auth.currentUser,
    requireAuth = false,
    retryAfterRefresh = true,
    timeoutMs = REQUEST_TIMEOUT_MS,
    signal,
  } = {},
) => {
  if (requireAuth && !user) {
    throw new Error("Vui lòng đăng nhập tài khoản quản trị trước khi tải video.");
  }

  const token = user
    ? await user.getIdToken(!retryAfterRefresh)
    : null;

  const controller = typeof AbortController === "function"
    ? new AbortController()
    : null;
  const abortFromCaller = () => controller?.abort();
  if (signal?.aborted) abortFromCaller();
  signal?.addEventListener?.("abort", abortFromCaller, { once: true });
  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(`${BUNNY_API_BASE}${path}`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      if (signal?.aborted) {
        throw createRequestError("Yêu cầu phát video đã được hủy.", 499, error);
      }
      throw createRequestError(
        "Máy chủ video phản hồi quá lâu. Vui lòng thử lại.",
        408,
        error,
      );
    }
    throw createRequestError(
      typeof navigator !== "undefined" && navigator.onLine === false
        ? "Thiết bị đang mất kết nối mạng."
        : "Không kết nối được máy chủ video. Vui lòng thử lại.",
      0,
      error,
    );
  } finally {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener?.("abort", abortFromCaller);
  }

  if (response.status === 401 && user && retryAfterRefresh) {
    return requestJson(path, payload, {
      user,
      requireAuth,
      retryAfterRefresh: false,
      timeoutMs,
      signal,
    });
  }

  const bodyText = await response.text();
  const data = parseJsonBody(bodyText);
  if (!response.ok) {
    throw createRequestError(
      typeof data?.error === "string" && data.error.trim()
        ? data.error.trim()
        : `Bunny Stream request failed (${response.status})`,
      response.status,
    );
  }

  return data;
};

const validateMediaFile = (file) => {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Vui lòng chọn một tệp hợp lệ.");
  }
  const type = String(file.type || "").toLowerCase();
  const isVideo = type.startsWith("video/");
  const isAudio = type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac|flac|wma)$/i.test(file.name || "");
  if (!isVideo && !isAudio) {
    throw new Error("Bunny Stream chỉ nhận tệp video hoặc âm thanh (MP3, WAV, M4A, OGG,...).");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Tệp vượt quá dung lượng tối đa cho phép.");
  }
};

export const uploadVideoToBunny = async (file, onProgress, { moduleKey = 'courses' } = {}) => {
  validateMediaFile(file);
  const credentials = await requestJson(
    "/create-upload",
    {
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      moduleKey,
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

export const getBunnyPlayback = async ({ courseId, lessonId, videoId, user, signal }) => {
  if (!courseId || !lessonId || !videoId) {
    throw new Error("Thiếu thông tin bài học Bunny Stream.");
  }

  const cacheKey = [user?.uid || "anonymous", courseId, lessonId, videoId].join(":");
  const cached = playbackCache.get(cacheKey);
  const cachedExpiresAt = Number(cached?.expires || 0) * 1000;
  if (
    cached?.playbackUrl
    && cachedExpiresAt > Date.now() + PLAYBACK_CACHE_MIN_TTL_MS
  ) {
    return cached;
  }
  playbackCache.delete(cacheKey);

  let lastError = null;

  for (const delayMs of PLAYBACK_RETRY_DELAYS_MS) {
    if (signal?.aborted) {
      throw createRequestError("Yêu cầu phát video đã được hủy.", 499);
    }
    if (delayMs > 0) await wait(delayMs);
    try {
      const result = await requestJson(
        "/playback",
        { courseId, lessonId, videoId },
        { user, requireAuth: false, signal },
      );
      if (result?.playbackUrl && Number(result?.expires) > 0) {
        playbackCache.set(cacheKey, result);
      }
      return result;
    } catch (error) {
      lastError = error;
      if (!isTransientPlaybackError(error)) throw error;
    }
  }

  const status = Number(lastError?.status) || 0;
  if (status === 429) {
    throw createRequestError(
      "Có quá nhiều yêu cầu phát video. Vui lòng chờ một chút rồi thử lại.",
      status,
      lastError,
    );
  }
  if (status >= 500 || status === 408 || status === 0) {
    throw createRequestError(
      "Máy chủ video đang chậm hoặc mất kết nối. Vui lòng bấm tải lại video.",
      status,
      lastError,
    );
  }
  throw lastError;
};
