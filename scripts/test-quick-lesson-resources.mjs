import test from "node:test";
import assert from "node:assert/strict";
import { getQuickLessonResources } from "../src/utils/quickLessonResources.js";

const lesson = { id: "lesson-1", title: "Bài 1", resourceName: "Phiếu bài tập", resourceLink: "https://cdn.test/workbook.pdf" };

test("hides every quick resource without full course access", () => {
  assert.deepEqual(getQuickLessonResources({ hasFullAccess: false, contextResources: [{ url: "secret.pdf" }], currentLesson: lesson }), []);
});

test("adds a lesson direct resource and gives it a stable name", () => {
  const result = getQuickLessonResources({ hasFullAccess: true, currentLesson: lesson, currentLessonId: lesson.id });
  assert.deepEqual(result[0], {
    id: "direct-resource-lesson-1", name: "Phiếu bài tập", url: lesson.resourceLink,
    lessonId: lesson.id, resourceScope: "lesson",
  });
});

test("deduplicates the direct lesson file already present in context", () => {
  const result = getQuickLessonResources({
    hasFullAccess: true, currentLesson: lesson, currentLessonId: lesson.id,
    contextResources: [{ id: "normalized", name: "Existing", url: lesson.resourceLink }, { id: "section", url: "section.pdf" }],
  });
  assert.equal(result.length, 2);
  assert.equal(result.filter((resource) => resource.url === lesson.resourceLink).length, 1);
});

test("removes invalid and duplicate context URLs while preserving order", () => {
  const result = getQuickLessonResources({ hasFullAccess: true, contextResources: [
    { id: "a", url: " a.pdf " }, { id: "bad", url: "" }, { id: "a2", url: "a.pdf" }, { id: "b", url: "b.pdf" },
  ] });
  assert.deepEqual(result.map((resource) => resource.id), ["a", "b"]);
});
