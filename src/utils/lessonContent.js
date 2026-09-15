export const LESSON_CONTENT_TYPES = Object.freeze({
  VIDEO: "video",
  ARTICLE: "article",
  IMAGE: "image",
  ARTICLE_IMAGE: "article_image",
});

export const LESSON_CONTENT_TYPE_OPTIONS = Object.freeze([
  { value: LESSON_CONTENT_TYPES.VIDEO, label: "Video", shortLabel: "Video" },
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

export const lessonHasArticle = (lessonOrType) => {
  const contentType = normalizeLessonContentType(lessonOrType);
  return (
    contentType === LESSON_CONTENT_TYPES.ARTICLE ||
    contentType === LESSON_CONTENT_TYPES.ARTICLE_IMAGE
  );
};

export const lessonHasImages = (lessonOrType) => {
  const contentType = normalizeLessonContentType(lessonOrType);
  return (
    contentType === LESSON_CONTENT_TYPES.IMAGE ||
    contentType === LESSON_CONTENT_TYPES.ARTICLE_IMAGE
  );
};
