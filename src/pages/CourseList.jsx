import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Filter, Search as SearchIcon } from 'lucide-react';
import { db } from '../firebase';
import CourseCard from '../components/CourseCard';
import CourseFilter from '../components/CourseFilter';

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('popular'); // popular, newest, oldest, price-asc, price-desc, title-asc
    const [filters, setFilters] = useState({
        categories: [],
        authors: [],
        prices: [],
    });
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Query only published courses
                const q = query(
                    collection(db, 'courses'),
                    where('isPublished', '==', true)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCourses(data);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // Helper: Format Price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Filter & Sort Logic
    const filteredCourses = useMemo(() => {
        let result = courses.filter(course => {
            // 1. Search Term (Name)
            if (searchTerm && !course.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // 2. Categories
            if (filters.categories.length > 0) {
                const courseCategories = course.categories || (course.category ? [course.category] : []);
                const hasMatch = courseCategories.some(catSlug => filters.categories.includes(catSlug));
                if (!hasMatch) return false;
            }

            // 3. Authors
            if (filters.authors.length > 0) {
                const instructor = course.instructorName || "Mong Coaching";
                if (!filters.authors.includes(instructor)) return false;
            }

            // 4. Prices
            if (filters.prices.length > 0) {
                const isFree = course.isForSale === false || course.price === 0;
                const showFree = filters.prices.includes('free');
                const showPaid = filters.prices.includes('paid');
                if (showFree && !showPaid && !isFree) return false;
                if (showPaid && !showFree && isFree) return false;
            }

            return true;
        });

        // Sorting
        return result.sort((a, b) => {
            switch (sortOption) {
                case 'popular':
                    return (b.views || 0) - (a.views || 0);
                case 'oldest':
                    return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
                case 'price-asc':
                    return (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0);
                case 'price-desc':
                    return (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0);
                case 'title-asc':
                    return a.name.localeCompare(b.name);
                case 'newest':
                default:
                    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            }
        });
    }, [courses, searchTerm, filters, sortOption]);

    return (
        <div className="min-h-screen bg-neutral-50 py-8">
            <div className="max-w-7xl mx-auto px-4">

                {/* HEADER ROW */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Các khóa học</h1>
                        <p className="text-sm text-slate-500">
                            Hiển thị {filteredCourses.length} kết quả
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 font-medium whitespace-nowrap hidden sm:block">Sắp xếp theo:</span>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm min-w-[180px]"
                        >
                            <option value="popular">Xem nhiều nhất</option>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="price-asc">Giá: Thấp đến Cao</option>
                            <option value="price-desc">Giá: Cao đến Thấp</option>
                            <option value="title-asc">Tên: A-Z</option>
                        </select>
                    </div>
                </div>

                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                        className="w-full flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-slate-200 font-bold text-slate-700"
                    >
                        <Filter className="w-5 h-5" />
                        {isMobileFilterOpen ? 'Đóng bộ lọc' : 'Hiện bộ lọc tìm kiếm'}
                    </button>
                    {isMobileFilterOpen && (
                        <div className="mt-4">
                            <CourseFilter
                                onSearchChange={setSearchTerm}
                                onFilterChange={setFilters}
                                courses={courses}
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* COURSE GRID (Left - Col 3) */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                // Skeleton Loading
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden h-80 animate-pulse border border-slate-100">
                                        <div className="h-40 bg-slate-200"></div>
                                        <div className="p-5 space-y-3">
                                            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                            <div className="h-8 bg-slate-200 rounded mt-4"></div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <CourseCard key={course.id} course={course} />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <SearchIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-800 font-bold text-lg">Không tìm thấy khóa học nào phù hợp</p>
                                    <p className="text-slate-500 text-sm mt-2">Thử thay đổi từ khóa hoặc bộ lọc của bạn xem sao nhé!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR (Right - Col 1) - Desktop Only */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24">
                            <CourseFilter
                                onSearchChange={setSearchTerm}
                                onFilterChange={setFilters}
                                courses={courses}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};


export default CourseList;
