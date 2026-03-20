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
} from "lucide-react";

import { db } from "../../firebase";
import RichTextEditor from "../../components/RichTextEditor";
import { uploadToCloudinary } from "../../utils/uploadService";
import { uploadFileToS3 } from "../../utils/s3UploadService";
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
  const [activeTab, setActiveTab] = useState("info");
  const [expandedLessons, setExpandedLessons] = useState({}); // Key: `${sIdx}-${lIdx}`, Value: boolean
  const [uploadingTo, setUploadingTo] = useState(null);
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
  const handleAddSection = () => {
    setFormData((prev) => ({
      ...prev,
      curriculum: [
        ...(prev.curriculum || []),
        {
          id: createLocalId("section"),
          title: "Chương mới",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const normalizedCurriculum = normalizeCurriculumForForm(
        formData.curriculum,
      );
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
        normalizeCourseResources(formData.courseResources)
          .map((resource) => {
            const linkedLessonId = validLessonIds.has(resource.linkedLessonId)
              ? resource.linkedLessonId
              : "";
            const inferredSectionId = linkedLessonId
              ? lessonSectionMap[linkedLessonId] || ""
              : "";
            const linkedSectionId =
              validSectionIds.has(resource.linkedSectionId)
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

      const courseData = {
        ...formData,
        categories: formData.categories,
        category: formData.categories.length > 0 ? formData.categories[0] : "", // Backward compatibility
        curriculum: normalizedCurriculum,
        whatYouWillLearn: formData.whatYouWillLearn
          ? formData.whatYouWillLearn
              .split("\n")
              .filter((line) => line.trim() !== "")
          : [],
        courseResources: normalizedCourseResources,
        price: formData.isForSale ? Number(formData.price) : 0,
        salePrice:
          formData.isForSale && formData.salePrice
            ? Number(formData.salePrice)
            : null,
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
        label: `Chương ${sectionIndex + 1}: ${section.title || "Chưa đặt tên"}`,
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
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Header with Tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý Đào tạo
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý khóa học, chuyên mục và chương trình khuyến mãi
            </p>
          </div>
          {(mainTab === "courses" || mainTab === "offline_courses") && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink"
            >
              <Plus className="h-4 w-4" /> Thêm khóa học
            </button>
          )}
        </div>

        {/* Main Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setMainTab("courses")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mainTab === "courses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Khóa học Online
          </button>
          <button
            onClick={() => setMainTab("offline_courses")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mainTab === "offline_courses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Khóa học Offline
          </button>
          <button
            onClick={() => setMainTab("instructors")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mainTab === "instructors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Giảng viên
          </button>
          <button
            onClick={() => setMainTab("categories")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mainTab === "categories" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Chuyên mục
          </button>
          <button
            onClick={() => setMainTab("coupons")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mainTab === "coupons" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Mã giảm giá
          </button>
        </div>
      </div>

      {/* Content Area */}
      {(mainTab === "courses" || mainTab === "offline_courses") && (
        <div className="space-y-6 animate-fade-in">
          {/* Courses Table */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ảnh
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Tên khóa học
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Giá bán
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Trạng thái
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.filter(c => mainTab === 'offline_courses' ? c.isForSale === false : c.isForSale !== false).map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        <img
                          src={
                            course.thumbnailUrl ||
                            "https://via.placeholder.com/150"
                          }
                          alt={course.name}
                          className="h-12 w-20 rounded-lg object-cover"
                        />
                      </td>
                      <td className="py-4">
                        <div className="font-medium text-slate-900">
                          {course.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          /{course.slug}
                        </div>
                      </td>
                      <td className="py-4">
                        {course.isForSale !== false ? (
                          <>
                            <div className="text-sm font-bold text-red-600">
                              {course.salePrice
                                ? formatPrice(course.salePrice)
                                : formatPrice(course.price || 0)}
                            </div>
                            {course.salePrice && (
                              <div className="text-xs text-slate-400 line-through">
                                {formatPrice(course.price || 0)}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Miễn phí (Admin cấp quyền)
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {course.isPublished ? "Đang bán" : "Tạm ẩn"}
                          </span>
                          {course.isForSale === false && (
                            <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                              Chỉ admin cấp quyền
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {courses.filter(c => mainTab === 'offline_courses' ? c.isForSale === false : c.isForSale !== false).length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-12 text-center text-sm text-slate-500"
                      >
                        Chưa có khóa học nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mainTab === "categories" && <AdminCategories />}
      {mainTab === "instructors" && <AdminInstructors />}
      {mainTab === "coupons" && <AdminCoupons />}

      {/* Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCourse ? "Sửa khóa học" : "Thêm khóa học mới"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "info" ? "border-secret-wax text-secret-wax" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveTab("instructor")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "instructor" ? "border-secret-wax text-secret-wax" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Giảng viên & Chỉ số
              </button>
              <button
                onClick={() => setActiveTab("curriculum")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "curriculum" ? "border-secret-wax text-secret-wax" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Lộ trình bài học ({formData.curriculum?.length || 0})
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto flex-1"
            >
              {activeTab === "info" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left: Info */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Tên khóa học <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                        required
                        placeholder="Nhập tên khóa học..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Chuyên mục <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 min-h-[50px]">
                        {categories.map((cat) => (
                          <label
                            key={cat.id}
                            className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border hover:border-secret-wax transition-colors select-none"
                          >
                            <input
                              type="checkbox"
                              checked={(formData.categories || []).includes(
                                cat.slug,
                              )}
                              onChange={() => handleCategoryChange(cat.slug)}
                              className="h-4 w-4 text-secret-wax focus:ring-secret-wax border-gray-300 rounded"
                            />
                            <span className="text-sm text-slate-700 font-medium">
                              {cat.name}
                            </span>
                          </label>
                        ))}
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
                          <label className="text-sm font-medium text-slate-700">
                            Giá gốc (VND){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                            required
                            placeholder="VD: 5000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Giá khuyến mãi (VND)
                          </label>
                          <input
                            type="number"
                            name="salePrice"
                            value={formData.salePrice}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
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
                            viên có thể xem {formData.freeLessonsCount || 3}{" "}
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
                            min="1"
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

                  {/* Right: Media & Content */}
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">
                        Ảnh bìa khóa học
                      </label>

                      {/* Upload / URL Input */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition relative">
                          {isUploadingImage ? (
                            <div className="text-center">
                              <div className="w-6 h-6 border-2 border-secret-wax border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                              <span className="text-xs">Đang tải...</span>
                            </div>
                          ) : (
                            <label className="cursor-pointer text-center">
                              <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                              <span className="mt-2 block text-sm font-medium text-secret-wax">
                                Tải ảnh lên
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </label>
                          )}
                        </div>
                        <input
                          type="text"
                          name="thumbnailUrl"
                          value={formData.thumbnailUrl}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                          placeholder="Hoặc dán URL ảnh..."
                        />
                      </div>

                      {formData.thumbnailUrl && (
                        <div className="relative h-40 w-full overflow-hidden rounded-lg border border-slate-200">
                          <img
                            src={formData.thumbnailUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-red-600 shadow-sm hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Nội dung giới thiệu chi tiết
                      </label>
                      <div className="h-96 overflow-y-auto rounded-lg border border-slate-200">
                        <RichTextEditor
                          value={formData.content}
                          onChange={handleContentChange}
                          placeholder="Nội dung chi tiết của khóa học..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "instructor" ? (
                <div className="space-y-8">
                  {/* Instructor Info */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <User className="w-6 h-6 text-secret-wax" />
                        <h3 className="text-lg font-bold text-slate-800">
                          Thông tin Giảng viên
                        </h3>

                        <select
                          onChange={(e) => {
                            const instId = e.target.value;
                            if (!instId) return;
                            const inst = instructors.find(
                              (i) => i.id === instId,
                            );
                            if (inst) {
                              setFormData((prev) => ({
                                ...prev,
                                authorId: inst.id, // Store ID
                                instructorName: inst.name || "",
                                instructorTitle: inst.title || "",
                                instructorBio: inst.bio || "",
                                instructorImageUrl: inst.avatar || "",
                              }));
                            }
                          }}
                          className="ml-2 text-sm border border-slate-300 rounded-lg px-2 py-1 outline-none focus:border-secret-wax max-w-[200px]"
                        >
                          <option value="">-- Chọn nhanh --</option>
                          {instructors.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            instructorName: DEFAULT_INSTRUCTOR.name,
                            instructorTitle: DEFAULT_INSTRUCTOR.title,
                            instructorBio: DEFAULT_INSTRUCTOR.bio,
                            instructorStudentCount:
                              DEFAULT_INSTRUCTOR.studentCount,
                            instructorCourseCount:
                              DEFAULT_INSTRUCTOR.courseCount,
                          }))
                        }
                        className="text-xs flex items-center gap-1 bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-secret-wax transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        Điền thông tin mặc định
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Tên giảng viên
                          </label>
                          <input
                            type="text"
                            name="instructorName"
                            value={formData.instructorName}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-secret-wax"
                            placeholder="VD: Mong Coaching"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Danh xưng / Chức danh
                          </label>
                          <input
                            type="text"
                            name="instructorTitle"
                            value={formData.instructorTitle}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-secret-wax"
                            placeholder="VD: Life Coach & Spiritual Mentor"
                          />
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Ảnh đại diện
                          </label>

                          {/* Moved Uploader Here */}
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition relative">
                              {isUploadingInstructorImage ? (
                                <div className="text-center">
                                  <div className="w-6 h-6 border-2 border-secret-wax border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <span className="text-xs">Đang tải...</span>
                                </div>
                              ) : (
                                <label className="cursor-pointer text-center">
                                  <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                                  <span className="mt-2 block text-sm font-medium text-secret-wax">
                                    Tải ảnh
                                  </span>
                                  <input
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleInstructorImageUpload}
                                  />
                                </label>
                              )}
                            </div>
                            <input
                              type="text"
                              name="instructorImageUrl"
                              value={formData.instructorImageUrl}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none"
                              placeholder="Hoặc dán URL ảnh..."
                            />
                          </div>

                          {formData.instructorImageUrl && (
                            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 mx-auto mt-2">
                              <img
                                src={formData.instructorImageUrl}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveInstructorImage}
                                className="absolute top-0 right-0 rounded-full bg-white/90 p-1 text-red-600 shadow-sm hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Giới thiệu giảng viên (Bio)
                        </label>
                        <textarea
                          name="instructorBio"
                          value={formData.instructorBio}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-secret-wax"
                          placeholder="Mô tả về kinh nghiệm và sứ mệnh của giảng viên..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800">
                      Lộ trình học tập
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-secret-wax flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm chương mới
                    </button>
                  </div>

                  {formData.curriculum && formData.curriculum.length > 0 ? (
                    <div className="space-y-6">
                      {/* Ensure curriculum is treated as sections array */}
                      {(formData.curriculum[0]?.lessons
                        ? formData.curriculum
                        : [
                            {
                              title: "Nội dung khóa học",
                              lessons: formData.curriculum,
                            },
                          ]
                      ).map((section, sIdx) => {
                        // If we are editing, we should probably stick to one structure.
                        // For now, let's assume we convert everyone to sections on Save, or here.
                        // To avoid complex UI logic mixed with converting, let's assume `formData.curriculum` IS sections.
                        // IF it's old data (lessons array), we wrapped it in useEffect or handleEdit?
                        // Better: In handleEdit, normalize it. So here we just map sections.
                        return (
                          <div
                            key={sIdx}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                          >
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-4">
                              <span className="font-bold text-slate-500">
                                Chương {sIdx + 1}:
                              </span>
                              <input
                                type="text"
                                value={section.title || ""}
                                onChange={(e) =>
                                  handleSectionTitleChange(sIdx, e.target.value)
                                }
                                placeholder="Tên chương học..."
                                className="flex-1 bg-transparent border-none font-bold text-slate-800 focus:ring-0 placeholder:font-normal placeholder:text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(sIdx)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Add Lesson to Section */}
                            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-5">
                                  <input
                                    type="text"
                                    placeholder="Tên bài học..."
                                    className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2"
                                    id={`lesson-title-${sIdx}`}
                                  />
                                </div>
                                <div className="md:col-span-4 flex gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="Video URL / ID..."
                                    className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2"
                                    id={`lesson-video-${sIdx}`}
                                    onBlur={async (e) => {
                                      const url = e.target.value;
                                      const durInput = document.getElementById(
                                        `lesson-duration-${sIdx}`,
                                      );
                                      if (url && durInput && !durInput.value) {
                                        const duration =
                                          await fetchVideoDuration(url);
                                        if (duration) durInput.value = duration;
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setUploadingTo({ sIdx, isNew: true })
                                    }
                                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-secret-wax hover:bg-slate-50"
                                    title="Tải video lên máy chủ"
                                  >
                                    <Upload className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="md:col-span-2">
                                  <input
                                    type="text"
                                    placeholder="Phút..."
                                    className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2"
                                    id={`lesson-duration-${sIdx}`}
                                  />
                                </div>
                                <div className="md:col-span-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const titleInput =
                                        document.getElementById(
                                          `lesson-title-${sIdx}`,
                                        );
                                      const videoInput =
                                        document.getElementById(
                                          `lesson-video-${sIdx}`,
                                        );
                                      const durInput = document.getElementById(
                                        `lesson-duration-${sIdx}`,
                                      );
                                      if (
                                        titleInput.value &&
                                        videoInput.value
                                      ) {
                                        handleAddLessonToSection(sIdx, {
                                          title: titleInput.value,
                                          videoId: videoInput.value,
                                          duration: durInput.value,
                                        });
                                        titleInput.value = "";
                                        videoInput.value = "";
                                        durInput.value = "";
                                      } else {
                                        showToast(
                                          "Nhập tên và ID bài học",
                                          "error",
                                        );
                                      }
                                    }}
                                    className="w-full h-full bg-secret-wax text-white rounded-lg flex items-center justify-center hover:bg-secret-ink"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Lessons List */}
                            <div className="divide-y divide-slate-100">
                              {section.lessons &&
                                section.lessons.map((lesson, lIdx) => {
                                  const lessonExpansionKey =
                                    getLessonExpansionKey(lesson, sIdx, lIdx);
                                  const isLessonExpanded = Boolean(
                                    expandedLessons[lessonExpansionKey],
                                  );

                                  return (
                                  <div
                                    key={
                                      lesson.id ||
                                      lesson.videoId ||
                                      `lesson-${sIdx}-${lIdx}`
                                    }
                                    onDragOver={(event) =>
                                      handleLessonDragOver(event, sIdx, lIdx)
                                    }
                                    onDrop={(event) =>
                                      handleLessonDrop(event, sIdx, lIdx)
                                    }
                                    className={`p-3 flex flex-col md:flex-row md:items-start justify-between group gap-4 border-b border-slate-100 last:border-0 transition-colors ${
                                      isLessonDropTarget(sIdx, lIdx)
                                        ? "bg-orange-50"
                                        : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 flex-1">
                                      <button
                                        type="button"
                                        draggable
                                        onDragStart={(event) =>
                                          handleLessonDragStart(
                                            event,
                                            sIdx,
                                            lIdx,
                                          )
                                        }
                                        onDragEnd={() => {
                                          setDraggedLessonLocation(null);
                                          setLessonDropTarget(null);
                                        }}
                                        className="inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-secret-wax hover:text-secret-wax active:cursor-grabbing"
                                        title="Keo de di chuyen bai hoc"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </button>

                                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200 text-xs flex items-center justify-center text-slate-500 shrink-0 mt-1">
                                        {lIdx + 1}
                                      </div>

                                      <div className="flex-1 space-y-3">
                                        {/* Main Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                          <div className="md:col-span-12 flex items-center gap-2">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                                              <div className="md:col-span-6">
                                                <input
                                                  type="text"
                                                  value={lesson.title}
                                                  onChange={(e) =>
                                                    handleUpdateLesson(
                                                      sIdx,
                                                      lIdx,
                                                      "title",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full font-medium text-slate-800 text-sm bg-transparent border border-transparent hover:border-slate-300 focus:border-secret-wax focus:bg-white rounded px-2 py-1 outline-none transition-all"
                                                  placeholder="Tên bài học"
                                                />
                                              </div>
                                              <div className="md:col-span-4 flex items-center gap-1">
                                                <input
                                                  type="text"
                                                  value={lesson.videoId}
                                                  onChange={(e) =>
                                                    handleUpdateLesson(
                                                      sIdx,
                                                      lIdx,
                                                      "videoId",
                                                      e.target.value,
                                                    )
                                                  }
                                                  onBlur={(e) =>
                                                    handleVideoScan(
                                                      sIdx,
                                                      lIdx,
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full text-xs text-slate-500 bg-transparent border border-transparent hover:border-slate-300 focus:border-secret-wax focus:bg-white rounded px-2 py-1 outline-none transition-all"
                                                  placeholder="Video URL / ID"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setUploadingTo({
                                                      sIdx,
                                                      lIdx,
                                                    })
                                                  }
                                                  className="p-1 rounded text-slate-400 hover:text-secret-wax hover:bg-slate-100 shrink-0"
                                                  title="Tải video lên máy chủ"
                                                >
                                                  <Upload className="w-3 h-3" />
                                                </button>
                                              </div>
                                              <div className="md:col-span-2">
                                                <input
                                                  type="text"
                                                  value={lesson.duration}
                                                  onChange={(e) =>
                                                    handleUpdateLesson(
                                                      sIdx,
                                                      lIdx,
                                                      "duration",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full text-xs text-slate-500 bg-transparent border border-transparent hover:border-slate-300 focus:border-secret-wax focus:bg-white rounded px-2 py-1 outline-none transition-all text-center"
                                                  placeholder="Phút"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleLessonExpansion(
                                                  lesson,
                                                  sIdx,
                                                  lIdx,
                                                )
                                              }
                                              className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${isLessonExpanded ? "text-secret-wax bg-orange-50" : "text-slate-400"}`}
                                              title={
                                                isLessonExpanded
                                                  ? "Thu gọn chi tiết"
                                                  : "Mở rộng chi tiết"
                                              }
                                            >
                                              {isLessonExpanded ? (
                                                <EyeOff className="w-4 h-4" />
                                              ) : (
                                                <Edit className="w-4 h-4" />
                                              )}
                                            </button>
                                          </div>
                                        </div>

                                        {/* Details (Description & Resources) - Collapsible */}
                                        {isLessonExpanded && (
                                          <div className="bg-slate-50 rounded-lg p-3 space-y-3 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-1">
                                              <label className="text-xs font-bold text-slate-400 uppercase">
                                                Mô tả bài học
                                              </label>
                                              <textarea
                                                placeholder="Mô tả chi tiết bài học (hiện ở tab Giới thiệu trong Player)..."
                                                value={lesson.description || ""}
                                                onChange={(e) =>
                                                  handleUpdateLesson(
                                                    sIdx,
                                                    lIdx,
                                                    "description",
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-sm rounded bg-white border border-slate-200 px-3 py-2 h-16 focus:border-secret-wax outline-none"
                                              />
                                            </div>

                                            <div className="space-y-1">
                                              <label className="text-xs font-bold text-slate-400 uppercase">
                                                Tài liệu đính kèm
                                              </label>
                                              <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                                <input
                                                  type="text"
                                                  placeholder="Tên tài liệu (VD: Slide bài giảng)..."
                                                  value={
                                                    lesson.resourceName || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleUpdateLesson(
                                                      sIdx,
                                                      lIdx,
                                                      "resourceName",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full text-sm rounded bg-white border border-slate-200 px-3 py-2 focus:border-secret-wax outline-none"
                                                />
                                                <input
                                                  type="text"
                                                  placeholder="Link tài liệu (URL)..."
                                                  value={
                                                    lesson.resourceLink || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleUpdateLesson(
                                                      sIdx,
                                                      lIdx,
                                                      "resourceLink",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full text-sm rounded bg-white border border-slate-200 px-3 py-2 focus:border-secret-wax outline-none"
                                                />
                                                <label
                                                  className={`inline-flex cursor-pointer items-center justify-center rounded border border-slate-200 px-3 py-2 text-sm font-medium transition-colors ${
                                                    uploadingDocumentKey ===
                                                    `lesson-${sIdx}-${lIdx}`
                                                      ? "bg-slate-100 text-slate-500"
                                                      : "bg-white text-slate-600 hover:border-secret-wax hover:text-secret-wax"
                                                  }`}
                                                  title="Tải file tài liệu lên"
                                                >
                                                  <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,image/*"
                                                    onChange={(e) =>
                                                      handleDocumentUpload(e, {
                                                        type: "lesson",
                                                        sIdx,
                                                        lIdx,
                                                      })
                                                    }
                                                    disabled={
                                                      uploadingDocumentKey ===
                                                      `lesson-${sIdx}-${lIdx}`
                                                    }
                                                  />
                                                  {uploadingDocumentKey ===
                                                  `lesson-${sIdx}-${lIdx}` ? (
                                                    <span className="text-xs font-semibold">
                                                      {typeof documentUploadProgress ===
                                                      "number"
                                                        ? `${documentUploadProgress}%`
                                                        : "..."}
                                                    </span>
                                                  ) : (
                                                    <Upload className="h-4 w-4" />
                                                  )}
                                                </label>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0 pt-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateLesson(
                                            sIdx,
                                            lIdx,
                                            "isFreePreview",
                                            !lesson.isFreePreview,
                                          )
                                        }
                                        className={`p-1.5 rounded transition-colors ${lesson.isFreePreview ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                                        title={
                                          lesson.isFreePreview
                                            ? "Đang cho phép học thử"
                                            : "Bấm để cho phép học thử"
                                        }
                                      >
                                        {lesson.isFreePreview ? (
                                          <Eye className="w-4 h-4" />
                                        ) : (
                                          <EyeOff className="w-4 h-4" />
                                        )}
                                      </button>

                                      <div className="w-px h-4 bg-slate-200 mx-1"></div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveLesson(sIdx, lIdx, -1)
                                        }
                                        disabled={lIdx === 0}
                                        className="p-1.5 rounded text-slate-400 hover:text-secret-wax hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-400"
                                      >
                                        <ArrowUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveLesson(sIdx, lIdx, 1)
                                        }
                                        disabled={
                                          lIdx === section.lessons.length - 1
                                        }
                                        className="p-1.5 rounded text-slate-400 hover:text-secret-wax hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-400"
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </button>

                                      <div className="w-px h-4 bg-slate-200 mx-1"></div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveLessonFromSection(
                                            sIdx,
                                            lIdx,
                                          )
                                        }
                                        className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  );
                                })}
                              {draggedLessonLocation &&
                                section.lessons &&
                                section.lessons.length > 0 && (
                                  <div className="px-3 pb-3">
                                    <div
                                      onDragOver={(event) =>
                                        handleLessonDragOver(
                                          event,
                                          sIdx,
                                          section.lessons.length,
                                        )
                                      }
                                      onDrop={(event) =>
                                        handleLessonDrop(
                                          event,
                                          sIdx,
                                          section.lessons.length,
                                        )
                                      }
                                      className={`rounded-lg border border-dashed px-3 py-2 text-center text-xs transition-colors ${
                                        isLessonDropTarget(
                                          sIdx,
                                          section.lessons.length,
                                        )
                                          ? "border-secret-wax bg-orange-50 text-secret-wax"
                                          : "border-slate-200 text-slate-400"
                                      }`}
                                    >
                                      Tha bai vao cuoi chuong nay
                                    </div>
                                  </div>
                                )}
                              {(!section.lessons ||
                                section.lessons.length === 0) && (
                                <div
                                  onDragOver={(event) =>
                                    handleLessonDragOver(event, sIdx, 0)
                                  }
                                  onDrop={(event) =>
                                    handleLessonDrop(event, sIdx, 0)
                                  }
                                  className={`mx-3 my-3 rounded-lg border border-dashed p-4 text-center text-xs italic transition-colors ${
                                    isLessonDropTarget(sIdx, 0)
                                      ? "border-secret-wax bg-orange-50 text-secret-wax"
                                      : "border-slate-200 text-slate-400"
                                  }`}
                                >
                                  Chưa có bài học nào trong chương này.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                      <p className="text-slate-500 mb-2">
                        Chưa có nội dung nào.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="text-secret-wax font-bold hover:underline"
                      >
                        + Thêm chương đầu tiên
                      </button>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">
                          Tài liệu chung của khóa học
                        </h3>
                        <p className="text-sm text-slate-500">
                          Có thể để tài liệu ở mục chung, gắn theo chương,
                          hoặc gắn theo một bài học cụ thể trong chương.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCourseResource}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:text-secret-wax"
                      >
                        <Plus className="h-4 w-4" />
                        Thêm tài liệu
                      </button>
                    </div>

                    {formData.courseResources?.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {formData.courseResources.map((resource, resourceIdx) => {
                          const selectedSectionId =
                            resource.linkedSectionId ||
                            lessonToSectionMap[resource.linkedLessonId] ||
                            "";
                          const sectionLessonOptions =
                            lessonOptionsBySection[selectedSectionId] || [];

                          return (
                            <div
                              key={resource.id || resourceIdx}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) =>
                                handleCourseResourceDrop(event, resourceIdx)
                              }
                              className={`rounded-xl border bg-slate-50 p-3 transition-colors ${
                                draggedCourseResourceIndex === resourceIdx
                                  ? "border-secret-wax/50 bg-orange-50"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start">
                                <button
                                  type="button"
                                  draggable
                                  onDragStart={(event) =>
                                    handleCourseResourceDragStart(
                                      event,
                                      resourceIdx,
                                    )
                                  }
                                  onDragEnd={() =>
                                    setDraggedCourseResourceIndex(null)
                                  }
                                  className="inline-flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-secret-wax hover:text-secret-wax active:cursor-grabbing"
                                  title="Keo de sap xep tai lieu"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>

                                <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(210px,1fr)_minmax(210px,1fr)_auto_auto_auto]">
                                <input
                                  type="text"
                                  value={resource.name || ""}
                                  onChange={(e) =>
                                    handleUpdateCourseResource(
                                      resourceIdx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Tên tài liệu..."
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secret-wax"
                                />
                                <input
                                  type="text"
                                  value={resource.url || ""}
                                  onChange={(e) =>
                                    handleUpdateCourseResource(
                                      resourceIdx,
                                      "url",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Link tài liệu (URL)..."
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secret-wax"
                                />
                                <select
                                  value={selectedSectionId}
                                  onChange={(e) =>
                                    handleCourseResourceSectionChange(
                                      resourceIdx,
                                      e.target.value,
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secret-wax"
                                >
                                  <option value="">Không gắn vào chương nào</option>
                                  {sectionOptions.length === 0 ? (
                                    <option value="" disabled>
                                      Hãy thêm chương trước
                                    </option>
                                  ) : (
                                    sectionOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <select
                                  value={resource.linkedLessonId || ""}
                                  onChange={(e) =>
                                    handleCourseResourceLessonChange(
                                      resourceIdx,
                                      e.target.value,
                                    )
                                  }
                                  disabled={!selectedSectionId}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-secret-wax disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  {!selectedSectionId ? (
                                    <option value="">Chọn chương trước</option>
                                  ) : (
                                    <>
                                      <option value="">Chỉ gắn theo chương</option>
                                      {sectionLessonOptions.length === 0 ? (
                                        <option value="" disabled>
                                          Chương này chưa có bài học
                                        </option>
                                      ) : (
                                        sectionLessonOptions.map((option) => (
                                          <option
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </option>
                                        ))
                                      )}
                                    </>
                                  )}
                                </select>
                                <label
                                  className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition-colors ${
                                    uploadingDocumentKey ===
                                    `course-${resourceIdx}`
                                      ? "bg-slate-100 text-slate-500"
                                      : "bg-white text-slate-600 hover:border-secret-wax hover:text-secret-wax"
                                  }`}
                                  title="Tai file tai lieu len"
                                >
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,image/*"
                                    onChange={(e) =>
                                      handleDocumentUpload(e, {
                                        type: "course",
                                        index: resourceIdx,
                                      })
                                    }
                                    disabled={
                                      uploadingDocumentKey ===
                                      `course-${resourceIdx}`
                                    }
                                  />
                                  {uploadingDocumentKey ===
                                  `course-${resourceIdx}` ? (
                                    <span className="text-xs font-semibold">
                                      {typeof documentUploadProgress ===
                                      "number"
                                        ? `${documentUploadProgress}%`
                                        : "..."}
                                    </span>
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </label>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMoveCourseResource(resourceIdx, -1)
                                    }
                                    disabled={resourceIdx === 0}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-secret-wax disabled:opacity-30"
                                    title="Dua len tren"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMoveCourseResource(resourceIdx, 1)
                                    }
                                    disabled={
                                      resourceIdx ===
                                      formData.courseResources.length - 1
                                    }
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-secret-wax disabled:opacity-30"
                                    title="Dua xuong duoi"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveCourseResource(resourceIdx)
                                  }
                                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-red-500 transition-colors hover:bg-red-50"
                                  title="Xoa tai lieu"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Chưa có tài liệu chung nào cho khóa học này.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-secret-wax px-5 py-2 text-sm font-semibold text-white hover:bg-secret-ink disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu khóa học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Upload Modal */}
      {uploadingTo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                Tải video lên S3 (Long Vân)
              </h3>
              <button
                onClick={() => setUploadingTo(null)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <S3VideoUploader
                onUploadSuccess={(url) => {
                  if (uploadingTo.isNew) {
                    const input = document.getElementById(
                      `lesson-video-${uploadingTo.sIdx}`,
                    );
                    if (input) {
                      input.value = url;
                      input.focus();
                      input.blur(); // trigger auto scan
                    }
                  } else {
                    handleUpdateLesson(
                      uploadingTo.sIdx,
                      uploadingTo.lIdx,
                      "videoId",
                      url,
                    );
                    // Auto scan duration for existing lesson
                    fetchVideoDuration(url).then((duration) => {
                      if (duration) {
                        handleUpdateLesson(
                          uploadingTo.sIdx,
                          uploadingTo.lIdx,
                          "duration",
                          duration,
                        );
                      }
                    });
                  }
                  showToast("Tải video thành công, đã điền link!");
                  setUploadingTo(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
