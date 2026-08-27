import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Play,
    PlayCircle,
    Award,
    BookOpen,
    Clock,
    FileText,
    PenTool,
    CheckCircle2,
    Sparkles,
    Search,
    RotateCcw,
    Flame,
    SlidersHorizontal,
    X,
    GraduationCap,
    ArrowRight,
    TrendingUp,
    ShieldAlert
} from "lucide-react";

import { db, auth } from "../firebase";
import { ensureUserProfile } from "../utils/userService";
import { loadFullCourse } from "../utils/courseContentService";

// Component hiển thị hình ảnh an toàn, có fallback thương hiệu sang trọng khi ảnh lỗi hoặc thiếu URL
const CourseThumbnail = ({ src, alt, title }) => {
    const [imgError, setImgError] = useState(false);

    if (!src || imgError) {
        return (
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-slate-900 via-[#8B2E2E] to-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
                {/* Decorative background glow circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
                
                {/* Brand Monogram Icon */}
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner">
                    <GraduationCap className="w-6 h-6 text-amber-300" />
                </div>
                
                <span className="text-[10px] font-black tracking-widest uppercase text-amber-300/80 mb-1">
                    MaliEdu Academy
                </span>
                <p className="text-sm font-bold text-white line-clamp-2 px-2 leading-snug drop-shadow-sm">
                    {title || "Khóa Học Trực Tuyến"}
                </p>
            </div>
        );
    }

    return (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
            <img
                src={src}
                alt={alt || "Khóa học"}
                loading="lazy"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Subtle Vignette gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
        </div>
    );
};

// Shimmer Skeleton Loader
const MyCoursesSkeleton = () => {
    return (
        <div className="min-h-screen bg-slate-50/80 pt-8 pb-32 md:pt-24 md:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header Skeleton */}
                <div className="mb-10 rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-pulse">
                    <div className="h-4 w-28 bg-slate-200 rounded mb-3" />
                    <div className="h-8 w-64 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-96 bg-slate-200 rounded" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
                        ))}
                    </div>
                </div>

                {/* Cards Skeleton */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col">
                            <div className="aspect-[16/9] bg-slate-200" />
                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-20 bg-slate-200 rounded" />
                                    <div className="h-6 w-full bg-slate-200 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-slate-200 rounded" />
                                    <div className="h-10 w-full bg-slate-200 rounded-xl" />
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="h-9 bg-slate-200 rounded-xl" />
                                        <div className="h-9 bg-slate-200 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, in-progress, completed, not-started
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("recent"); // recent, progress-desc, progress-asc, name-asc

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                ensureUserProfile({ db, user: currentUser }).catch(() => { });
                fetchMyCourses(currentUser);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchMyCourses = async (currentUser) => {
        try {
            const enrollmentMap = {};
            if (currentUser?.uid) {
                const byUidSnap = await getDocs(
                    query(collection(db, "enrollments"), where("userId", "==", currentUser.uid))
                );
                byUidSnap.docs.forEach(d => {
                    const data = d.data();
                    enrollmentMap[data.courseId] = data;
                });
            }

            if (currentUser?.email) {
                const byEmailSnap = await getDocs(
                    query(collection(db, "enrollments"), where("userEmail", "==", currentUser.email))
                );
                byEmailSnap.docs.forEach(d => {
                    const data = d.data();
                    if (!enrollmentMap[data.courseId]) {
                        enrollmentMap[data.courseId] = data;
                    }
                });
            }

            const courseIds = Object.keys(enrollmentMap);

            if (courseIds.length === 0) {
                setCourses([]);
                setLoading(false);
                return;
            }

            const coursePromises = courseIds.map(id => getDoc(doc(db, "courses", id)));
            const courseSnapshots = await Promise.all(coursePromises);

            const coursesData = await Promise.all(
                courseSnapshots
                    .filter(snap => snap.exists())
                    .map(async (snap) => {
                        const publicCourse = { id: snap.id, ...snap.data() };
                        let cData = publicCourse;
                        try {
                            cData = await loadFullCourse(db, publicCourse);
                        } catch {
                            cData = publicCourse;
                        }

                        const enrollment = enrollmentMap[cData.id];

                        let completedCount = 0;
                        if (enrollment && enrollment.completedLessonIds) {
                            completedCount = enrollment.completedLessonIds.length;
                        }

                        let totalLessons = 0;
                        if (cData.curriculum) {
                            if (cData.curriculum.length > 0 && cData.curriculum[0].lessons) {
                                cData.curriculum.forEach(s => totalLessons += (s.lessons?.length || 0));
                            } else {
                                totalLessons = cData.curriculum.length;
                            }
                        }

                        const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

                        return {
                            ...cData,
                            progressPercent,
                            totalLessons,
                            completedCount,
                            enrollmentDate: enrollment?.createdAt?.toDate
                                ? enrollment.createdAt.toDate()
                                : (enrollment?.createdAt ? new Date(enrollment.createdAt) : new Date())
                        };
                    })
            );

            setCourses(coursesData);
        } catch (error) {
            console.error("Error fetching my courses:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistical metrics
    const stats = useMemo(() => {
        const total = courses.length;
        const inProgress = courses.filter(c => c.progressPercent > 0 && c.progressPercent < 100).length;
        const completed = courses.filter(c => c.progressPercent === 100).length;
        const notStarted = courses.filter(c => c.progressPercent === 0).length;
        const avgProgress = total > 0
            ? Math.round(courses.reduce((acc, c) => acc + (c.progressPercent || 0), 0) / total)
            : 0;

        return { total, inProgress, completed, notStarted, avgProgress };
    }, [courses]);

    // Filter and sort courses
    const filteredCourses = useMemo(() => {
        let list = [...courses];

        // Search filter
        if (searchQuery.trim()) {
            const queryNorm = searchQuery.trim().toLowerCase();
            list = list.filter(c => 
                (c.name && c.name.toLowerCase().includes(queryNorm)) ||
                (c.category && c.category.toLowerCase().includes(queryNorm))
            );
        }

        // Tab filter
        if (activeTab === 'in-progress') {
            list = list.filter(c => c.progressPercent > 0 && c.progressPercent < 100);
        } else if (activeTab === 'completed') {
            list = list.filter(c => c.progressPercent === 100);
        } else if (activeTab === 'not-started') {
            list = list.filter(c => c.progressPercent === 0);
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === 'progress-desc') {
                return b.progressPercent - a.progressPercent;
            }
            if (sortBy === 'progress-asc') {
                return a.progressPercent - b.progressPercent;
            }
            if (sortBy === 'name-asc') {
                return (a.name || "").localeCompare(b.name || "", 'vi');
            }
            // default recent
            const dateA = a.enrollmentDate ? new Date(a.enrollmentDate).getTime() : 0;
            const dateB = b.enrollmentDate ? new Date(b.enrollmentDate).getTime() : 0;
            return dateB - dateA;
        });

        return list;
    }, [courses, activeTab, searchQuery, sortBy]);

    if (loading) {
        return <MyCoursesSkeleton />;
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-28 pb-20 px-4 bg-slate-50/70 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-8 ring-red-50/50">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Yêu cầu đăng nhập</h2>
                    <p className="mt-2 text-sm text-slate-600 mb-6 leading-relaxed">
                        Bạn cần đăng nhập tài khoản học viên để truy cập kho khóa học và tiếp tục lộ trình học tập của mình.
                    </p>
                    <Link
                        to="/admin/login"
                        className="w-full py-3.5 bg-gradient-to-r from-[#8B2E2E] to-red-700 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-900/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>Đăng nhập ngay</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/70 pt-6 pb-28 md:pt-24 md:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* Hero Dashboard Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/40 border border-slate-200/80 p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)]">
                    {/* Subtle decorative brand glows */}
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-[#8B2E2E] text-xs font-black uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>Học Viện Trực Tuyến MaliEdu</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                                Khóa học của tôi
                            </h1>
                            <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
                                Xin chào, <span className="font-bold text-slate-900">{user?.displayName || user?.email?.split('@')[0] || "Học viên"}</span>! Chúc bạn có những giờ học hiệu quả và bứt phá mục tiêu.
                            </p>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-slate-200/60 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-500">Khóa học</span>
                                    <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                                        <BookOpen className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</span>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-slate-200/60 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-500">Đang học</span>
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Flame className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.inProgress}</span>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-slate-200/60 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-500">Hoàn thành</span>
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Award className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.completed}</span>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-slate-200/60 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-500">Tiến độ TB</span>
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.avgProgress}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search, Filter Tabs & Sort Controls */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        
                        {/* Segmented Filter Tabs */}
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === 'all'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <span>Tất cả</span>
                                <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-bold ${
                                    activeTab === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {stats.total}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('in-progress')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === 'in-progress'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50/50'
                                }`}
                            >
                                <span>Đang học</span>
                                <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-bold ${
                                    activeTab === 'in-progress' ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {stats.inProgress}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === 'completed'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                                }`}
                            >
                                <span>Đã hoàn thành</span>
                                <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-bold ${
                                    activeTab === 'completed' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {stats.completed}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('not-started')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === 'not-started'
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <span>Chưa học</span>
                                <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-bold ${
                                    activeTab === 'not-started' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {stats.notStarted}
                                </span>
                            </button>
                        </div>

                        {/* Search & Sort Group */}
                        <div className="flex items-center gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm khóa học của bạn..."
                                    className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all shadow-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 shadow-sm cursor-pointer"
                                >
                                    <option value="recent">Gần đây nhất</option>
                                    <option value="progress-desc">Tiến độ cao nhất</option>
                                    <option value="progress-asc">Tiến độ thấp nhất</option>
                                    <option value="name-asc">Tên khóa (A-Z)</option>
                                </select>
                                <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Grid */}
                {filteredCourses.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCourses.map((course) => {
                            const isCompleted = course.progressPercent === 100;
                            const isInProgress = course.progressPercent > 0 && course.progressPercent < 100;

                            return (
                                <div
                                    key={course.id}
                                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-12px_rgba(139,46,46,0.12)] hover:border-red-200 transition-all duration-300 hover:-translate-y-1"
                                >
                                    {/* Top Image / Media Area */}
                                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                                        <CourseThumbnail
                                            src={course.thumbnailUrl}
                                            alt={course.name}
                                            title={course.name}
                                        />

                                        {/* Status Badge (Top-Left) */}
                                        <div className="absolute top-3 left-3 z-10">
                                            {isCompleted ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> HOÀN THÀNH
                                                </span>
                                            ) : isInProgress ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-500 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                                                    <Flame className="w-3.5 h-3.5" /> ĐANG HỌC
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/85 px-3 py-1 text-xs font-bold text-slate-100 shadow-sm backdrop-blur-md">
                                                    <PlayCircle className="w-3.5 h-3.5 text-amber-400" /> CHƯA HỌC
                                                </span>
                                            )}
                                        </div>

                                        {/* Total Lessons Badge (Top-Right) */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur-md">
                                                <BookOpen className="w-3 h-3 text-amber-300" />
                                                {course.totalLessons} bài học
                                            </span>
                                        </div>

                                        {/* Center Hover Play Icon Overlay */}
                                        <Link
                                            to={`/bai-giang/${course.id}`}
                                            className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/35 backdrop-blur-[2px]"
                                            aria-label={`Vào học khóa ${course.name}`}
                                        >
                                            <div className="w-13 h-13 rounded-full bg-white text-[#8B2E2E] shadow-2xl flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                                <Play className="w-6 h-6 fill-current ml-0.5" />
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Card Content Area */}
                                    <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between gap-5">
                                        <div className="space-y-2">
                                            {course.category && (
                                                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#8B2E2E] bg-red-50 border border-red-100/80 px-2.5 py-0.5 rounded-md">
                                                    {course.category}
                                                </span>
                                            )}
                                            <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#8B2E2E] transition-colors" title={course.name}>
                                                <Link to={`/bai-giang/${course.id}`}>
                                                    {course.name}
                                                </Link>
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Progress Section */}
                                            <div className="space-y-2 bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                                                <div className="flex items-center justify-between text-xs font-semibold">
                                                    <span className="text-slate-600 flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        {isCompleted
                                                            ? 'Đã hoàn thành toàn bộ'
                                                            : `${course.completedCount}/${course.totalLessons} bài học`}
                                                    </span>
                                                    <span className={`font-black ${
                                                        isCompleted ? 'text-emerald-600' : isInProgress ? 'text-amber-600' : 'text-slate-500'
                                                    }`}>
                                                        {course.progressPercent}%
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 p-0.5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                            isCompleted
                                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                                                : isInProgress
                                                                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600'
                                                                    : 'bg-slate-300'
                                                        }`}
                                                        style={{ width: `${Math.max(course.progressPercent, 4)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="space-y-2 pt-1">
                                                {/* Primary CTA */}
                                                {isCompleted ? (
                                                    <Link
                                                        to={`/bai-giang/${course.id}`}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
                                                    >
                                                        <RotateCcw className="w-4 h-4 text-emerald-400" />
                                                        <span>ÔN TẬP / XEM LẠI</span>
                                                    </Link>
                                                ) : isInProgress ? (
                                                    <Link
                                                        to={`/bai-giang/${course.id}`}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
                                                    >
                                                        <PlayCircle className="w-4 h-4" />
                                                        <span>TIẾP TỤC HỌC</span>
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/bai-giang/${course.id}`}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#8B2E2E] to-red-600 hover:from-red-800 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-[0.98]"
                                                    >
                                                        <Play className="w-4 h-4 fill-current" />
                                                        <span>VÀO HỌC NGAY</span>
                                                    </Link>
                                                )}

                                                {/* Secondary Quick Action Row (Tài liệu & Ghi chép) */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link
                                                        to={`/tai-lieu/${course.id}`}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
                                                    >
                                                        <FileText className="w-4 h-4 text-red-600" />
                                                        <span>Tài Liệu</span>
                                                    </Link>
                                                    <Link
                                                        to={`/ghi-chep/${course.id}`}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
                                                    >
                                                        <PenTool className="w-4 h-4 text-amber-600" />
                                                        <span>Ghi Chép</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty States */
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
                            {searchQuery ? (
                                <Search className="h-8 w-8" />
                            ) : (
                                <GraduationCap className="h-8 w-8 text-[#8B2E2E]" />
                            )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900">
                            {searchQuery
                                ? `Không tìm thấy khóa học phù hợp với "${searchQuery}"`
                                : activeTab === 'in-progress'
                                    ? 'Hiện tại không có khóa học nào đang học'
                                    : activeTab === 'completed'
                                        ? 'Bạn chưa hoàn thành khóa học nào'
                                        : activeTab === 'not-started'
                                            ? 'Bạn đã bắt đầu tất cả các khóa học'
                                            : 'Bạn chưa đăng ký khóa học nào'}
                        </h3>
                        
                        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                            {searchQuery
                                ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc chọn bộ lọc khác để xem danh sách khóa học.'
                                : 'Khám phá ngay hàng trăm bài giảng chất lượng cao được thiết kế bài bản tại MaliEdu để nâng cao kỹ năng và bứt phá mục tiêu.'}
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                            {searchQuery ? (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveTab("all");
                                    }}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
                                >
                                    Xóa bộ lọc tìm kiếm
                                </button>
                            ) : (
                                <Link
                                    to="/khoa-hoc"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8B2E2E] to-red-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-red-900/20 transition-all group"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    <span>Khám phá khóa học mới</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MyCourses;
