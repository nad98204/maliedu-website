import axios from 'axios';

// Thong tin Cloudinary
const CLOUD_NAME = "dstukyjzd";
const UPLOAD_PRESET = "dstukyjzd";

export const uploadToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "mali-edu"); // Gom gọn ảnh vào thư mục này

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );

    return {
      secureUrl: response.data.secure_url,
      publicId: response.data.public_id,
    }; // Tra ve duong link anh va token xoa
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Loi upload anh";
    console.error("Lỗi upload ảnh:", message);
    throw new Error(message);
  }
};

export const deleteFromCloudinary = async (deleteToken) => {
  if (!deleteToken) return;

  try {
    const formData = new FormData();
    formData.append("token", deleteToken);

    await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`,
      formData
    );
  } catch (error) {
    console.error("Loi xoa anh Cloudinary:", error?.message || error);
  }
};
