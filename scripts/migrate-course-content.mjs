import { Firestore } from "@google-cloud/firestore";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  COURSE_ACCESS_COLLECTION,
  COURSE_CONTENT_COLLECTION,
  getCourseAccessId,
  splitCourseForStorage,
} from "../src/utils/courseDataPrivacy.js";

const APPLY_CHANGES = process.argv.includes("--apply");
const COPY_ONLY = process.argv.includes("--copy-only");
const SHOW_HELP = process.argv.includes("--help") || process.argv.includes("-h");
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "maliedu-web";
const MAX_BATCH_OPERATIONS = 400;
const CLI_ACCESS_TOKEN = String(
  process.env.FIREBASE_CLI_ACCESS_TOKEN || "",
).trim();

if (SHOW_HELP) {
  console.log(`Usage: npm run migrate:course-content -- [--apply] [--copy-only]

Without --apply, the script reads Firestore and prints a dry-run summary only.
With --apply, it overwrites public course documents with sanitized metadata,
writes full lessons/resources to course_content, and backfills course_access.
With --apply --copy-only, it writes private content/access first but leaves the
legacy public course documents unchanged for a zero-downtime rollout.`);
  process.exit(0);
}

const createFirebaseCliFirestore = () => {
  const authClient = {
    getRequestHeaders: async () =>
      new Headers({
        authorization: `Bearer ${CLI_ACCESS_TOKEN}`,
      }),
  };
  const auth = {
    getClient: async () => authClient,
    getProjectId: async () => PROJECT_ID,
    getUniverseDomain: async () => "googleapis.com",
  };

  return new Firestore({ auth, projectId: PROJECT_ID });
};

let db;
if (CLI_ACCESS_TOKEN) {
  db = createFirebaseCliFirestore();
} else {
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
  db = getFirestore();
}
const [coursesSnapshot, enrollmentsSnapshot, contentSnapshot] =
  await Promise.all([
    db.collection("courses").get(),
    db.collection("enrollments").get(),
    db.collection(COURSE_CONTENT_COLLECTION).get(),
  ]);

const existingContent = new Map(
  contentSnapshot.docs.map((snapshot) => [snapshot.id, snapshot.data()]),
);
const enrollmentCounts = new Map();
const accessRecords = new Map();

enrollmentsSnapshot.docs.forEach((snapshot) => {
  const enrollment = snapshot.data();
  const { courseId, userId } = enrollment;
  const isActive = !["cancelled", "inactive", "revoked"].includes(
    enrollment.status,
  );

  if (!courseId || !isActive) {
    return;
  }

  enrollmentCounts.set(courseId, (enrollmentCounts.get(courseId) || 0) + 1);

  if (!userId) {
    return;
  }

  accessRecords.set(getCourseAccessId(userId, courseId), {
    userId,
    userEmail: enrollment.userEmail || "",
    courseId,
    enrollmentId: snapshot.id,
    orderId: enrollment.orderId || null,
    status: "active",
    grantedAt: enrollment.enrolledAt || enrollment.createdAt || Date.now(),
    migratedAt: Date.now(),
  });
});

const courseWrites = [];
let privateLessonCount = 0;
let publicPreviewCount = 0;

coursesSnapshot.docs.forEach((snapshot) => {
  const currentPublicCourse = snapshot.data();
  const currentPrivateCourse = existingContent.get(snapshot.id) || {};
  const sourceCourse = {
    ...currentPublicCourse,
    ...currentPrivateCourse,
    curriculum:
      currentPrivateCourse.curriculum || currentPublicCourse.curriculum || [],
    courseResources:
      currentPrivateCourse.courseResources ||
      currentPublicCourse.courseResources ||
      [],
  };
  const { publicCourse, privateCourse } = splitCourseForStorage(
    snapshot.id,
    sourceCourse,
  );

  publicCourse.enrollmentCount = enrollmentCounts.get(snapshot.id) || 0;
  courseWrites.push({
    courseRef: snapshot.ref,
    contentRef: db.collection(COURSE_CONTENT_COLLECTION).doc(snapshot.id),
    publicCourse,
    privateCourse,
  });

  privateLessonCount += privateCourse.curriculum.reduce(
    (total, section) => total + (section.lessons || []).length,
    0,
  );
  publicPreviewCount += publicCourse.curriculum.reduce(
    (total, section) =>
      total +
      (section.lessons || []).filter((lesson) => Boolean(lesson.videoId)).length,
    0,
  );

  (Array.isArray(currentPublicCourse.students)
    ? currentPublicCourse.students
    : []
  ).forEach((userId) => {
    const accessId = getCourseAccessId(userId, snapshot.id);
    if (!accessRecords.has(accessId)) {
      accessRecords.set(accessId, {
        userId,
        userEmail: "",
        courseId: snapshot.id,
        enrollmentId: null,
        status: "active",
        grantedAt: Date.now(),
        migratedAt: Date.now(),
        source: "legacy_course_students",
      });
    }
  });
});

console.log(
  JSON.stringify(
    {
      mode: APPLY_CHANGES
        ? COPY_ONLY
          ? "apply-copy-only"
          : "apply-and-sanitize"
        : COPY_ONLY
          ? "dry-run-copy-only"
          : "dry-run",
      projectId: PROJECT_ID,
      courses: courseWrites.length,
      enrollments: enrollmentsSnapshot.size,
      accessRecords: accessRecords.size,
      privateLessons: privateLessonCount,
      publiclyPreviewableVideos: publicPreviewCount,
    },
    null,
    2,
  ),
);

if (!APPLY_CHANGES) {
  await db.terminate();
  console.log("Dry-run complete. Re-run with --apply to write these changes.");
  process.exit(0);
}

const operations = [];
courseWrites.forEach(({ courseRef, contentRef, publicCourse, privateCourse }) => {
  operations.push((batch) => batch.set(contentRef, privateCourse));
  if (!COPY_ONLY) {
    operations.push((batch) => batch.set(courseRef, publicCourse));
  }
});
accessRecords.forEach((access, accessId) => {
  operations.push((batch) =>
    batch.set(db.collection(COURSE_ACCESS_COLLECTION).doc(accessId), access),
  );
});

let committedOperations = 0;
for (
  let startIndex = 0;
  startIndex < operations.length;
  startIndex += MAX_BATCH_OPERATIONS
) {
  const batch = db.batch();
  operations
    .slice(startIndex, startIndex + MAX_BATCH_OPERATIONS)
    .forEach((operation) => operation(batch));
  await batch.commit();
  committedOperations += Math.min(
    MAX_BATCH_OPERATIONS,
    operations.length - startIndex,
  );
  console.log(`Committed ${committedOperations}/${operations.length} writes.`);
}

console.log(
  COPY_ONLY
    ? "Private course content/access copy complete; public documents were not changed."
    : "Course privacy migration complete.",
);
await db.terminate();
