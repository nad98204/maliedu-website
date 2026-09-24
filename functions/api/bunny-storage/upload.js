const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
const SUPER_ADMIN_EMAIL = "mongcoaching@gmail.com";
const DEFAULT_FIREBASE_PROJECT_ID = "maliedu-web";
const IMAGE_TYPES = Object.freeze({
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
});
const AUDIO_TYPES = Object.freeze({
  "audio/aac": "aac",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-flac": "flac",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
});
const AUDIO_EXTENSION_TYPES = Object.freeze({
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  opus: "audio/opus",
  wav: "audio/wav",
  webm: "audio/webm",
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

const requireMediaUploadAdmin = async (context) => {
  const token = getBearerToken(context.request);
  const projectId = String(
    context.env?.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
  ).trim();
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

  const email = String(payload.email || "").trim().toLowerCase();
  const isSuperAdmin =
    email === SUPER_ADMIN_EMAIL && payload.email_verified === true;

  // The decoded JWT payload is not trusted by itself. This Firestore request
  // makes Google validate the bearer token before any role receives access.
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

  if (isSuperAdmin) {
    return;
  }

  const profile = profileResponse.ok ? await profileResponse.json() : null;
  const isAdmin = getFirestoreString(profile, "role").toLowerCase() === "admin";
  const allowedModules = getFirestoreStringArray(profile, "allowedModules");
  const canUploadMedia =
    isAdmin && (
      allowedModules.length === 0 ||
      allowedModules.includes("courses") ||
      allowedModules.includes("instructors")
    );

  if (!canUploadMedia) {
    throw Object.assign(new Error("Bạn không có quyền tải nội dung khóa học hoặc giảng viên."), {
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

const isValidAudioSignature = (bytes, mimeType) => {
  const startsWith = (...signature) =>
    signature.every((value, index) => bytes[index] === value);
  const textAt = (start, length) =>
    String.fromCharCode(...bytes.slice(start, start + length));

  if (mimeType === "audio/mpeg") {
    return textAt(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  }
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
    return textAt(0, 4) === "RIFF" && textAt(8, 4) === "WAVE";
  }
  if (mimeType === "audio/ogg" || mimeType === "audio/opus") {
    return textAt(0, 4) === "OggS";
  }
  if (mimeType === "audio/flac" || mimeType === "audio/x-flac") {
    return textAt(0, 4) === "fLaC";
  }
  if (mimeType === "audio/mp4" || mimeType === "audio/x-m4a") {
    return textAt(4, 4) === "ftyp";
  }
  if (mimeType === "audio/aac") {
    return bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  }
  if (mimeType === "audio/webm") {
    return startsWith(0x1a, 0x45, 0xdf, 0xa3);
  }
  return false;
};

const readMedia = async (request) => {
  const requestType = String(request.headers.get("Content-Type") || "").toLowerCase();
  let upload;
  let mimeType;
  let mediaType = "image";

  if (requestType.includes("multipart/form-data")) {
    const formData = await request.formData();
    upload = formData.get("file");
    mimeType = String(upload?.type || "").toLowerCase();
    mediaType = String(formData.get("mediaType") || "image").toLowerCase();
    if (mediaType === "audio" && !AUDIO_TYPES[mimeType]) {
      const extension = String(upload?.name || "").split(".").pop()?.toLowerCase();
      mimeType = AUDIO_EXTENSION_TYPES[extension] || mimeType;
    }
  } else {
    upload = await request.arrayBuffer();
    mimeType = requestType.split(";", 1)[0].trim();
    mediaType = String(request.headers.get("X-Upload-Media-Type") || "image").toLowerCase();
  }

  if (mediaType !== "image" && mediaType !== "audio") {
    throw Object.assign(new Error("Loại nội dung tải lên không hợp lệ."), { status: 400 });
  }

  const size = Number(upload?.size ?? upload?.byteLength ?? 0);
  if (!upload || !Number.isFinite(size) || size <= 0) {
    throw Object.assign(new Error(`Vui lòng chọn file ${mediaType === "audio" ? "âm thanh" : "hình ảnh"}.`), { status: 400 });
  }
  const maxBytes = mediaType === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (size > maxBytes) {
    throw Object.assign(new Error(
      mediaType === "audio"
        ? "Âm thanh vượt quá dung lượng tối đa 200 MB."
        : "Ảnh vượt quá dung lượng tối đa 20 MB.",
    ), {
      status: 413,
    });
  }
  const supportedTypes = mediaType === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
  if (!supportedTypes[mimeType]) {
    throw Object.assign(
      new Error(
        mediaType === "audio"
          ? "Chỉ hỗ trợ audio MP3, M4A, AAC, WAV, OGG, OPUS, FLAC hoặc WebM."
          : "Chỉ hỗ trợ ảnh JPG, PNG, GIF, WebP hoặc AVIF.",
      ),
      { status: 415 },
    );
  }

  const arrayBuffer =
    upload instanceof ArrayBuffer ? upload : await upload.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const validSignature = mediaType === "audio"
    ? isValidAudioSignature(bytes, mimeType)
    : isValidImageSignature(bytes, mimeType);
  if (!validSignature) {
    throw Object.assign(new Error(`Nội dung tệp không khớp định dạng ${mediaType === "audio" ? "âm thanh" : "hình ảnh"}.`), {
      status: 415,
    });
  }

  return {
    arrayBuffer,
    extension: supportedTypes[mimeType],
    mediaType,
    mimeType,
  };
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
      `Bunny Storage thiếu cấu hình: ${missingSettings.join(", ")}. Cấu hình trên server hoặc chọn S3 để tải tệp.`,
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
    await requireMediaUploadAdmin(context);
    const media = await readMedia(context.request);
    const config = getBunnyConfig(context.env);
    const folder = media.mediaType === "audio" ? "courses/audios" : "courses/images";
    const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${media.extension}`;
    const storageUrl = `https://${config.storageApiHostname}/${encodeURIComponent(config.storageZone)}/${filePath}`;
    const bunnyResponse = await fetch(storageUrl, {
      method: "PUT",
      headers: {
        AccessKey: config.accessKey,
        "Content-Type": media.mimeType,
      },
      body: media.arrayBuffer,
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
      mediaType: media.mediaType,
      url: `${config.cdnBaseUrl}/${filePath}`,
    });
  } catch (error) {
    const status = Number(error?.status) || 500;
    return json(
      {
        success: false,
        message:
          status >= 500 && status !== 503
            ? "Không thể tải nội dung lên Bunny Storage lúc này."
            : error?.message || "Tải nội dung lên Bunny Storage thất bại.",
      },
      status,
    );
  }
}
