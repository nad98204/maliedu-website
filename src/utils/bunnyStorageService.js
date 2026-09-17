import { auth } from "../firebase";

const BUNNY_STORAGE_UPLOAD_URL = "/api/bunny-storage/upload";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const parseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getUploadErrorMessage = (data, status) => {
  const serverMessage =
    (typeof data?.message === "string" && data.message.trim()) ||
    (typeof data?.error === "string" && data.error.trim());

  return (
    serverMessage ||
    `Lỗi tải ảnh lên Bunny (${status || "không xác định"}): Vui lòng kiểm tra cấu hình Bunny Storage.`
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

const uploadWithToken = (file, token, onProgress) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", BUNNY_STORAGE_UPLOAD_URL, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onerror = () => {
      const error = new Error("Mất kết nối khi tải ảnh lên Bunny Storage.");
      error.status = 0;
      reject(error);
    };
    xhr.onabort = () => {
      const error = new Error("Đã hủy tải ảnh lên Bunny Storage.");
      error.status = 0;
      reject(error);
    };
    xhr.onload = () => {
      const data = parseJson(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300 || !data?.url) {
        const error = new Error(getUploadErrorMessage(data, xhr.status));
        error.status = xhr.status;
        reject(error);
        return;
      }

      onProgress?.(100);
      resolve(data.url);
    };
    xhr.send(formData);
  });

export const uploadImageToBunny = async (
  file,
  onProgress,
  { retryAfterRefresh = true } = {},
) => {
  validateImage(file);
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Vui lòng đăng nhập tài khoản quản trị trước khi tải ảnh.");
  }

  const token = await user.getIdToken(!retryAfterRefresh);
  try {
    return await uploadWithToken(file, token, onProgress);
  } catch (error) {
    if (error?.status === 401 && retryAfterRefresh) {
      return uploadImageToBunny(file, onProgress, { retryAfterRefresh: false });
    }
    throw error;
  }
};
