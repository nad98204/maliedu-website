import test from "node:test";
import assert from "node:assert/strict";
import { getCourseInstructors, syncCourseInstructors, getLinkedCourseInstructors, enrichCourseInstructors, getInstructorCoursePatch, getCourseInstructorBadge } from "../src/utils/courseInstructors.js";
import { splitCourseForStorage } from "../src/utils/courseDataPrivacy.js";

const first = { id: "teacher-1", name: "Nguyễn An", title: "Coach", avatar: "https://cdn.example.com/an.jpg", bio: "Tiểu sử An" };
const second = { id: "teacher-2", name: "Trần Bình", title: "Mentor", avatar: "https://cdn.example.com/binh.jpg", bio: "Tiểu sử Bình" };

test("upgrades all legacy instructor fields including authorId", () => {
  assert.deepEqual(getCourseInstructors({
    authorId: first.id, instructorName: first.name, instructorTitle: first.title,
    instructorImageUrl: first.avatar, instructorBio: first.bio,
  }), [{ ...first, isPrimary: true }]);
});

test("the first row is primary and synchronizes every legacy field", () => {
  const course = syncCourseInstructors({ instructors: [{ ...first, isPrimary: false }, { ...second, isPrimary: true }] });
  assert.equal(course.authorId, first.id);
  assert.equal(course.instructorName, first.name);
  assert.equal(course.instructorTitle, first.title);
  assert.equal(course.instructorImageUrl, first.avatar);
  assert.equal(course.instructorBio, first.bio);
  assert.deepEqual(course.instructors.map((row) => row.isPrimary), [true, false]);
  assert.deepEqual(course.instructorIds, [first.id, second.id]);
});

test("reordering and removing the first instructor updates legacy metadata", () => {
  const initial = syncCourseInstructors({ instructors: [first, second] });
  const reordered = syncCourseInstructors({ ...initial, instructors: [second, first] });
  assert.equal(reordered.authorId, second.id);
  const removed = syncCourseInstructors({ ...initial, instructors: [second] });
  assert.equal(removed.instructorName, second.name);
  assert.deepEqual(removed.instructorIds, [second.id]);
});

test("manual instructors clear stale IDs and editor-only fields are never saved", () => {
  const course = syncCourseInstructors({
    authorId: "old-author", instructorName: "Old teacher",
    instructors: [{ name: "  Chuyên gia mới  ", avatar: "", title: "", bio: "", _key: "local-key" }],
  });
  assert.equal(course.authorId, "");
  assert.equal(course.instructorName, "Chuyên gia mới");
  assert.equal(course.instructorImageUrl, "");
  assert.equal("_key" in course.instructors[0], false);
  assert.equal("id" in course.instructors[0], false);
});

test("explicit empty arrays clear legacy data rather than resurrecting removed teachers", () => {
  const course = syncCourseInstructors({ authorId: "old-author", instructorName: "Old", instructors: [] });
  assert.deepEqual(course.instructors, []);
  assert.equal(course.authorId, "");
  assert.equal(course.instructorName, "");
});

test("supports more than three instructors without mutating input", () => {
  const original = { instructors: [first, second, { name: "C" }, { name: "D" }, null] };
  const snapshot = structuredClone(original);
  const course = syncCourseInstructors(original);
  assert.equal(course.instructors.length, 4);
  assert.deepEqual(original, snapshot);
  assert.deepEqual(course.instructors.map((row) => row.isPrimary), [true, false, false, false]);
});

test("public course storage keeps every instructor and the compatibility fields", () => {
  const { publicCourse } = splitCourseForStorage("course-1", syncCourseInstructors({ instructors: [first, second], curriculum: [] }));
  assert.equal(publicCourse.instructors.length, 2);
  assert.equal(publicCourse.authorId, first.id);
  assert.deepEqual(publicCourse.instructorIds, [first.id, second.id]);
});

test("fresh profiles replace all public fields without changing order or primary", () => {
  const course = { instructors: [first, second, { name: "Manual", avatar: "manual.jpg" }] };
  const fresh = { ...second, name: "New name", avatar: "bunny.jpg", title: "New title", bio: "New bio" };
  const rows = enrichCourseInstructors(course, [fresh]);
  assert.deepEqual(rows[1], { ...fresh, isPrimary: false });
  assert.equal(rows[0].name, first.name);
  assert.equal(rows[2].avatar, "manual.jpg");
  assert.equal(course.instructors[1].avatar, second.avatar);
});

test("only legacy primary inherits authorId, not unlinked collaborators", () => {
  const rows = getLinkedCourseInstructors({ authorId: first.id, instructors: [{ name: "Old" }, { name: "Manual" }] });
  assert.equal(rows[0].id, first.id);
  assert.equal(rows[1].id, undefined);
});

test("missing profiles preserve snapshots and explicit empty avatars clear stale URLs", () => {
  const rows = enrichCourseInstructors({ instructors: [first, second] }, [{ id: first.id, avatar: "", bio: "" }]);
  assert.equal(rows[0].avatar, "");
  assert.equal(rows[0].bio, "");
  assert.equal(rows[0].name, first.name);
  assert.equal(rows[1].avatar, second.avatar);
});

