export const DEFAULT_COURSE_INSTRUCTOR = Object.freeze({
  name: "Mong Coaching",
  title: "Life Coach & Spiritual Mentor",
  avatar: "",
  bio: "Với kinh nghiệm đồng hành cùng hàng ngàn học viên, Mong Coaching sẽ giúp bạn tìm lại chính mình, chữa lành những tổn thương và kiến tạo một cuộc đời thịnh vượng, hạnh phúc từ gốc rễ.",
});

const text = (value) => typeof value === "string" ? value.trim() : "";

// An explicit array is authoritative, even when empty (e.g. an unfinished draft).
// Otherwise upgrade the legacy single-instructor fields without changing the DB.
export const getCourseInstructors = (course = {}) => {
  const legacy = {
    id: course.authorId,
    name: course.instructorName,
    title: course.instructorTitle,
    avatar: course.instructorImageUrl,
    bio: course.instructorBio,
  };
  const rows = Array.isArray(course.instructors)
    ? course.instructors
    : Object.values(legacy).some((value) => text(value)) ? [legacy] : [];

  return rows
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .map((row, index) => ({
      ...(text(row.id) ? { id: text(row.id) } : {}),
      name: text(row.name),
      title: text(row.title),
      avatar: text(row.avatar),
      bio: text(row.bio),
      ...(typeof row.badge === "string" ? { badge: text(row.badge) } : {}),
      isPrimary: index === 0,
    }));
};

export const getCourseInstructorBadge = (instructor, showPrimary = false) =>
  text(instructor.badge) || (showPrimary && instructor.isPrimary ? "Giảng viên chính" : "");

export const syncCourseInstructors = (course = {}) => {
  const instructors = getCourseInstructors(course);
  const primary = instructors[0] || {};
  return {
    ...course,
    instructors,
    // Allows collaborators to be found without Firestore array-of-object queries.
    instructorIds: [...new Set(instructors.map((row) => row.id).filter(Boolean))],
    authorId: primary.id || "",
    instructorName: primary.name || "",
    instructorTitle: primary.title || "",
    instructorBio: primary.bio || "",
    instructorImageUrl: primary.avatar || "",
  };
};

// Only the first legacy row may inherit authorId; never assign it to collaborators.
export const getLinkedCourseInstructors = (course = {}) =>
  getCourseInstructors(course).map((row, index) => (
    index === 0 && !row.id && text(course.authorId)
      ? { ...row, id: text(course.authorId) }
      : row
  ));

export const mergeInstructorProfile = (instructor, latest = {}) => {
  const merged = { ...instructor };
  for (const field of ["name", "title", "avatar", "bio"]) {
    // An explicit empty value clears old snapshots (especially removed avatars).
    if (typeof latest[field] === "string") merged[field] = latest[field].trim();
  }
  return merged;
};

export const enrichCourseInstructors = (course, profiles = []) => {
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  return getLinkedCourseInstructors(course).map((row) =>
    row.id && byId.has(row.id) ? mergeInstructorProfile(row, byId.get(row.id)) : row
  );
};

// Return a minimal patch so unrelated course fields and collaborator metadata survive.
export const getInstructorCoursePatch = (course, instructorId, latest) => {
  const linked = getLinkedCourseInstructors(course);
  if (!linked.some((row) => row.id === instructorId)) return null;
  const rows = linked.map((row) => row.id === instructorId ? mergeInstructorProfile(row, latest) : row);
  const patch = {};
  if (Array.isArray(course.instructors)) {
    patch.instructors = course.instructors.map((row, index) => {
      const id = text(row?.id) || (index === 0 ? text(course.authorId) : "");
      return id === instructorId ? mergeInstructorProfile({ ...row, id }, latest) : row;
    });
    patch.instructorIds = [...new Set(rows.map((row) => row.id).filter(Boolean))];
  }
  if (linked[0]?.id === instructorId) {
    const primary = rows[0];
    Object.assign(patch, {
      instructorName: primary.name, instructorTitle: primary.title,
      instructorImageUrl: primary.avatar, instructorBio: primary.bio,
    });
  }
  return patch;
};
