import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, query, collection, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ArrowLeft, Menu, Star, CheckCircle, ChevronLeft } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import VideoWrapper from '../components/VideoWrapper';
import PlayerTabs from '../components/PlayerTabs';
import PlayerSidebar from '../components/PlayerSidebar';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [enrollmentId, setEnrollmentId] = useState(null);

    // Player State
    const [playing, setPlaying] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Progress State { lessonId: true }
    const [progress, setProgress] = useState({});

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Anti-Theft Protection
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();

        const handleKeyDown = (e) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Fetch Course & Enrollment Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Course
                let docRef = doc(db, 'courses', courseId);
                let docSnap = await getDoc(docRef);
                let courseData = null;

                if (docSnap.exists()) {
                    courseData = { id: docSnap.id, ...docSnap.data() };
                } else {
                    // Fetch by Slug
                    const q = query(collection(db, 'courses'), where('slug', '==', courseId));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        courseData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                    }
                }

                if (courseData) {
                    setCourse(courseData);

                    // Normalize Sections
                    let normalizedSections = [];
                    if (courseData.curriculum && courseData.curriculum.length > 0) {
                        if (courseData.curriculum[0].lessons) {
                            normalizedSections = courseData.curriculum;
                        } else {
                            normalizedSections = [{ title: "Nội dung khóa học", lessons: courseData.curriculum }];
                        }
                    }
                    setSections(normalizedSections);

                    // 2. Fetch Enrollment (Progress)
                    let completedIds = {};
                    if (currentUser) {
                        const enrollQ = query(
                            collection(db, 'enrollments'),
                            where('userId', '==', currentUser.uid),
                            where('courseId', '==', courseData.id)
                        );
                        const enrollSnap = await getDocs(enrollQ);
                        if (!enrollSnap.empty) {
                            const enrollData = enrollSnap.docs[0].data();
                            setEnrollmentId(enrollSnap.docs[0].id);

                            if (enrollData.completedLessonIds && Array.isArray(enrollData.completedLessonIds)) {
                                enrollData.completedLessonIds.forEach(id => completedIds[id] = true);
                                setProgress(completedIds);
                            }
                        }
                    }

                    // 3. Resume Learning Logic (Find first incomplete lesson)
                    const allLessons = normalizedSections.flatMap(s => s.lessons || []);
                    if (allLessons.length > 0) {
                        // Find first lesson that is NOT in completedIds
                        const firstIncomplete = allLessons.find(l => !completedIds[l.id || l.videoId]);

                        if (firstIncomplete) {
                            setCurrentLesson(firstIncomplete);
                        } else {
                            // If all completed, or none, start at first
                            setCurrentLesson(allLessons[0]);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, currentUser]);

    // Navigation Logic
    const flatLessons = useMemo(() => {
        return sections.flatMap(section => section.lessons || []);
    }, [sections]);

    const currentLessonIndex = useMemo(() => {
        if (!currentLesson) return -1;
        return flatLessons.findIndex(l => l.id === currentLesson.id || l.videoId === currentLesson.videoId); // Fallback to videoId if id missing
    }, [currentLesson, flatLessons]);

    const handleNextLesson = () => {
        if (currentLessonIndex < flatLessons.length - 1) {
            setCurrentLesson(flatLessons[currentLessonIndex + 1]);
        }
    };

    const handlePrevLesson = () => {
        if (currentLessonIndex > 0) {
            setCurrentLesson(flatLessons[currentLessonIndex - 1]);
        }
    };

    const handleLessonComplete = async () => {
        if (currentLesson && enrollmentId) {
            const lessonId = currentLesson.id || currentLesson.videoId;
            const isCompleted = !!progress[lessonId];

            // 1. Update Local State
            setProgress(prev => {
                const newProgress = { ...prev };
                if (isCompleted) {
                    delete newProgress[lessonId];
                } else {
                    newProgress[lessonId] = true;
                }
                return newProgress;
            });

            // 2. Update Firestore
            try {
                const enrollRef = doc(db, 'enrollments', enrollmentId);
                if (isCompleted) {
                    // Un-complete
                    await updateDoc(enrollRef, {
                        completedLessonIds: arrayRemove(lessonId)
                    });
                } else {
                    // Complete
                    await updateDoc(enrollRef, {
                        completedLessonIds: arrayUnion(lessonId),
                        lastPlayedLessonId: lessonId,
                        lastAccessedAt: Date.now()
                    });
                }
            } catch (error) {
                console.error("Error saving progress:", error);
            }

            // Only auto-play if we just COMPLETED it (was not completed before)
            if (!isCompleted && autoPlay) {
                handleNextLesson();
            }
        }
    };

    if (loading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f15] text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secret-wax"></div>
        </div>
    );

    if (!course) return <Navigate to="/khoa-hoc" />;

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden text-slate-800">

            {/* 1. HEADER */}
            <header className="h-16 bg-[#B91C1C] border-b border-red-800/20 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 shadow-md">
                <div className="flex items-center gap-6">
                    <Link to={`/khoa-hoc/${course.id}`} className="text-red-100 hover:text-white transition-colors flex items-center gap-2 font-bold text-sm">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Trang chủ khóa học</span>
                    </Link>
                    <div className="h-6 w-px bg-red-400/50 hidden md:block"></div>
                    <h1 className="font-bold text-white text-base md:text-lg line-clamp-1 max-w-[200px] md:max-w-lg">
                        {currentLesson?.title || course.name}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Progress Circle (Desktop) */}
                    <div className="hidden md:flex items-center gap-3 mr-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white/90">Đã hoàn thành</span>
                            <span className="text-xs text-red-100">{Object.keys(progress).length}/{flatLessons.length} bài học</span>
                        </div>
                        <div className="relative w-10 h-10">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-red-900/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className="text-white" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"
                                    strokeDasharray={`${(Object.keys(progress).length / flatLessons.length) * 100}, 100`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {Math.round((Object.keys(progress).length / flatLessons.length) * 100)}%
                            </div>
                        </div>
                    </div>

                    <button className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-red-400 bg-red-800/20 rounded-lg text-xs font-bold text-red-100 hover:text-white hover:bg-red-800/40 transition-all">
                        <Star className="w-3 h-3" /> Đánh giá
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors md:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* 2. BODY CONTAINER */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* LEFT: MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth relative z-10" id="player-scroll-container">
                    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">

                        {/* Video Player Area */}
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
                            isCompleted={!!progress[currentLesson?.id || currentLesson?.videoId]}
                            onMarkComplete={handleLessonComplete}
                        />

                        {/* Tabs & Content */}
                        <PlayerTabs
                            description={currentLesson?.description || course.description}
                            resources={currentLesson?.resourceLink ? [{ name: currentLesson.resourceName || "Tài liệu bài học", url: currentLesson.resourceLink }] : []}
                            lessonId={currentLesson?.id || currentLesson?.videoId}
                            currentUser={currentUser}
                        />

                    </div>
                </main>

                {/* RIGHT: SIDEBAR */}
                <aside className={`
                    w-full md:w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col z-20
                    fixed top-[64px] bottom-0 right-0 transition-transform duration-300
                    md:relative md:top-auto md:bottom-auto md:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <PlayerSidebar
                        sections={sections}
                        currentLessonId={currentLesson?.id || currentLesson?.videoId} // Fallback ID
                        onLessonSelect={(lesson) => {
                            setCurrentLesson(lesson);
                            if (window.innerWidth < 768) setIsSidebarOpen(false); // Close on mobile select
                        }}
                        progress={progress}
                    />
                </aside>
            </div>
        </div>
    );
};

export default CoursePlayer;
