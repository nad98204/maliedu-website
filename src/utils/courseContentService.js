import { doc, getDoc } from "firebase/firestore";
import {
  COURSE_CONTENT_COLLECTION,
  mergeCourseWithContent,
} from "./courseDataPrivacy";

export const getPrivateCourseContent = async (db, courseId) => {
  if (!courseId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, COURSE_CONTENT_COLLECTION, courseId));
  return snapshot.exists() ? snapshot.data() : null;
};

export const loadFullCourse = async (db, publicCourse) => {
  const privateCourse = await getPrivateCourseContent(db, publicCourse?.id);
  return mergeCourseWithContent(publicCourse, privateCourse);
};
