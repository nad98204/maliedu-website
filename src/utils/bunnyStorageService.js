import { auth } from "../firebase";

const BUNNY_STORAGE_UPLOAD_URL = "/api/bunny-storage/upload";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/webm",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-wav",
]);

const parseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getUploadErrorMessage = (data, status, mediaLabel) => {
  const serverMessage =
    (typeof data?.message === "string" && data.message.trim()) ||
    (typeof data?.error === "string" && data.error.trim());

  return (
    serverMessage ||
    `Lỗi tải ${mediaLabel} lên Bunny (${status || "không xác định"}): Vui lòng kiểm tra cấu hình Bunny Storage.`
  );
};

const validateImage = (file) => {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Vui lòng chọn file hình ảnh.");
  }
  if (!SUPPORTED_IMAGE_TYPES.has(String(file.type || "").toLowerCase())) {
    throw new Error("Chỉ hỗ trợ ảnh JPG, PNG, GIF, WebP hoặc AVIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Ảnh vượt quá dung lượng tối đa 20 MB.");
  }
};

const validateAudio = (file) => {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Vui lòng chọn file âm thanh.");
  }
  const hasSupportedExtension = /\.(?:aac|flac|m4a|mp3|oga|ogg|opus|wav|webm)$/i.test(
    file.name || "",
  );
  if (
    !SUPPORTED_AUDIO_TYPES.has(String(file.type || "").toLowerCase()) &&
    !hasSupportedExtension
  ) {
    throw new Error("Chỉ hỗ trợ audio MP3, M4A, AAC, WAV, OGG, OPUS, FLAC hoặc WebM.");
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error("Âm thanh vượt quá dung lượng tối đa 200 MB.");
  }
};

const uploadWithToken = (file, token, onProgress, mediaType, mediaLabel) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("mediaType", mediaType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", BUNNY_STORAGE_UPLOAD_URL, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onerror = () => {
      const error = new Error(`Mất kết nối khi tải ${mediaLabel} lên Bunny Storage.`);
      error.status = 0;
      reject(error);
    };
    xhr.onabort = () => {
      const error = new Error(`Đã hủy tải ${mediaLabel} lên Bunny Storage.`);
      error.status = 0;
      reject(error);
    };
    xhr.onload = () => {
      const data = parseJson(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300 || !data?.url) {
        const error = new Error(getUploadErrorMessage(data, xhr.status, mediaLabel));
        error.status = xhr.status;
        reject(error);
        return;
      }

      onProgress?.(100);
      resolve(data.url);
    };
    xhr.send(formData);
  });

const uploadMediaToBunny = async (
  file,
  onProgress,
  {
    mediaType = "image",
    retryAfterRefresh = true,
  } = {},
) => {
  const isAudio = mediaType === "audio";
  const mediaLabel = isAudio ? "âm thanh" : "ảnh";
  if (isAudio) validateAudio(file);
  else validateImage(file);
  const user = auth.currentUser;
  if (!user) {
    throw new Error(`Vui lòng đăng nhập tài khoản quản trị trước khi tải ${mediaLabel}.`);
  }

  const token = await user.getIdToken(!retryAfterRefresh);
  try {
    return await uploadWithToken(file, token, onProgress, mediaType, mediaLabel);
  } catch (error) {
    if (error?.status === 401 && retryAfterRefresh) {
      return uploadMediaToBunny(file, onProgress, {
        mediaType,
        retryAfterRefresh: false,
      });
    }
    throw error;
  }
};

export const uploadImageToBunny = (file, onProgress, options = {}) =>
  uploadMediaToBunny(file, onProgress, { ...options, mediaType: "image" });

export const uploadAudioToBunny = (file, onProgress, options = {}) =>
  uploadMediaToBunny(file, onProgress, { ...options, mediaType: "audio" });
