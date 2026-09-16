import test from "node:test";
import assert from "node:assert/strict";
import { createQuickLesson, getLessonTitleFromFileName, mergeQuickLessonDrafts } from "../src/utils/courseQuickAdd.js";

test("derives a readable title from video filenames", () => {
  assert.equal(getLessonTitleFromFileName("Bài hướng dẫn thực hành.mp4"), "Bài hướng dẫn thực hành");
  assert.equal(getLessonTitleFromFileName("archive.lesson.final.MOV"), "archive.lesson.final");
});

test("creates a Bunny lesson with durable course fields", () => {
  const lesson = createQuickLesson({ title: "Bài 1", videoId: "bunny-id", videoProvider: "bunny", duration: "05:30", description: "  Thực hành bước 1  " }, () => "lesson-1");
  assert.deepEqual(lesson, {
    id: "lesson-1", title: "Bài 1", contentType: "video", videoId: "bunny-id",
    videoProvider: "bunny", duration: "05:30", description: "Thực hành bước 1", articleContent: "", images: [],
    isFreePreview: false, bunnyStatus: "processing",
  });
});

test("uses a safe title for a pasted id and rejects a title-only video", () => {
  assert.equal(createQuickLesson({ videoId: "video-id" }, () => "id").title, "Bài học video");
  assert.equal(createQuickLesson({ title: "Chưa chọn video" }, () => "id"), null);
});

test("collects pending drafts on save without duplicating an uploaded video", () => {
  const curriculum = [{ lessons: [{ id: "old", videoId: "uploaded" }] }, { lessons: [] }];
  const result = mergeQuickLessonDrafts(curriculum, [
    { sectionIndex: 0, title: "Duplicate", videoId: "uploaded", videoProvider: "bunny" },
    { sectionIndex: 1, title: "Pending", videoId: "new-video", videoProvider: "bunny" },
  ], () => "new-id");
  assert.equal(result.curriculum[0].lessons.length, 1);
  assert.equal(result.curriculum[1].lessons[0].id, "new-id");
  assert.equal(result.added.length, 1);
  assert.deepEqual(curriculum[1].lessons, []);
});

test("allows article drafts but reports incomplete video drafts", () => {
  const result = mergeQuickLessonDrafts([{ lessons: [] }, { lessons: [] }], [
    { sectionIndex: 0, title: "Bài đọc", contentType: "article" },
    { sectionIndex: 1, title: "Video đang nhập", contentType: "video" },
  ], () => "id");
  assert.equal(result.curriculum[0].lessons[0].contentType, "article");
  assert.deepEqual(result.incomplete, [1]);
});

test("pending save keeps lesson guidance for every content type", () => {
  const result = mergeQuickLessonDrafts([{ lessons: [] }, { lessons: [] }], [
    { sectionIndex: 0, title: "Video", videoId: "video", description: "Hướng dẫn video" },
    { sectionIndex: 1, title: "Bài đọc", contentType: "article", description: "Hướng dẫn bài đọc" },
  ], () => "id");
  assert.deepEqual(result.curriculum.map((section) => section.lessons[0].description), ["Hướng dẫn video", "Hướng dẫn bài đọc"]);
});
