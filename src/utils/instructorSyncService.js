import { collection, doc, getDoc, getDocs, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { enrichCourseInstructors, getLinkedCourseInstructors, getInstructorCoursePatch } from "./courseInstructors";

export const loadLatestCourseInstructors = async (course) => {
  const ids = [...new Set(getLinkedCourseInstructors(course).map((row) => row.id).filter(Boolean))];
  const profiles = await Promise.all(ids.map(async (id) => {
    try {
      const snapshot = await getDoc(doc(db, "instructors", id));
      return snapshot.exists() ? { ...snapshot.data(), id } : null;
    } catch (error) {
      console.warn("Không thể lấy hồ sơ giảng viên mới nhất:", id, error);
      return null;
    }
  }));
  return enrichCourseInstructors(course, profiles.filter(Boolean));
};

export const syncInstructorToCourses = async (instructorId) => {
  // Include historical arrays without instructorIds, which array-contains cannot find.
  const snapshot = await getDocs(collection(db, "courses"));
  const related = snapshot.docs.filter((item) =>
    getLinkedCourseInstructors(item.data()).some((row) => row.id === instructorId)
  );
  let updated = 0;
  const failed = [];
  // Small transaction groups avoid the 500-write batch limit and stale snapshot writes.
  for (let offset = 0; offset < related.length; offset += 10) {
    await Promise.all(related.slice(offset, offset + 10).map(async (item) => {
      try {
        const changed = await runTransaction(db, async (transaction) => {
          const profile = await transaction.get(doc(db, "instructors", instructorId));
          const current = await transaction.get(item.ref);
          if (!profile.exists() || !current.exists()) return false;
          const patch = getInstructorCoursePatch(current.data(), instructorId, profile.data());
          if (!patch) return false; // Instructor may have been removed since discovery.
          transaction.update(item.ref, { ...patch, updatedAt: Date.now() });
          return true;
        });
        if (changed) updated += 1;
      } catch (error) {
        console.error("Không thể đồng bộ giảng viên vào khóa học:", item.id, error);
        failed.push(item.id);
      }
    }));
  }
  return { updated, failed };
};
