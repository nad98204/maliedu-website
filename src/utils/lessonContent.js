export const LESSON_CONTENT_TYPES = Object.freeze({
  VIDEO: "video",
  AUDIO: "audio",
  MIXED: "mixed",
  ARTICLE: "article",
  IMAGE: "image",
  ARTICLE_IMAGE: "article_image",
});

export const LESSON_BLOCK_KEYS = Object.freeze({
  VIDEO: "video",
  AUDIO: "audio",
  ARTICLE: "article",
  IMAGES: "images",
});

const VALID_BLOCK_KEYS = new Set(Object.values(LESSON_BLOCK_KEYS));

export const LESSON_CONTENT_TYPE_OPTIONS = Object.freeze([
  { value: LESSON_CONTENT_TYPES.VIDEO, label: "Video", shortLabel: "Video" },
  { value: LESSON_CONTENT_TYPES.AUDIO, label: "Âm thanh", shortLabel: "Audio" },
  {
    value: LESSON_CONTENT_TYPES.MIXED,
    label: "Đa nội dung",
    shortLabel: "Video & audio",
  },
  { value: LESSON_CONTENT_TYPES.ARTICLE, label: "Bài viết", shortLabel: "Bài viết" },
  { value: LESSON_CONTENT_TYPES.IMAGE, label: "Hình ảnh", shortLabel: "Hình ảnh" },
  {
    value: LESSON_CONTENT_TYPES.ARTICLE_IMAGE,
    label: "Bài viết & Hình ảnh",
    shortLabel: "Bài viết & ảnh",
  },
]);

const VALID_CONTENT_TYPES = new Set(
  LESSON_CONTENT_TYPE_OPTIONS.map((option) => option.value),
);

export const normalizeLessonContentType = (lessonOrType) => {
  const rawType =
    typeof lessonOrType === "string"
      ? lessonOrType
      : lessonOrType?.contentType || lessonOrType?.type;

  return VALID_CONTENT_TYPES.has(rawType)
    ? rawType
    : LESSON_CONTENT_TYPES.VIDEO;
};

export const getLessonContentOrder = (lesson = {}) => {
  const explicitOrder = Array.isArray(lesson?.contentOrder)
    ? Array.from(
        new Set(
          lesson.contentOrder.filter((blockKey) => VALID_BLOCK_KEYS.has(blockKey)),
        ),
      )
    : [];

  if (explicitOrder.length > 0) return explicitOrder;

  const contentType = normalizeLessonContentType(lesson);
  if (contentType === LESSON_CONTENT_TYPES.ARTICLE_IMAGE) {
    return [LESSON_BLOCK_KEYS.ARTICLE, LESSON_BLOCK_KEYS.IMAGES];
  }
  if (contentType === LESSON_CONTENT_TYPES.IMAGE) {
    return [LESSON_BLOCK_KEYS.IMAGES];
  }
  if (contentType === LESSON_CONTENT_TYPES.ARTICLE) {
    return [LESSON_BLOCK_KEYS.ARTICLE];
  }
  if (contentType === LESSON_CONTENT_TYPES.AUDIO) {
    return [LESSON_BLOCK_KEYS.AUDIO];
  }
  if (contentType === LESSON_CONTENT_TYPES.MIXED) {
    return [
      LESSON_BLOCK_KEYS.VIDEO,
      LESSON_BLOCK_KEYS.AUDIO,
      LESSON_BLOCK_KEYS.ARTICLE,
      LESSON_BLOCK_KEYS.IMAGES,
    ];
  }

  return [LESSON_BLOCK_KEYS.VIDEO];
};

export const getLessonContentTypeForOrder = (contentOrder = []) => {
  const order = Array.from(
    new Set(contentOrder.filter((blockKey) => VALID_BLOCK_KEYS.has(blockKey))),
  );

  if (order.length !== 1) {
    const hasArticleAndImages =
      order.length === 2 &&
      order.includes(LESSON_BLOCK_KEYS.ARTICLE) &&
      order.includes(LESSON_BLOCK_KEYS.IMAGES);
    return hasArticleAndImages
      ? LESSON_CONTENT_TYPES.ARTICLE_IMAGE
      : LESSON_CONTENT_TYPES.MIXED;
  }

  if (order[0] === LESSON_BLOCK_KEYS.AUDIO) return LESSON_CONTENT_TYPES.AUDIO;
  if (order[0] === LESSON_BLOCK_KEYS.ARTICLE) return LESSON_CONTENT_TYPES.ARTICLE;
  if (order[0] === LESSON_BLOCK_KEYS.IMAGES) return LESSON_CONTENT_TYPES.IMAGE;
  return LESSON_CONTENT_TYPES.VIDEO;
};

