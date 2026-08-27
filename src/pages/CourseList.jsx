import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
    ArrowUpDown,
    BadgeDollarSign,
    ChevronDown,
    Filter,
    Gift,
    Search as SearchIcon,
    X as XIcon,
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
    Number(course.enrollmentCount || 0) * 1000 + Number(course.views || 0)
);

const compareListingPriority = (courseA, courseB) => {
    const pinnedDifference = Number(Boolean(courseB.isPinned)) - Number(Boolean(courseA.isPinned));
    if (pinnedDifference !== 0) return pinnedDifference;

    return Number(courseB.listingPriority || 0) - Number(courseA.listingPriority || 0);
};

const getInitialVisibleCount = () => (
    typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 12
);

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortOption, setSortOption] = useState('popular');
    const [visibleCount, setVisibleCount] = useState(getInitialVisibleCount);
    const [filters, setFilters] = useState({ categories: [], authors: [], prices: [] });
    const [filterResetKey, setFilterResetKey] = useState(0);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
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

    const filteredCourses = useMemo(() => {
        const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('vi');
        const result = courses.filter((course) => {
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

        return result.sort((a, b) => {
            const priorityDifference = compareListingPriority(a, b);
            if (priorityDifference !== 0) return priorityDifference;

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
    }, [activeCategory, courses, filters, priceFilter, searchTerm, sortOption]);

    useEffect(() => {
        setVisibleCount(getInitialVisibleCount());
    }, [activeCategory, filters, priceFilter, searchTerm, sortOption]);

    const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortOption)?.label;
    const hasAdvancedFilter = filters.categories.length > 0
        || filters.authors.length > 0
        || filters.prices.length > 0;
    const hasActiveFilter = Boolean(
        searchTerm
        || activeCategory !== 'all'
        || priceFilter !== 'all'
        || hasAdvancedFilter,
    );
    const showAdvancedFilters = courses.length >= 4;
    const visibleCourses = filteredCourses.slice(0, visibleCount);
    const remainingCourseCount = Math.max(filteredCourses.length - visibleCourses.length, 0);
    const gridClass = filteredCourses.length === 1
        ? 'grid-cols-1'
        : filteredCourses.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

    const resetFilters = () => {
        setSearchTerm('');
        setActiveCategory('all');
        setPriceFilter('all');
        setFilters({ categories: [], authors: [], prices: [] });
        setFilterResetKey((key) => key + 1);
    };

    const selectCategory = (categoryId) => {
        setActiveCategory(categoryId);
        document.getElementById('all-courses-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <div className="min-h-screen bg-[#F8F7F4]">
            <SEO
                title="Danh sách khóa học"
                description="Khám phá các khóa học về Luật Hấp Dẫn, Phát Triển Bản Thân và Khai Phá Tiềm Thức tại Mali Edu."
                url="/khoa-hoc"
            />

            <section className="relative overflow-hidden border-b border-[#E8DED3] bg-[#FFF9EE]">
                <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#E9C7A3]/30 blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#B43B3D]/10 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                    <div className="hidden text-center sm:block">
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
                            Khám phá khóa học phù hợp với bạn
                        </h1>
                        <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                            Học thử miễn phí trước khi đăng ký.
                        </p>
                    </div>

                    <div className="relative mx-auto max-w-3xl sm:mt-6">
                        <label htmlFor="course-search" className="sr-only">Tìm kiếm khóa học</label>
                        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="course-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Bạn muốn học điều gì?"
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm font-bold text-slate-800 shadow-[0_12px_35px_rgba(15,23,42,0.08)] outline-none transition focus:border-[#9B2528] focus:ring-4 focus:ring-[#9B2528]/10"
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

            <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
                <section id="all-courses-section" aria-labelledby="all-courses-title" className="scroll-mt-24">
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 id="all-courses-title" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                {activeCategory === 'all'
                                    ? 'Khóa học dành cho bạn'
                                    : TOPIC_LIST.find((topic) => topic.id === activeCategory)?.name}
                            </h2>
                            <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                                {loading ? 'Đang tải…' : `${filteredCourses.length} khóa học`}
                            </span>
                        </div>

                        {(loading || visibleTopics.length > 0) && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Lọc khóa học theo chủ đề">
                                <button
                                    type="button"
                                    onClick={() => selectCategory('all')}
                                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${activeCategory === 'all' ? 'border-[#9B2528] bg-[#9B2528] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#9B2528]/40 hover:text-[#9B2528]'}`}
                                >
                                    Tất cả
                                    {!loading && <span className="opacity-70">{courses.length}</span>}
                                </button>
                                {loading ? (
                                    [...Array(3)].map((_, index) => <div key={index} className="h-9 w-32 shrink-0 animate-pulse rounded-xl bg-slate-200" />)
                                ) : visibleTopics.map((topic) => (
                                    <button
                                        type="button"
                                        key={topic.id}
                                        onClick={() => selectCategory(topic.id)}
                                        className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${activeCategory === topic.id ? 'border-[#9B2528] bg-[#9B2528] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#9B2528]/40 hover:text-[#9B2528]'}`}
                                    >
                                        {topic.name}
                                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${activeCategory === topic.id ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>
                                            {coursesPerCategory[topic.id]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                            <button
                                type="button"
                                onClick={() => setPriceFilter('all')}
                                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition ${priceFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                                Tất cả mức giá
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition ${priceFilter === 'free' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                                <Gift className="h-3.5 w-3.5" /> Miễn phí
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriceFilter(priceFilter === 'paid' ? 'all' : 'paid')}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition ${priceFilter === 'paid' ? 'bg-[#9B2528] text-white' : 'bg-[#FFF1F1] text-[#9B2528] hover:bg-[#FDE3E3]'}`}
                            >
                                <BadgeDollarSign className="h-3.5 w-3.5" /> Trả phí
                            </button>
                        </div>

                        <div className="flex items-stretch gap-2">
                            {showAdvancedFilters && (
                                <button
                                    type="button"
                                    onClick={() => setIsMobileFilterOpen((open) => !open)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 lg:hidden"
                                    aria-expanded={isMobileFilterOpen}
                                >
                                    <Filter className="h-4 w-4" /> Bộ lọc
                                </button>
                            )}

                            <div className="relative flex-1 sm:flex-none" ref={sortRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsSortOpen((open) => !open)}
                                    className="flex h-full w-full min-w-[170px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:border-[#9B2528]/40"
                                    aria-haspopup="listbox"
                                    aria-expanded={isSortOpen}
                                >
                                    <span className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />{currentSortLabel}</span>
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSortOpen && (
                                    <div className="absolute right-0 top-full z-30 mt-2 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl" role="listbox">
                                        {SORT_OPTIONS.map((option) => (
                                            <button
                                                type="button"
                                                key={option.value}
                                                onClick={() => {
                                                    setSortOption(option.value);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full whitespace-nowrap px-4 py-2.5 text-left text-xs font-black transition ${sortOption === option.value ? 'bg-[#FFF1F1] text-[#9B2528]' : 'text-slate-600 hover:bg-slate-50'}`}
                                                role="option"
                                                aria-selected={sortOption === option.value}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50"
                                >
                                    <XIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Xóa lọc</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {showAdvancedFilters && isMobileFilterOpen && (
                        <div className="mb-6 lg:hidden">
                            <CourseFilter key={`mobile-${filterResetKey}`} onFilterChange={setFilters} courses={courses} />
                        </div>
                    )}

                    <div className={`grid grid-cols-1 gap-7 ${showAdvancedFilters ? 'lg:grid-cols-[minmax(0,1fr)_260px]' : ''}`}>
                        <div className={`grid content-start gap-7 ${gridClass}`}>
                            {loading ? (
                                [...Array(3)].map((_, index) => (
                                    <div key={index} className="h-[430px] animate-pulse overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                                        <div className="h-56 bg-slate-200" />
                                        <div className="space-y-4 p-6"><div className="h-6 w-3/4 rounded bg-slate-200" /><div className="h-16 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-200" /></div>
                                    </div>
                                ))
                            ) : filteredCourses.length > 0 ? (
                                visibleCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        featured={filteredCourses.length === 1}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                        <SearchIcon className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-black text-slate-900">Chưa tìm thấy khóa học phù hợp</h3>
                                    <p className="mt-2 text-sm font-medium text-slate-500">Hãy thử từ khóa khác hoặc xóa các bộ lọc đang chọn.</p>
                                    <button type="button" onClick={resetFilters} className="mt-5 rounded-xl bg-[#9B2528] px-5 py-2.5 text-sm font-black text-white hover:bg-[#7E1E21]">
                                        Xem tất cả khóa học
                                    </button>
                                </div>
                            )}
                        </div>

                        {showAdvancedFilters && (
                            <aside className="hidden lg:block">
                                <div className="sticky top-24">
                                    <CourseFilter key={`desktop-${filterResetKey}`} onFilterChange={setFilters} courses={courses} />
                                </div>
                            </aside>
                        )}
                    </div>

                    {!loading && remainingCourseCount > 0 && (
                        <div className={`mt-8 flex justify-center ${showAdvancedFilters ? 'lg:pr-[287px]' : ''}`}>
                            <button
                                type="button"
                                onClick={() => setVisibleCount((count) => count + getInitialVisibleCount())}
                                className="rounded-xl border border-[#9B2528] bg-white px-6 py-3 text-sm font-black text-[#9B2528] shadow-sm transition hover:bg-[#9B2528] hover:text-white active:scale-[0.98]"
                            >
                                Xem thêm {Math.min(remainingCourseCount, getInitialVisibleCount())} khóa học
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CourseList;
