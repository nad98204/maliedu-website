import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  Edit,
  Trash2,
  Plus,
  X,
  Search,
  BookOpen,
  Filter,
  Zap,
  MapPin,
  Layers,
  Globe,
  Upload,
  Image as ImageIcon,
  Video,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Users,
  Star,
  User,
  Award,
  FileText,
  GripVertical,
  TrendingUp,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

import { db } from "../../firebase";
import RichTextEditor from "../../components/RichTextEditor";
import { uploadToCloudinary } from "../../utils/uploadService";
import { uploadFileToS3, uploadVideoToS3 } from "../../utils/s3UploadService";
import AdminCategories from "./AdminCategories";
import AdminCoupons from "./AdminCoupons";
import AdminInstructors from "./AdminInstructors"; // NEW IMPORT
import S3VideoUploader from "../../components/S3VideoUploader";

// --- CẤU HÌNH THÔNG TIN GIẢNG VIÊN MẶC ĐỊNH ---
// Anh/chị có thể sửa nội dung mặc định tại đây:
const DEFAULT_INSTRUCTOR = {
  name: "Mong Coaching",
  title: "Life Coach & Spiritual Mentor",
  bio: "Với kinh nghiệm đồng hành cùng hàng ngàn học viên, Mong Coaching sẽ giúp bạn tìm lại chính mình, chữa lành những tổn thương và kiến tạo một cuộc đời thịnh vượng, hạnh phúc từ gốc rễ.",
  studentCount: "2,500+",
  courseCount: "10+",
};
// ------------------------------------------------

const DEFAULT_SECTION_TITLE = "Nội dung khóa học";

const createLocalId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getSectionIdentifier = (section, fallbackId = "") =>
  section?.id || fallbackId;

const getLessonIdentifier = (lesson, fallbackId = "") =>
  lesson?.id || lesson?.videoId || fallbackId;

const normalizeCurriculumForForm = (curriculum = []) => {
  if (!Array.isArray(curriculum) || curriculum.length === 0) {
    return [];
  }

  const sections = curriculum[0]?.lessons
    ? curriculum
    : [{ title: DEFAULT_SECTION_TITLE, lessons: curriculum }];

  return sections.map((section, sectionIndex) => ({
    ...section,
    id: getSectionIdentifier(section, createLocalId(`section-${sectionIndex}`)),
    lessons: (section.lessons || []).map((lesson, lessonIndex) => ({
      ...lesson,
      id: getLessonIdentifier(
        lesson,
        createLocalId(`lesson-${sectionIndex}-${lessonIndex}`),
      ),
      isFreePreview: Boolean(lesson.isFreePreview),
    })),
  }));
};

const normalizeCourseResources = (courseResources = []) =>
  (Array.isArray(courseResources) ? courseResources : []).map(
    (resource, index) => {
      const linkedLessonId = resource.linkedLessonId || resource.lessonId || "";
      const linkedSectionId =
        resource.linkedSectionId || resource.sectionId || "";

      return {
        ...resource,
        id: resource.id || createLocalId(`course-resource-${index}`),
        name: resource.name || "",
        url: resource.url || "",
        linkedLessonId,
        linkedSectionId,
        sortOrder:
          typeof resource.sortOrder === "number" ? resource.sortOrder : index,
      };
    },
  );

