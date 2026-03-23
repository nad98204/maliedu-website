import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getRuntimeS3Config } from './runtimeConfig';

const pickTrimmedValue = (...values) => {
  const matchedValue = values.find(
    (value) => typeof value === 'string' && value.trim(),
  );

  return matchedValue?.trim();
};

const getS3Config = () => {
  const runtimeConfig = getRuntimeS3Config();
  const config = {
    region:
      pickTrimmedValue(runtimeConfig.region, import.meta.env.VITE_S3_REGION) ||
      'hn1',
    endpoint: pickTrimmedValue(
      runtimeConfig.endpoint,
      import.meta.env.VITE_S3_ENDPOINT,
    ),
    accessKeyId: pickTrimmedValue(
      runtimeConfig.accessKeyId,
      import.meta.env.VITE_S3_ACCESS_KEY,
    ),
    secretAccessKey: pickTrimmedValue(
      runtimeConfig.secretAccessKey,
      import.meta.env.VITE_S3_SECRET_KEY,
    ),
    bucket: pickTrimmedValue(
      runtimeConfig.bucket,
      import.meta.env.VITE_S3_BUCKET,
    ),
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
      `Thieu cau hinh S3: ${missingVars.join(', ')}. Ban can cau hinh qua public/runtime-config.js hoac cung cap VITE_S3_* truoc khi build/deploy.`,
    );
  }

  return config;
};

let s3Client;
let s3ClientSignature;

const getS3Client = () => {
  const config = getS3Config();
  const nextSignature = JSON.stringify({
    region: config.region,
    endpoint: config.endpoint,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  if (!s3Client || s3ClientSignature !== nextSignature) {
    s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
    s3ClientSignature = nextSignature;
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

    return `${endpoint.replace(/\/+$/, '')}/${bucket}/${objectKey}`;
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
