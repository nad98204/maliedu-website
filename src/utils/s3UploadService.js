import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const getS3Config = () => {
  const config = {
    region: import.meta.env.VITE_S3_REGION || 'hn1',
    endpoint: import.meta.env.VITE_S3_ENDPOINT?.trim(),
    accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY?.trim(),
    secretAccessKey: import.meta.env.VITE_S3_SECRET_KEY?.trim(),
    bucket: import.meta.env.VITE_S3_BUCKET?.trim(),
  };

  const missingVars = [
    ['VITE_S3_ENDPOINT', config.endpoint],
    ['VITE_S3_ACCESS_KEY', config.accessKeyId],
    ['VITE_S3_SECRET_KEY', config.secretAccessKey],
    ['VITE_S3_BUCKET', config.bucket],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVars.length) {
    throw new Error(
      `Thieu cau hinh S3: ${missingVars.join(', ')}. Neu dang dung Vite, ban can khai bao cac bien nay trong moi truong build production roi build/deploy lai.`,
    );
  }

  return config;
};

let s3Client;

const getS3Client = () => {
  if (!s3Client) {
    const config = getS3Config();

    s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return s3Client;
};

const uploadObjectToS3 = async (
  file,
  onProgress,
  { folder = 'files', fallbackContentType = 'application/octet-stream' } = {},
) => {
  try {
    const { bucket, endpoint } = getS3Config();
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const objectKey = `${folder}/${uniqueId}-${safeFileName}`;

    const upload = new Upload({
      client: getS3Client(),
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

    return `${endpoint}/${bucket}/${objectKey}`;
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
