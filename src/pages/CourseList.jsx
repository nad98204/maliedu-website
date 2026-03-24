import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Filter, Search as SearchIcon, ChevronLeft, ChevronRight, Flame, Sparkles, LayoutGrid, Gift, BadgeDollarSign, ArrowUpDown, X as XIcon, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import CourseCard from '../components/CourseCard';
import CourseFilter from '../components/CourseFilter';
import { formatPrice } from '../utils/orderService';

// --- MINI COURSE CARD for sliders ---
const MiniCourseCard = ({ course }) => {
    const studentCount = course.fakeStudentCount || course.enrollmentCount || (Array.isArray(course.students) ? course.students.length : 0);
    const finalPrice = course.salePrice || course.price || 0;
    const originalPrice = course.price || 0;
    const hasDiscount = course.salePrice && course.salePrice < course.price;
    const discountPct = hasDiscount ? Math.round((1 - course.salePrice / course.price) * 100) : 0;
    const courseUrl = course.slug ? `/khoa-hoc/${course.slug}` : `/khoa-hoc/${course.id}`;

    return (
        <Link to={courseUrl} className="block group flex-shrink-0 w-[240px] md:w-[260px]">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group-hover:-translate-y-1 h-full flex flex-col">
                {/* Thumbnail */}
                <div className="relative overflow-hidden">
                    <img
                        src={course.thumbnailUrl || 'https://via.placeholder.com/400x225'}
                        alt={course.name}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {hasDiscount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                            GIẢM {discountPct}%
                        </div>
                    )}
                    {course.categoryName && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {course.categoryName}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-secret-wax transition-colors">
                        {course.name}
                    </h3>
                    <div className="mt-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-secret-wax font-black text-base">{formatPrice(finalPrice)}</span>
                                {hasDiscount && (
                                    <span className="text-slate-400 text-xs line-through ml-1.5">{formatPrice(originalPrice)}</span>
                                )}
                            </div>
                            {studentCount > 0 && (
                                <span className="text-[10px] text-slate-500 font-bold">{studentCount} học viên</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// --- HORIZONTAL SCROLL SECTION ---
const CourseSlider = ({ title, subtitle, icon, iconBg, courses, loading }) => {
    const Icon = icon;
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 560, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-12">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${iconBg} shadow-sm`}>
                        <Icon className="w-4 h-4" />
                        <span className="font-black text-sm uppercase tracking-widest">{title}</span>
                    </div>
                    <p className="text-slate-500 text-sm hidden sm:block">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll(-1)}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-secret-wax hover:text-secret-wax transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-secret-wax hover:text-secret-wax transition-all shadow-sm"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[260px] h-[240px] bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
                    ))
                ) : (
                    courses.map(course => (
                        <MiniCourseCard key={course.id} course={course} />
                    ))
                )}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-6" />
        </div>
    );
};

// --- TOPIC CARD ---
const TOPIC_IMAGES = {
    'luat-hap-dan': 'https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1774336131952-941279210-The-Secret-Law-of-Attraction.jpg',
    'phat-trien-ban-than': 'https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1774336429343-258928944-Gemini-Generated-Image-4364ah4364ah4364.png',
    'thien-chua-lanh': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    'tai-chinh-dong-tien': 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&q=80',
};

const TOPIC_LIST = [
    { id: 'luat-hap-dan', name: 'Luật Hấp Dẫn', desc: 'Tâm lý · Năng lượng' },
    { id: 'phat-trien-ban-than', name: 'Phát Triển Bản Thân', desc: 'Tư duy · Kỹ năng' },
    { id: 'thien-chua-lanh', name: 'Thiền & Chữa Lành', desc: 'Thiền · Sức khoẻ tinh thần' },
    { id: 'tai-chinh-dong-tien', name: 'Tài Chính & Dòng Tiền', desc: 'Đầu tư · Tư duy giàu có' },
];

