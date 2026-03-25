import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Eye } from 'lucide-react';
import { formatPrice } from '../utils/orderService';
import { normalizeCloudinaryImage } from '../utils/imageUtils';

const CourseCard = ({ course }) => {
    // Helper to strip HTML tags and normalize text
    const stripHtml = (html) => {
        if (!html) return '';
        // Replace block tags/breaks with spaces to prevent words merging
        const spacified = html.replace(/<(\/?div|\/?p|\/?h\d|\/?li|\/?br|\/?tr)\s*\/?>/gi, ' ');
        const doc = new DOMParser().parseFromString(spacified, 'text/html');
        return (doc.body.textContent || "").replace(/\s+/g, ' ').trim();
    };

    // Calculate Metrics
    const studentCount = course.fakeStudentCount
        || course.enrollmentCount
        || (Array.isArray(course.students) ? course.students.length : (course.students || 0));

    const calculateTotalLessons = () => {
        if (course.totalLessons) return course.totalLessons;
        if (course.lessons?.length) return course.lessons.length;
        if (course.curriculum && Array.isArray(course.curriculum)) {
            return course.curriculum.reduce((total, chapter) => {
                return total + (chapter.lessons?.length || 0);
            }, 0);
        }
        return 0;
    };

    const lessonCount = calculateTotalLessons();

    return (
        <div className="group bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden flex flex-col border border-slate-100 h-full hover:-translate-y-2">
            {/* Image Container */}
            <Link to={`/khoa-hoc/${course.slug || course.id}`} className="relative aspect-[16/10] overflow-hidden block">
                <img
                    src={normalizeCloudinaryImage(course.thumbnailUrl || '', 'f_auto,q_auto,c_fill,w_600,h_375') || 'https://via.placeholder.com/600x400?text=Course+Image'}
                    alt={course.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Category Badge - Top Left */}
                {(course.displayCategory || course.categoryName || course.category) && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-[#2B6BE2] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-lg tracking-wider backdrop-blur-sm bg-opacity-90">
                            {course.displayCategory || course.categoryName || course.category}
                        </span>
                    </div>
                )}

                {/* Sale Badge - Top Right */}
                {course.salePrice && course.price > course.salePrice && (
                    <div className="absolute top-4 right-4 z-10">
                        <span className="bg-[#F85149] text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                            GIẢM {Math.round(((course.price - course.salePrice) / course.price) * 100)}%
                        </span>
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
                <Link to={`/khoa-hoc/${course.slug || course.id}`}>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2 line-clamp-2 group-hover:text-[#8B2E2E] transition-colors leading-tight">
                        {course.name}
                    </h3>
                </Link>

                <p className="text-[13.5px] text-slate-500 mb-4 line-clamp-3 min-h-[3.75rem] text-left leading-relaxed font-medium opacity-90">
                    {stripHtml(course.description)}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-[12px] text-slate-400 mb-5 mt-auto font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-1.5" title="Lượt xem">
                        <Eye className="w-[16px] h-[16px] text-slate-400/80" /> <span>{course.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Học viên">
                        <Users className="w-[16px] h-[16px] text-slate-400/80" /> <span>{studentCount} học viên</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Bài học">
                        <BookOpen className="w-[16px] h-[16px] text-slate-400/80" /> <span>{lessonCount} bài</span>
                    </div>
                </div>

                {/* Footer: Price & Button */}
                <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                        {course.isForSale === false ? (
                            <span className="text-xl font-black text-emerald-600">
                                Miễn phí
                            </span>
                        ) : course.salePrice ? (
                            <>
                                <span className="text-[11px] text-slate-400 line-through font-bold mb-0.5 uppercase tracking-tighter">
                                    {formatPrice(course.price)}
                                </span>
                                <span className="text-[18px] md:text-[21px] font-black text-[#8B2E2E] leading-none whitespace-nowrap">
                                    {formatPrice(course.salePrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-[18px] md:text-[21px] font-black text-[#8B2E2E] leading-none whitespace-nowrap">
                                {formatPrice(course.price || 0)}
                            </span>
                        )}
                    </div>

                    <Link
                        to={`/khoa-hoc/${course.slug || course.id}`}
                        className="px-4 md:px-5 py-2.5 rounded-full bg-gradient-to-r from-[#F85149] to-[#FF7B39] text-white text-[12px] md:text-[13px] font-black shadow-lg shadow-red-100 hover:shadow-red-200 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                        Vào học ngay
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
