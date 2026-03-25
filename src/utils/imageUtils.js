export const normalizeCloudinaryImage = (url, transform = "f_auto,q_auto,c_limit,w_1000") => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url ?? "";
  }

  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return url;

  const prefix = url.slice(0, markerIndex + marker.length);
  const rest = url.slice(markerIndex + marker.length);
  return `${prefix}${transform}/${rest}`;
};
