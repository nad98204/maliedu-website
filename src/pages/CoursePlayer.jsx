import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { ChevronLeft, Menu, Star } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import PlayerSidebar from '../components/PlayerSidebar';
import PlayerTabs from '../components/PlayerTabs';
import VideoWrapper from '../components/VideoWrapper';

const DEFAULT_SECTION_TITLE = 'Nội dung khóa học';

const normalizeSections = (curriculum = []) => {
    if (!Array.isArray(curriculum) || curriculum.length === 0) {
        return [];
    }

    if (curriculum[0]?.lessons) {
        return curriculum;
    }

    return [{ title: DEFAULT_SECTION_TITLE, lessons: curriculum }];
};

const CoursePlayer = () => {
    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [enrollmentId, setEnrollmentId] = useState(null);

    const [playing, setPlaying] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [progress, setProgress] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleContextMenu = (event) => event.preventDefault();
        const handleKeyDown = (event) => {
            if (
                event.key === 'F12' ||
                (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) ||
                (event.ctrlKey && event.key === 'u')
            ) {
                event.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let courseData = null;
                const docRef = doc(db, 'courses', courseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    courseData = { id: docSnap.id, ...docSnap.data() };
                } else {
                    const slugQuery = query(
                        collection(db, 'courses'),
                        where('slug', '==', courseId)
                    );
                    const querySnapshot = await getDocs(slugQuery);

                    if (!querySnapshot.empty) {
                        courseData = {
                            id: querySnapshot.docs[0].id,
                            ...querySnapshot.docs[0].data()
                        };
                    }
                }

                if (!courseData) return;

                setCourse(courseData);

                const normalizedSections = normalizeSections(courseData.curriculum);
                setSections(normalizedSections);

                let completedIds = {};

                if (currentUser) {
                    const enrollmentQuery = query(
                        collection(db, 'enrollments'),
                        where('userId', '==', currentUser.uid),
                        where('courseId', '==', courseData.id)
                    );
                    const enrollmentSnapshot = await getDocs(enrollmentQuery);

                    if (!enrollmentSnapshot.empty) {
                        const enrollmentDoc = enrollmentSnapshot.docs[0];
                        const enrollmentData = enrollmentDoc.data();

                        setEnrollmentId(enrollmentDoc.id);

                        if (Array.isArray(enrollmentData.completedLessonIds)) {
                            completedIds = enrollmentData.completedLessonIds.reduce(
                                (accumulator, lessonId) => ({
                                    ...accumulator,
                                    [lessonId]: true
                                }),
                                {}
                            );
                            setProgress(completedIds);
                        }
                    }
                }

                const allLessons = normalizedSections.flatMap((section) => section.lessons || []);
                if (allLessons.length > 0) {
                    const firstIncompleteLesson = allLessons.find(
                        (lesson) => !completedIds[lesson.id || lesson.videoId]
                    );
                    setCurrentLesson(firstIncompleteLesson || allLessons[0]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, currentUser]);

    const flatLessons = useMemo(
        () => sections.flatMap((section) => section.lessons || []),
        [sections]
    );

    const currentLessonId = currentLesson?.id || currentLesson?.videoId;

    const lessonResourceLookup = useMemo(() => {
        const lookup = {};

        sections.forEach((section) => {
            (section.lessons || []).forEach((lesson) => {
                const lessonKey = lesson.id || lesson.videoId;

                if (!lessonKey) return;

                const lessonMeta = {
                    lessonId: lessonKey,
                    lesson,
                    lessonTitle: lesson.title || '',
                    sectionTitle: section.title || DEFAULT_SECTION_TITLE
                };

                if (lesson.id) {
                    lookup[lesson.id] = lessonMeta;
                }

                if (lesson.videoId) {
                    lookup[lesson.videoId] = lessonMeta;
                }
            });
        });

        return lookup;
    }, [sections]);

    const lessonResources = useMemo(
        () =>
            sections.flatMap((section, sectionIndex) =>
                (section.lessons || [])
                    .filter((lesson) => lesson?.resourceLink)
                    .map((lesson, lessonIndex) => ({
                        id: `${lesson.id || lesson.videoId || `${sectionIndex}-${lessonIndex}`}-resource`,
                        name: lesson.resourceName || lesson.title || `Tài liệu ${lessonIndex + 1}`,
                        url: lesson.resourceLink,
                        lessonTitle: lesson.title,
                        sectionTitle: section.title,
                        lessonId: lesson.id || lesson.videoId,
                        lesson,
                        isGeneral: false,
                        sourceLabel: lesson.title ? `Buổi: ${lesson.title}` : 'Tài liệu theo buổi',
                        order: sectionIndex * 1000 + lessonIndex
                    }))
            ),
        [sections]
    );

    const generalResources = useMemo(
        () =>
            (course?.courseResources || [])
                .map((resource, index) => ({ resource, index }))
                .filter(({ resource }) => resource?.url)
                .sort(
                    (resourceA, resourceB) =>
                        (resourceA.resource.sortOrder ?? resourceA.index) -
                        (resourceB.resource.sortOrder ?? resourceB.index)
                )
                .map(({ resource, index }) => {
                    const linkedLessonId = resource.linkedLessonId || resource.lessonId || null;
                    const linkedLesson = linkedLessonId
                        ? lessonResourceLookup[linkedLessonId]
                        : null;

                    return {
                        id: resource.id || `course-resource-${index}`,
                        name: resource.name || `Tai lieu khoa hoc ${index + 1}`,
                        url: resource.url,
                        lessonTitle: linkedLesson?.lessonTitle || "",
                        sectionTitle: linkedLesson?.sectionTitle || "Tai lieu chung",
                        lessonId: linkedLesson?.lessonId || null,
                        lesson: linkedLesson?.lesson || null,
                        isGeneral: !linkedLessonId,
                        sourceLabel: linkedLesson?.lessonTitle
                            ? `Buoi: ${linkedLesson.lessonTitle}`
                            : linkedLessonId
                              ? "Tai lieu da gan buoi nhung buoi nay khong con ton tai"
                              : "Tai lieu chung cua khoa hoc",
                        order: resource.sortOrder ?? index
                    };
                }),
        [course, lessonResourceLookup]
    );

    const allResources = useMemo(() => {
        const currentId = currentLessonId;

        return [...lessonResources, ...generalResources]
            .map((resource, index) => ({ ...resource, sortIndex: index }))
            .sort((resourceA, resourceB) => {
                const getPriority = (resource) => {
                    if (resource.lessonId && resource.lessonId === currentId) return 0;
                    if (resource.isGeneral) return 1;
                    return 2;
                };

                return (
                    getPriority(resourceA) - getPriority(resourceB) ||
                    resourceA.sortIndex - resourceB.sortIndex
                );
            });
    }, [currentLessonId, generalResources, lessonResources]);

    const currentTabResources = allResources;

    const currentLessonIndex = useMemo(() => {
        if (!currentLessonId) return -1;

        return flatLessons.findIndex(
            (lesson) => (lesson.id || lesson.videoId) === currentLessonId
        );
    }, [currentLessonId, flatLessons]);

    const progressCount = Object.keys(progress).length;
    const progressPercent =
        flatLessons.length > 0 ? Math.round((progressCount / flatLessons.length) * 100) : 0;

    const handleNextLesson = () => {
        if (currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1) {
            setCurrentLesson(flatLessons[currentLessonIndex + 1]);
        }
    };

    const handlePrevLesson = () => {
        if (currentLessonIndex > 0) {
            setCurrentLesson(flatLessons[currentLessonIndex - 1]);
        }
    };

    const handleLessonComplete = async () => {
        if (!currentLessonId || !enrollmentId) return;

        const isCompleted = !!progress[currentLessonId];

        setProgress((prev) => {
            const nextProgress = { ...prev };

            if (isCompleted) {
                delete nextProgress[currentLessonId];
            } else {
                nextProgress[currentLessonId] = true;
            }

            return nextProgress;
        });

        try {
            const enrollmentRef = doc(db, 'enrollments', enrollmentId);

            if (isCompleted) {
                await updateDoc(enrollmentRef, {
                    completedLessonIds: arrayRemove(currentLessonId)
                });
            } else {
                await updateDoc(enrollmentRef, {
                    completedLessonIds: arrayUnion(currentLessonId),
                    lastPlayedLessonId: currentLessonId,
                    lastAccessedAt: Date.now()
                });
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }

        if (!isCompleted && autoPlay) {
            handleNextLesson();
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0f0f15] text-white">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-secret-wax"></div>
            </div>
        );
    }

    if (!course) {
        return <Navigate to="/khoa-hoc" />;
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-gray-50 text-slate-800">
            <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-red-800/20 bg-[#B91C1C] px-4 shadow-md md:px-6">
                <div className="flex items-center gap-6">
                    <Link
                        to={`/khoa-hoc/${course.id}`}
                        className="flex items-center gap-2 text-sm font-bold text-red-100 transition-colors hover:text-white"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="hidden md:inline">Trang chủ khóa học</span>
                    </Link>
                    <div className="hidden h-6 w-px bg-red-400/50 md:block"></div>
                    <h1 className="max-w-[200px] line-clamp-1 text-base font-bold text-white md:max-w-lg md:text-lg">
                        {currentLesson?.title || course.name}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="mr-4 hidden items-center gap-3 md:flex">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white/90">Đã hoàn thành</span>
                            <span className="text-xs text-red-100">
                                {progressCount}/{flatLessons.length} bài học
                            </span>
                        </div>
                        <div className="relative h-10 w-10">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-red-900/30"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className="text-white"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${progressPercent}, 100`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {progressPercent}%
                            </div>
                        </div>
                    </div>

                    <button className="hidden items-center gap-2 rounded-lg border border-red-400 bg-red-800/20 px-3 py-1.5 text-xs font-bold text-red-100 transition-all hover:bg-red-800/40 hover:text-white md:flex">
                        <Star className="h-3 w-3" />
                        Đánh giá
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen((prev) => !prev)}
                        className="rounded-lg bg-red-800 p-2 text-white transition-colors hover:bg-red-900 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="relative flex flex-1 overflow-hidden">
                <main
                    className="custom-scrollbar relative z-10 flex-1 overflow-y-auto scroll-smooth"
                    id="player-scroll-container"
                >
                    <div className="mx-auto max-w-[1600px] p-4 md:p-8">
                        <VideoWrapper
                            videoUrl={currentLesson?.videoId}
                            title={currentLesson?.title}
                            playing={playing}
                            setPlaying={setPlaying}
                            autoPlay={autoPlay}
                            setAutoPlay={setAutoPlay}
                            onEnded={handleLessonComplete}
                            onNext={handleNextLesson}
                            onPrev={handlePrevLesson}
                            hasNext={currentLessonIndex < flatLessons.length - 1}
                            hasPrev={currentLessonIndex > 0}
                            isCompleted={!!progress[currentLessonId]}
                            onMarkComplete={handleLessonComplete}
                        />

                        <PlayerTabs
                            description={currentLesson?.description || course.description}
                            resources={currentTabResources}
                            lessonId={currentLessonId}
                            currentUser={currentUser}
                        />
                    </div>
                </main>

                <aside
                    className={`
                        fixed bottom-0 right-0 top-[64px] z-20 flex w-full flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300
                        md:relative md:bottom-auto md:top-auto md:w-96 md:translate-x-0
                        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}
                >
                    <PlayerSidebar
                        sections={sections}
                        resources={allResources}
                        currentLessonId={currentLessonId}
                        onLessonSelect={(lesson) => {
                            setCurrentLesson(lesson);
                            if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                            }
                        }}
                        progress={progress}
                    />
                </aside>
            </div>
        </div>
    );
};

export default CoursePlayer;
