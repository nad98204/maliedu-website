import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
    ArrowUpDown,
    BadgeDollarSign,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Flame,
    Gift,
    MoveHorizontal,
    Search as SearchIcon,
    Sparkles,
    Clock,
    X as XIcon,
    Award,
    Zap,
    BookOpen
} from 'lucide-react';
import { db } from '../firebase';
import CourseCard from '../components/CourseCard';
import CourseFilter from '../components/CourseFilter';
import SEO from '../components/SEO';
import { isLeadGenerationCourse, isPublicCatalogCourse } from '../utils/courseMarketing';

const TOPIC_LIST = [
    { id: 'luat-hap-dan', name: 'Luật Hấp Dẫn' },
    { id: 'phat-trien-ban-than', name: 'Phát Triển Bản Thân' },
    { id: 'thien-chua-lanh', name: 'Thiền & Chữa Lành' },
    { id: 'tai-chinh-dong-tien', name: 'Tài Chính & Dòng Tiền' },
];

const SORT_OPTIONS = [
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price-asc', label: 'Giá thấp đến cao' },
    { value: 'price-desc', label: 'Giá cao đến thấp' },
    { value: 'title-asc', label: 'Tên A–Z' },
];

const getCourseCategories = (course) => (
    course.categories || (course.category ? [course.category] : [])
);

const getPopularityScore = (course) => (
    Number(course.enrollmentCount || 0) * 1000 +
    Number(course.fakeStudentCount || 0) * 500 +
    Number(course.views || 0)
);

const compareListingPriority = (courseA, courseB) => {
    const pinnedDifference = Number(Boolean(courseB.isPinned)) - Number(Boolean(courseA.isPinned));
    if (pinnedDifference !== 0) return pinnedDifference;

    return Number(courseB.listingPriority || 0) - Number(courseA.listingPriority || 0);
};

const getCarouselItemsPerView = () => (
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 2 : 3
);

