import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
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
import { CheckCircle, ChevronLeft, LockKeyhole, Menu, PlayCircle, Star, X } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import PlayerSidebar from '../components/PlayerSidebar';
import PlayerTabs from '../components/PlayerTabs';
import VideoWrapper from '../components/VideoWrapper';
import {
    getLessonKey,
    getPreferredPreviewLesson,
    getPreviewSections,
    getPreviewableLessonKeys,
    resolveCourseAccess,
} from '../utils/courseAccess';
import { loadFullCourse } from '../utils/courseContentService';

const DEFAULT_SECTION_TITLE = 'Nội dung khóa học';
const getSectionIdentifier = (section, fallbackId = '') => section?.id || fallbackId;

const normalizeSections = (curriculum = []) => {
    if (!Array.isArray(curriculum) || curriculum.length === 0) {
        return [];
    }

    const sections = curriculum[0]?.lessons
        ? curriculum
        : [{ title: DEFAULT_SECTION_TITLE, lessons: curriculum }];

    return sections.map((section, sectionIndex) => ({
        ...section,
        id: getSectionIdentifier(section, `section-${sectionIndex}`)
    }));
};

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const previewRequested = searchParams.get('preview') === '1';
    const requestedPreviewLessonKey = searchParams.get('lesson');

    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasFullAccess, setHasFullAccess] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [enrollmentId, setEnrollmentId] = useState(null);

    const [playing, setPlaying] = useState(false);
    const [activePlayerTab, setActivePlayerTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
        typeof window === 'undefined' ? true : window.innerWidth >= 768
    );

    const [progress, setProgress] = useState({});
    const [resourceFocusRequest, setResourceFocusRequest] = useState(null);
    const [isRegistrationPromptOpen, setIsRegistrationPromptOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthChecked(true);
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
        if (typeof window === 'undefined') {
            return undefined;
        }

        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleChange = (event) => {
            setIsSidebarOpen(event.matches);
        };

        setIsSidebarOpen(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined' || typeof window === 'undefined') {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;

        if (isSidebarOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isSidebarOpen]);

    useEffect(() => {
        if (!authChecked) {
            return undefined;
        }

        setLoading(true);

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

                const previewSections = getPreviewSections(courseData);
                let completedIds = {};
                const previewLesson = getPreferredPreviewLesson(
                    courseData,
                    requestedPreviewLessonKey
                );

                const access = currentUser
                    ? await resolveCourseAccess({
                          db,
                          course: courseData,
                          user: currentUser,
                      })
                    : { enrollment: null, hasFullAccess: false };

                const enrollmentData = access.enrollment || null;
                const canPreview = previewRequested && previewSections.length > 0;
                const canOpenCourse = access.hasFullAccess || canPreview;
                const visibleCourse = access.hasFullAccess
                    ? await loadFullCourse(db, courseData)
                    : courseData;
                const normalizedSections = normalizeSections(visibleCourse.curriculum);

                setCourse(visibleCourse);

                setHasFullAccess(access.hasFullAccess);
                setAccessDenied(!canOpenCourse);
                setEnrollmentId(enrollmentData?.id || null);

                if (enrollmentData && Array.isArray(enrollmentData.completedLessonIds)) {
                    completedIds = enrollmentData.completedLessonIds.reduce(
                        (accumulator, lessonId) => ({
                            ...accumulator,
                            [lessonId]: true
                        }),
                        {}
                    );
                }

                setProgress(completedIds);

                if (!canOpenCourse) {
                    setSections([]);
                    setCurrentLesson(null);
                    return;
                }

                const visibleSections = normalizedSections;

                setSections(visibleSections);

                const allLessons = visibleSections.flatMap((section) => section.lessons || []);
                const selectableLessons = access.hasFullAccess
                    ? allLessons
                    : previewSections.flatMap((section) => section.lessons || []);

                if (selectableLessons.length > 0) {
                    const requestedLesson = selectableLessons.find(
                        (lesson) => getLessonKey(lesson) === requestedPreviewLessonKey
                    );
                    const previewStartLesson = previewLesson
                        ? selectableLessons.find(
                              (lesson) => getLessonKey(lesson) === getLessonKey(previewLesson)
                          )
                        : null;
                    const resumeLesson =
                        access.hasFullAccess && enrollmentData?.lastPlayedLessonId
                            ? selectableLessons.find(
                                  (lesson) =>
                                      getLessonKey(lesson) === enrollmentData.lastPlayedLessonId
                              )
                            : null;
                    const firstIncompleteLesson = selectableLessons.find(
                        (lesson) => !completedIds[getLessonKey(lesson)]
                    );

                    setCurrentLesson(
                        requestedLesson ||
                            previewStartLesson ||
                            resumeLesson ||
                            firstIncompleteLesson ||
                            selectableLessons[0]
                    );
                } else {
                    setCurrentLesson(null);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setAccessDenied(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authChecked, courseId, currentUser, previewRequested, requestedPreviewLessonKey]);

    const flatLessons = useMemo(
        () => sections.flatMap((section) => section.lessons || []),
        [sections]
    );

    const previewableLessonKeys = useMemo(
        () => new Set(getPreviewableLessonKeys(course)),
        [course]
    );

    const currentLessonId = currentLesson?.id || currentLesson?.videoId;

    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            activePlayerTab !== 'notes' ||
            window.innerWidth >= 768
        ) {
            return undefined;
        }

        let firstFrame = 0;
        let secondFrame = 0;

        const scrollToNotes = () => {
            const scrollContainer = document.getElementById('player-scroll-container');
            const playerTabs = document.getElementById('player-tabs');

            if (!scrollContainer || !playerTabs) return;

            // Chờ bàn phím mobile hiện ra xong (khoảng 300ms) rồi mới tính toán scroll
            setTimeout(() => {
                const containerRect = scrollContainer.getBoundingClientRect();
                const tabsRect = playerTabs.getBoundingClientRect();
                
                // Video sticky cao khoảng 200-250px trên mobile + header 64px
                const STICKY_OFFSET = 300; 
                
                const targetScroll = scrollContainer.scrollTop + (tabsRect.top - containerRect.top) - STICKY_OFFSET;

                scrollContainer.scrollTo({
                    top: Math.max(targetScroll, 0),
                    behavior: 'smooth'
                });
            }, 350);
        };

        firstFrame = window.requestAnimationFrame(scrollToNotes);

        return () => {
            window.cancelAnimationFrame(firstFrame);
            window.cancelAnimationFrame(secondFrame);
        };
    }, [activePlayerTab, currentLessonId]);

    const lessonResourceLookup = useMemo(() => {
        const lookup = {};

        sections.forEach((section, sectionIndex) => {
            const sectionId = getSectionIdentifier(section, `section-${sectionIndex}`);

            (section.lessons || []).forEach((lesson) => {
                const lessonKey = lesson.id || lesson.videoId;

                if (!lessonKey) return;

                const lessonMeta = {
                    sectionId,
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

    const sectionResourceLookup = useMemo(() => {
        const lookup = {};

        sections.forEach((section, sectionIndex) => {
            const sectionId = getSectionIdentifier(section, `section-${sectionIndex}`);

            lookup[sectionId] = {
                section,
                sectionId,
                sectionTitle: section.title || DEFAULT_SECTION_TITLE,
                firstLesson: (section.lessons || []).find(Boolean) || null
            };
        });

        return lookup;
    }, [sections]);

    const currentSectionId = currentLessonId
        ? lessonResourceLookup[currentLessonId]?.sectionId || null
        : null;

    const lessonOrderLookup = useMemo(() => {
        const lookup = {};

        sections.forEach((section, sectionIndex) => {
            (section.lessons || []).forEach((lesson, lessonIndex) => {
                const lessonMeta = {
                    sectionIndex,
                    lessonIndex
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
                        resourceScope: 'lesson',
                        sourceLabel: lesson.title || 'Tài liệu theo bài học',
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
                    const linkedSectionId = resource.linkedSectionId || resource.sectionId || null;
                    const linkedLesson = linkedLessonId ? lessonResourceLookup[linkedLessonId] : null;
                    const linkedSection = linkedLesson
                        ? sectionResourceLookup[linkedLesson.sectionId]
                        : linkedSectionId
                          ? sectionResourceLookup[linkedSectionId]
                          : null;

                    return {
                        id: resource.id || `course-resource-${index}`,
                        name: resource.name || `Tai lieu khoa hoc ${index + 1}`,
                        url: resource.url,
                        lessonTitle: linkedLesson?.lessonTitle || "",
                        sectionTitle:
                            linkedLesson?.sectionTitle ||
                            linkedSection?.sectionTitle ||
                            "Tai lieu chung",
                        lessonId: linkedLesson?.lessonId || null,
                        lesson: linkedLesson?.lesson || linkedSection?.firstLesson || null,
                        sectionId:
                            linkedLesson?.sectionId ||
                            linkedSection?.sectionId ||
                            linkedSectionId ||
                            null,
                        isGeneral: !linkedLesson && !linkedSection,
                        resourceScope: linkedLesson
                            ? 'lesson'
                            : linkedSection
                              ? 'section'
                              : 'general',
                        sourceLabel: linkedLesson?.lessonTitle
                            ? linkedLesson.lessonTitle
                            : linkedSection?.sectionTitle
                              ? linkedSection.sectionTitle
                              : linkedLessonId
                              ? "Tai lieu da gan buoi nhung buoi nay khong con ton tai"
                              : linkedSectionId
                                ? "Tai lieu da gan chuong nhung chuong nay khong con ton tai"
                              : "Tai lieu chung cua khoa hoc",
                        order: resource.sortOrder ?? index
                    };
                }),
        [course, lessonResourceLookup, sectionResourceLookup]
    );

    const allResources = useMemo(() => {
        const currentId = currentLessonId;

        return [...lessonResources, ...generalResources]
            .map((resource, index) => ({
                ...resource,
                sortIndex: index,
                isCurrentContext:
                    (resource.lessonId && resource.lessonId === currentId) ||
                    (!resource.lessonId &&
                        resource.sectionId &&
                        resource.sectionId === currentSectionId)
            }))
            .sort((resourceA, resourceB) => {
                const getPriority = (resource) => {
                    if (resource.lessonId && resource.lessonId === currentId) return 0;
                    if (!resource.lessonId && resource.sectionId === currentSectionId) return 1;
                    if (resource.isGeneral) return 2;
                    return 3;
                };

                return (
                    getPriority(resourceA) - getPriority(resourceB) ||
                    resourceA.sortIndex - resourceB.sortIndex
                );
            });
    }, [currentLessonId, currentSectionId, generalResources, lessonResources]);

    const currentContextResources = useMemo(
        () => allResources.filter((resource) => resource.isCurrentContext),
        [allResources]
    );

    const lessonResourceMap = useMemo(() => {
        const lookup = {};

        allResources.forEach((resource) => {
            if (!resource.lessonId) return;

            if (!lookup[resource.lessonId]) {
                lookup[resource.lessonId] = [];
            }

            lookup[resource.lessonId].push(resource);
        });

        return lookup;
    }, [allResources]);

    const sectionResourceMap = useMemo(() => {
        const lookup = {};

        allResources.forEach((resource) => {
            if (!resource.sectionId) return;

            if (!lookup[resource.sectionId]) {
                lookup[resource.sectionId] = [];
            }

            lookup[resource.sectionId].push(resource);
        });

        return lookup;
    }, [allResources]);

    const resourceGroups = useMemo(() => {
        const groups = [];
        const generalGroupResources = allResources.filter((resource) => resource.isGeneral);

        if (generalGroupResources.length > 0) {
            groups.push({
                key: 'general',
                title: 'Tai lieu chung cua khoa hoc',
                resources: generalGroupResources,
                count: generalGroupResources.length,
                isGeneral: true,
                isCurrentSection: false
            });
        }

        sections.forEach((section, sectionIndex) => {
            const sectionId = getSectionIdentifier(section, `section-${sectionIndex}`);
            const groupedResources = [...(sectionResourceMap[sectionId] || [])].sort(
                (resourceA, resourceB) => {
                    const lessonPositionA = resourceA.lessonId
                        ? lessonOrderLookup[resourceA.lessonId]?.lessonIndex ??
                          Number.MAX_SAFE_INTEGER
                        : -1;
                    const lessonPositionB = resourceB.lessonId
                        ? lessonOrderLookup[resourceB.lessonId]?.lessonIndex ??
                          Number.MAX_SAFE_INTEGER
                        : -1;

                    return (
                        lessonPositionA - lessonPositionB ||
                        (resourceA.order ?? resourceA.sortIndex ?? 0) -
                            (resourceB.order ?? resourceB.sortIndex ?? 0)
                    );
                }
            );

            if (groupedResources.length === 0) {
                return;
            }

            groups.push({
                key: sectionId,
                sectionId,
                title: section.title || DEFAULT_SECTION_TITLE,
                resources: groupedResources,
                count: groupedResources.length,
                isGeneral: false,
                isCurrentSection: sectionId === currentSectionId
            });
        });

        return groups;
    }, [allResources, currentSectionId, lessonOrderLookup, sectionResourceMap, sections]);

    const currentTabResources = hasFullAccess ? allResources : [];
    const sidebarResourceGroups = hasFullAccess ? resourceGroups : [];
    const sidebarLessonResourceMap = hasFullAccess ? lessonResourceMap : {};
    const sidebarSectionResourceMap = hasFullAccess ? sectionResourceMap : {};
    const sidebarCurrentContextResources = hasFullAccess ? currentContextResources : [];

    const currentLessonIndex = useMemo(() => {
        if (!currentLessonId) return -1;

        return flatLessons.findIndex(
            (lesson) => (lesson.id || lesson.videoId) === currentLessonId
        );
    }, [currentLessonId, flatLessons]);
    const currentLessonNumber = currentLessonIndex >= 0 ? currentLessonIndex + 1 : 0;
    const progressCount = Object.keys(progress).length;
    const progressPercent =
        flatLessons.length > 0 ? Math.round((progressCount / flatLessons.length) * 100) : 0;

    const openRegistrationPrompt = () => {
        setPlaying(false);
        setIsRegistrationPromptOpen(true);
    };

    const handleLessonSelect = (lesson) => {
        const lessonKey = getLessonKey(lesson);
        const canOpenLesson = hasFullAccess || previewableLessonKeys.has(lessonKey);

        if (!canOpenLesson) {
            openRegistrationPrompt();
            return false;
        }

        setCurrentLesson(lesson);
        return true;
    };

    const handleNextLesson = () => {
        const nextLesson = flatLessons[currentLessonIndex + 1];

        if (nextLesson) {
            handleLessonSelect(nextLesson);
        } else if (!hasFullAccess) {
            openRegistrationPrompt();
        }
    };

    const handlePrevLesson = () => {
        if (currentLessonIndex > 0) {
            handleLessonSelect(flatLessons[currentLessonIndex - 1]);
        }
    };

    const handleResourceFocus = (resource) => {
        if (!hasFullAccess || !resource?.id) return;

        setResourceFocusRequest({
            resourceId: resource.id,
            groupKey: resource.sectionId || (resource.isGeneral ? 'general' : null),
            requestedAt: Date.now()
        });

        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
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

    };

    const handleVideoEnded = () => {
        handleLessonComplete();

        const nextLesson = flatLessons[currentLessonIndex + 1];
        const canOpenNextLesson =
            nextLesson && previewableLessonKeys.has(getLessonKey(nextLesson));

        if (!hasFullAccess && !canOpenNextLesson) {
            openRegistrationPrompt();
        }
    };

    const handleRegisterCourse = () => {
        navigate(`/thanh-toan/${course.id}`);
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

    if (accessDenied) {
        return <Navigate to={`/khoa-hoc/${course.id}`} replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800 md:h-screen md:overflow-hidden md:bg-gray-50">
            <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-gradient-to-r from-[#B91C1C] via-[#B91C1C] to-[#991B1B] px-3 shadow-[0_4px_30px_-5px_rgba(0,0,0,0.25)] md:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6">
                    <Link
                        to={`/khoa-hoc/${course.id}`}
                        className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 p-2 text-white transition-all hover:bg-white/20 active:scale-95 md:rounded-lg md:px-3 md:py-1.5 md:text-xs md:font-extrabold md:text-white md:border md:border-white/10"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="hidden md:inline">Trang chủ khóa học</span>
                    </Link>
                    <div className="min-w-0 max-w-[140px] flex-1 md:hidden">
                        <p className="line-clamp-1 text-xs font-bold text-white">
                            {currentLesson?.title || 'Bài giảng'}
                        </p>
                    </div>
                    <div className="hidden h-6 w-px bg-red-400/50 md:block"></div>
                    <h1 className="hidden min-w-0 flex-1 line-clamp-1 text-sm font-bold text-white md:block md:max-w-lg md:text-lg">
                        {currentLesson?.title || course.name}
                    </h1>
                    {!hasFullAccess && (
                        <span className="hidden items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-black uppercase tracking-wider text-red-950 shadow-lg sm:inline-flex">
                            <PlayCircle className="h-5 w-5" /> Học thử
                        </span>
                    )}
                </div>

                <div className="ml-3 flex items-center gap-2 md:gap-4">
                    <div className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white md:hidden">
                        {currentLessonNumber}/{flatLessons.length}
                    </div>

                    <div className="mr-4 hidden items-center gap-3 md:flex">
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={handleLessonComplete}
                                className={`flex items-center gap-2.5 rounded-lg px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-all active:scale-95 ${
                                    progress[currentLessonId]
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30'
                                }`}
                            >
                                <CheckCircle className={`h-4 w-4 ${progress[currentLessonId] ? 'text-white' : 'text-white/60'}`} />
                                <span>{progress[currentLessonId] ? 'Đã hoàn thành' : 'Đã học xong'}</span>
                            </button>
                            {!progress[currentLessonId] && (
                                <span className="text-[9px] font-bold text-white/50">
                                    Học xong hãy tick vào đây
                                </span>
                            )}
                        </div>

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
                        aria-label="Mở chương học và bài tập"
                        className="inline-flex items-center gap-2 rounded-full bg-red-900/35 px-3 py-2 text-white ring-1 ring-white/10 transition-colors hover:bg-red-900 md:hidden"
                    >
                        <Menu className="h-4 w-4" />
                        <span className="text-xs font-semibold">Chương, bài tập</span>
                    </button>
                </div>
            </header>

            <div className="relative flex flex-1 md:overflow-hidden">
                {isSidebarOpen && (
                    <button
                        type="button"
                        aria-label="Đóng chương học và bài tập"
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
                    />
                )}

                <main
                    className="relative z-10 w-full min-w-0 flex-1 md:overflow-y-auto md:custom-scrollbar"
                    id="player-scroll-container"
                >
                    <div className="mx-auto max-w-[1600px] md:px-8 md:pt-8">
                        <VideoWrapper
                            videoUrl={currentLesson?.videoId}
                            title={currentLesson?.title}
                            playing={playing}
                            setPlaying={setPlaying}
                            isNotesMode={activePlayerTab === 'notes'}
                            onEnded={handleVideoEnded}
                            onNext={handleNextLesson}
                            onPrev={handlePrevLesson}
                            hasNext={
                                currentLessonIndex < flatLessons.length - 1 || !hasFullAccess
                            }
                            hasPrev={currentLessonIndex > 0}
                            isCompleted={!!progress[currentLessonId]}
                            onMarkComplete={handleLessonComplete}
                            sections={sections}
                            currentLessonId={currentLessonId}
                            onLessonSelect={handleLessonSelect}
                            isPreviewMode={!hasFullAccess}
                            previewableLessonKeys={previewableLessonKeys}
                        >
                            <div className="px-3 pb-24 md:px-0 md:pb-20">
                                {!hasFullAccess && (
                                    <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#B91C1C] to-[#7F1D1D] p-4 text-white shadow-xl md:hidden">
                                        <p className="text-xs font-bold uppercase tracking-wider text-red-100">
                                            Muốn xem toàn bộ lộ trình?
                                        </p>
                                        <p className="mt-1 text-lg font-black">
                                            Đăng ký khóa học để mở khóa {Math.max(flatLessons.length - previewableLessonKeys.size, 0)} bài còn lại
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleRegisterCourse}
                                            className="mt-3 w-full rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-[#B91C1C] shadow-lg"
                                        >
                                            Đăng ký khóa học ngay
                                        </button>
                                    </div>
                                )}
                                <PlayerTabs
                                    description={currentLesson?.description ?? ''}
                                    resources={currentTabResources}
                                    resourceGroups={sidebarResourceGroups}
                                    currentContextResources={sidebarCurrentContextResources}
                                    resourceFocusRequest={hasFullAccess ? resourceFocusRequest : null}
                                    lessonId={currentLessonId}
                                    lessonTitle={currentLesson?.title}
                                    currentUser={currentUser}
                                    hasFullAccess={hasFullAccess}
                                    onLessonSelect={handleLessonSelect}
                                    onActiveTabChange={setActivePlayerTab}
                                />
                            </div>
                        </VideoWrapper>
                    </div>
                </main>

                <aside
                    className={`
                        fixed bottom-0 right-0 top-[64px] z-30 flex w-[min(88vw,360px)] max-w-full flex-col overflow-hidden rounded-l-[28px] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300
                        md:relative md:bottom-auto md:top-auto md:z-20 md:w-96 md:translate-x-0 md:rounded-none md:shadow-xl
                        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}
                >
                    <PlayerSidebar
                        sections={sections}
                        resources={currentTabResources}
                        resourceGroups={sidebarResourceGroups}
                        lessonResourceMap={sidebarLessonResourceMap}
                        sectionResourceMap={sidebarSectionResourceMap}
                        currentContextResources={sidebarCurrentContextResources}
                        hasResourceAccess={hasFullAccess}
                        isPreviewMode={!hasFullAccess}
                        previewableLessonKeys={previewableLessonKeys}
                        registrationPrice={course.salePrice || course.price || 0}
                        originalPrice={course.salePrice ? course.price || 0 : 0}
                        currentLessonId={currentLessonId}
                        onLessonSelect={(lesson) => {
                            const lessonOpened = handleLessonSelect(lesson);
                            if (lessonOpened && window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                            }
                        }}
                        onLockedLessonSelect={openRegistrationPrompt}
                        onRegisterClick={handleRegisterCourse}
                        onResourceSelect={handleResourceFocus}
                        onClose={() => setIsSidebarOpen(false)}
                        progress={progress}
                    />
                </aside>
            </div>

            {isRegistrationPromptOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="registration-prompt-title"
                >
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
                        <button
                            type="button"
                            onClick={() => setIsRegistrationPromptOpen(false)}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                            aria-label="Đóng lời mời đăng ký"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-[#B91C1C]">
                            <LockKeyhole className="h-8 w-8" />
                        </div>
                        <p className="mt-5 text-sm font-extrabold uppercase tracking-widest text-emerald-600">
                            Bạn đã học xong phần học thử
                        </p>
                        <h2
                            id="registration-prompt-title"
                            className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl"
                        >
                            Đăng ký khóa học này để học tiếp
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
                            Mở khóa toàn bộ bài giảng, tài liệu và lộ trình học của khóa{' '}
                            <strong>{course.name}</strong>.
                        </p>

                        <div className="mt-7 space-y-3">
                            <button
                                type="button"
                                onClick={handleRegisterCourse}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef4444] px-6 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5 hover:bg-red-700"
                            >
                                Đăng ký khóa học này
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsRegistrationPromptOpen(false)}
                                className="w-full rounded-xl px-6 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                            >
                                Xem lại bài học thử
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePlayer;
