import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Filter, Search as SearchIcon, ChevronLeft, ChevronRight, Flame, Sparkles, LayoutGrid, Gift, BadgeDollarSign, ArrowUpDown, X as XIcon, ChevronDown, Clock } from 'lucide-react';
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
        <Link to={courseUrl} className="block group flex-shrink-0 w-[240px] md:w-[280px]">
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-500 border border-slate-50 group-hover:-translate-y-2 h-full flex flex-col">
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                        src={course.thumbnailUrl || 'https://via.placeholder.com/400x225'}
                        alt={course.name}
                        loading="lazy"
                        width="400"
                        height="250"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {hasDiscount && (
                        <div className="absolute top-3 right-3 bg-[#F85149] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                            GIẢM {discountPct}%
                        </div>
                    )}
                    {(course.categoryName || course.category) && (
                        <div className="absolute top-3 left-3 bg-[#1E293B] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-600/50 shadow-md">
                            {course.categoryName || course.category}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-[15px] leading-tight line-clamp-2 mb-4 group-hover:text-[#8B2E2E] transition-colors">
                        {course.name}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                        <div className="text-[#8B2E2E] font-black text-xl leading-none">
                            {formatPrice(finalPrice)}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {hasDiscount && (
                                <span className="text-slate-400 text-[11px] font-bold line-through leading-none">
                                    {formatPrice(originalPrice)}
                                </span>
                            )}
                            {studentCount > 0 && (
                                <div className="text-[11px] text-slate-500 font-bold leading-none">
                                    {studentCount} học viên
                                </div>
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
        <div className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* Glowing Icon */}
                    <div className="relative flex-shrink-0">
                        <div className={`absolute -inset-2 rounded-full blur-md opacity-20 ${iconBg.split(' ')[0]}`} />
                        <div className={`relative w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-100 shadow-sm ${iconBg.split(' ')[1]}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h2>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 hidden sm:flex">
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Chọn lọc</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs font-medium mt-1.5 hidden sm:block">{subtitle}</p>
                    </div>
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
                        <div key={course.id} className="flex-shrink-0 w-[300px] md:w-[380px] h-full py-2">
                            <CourseCard course={course} />
                        </div>
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
            <SEO 
                title="Danh sách khóa học"
                description="Khám phá các khóa học về Luật Hấp Dẫn, Phát Triển Bản Thân và Khai Phá Tiềm Thức tại Mali Edu."
                url="/khoa-hoc"
            />
            <h1 className="sr-only">Khóa học Đào tạo - Mali Edu</h1>

            {/* ============ SECTION 1: TOP NEWEST ============ */}
            <div className="bg-white border-b border-slate-100 pt-10 pb-6">
                <div className="max-w-7xl mx-auto px-4">
                    <CourseSlider
                        title="Khóa Học Mới Nhất"
                        subtitle="Những khóa học vừa cập nhật trên hệ thống"
                        icon={Clock}
                        iconBg="bg-sky-50 text-sky-600"
                        courses={topNewest}
                        loading={loading}
                    />

                    {/* ============ SECTION 2: TOP HOTTEST ============ */}
                    <CourseSlider
                        title="Khóa Học Hot Nhất"
                        subtitle="Được nhiều học viên đăng ký và yêu thích"
                        icon={Flame}
                        iconBg="bg-rose-50 text-rose-600"
                        courses={topHottest}
                        loading={loading}
                    />

                    {/* ============ SECTION 3: TOPICS ============ */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                            <div className="flex items-center gap-4">
                                {/* Glowing Icon for Topics */}
                                <div className="relative flex-shrink-0">
                                    <div className="absolute -inset-2 rounded-full blur-md opacity-20 bg-indigo-200" />
                                    <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-100 shadow-sm text-indigo-600">
                                        <LayoutGrid className="w-5 h-5" />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Khám phá theo chủ đề</h2>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100 hidden sm:flex">
                                            <span className="w-1 h-1 rounded-full bg-indigo-400" />
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Đa dạng</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium mt-1.5 hidden sm:block">Lựa chọn lĩnh vực bạn muốn phát triển hôm nay</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                                        className={`relative group overflow-hidden rounded-[24px] aspect-[16/10] md:aspect-video text-left transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 border-[3px] ${isActive ? 'border-secret-wax' : 'border-white shadow-slate-200/50'}`}
                                    >
                                        <img
                                            src={TOPIC_IMAGES[topic.id] || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80'}
                                            alt={topic.name}
                                            loading="lazy"
                                            width="400"
                                            height="250"
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        
                                        {/* Dynamic Overlay */}
                                        <div className={`absolute inset-0 transition-all duration-500 ${isActive ? 'bg-secret-wax/40' : 'bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90'}`} />
                                        
                                        {count > 0 && (
                                            <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-white/40 shadow-sm">
                                                {count} KHÓA
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                                            <div className="font-black text-white text-sm md:text-lg leading-[1.2] drop-shadow-xl mb-1">{topic.name}</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-secret-wax shadow-[0_0_8px_rgba(186,45,47,0.8)]" />
                                                <div className="text-white/90 text-[10px] md:text-[11px] font-bold tracking-widest uppercase">{topic.desc.split(' · ')[0]}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ SECTION 4: ALL COURSES GRID ============ */}
            <div id="all-courses-section" className="max-w-7xl mx-auto px-4 py-4">

                {/* Active Category Filter Pills - Hidden on Desktop (redundant with sidebar) */}
                <div className="hidden sm:inline-flex lg:hidden flex-wrap items-center gap-1.5 mb-4 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
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
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-2 mb-6 bg-slate-100/50 rounded-2xl border border-slate-200 gap-4">
                    {/* Left Group: Results & Simple Price Toggles */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

                        {/* Quick Price Filters - Keep original mobile style, compact on desktop */}
                        <div className="flex items-center bg-slate-200/50 p-1 rounded-[18px] border border-slate-200/60 shadow-inner gap-1 w-full lg:w-auto">
                            <button
                                onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 lg:px-4 lg:py-1.5 rounded-[14px] text-[11px] lg:text-[10px] font-black uppercase transition-all duration-300 ${priceFilter === 'free' 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                    : 'bg-white/50 text-emerald-700 hover:bg-white hover:text-emerald-600 shadow-sm'}`}
                            >
                                <Gift className={`w-3.5 h-3.5 lg:w-3 lg:h-3 ${priceFilter === 'free' ? 'animate-bounce' : ''}`} />
                                Miễn Phí
                            </button>
                            <button
                                onClick={() => setPriceFilter(priceFilter === 'paid' ? 'all' : 'paid')}
                                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 lg:px-4 lg:py-1.5 rounded-[14px] text-[11px] lg:text-[10px] font-black uppercase transition-all duration-300 ${priceFilter === 'paid' 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                    : 'bg-white/50 text-indigo-700 hover:bg-white hover:text-indigo-600 shadow-sm'}`}
                            >
                                <BadgeDollarSign className={`w-3.5 h-3.5 lg:w-3 lg:h-3 ${priceFilter === 'paid' ? 'animate-pulse' : ''}`} />
                                Trả Phí
                            </button>
                        </div>
                    </div>
                    
                    {/* Right Group: Search & Sort */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        {/* Live Search Input */}
                        <div className="relative group transition-all duration-300 w-full sm:min-w-[240px] focus-within:sm:min-w-[300px]">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm tên khóa học..."
                                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20 shadow-sm transition-all"
                            />
                            <SearchIcon className="absolute left-3 top-[11px] w-4 h-4 text-slate-400 group-focus-within:text-secret-wax transition-colors" />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-[11px] text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <XIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative" ref={sortRef}>
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="w-full sm:min-w-[170px] flex items-center justify-between bg-white border border-slate-200 text-slate-700 text-xs rounded-xl py-2.5 px-3 shadow-sm font-black transition-all hover:border-secret-wax/40"
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
                            <CourseFilter onFilterChange={setFilters} courses={courses} />
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
                            <CourseFilter onFilterChange={setFilters} courses={courses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseList;
