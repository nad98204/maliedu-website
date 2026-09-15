const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const SUPER_ADMIN_EMAIL = "mongcoaching@gmail.com";
const IMAGE_TYPES = Object.freeze({
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
});

const json = (body, status = 200, extraHeaders = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });

const getBearerToken = (request) => {
  const authorization = request.headers.get("Authorization") || "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
};

const decodeTokenPayload = (token) => {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const normalized = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const getFirestoreString = (document, field) =>
  document?.fields?.[field]?.stringValue || "";

const getFirestoreStringArray = (document, field) =>
  (document?.fields?.[field]?.arrayValue?.values || [])
    .map((value) => value?.stringValue)
    .filter(Boolean);

const requireImageUploadAdmin = async (context) => {
  const token = getBearerToken(context.request);
  const projectId = String(context.env?.FIREBASE_PROJECT_ID || "").trim();
  const payload = decodeTokenPayload(token);
  const uid = String(payload?.sub || payload?.user_id || "").trim();
  const now = Math.floor(Date.now() / 1000);

  if (
    !token ||
    !projectId ||
    !uid ||
    !/^[A-Za-z0-9:_-]{1,128}$/.test(uid) ||
    payload?.aud !== projectId ||
    payload?.iss !== `https://securetoken.google.com/${projectId}` ||
    !Number.isFinite(Number(payload?.exp)) ||
    Number(payload.exp) <= now
  ) {
    throw Object.assign(new Error("Phiên đăng nhập không hợp lệ."), { status: 401 });
  }

  const profileResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (profileResponse.status === 401 || profileResponse.status === 403) {
    throw Object.assign(new Error("Phiên đăng nhập không hợp lệ."), { status: 401 });
  }
  if (!profileResponse.ok && profileResponse.status !== 404) {
    throw Object.assign(new Error("Không thể xác minh quyền quản trị lúc này."), {
      status: 502,
    });
  }

  const profile = profileResponse.ok ? await profileResponse.json() : null;
  const email = String(payload.email || "").trim().toLowerCase();
  const isSuperAdmin =
    email === SUPER_ADMIN_EMAIL && payload.email_verified === true;
  const isAdmin = getFirestoreString(profile, "role").toLowerCase() === "admin";
  const allowedModules = getFirestoreStringArray(profile, "allowedModules");
  const canUploadImages =
    isSuperAdmin ||
    (isAdmin && (
      allowedModules.length === 0 ||
      allowedModules.includes("courses") ||
      allowedModules.includes("instructors")
    ));

  if (!canUploadImages) {
    throw Object.assign(new Error("Bạn không có quyền tải ảnh khóa học hoặc giảng viên."), {
      status: 403,
    });
  }
};

const isValidImageSignature = (bytes, mimeType) => {
  const startsWith = (...signature) =>
    signature.every((value, index) => bytes[index] === value);

  if (mimeType === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (mimeType === "image/png") {
    return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  }
  if (mimeType === "image/gif") {
    const header = String.fromCharCode(...bytes.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a";
  }
  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  if (mimeType === "image/avif") {
    const boxType = String.fromCharCode(...bytes.slice(4, 8));
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    return boxType === "ftyp" && (brand === "avif" || brand === "avis");
  }
  return false;
};

const readImage = async (request) => {
  const requestType = String(request.headers.get("Content-Type") || "").toLowerCase();
  let upload;
  let mimeType;

  if (requestType.includes("multipart/form-data")) {
    const formData = await request.formData();
    upload = formData.get("file");
    mimeType = String(upload?.type || "").toLowerCase();
  } else {
    upload = await request.arrayBuffer();
    mimeType = requestType.split(";", 1)[0].trim();
  }

  const size = Number(upload?.size ?? upload?.byteLength ?? 0);
  if (!upload || !Number.isFinite(size) || size <= 0) {
    throw Object.assign(new Error("Vui lòng chọn file hình ảnh."), { status: 400 });
  }
  if (size > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error("Ảnh vượt quá dung lượng tối đa 20 MB."), {
      status: 413,
    });
  }
  if (!IMAGE_TYPES[mimeType]) {
    throw Object.assign(
      new Error("Chỉ hỗ trợ ảnh JPG, PNG, GIF, WebP hoặc AVIF."),
      { status: 415 },
    );
  }

  const arrayBuffer =
    upload instanceof ArrayBuffer ? upload : await upload.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isValidImageSignature(bytes, mimeType)) {
    throw Object.assign(new Error("Nội dung tệp không khớp định dạng hình ảnh."), {
      status: 415,
    });
  }

  return { arrayBuffer, extension: IMAGE_TYPES[mimeType], mimeType };
};

const getBunnyConfig = (env = {}) => {
  const storageZone = String(env.BUNNY_STORAGE_ZONE_NAME || "").trim();
  const accessKey = String(env.BUNNY_STORAGE_ACCESS_KEY || "").trim();
  const cdnValue = String(
    env.BUNNY_PULL_ZONE_HOSTNAME || env.BUNNY_CDN_URL || "",
  ).trim();
  const storageApiHostname = String(
    env.BUNNY_STORAGE_API_HOSTNAME || "storage.bunnycdn.com",
  ).trim();

  const missingSettings = [
    !storageZone && "BUNNY_STORAGE_ZONE_NAME",
    !accessKey && "BUNNY_STORAGE_ACCESS_KEY",
    !cdnValue && "BUNNY_PULL_ZONE_HOSTNAME (hoặc BUNNY_CDN_URL)",
  ].filter(Boolean);
  if (missingSettings.length > 0) {
    throw Object.assign(new Error(
      `Bunny Storage thiếu cấu hình: ${missingSettings.join(", ")}. Cấu hình trên server hoặc chọn S3 để tải ảnh.`,
    ), {
      status: 503,
    });
  }
  if (!/^[A-Za-z0-9-]{1,80}$/.test(storageZone)) {
    throw Object.assign(new Error("Tên Bunny Storage Zone không hợp lệ."), {
      status: 503,
    });
  }
  if (!/^[A-Za-z0-9.-]+$/.test(storageApiHostname)) {
    throw Object.assign(new Error("Bunny Storage API hostname không hợp lệ."), {
      status: 503,
    });
  }

  let cdnUrl;
  try {
    cdnUrl = new URL(/^https?:\/\//i.test(cdnValue) ? cdnValue : `https://${cdnValue}`);
  } catch {
    throw Object.assign(new Error("Bunny CDN URL không hợp lệ."), { status: 503 });
  }
  if (cdnUrl.protocol !== "https:" || cdnUrl.username || cdnUrl.password) {
    throw Object.assign(new Error("Bunny CDN URL phải sử dụng HTTPS."), {
      status: 503,
    });
  }

  return {
    accessKey,
    cdnBaseUrl: cdnUrl.toString().replace(/\/+$/, ""),
    storageApiHostname,
    storageZone,
  };
};

export async function onRequestPost(context) {
  try {
    await requireImageUploadAdmin(context);
    const image = await readImage(context.request);
    const config = getBunnyConfig(context.env);
    const filePath = `courses/images/${Date.now()}-${crypto.randomUUID()}.${image.extension}`;
    const storageUrl = `https://${config.storageApiHostname}/${encodeURIComponent(config.storageZone)}/${filePath}`;
    const bunnyResponse = await fetch(storageUrl, {
      method: "PUT",
      headers: {
        AccessKey: config.accessKey,
        "Content-Type": image.mimeType,
      },
      body: image.arrayBuffer,
    });

    if (!bunnyResponse.ok) {
      const upstreamMessage = (await bunnyResponse.text()).trim().slice(0, 300);
      console.error("Bunny Storage upload failed", bunnyResponse.status, upstreamMessage);
      throw Object.assign(new Error("Bunny Storage từ chối tệp tải lên."), {
        status: 502,
      });
    }

    return json({
      success: true,
      url: `${config.cdnBaseUrl}/${filePath}`,
    });
  } catch (error) {
    const status = Number(error?.status) || 500;
    return json(
      {
        success: false,
        message:
          status >= 500 && status !== 503
            ? "Không thể tải ảnh lên Bunny Storage lúc này."
            : error?.message || "Tải ảnh lên Bunny Storage thất bại.",
      },
      status,
    );
  }
}
