import React, { useState, useEffect } from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import CourseCard from './CourseCard';

export default function FeaturedCourses() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Updated categories as per user request
    const categories = [
        { id: 'all', name: 'Tất cả' },
        { id: 'luat-hap-dan', name: 'Luật Hấp Dẫn' },
        { id: 'phat-trien-ban-than', name: 'Phát Triển Bản Thân' },
        { id: 'thien-chua-lanh', name: 'Thiền & Chữa Lành' },
        { id: 'tai-chinh-dong-tien', name: 'Tài Chính & Dòng Tiền' }
    ];

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const q = query(
                    collection(db, 'courses'),
                    where('isPublished', '==', true),
                    where('isForSale', '==', true)
                );

                const snapshot = await getDocs(q);
                let data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Batch-fetch enrollment counts (one query for all courses)
                if (data.length > 0) {
                    const enrollSnap = await getDocs(collection(db, 'enrollments'));
                    const counts = {};
                    enrollSnap.forEach(d => {
                        const cId = d.data().courseId;
                        if (cId) counts[cId] = (counts[cId] || 0) + 1;
                    });
                    data = data.map(c => ({ ...c, enrollmentCount: counts[c.id] || c.enrollmentCount || 0 }));
                }

                // Client-side sort to avoid Firestore index requirement
                data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                setCourses(data);
            } catch (error) {
                console.error("Error fetching featured courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // Filter logic
    const filteredCourses = courses.filter(course => {
        if (selectedCategory === 'all') return true;

        // Check various category fields
        const courseCats = course.categories || (course.category ? [course.category] : []);
        const categoryName = categories.find(c => c.id === selectedCategory)?.name.toLowerCase();

        // Check by ID or Name
        return courseCats.some(cat =>
            cat.toLowerCase().includes(selectedCategory) ||
            cat.toLowerCase().includes(categoryName) ||
            (course.categoryName && course.categoryName.toLowerCase().includes(categoryName))
        );
    }).slice(0, 3); // Limit to 3 items

    if (loading) {
        return (
            <section className="py-20 lg:py-24 bg-[#FAF7F2]">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p>Đang tải khóa học...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 lg:py-24 bg-[#FAF7F2]">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header - Mobile */}
                <div className="md:hidden text-center mb-6">
                    <div className="relative inline-block px-4 py-1.5 rounded-full border-2 border-[#8B2E2E] shadow-[0_0_10px_rgba(139,46,46,0.2)]">
                        <h2 className="flex flex-col items-center text-sm font-bold text-[#8B2E2E] uppercase tracking-wide m-0">
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                KHÓA HỌC ONLINE
                            </span>
                            <span>ĐƯỢC YÊU THÍCH NHẤT</span>
                        </h2>
                    </div>
                </div>

                {/* Header - Desktop */}
                <div className="hidden md:block text-center mb-10">
                    <div className="relative inline-block px-6 py-2 rounded-full border-2 border-[#8B2E2E] animate-pulse shadow-[0_0_15px_rgba(139,46,46,0.3)]">
                        <h2 className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-[#8B2E2E] uppercase tracking-wide m-0 text-center">
                            <span className="flex items-center gap-2">
                                <TrendingUp className="w-6 h-6" />
                                KHÓA HỌC ONLINE
                            </span>
                            <span>ĐƯỢC YÊU THÍCH NHẤT</span>
                        </h2>
                    </div>
                </div>

                {/* Category Filter - Mobile Manual Scroll */}
                <div className="md:hidden mb-6">
                    <style>{`
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                        .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x snap-mandatory">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`snap-start flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full font-medium text-xs transition-all duration-300
                                    ${selectedCategory === category.id
                                        ? 'bg-[#8B2E2E] text-white shadow-md'
                                        : 'bg-white text-gray-500 border border-gray-200'
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Links - Desktop Static */}
                <div className="hidden md:flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300
                                ${selectedCategory === category.id
                                    ? 'bg-[#8B2E2E] text-white shadow-md'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-[#8B2E2E] border border-gray-100 shadow-sm'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                            <div key={course.id} className="h-full">
                                <CourseCard course={course} />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            Chưa có khóa học nào thuộc danh mục này.
                        </div>
                    )}
                </div>

                {/* CTA Button - Mobile */}
                <div className="md:hidden text-center pb-4">
                    <button
                        onClick={() => navigate('/khoa-hoc')}
                        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-[#8B2E2E] text-white rounded-full font-bold text-base shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden"
                    >
                        <span className="relative z-10">Xem tất cả khóa học</span>
                        <Award className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>

                {/* CTA Button - Desktop */}
                <div className="hidden md:block text-center">
                    <button
                        onClick={() => navigate('/khoa-hoc')}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#8B2E2E] text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10">Xem tất cả khóa học</span>
                        <Award className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#8B2E2E] to-[#6d2424] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                </div>
            </div>
        </section>
    );
}
