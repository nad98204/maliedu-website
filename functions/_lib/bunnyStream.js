const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
const BUNNY_VIDEO_API_ORIGIN = "https://video.bunnycdn.com";
const BUNNY_PLAYER_ORIGIN = "https://iframe.mediadelivery.net";
const DEFAULT_UPLOAD_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_PLAYBACK_TTL_SECONDS = 2 * 60 * 60;
const MAX_TITLE_LENGTH = 180;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024 * 1024;

const encoder = new TextEncoder();

const trimString = (value) => String(value || "").trim();

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

const sha256Hex = async (value) =>
  toHex(await crypto.subtle.digest("SHA-256", encoder.encode(String(value))));

const getLibraryId = (env = {}) => {
  const libraryId = trimString(env.BUNNY_STREAM_LIBRARY_ID);
  if (!/^\d+$/.test(libraryId)) {
    throw createHttpError(500, "Bunny Stream library is not configured");
  }
  return libraryId;
};

const getApiKey = (env = {}) => {
  const apiKey = trimString(env.BUNNY_STREAM_API_KEY);
  if (!apiKey) {
    throw createHttpError(500, "Bunny Stream upload is not configured");
  }
  return apiKey;
};

const getTokenKey = (env = {}) => {
  const tokenKey = trimString(env.BUNNY_STREAM_TOKEN_KEY);
  if (!tokenKey) {
    throw createHttpError(500, "Bunny Stream playback security is not configured");
  }
  return tokenKey;
};

const validateVideoId = (value) => {
  const videoId = trimString(value).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(videoId)) {
    throw createHttpError(400, "Invalid Bunny Stream video ID");
  }
  return videoId;
};

const normalizeTitle = (value) => {
  const title = trimString(value)
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? " " : character;
    })
    .join("");
  if (!title) {
    throw createHttpError(400, "Video title is required");
  }
  return title.slice(0, MAX_TITLE_LENGTH);
};

const validateUploadMetadata = (payload = {}) => {
  const fileSize = Number(payload.fileSize);
  const fileType = trimString(payload.fileType).toLowerCase();

  if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_VIDEO_BYTES) {
    throw createHttpError(400, "Invalid or oversized video file");
  }
  const isVideo = fileType.startsWith("video/");
  const isAudio = fileType.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac|flac|wma)$/i.test(payload.title || payload.fileName || "");
  if ((!isVideo && !isAudio) || fileType.length > 128) {
    throw createHttpError(400, "Only video and audio files can be uploaded to Bunny Stream");
  }

  return {
    title: normalizeTitle(payload.title || payload.fileName),
    fileSize,
    fileType,
  };
};

const readBunnyError = async (response) => {
  const rawText = await response.text();
  try {
    const data = JSON.parse(rawText);
    return trimString(data?.message || data?.Message || data?.error);
  } catch {
    return "";
  }
};

export const createBunnyUploadCredentials = async (env, payload = {}) => {
  const libraryId = getLibraryId(env);
  const apiKey = getApiKey(env);
  const { title, fileSize, fileType } = validateUploadMetadata(payload);
  const response = await fetch(
    `${BUNNY_VIDEO_API_ORIGIN}/library/${libraryId}/videos`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        AccessKey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!response.ok) {
    const detail = await readBunnyError(response);
    throw createHttpError(
      response.status >= 400 && response.status < 500 ? 502 : 503,
      detail ? `Bunny Stream rejected the upload: ${detail}` : "Unable to create Bunny Stream upload",
    );
  }

  const video = await response.json();
  const videoId = validateVideoId(video?.guid);
  const expirationTime = Math.floor(Date.now() / 1000) + DEFAULT_UPLOAD_TTL_SECONDS;
  const signature = await sha256Hex(
    `${libraryId}${apiKey}${expirationTime}${videoId}`,
  );

  return {
    provider: "bunny",
    videoId,
    libraryId,
    expirationTime,
    signature,
    endpoint: BUNNY_TUS_ENDPOINT,
    fileSize,
    fileType,
    title,
  };
};

export const createBunnyEmbedPlayback = async (
  env,
  rawVideoId,
  ttlSeconds = DEFAULT_PLAYBACK_TTL_SECONDS,
) => {
  const libraryId = getLibraryId(env);
  const tokenKey = getTokenKey(env);
  const videoId = validateVideoId(rawVideoId);
  const safeTtl = Math.max(5 * 60, Math.min(Number(ttlSeconds) || DEFAULT_PLAYBACK_TTL_SECONDS, 24 * 60 * 60));
  const expires = Math.floor(Date.now() / 1000) + safeTtl;
  const token = await sha256Hex(`${tokenKey}${videoId}${expires}`);
  const url = new URL(`${BUNNY_PLAYER_ORIGIN}/embed/${libraryId}/${videoId}`);
  url.searchParams.set("token", token);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("responsive", "true");
  url.searchParams.set("preload", "true");

  return {
    provider: "bunny",
    videoId,
    expires,
    playbackUrl: url.toString(),
  };
};

export const isBunnyLesson = (lesson) =>
  lesson?.videoProvider === "bunny" && Boolean(lesson?.videoId);

export const findLessonInCurriculum = (curriculum, lessonId) => {
  const wantedId = trimString(lessonId);
  if (!wantedId || !Array.isArray(curriculum)) return null;

  const sections = curriculum[0]?.lessons
    ? curriculum
    : [{ lessons: curriculum }];

  for (const section of sections) {
    const lesson = (section?.lessons || []).find(
      (candidate) =>
        trimString(candidate?.id) === wantedId ||
        trimString(candidate?.videoId) === wantedId,
    );
    if (lesson) return lesson;
  }

  return null;
};

export const isActiveCourseAccess = (access = {}, nowMs = Date.now()) => {
  if (access?.status !== "active") return false;
  const expiresAt = access?.expiresAt;
  if (expiresAt == null) return true;

  const expirationMs =
    typeof expiresAt?.toMillis === "function"
      ? expiresAt.toMillis()
      : expiresAt?.seconds
        ? Number(expiresAt.seconds) * 1000
        : new Date(expiresAt).getTime();

  return Number.isFinite(expirationMs) && expirationMs > nowMs;
};

export const bunnyStreamTestables = {
  findLessonInCurriculum,
  isActiveCourseAccess,
  validateVideoId,
};
