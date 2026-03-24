import { collection, getDocs, query, where } from "firebase/firestore";

export const DEFAULT_SECTION_TITLE = "Nội dung khóa học";
export const DEFAULT_FREE_LESSONS_COUNT = 3;

export const getLessonKey = (lesson) => lesson?.id || lesson?.videoId || null;

export const normalizeCourseSections = (curriculum = []) => {
  if (!Array.isArray(curriculum) || curriculum.length === 0) {
    return [];
  }

  const sections = curriculum[0]?.lessons
    ? curriculum
    : [{ title: DEFAULT_SECTION_TITLE, lessons: curriculum }];

  return sections.map((section, sectionIndex) => ({
    ...section,
    id: section.id || `section-${sectionIndex}`,
  }));
};

const clampPreviewCount = (value, maxValue) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return Math.min(DEFAULT_FREE_LESSONS_COUNT, maxValue);
  }

  return Math.max(0, Math.min(parsed, maxValue));
};

export const getPreviewableLessonKeys = (course) => {
  const sections = normalizeCourseSections(course?.curriculum);
  const flatLessons = sections.flatMap((section) => section.lessons || []);
  const previewableKeys = new Set();
  const freeLessonCount =
    course?.isForSale === false
      ? clampPreviewCount(course?.freeLessonsCount, flatLessons.length)
      : 0;

  flatLessons.forEach((lesson, lessonIndex) => {
    const lessonKey = getLessonKey(lesson);

    if (!lessonKey) {
      return;
    }

    if (
      (course?.isForSale === false && lessonIndex < freeLessonCount) ||
      lesson?.isFreePreview
    ) {
      previewableKeys.add(lessonKey);
    }
  });

  return Array.from(previewableKeys);
};

export const getPreviewSections = (course) => {
  const previewableKeys = new Set(getPreviewableLessonKeys(course));

  return normalizeCourseSections(course?.curriculum)
    .map((section) => ({
      ...section,
      lessons: (section.lessons || []).filter((lesson) =>
        previewableKeys.has(getLessonKey(lesson))
      ),
    }))
    .filter((section) => section.lessons.length > 0);
};

export const getPreferredPreviewLesson = (course, requestedLessonKey = null) => {
  const previewSections = getPreviewSections(course);
  const previewLessons = previewSections.flatMap((section) => section.lessons || []);

  if (previewLessons.length === 0) {
    return null;
  }

  if (requestedLessonKey) {
    const matchedLesson = previewLessons.find(
      (lesson) => getLessonKey(lesson) === requestedLessonKey
    );

    if (matchedLesson) {
      return matchedLesson;
    }
  }

  return previewLessons[0];
};

export const userIsListedInCourse = ({ course, user }) => {
  if (!user?.uid || !Array.isArray(course?.students)) {
    return false;
  }

  return course.students.includes(user.uid);
};

export const findCourseEnrollment = async ({ db, courseId, user }) => {
  if (!courseId || !user) {
    return null;
  }

  if (user.uid) {
    const byUidSnapshot = await getDocs(
      query(
        collection(db, "enrollments"),
        where("userId", "==", user.uid),
        where("courseId", "==", courseId)
      )
    );

    if (!byUidSnapshot.empty) {
      const docSnapshot = byUidSnapshot.docs[0];
      return { id: docSnapshot.id, ...docSnapshot.data() };
    }
  }

  if (user.email) {
    const byEmailSnapshot = await getDocs(
      query(
        collection(db, "enrollments"),
        where("userEmail", "==", user.email),
        where("courseId", "==", courseId)
      )
    );

    if (!byEmailSnapshot.empty) {
      const docSnapshot = byEmailSnapshot.docs[0];
      return { id: docSnapshot.id, ...docSnapshot.data() };
    }
  }

  return null;
};

export const resolveCourseAccess = async ({ db, course, user }) => {
  const enrollment = await findCourseEnrollment({
    db,
    courseId: course?.id,
    user,
  });
  const listedInCourse = userIsListedInCourse({ course, user });

  return {
    enrollment,
    hasFullAccess: listedInCourse || Boolean(enrollment),
    listedInCourse,
  };
};
