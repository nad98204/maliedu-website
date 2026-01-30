import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';
import { formatPrice } from '../utils/orderService';

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
    const studentCount = Array.isArray(course.students) ? course.students.length : (course.students || 0);

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
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-slate-100 h-full hover:-translate-y-1">
            {/* Image Container */}
            <Link to={`/khoa-hoc/${course.slug || course.id}`} className="relative aspect-video overflow-hidden block">
                <img
                    src={course.thumbnailUrl || 'https://via.placeholder.com/600x400?text=Course+Image'}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category Badge */}
                {course.displayCategory && (
                    <div className="absolute top-3 left-3 z-10">
                        <span className="bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded shadow-sm tracking-wide">
                            {course.displayCategory}
                        </span>
                    </div>
                )}

                {course.salePrice && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">
                        GIẢM {Math.round(((course.price - course.salePrice) / course.price) * 100)}%
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <Link to={`/khoa-hoc/${course.slug || course.id}`}>
                    <h3 className="text-lg font-bold text-slate-900 mb-[10px] line-clamp-2 group-hover:text-secret-wax transition-colors">
                        {course.name}
                    </h3>
                </Link>

                <p className="text-sm text-slate-500 mb-3 line-clamp-3 min-h-[3.75rem] text-left leading-normal">
                    {stripHtml(course.description)}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 mt-auto">
                    <div className="flex items-center gap-1" title="Lượt xem">
                        <span className="opacity-70">👁️</span> <span>{course.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Học viên">
                        <Users className="w-3.5 h-3.5" /> <span>{studentCount} học viên</span>
                    </div>
                    <div className="flex items-center gap-1" title="Bài học">
                        <BookOpen className="w-3.5 h-3.5" /> <span>{lessonCount} bài</span>
                    </div>
                </div>

                {/* Footer: Price & Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        {course.isForSale === false ? (
                            <span className="text-base font-bold text-green-600">
                                Miễn phí
                            </span>
                        ) : course.salePrice ? (
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 line-through">
                                    {formatPrice(course.price)}
                                </span>
                                <span className="text-base font-bold text-red-600">
                                    {formatPrice(course.salePrice)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-base font-bold text-slate-900">
                                {formatPrice(course.price || 0)}
                            </span>
                        )}
                    </div>

                    <Link
                        to={`/khoa-hoc/${course.slug || course.id}`}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105"
                    >
                        Vào học ngay
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
