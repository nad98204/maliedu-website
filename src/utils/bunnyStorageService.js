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
    xhr.onerror = () => reject(new Error("Mất kết nối khi tải ảnh lên Bunny Storage."));
    xhr.onabort = () => reject(new Error("Đã hủy tải ảnh lên Bunny Storage."));
    xhr.onload = () => {
      const data = parseJson(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300 || !data?.url) {
        const error = new Error(
          data?.message || `Tải ảnh lên Bunny Storage thất bại (${xhr.status}).`,
        );
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
