import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3Client = new S3Client({
  region: import.meta.env.VITE_S3_REGION || 'hn1',
  endpoint: import.meta.env.VITE_S3_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const uploadObjectToS3 = async (
  file,
  onProgress,
  { folder = 'files', fallbackContentType = 'application/octet-stream' } = {},
) => {
  try {
    const bucket = import.meta.env.VITE_S3_BUCKET;
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const objectKey = `${folder}/${uniqueId}-${safeFileName}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: objectKey,
        Body: file,
        ContentType: file.type || fallbackContentType,
        ACL: 'public-read',
      },
      partSize: 5 * 1024 * 1024,
      leavePartsOnError: false,
    });

    upload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.total) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percent);
      }
    });

    await upload.done();

    return `${import.meta.env.VITE_S3_ENDPOINT}/${bucket}/${objectKey}`;
  } catch (error) {
    console.error('Loi khi upload file len Long Van S3:', error);
    throw new Error(
      `Upload file that bai, vui long kiem tra cau hinh S3: ${error.message}`,
    );
  }
};

export const uploadVideoToS3 = async (file, onProgress) =>
  uploadObjectToS3(file, onProgress, {
    folder: 'videos',
    fallbackContentType: 'video/mp4',
  });

export const uploadFileToS3 = async (file, onProgress) =>
  uploadObjectToS3(file, onProgress, {
    folder: 'files',
    fallbackContentType: 'application/octet-stream',
  });