// Component hiển thị 1 hàng khung khóa học (Row Carousel)
const CourseSectionRow = ({
    icon: Icon,
    iconColor = 'text-[#9B2528]',
    badgeText,
    badgeBg = 'bg-red-50 text-[#9B2528] border-red-100',
    title,
    description,
    courses = [],
    itemsPerView = 3,
    highlightBg = false
}) => {
    const carouselRef = useRef(null);
    const [carouselState, setCarouselState] = useState({
        activePage: 0,
        canGoBack: false,
        canGoForward: false,
    });

    const pageCount = Math.ceil(courses.length / itemsPerView);
    const hasOverflow = courses.length > itemsPerView;
    const courseSlideClass = `${courses.length === 1 ? 'mx-auto sm:mx-0 ' : ''}basis-[calc((100%_-_0.625rem)/2)] lg:basis-[calc((100%_-_2.5rem)/3)]`;

    const syncState = useCallback(() => {
        const carousel = carouselRef.current;
        if (!carousel || pageCount <= 1) {
            setCarouselState({ activePage: 0, canGoBack: false, canGoForward: false });
            return;
        }

        const maxScroll = Math.max(carousel.scrollWidth - carousel.clientWidth, 0);
        const isAtEnd = maxScroll - carousel.scrollLeft <= 3;
        const activePage = isAtEnd
            ? pageCount - 1
            : Math.min(
                Math.round(carousel.scrollLeft / Math.max(carousel.clientWidth, 1)),
                pageCount - 1,
            );

        setCarouselState({
            activePage,
            canGoBack: carousel.scrollLeft > 3,
            canGoForward: !isAtEnd,
        });
    }, [pageCount]);

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return undefined;

        carousel.scrollTo({ left: 0, behavior: 'auto' });
        const frameId = window.requestAnimationFrame(syncState);
        return () => window.cancelAnimationFrame(frameId);
    }, [courses, syncState]);

    const scroll = (direction) => {
        const carousel = carouselRef.current;
        if (!carousel) return;
        carousel.scrollBy({
            left: direction * carousel.clientWidth,
            behavior: 'smooth',
        });
    };

    const goToPage = (pageIndex) => {
        const carousel = carouselRef.current;
        if (!carousel) return;
        carousel.scrollTo({
            left: pageIndex * carousel.clientWidth,
            behavior: 'smooth',
        });
    };

    if (courses.length === 0) return null;

    return (
        <div className={`rounded-3xl p-4 sm:p-6 transition-all ${
            highlightBg
                ? 'bg-gradient-to-br from-amber-50/20 via-white to-red-50/20 border border-amber-200/70 shadow-sm'
                : 'bg-white border border-slate-200/80 shadow-sm'
        }`}>
            {/* Header of Section - Tinh gọn, Chữ khung trên to rõ */}
            <div className="mb-4 sm:mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border shadow-sm ${badgeBg}`}>
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                        <span>{badgeText}</span>
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200/60">
                        {courses.length} khóa học
                    </span>
                </div>

                {/* Arrow Controls */}
                {hasOverflow && (
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => scroll(-1)}
                            disabled={!carouselState.canGoBack}
                            aria-label="Cuộn về trước"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#9B2528]/40 hover:text-[#9B2528] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll(1)}
                            disabled={!carouselState.canGoForward}
                            aria-label="Cuộn tiếp theo"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9B2528] text-white shadow-md transition hover:bg-[#7E1E21] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Carousel Track */}
            <div className="relative">
                <div
                    ref={carouselRef}
                    onScroll={syncState}
                    className="flex snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="region"
                    aria-label={title}
                    tabIndex={hasOverflow ? 0 : -1}
                >
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className={`min-w-0 shrink-0 snap-start ${courseSlideClass}`}
                        >
                            <CourseCard
                                course={course}
                                compact
                            />
                        </div>
                    ))}
                </div>

                {/* Page Indicators */}
                {hasOverflow && pageCount > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                        {[...Array(pageCount)].map((_, pageIndex) => (
                            <button
                                type="button"
                                key={pageIndex}
                                onClick={() => goToPage(pageIndex)}
                                aria-label={`Trang ${pageIndex + 1}`}
                                className={`h-1.5 rounded-full transition-all ${
                                    carouselState.activePage === pageIndex
                                        ? 'w-6 bg-[#9B2528]'
                                        : 'w-2 bg-slate-200 hover:bg-slate-300'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortOption, setSortOption] = useState('popular');
    const [filters, setFilters] = useState({ categories: [], authors: [], prices: [] });
    const [filterResetKey, setFilterResetKey] = useState(0);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [carouselItemsPerView, setCarouselItemsPerView] = useState(getCarouselItemsPerView);

    const sortRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleResize = () => setCarouselItemsPerView(getCarouselItemsPerView());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const coursesQuery = query(
                    collection(db, 'courses'),
                    where('isPublished', '==', true),
                );
                const snapshot = await getDocs(coursesQuery);
                setCourses(snapshot.docs
                    .map((courseDoc) => ({
                        id: courseDoc.id,
                        ...courseDoc.data(),
                    }))
                    .filter(isPublicCatalogCourse));
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const coursesPerCategory = useMemo(() => {
        const categoryCounts = {};
        courses.forEach((course) => {
            getCourseCategories(course).forEach((category) => {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
        });
        return categoryCounts;
    }, [courses]);

    const visibleTopics = useMemo(
        () => TOPIC_LIST.filter((topic) => (coursesPerCategory[topic.id] || 0) > 0),
        [coursesPerCategory],
    );

    // Filter helper function
    const applySearchAndFilters = useCallback((courseList) => {
        const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('vi');

        return courseList.filter((course) => {
            const courseName = (course.name || '').toLocaleLowerCase('vi');
            if (normalizedSearchTerm && !courseName.includes(normalizedSearchTerm)) return false;

            const courseCategories = getCourseCategories(course);
            if (activeCategory !== 'all' && !courseCategories.includes(activeCategory)) return false;

            const isFree = !isLeadGenerationCourse(course)
                && (course.isForSale === false || Number(course.price || 0) === 0);
            if (priceFilter === 'free' && !isFree) return false;
            if (priceFilter === 'paid' && isFree) return false;

            if (
                filters.categories.length > 0
                && !courseCategories.some((category) => filters.categories.includes(category))
            ) return false;

            const instructor = course.instructorName || 'Mong Coaching';
            if (filters.authors.length > 0 && !filters.authors.includes(instructor)) return false;

            if (filters.prices.length > 0) {
                const showFree = filters.prices.includes('free');
                const showPaid = filters.prices.includes('paid');
                if (showFree && !showPaid && !isFree) return false;
                if (showPaid && !showFree && isFree) return false;
            }

            return true;
        });
    }, [activeCategory, filters, priceFilter, searchTerm]);

    // 1. KHÓA HỌC HOT NHẤT (Sắp xếp theo độ phổ biến, lượt xem, lượt học viên)
    const hotCourses = useMemo(() => {
        const sorted = [...courses].sort((a, b) => {
            const scoreA = getPopularityScore(a);
            const scoreB = getPopularityScore(b);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return compareListingPriority(a, b);
        });
        return applySearchAndFilters(sorted);
    }, [courses, applySearchAndFilters]);

    // 2. KHÓA HỌC ĐẶC BIỆT (Khóa học do Admin tự chỉnh / ghim / đánh dấu isSpecial / listingPriority > 0)
    const specialCourses = useMemo(() => {
        let list = courses.filter((c) => 
            c.isSpecial === true || 
            c.isPinned === true || 
            c.isFeatured === true || 
            Number(c.listingPriority || 0) > 0
        );

        // Nếu chưa có khóa học nào được đánh dấu đặc biệt thủ công, lấy các khóa học tiêu biểu
        if (list.length === 0 && courses.length > 0) {
            list = courses.slice(0, 4);
        }

        const sorted = list.sort(compareListingPriority);
        return applySearchAndFilters(sorted);
    }, [courses, applySearchAndFilters]);

    // 3. KHÓA HỌC MỚI NHẤT (Sắp xếp theo thời gian tạo mới nhất)
    const newestCourses = useMemo(() => {
        const sorted = [...courses].sort((a, b) => {
            const timeA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
            const timeB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
            return timeB - timeA;
        });
        return applySearchAndFilters(sorted);
    }, [courses, applySearchAndFilters]);

    // Danh sách toàn bộ khóa học đã lọc (khi người dùng tìm kiếm hoặc lọc chủ đề cụ thể)
    const allFilteredCourses = useMemo(() => {
        const filtered = applySearchAndFilters(courses);
        return filtered.sort((a, b) => {
            const priorityDiff = compareListingPriority(a, b);
            if (priorityDiff !== 0) return priorityDiff;

            switch (sortOption) {
                case 'popular':
                    return getPopularityScore(b) - getPopularityScore(a);
                case 'price-asc':
                    return (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0);
                case 'price-desc':
                    return (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0);
                case 'title-asc':
                    return (a.name || '').localeCompare(b.name || '', 'vi');
                case 'newest':
                default:
                    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            }
        });
    }, [courses, applySearchAndFilters, sortOption]);

    const hasActiveSearchOrTopic = Boolean(
        searchTerm.trim() ||
        activeCategory !== 'all' ||
        priceFilter !== 'all' ||
        filters.categories.length > 0 ||
        filters.authors.length > 0 ||
        filters.prices.length > 0
    );

    const resetFilters = () => {
        setSearchTerm('');
        setActiveCategory('all');
        setPriceFilter('all');
        setFilters({ categories: [], authors: [], prices: [] });
        setFilterResetKey((key) => key + 1);
    };

    const selectCategory = (categoryId) => {
        setActiveCategory(categoryId);
        document.getElementById('courses-main-content')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortOption)?.label;

    return (
        <div className="min-h-screen bg-[#F8F7F4]">
            <SEO
                title="Danh sách khóa học"
                description="Khám phá các khóa học về Luật Hấp Dẫn, Phát Triển Bản Thân và Khai Phá Tiềm Thức tại Mali Edu."
                url="/khoa-hoc"
            />

            {/* Hero Search Section - Chỉ giữ thanh tìm kiếm tinh gọn */}
            <section className="relative overflow-hidden border-b border-[#E8DED3] bg-[#FFF9EE]">
                <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#E9C7A3]/30 blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#B43B3D]/10 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 py-4 sm:py-6 lg:px-8">
                    {/* Search Box */}
                    <div className="relative mx-auto max-w-3xl">
                        <label htmlFor="course-search" className="sr-only">Tìm kiếm khóa học</label>
                        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="course-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Bạn muốn học điều gì? (Ví dụ: Thôi miên, Luật hấp dẫn, Dòng tiền...)"
                            className="h-12 sm:h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm font-bold text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none transition focus:border-[#9B2528] focus:ring-4 focus:ring-[#9B2528]/10"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Xóa từ khóa tìm kiếm"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main id="courses-main-content" className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8 lg:py-10 space-y-8">
                

                {/* Filter and Category Bar */}
                <div className="space-y-4">
                    {/* Category Tabs */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] w-full" aria-label="Lọc khóa học theo chủ đề">
                            <button
                                type="button"
                                onClick={() => selectCategory('all')}
                                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${
                                    activeCategory === 'all'
                                        ? 'border-[#9B2528] bg-[#9B2528] text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#9B2528]/40 hover:text-[#9B2528]'
                                }`}
                            >
                                Tất cả
                                {!loading && <span className="opacity-70">{courses.length}</span>}
                            </button>
                            {visibleTopics.map((topic) => (
                                <button
                                    type="button"
                                    key={topic.id}
                                    onClick={() => selectCategory(topic.id)}
                                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${
                                        activeCategory === topic.id
                                            ? 'border-[#9B2528] bg-[#9B2528] text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-[#9B2528]/40 hover:text-[#9B2528]'
                                    }`}
                                >
                                    {topic.name}
                                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                        activeCategory === topic.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {coursesPerCategory[topic.id] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Secondary Filter Row */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        {/* Price Filters */}
                        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                            <button
                                type="button"
                                onClick={() => setPriceFilter('all')}
                                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                                    priceFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                Tất cả mức giá
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                                    priceFilter === 'free' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                                <Gift className="h-3.5 w-3.5" /> Miễn phí
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriceFilter(priceFilter === 'paid' ? 'all' : 'paid')}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                                    priceFilter === 'paid' ? 'bg-[#9B2528] text-white' : 'bg-[#FFF1F1] text-[#9B2528] hover:bg-[#FDE3E3]'
                                }`}
                            >
                                <BadgeDollarSign className="h-3.5 w-3.5" /> Trả phí
                            </button>
                        </div>

                        {/* Search Status & Reset Button */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            {hasActiveSearchOrTopic && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-100 transition-colors"
                                >
                                    <XIcon className="h-3.5 w-3.5" />
                                    <span>Xóa lọc (Xem 3 khung)</span>
                                </button>
                            )}

                            {/* Sort Dropdown (when searching/filtering) */}
                            {hasActiveSearchOrTopic && (
                                <div className="relative" ref={sortRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsSortOpen((open) => !open)}
                                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-[#9B2528]/40"
                                    >
                                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{currentSortLabel}</span>
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isSortOpen && (
                                        <div className="absolute right-0 top-full z-30 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl">
                                            {SORT_OPTIONS.map((option) => (
                                                <button
                                                    type="button"
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortOption(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full px-3.5 py-2 text-left text-xs font-black transition ${
                                                        sortOption === option.value ? 'bg-[#FFF1F1] text-[#9B2528]' : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                {loading ? (
                    /* Loading Skeleton */
                    <div className="space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 animate-pulse">
                                <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
                                <div className="h-4 w-72 bg-slate-100 rounded mb-6" />
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className="h-64 bg-slate-100 rounded-2xl" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasActiveSearchOrTopic ? (
                    /* FILTERED / SEARCH RESULTS VIEW */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    {searchTerm
                                        ? `Kết quả tìm kiếm cho "${searchTerm}"`
                                        : activeCategory !== 'all'
                                            ? `Chủ đề: ${TOPIC_LIST.find((t) => t.id === activeCategory)?.name || activeCategory}`
                                            : 'Kết quả lọc khóa học'}
                                </h2>
                                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                                    Tìm thấy {allFilteredCourses.length} khóa học phù hợp
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs font-bold text-[#9B2528] hover:underline"
                            >
                                Quay lại xem 3 khung
                            </button>
                        </div>

                        {allFilteredCourses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {allFilteredCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        compact
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <SearchIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-lg font-black text-slate-900">
                                    Chưa tìm thấy khóa học phù hợp
                                </h3>
                                <p className="mt-2 text-sm font-medium text-slate-500 max-w-md mx-auto">
                                    Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục khóa học.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-5 rounded-xl bg-[#9B2528] px-6 py-2.5 text-sm font-black text-white hover:bg-[#7E1E21] shadow-sm transition-all"
                                >
                                    Xem tất cả khóa học
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* DEFAULT 3-FRAME VIEW (THE 3 SECTIONS REQUESTED BY USER) */
                    <div className="space-y-8">
                        
                        {/* 1. KHUNG 1: KHÓA HỌC HOT NHẤT */}
                        <section aria-labelledby="hot-courses-heading">
                            <CourseSectionRow
                                icon={Flame}
                                badgeText="HOT & BÁN CHẠY"
                                badgeBg="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-300/80"
                                courses={hotCourses}
                                itemsPerView={carouselItemsPerView}
                            />
                        </section>

                        {/* 2. KHUNG 2: KHÓA HỌC ĐẶC BIỆT (TỰ CHỈNH / GHIM / TUYỂN CHỌN) */}
                        <section aria-labelledby="special-courses-heading">
                            <CourseSectionRow
                                icon={Sparkles}
                                badgeText="ĐẶC BIỆT & TUYỂN CHỌN"
                                badgeBg="bg-gradient-to-r from-red-50 to-amber-50 text-[#9B2528] border-red-200"
                                courses={specialCourses}
                                itemsPerView={carouselItemsPerView}
                                highlightBg={true}
                            />
                        </section>

                        {/* 3. KHUNG 3: KHÓA HỌC MỚI NHẤT */}
                        <section aria-labelledby="newest-courses-heading">
                            <CourseSectionRow
                                icon={Clock}
                                badgeText="MỚI RA MẮT"
                                badgeBg="bg-gradient-to-r from-blue-50 to-slate-50 text-blue-800 border-blue-200"
                                courses={newestCourses}
                                itemsPerView={carouselItemsPerView}
                            />
                        </section>

                    </div>
                )}
            </main>
        </div>
    );
};

export default CourseList;
