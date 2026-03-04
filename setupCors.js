import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.VITE_S3_REGION || "hn1",
  endpoint: process.env.VITE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_S3_ACCESS_KEY,
    secretAccessKey: process.env.VITE_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const run = async () => {
  try {
    console.log("Đang thiết lập Tường lửa (CORS) cho Bucket:", process.env.VITE_S3_BUCKET);
    const params = {
      Bucket: process.env.VITE_S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "DELETE", "GET", "HEAD"],
            AllowedOrigins: ["*"], // Cho phép upload từ cả localhost và Tên miền thật
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };
    
    const command = new PutBucketCorsCommand(params);
    await s3Client.send(command);
    console.log("🎉 Tự động mở khóa CORS thành công! Từ giờ Web có thể Upload trực tiếp lên Long Vân!");
  } catch (err) {
    console.error("❌ Lỗi mở khóa CORS:", err.message);
  }
};

run();
