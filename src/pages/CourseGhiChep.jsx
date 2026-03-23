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
import { ChevronLeft, PenTool, BookOpen } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { resolveCourseAccess } from "../utils/courseAccess";

const DEFAULT_SECTION_TITLE = "Nội dung khóa học";

const getLessonNoteStorageKey = (lessonId = "default") =>
    `maliedu-smart-note:${lessonId}`;

const normalizeSections = (curriculum = []) => {
    if (!Array.isArray(curriculum) || curriculum.length === 0) return [];
    const sections = curriculum[0]?.lessons
        ? curriculum
        : [{ title: DEFAULT_SECTION_TITLE, lessons: curriculum }];
    return sections.map((s, i) => ({ ...s, id: s.id || `section-${i}` }));
};

const CourseGhiChep = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
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

                setSections(normalizeSections(courseData.curriculum));
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authChecked, courseId, currentUser]);

    // Đọc ghi chép từ localStorage cho từng bài học
    const notesByLesson = useMemo(() => {
        const result = {};
        sections.forEach((section) => {
            (section.lessons || []).forEach((lesson) => {
                const key = lesson.id || lesson.videoId;
                if (!key) return;
                try {
                    const raw = localStorage.getItem(getLessonNoteStorageKey(key));
                    if (!raw) return;
                    const parsed = JSON.parse(raw);
                    const content = parsed?.content || parsed || "";
                    if (content.trim()) {
                        result[key] = {
                            content: content.trim(),
                            savedAt: parsed?.savedAt || null,
                            lessonTitle: lesson.title || "Bài học",
                            sectionTitle: section.title || DEFAULT_SECTION_TITLE,
                        };
                    }
                } catch {
                    // ignore parse errors
                }
            });
        });
        return result;
    }, [sections]);

    const totalNotes = Object.keys(notesByLesson).length;

    // Nhóm theo chương để hiển thị gọn
    const groupedNotes = useMemo(() => {
        return sections
            .map((section) => {
                const sectionNotes = (section.lessons || [])
                    .map((lesson) => {
                        const key = lesson.id || lesson.videoId;
                        const note = notesByLesson[key];
                        if (!note) return null;
                        return { key, ...note };
                    })
                    .filter(Boolean);

                if (sectionNotes.length === 0) return null;
                return {
                    sectionId: section.id,
                    sectionTitle: section.title || DEFAULT_SECTION_TITLE,
                    notes: sectionNotes,
                };
            })
            .filter(Boolean);
    }, [sections, notesByLesson]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 flex justify-center">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 text-center">
                <p className="text-slate-600 font-medium">Không tìm thấy khóa học.</p>
                <Link to="/khoa-hoc-cua-toi" className="mt-4 inline-block text-red-600 hover:underline font-semibold">
                    ← Quay lại khóa học của tôi
                </Link>
            </div>
        );
    }

    if (!hasFullAccess) {
        return <Navigate to={`/khoa-hoc/${course.id}`} replace />;
    }

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
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                    <PenTool className="w-3.5 h-3.5" />
                                    Bài học ghi chép
                                </span>
                                <span className="text-sm text-slate-500 font-medium">
                                    {totalNotes} bài có ghi chép
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách ghi chép */}
                {groupedNotes.length > 0 ? (
                    <div className="space-y-5">
                        {groupedNotes.map((group) => (
                            <div key={group.sectionId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                {/* Section title */}
                                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                    <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <span className="font-bold text-slate-700 text-sm line-clamp-1">{group.sectionTitle}</span>
                                    <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                        {group.notes.length} ghi chép
                                    </span>
                                </div>

                                {/* Notes */}
                                <div className="divide-y divide-slate-100">
                                    {group.notes.map((note) => (
                                        <div key={note.key} className="px-5 py-4">
                                            {/* Lesson title + time */}
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                                        <PenTool className="w-3.5 h-3.5 text-red-500" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{note.lessonTitle}</p>
                                                </div>
                                                {note.savedAt && (
                                                    <span className="text-xs text-slate-400 font-medium flex-shrink-0">
                                                        {new Date(note.savedAt).toLocaleDateString("vi-VN", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                        })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Note content */}
                                            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                                                <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans break-words">
                                                    {note.content}
                                                </pre>
                                            </div>

                                            {/* Link đến bài học */}
                                            <div className="mt-3 flex justify-end">
                                                <Link
                                                    to={`/bai-giang/${course.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    Đến bài học →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <PenTool className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-semibold text-lg">Chưa có ghi chép nào</p>
                        <p className="text-slate-400 text-sm mt-2">Vào học và ghi chép để xem lại ở đây nhé!</p>
                        <Link
                            to={`/bai-giang/${course.id}`}
                            className="mt-6 inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-md"
                        >
                            Vào học ngay
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseGhiChep;
