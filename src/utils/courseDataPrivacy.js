export const COURSE_CONTENT_COLLECTION = "course_content";
export const COURSE_ACCESS_COLLECTION = "course_access";
export const COURSE_CONTENT_SCHEMA_VERSION = 2;

const PRIVATE_ROOT_FIELDS = [
  "courseResources",
  "lessonUrls",
  "resourceUrl",
  "students",
  "videoId",
  "videoUrl",
  "videoURL",
];

const DEFAULT_FREE_LESSONS_COUNT = 3;

const clampPreviewCount = (value, maxValue) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.min(DEFAULT_FREE_LESSONS_COUNT, maxValue);
  }

  return Math.max(0, Math.min(parsed, maxValue));
};

const isUsablePublicId = (value, privateValue = null) =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 160 &&
  value !== privateValue &&
  !/^[a-z][a-z0-9+.-]*:\/\//i.test(value);

const getRawSections = (curriculum = []) => {
  if (!Array.isArray(curriculum) || curriculum.length === 0) {
    return [];
  }

  return curriculum[0]?.lessons
    ? curriculum
    : [{ title: "Nội dung khóa học", lessons: curriculum }];
};

const normalizePrivateContent = (courseId, course = {}) => {
  const lessonKeyMap = new Map();
  const sectionKeyMap = new Map();
  const curriculum = getRawSections(course.curriculum).map(
    (section, sectionIndex) => {
      const fallbackSectionId = `section-${sectionIndex}`;
      const sectionId = isUsablePublicId(section?.id)
        ? section.id
        : fallbackSectionId;

      if (section?.id) {
        sectionKeyMap.set(section.id, sectionId);
      }

      return {
        ...section,
        id: sectionId,
        lessons: (section?.lessons || []).map((lesson, lessonIndex) => {
          const fallbackLessonId = `lesson-${sectionIndex}-${lessonIndex}`;
          const lessonId = isUsablePublicId(lesson?.id, lesson?.videoId)
            ? lesson.id
            : fallbackLessonId;

          [lesson?.id, lesson?.videoId]
            .filter(Boolean)
            .forEach((legacyKey) => lessonKeyMap.set(legacyKey, lessonId));

          return {
            ...lesson,
            id: lessonId,
            isFreePreview: Boolean(lesson?.isFreePreview),
          };
        }),
      };
    },
  );

  const courseResources = (Array.isArray(course.courseResources)
    ? course.courseResources
    : []
  ).map((resource, resourceIndex) => ({
    ...resource,
    id: resource?.id || `course-resource-${resourceIndex}`,
    linkedLessonId:
      lessonKeyMap.get(resource?.linkedLessonId || resource?.lessonId) ||
      resource?.linkedLessonId ||
      resource?.lessonId ||
      "",
    linkedSectionId:
      sectionKeyMap.get(resource?.linkedSectionId || resource?.sectionId) ||
      resource?.linkedSectionId ||
      resource?.sectionId ||
      "",
  }));

  return { courseId, curriculum, courseResources };
};

const getPreviewableLessonIds = (course, curriculum) => {
  const lessons = curriculum.flatMap((section) => section.lessons || []);
  const freeLessonCount =
    course?.isForSale === false && course?.isLeadGenerationEnabled !== true
      ? clampPreviewCount(course?.freeLessonsCount, lessons.length)
      : 0;

  return new Set(
    lessons
      .filter(
        (lesson, lessonIndex) =>
          lesson?.isFreePreview ||
          (course?.isForSale === false &&
            course?.isLeadGenerationEnabled !== true &&
            lessonIndex < freeLessonCount),
      )
      .map((lesson) => lesson.id),
  );
};

export const buildPublicCurriculum = (course, normalizedCurriculum) => {
  const previewableIds = getPreviewableLessonIds(
    course,
    normalizedCurriculum,
  );

  return normalizedCurriculum.map((section) => ({
    id: section.id,
    title: section.title || "",
    lessons: (section.lessons || []).map((lesson) => {
      const publicLesson = {
        id: lesson.id,
        title: lesson.title || "",
        duration: lesson.duration || "",
        type: lesson.type || "video",
        isFreePreview: previewableIds.has(lesson.id),
      };

      if (previewableIds.has(lesson.id) && lesson.videoId) {
        publicLesson.videoId = lesson.videoId;
      }

      return publicLesson;
    }),
  }));
};

export const splitCourseForStorage = (courseId, rawCourse = {}) => {
  const normalized = normalizePrivateContent(courseId, rawCourse);
  const publicCourse = { ...rawCourse };

  delete publicCourse.id;
  PRIVATE_ROOT_FIELDS.forEach((field) => delete publicCourse[field]);
  publicCourse.curriculum = buildPublicCurriculum(
    rawCourse,
    normalized.curriculum,
  );
  publicCourse.contentSchemaVersion = COURSE_CONTENT_SCHEMA_VERSION;
  publicCourse.totalLessons = normalized.curriculum.reduce(
    (total, section) => total + (section.lessons || []).length,
    0,
  );

  const privateCourse = {
    courseId,
    curriculum: normalized.curriculum,
    courseResources: normalized.courseResources,
    contentSchemaVersion: COURSE_CONTENT_SCHEMA_VERSION,
    updatedAt: rawCourse.updatedAt || Date.now(),
  };

  ["videoId", "videoUrl", "videoURL"].forEach((field) => {
    if (rawCourse[field]) {
      privateCourse[field] = rawCourse[field];
    }
  });

  return { publicCourse, privateCourse };
};

export const mergeCourseWithContent = (publicCourse, privateCourse) => ({
  ...publicCourse,
  ...(privateCourse || {}),
  id: publicCourse?.id || privateCourse?.courseId,
});

export const getCourseAccessId = (userId, courseId) =>
  `${userId}_${courseId}`;