const reindexCourseResources = (courseResources = []) =>
  courseResources.map((resource, index) => ({
    ...resource,
    sortOrder: index,
  }));

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingInstructorImage, setIsUploadingInstructorImage] =
    useState(false);
  const [toast, setToast] = useState(null);

  const [mainTab, setMainTab] = useState("courses"); // courses, categories, coupons
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [expandedLessons, setExpandedLessons] = useState({}); // Key: `${sIdx}-${lIdx}`, Value: boolean
  const [uploadTasks, setUploadTasks] = useState({}); // { 'key': { fileName, progress, status, error } }

  const handleStartUpload = async (sIdx, lIdx, file, isNew = false) => {
    if (!file) return;
    const taskKey = isNew ? `new-${sIdx}` : `${sIdx}-${lIdx}`;

    setUploadTasks(prev => ({
      ...prev,
      [taskKey]: { fileName: file.name, progress: 0, status: 'uploading' }
    }));

    try {
      const videoUrl = await uploadVideoToS3(file, (percent) => {
        setUploadTasks(prev => ({
          ...prev,
          [taskKey]: { ...prev[taskKey], progress: percent }
        }));
      });

      if (isNew) {
        const input = document.getElementById(`lesson-video-${sIdx}`);
        if (input) {
          input.value = videoUrl;
          const durInput = document.getElementById(`lesson-duration-${sIdx}`);
          if (durInput && !durInput.value) {
            fetchVideoDuration(videoUrl).then(duration => {
              if (duration) durInput.value = duration;
            });
          }
        }
      } else {
        handleUpdateLesson(sIdx, lIdx, "videoId", videoUrl);
      }

      setUploadTasks(prev => {
        const next = { ...prev };
        delete next[taskKey];
        return next;
      });
      showToast(`Tải lên "${file.name}" thành công!`, "success");
    } catch (err) {
      setUploadTasks(prev => ({
        ...prev,
        [taskKey]: { ...prev[taskKey], status: 'error', error: err.message }
      }));
      showToast(`Lỗi tải lên "${file.name}": ${err.message}`, "error");
    }
  };
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(null);
  const [draggedCourseResourceIndex, setDraggedCourseResourceIndex] =
    useState(null);
  const [draggedLessonLocation, setDraggedLessonLocation] = useState(null);
  const [lessonDropTarget, setLessonDropTarget] = useState(null);

  const getLessonExpansionKey = (lesson, sIdx, lIdx) =>
    getLessonIdentifier(lesson, `lesson-${sIdx}-${lIdx}`);

  const toggleLessonExpansion = (lesson, sIdx, lIdx) => {
    const key = getLessonExpansionKey(lesson, sIdx, lIdx);
    setExpandedLessons((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categories: [], // Array of slugs
    category: "",
    price: "",
    salePrice: "",
    thumbnailUrl: "",
    instructorImageUrl: "",
    description: "",
    content: "",
    videoId: "",
    isPublished: true,
    isForSale: true, // true = bán trên web, false = miễn phí nhưng giới hạn số video
    freeLessonsCount: 3, // Số video đầu được xem miễn phí (nếu isForSale = false)
    curriculum: [],
    courseResources: [],

    // Instructor Info
    instructorName: "",
    instructorTitle: "",
    instructorBio: "",
    instructorStudentCount: "",
    instructorCourseCount: "",

    // Fake Stats
    fakeRating: "",
    fakeReviewCount: "",
    fakeStudentCount: "",
    whatYouWillLearn: "", // New field
  });

  // Fetch courses from Firebase
  const fetchCourses = async () => {
    try {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      showToast("Không thể tải danh sách khóa học", "error");
    }
  };

  // Fetch Categories for Dropdown
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]); // NEW
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    const fetchInstructors = async () => {
      try {
        const q = query(collection(db, "instructors"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        setInstructors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching instructors:", err);
      }
    };

    fetchCategories();
    fetchInstructors();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, []);

  // -- SECTION & LESSON HANDLERS --
  const handleAddSection = (hasTitle = true) => {
    setFormData((prev) => ({
      ...prev,
      curriculum: [
        ...(prev.curriculum || []),
        {
          id: createLocalId("section"),
          title: hasTitle ? "Chương mới" : "",
          lessons: [],
        },
      ],
    }));
  };

  const handleSectionTitleChange = (sIdx, newTitle) => {
    const newCurriculum = [...formData.curriculum];
    if (newCurriculum[sIdx]) {
      newCurriculum[sIdx].title = newTitle;
      setFormData((prev) => ({ ...prev, curriculum: newCurriculum }));
    }
  };

  const handleAddLessonToSection = (sIdx, lesson) => {
    const newCurriculum = [...formData.curriculum];
    if (newCurriculum[sIdx]) {
      newCurriculum[sIdx].lessons = [
        ...(newCurriculum[sIdx].lessons || []),
        {
          ...lesson,
          id: getLessonIdentifier(lesson, createLocalId("lesson")),
          isFreePreview: false,
        },
      ];
      setFormData((prev) => ({ ...prev, curriculum: newCurriculum }));
    }
  };

  const handleRemoveLessonFromSection = (sIdx, lIdx) => {
    setFormData((prev) => {
      const newCurriculum = [...(prev.curriculum || [])];
      const lessonToRemove = newCurriculum[sIdx]?.lessons?.[lIdx];

      if (!lessonToRemove) return prev;

      const removedLessonKeys = [
        lessonToRemove.id,
        lessonToRemove.videoId,
      ].filter(Boolean);

      newCurriculum[sIdx].lessons = newCurriculum[sIdx].lessons.filter(
        (_, idx) => idx !== lIdx,
      );

      return {
        ...prev,
        curriculum: newCurriculum,
        courseResources: (prev.courseResources || []).map((resource) =>
          removedLessonKeys.includes(resource.linkedLessonId)
            ? { ...resource, linkedLessonId: "" }
            : resource,
        ),
      };
    });
  };

  const handleRemoveSection = (sIdx) => {
    setFormData((prev) => {
      const newCurriculum = [...(prev.curriculum || [])];
      const removedSection = newCurriculum[sIdx];

      if (!removedSection) return prev;

      const removedLessonKeys = (removedSection.lessons || []).flatMap(
        (lesson) => [lesson.id, lesson.videoId].filter(Boolean),
      );
      const removedSectionId = getSectionIdentifier(removedSection);

      newCurriculum.splice(sIdx, 1);

      return {
        ...prev,
        curriculum: newCurriculum,
        courseResources: (prev.courseResources || []).map((resource) =>
          removedLessonKeys.includes(resource.linkedLessonId) ||
            resource.linkedSectionId === removedSectionId
            ? { ...resource, linkedLessonId: "", linkedSectionId: "" }
            : resource,
        ),
      };
    });
  };

  const handleUpdateLesson = (sIdx, lIdx, field, value) => {
    const newCurriculum = [...formData.curriculum];
    if (newCurriculum[sIdx] && newCurriculum[sIdx].lessons[lIdx]) {
      newCurriculum[sIdx].lessons[lIdx] = {
        ...newCurriculum[sIdx].lessons[lIdx],
        [field]: value,
      };
      setFormData((prev) => ({ ...prev, curriculum: newCurriculum }));
    }
  };

  const handleAddCourseResource = () => {
    setFormData((prev) => ({
      ...prev,
      courseResources: reindexCourseResources([
        ...(prev.courseResources || []),
        {
          id: createLocalId("course-resource"),
          name: "",
          url: "",
          linkedLessonId: "",
          linkedSectionId: "",
        },
      ]),
    }));
  };

  const handleCourseResourceSectionChange = (index, sectionId) => {
    setFormData((prev) => {
      const nextResources = [...(prev.courseResources || [])];
      const currentResource = nextResources[index];

      if (!currentResource) return prev;

      const currentLessonSectionId = (prev.curriculum || []).reduce(
        (matchedSectionId, section, sectionIndex) => {
          if (matchedSectionId) return matchedSectionId;

          const normalizedSectionId = getSectionIdentifier(
            section,
            `section-${sectionIndex}`,
          );
          const hasLesson = (section.lessons || []).some((lesson) => {
            const lessonId = getLessonIdentifier(lesson);

            return (
              lessonId === currentResource.linkedLessonId ||
              lesson.videoId === currentResource.linkedLessonId
            );
          });

          return hasLesson ? normalizedSectionId : "";
        },
        "",
      );

      nextResources[index] = {
        ...currentResource,
        linkedSectionId: sectionId,
        linkedLessonId:
          sectionId && currentLessonSectionId === sectionId
            ? currentResource.linkedLessonId || ""
            : "",
      };

      return {
        ...prev,
        courseResources: nextResources,
      };
    });
  };

  const handleCourseResourceLessonChange = (index, lessonId) => {
    setFormData((prev) => {
      const nextResources = [...(prev.courseResources || [])];
      const currentResource = nextResources[index];

      if (!currentResource) return prev;

      nextResources[index] = {
        ...currentResource,
        linkedLessonId: lessonId,
      };

      return {
        ...prev,
        courseResources: nextResources,
      };
    });
  };

  const handleUpdateCourseResource = (index, field, value) => {
    const nextResources = [...(formData.courseResources || [])];

    if (!nextResources[index]) return;

    nextResources[index] = {
      ...nextResources[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      courseResources: nextResources,
    }));
  };

  const handleRemoveCourseResource = (index) => {
    setFormData((prev) => ({
      ...prev,
      courseResources: reindexCourseResources(
        (prev.courseResources || []).filter(
          (_, resourceIndex) => resourceIndex !== index,
        ),
      ),
    }));
  };

  const handleMoveCourseResource = (index, direction) => {
    setFormData((prev) => {
      const nextResources = [...(prev.courseResources || [])];
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= nextResources.length) {
        return prev;
      }

      [nextResources[index], nextResources[nextIndex]] = [
        nextResources[nextIndex],
        nextResources[index],
      ];

      return {
        ...prev,
        courseResources: reindexCourseResources(nextResources),
      };
    });
  };

  const reorderCourseResources = (fromIndex, toIndex) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= (formData.courseResources || []).length ||
      toIndex >= (formData.courseResources || []).length
    ) {
      return;
    }

    setFormData((prev) => {
      const nextResources = [...(prev.courseResources || [])];
      const [movedResource] = nextResources.splice(fromIndex, 1);
      nextResources.splice(toIndex, 0, movedResource);

      return {
        ...prev,
        courseResources: reindexCourseResources(nextResources),
      };
    });
  };

  const handleCourseResourceDragStart = (event, index) => {
    setDraggedCourseResourceIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleCourseResourceDrop = (event, targetIndex) => {
    event.preventDefault();

    const sourceIndex =
      draggedCourseResourceIndex ??
      Number.parseInt(event.dataTransfer.getData("text/plain"), 10);

    if (Number.isNaN(sourceIndex)) {
      setDraggedCourseResourceIndex(null);
      return;
    }

    reorderCourseResources(sourceIndex, targetIndex);
    setDraggedCourseResourceIndex(null);
  };

  const parseDraggedLessonLocation = (event) => {
    if (draggedLessonLocation) {
      return draggedLessonLocation;
    }

    const rawLocation =
      event.dataTransfer.getData("application/x-course-lesson") ||
      event.dataTransfer.getData("text/plain");

    if (!rawLocation) {
      return null;
    }

    try {
      const parsedLocation = JSON.parse(rawLocation);

      if (
        Number.isInteger(parsedLocation?.sIdx) &&
        Number.isInteger(parsedLocation?.lIdx)
      ) {
        return parsedLocation;
      }
    } catch (error) {
      console.error("Error parsing dragged lesson location:", error);
    }

    return null;
  };

  const moveLessonToSection = (
    fromSectionIndex,
    fromLessonIndex,
    toSectionIndex,
    toLessonIndex,
  ) => {
    setFormData((prev) => {
      const nextCurriculum = [...(prev.curriculum || [])];
      const sourceSection = nextCurriculum[fromSectionIndex];
      const targetSection = nextCurriculum[toSectionIndex];

      if (!sourceSection || !targetSection) {
        return prev;
      }

      const sourceLessons = [...(sourceSection.lessons || [])];

      if (
        fromLessonIndex < 0 ||
        fromLessonIndex >= sourceLessons.length ||
        toLessonIndex < 0
      ) {
        return prev;
      }

      const [movedLesson] = sourceLessons.splice(fromLessonIndex, 1);

      if (!movedLesson) {
        return prev;
      }

      if (fromSectionIndex === toSectionIndex) {
        const adjustedTargetIndex =
          toLessonIndex > fromLessonIndex ? toLessonIndex - 1 : toLessonIndex;
        const boundedTargetIndex = Math.min(
          Math.max(adjustedTargetIndex, 0),
          sourceLessons.length,
        );

        if (boundedTargetIndex === fromLessonIndex) {
          return prev;
        }

        sourceLessons.splice(boundedTargetIndex, 0, movedLesson);
        nextCurriculum[fromSectionIndex] = {
          ...sourceSection,
          lessons: sourceLessons,
        };

        return {
          ...prev,
          curriculum: nextCurriculum,
        };
      }

      const targetLessons = [...(targetSection.lessons || [])];
      const boundedTargetIndex = Math.min(
        Math.max(toLessonIndex, 0),
        targetLessons.length,
      );

      targetLessons.splice(boundedTargetIndex, 0, movedLesson);

      nextCurriculum[fromSectionIndex] = {
        ...sourceSection,
        lessons: sourceLessons,
      };
      nextCurriculum[toSectionIndex] = {
        ...targetSection,
        lessons: targetLessons,
      };

      const movedLessonKeys = [movedLesson.id, movedLesson.videoId].filter(
        Boolean,
      );
      const targetSectionId = getSectionIdentifier(
        nextCurriculum[toSectionIndex],
        `section-${toSectionIndex}`,
      );

      return {
        ...prev,
        curriculum: nextCurriculum,
        courseResources: (prev.courseResources || []).map((resource) =>
          movedLessonKeys.includes(resource.linkedLessonId)
            ? { ...resource, linkedSectionId: targetSectionId }
            : resource,
        ),
      };
    });
  };

  const handleLessonDragStart = (event, sIdx, lIdx) => {
    const dragLocation = { sIdx, lIdx };

    setDraggedLessonLocation(dragLocation);
    setLessonDropTarget(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/x-course-lesson",
      JSON.stringify(dragLocation),
    );
    event.dataTransfer.setData("text/plain", JSON.stringify(dragLocation));
  };

  const handleLessonDragOver = (event, sIdx, lIdx) => {
    const isLessonDragActive =
      Boolean(draggedLessonLocation) ||
      Array.from(event.dataTransfer?.types || []).includes(
        "application/x-course-lesson",
      );

    if (!isLessonDragActive) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (
      lessonDropTarget?.sIdx !== sIdx ||
      lessonDropTarget?.lIdx !== lIdx
    ) {
      setLessonDropTarget({ sIdx, lIdx });
    }
  };

  const handleLessonDrop = (event, sIdx, lIdx) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceLocation = parseDraggedLessonLocation(event);

    setDraggedLessonLocation(null);
    setLessonDropTarget(null);

    if (!sourceLocation) {
      return;
    }

    moveLessonToSection(
      sourceLocation.sIdx,
      sourceLocation.lIdx,
      sIdx,
      lIdx,
    );
  };

  const isLessonDropTarget = (sIdx, lIdx) =>
    lessonDropTarget?.sIdx === sIdx && lessonDropTarget?.lIdx === lIdx;

  const getDocumentUploadKey = (target) =>
    target.type === "lesson"
      ? `lesson-${target.sIdx}-${target.lIdx}`
      : `course-${target.index}`;

  const handleDocumentUpload = async (event, target) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    const targetKey = getDocumentUploadKey(target);

    try {
      setUploadingDocumentKey(targetKey);
      setDocumentUploadProgress(0);

      const fileUrl = await uploadFileToS3(selectedFile, (progress) => {
        setDocumentUploadProgress(progress);
      });

      if (target.type === "lesson") {
        setFormData((prev) => {
          const nextCurriculum = [...(prev.curriculum || [])];
          const lesson =
            nextCurriculum[target.sIdx]?.lessons?.[target.lIdx];

          if (!lesson) return prev;

          nextCurriculum[target.sIdx].lessons[target.lIdx] = {
            ...lesson,
            resourceLink: fileUrl,
            resourceName: lesson.resourceName || selectedFile.name,
          };

          return {
            ...prev,
            curriculum: nextCurriculum,
          };
        });
      } else {
        setFormData((prev) => {
          const nextResources = [...(prev.courseResources || [])];
          const currentResource = nextResources[target.index];

          if (!currentResource) return prev;

          nextResources[target.index] = {
            ...currentResource,
            url: fileUrl,
            name: currentResource.name || selectedFile.name,
          };

          return {
            ...prev,
            courseResources: nextResources,
          };
        });
      }

      showToast("Tải tài liệu thành công!");
    } catch (error) {
      console.error("Error uploading document:", error);
      showToast(error.message || "Không thể tải tài liệu lên", "error");
    } finally {
      setUploadingDocumentKey(null);
      setDocumentUploadProgress(null);
    }
  };

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);

  // Auto-save to LocalStorage whenever formData changes (Fast backup)
  useEffect(() => {
    if (!isFormOpen) return;
    try {
      const draftKey = editingCourse?.id ? `draft_${editingCourse.id}` : "draft_new_course";
      localStorage.setItem(draftKey, JSON.stringify(formData));
    } catch (e) {
      console.error("LocalStorage save failed", e);
    }
  }, [formData, isFormOpen, editingCourse]);

  // Debounced Auto-save to Cloud (Firestore) - every 10s of inactivity
  useEffect(() => {
    if (!isFormOpen || !editingCourse?.id || isSubmitting) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const courseData = getNormalizedCourseData(formData);
        await updateDoc(doc(db, "courses", editingCourse.id), {
          ...courseData,
          isDraft: true,
          updatedAt: Date.now(), // Consistently using Date.now()
        });
        setLastAutoSave(new Date());
      } catch (err) {
        console.error("Auto-save to cloud failed:", err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [formData, isFormOpen, editingCourse, isSubmitting]);

  const handleCloseForm = () => {
    // Check if anything major changed
    const hasManyChanges = formData.curriculum.length > 0 || formData.name !== "";
    if (hasManyChanges) {
      if (
        !window.confirm(
          "Bạn có chắc muốn đóng? Các thay đổi chưa lưu có thể bị mất (tuy nhiên bản nháp đã được lưu tự động).",
        )
      ) {
        return;
      }
    }
    setIsFormOpen(false);
  };

  const handleMoveLesson = (sIdx, lIdx, direction) => {
    setFormData((prev) => {
      const nextCurriculum = [...(prev.curriculum || [])];
      const section = nextCurriculum[sIdx];

      if (!section) {
        return prev;
      }

      const nextLessons = [...(section.lessons || [])];
      const newIndex = lIdx + direction;

      if (newIndex < 0 || newIndex >= nextLessons.length) {
        return prev;
      }

      [nextLessons[lIdx], nextLessons[newIndex]] = [
        nextLessons[newIndex],
        nextLessons[lIdx],
      ];

      nextCurriculum[sIdx] = {
        ...section,
        lessons: nextLessons,
      };

      return {
        ...prev,
        curriculum: nextCurriculum,
      };
    });
  };

  // Auto-scan video duration
  const fetchVideoDuration = (url) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = video.duration;
        if (!duration || isNaN(duration)) {
          resolve(null);
          return;
        }
        const h = Math.floor(duration / 3600);
        const m = Math.floor((duration % 3600) / 60);
        const s = Math.floor(duration % 60);
        // Format: HH:MM:SS or MM:SS
        const fmt =
          h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        resolve(fmt);
      };
      video.onerror = () => resolve(null);
      video.src = url;
    });
  };

  const handleVideoScan = async (sIdx, lIdx, url) => {
    if (!url) return;

    // Check if YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      showToast(
        "Video YouTube không hỗ trợ tự lấy thời lượng (vui lòng nhập tay)",
        "info",
      );
      return;
    }

    const duration = await fetchVideoDuration(url);
    if (duration) {
      handleUpdateLesson(sIdx, lIdx, "duration", duration);
      showToast(`Đã cập nhật thời lượng: ${duration}`);
    }
  };
  // ----------------------

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "name" && { slug: generateSlug(value) }),
    }));
  };

  // Handle Rich Text Editor change
  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleCategoryChange = (slug) => {
    setFormData((prev) => {
      const currentCategories = prev.categories || [];
      if (currentCategories.includes(slug)) {
        return {
          ...prev,
          categories: currentCategories.filter((c) => c !== slug),
        };
      } else {
        return { ...prev, categories: [...currentCategories, slug] };
      }
    });
  };

  const handleImageUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      showToast("Vui lòng chọn file ảnh hợp lệ", "error");
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadResult = await uploadToCloudinary(selectedFile);
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: uploadResult.secureUrl,
      }));
      showToast("Tải ảnh bìa thành công!");
    } catch (error) {
      console.error("Lỗi upload:", error);
      showToast("Lỗi khi tải ảnh lên", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: "" }));
  };

  const handleInstructorImageUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      showToast("Vui lòng chọn file ảnh hợp lệ", "error");
      return;
    }

    setIsUploadingInstructorImage(true);
    try {
      const uploadResult = await uploadToCloudinary(selectedFile);
      setFormData((prev) => ({
        ...prev,
        instructorImageUrl: uploadResult.secureUrl,
      }));
      showToast("Tải ảnh giảng viên thành công!");
    } catch (error) {
      console.error("Lỗi upload:", error);
      showToast("Lỗi khi tải ảnh lên", "error");
    } finally {
      setIsUploadingInstructorImage(false);
    }
  };

  const handleRemoveInstructorImage = () => {
    setFormData((prev) => ({ ...prev, instructorImageUrl: "" }));
  };

  const handleAddNew = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
      slug: "",
      categories: [], // Array of slugs
      category: "", // Legacy support
      price: "",
      salePrice: "",
      thumbnailUrl: "",
      instructorImageUrl: "",
      description: "",
      content: "",
      videoId: "",
      isPublished: true,
      isForSale: true,
      freeLessonsCount: 3,
      curriculum: [],
      courseResources: [],
      instructorName: "",
      instructorTitle: "",
      instructorBio: "",
      instructorStudentCount: "",
      instructorCourseCount: "",
      fakeRating: "",
      fakeReviewCount: "",
      fakeStudentCount: "",
      whatYouWillLearn: "",
    });
    setActiveTab("info");
    setIsFormOpen(true);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || "",
      slug: course.slug || "",
      categories:
        course.categories || (course.category ? [course.category] : []),
      category: course.category || "",
      price: course.price || "",
      salePrice: course.salePrice || "",
      thumbnailUrl: course.thumbnailUrl || "",
      instructorImageUrl: course.instructorImageUrl || "",
      description: course.description || "",
      content: course.content || "",
      videoId: course.videoId || "",
      isPublished: course.isPublished !== undefined ? course.isPublished : true,
      isForSale: course.isForSale !== undefined ? course.isForSale : true,
      freeLessonsCount: course.freeLessonsCount || 3,

      // Instructor
      instructorName: course.instructorName || "",
      instructorTitle: course.instructorTitle || "",
      instructorBio: course.instructorBio || "",
      instructorStudentCount: course.instructorStudentCount || "",
      instructorCourseCount: course.instructorCourseCount || "",

      // Stats
      fakeRating: course.fakeRating || "",
      fakeReviewCount: course.fakeReviewCount || "",
      fakeStudentCount: course.fakeStudentCount || "",
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn)
        ? course.whatYouWillLearn.join("\n")
        : course.whatYouWillLearn || "",
      courseResources: normalizeCourseResources(course.courseResources),

      curriculum: normalizeCurriculumForForm(
        course.curriculum &&
          course.curriculum.length > 0 &&
          course.curriculum[0].lessons
          ? course.curriculum
          : course.curriculum && course.curriculum.length > 0
            ? [{ title: "Nội dung khóa học", lessons: course.curriculum }]
            : []),
    });
    setActiveTab("info");
    setIsFormOpen(true);
  };

  const getNormalizedCourseData = (data) => {
    const normalizedCurriculum = normalizeCurriculumForForm(data.curriculum);
    const lessonSectionMap = normalizedCurriculum.reduce(
      (accumulator, section, sectionIndex) => {
        const sectionId = getSectionIdentifier(
          section,
          `section-${sectionIndex}`,
        );

        (section.lessons || []).forEach((lesson) => {
          if (lesson.id) {
            accumulator[lesson.id] = sectionId;
          }

          if (lesson.videoId) {
            accumulator[lesson.videoId] = sectionId;
          }
        });

        return accumulator;
      },
      {},
    );

    const validSectionIds = new Set(
      normalizedCurriculum
        .map((section) => getSectionIdentifier(section))
        .filter(Boolean),
    );

    const validLessonIds = new Set(
      normalizedCurriculum.flatMap((section) =>
        (section.lessons || []).flatMap((lesson) =>
          [lesson.id, lesson.videoId].filter(Boolean),
        ),
      ),
    );

    const normalizedCourseResources = reindexCourseResources(
      normalizeCourseResources(data.courseResources)
        .map((resource) => {
          const linkedLessonId = validLessonIds.has(resource.linkedLessonId)
            ? resource.linkedLessonId
            : "";
          const inferredSectionId = linkedLessonId
            ? lessonSectionMap[linkedLessonId] || ""
            : "";
          const linkedSectionId = validSectionIds.has(resource.linkedSectionId)
            ? resource.linkedSectionId
            : inferredSectionId;

          return {
            ...resource,
            name: resource.name?.trim() || "",
            url: resource.url?.trim() || "",
            linkedLessonId,
            linkedSectionId,
          };
        })
        .filter((resource) => resource.url),
    );

    return {
      ...data,
      slug: data.slug || generateSlug(data.name),
      categories: data.categories || [],
      category: data.categories?.length > 0 ? data.categories[0] : "",
      curriculum: normalizedCurriculum,
      whatYouWillLearn: data.whatYouWillLearn
        ? Array.isArray(data.whatYouWillLearn)
          ? data.whatYouWillLearn
          : data.whatYouWillLearn.split("\n").filter((line) => line.trim() !== "")
        : [],
      courseResources: normalizedCourseResources,
      price: data.isForSale ? Number(data.price) : 0,
      salePrice:
        data.isForSale && data.salePrice ? Number(data.salePrice) : null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const courseData = {
        ...getNormalizedCourseData(formData),
        updatedAt: Date.now(),
      };

      if (editingCourse) {
        await updateDoc(doc(db, "courses", editingCourse.id), courseData);
        showToast("Cập nhật khóa học thành công!");
      } else {
        await addDoc(collection(db, "courses"), {
          ...courseData,
          createdAt: Date.now(),
        });
        showToast("Tạo khóa học thành công!");
      }
      setIsFormOpen(false);
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      showToast("Lỗi khi lưu khóa học", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "courses", courseId));
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      showToast("Xóa khóa học thành công!");
    } catch (error) {
      console.error("Error deleting course:", error);
      showToast("Lỗi khi xóa khóa học", "error");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const sectionOptions = useMemo(
    () =>
      (formData.curriculum || []).map((section, sectionIndex) => ({
        value: getSectionIdentifier(section, `section-${sectionIndex}`),
        label: section.title
          ? `Chương ${sectionIndex + 1}: ${section.title}`
          : `Buổi học lẻ (Phần ${sectionIndex + 1})`,
      })),
    [formData.curriculum],
  );

  const lessonToSectionMap = useMemo(
    () =>
      (formData.curriculum || []).reduce((accumulator, section, sectionIndex) => {
        const sectionId = getSectionIdentifier(section, `section-${sectionIndex}`);

        (section.lessons || []).forEach((lesson) => {
          const lessonId = getLessonIdentifier(lesson);

          if (lessonId) {
            accumulator[lessonId] = sectionId;
          }

          if (lesson.videoId) {
            accumulator[lesson.videoId] = sectionId;
          }
        });

        return accumulator;
      }, {}),
    [formData.curriculum],
  );

  const lessonOptionsBySection = useMemo(
    () =>
      (formData.curriculum || []).reduce((accumulator, section, sectionIndex) => {
        const sectionId = getSectionIdentifier(section, `section-${sectionIndex}`);

        accumulator[sectionId] = (section.lessons || [])
          .map((lesson, lessonIndex) => {
            const lessonId = getLessonIdentifier(lesson);

            if (!lessonId) return null;

            return {
              value: lessonId,
              label: `Buổi ${lessonIndex + 1}: ${lesson.title || "Chưa đặt tên"}`,
            };
          })
          .filter(Boolean);

        return accumulator;
      }, {}),
    [formData.curriculum],
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 lg:px-12 lg:py-16 space-y-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Quản lý Đào tạo
            </h1>
            <p className="text-slate-500 font-medium">
              Kiểm soát nội dung, giảng viên và các chương trình ưu đãi của hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddNew}
              className="group flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-secret-wax hover:shadow-xl hover:shadow-secret-wax/20 active:scale-95 shadow-md shadow-slate-200"
            >
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              Tạo khóa học mới
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tổng khóa học', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50/50' },
            { label: 'Khóa học Online', value: courses.filter(c => c.isForSale !== false).length, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
            { label: 'Khóa học Offline', value: courses.filter(c => c.isForSale === false).length, icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50/50' },
            { label: 'Đang hoạt động', value: courses.filter(c => c.isActive !== false).length, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50/50' },
          ].map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm`}>
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar: Tabs & Search integrated */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-1.5 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <div className="flex p-1 bg-slate-50 rounded-2xl w-fit">
          {[
            { id: 'courses', label: 'Online' },
            { id: 'offline_courses', label: 'Offline' },
            { id: 'instructors', label: 'Giảng viên' },
            { id: 'categories', label: 'Chuyên mục' },
            { id: 'coupons', label: 'Mã giảm giá' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mainTab === tab.id
                  ? "bg-white text-secret-wax shadow-md shadow-slate-200/50 ring-1 ring-slate-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-2">
          {(mainTab === "courses" || mainTab === "offline_courses") && (
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-secret-wax transition-colors" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học nhanh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border-0 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-secret-wax/5 focus:bg-white focus:shadow-inner transition-all"
              />
            </div>
          )}

          <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {(mainTab === "courses" || mainTab === "offline_courses") && (
        <div className="space-y-6 animate-fade-in">
          {/* Courses Table */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Nội dung khóa học
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Chuyên mục
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Chi phí / Giá bán
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Tình trạng
                    </th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses
                    .filter(c => mainTab === 'offline_courses' ? c.isForSale === false : c.isForSale !== false)
                    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((course) => (
                      <tr key={course.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                              <img
                                src={course.thumbnailUrl || "https://via.placeholder.com/150"}
                                alt={course.name}
                                className="h-full w-full rounded-2xl object-cover shadow-sm ring-1 ring-slate-100"
                              />
                              {course.isForSale === false && (
                                <div className="absolute -top-1 -right-1 bg-sky-500 text-white p-1 rounded-full shadow-lg border-2 border-white">
                                  <Award className="h-2.5 w-2.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight group-hover:text-secret-wax transition-colors max-w-[280px]">
                                {course.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="text-[10px] font-mono text-slate-400">
                                  /{course.slug}
                                </div>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                  {course.curriculum?.length || 0} chương học
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100 uppercase tracking-tighter">
                            {course.category || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {course.isForSale !== false ? (
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-slate-900">
                                {course.salePrice
                                  ? formatPrice(course.salePrice)
                                  : formatPrice(course.price || 0)}
                              </span>
                              {course.salePrice && (
                                <span className="text-xs text-slate-400 line-through">
                                  {formatPrice(course.price || 0)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-600 text-[11px] font-bold uppercase tracking-wider border border-sky-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                              Miễn phí học thử
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={`inline-flex items-center justify-center w-fit gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border transition-all ${course.isPublished
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-rose-50 text-rose-600 border-rose-100"
                                }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${course.isPublished ? "bg-emerald-500" : "bg-rose-500"}`} />
                              {course.isPublished ? "Đang bán" : "Tạm ẩn"}
                            </span>
                            {course.isForSale === false && (
                              <span className="text-[10px] font-medium text-slate-400 italic">
                                Cần Admin cấp quyền
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(course)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                              title="Xóa khóa học"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {courses.filter(c => mainTab === 'offline_courses' ? c.isForSale === false : c.isForSale !== false).length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                            <Plus className="h-8 w-8" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">
                            Hệ thống chưa ghi nhận khóa học này.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mainTab === "categories" && <AdminCategories hideHeader={true} searchQuery={searchQuery} />}
      {mainTab === "instructors" && <AdminInstructors hideHeader={true} searchQuery={searchQuery} />}
      {mainTab === "coupons" && <AdminCoupons hideHeader={true} searchQuery={searchQuery} />}

      {/* Modal - Sophisticated White Design */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[32px] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-10 py-6 bg-white border-b border-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingCourse ? "Chỉnh sửa khóa học" : "Thiết lập khóa học mới"}
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  ID: {editingCourse?.id || 'HỆ THỐNG TỰ TẠO'}
                </p>
              </div>
              <button
                onClick={handleCloseForm}
                className="group p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
              >
                <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {/* Premium Tabs Section */}
            <div className="flex px-10 gap-10 bg-white">
              {[
                { id: 'info', label: 'Thông tin chung', icon: FileText },
                { id: 'instructor', label: 'Giảng viên & Chỉ số', icon: Users },
                { id: 'curriculum', label: `Lộ trình bài học (${formData.curriculum?.length || 0})`, icon: Video },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative py-6 flex items-center gap-2.5 text-sm font-bold transition-all ${activeTab === tab.id
                      ? "text-secret-wax"
                      : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  <tab.icon className={`w-4.5 h-4.5 transition-colors ${activeTab === tab.id ? "text-secret-wax" : "text-slate-300 group-hover:text-slate-400"}`} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-secret-wax rounded-full animate-in slide-in-from-bottom-2 duration-300" />
                  )}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-10 overflow-y-auto flex-1 custom-scrollbar space-y-8 bg-slate-50/30"
            >
              {activeTab === "info" ? (
                <div className="grid gap-10 lg:grid-cols-2">
                  {/* Left Column: Essential Info */}
                  <div className="space-y-8">
                    <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Tên khóa học <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-2xl bg-white border border-slate-100 px-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax focus:shadow-inner outline-none transition-all placeholder:text-slate-300"
                          required
                          placeholder="VD: Tự thôi miên chữa lành"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Chuyên mục <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map((cat) => (
                            <label
                              key={cat.id}
                              className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-2xl border transition-all select-none ${(formData.categories || []).includes(cat.slug)
                                  ? "bg-secret-wax/5 border-secret-wax text-secret-wax font-black"
                                  : "bg-white border-slate-100 border-dashed text-slate-500 hover:border-slate-200"
                                }`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${(formData.categories || []).includes(cat.slug)
                                  ? "border-secret-wax bg-secret-wax"
                                  : "border-slate-200 bg-white group-hover:border-slate-300"
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-white transition-transform ${(formData.categories || []).includes(cat.slug) ? "scale-100" : "scale-0"
                                  }`} />
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={(formData.categories || []).includes(cat.slug)}
                                  onChange={() => handleCategoryChange(cat.slug)}
                                />
                              </div>
                              <span className="text-xs">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                        {categories.length === 0 && (
                          <span className="text-sm text-slate-400">
                            Đang tải danh sách...
                          </span>
                        )}
                      </div>
                      {(formData.categories || []).length === 0 && (
                        <p className="text-xs text-red-500">
                          Vui lòng chọn ít nhất 1 chuyên mục
                        </p>
                      )}

                      {/* Primary Display Category Selector */}
                      {(formData.categories || []).length > 0 && (
                        <div className="mt-3">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                            Badge hiển thị trên ảnh
                          </label>
                          <select
                            value={formData.displayCategory || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                displayCategory: e.target.value,
                              }))
                            }
                            className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-secret-wax bg-white"
                          >
                            <option value="">-- Không hiển thị --</option>
                            {categories
                              .filter((cat) =>
                                (formData.categories || []).includes(cat.slug),
                              )
                              .map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Loại khóa học */}
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 bg-slate-50">
                      <input
                        type="checkbox"
                        name="isForSale"
                        checked={formData.isForSale}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-secret-wax focus:ring-secret-wax border-gray-300 rounded"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          Khóa học bán trên web
                        </div>
                        <div className="text-slate-500">
                          Bỏ tích nếu khóa học chỉ dành cho học viên đăng ký
                          online/offline (admin cấp quyền)
                        </div>
                      </div>
                    </div>

                    {/* Giá - chỉ hiển thị khi isForSale = true */}
                    {formData.isForSale && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 text-red-600">
                            Giá gốc (VND) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all font-bold text-lg"
                            required
                            placeholder="VD: 5000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 text-emerald-600">
                            Giá khuyến mãi (VND)
                          </label>
                          <input
                            type="number"
                            name="salePrice"
                            value={formData.salePrice}
                            onChange={handleInputChange}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all font-bold text-lg text-emerald-600"
                            placeholder="VD: 2999000"
                          />
                        </div>
                      </div>
                    )}

                    {!formData.isForSale && (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Khóa học miễn phí:</strong> Khóa học này vẫn
                            hiển thị trên trang bán hàng nhưng miễn phí. Học
                            viên có thể xem {formData.freeLessonsCount ?? 0}{" "}
                            video đầu tiên miễn phí, sau đó cần admin cấp quyền
                            hoặc mua để xem tiếp.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Số video miễn phí
                          </label>
                          <input
                            type="number"
                            name="freeLessonsCount"
                            value={formData.freeLessonsCount}
                            onChange={handleInputChange}
                            min="0"
                            max="10"
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                            placeholder="VD: 3"
                          />
                          <p className="text-xs text-slate-500">
                            Số lượng video đầu tiên mà học viên có thể xem miễn
                            phí (1-10)
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Mô tả chi tiết khóa học{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="bg-white rounded-lg border border-slate-200">
                        <RichTextEditor
                          value={formData.description}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: value,
                            }))
                          }
                          placeholder="Viết giới thiệu chi tiết về khóa học..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Bạn sẽ học được gì? (Mỗi dòng một ý)
                      </label>
                      <textarea
                        name="whatYouWillLearn"
                        value={formData.whatYouWillLearn}
                        onChange={handleInputChange}
                        rows="5"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                        placeholder="- Nắm vững tư duy...&#10;- Thực hành các bài tập...&#10;- Khai phá sức mạnh..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Youtube Video ID (Intro)
                      </label>
                      <div className="relative">
                        <Video className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          name="videoId"
                          value={formData.videoId}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                          placeholder="VD: dQw4w9WgXcQ"
                        />
                      </div>
                      {formData.videoId && (
                        <p className="text-xs text-green-600">
                          Đã nhập ID video
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-secret-wax focus:ring-secret-wax border-gray-300 rounded"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          Đang bán
                        </div>
                        <div className="text-slate-500">
                          Tích vào để hiển thị khóa học lên web
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Media */}
                  <div className="space-y-8">
                    <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-8">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Ảnh minh họa khóa học
                        </label>

                        <div className="grid grid-cols-1 gap-6">
                          {formData.thumbnailUrl ? (
                            <div className="relative h-56 w-full group rounded-[24px] overflow-hidden shadow-xl shadow-slate-200 ring-1 ring-slate-100">
                              <img
                                src={formData.thumbnailUrl}
                                alt="Preview"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="p-3 bg-white text-rose-600 rounded-2xl shadow-xl hover:scale-110 transition-transform"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-56 w-full rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-secret-wax transition-all cursor-pointer group">
                              {isUploadingImage ? (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-10 h-10 border-4 border-secret-wax/20 border-t-secret-wax rounded-full animate-spin" />
                                  <span className="text-sm font-bold text-secret-wax">Đang xử lý ảnh...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="p-4 rounded-3xl bg-white shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="h-8 w-8 text-slate-300 group-hover:text-secret-wax" />
                                  </div>
                                  <span className="text-sm font-bold text-slate-500 group-hover:text-secret-wax">Click để tải ảnh lên</span>
                                  <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG, WebP (16:9)</span>
                                </>
                              )}
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                            </label>
                          )}

                          <input
                            type="text"
                            name="thumbnailUrl"
                            value={formData.thumbnailUrl}
                            onChange={handleInputChange}
                            className="w-full h-11 rounded-2xl bg-slate-50/50 border border-slate-100 px-5 text-xs font-bold text-slate-500 focus:bg-white focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all placeholder:text-slate-300"
                            placeholder="Hoặc dán link ảnh trực tiếp tại đây..."
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ) : activeTab === "instructor" ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {/* Instructor Profile Card */}
                  <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 leading-tight">Hồ sơ Giảng viên</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Thông tin hiển thị trên trang khóa học</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-secret-wax transition-colors" />
                          <select
                            onChange={(e) => {
                              const instId = e.target.value;
                              if (!instId) return;
                              const inst = instructors.find(i => i.id === instId);
                              if (inst) {
                                setFormData(prev => ({
                                  ...prev,
                                  authorId: inst.id,
                                  instructorName: inst.name || "",
                                  instructorTitle: inst.title || "",
                                  instructorBio: inst.bio || "",
                                  instructorImageUrl: inst.avatar || "",
                                }));
                              }
                            }}
                            className="pl-9 pr-8 py-2.5 rounded-2xl bg-slate-50 border-0 text-sm font-bold text-slate-600 focus:bg-white focus:ring-4 focus:ring-secret-wax/5 outline-none transition-all cursor-pointer appearance-none"
                          >
                            <option value="">Chọn nhanh giảng viên...</option>
                            {instructors.map((inst) => (
                              <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            instructorName: DEFAULT_INSTRUCTOR.name,
                            instructorTitle: DEFAULT_INSTRUCTOR.title,
                            instructorBio: DEFAULT_INSTRUCTOR.bio,
                            instructorStudentCount: DEFAULT_INSTRUCTOR.studentCount,
                            instructorCourseCount: DEFAULT_INSTRUCTOR.courseCount,
                          }))}
                          className="px-4 py-2.5 rounded-2xl border border-dashed border-slate-200 text-[11px] font-black text-slate-500 hover:text-secret-wax hover:border-secret-wax transition-all uppercase tracking-tight"
                        >
                          Dùng mặc định
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="space-y-2.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tên chuyên gia</label>
                          <input
                            type="text"
                            name="instructorName"
                            value={formData.instructorName}
                            onChange={handleInputChange}
                            className="w-full h-11 rounded-2xl bg-white border border-slate-100 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all"
                            placeholder="VD: Mong Coaching"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Danh xưng / Học vị</label>
                          <input
                            type="text"
                            name="instructorTitle"
                            value={formData.instructorTitle}
                            onChange={handleInputChange}
                            className="w-full h-11 rounded-2xl bg-white border border-slate-100 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all"
                            placeholder="VD: Life Coach & Spiritual Mentor"
                          />
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ảnh đại diện Giảng viên</label>
                          <div className="flex items-center gap-4">
                            {formData.instructorImageUrl ? (
                              <div className="relative h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-slate-100">
                                <img src={formData.instructorImageUrl} alt="Instructor" className="w-full h-full object-cover" />
                                <button type="button" onClick={handleRemoveInstructorImage} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                {isUploadingInstructorImage ? (
                                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-200" />
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleInstructorImageUpload} disabled={isUploadingInstructorImage} />
                              </label>
                            )}
                            <input
                              type="text"
                              name="instructorImageUrl"
                              value={formData.instructorImageUrl}
                              onChange={handleInputChange}
                              className="flex-1 h-11 rounded-2xl bg-slate-50 px-4 text-xs font-bold text-slate-500 focus:bg-white focus:ring-4 focus:ring-secret-wax/5 outline-none transition-all"
                              placeholder="Dán URL ảnh đại diện..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tiểu sử ngắn</label>
                        <textarea
                          name="instructorBio"
                          value={formData.instructorBio}
                          onChange={handleInputChange}
                          rows="6"
                          className="w-full rounded-2xl bg-white border border-slate-100 p-4 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all leading-relaxed"
                          placeholder="Mô tả tóm tắt kinh nghiệm giảng viên..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metrics Card */}
                  <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">Chỉ số & Đánh giá</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Các thông số niềm tin hiển thị tại Landing Page</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { label: 'Số học viên', name: 'fakeStudentCount', color: 'text-blue-600', icon: Users },
                        { label: 'Số sao đánh giá', name: 'fakeRating', color: 'text-amber-600', icon: Star },
                        { label: 'Lượt đánh giá', name: 'fakeReviewCount', color: 'text-purple-600', icon: MessageSquare },
                      ].map((field) => (
                        <div key={field.name} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 transition-all focus-within:bg-white focus-within:shadow-xl focus-within:shadow-slate-200/5 focus-within:-translate-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                            <field.icon className="w-3 h-3" />
                            {field.label}
                          </label>
                          <input
                            type="text"
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleInputChange}
                            className={`w-full bg-transparent border-none p-0 text-2xl font-black ${field.color} focus:ring-0 outline-none`}
                            placeholder="VD: 5,000+"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {/* Curriculum Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
                        <Video className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">Lộ trình bài học</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Xây dựng cấu trúc khóa học của bạn</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleAddSection(false)}
                        className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-600 hover:border-secret-wax hover:text-secret-wax transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Bài học lẻ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSection(true)}
                        className="px-5 py-2.5 rounded-2xl bg-secret-wax text-white text-sm font-black hover:bg-secret-ink transition-all flex items-center gap-2 shadow-lg shadow-secret-wax/20"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm chương mới
                      </button>
                    </div>
                  </div>

                  {formData.curriculum && formData.curriculum.length > 0 ? (
                    <div className="space-y-10 pb-10">
                      {formData.curriculum.map((section, sIdx) => (
                        <div key={sIdx} className="group/section rounded-[40px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 overflow-hidden">
                          {/* Section Header */}
                          <div className="p-8 pb-6 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4 flex-1">
                              {section.title ? (
                                <>
                                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {String(sIdx + 1).padStart(2, '0')}
                                  </div>
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                                    placeholder="Tên chương học..."
                                    className="flex-1 bg-transparent border-0 text-xl font-black text-slate-900 focus:ring-0 placeholder:text-slate-300"
                                  />
                                </>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">Không phân chương</div>
                                  <button type="button" onClick={() => handleSectionTitleChange(sIdx, "Chương mới")} className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest">+ Đặt tên chương</button>
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={() => handleRemoveSection(sIdx)} className="p-3 rounded-2xl bg-rose-50/50 text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all ml-4">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Quick Add Lesson for Section */}
                          <div className="px-8 py-6 bg-slate-50/50 border-y border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Tên bài học</label>
                                <input
                                  type="text"
                                  placeholder="VD: Giới thiệu khóa học..."
                                  className="w-full h-11 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-bold focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all"
                                  id={`lesson-title-${sIdx}`}
                                />
                              </div>
                              <div className="md:col-span-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Video ID</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="ID/Link..."
                                    className="flex-1 h-11 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-bold focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all"
                                    id={`lesson-video-${sIdx}`}
                                  />
                                  <label className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-secret-wax hover:border-secret-wax cursor-pointer transition-all">
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="video/*"
                                      onChange={(e) => handleStartUpload(sIdx, null, e.target.files[0], true)}
                                    />
                                    {uploadTasks[`new-${sIdx}`] ? (
                                      <div className="w-5 h-5 border-2 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4" />
                                    )}
                                  </label>
                                </div>
                              </div>
                              {uploadTasks[`new-${sIdx}`] && (
                                <div className="md:col-span-12">
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-secret-wax h-full transition-all duration-300"
                                      style={{ width: `${uploadTasks[`new-${sIdx}`].progress || 0}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] font-bold text-secret-wax mt-1 uppercase tracking-widest">
                                    Đang tải lên: {uploadTasks[`new-${sIdx}`].progress || 0}%
                                  </p>
                                </div>
                              )}
                              <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Thời lượng</label>
                                <input
                                  type="text"
                                  placeholder="Phút..."
                                  className="w-full h-11 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-bold focus:ring-4 focus:ring-secret-wax/5 focus:border-secret-wax outline-none transition-all"
                                  id={`lesson-duration-${sIdx}`}
                                />
                              </div>
                              <div className="md:col-span-1 flex items-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const t = document.getElementById(`lesson-title-${sIdx}`);
                                    const v = document.getElementById(`lesson-video-${sIdx}`);
                                    const d = document.getElementById(`lesson-duration-${sIdx}`);
                                    if (t.value && v.value) {
                                      handleAddLessonToSection(sIdx, { title: t.value, videoId: v.value, duration: d.value });
                                      t.value = ""; v.value = ""; d.value = "";
                                    } else {
                                      showToast("Vui lòng nhập tên và video", "error");
                                    }
                                  }}
                                  className="w-full h-11 bg-secret-wax text-white rounded-2xl flex items-center justify-center hover:bg-secret-ink shadow-lg shadow-secret-wax/20 transition-all"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Lessons List in Section */}
                          <div className="p-4 space-y-3">
                            {(section.lessons || []).map((lesson, lIdx) => {
                              const expKey = getLessonExpansionKey(lesson, sIdx, lIdx);
                              const isExp = Boolean(expandedLessons[expKey]);

                              return (
                                <div key={lesson.id || lIdx} className="rounded-3xl border border-slate-50 bg-white hover:border-slate-200 transition-all overflow-hidden">
                                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">
                                        {lIdx + 1}
                                      </div>
                                      <input
                                        type="text"
                                        value={lesson.title}
                                        onChange={(e) => handleUpdateLesson(sIdx, lIdx, "title", e.target.value)}
                                        className="flex-1 bg-transparent border-0 text-sm font-bold text-slate-700 focus:ring-0"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className="relative group/vid flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={lesson.videoId}
                                          onChange={(e) => handleUpdateLesson(sIdx, lIdx, "videoId", e.target.value)}
                                          className="w-32 bg-slate-50 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 border-0 focus:ring-2 focus:ring-secret-wax/20 outline-none"
                                          placeholder="Video ID"
                                        />
                                        <label className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-secret-wax hover:bg-white transition-all cursor-pointer">
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="video/*"
                                            onChange={(e) => handleStartUpload(sIdx, lIdx, e.target.files[0], false)}
                                          />
                                          {uploadTasks[`${sIdx}-${lIdx}`] ? (
                                            <div className="w-4 h-4 border-2 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin" />
                                          ) : (
                                            <Upload className="w-4 h-4" />
                                          )}
                                        </label>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleLessonExpansion(lesson, sIdx, lIdx)}
                                        className={`p-2 rounded-xl transition-all ${isExp ? 'bg-secret-wax text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLessonFromSection(sIdx, lIdx)}
                                        className="p-2 rounded-xl bg-rose-50 text-rose-300 hover:text-rose-500 transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {uploadTasks[`${sIdx}-${lIdx}`] && (
                                    <div className="px-6 py-2 border-t border-slate-50 bg-slate-50/20">
                                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                        <div
                                          className="bg-secret-wax h-full transition-all duration-300"
                                          style={{ width: `${uploadTasks[`${sIdx}-${lIdx}`].progress || 0}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                        <p className="text-[9px] font-bold text-secret-wax uppercase tracking-tight">
                                          Tải lên bài học: {uploadTasks[`${sIdx}-${lIdx}`].progress || 0}%
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400">
                                          {uploadTasks[`${sIdx}-${lIdx}`].fileName}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {isExp && (
                                    <div className="px-6 pb-6 pt-2 grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả bài giảng</label>
                                        <textarea
                                          value={lesson.description || ""}
                                          onChange={(e) => handleUpdateLesson(sIdx, lIdx, "description", e.target.value)}
                                          className="w-full h-24 rounded-2xl bg-slate-50 border-0 p-4 text-xs font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-secret-wax/5 outline-none transition-all"
                                          placeholder="Tóm tắt nội dung bài học..."
                                        />
                                      </div>
                                      <div className="space-y-6">
                                        <div className="space-y-3">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài liệu đính kèm</label>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={lesson.resourceLink || ""}
                                              onChange={(e) => handleUpdateLesson(sIdx, lIdx, "resourceLink", e.target.value)}
                                              className="flex-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 border-0"
                                              placeholder="Link URL tài liệu..."
                                            />
                                            <label className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-secret-wax hover:text-white cursor-pointer transition-all">
                                              <input type="file" className="hidden" onChange={(e) => handleDocumentUpload(e, { type: "lesson", sIdx, lIdx })} />
                                              <Upload className="w-4 h-4" />
                                            </label>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                                          <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${lesson.isFreePreview ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-300'}`}>
                                              <Eye className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <div className="text-xs font-black text-indigo-900">Cho phép học thử</div>
                                              <div className="text-[10px] text-indigo-500 font-medium">Học viên có thể xem không cần mua</div>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateLesson(sIdx, lIdx, "isFreePreview", !lesson.isFreePreview)}
                                            className={`w-10 h-5 rounded-full transition-all relative ${lesson.isFreePreview ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                          >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${lesson.isFreePreview ? 'right-1' : 'left-1'}`} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {(section.lessons || []).length === 0 && (
                              <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Chưa có bài học</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 border-dashed">
                      <div className="p-6 rounded-3xl bg-slate-50 text-slate-200 mb-4">
                        <Layers className="w-12 h-12" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900">Chưa có lộ trình đào tạo</h4>
                      <p className="text-sm text-slate-400 mt-1">Bắt đầu bằng cách thêm chương học hoặc bài giảng lẻ</p>
                    </div>
                  )}

                  {/* Course Resources Section */}
                  <div className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 leading-tight">Tài liệu của khóa</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý các file đính kèm chung cho toàn bộ khóa học</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCourseResource}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm tài liệu mới
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {(formData.courseResources || []).map((resource, idx) => (
                        <div key={resource.id || idx} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-wrap md:flex-nowrap items-center gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={resource.name || ""}
                              onChange={(e) => handleUpdateCourseResource(idx, "name", e.target.value)}
                              placeholder="Tên tài liệu..."
                              className="w-full h-11 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-bold focus:ring-4 focus:ring-secret-wax/5 outline-none transition-all"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={resource.url || ""}
                                onChange={(e) => handleUpdateCourseResource(idx, "url", e.target.value)}
                                placeholder="Link URL..."
                                className="flex-1 h-11 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-bold focus:ring-4 focus:ring-secret-wax/5 outline-none transition-all"
                              />
                              <label className="h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 cursor-pointer transition-all">
                                <input type="file" className="hidden" onChange={(e) => handleDocumentUpload(e, { type: "course", index: idx })} disabled={uploadingDocumentKey === `course-${idx}`} />
                                {uploadingDocumentKey === `course-${idx}` ? (
                                  <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                              </label>
                            </div>
                          </div>
                          {uploadingDocumentKey === `course-${idx}` && (
                            <div className="w-full md:absolute md:bottom-2 md:left-4 md:right-16 mt-2 md:mt-0">
                              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-300"
                                  style={{ width: `${documentUploadProgress || 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCourseResource(idx)}
                            className="p-3 rounded-2xl bg-rose-50 text-rose-300 hover:text-rose-600 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}

                      {(formData.courseResources || []).length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Nên đính kèm tài liệu học tập để tăng trải nghiệm</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-end gap-4 rounded-b-[40px]">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-8 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-10 py-3.5 rounded-2xl bg-secret-wax text-white text-sm font-black hover:bg-secret-ink transition-all shadow-xl shadow-secret-wax/20 flex items-center gap-2 group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    Lưu khóa học
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
