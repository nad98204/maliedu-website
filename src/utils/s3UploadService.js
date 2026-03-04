import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Khởi tạo S3 Client cho Long Vân Object Storage
const s3Client = new S3Client({
  region: import.meta.env.VITE_S3_REGION || 'hn1',
  endpoint: import.meta.env.VITE_S3_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_S3_SECRET_KEY,
  },
  forcePathStyle: true, // Bắt buộc cho các S3 tương thích (không phải là AWS chuẩn)
});

/**
 * Hàm upload file lớn (video) lên S3
 * @param {File} file - File video cần upload
 * @param {Function} onProgress - Hàm callback để lấy % tiến trình upload
 * @returns {Promise<string>} URL của video sau khi upload thành công
 */
export const uploadVideoToS3 = async (file, onProgress) => {
  try {
    const bucket = import.meta.env.VITE_S3_BUCKET;
    // Tạo tên file ngẫu nhiên để không bị trùng lặp
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const objectKey = `videos/${uniqueId}-${safeFileName}`;

    // Sử dụng class Upload từ @aws-sdk/lib-storage để hỗ trợ file lớn (Multipart)
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: objectKey,
        Body: file,
        ContentType: file.type || 'video/mp4',
        ACL: 'public-read', // Đặt video là công khai để xem được trên web
      },
      // Kích thước của mỗi phần upload (ví dụ: 5MB)
      partSize: 5 * 1024 * 1024,
      leavePartsOnError: false, // Tự động xóa các phần thừa nếu upload thất bại
    });

    upload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.total) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percent);
      }
    });

    // Chờ quá trình upload hoàn tất
    await upload.done();

    // Trả về link công khai của video
    const videoUrl = `${import.meta.env.VITE_S3_ENDPOINT}/${bucket}/${objectKey}`;
    return videoUrl;

  } catch (error) {
    console.error('Lỗi khi upload video lên Long Vân S3:', error);
    throw new Error('Upload video thất bại, vui lòng kiểm tra lại cấu hình S3: ' + error.message);
  }
};
