const text = (value) => typeof value === "string" ? value.trim() : "";

export const getQuickLessonResources = ({
  hasFullAccess = false,
  contextResources = [],
  currentLesson,
  currentLessonId,
} = {}) => {
  if (!hasFullAccess) return [];

  const candidates = [...(Array.isArray(contextResources) ? contextResources : [])];
  const directUrl = text(currentLesson?.resourceLink);
  if (directUrl) {
    candidates.unshift({
      id: `direct-resource-${currentLessonId || currentLesson?.id || "lesson"}`,
      name: text(currentLesson?.resourceName) || `Tài liệu: ${text(currentLesson?.title) || "Bài học"}`,
      url: directUrl,
      lessonId: currentLessonId || currentLesson?.id || null,
      resourceScope: "lesson",
    });
  }

  const seenUrls = new Set();
  return candidates.reduce((result, resource) => {
    const url = text(resource?.url);
    if (!url || seenUrls.has(url)) return result;
    seenUrls.add(url);
    result.push({ ...resource, url });
    return result;
  }, []);
};
