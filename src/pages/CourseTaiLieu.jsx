import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { ChevronLeft, Download, Eye, FileText, FolderOpen } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { resolveCourseAccess } from "../utils/courseAccess";

const DEFAULT_SECTION_TITLE = "Nội dung khóa học";

// Tự detect: PDF → mở thẳng, các file Office → dùng Google Docs Viewer
const getViewerUrl = (url = "") => {
    const lower = url.toLowerCase().split("?")[0]; // bỏ query string
    if (/\.(pdf)$/.test(lower)) return url;
    // .doc, .docx, .xls, .xlsx, .ppt, .pptx → Google Docs Viewer
    if (/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/.test(lower)) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`;
    }
    return url; // các file khác mở thẳng
};

const normalizeSections = (curriculum = []) => {
    if (!Array.isArray(curriculum) || curriculum.length === 0) return [];
    const sections = curriculum[0]?.lessons
        ? curriculum
        : [{ title: DEFAULT_SECTION_TITLE, lessons: curriculum }];
    return sections.map((s, i) => ({ ...s, id: s.id || `section-${i}` }));
};

const CourseTaiLieu = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasFullAccess, setHasFullAccess] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthChecked(true);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!authChecked) {
            return undefined;
        }

        const fetchData = async () => {
            try {
                let courseData = null;
                const docRef = doc(db, "courses", courseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    courseData = { id: docSnap.id, ...docSnap.data() };
                } else {
                    const slugQuery = query(
                        collection(db, "courses"),
                        where("slug", "==", courseId)
                    );
                    const snap = await getDocs(slugQuery);
                    if (!snap.empty) {
                        courseData = { id: snap.docs[0].id, ...snap.docs[0].data() };
                    }
                }

                if (!courseData) return;

                setCourse(courseData);
                const access = currentUser
                    ? await resolveCourseAccess({
                          db,
                          course: courseData,
                          user: currentUser,
                      })
                    : { hasFullAccess: false };
                setHasFullAccess(access.hasFullAccess);

                if (!access.hasFullAccess) {
                    setSections([]);
                    return;
                }

                const normalizedSections = normalizeSections(courseData.curriculum);
                setSections(normalizedSections);

                // Mặc định mở tất cả chương
                const defaultOpen = {};
                normalizedSections.forEach((s) => { defaultOpen[s.id] = true; });
                setOpenSections(defaultOpen);
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authChecked, courseId, currentUser]);

    // Nhóm tài liệu từ courseResources theo sectionId
    const sectionResourceMap = useMemo(() => {
        const map = {};
        if (!course?.courseResources) return map;

        course.courseResources.forEach((resource) => {
            if (!resource?.url) return;
            const sectionId = resource.linkedSectionId || resource.sectionId || "general";
            if (!map[sectionId]) map[sectionId] = [];
            map[sectionId].push(resource);
        });
        return map;
    }, [course]);

    // Tài liệu gắn vào từng bài học (lesson.resourceLink)
    const lessonResourceMap = useMemo(() => {
        const map = {};
        sections.forEach((section) => {
            (section.lessons || []).forEach((lesson) => {
                if (!lesson?.resourceLink) return;
                const key = lesson.id || lesson.videoId;
                if (!key) return;
                if (!map[key]) map[key] = [];
                map[key].push({
                    name: lesson.resourceName || lesson.title || "Tài liệu",
                    url: lesson.resourceLink,
                    lessonTitle: lesson.title,
                });
            });
        });
        return map;
    }, [sections]);

    // Đếm tổng tài liệu
    const totalDocs = useMemo(() => {
        let count = 0;
        sections.forEach((section) => {
            count += (sectionResourceMap[section.id] || []).length;
            (section.lessons || []).forEach((lesson) => {
                const key = lesson.id || lesson.videoId;
                count += (lessonResourceMap[key] || []).length;
            });
        });
        count += (sectionResourceMap["general"] || []).length;
        return count;
    }, [sections, sectionResourceMap, lessonResourceMap]);

    const toggleSection = (sectionId) => {
        setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const ResourceItem = ({ name, url, subLabel }) => (
        <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{name}</p>
                {subLabel && (
                    <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5 line-clamp-1">{subLabel}</p>
                )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                    href={getViewerUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Đọc tài liệu
                </a>
                <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    Tải xuống
                </a>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 flex justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 text-center">
                <p className="text-slate-600 font-medium">Không tìm thấy khóa học.</p>
                <Link to="/khoa-hoc-cua-toi" className="mt-4 inline-block text-blue-600 hover:underline font-semibold">
                    ← Quay lại khóa học của tôi
                </Link>
            </div>
        );
    }

    if (!hasFullAccess) {
        return <Navigate to={`/khoa-hoc/${course.id}`} replace />;
    }

    const generalDocs = sectionResourceMap["general"] || [];

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* Back + Header */}
                <div className="mb-6">
                    <Link
                        to="/khoa-hoc-cua-toi"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Khóa học của tôi
                    </Link>

                    <div className="flex items-start gap-4">
                        {course.thumbnailUrl && (
                            <img
                                src={course.thumbnailUrl}
                                alt={course.name}
                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm"
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{course.name}</h1>
                            <div className="mt-1.5 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    <FileText className="w-3.5 h-3.5" />
                                    Bài tập và tài liệu
                                </span>
                                <span className="text-sm text-slate-500 font-medium">{totalDocs} tài liệu</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tài liệu chung */}
                {generalDocs.length > 0 && (
                    <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                            <FolderOpen className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-slate-800">Tài liệu chung của khóa học</span>
                            <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                {generalDocs.length} tài liệu
                            </span>
                        </div>
                        <div className="p-4 space-y-2">
                            {generalDocs.map((doc, i) => (
                                <ResourceItem key={i} name={doc.name || `Tài liệu ${i + 1}`} url={doc.url} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Tài liệu theo chương */}
                {sections.map((section) => {
                    const sectionDocs = sectionResourceMap[section.id] || [];
                    const lessonDocs = (section.lessons || []).flatMap((lesson) => {
                        const key = lesson.id || lesson.videoId;
                        return (lessonResourceMap[key] || []).map((r) => ({
                            ...r,
                            subLabel: lesson.title,
                        }));
                    });

                    const allDocs = [...sectionDocs.map(d => ({ name: d.name, url: d.url, subLabel: "Tài liệu theo phần này" })), ...lessonDocs];

                    if (allDocs.length === 0) return null;

                    return (
                        <div key={section.id} className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3 text-left hover:bg-slate-100 transition-colors"
                            >
                                <FolderOpen className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                <span className="font-bold text-slate-800 flex-1 line-clamp-2">{section.title || DEFAULT_SECTION_TITLE}</span>
                                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                    {allDocs.length} tài liệu
                                </span>
                                <span className="text-slate-400 text-sm ml-1">{openSections[section.id] ? "∧" : "∨"}</span>
                            </button>

                            {/* Docs list */}
                            {openSections[section.id] && (
                                <div className="p-4 space-y-2">
                                    {allDocs.map((docItem, i) => (
                                        <ResourceItem
                                            key={i}
                                            name={docItem.name}
                                            url={docItem.url}
                                            subLabel={docItem.subLabel}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {totalDocs === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-semibold">Khóa học này chưa có tài liệu nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseTaiLieu;
