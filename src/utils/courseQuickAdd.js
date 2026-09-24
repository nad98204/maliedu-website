import {
  getLessonContentOrder,
  LESSON_CONTENT_TYPES,
  normalizeLessonContentType,
} from "./lessonContent.js";

const text = (value) => typeof value === "string" ? value.trim() : "";

export const getLessonTitleFromFileName = (fileName = "") =>
  text(fileName).replace(/\.[^/.]+$/, "").trim();

export const createQuickLesson = (draft = {}, createId = () => "") => {
  const contentType = normalizeLessonContentType(draft.contentType);
  const videoId = text(draft.videoId);
  const title = text(draft.title) || (videoId ? "Bài học video" : "");
  if (!title || (contentType === LESSON_CONTENT_TYPES.VIDEO && !videoId)) return null;

  return {
    id: text(draft.id) || createId(),
    title,
    contentType,
    contentOrder: getLessonContentOrder({ contentType }),
    videoId:
      contentType === LESSON_CONTENT_TYPES.VIDEO ||
      contentType === LESSON_CONTENT_TYPES.MIXED
        ? videoId
        : "",
    videoProvider: draft.videoProvider === "bunny" ? "bunny" : "s3",
    duration:
      contentType === LESSON_CONTENT_TYPES.VIDEO ||
      contentType === LESSON_CONTENT_TYPES.AUDIO ||
      contentType === LESSON_CONTENT_TYPES.MIXED
        ? text(draft.duration)
        : "",
    description: text(draft.description),
    articleContent: text(draft.articleContent),
    images: Array.isArray(draft.images) ? draft.images : [],
    ...(
      contentType === LESSON_CONTENT_TYPES.AUDIO ||
      contentType === LESSON_CONTENT_TYPES.MIXED ||
      (Array.isArray(draft.audios) && draft.audios.length > 0)
        ? { audios: Array.isArray(draft.audios) ? draft.audios : [] }
        : {}
    ),
    isFreePreview: false,
    ...((contentType === LESSON_CONTENT_TYPES.VIDEO || contentType === LESSON_CONTENT_TYPES.MIXED) && videoId && draft.videoProvider === "bunny"
      ? { bunnyStatus: draft.bunnyStatus || "processing" }
      : {}),
  };
};

export const mergeQuickLessonDrafts = (curriculum = [], drafts = [], createId = () => "") => {
  const next = curriculum.map((section) => ({ ...section, lessons: [...(section.lessons || [])] }));
  const added = [];
  const incomplete = [];

  drafts.forEach((draft) => {
    const hasInput = Boolean(text(draft.title) || text(draft.videoId));
    if (!hasInput) return;
    const lesson = createQuickLesson(draft, createId);
    if (!lesson || !next[draft.sectionIndex]) {
      incomplete.push(draft.sectionIndex);
      return;
    }
    const duplicateVideo = lesson.videoId && next[draft.sectionIndex].lessons.some(
      (current) => text(current.videoId) === lesson.videoId,
    );
    if (duplicateVideo) return;
    next[draft.sectionIndex].lessons.push(lesson);
    added.push({ sectionIndex: draft.sectionIndex, lesson });
  });

  return { curriculum: next, added, incomplete: [...new Set(incomplete)] };
};
