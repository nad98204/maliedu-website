const getBrowserRuntimeConfig = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__MALI_RUNTIME_CONFIG__ || {};
};

const pickTrimmedValue = (...values) => {
  const matchedValue = values.find(
    (value) => typeof value === 'string' && value.trim(),
  );

  return matchedValue?.trim();
};

export const getRuntimeS3Config = () => {
  const runtimeConfig = getBrowserRuntimeConfig();
  const runtimeS3Config = runtimeConfig.s3 || {};

  return {
    region: pickTrimmedValue(
      runtimeS3Config.region,
      runtimeConfig.VITE_S3_REGION,
    ),
    endpoint: pickTrimmedValue(
      runtimeS3Config.endpoint,
      runtimeConfig.VITE_S3_ENDPOINT,
    ),
    bucket: pickTrimmedValue(
      runtimeS3Config.bucket,
      runtimeConfig.VITE_S3_BUCKET,
    ),
  };
};