export const getLessonContentTypeLabel = (lessonOrType, short = false) => {
  const contentType = normalizeLessonContentType(lessonOrType);
  const option = LESSON_CONTENT_TYPE_OPTIONS.find(
    (candidate) => candidate.value === contentType,
  );

  return short ? option?.shortLabel : option?.label;
};

export const getLessonImages = (lesson = {}) =>
  Array.from(
    new Set(
      [
        ...(Array.isArray(lesson.images) ? lesson.images : []),
        lesson.imageUrl,
      ].filter((url) => typeof url === "string" && url.trim()),
    ),
  );

const normalizeAudioTrack = (track, index) => {
  if (typeof track === "string") {
    const url = track.trim();
    return url
      ? { id: `audio-${index}`, title: `Bản âm thanh ${index + 1}`, url, duration: "" }
      : null;
  }

  const url = typeof track?.url === "string" ? track.url.trim() : "";
  if (!url) return null;

  return {
    ...track,
    id: track.id || `audio-${index}`,
    title: String(track.title || track.name || `Bản âm thanh ${index + 1}`).trim(),
    url,
    duration: String(track.duration || "").trim(),
  };
};

export const getLessonAudios = (lesson = {}) => {
  const tracks = (Array.isArray(lesson.audios) ? lesson.audios : [])
    .map(normalizeAudioTrack)
    .filter(Boolean);
  const legacyAudioUrl =
    typeof lesson.audioUrl === "string" ? lesson.audioUrl.trim() : "";

  if (legacyAudioUrl && !tracks.some((track) => track.url === legacyAudioUrl)) {
    tracks.unshift({
      id: "primary-audio",
      title: String(lesson.audioTitle || lesson.title || "Bản âm thanh chính").trim(),
      url: legacyAudioUrl,
      duration: String(lesson.audioDuration || lesson.duration || "").trim(),
    });
  }

  return Array.from(new Map(tracks.map((track) => [track.url, track])).values());
};

export const lessonHasArticle = (lessonOrType) => {
  if (typeof lessonOrType === "object" && Array.isArray(lessonOrType?.contentOrder)) {
    return getLessonContentOrder(lessonOrType).includes(LESSON_BLOCK_KEYS.ARTICLE);
  }
  const contentType = normalizeLessonContentType(lessonOrType);
  return (
    contentType === LESSON_CONTENT_TYPES.ARTICLE ||
    contentType === LESSON_CONTENT_TYPES.ARTICLE_IMAGE ||
    contentType === LESSON_CONTENT_TYPES.MIXED ||
    (typeof lessonOrType === "object" && Boolean(lessonOrType?.articleContent))
  );
};

export const lessonHasImages = (lessonOrType) => {
  if (typeof lessonOrType === "object" && Array.isArray(lessonOrType?.contentOrder)) {
    return getLessonContentOrder(lessonOrType).includes(LESSON_BLOCK_KEYS.IMAGES);
  }
  const contentType = normalizeLessonContentType(lessonOrType);
  return (
    contentType === LESSON_CONTENT_TYPES.IMAGE ||
    contentType === LESSON_CONTENT_TYPES.ARTICLE_IMAGE ||
    contentType === LESSON_CONTENT_TYPES.MIXED ||
    (typeof lessonOrType === "object" && getLessonImages(lessonOrType).length > 0)
  );
};

export const lessonHasAudio = (lessonOrType) => {
  if (typeof lessonOrType === "object" && Array.isArray(lessonOrType?.contentOrder)) {
    return getLessonContentOrder(lessonOrType).includes(LESSON_BLOCK_KEYS.AUDIO);
  }
  const contentType = normalizeLessonContentType(lessonOrType);
  return (
    contentType === LESSON_CONTENT_TYPES.AUDIO ||
    contentType === LESSON_CONTENT_TYPES.MIXED ||
    (typeof lessonOrType === "object" && getLessonAudios(lessonOrType).length > 0)
  );
};

export const lessonHasVideo = (lessonOrType) => {
  if (typeof lessonOrType === "object" && Array.isArray(lessonOrType?.contentOrder)) {
    return getLessonContentOrder(lessonOrType).includes(LESSON_BLOCK_KEYS.VIDEO);
  }
  const contentType = normalizeLessonContentType(lessonOrType);
  return (
    contentType === LESSON_CONTENT_TYPES.VIDEO ||
    contentType === LESSON_CONTENT_TYPES.MIXED ||
    (typeof lessonOrType === "object" && Boolean(lessonOrType?.videoId))
  );
};
