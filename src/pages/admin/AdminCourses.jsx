import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  writeBatch,
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
  ChevronDown,
  Copy,
  Pin,
  ListOrdered,
} from "lucide-react";

import { crmFirestore, db } from "../../firebase";
import RichTextEditor from "../../components/RichTextEditor";
import { uploadFileToS3, uploadVideoToS3 } from "../../utils/s3UploadService";
import AdminCategories from "./AdminCategories";
import AdminCoupons from "./AdminCoupons";
import AdminInstructors from "./AdminInstructors"; // NEW IMPORT
import S3VideoUploader from "../../components/S3VideoUploader";
import {
  COURSE_CONTENT_COLLECTION,
  mergeCourseWithContent,
  splitCourseForStorage,
} from "../../utils/courseDataPrivacy";
import { getPrivateCourseContent } from "../../utils/courseContentService";
import {
  isPublicCatalogCourse,
  normalizeCourseLandingUrl,
} from "../../utils/courseMarketing";

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

const DEFAULT_LEAD_LANDING_OPTIONS = [
  { title: "Khơi Thông Dòng Tiền", path: "/dao-tao/khoi-thong-dong-tien" },
  { title: "Luật Hấp Dẫn", path: "/dao-tao/luat-hap-dan" },
  { title: "Vút Tốc Mục Tiêu", path: "/dao-tao/vut-toc-muc-tieu" },
  { title: "Chinh Phục Mục Tiêu", path: "/dao-tao/chinh-phuc-muc-tieu" },
];

const mergeLeadLandingOptions = (dynamicOptions = []) => {
  const optionsByPath = new Map(
    DEFAULT_LEAD_LANDING_OPTIONS.map((option) => [option.path, option]),
  );

  dynamicOptions.forEach((option) => {
    const path = normalizeCourseLandingUrl(option.path);
    if (!path || optionsByPath.has(path)) return;
    optionsByPath.set(path, { title: option.title || path, path });
  });

  return Array.from(optionsByPath.values());
};

const getCoursePopularityScore = (course) =>
  Number(course.enrollmentCount || 0) * 1000 + Number(course.views || 0);

const comparePublicCourseOrder = (courseA, courseB) => {
  const pinnedDifference =
    Number(Boolean(courseB.isPinned)) - Number(Boolean(courseA.isPinned));
  if (pinnedDifference !== 0) return pinnedDifference;

  const priorityDifference =
    Number(courseB.listingPriority || 0) -
    Number(courseA.listingPriority || 0);
  if (priorityDifference !== 0) return priorityDifference;

  const popularityDifference =
    getCoursePopularityScore(courseB) - getCoursePopularityScore(courseA);
  if (popularityDifference !== 0) return popularityDifference;

  return (
    Number(courseB.createdAt || courseB.updatedAt || 0) -
    Number(courseA.createdAt || courseA.updatedAt || 0)
  );
};

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