// --- MAIN COMPONENT ---
const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'free', 'paid'

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [filters, setFilters] = useState({ categories: [], authors: [], prices: [] });
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef(null);

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const SORT_OPTIONS = [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'popular', label: 'Hot nhất' },
        { value: 'oldest', label: 'Cũ nhất' },
        { value: 'price-asc', label: 'Giá: Thấp → Cao' },
        { value: 'price-desc', label: 'Giá: Cao → Thấp' },
        { value: 'title-asc', label: 'Tên: A-Z' },
    ];

    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sắp xếp';

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const q = query(
                    collection(db, 'courses'),
                    where('isPublished', '==', true),
                    where('isForSale', '==', true)
                );
                const snapshot = await getDocs(q);
                let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Batch-fetch enrollment counts
                if (data.length > 0) {
                    const enrollSnap = await getDocs(collection(db, 'enrollments'));
                    const counts = {};
                    enrollSnap.forEach(d => {
                        const cId = d.data().courseId;
                        if (cId) counts[cId] = (counts[cId] || 0) + 1;
                    });
                    data = data.map(c => ({ ...c, enrollmentCount: counts[c.id] || c.enrollmentCount || 0 }));
                }

                setCourses(data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // TOP NEWEST: Sorted by createdAt desc
    const topNewest = useMemo(() =>
        [...courses].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 10),
        [courses]
    );

    // TOP HOTTEST: Sorted by enrollmentCount + views desc
    const topHottest = useMemo(() =>
        [...courses].sort((a, b) => {
            const scoreA = (a.enrollmentCount || 0) * 3 + (a.views || 0);
            const scoreB = (b.enrollmentCount || 0) * 3 + (b.views || 0);
            return scoreB - scoreA;
        }).slice(0, 10),
        [courses]
    );

    // Count per category
    const coursesPerCategory = useMemo(() => {
        const map = {};
        courses.forEach(c => {
            const cats = c.categories || (c.category ? [c.category] : []);
            cats.forEach(cat => { map[cat] = (map[cat] || 0) + 1; });
        });
        return map;
    }, [courses]);

    // Filtered main list
    const filteredCourses = useMemo(() => {
        let result = courses.filter(course => {
            if (searchTerm && !course.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            if (activeCategory !== 'all') {
                const courseCategories = course.categories || (course.category ? [course.category] : []);
                if (!courseCategories.includes(activeCategory)) return false;
            }

            if (priceFilter !== 'all') {
                const isFree = course.isForSale === false || course.price === 0;
                if (priceFilter === 'free' && !isFree) return false;
                if (priceFilter === 'paid' && isFree) return false;
            }

            if (filters.categories.length > 0) {
                const courseCategories = course.categories || (course.category ? [course.category] : []);
                if (!courseCategories.some(c => filters.categories.includes(c))) return false;
            }

            if (filters.authors.length > 0) {
                const instructor = course.instructorName || 'Mong Coaching';
                if (!filters.authors.includes(instructor)) return false;
            }

            if (filters.prices.length > 0) {
                const isFree = course.isForSale === false || course.price === 0;
                const showFree = filters.prices.includes('free');
                const showPaid = filters.prices.includes('paid');
                if (showFree && !showPaid && !isFree) return false;
                if (showPaid && !showFree && isFree) return false;
            }

            return true;
        });

        return result.sort((a, b) => {
            switch (sortOption) {
                case 'popular': return ((b.enrollmentCount || 0) * 3 + (b.views || 0)) - ((a.enrollmentCount || 0) * 3 + (a.views || 0));
                case 'oldest': return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
                case 'price-asc': return (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0);
                case 'price-desc': return (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0);
                case 'title-asc': return a.name.localeCompare(b.name);
                case 'newest':
                default: return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            }
        });
    }, [courses, searchTerm, filters, sortOption, activeCategory, priceFilter]);

    return (
        <div className="min-h-screen bg-neutral-50">

            {/* ============ SECTION 1: TOP NEWEST ============ */}
            <div className="bg-white border-b border-slate-100 py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <CourseSlider
                        title="Khóa Học Mới Nhất"
                        subtitle="Những khóa học vừa cập nhật trên hệ thống"
                        icon={Sparkles}
                        iconBg="bg-amber-50 text-amber-600 border border-amber-200"
                        courses={topNewest}
                        loading={loading}
                    />

                    {/* ============ SECTION 2: TOP HOTTEST ============ */}
                    <CourseSlider
                        title="Khóa Học Hot Nhất"
                        subtitle="Được nhiều học viên đăng ký và yêu thích"
                        icon={Flame}
                        iconBg="bg-red-50 text-red-600 border border-red-200"
                        courses={topHottest}
                        loading={loading}
                    />

                    {/* ============ SECTION 3: TOPICS ============ */}
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Khám phá theo chủ đề</h2>
                                <p className="text-slate-500 text-sm">Lựa chọn lĩnh vực bạn muốn phát triển hôm nay</p>
                            </div>
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Chọn lọc</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {TOPIC_LIST.map(topic => {
                                const count = coursesPerCategory[topic.id] || 0;
                                const isActive = activeCategory === topic.id;
                                return (
                                    <button
                                        key={topic.id}
                                        onClick={() => {
                                            setActiveCategory(isActive ? 'all' : topic.id);
                                            const el = document.getElementById('all-courses-section');
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className={`relative group overflow-hidden rounded-2xl aspect-[4/3] md:aspect-video text-left transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 border-[3px] ${isActive ? 'border-secret-wax' : 'border-white shadow-slate-200/50'}`}
                                    >
                                        <img
                                            src={TOPIC_IMAGES[topic.id] || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80'}
                                            alt={topic.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        
                                        {/* Refined Gradient Overlay */}
                                        <div className={`absolute inset-0 transition-all duration-300 ${isActive ? 'bg-secret-wax/40' : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100'}`} />
                                        
                                        {count > 0 && (
                                            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/30">
                                                {count} KHÓA
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 group-hover:translate-y-[-2px]">
                                            <div className="font-black text-white text-base leading-tight drop-shadow-lg">{topic.name}</div>
                                            <div className="text-white/80 text-[10px] mt-1 font-medium tracking-wide uppercase">{topic.desc.split(' · ')[0]}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ SECTION 4: ALL COURSES GRID ============ */}
            <div id="all-courses-section" className="max-w-7xl mx-auto px-4 py-10">

                {/* Active Category Filter Pills - Desktop Only */}
                <div className="hidden sm:inline-flex flex-wrap items-center gap-1.5 mb-5 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'all' ? 'bg-secret-wax text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-secret-wax'}`}
                    >
                        Tất cả
                    </button>
                    {TOPIC_LIST.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveCategory(activeCategory === t.id ? 'all' : t.id)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === t.id ? 'bg-secret-wax text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-secret-wax'}`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>

                {/* Unified Toolbar: Results Count, Quick Price Filters, and Sort */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-2 mb-6 bg-slate-100/50 rounded-2xl border border-slate-200 gap-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 shrink-0">
                            <span className="text-sm font-black text-secret-wax leading-none">{filteredCourses.length}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none">Khóa học</span>
                        </div>
                        {(activeCategory !== 'all' || priceFilter !== 'all') && (
                            <button 
                                onClick={() => { setActiveCategory('all'); setPriceFilter('all'); }} 
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-rose-100 group shadow-sm"
                                title="Xóa tất cả bộ lọc"
                            >
                                <XIcon className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                                <span className="hidden sm:inline">Xóa lọc</span>
                            </button>
                        )}
                    </div>

                    {/* Quick Price Filters - Compact Version */}
                    <div className="flex items-center bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-slate-200 shadow-sm flex-1 md:max-w-xs">
                        <button
                            onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${priceFilter === 'free' 
                                ? 'bg-emerald-600 text-white shadow-md' 
                                : 'text-emerald-600 hover:bg-emerald-50'}`}
                        >
                            <Gift className={`w-3.5 h-3.5 ${priceFilter === 'free' ? 'animate-bounce' : ''}`} />
                            Miễn Phí
                        </button>
                        <button
                            onClick={() => setPriceFilter(priceFilter === 'paid' ? 'all' : 'paid')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${priceFilter === 'paid' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <BadgeDollarSign className={`w-3.5 h-3.5 ${priceFilter === 'paid' ? 'animate-pulse' : ''}`} />
                            Trả Phí
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 px-1 relative" ref={sortRef}>
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="w-full md:min-w-[170px] flex items-center justify-between bg-white border border-slate-200 text-slate-700 text-xs rounded-xl py-2 px-3 shadow-sm font-black transition-all hover:border-secret-wax/40"
                        >
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                <span>{currentSortLabel}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSortOpen && (
                            <div className="absolute top-full right-0 mt-2 w-full min-w-[180px] bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setSortOption(opt.value);
                                            setIsSortOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors ${sortOption === opt.value 
                                            ? 'text-secret-wax bg-secret-wax/5' 
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-secret-wax'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                        className="w-full flex items-center justify-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-200 font-bold text-slate-700 hover:border-secret-wax transition-all"
                    >
                        <Filter className="w-5 h-5" />
                        {isMobileFilterOpen ? 'Đóng bộ lọc' : 'Hiện bộ lọc tìm kiếm'}
                    </button>
                    {isMobileFilterOpen && (
                        <div className="mt-4">
                            <CourseFilter onSearchChange={setSearchTerm} onFilterChange={setFilters} courses={courses} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* COURSE GRID */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden h-80 animate-pulse border border-slate-100">
                                        <div className="h-40 bg-slate-200" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-5 bg-slate-200 rounded w-3/4" />
                                            <div className="h-4 bg-slate-200 rounded w-1/2" />
                                            <div className="h-8 bg-slate-200 rounded mt-4" />
                                        </div>
                                    </div>
                                ))
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <CourseCard key={course.id} course={course} />
                                ))
                            ) : (
                                <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <SearchIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-800 font-bold text-lg">Không tìm thấy khóa học nào</p>
                                    <p className="text-slate-500 text-sm mt-2">Thử thay đổi từ khóa hoặc bộ lọc của bạn nhé!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR - Desktop Only */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24">
                            <CourseFilter onSearchChange={setSearchTerm} onFilterChange={setFilters} courses={courses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseList;