test("legacy single-teacher patch updates bio and avatar without creating an array", () => {
  const course = { authorId: first.id, instructorName: "Old", instructorImageUrl: "old.jpg" };
  const patch = getInstructorCoursePatch(course, first.id, first);
  assert.equal(patch.instructorName, first.name);
  assert.equal(patch.instructorBio, first.bio);
  assert.equal(patch.instructorImageUrl, first.avatar);
  assert.equal("instructors" in patch, false);
});

test("collaborator patch discovers unindexed arrays and leaves legacy primary untouched", () => {
  const course = { authorId: first.id, instructorName: first.name, instructors: [first, { ...second, custom: "keep" }] };
  const patch = getInstructorCoursePatch(course, second.id, { ...second, avatar: "new.jpg", bio: "New bio" });
  assert.equal(patch.instructors[1].avatar, "new.jpg");
  assert.equal(patch.instructors[1].bio, "New bio");
  assert.equal(patch.instructors[1].custom, "keep");
  assert.deepEqual(patch.instructors[0], first);
  assert.deepEqual(patch.instructorIds, [first.id, second.id]);
  assert.equal("instructorName" in patch, false);
  assert.equal("instructorImageUrl" in patch, false);
});

test("primary patch updates array and compatibility fields, preserving extras", () => {
  const course = { authorId: first.id, instructors: [{ ...first, custom: 1 }, second], name: "Course" };
  const patch = getInstructorCoursePatch(course, first.id, { ...first, avatar: "", bio: "Updated" });
  assert.equal(patch.instructorImageUrl, "");
  assert.equal(patch.instructorBio, "Updated");
  assert.equal(patch.instructors[0].custom, 1);
  assert.equal("name" in patch, false);
  assert.equal(course.instructors[0].avatar, first.avatar);
});

test("unrelated or removed teachers do not produce writes", () => {
  assert.equal(getInstructorCoursePatch({ instructors: [second] }, first.id, first), null);
  assert.equal(getInstructorCoursePatch({ authorId: first.id, instructors: [] }, first.id, first), null);
});

test("partial legacy arrays resolve primary without replacing manual collaborators", () => {
  const course = { authorId: first.id, instructors: [{ name: "Old" }, { name: "Manual" }] };
  const patch = getInstructorCoursePatch(course, first.id, first);
  assert.equal(patch.instructors[0].id, first.id);
  assert.equal(patch.instructorName, first.name);
  assert.deepEqual(patch.instructors[1], { name: "Manual" });
});

test("badges survive normalization, saving, reordering and public storage", () => {
  const course = syncCourseInstructors({ instructors: [{ ...first, badge: "  Chuyên gia thôi miên  " }, { ...second, badge: "Cố vấn chuyên môn" }] });
  assert.equal(course.instructors[0].badge, "Chuyên gia thôi miên");
  const reordered = syncCourseInstructors({ ...course, instructors: [...course.instructors].reverse() });
  assert.equal(reordered.instructors[0].badge, "Cố vấn chuyên môn");
  assert.equal(reordered.instructors[1].badge, "Chuyên gia thôi miên");
  const { publicCourse } = splitCourseForStorage("course-badges", reordered);
  assert.equal(publicCourse.instructors[0].badge, "Cố vấn chuyên môn");
});

test("catalog enrichment and persisted sync cannot overwrite course-specific badges", () => {
  const course = { authorId: first.id, instructors: [{ ...first, badge: "Vai trò khóa A" }, { ...second, badge: "Vai trò khóa B" }] };
  const latest = { ...first, name: "Updated", badge: "Must not override" };
  assert.equal(enrichCourseInstructors(course, [latest])[0].badge, "Vai trò khóa A");
  const patch = getInstructorCoursePatch(course, first.id, latest);
  assert.equal(patch.instructors[0].badge, "Vai trò khóa A");
  assert.equal(patch.instructors[1].badge, "Vai trò khóa B");
});

test("custom badges display for primary, collaborator and single-instructor courses", () => {
  assert.equal(getCourseInstructorBadge({ badge: "Chuyên gia", isPrimary: true }, true), "Chuyên gia");
  assert.equal(getCourseInstructorBadge({ badge: "Cố vấn", isPrimary: false }, true), "Cố vấn");
  assert.equal(getCourseInstructorBadge({ badge: "Chuyên gia", isPrimary: true }, false), "Chuyên gia");
});

test("empty and missing badges retain legacy display behavior", () => {
  assert.equal(getCourseInstructorBadge({ isPrimary: true }, true), "Giảng viên chính");
  assert.equal(getCourseInstructorBadge({ badge: "  ", isPrimary: true }, true), "Giảng viên chính");
  assert.equal(getCourseInstructorBadge({ badge: "", isPrimary: false }, true), "");
  assert.equal(getCourseInstructorBadge({ isPrimary: true }, false), "");
});