const fetchVideoDuration = (url) =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) {
        resolve(null);
        return;
      }

      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);
      resolve(
        hours > 0
          ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };
    video.onerror = () => resolve(null);
    video.src = url;
  });

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
  const [expandedSections, setExpandedSections] = useState({}); // Key: sectionId, Value: boolean
  const [quickAddExpanded, setQuickAddExpanded] = useState({}); // Key: sIdx, Value: boolean
  const [expandedResources, setExpandedResources] = useState({}); // Key: resource.id || idx, Value: boolean
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

      if (!videoUrl) {
        throw new Error("Không nhận được đường dẫn sau khi tải lên thành công.");
      }

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
      console.error("Lỗi chi tiết khi tải video:", err);
      setUploadTasks(prev => ({
        ...prev,
        [taskKey]: { ...prev[taskKey], status: 'error', error: err.message }
      }));
      showToast(`Lỗi tải lên "${file.name}": ${err.message}`, "error");
    }
  };
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(null);
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

  // --- SECTION EXPANSION (COLLAPSE/EXPAND) ---
  const STORAGE_KEY = "admin_courses_expanded_sections";

  const loadExpandedSectionsFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setExpandedSections(parsed);
      }
    } catch (error) {
      console.error("Error loading expanded sections from localStorage:", error);
    }
  };

  const saveExpandedSectionsToStorage = (sections) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch (error) {
      console.error("Error saving expanded sections to localStorage:", error);
    }
  };

  const getSectionExpansionKey = (section, sIdx) =>
    getSectionIdentifier(section, `section-${sIdx}`);

  const toggleSectionExpansion = (section, sIdx) => {
    const key = getSectionExpansionKey(section, sIdx);
    setExpandedSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveExpandedSectionsToStorage(next);
      return next;
    });
  };

  const isSectionExpanded = (section, sIdx) => {
    const key = getSectionExpansionKey(section, sIdx);
    // Mặc định mở (true) nếu chưa có trong state
    return expandedSections[key] !== false;
  };

  const toggleQuickAdd = (sIdx) => {
    setQuickAddExpanded(prev => ({
      ...prev,
      [sIdx]: !prev[sIdx]
    }));
  };

  const isQuickAddExpanded = (sIdx) => quickAddExpanded[sIdx] === true;

  const toggleResourceExpansion = (resourceId) => {
    setExpandedResources(prev => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }));
  };

  const isResourceExpanded = (resourceId) => expandedResources[resourceId] === true;

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
    isLeadGenerationEnabled: false,
    leadLandingUrl: "",
    isPinned: false,
    listingPriority: 0,
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
  const fetchCourses = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "courses"));
      const data = await Promise.all(
        snapshot.docs.map(async (docItem) => {
          const publicCourse = { id: docItem.id, ...docItem.data() };
          const privateCourse = await getPrivateCourseContent(db, docItem.id);
          return mergeCourseWithContent(publicCourse, privateCourse);
        }),
      );
      setCourses(
        data
          .filter((course) => course.name?.trim())
          .sort(comparePublicCourseOrder),
      );
    } catch (error) {
      console.error("Error fetching courses:", error);
      setToast({ message: "Không thể tải danh sách khóa học", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  }, []);

  const publicCourseRankById = useMemo(() => {
    const rankEntries = courses
      .filter(isPublicCatalogCourse)
      .sort(comparePublicCourseOrder)
      .map((course, index) => [course.id, index + 1]);

    return new Map(rankEntries);
  }, [courses]);

  const orderedOnlineCourses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase("vi");
    const matchingCourses = courses.filter(
      (course) =>
        (course.isForSale !== false || course.isLeadGenerationEnabled === true) &&
        (!normalizedSearch ||
          (course.name || "").toLocaleLowerCase("vi").includes(normalizedSearch)),
    );

    return [
      ...matchingCourses
        .filter((course) => course.isPublished === true)
        .sort(comparePublicCourseOrder),
      ...matchingCourses
        .filter((course) => course.isPublished !== true)
        .sort(comparePublicCourseOrder),
    ];
  }, [courses, searchQuery]);

  // Fetch Categories for Dropdown
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]); // NEW
  const [leadLandingOptions, setLeadLandingOptions] = useState(DEFAULT_LEAD_LANDING_OPTIONS);
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

    const fetchLeadLandingOptions = async () => {
      try {
        const snapshot = await getDocs(collection(crmFirestore, "landing_pages"));
        const dynamicOptions = snapshot.docs.map((landingDoc) => {
          const data = landingDoc.data();
          return {
            title: data.name || data.title || landingDoc.id,
            path: data.slug || data.path || data.url || "",
          };
        });
        setLeadLandingOptions(mergeLeadLandingOptions(dynamicOptions));
      } catch (error) {
        console.warn("Không thể tải danh sách Landing Page:", error);
        setLeadLandingOptions(DEFAULT_LEAD_LANDING_OPTIONS);
      }
    };

    fetchCategories();
    fetchInstructors();
    fetchLeadLandingOptions();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Load expanded sections state from localStorage on mount
  useEffect(() => {
    loadExpandedSectionsFromStorage();
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
      try {
        const courseData = {
          ...getNormalizedCourseData(formData),
          isDraft: true,
          updatedAt: Date.now(),
        };
        const { publicCourse, privateCourse } = splitCourseForStorage(
          editingCourse.id,
          courseData,
        );
        const batch = writeBatch(db);
        batch.set(doc(db, "courses", editingCourse.id), publicCourse);
        batch.set(
          doc(db, COURSE_CONTENT_COLLECTION, editingCourse.id),
          privateCourse,
        );
        await batch.commit();
      } catch (err) {
        console.error("Auto-save to cloud failed:", err);
      }
    }, 10000);

    return () => clearTimeout(timer);
  // The normalization helper is pure; form state is the actual autosave trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const publicUrl = await uploadFileToS3(selectedFile, null, { folder: "thumbnails" });
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: publicUrl,
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
      const publicUrl = await uploadFileToS3(selectedFile, null, { folder: "instructors" });
      setFormData((prev) => ({
        ...prev,
        instructorImageUrl: publicUrl,
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
      isLeadGenerationEnabled: false,
      leadLandingUrl: "",
      isPinned: false,
      listingPriority: 0,
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
      isLeadGenerationEnabled: Boolean(course.isLeadGenerationEnabled),
      leadLandingUrl: course.leadLandingUrl || "",
      isPinned: Boolean(course.isPinned),
      listingPriority: Number(course.listingPriority || 0),
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

  const handleDuplicate = (course) => {
    setEditingCourse(null);

    const duplicatedCurriculum = JSON.parse(
      JSON.stringify(normalizeCurriculumForForm(course.curriculum)),
    ).map((section) => ({
      ...section,
      lessons: (section.lessons || []).map((lesson) => ({
        ...lesson,
        id: createLocalId("lesson"),
        videoId: "",
      })),
    }));

    setFormData({
      name: `[Bản sao] ${course.name || "Khóa học"}`,
      slug: course.slug ? `${course.slug}-copy` : "",
      categories:
        course.categories || (course.category ? [course.category] : []),
      category: course.category || "",
      price: course.price || "",
      salePrice: course.salePrice || "",
      thumbnailUrl: course.thumbnailUrl || "",
      instructorImageUrl: course.instructorImageUrl || "",
      authorId: course.authorId || "",
      description: course.description || "",
      content: course.content || "",
      videoId: course.videoId || "",
      isPublished: false,
      isForSale: course.isForSale !== undefined ? course.isForSale : true,
      isLeadGenerationEnabled: Boolean(course.isLeadGenerationEnabled),
      leadLandingUrl: course.leadLandingUrl || "",
      isPinned: false,
      listingPriority: 0,
      freeLessonsCount: course.freeLessonsCount || 3,
      instructorName: course.instructorName || "",
      instructorTitle: course.instructorTitle || "",
      instructorBio: course.instructorBio || "",
      instructorStudentCount: course.instructorStudentCount || "",
      instructorCourseCount: course.instructorCourseCount || "",
      fakeRating: course.fakeRating || "",
      fakeReviewCount: course.fakeReviewCount || "",
      fakeStudentCount: course.fakeStudentCount || "",
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn)
        ? course.whatYouWillLearn.join("\n")
        : course.whatYouWillLearn || "",
      displayCategory: course.displayCategory || "",
      courseResources: normalizeCourseResources(course.courseResources),
      curriculum: duplicatedCurriculum,
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
      isPinned: Boolean(data.isPinned),
      listingPriority: Number(data.listingPriority || 0),
      isLeadGenerationEnabled:
        data.isForSale === false && Boolean(data.isLeadGenerationEnabled),
      leadLandingUrl:
        data.isForSale === false && data.isLeadGenerationEnabled
          ? normalizeCourseLandingUrl(data.leadLandingUrl)
          : "",
      price: data.isForSale ? Number(data.price) : 0,
      salePrice:
        data.isForSale && data.salePrice ? Number(data.salePrice) : null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.isForSale === false
      && formData.isLeadGenerationEnabled
      && !String(formData.leadLandingUrl || "").trim()
    ) {
      showToast("Vui lòng chọn Landing Page nhận đăng ký tư vấn", "error");
      setActiveTab("info");
      return;
    }

    setIsSubmitting(true);
    try {
      const courseData = {
        ...getNormalizedCourseData(formData),
        updatedAt: Date.now(),
      };

      const courseRef = editingCourse
        ? doc(db, "courses", editingCourse.id)
        : doc(collection(db, "courses"));
      const dataToStore = editingCourse
        ? {
            ...courseData,
            createdAt:
              editingCourse.createdAt || editingCourse.updatedAt || Date.now(),
          }
        : { ...courseData, createdAt: Date.now() };
      const { publicCourse, privateCourse } = splitCourseForStorage(
        courseRef.id,
        dataToStore,
      );
      const batch = writeBatch(db);
      batch.set(courseRef, publicCourse);
      batch.set(
        doc(db, COURSE_CONTENT_COLLECTION, courseRef.id),
        privateCourse,
      );
      await batch.commit();

      if (editingCourse) {
        showToast("Cập nhật khóa học thành công!");
      } else {
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

  const updateCourseListingSettings = async (course, updates, successMessage) => {
    const previousCourses = courses;
    const nextCourses = courses
      .map((currentCourse) =>
        currentCourse.id === course.id
          ? { ...currentCourse, ...updates, updatedAt: Date.now() }
          : currentCourse,
      )
      .sort(comparePublicCourseOrder);

    setCourses(nextCourses);

    try {
      const batch = writeBatch(db);
      batch.set(
        doc(db, "courses", course.id),
        { ...updates, updatedAt: Date.now() },
        { merge: true },
      );
      await batch.commit();
      showToast(successMessage);
    } catch (error) {
      console.error("Error updating course listing order:", error);
      setCourses(previousCourses);
      showToast("Không thể cập nhật thứ tự khóa học", "error");
    }
  };

  const handleToggleCoursePin = (course) => {
    const isPinned = !course.isPinned;
    updateCourseListingSettings(
      course,
      { isPinned },
      isPinned ? "Đã ghim khóa học lên đầu" : "Đã bỏ ghim khóa học",
    );
  };

  const handleShiftCoursePriority = (course, direction) => {
    const currentPriority = Number(course.listingPriority || 0);
    const listingPriority = currentPriority + direction;
    updateCourseListingSettings(
      course,
      { listingPriority },
      direction > 0 ? "Đã tăng ưu tiên hiển thị" : "Đã giảm ưu tiên hiển thị",
    );
  };

  const handleResetCourseListing = (course) => {
    updateCourseListingSettings(
      course,
      { isPinned: false, listingPriority: 0 },
      "Đã đặt lại ưu tiên hiển thị",
    );
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "courses", courseId));
      batch.delete(doc(db, COURSE_CONTENT_COLLECTION, courseId));
      await batch.commit();
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

  const freePreviewLessonCount = useMemo(
    () =>
      (formData.curriculum || []).reduce(
        (total, section) =>
          total +
          (section.lessons || []).filter((lesson) => lesson.isFreePreview).length,
        0,
      ),
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
        <div className="flex max-w-full w-fit overflow-x-auto p-1 bg-slate-50 rounded-2xl [scrollbar-width:none]">
          {[
            { id: 'courses', label: 'Online' },
            { id: 'course_order', label: 'Sắp xếp hiển thị' },
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
          {(mainTab === "courses" || mainTab === "course_order" || mainTab === "offline_courses") && (
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
                                src={course.thumbnailUrl || "https://via.placeholder.com/150?text=No+Image"}
                                alt={course.name}
                                className="h-full w-full rounded-2xl object-cover shadow-sm ring-1 ring-slate-100"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/150?text=No+Image";
                                }}
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
                          ) : course.isLeadGenerationEnabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider border border-amber-200">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Thu Lead tư vấn
                            </span>
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
                              {course.isPublished
                                ? course.isForSale !== false
                                  ? "Đang bán"
                                  : course.isLeadGenerationEnabled
                                    ? "Đang quảng bá"
                                    : "Đang hoạt động"
                                : "Tạm ẩn"}
                            </span>
                            {course.isForSale === false && (
                              <span className="max-w-[210px] truncate text-[10px] font-medium text-slate-400 italic" title={course.leadLandingUrl || "Cần Admin cấp quyền"}>
                                {course.isLeadGenerationEnabled
                                  ? `CTA → ${course.leadLandingUrl || "Chưa chọn Landing"}`
                                  : "Cần Admin cấp quyền"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDuplicate(course)}
                              className="p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-all duration-200"
                              title="Nhân bản khóa học"
                            >
                              <Copy className="h-4.5 w-4.5" />
                            </button>
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
                        colSpan="5"
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

      {mainTab === "course_order" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col gap-4 rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <ListOrdered className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Sắp xếp khóa học ngoài website
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Thứ tự được tính theo: ghim trước, mức ưu tiên, số học viên đã mua và cuối cùng là lượt xem.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
              <span className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-amber-700">1. Ghim</span>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-indigo-700">2. Ưu tiên</span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">3. Phổ biến</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vị trí</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Khóa học</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Độ phổ biến</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ưu tiên</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Điều chỉnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderedOnlineCourses.map((course) => {
                    const publicRank = publicCourseRankById.get(course.id);
                    const priority = Number(course.listingPriority || 0);

                    return (
                      <tr key={course.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          {publicRank ? (
                            <span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-black ${publicRank <= 3 ? "bg-secret-wax text-white" : "bg-slate-100 text-slate-600"}`}>
                              #{publicRank}
                            </span>
                          ) : (
                            <span className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600">
                              Tạm ẩn
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={course.thumbnailUrl || "https://via.placeholder.com/120?text=No+Image"}
                              alt={course.name}
                              className="h-12 w-16 rounded-xl object-cover ring-1 ring-slate-100"
                            />
                            <div className="min-w-0">
                              <div className="max-w-[320px] truncate font-black text-slate-900">{course.name}</div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                <span>/{course.slug}</span>
                                <span className={`h-1.5 w-1.5 rounded-full ${course.isPublished ? "bg-emerald-500" : "bg-rose-400"}`} />
                                <span>{course.isPublished ? "Đang bán" : "Tạm ẩn"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1.5" title="Số học viên đã mua">
                              <Users className="h-4 w-4 text-emerald-600" />
                              {Number(course.enrollmentCount || 0).toLocaleString("vi-VN")} học viên
                            </span>
                            <span className="inline-flex items-center gap-1.5" title="Lượt xem">
                              <Eye className="h-4 w-4 text-blue-600" />
                              {Number(course.views || 0).toLocaleString("vi-VN")} lượt xem
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {course.isPinned && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                                <Pin className="h-3 w-3 fill-current" /> Đã ghim
                              </span>
                            )}
                            <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${priority > 0 ? "bg-emerald-50 text-emerald-700" : priority < 0 ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                              Mức {priority > 0 ? "+" : ""}{priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCoursePin(course)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition ${course.isPinned ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"}`}
                            >
                              <Pin className={`h-3.5 w-3.5 ${course.isPinned ? "fill-current" : ""}`} />
                              {course.isPinned ? "Bỏ ghim" : "Ghim"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftCoursePriority(course, 1)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                              title="Tăng mức ưu tiên"
                            >
                              <ArrowUp className="h-3.5 w-3.5" /> Lên
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftCoursePriority(course, -1)}
                              className="inline-flex items-center gap-1 rounded-xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 transition hover:bg-orange-100"
                              title="Giảm mức ưu tiên"
                            >
                              <ArrowDown className="h-3.5 w-3.5" /> Xuống
                            </button>
                            {(course.isPinned || priority !== 0) && (
                              <button
                                type="button"
                                onClick={() => handleResetCourseListing(course)}
                                className="rounded-xl px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              >
                                Đặt lại
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {orderedOnlineCourses.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-sm font-bold text-slate-400">
                        Không tìm thấy khóa học online phù hợp.
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
                          Bỏ tích để chuyển sang khóa Offline hoặc chương trình
                          cần tư vấn trước khi đăng ký.
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
                      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            name="isLeadGenerationEnabled"
                            checked={Boolean(formData.isLeadGenerationEnabled)}
                            onChange={handleInputChange}
                            className="mt-0.5 h-5 w-5 rounded border-amber-300 text-secret-wax focus:ring-secret-wax"
                          />
                          <span>
                            <span className="block text-sm font-black text-amber-950">
                              Quảng bá tuyển sinh trên website
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-amber-800/80">
                              Khóa học được xuất hiện trên trang khóa học và các vị trí gợi ý. Nút đăng ký sẽ dẫn sang Landing Page để khách để lại thông tin, không qua thanh toán.
                            </span>
                          </span>
                        </label>

                        {formData.isLeadGenerationEnabled ? (
                          <div className="space-y-3 border-t border-amber-200 pt-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-wider text-amber-900">
                                Landing Page nhận đăng ký <span className="text-rose-500">*</span>
                              </label>
                              <select
                                value={leadLandingOptions.some((option) => option.path === formData.leadLandingUrl) ? formData.leadLandingUrl : ""}
                                onChange={(event) => setFormData((current) => ({
                                  ...current,
                                  leadLandingUrl: event.target.value,
                                }))}
                                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-secret-wax focus:ring-4 focus:ring-secret-wax/5"
                              >
                                <option value="">-- Chọn nhanh Landing Page --</option>
                                {leadLandingOptions.map((option) => (
                                  <option key={option.path} value={option.path}>
                                    {option.title} ({option.path})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600">
                                Hoặc nhập đường dẫn Landing
                              </label>
                              <input
                                type="text"
                                name="leadLandingUrl"
                                value={formData.leadLandingUrl || ""}
                                onChange={handleInputChange}
                                required
                                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-mono text-slate-700 outline-none transition focus:border-secret-wax focus:ring-4 focus:ring-secret-wax/5"
                                placeholder="/dao-tao/khoa-chuyen-sau"
                              />
                              <p className="text-[11px] leading-5 text-amber-800/70">
                                Có thể dùng đường dẫn trong website hoặc URL đầy đủ tới Landing bên ngoài.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 border-t border-amber-200 pt-4">
                            <p className="text-sm text-slate-600">
                              Chế độ nội bộ: học viên chỉ xem được các bài học thử, sau đó cần Admin cấp quyền.
                            </p>
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
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 outline-none"
                                placeholder="VD: 3"
                              />
                              <p className="text-xs text-slate-500">
                                Số lượng video đầu tiên học viên được xem thử (0-10).
                              </p>
                            </div>
                          </div>
                        )}
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
                          {formData.isForSale
                            ? "Đang bán"
                            : formData.isLeadGenerationEnabled
                              ? "Hiển thị quảng bá"
                              : "Đang hoạt động"}
                        </div>
                        <div className="text-slate-500">
                          {formData.isForSale || formData.isLeadGenerationEnabled
                            ? "Tích vào để hiển thị khóa học lên website"
                            : "Tích vào để khóa học có thể được Admin cấp quyền"}
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
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/150?text=No+Image";
                                }}
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
                                <img 
                                  src={formData.instructorImageUrl} 
                                  alt="Instructor" 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/150?text=No+Instructor";
                                  }}
                                />
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

                  <div className="flex flex-col gap-4 rounded-[28px] border-2 border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-emerald-950">Chọn bài học thử miễn phí</h4>
                        <p className="mt-1 text-xs font-medium leading-5 text-emerald-700">
                          Bật nút <strong>HỌC THỬ</strong> ngay trên từng bài học rồi lưu khóa học.
                        </p>
                      </div>
                    </div>
                    <span className="w-fit shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 ring-1 ring-emerald-200">
                      Đã chọn {freePreviewLessonCount} bài
                    </span>
                  </div>

                  {formData.curriculum && formData.curriculum.length > 0 ? (
                    <div className="space-y-10 pb-10">
                      {formData.curriculum.map((section, sIdx) => (
                        <div
                          key={sIdx}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", String(sIdx));
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const sourceIdx = Number(e.dataTransfer.getData("text/plain"));
                            if (sourceIdx !== sIdx && !isNaN(sourceIdx)) {
                              setFormData(prev => {
                                const newCurriculum = [...(prev.curriculum || [])];
                                const [moved] = newCurriculum.splice(sourceIdx, 1);
                                newCurriculum.splice(sIdx, 0, moved);
                                return { ...prev, curriculum: newCurriculum };
                              });
                            }
                          }}
                          className="group/section rounded-[40px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 overflow-hidden"
                        >
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
                            <button
                              type="button"
                              onClick={() => toggleSectionExpansion(section, sIdx)}
                              className="p-3 rounded-2xl bg-slate-50/50 text-slate-400 hover:text-secret-wax hover:bg-slate-50 transition-all ml-2"
                              title={isSectionExpanded(section, sIdx) ? "Thu gọn chương" : "Mở rộng chương"}
                            >
                              <ChevronDown
                                className={`w-5 h-5 transition-transform duration-300 ${isSectionExpanded(section, sIdx) ? "" : "-rotate-90"}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleQuickAdd(sIdx)}
                              className={`p-3 rounded-2xl transition-all ml-2 ${isQuickAddExpanded(sIdx) ? 'bg-secret-wax text-white shadow-lg shadow-secret-wax/25' : 'bg-slate-50 text-slate-400 hover:text-secret-wax hover:bg-slate-100'}`}
                              title="Thêm bài học mới"
                            >
                              <Plus className={`w-5 h-5 transition-transform duration-300 ${isQuickAddExpanded(sIdx) ? 'rotate-45' : ''}`} />
                            </button>
                            <button type="button" onClick={() => handleRemoveSection(sIdx)} className="p-3 rounded-2xl bg-rose-50/50 text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all ml-2">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Quick Add Lesson for Section - Collapsible */}
                          {isSectionExpanded(section, sIdx) ? (
                          <>
                          {isQuickAddExpanded(sIdx) && (
                          <div className="px-8 py-6 bg-slate-50/50 border-y border-slate-100 animate-in slide-in-from-top-2 duration-200">
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
                          )}

                          {/* Lessons List in Section */}
                          <div className="p-4 space-y-3">
                            {(section.lessons || []).map((lesson, lIdx) => {
                              const expKey = getLessonExpansionKey(lesson, sIdx, lIdx);
                              const isExp = Boolean(expandedLessons[expKey]);

                              return (
                                <div
                                  key={lesson.id || lIdx}
                                  draggable
                                  onDragStart={(e) => handleLessonDragStart(e, sIdx, lIdx)}
                                  onDragOver={(e) => handleLessonDragOver(e, sIdx, lIdx)}
                                  onDrop={(e) => handleLessonDrop(e, sIdx, lIdx)}
                                  onDragLeave={() => setLessonDropTarget(null)}
                                  className={`rounded-3xl border transition-all overflow-hidden ${isLessonDropTarget(sIdx, lIdx) ? 'border-secret-wax bg-secret-wax/5 ring-2 ring-secret-wax/20' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                                >
                                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                      {/* Drag Handle */}
                                      <button
                                        type="button"
                                        draggable
                                        onDragStart={(e) => handleLessonDragStart(e, sIdx, lIdx)}
                                        className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-all"
                                        title="Kéo để di chuyển bài học"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </button>

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

                                    <div className="flex flex-wrap items-center justify-end gap-2">
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
                                        role="switch"
                                        aria-checked={lesson.isFreePreview}
                                        onClick={() =>
                                          handleUpdateLesson(
                                            sIdx,
                                            lIdx,
                                            "isFreePreview",
                                            !lesson.isFreePreview,
                                          )
                                        }
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-all ${
                                          lesson.isFreePreview
                                            ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                                        }`}
                                        title="Bật hoặc tắt quyền học thử miễn phí cho bài này"
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span>Học thử</span>
                                        <span
                                          className={`rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${
                                            lesson.isFreePreview
                                              ? "bg-white/20 text-white"
                                              : "bg-slate-100 text-slate-400"
                                          }`}
                                        >
                                          {lesson.isFreePreview ? "Bật" : "Tắt"}
                                        </span>
                                      </button>
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
                        </>
                      ) : (
                        /* Collapsed State - Show summary */
                        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100">
                          <p className="text-sm text-slate-400 font-medium">
                            {(section.lessons || []).length} bài học • Click để mở rộng
                          </p>
                        </div>
                      )}
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
                        <div key={resource.id || idx} className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                          {/* Header - always visible */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{resource.name || "Chưa đặt tên"}</p>
                                {resource.linkedSectionId && (
                                  <p className="text-xs text-slate-500 truncate">
                                    {sectionOptions.find(s => s.value === resource.linkedSectionId)?.label || ""}
                                    {resource.linkedLessonId && " → " + (lessonOptionsBySection[resource.linkedSectionId]?.find(l => l.value === resource.linkedLessonId)?.label || "")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleResourceExpansion(resource.id || idx)}
                                className={`p-2.5 rounded-xl transition-all ${isResourceExpanded(resource.id || idx) ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                title={isResourceExpanded(resource.id || idx) ? "Thu gọn" : "Mở rộng"}
                              >
                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isResourceExpanded(resource.id || idx) ? '' : '-rotate-90'}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCourseResource(idx)}
                                className="p-2.5 rounded-xl bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded content - inputs */}
                          {isResourceExpanded(resource.id || idx) && (
                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                              {/* Name + URL row */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                              {/* Section & Lesson Link row */}
                              <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                  value={resource.linkedSectionId || ""}
                                  onChange={(e) => handleCourseResourceSectionChange(idx, e.target.value)}
                                  className="h-11 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-secret-wax/5 outline-none flex-1"
                                >
                                  <option value="">-- Không gắn chương --</option>
                                  {sectionOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>

                                <select
                                  value={resource.linkedLessonId || ""}
                                  onChange={(e) => handleCourseResourceLessonChange(idx, e.target.value)}
                                  disabled={!resource.linkedSectionId}
                                  className={`h-11 rounded-2xl border px-4 text-sm font-bold outline-none flex-1 ${resource.linkedSectionId ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                  <option value="">
                                    {resource.linkedSectionId ? "-- Chọn buổi học --" : "-- Chọn chương trước --"}
                                  </option>
                                  {resource.linkedSectionId && lessonOptionsBySection[resource.linkedSectionId]?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>

                              {uploadingDocumentKey === `course-${idx}` && (
                                <div className="mt-2">
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${documentUploadProgress || 0}%` }} />
                                  </div>
                                  <p className="text-xs font-bold text-emerald-600 mt-1">Đang tải lên...</p>
                                </div>
                              )}
                            </div>
                          )}
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
