import React from 'react';
import { Link } from 'react-router';
import { Users, BookOpen, Eye, ArrowRight, MessageCircleMore, PlayCircle } from 'lucide-react';
import { formatPrice } from '../utils/orderService';
import { normalizeCloudinaryImage } from '../utils/imageUtils';
import { getPreviewableLessonKeys } from '../utils/courseAccess';
import {
    getCourseLeadLandingUrl,
    isExternalCourseUrl,
    isLeadGenerationCourse,
    normalizeCourseLandingUrl,
} from '../utils/courseMarketing';
import { getCourseStartingPlan, getPlanEffectivePrice } from '../utils/coursePricing';

const CourseCard = ({ course, featured = false }) => {
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
        || course.studentCount
        || course.enrollmentCount
        || 0;

    const formatMetric = (value) => {
        if (typeof value === 'number') return value.toLocaleString('vi-VN');
        return value || '0';
    };

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
    const previewLessonKeys = getPreviewableLessonKeys(course);
    const previewLessonCount = previewLessonKeys.length;
    const courseUrl = `/khoa-hoc/${course.slug || course.id}`;
    const previewUrl = previewLessonCount > 0
        ? `/bai-giang/${course.id}?preview=1&lesson=${encodeURIComponent(previewLessonKeys[0])}`
        : courseUrl;
    const isLeadCourse = isLeadGenerationCourse(course);
    const startingPlan = getCourseStartingPlan(course);
    const startingPrice = getPlanEffectivePrice(startingPlan);
    const actionUrl = isLeadCourse
        ? normalizeCourseLandingUrl(getCourseLeadLandingUrl(course))
        : previewUrl;
    const ActionLink = isExternalCourseUrl(actionUrl) ? 'a' : Link;
    const actionLinkProps = isExternalCourseUrl(actionUrl)
        ? { href: actionUrl }
        : { to: actionUrl };

    return (
        <article className={`group bg-white rounded-[28px] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_22px_50px_rgba(15,23,42,0.11)] transition-all duration-300 overflow-hidden border border-slate-200/80 h-full ${featured ? 'md:grid md:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]' : 'flex flex-col'}`}>
            {/* Image Container */}
            <Link
                to={courseUrl}
                className={`relative overflow-hidden block bg-slate-100 ${featured ? 'aspect-[16/10] md:aspect-auto md:min-h-[390px]' : 'aspect-[16/10]'}`}
                aria-label={`Xem khóa học ${course.name}`}
            >
                <img
                    src={normalizeCloudinaryImage(course.thumbnailUrl || '', 'f_auto,q_auto,c_fill,w_600,h_375') || 'https://via.placeholder.com/600x400?text=Course+Image'}
                    alt={course.name}
                    loading="lazy"
                    width="600"
                    height="375"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
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
                {startingPlan?.salePrice !== null && startingPlan?.price > startingPlan?.salePrice && (
                    <div className="absolute top-4 right-4 z-10">
                        <span className="bg-[#F85149] text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                            GIẢM {Math.round(((startingPlan.price - startingPlan.salePrice) / startingPlan.price) * 100)}%
                        </span>
                    </div>
                )}

                {isLeadCourse ? (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-2 text-xs font-black text-amber-950 shadow-lg shadow-amber-950/20">
                        <MessageCircleMore className="h-4 w-4" />
                        Khóa học chuyên sâu
                    </div>
                ) : previewLessonCount > 0 && (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-emerald-950/20">
                        <PlayCircle className="h-4 w-4" />
                        Học thử {previewLessonCount} bài
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className={`flex flex-col flex-1 ${featured ? 'p-6 sm:p-8 lg:p-10' : 'p-5 sm:p-6'}`}>
                {featured && (
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#8B2E2E]">
                        {isLeadCourse ? 'Chương trình đào tạo chuyên sâu' : 'Khóa học dành cho bạn'}
                    </p>
                )}

                <Link to={courseUrl}>
                    <h3 className={`${featured ? 'text-2xl sm:text-3xl' : 'text-xl'} font-black text-[#0F172A] mb-3 line-clamp-2 group-hover:text-[#8B2E2E] transition-colors leading-tight`}>
                        {course.name}
                    </h3>
                </Link>

                <p className={`${featured ? 'text-[15px] line-clamp-4 mb-6' : 'text-[13.5px] line-clamp-3 min-h-[3.75rem] mb-4'} text-slate-500 text-left leading-relaxed font-medium`}>
                    {stripHtml(course.description)}
                </p>

                {/* Metrics */}
                <div className={`flex flex-wrap items-center gap-2 text-[12px] font-bold text-slate-600 ${featured ? 'mb-7' : 'mb-5 mt-auto'}`}>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5" title="Lượt xem khóa học">
                        <Eye className="h-4 w-4 text-[#9B2528]" />
                        <span>{formatMetric(course.views)} lượt xem</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5" title="Số lượng học viên">
                        <Users className="h-4 w-4 text-[#9B2528]" />
                        <span>{formatMetric(studentCount)} học viên</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5" title="Số bài học">
                        <BookOpen className="h-4 w-4 text-[#9B2528]" />
                        <span>{formatMetric(lessonCount)} bài học</span>
                    </div>
                </div>

                {/* Footer: Price & Button */}
                <div className={`pt-5 border-t border-slate-100 flex items-center justify-between gap-3 ${featured ? 'mt-auto' : ''}`}>
                    <div className="flex flex-col">
                        {isLeadCourse ? (
                            <>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                                    Khóa học chuyên sâu
                                </span>
                                <span className="text-lg font-black text-[#8B2E2E]">
                                    Tư vấn lộ trình
                                </span>
                            </>
                        ) : course.isForSale === false ? (
                            <span className="text-xl font-black text-emerald-600">
                                Miễn phí
                            </span>
                        ) : startingPlan?.salePrice !== null ? (
                            <>
                                <span className="text-[11px] text-slate-400 line-through font-bold mb-0.5 uppercase tracking-tighter">
                                    {course.accessPlansEnabled ? 'Giá từ ' : ''}{formatPrice(startingPlan.price)}
                                </span>
                                <span className="text-[18px] md:text-[21px] font-black text-[#8B2E2E] leading-none whitespace-nowrap">
                                    {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-[18px] md:text-[21px] font-black text-[#8B2E2E] leading-none whitespace-nowrap">
                                {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                            </span>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2">
                        <ActionLink
                            {...actionLinkProps}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#9B2528] text-white font-black shadow-lg shadow-red-950/10 hover:bg-[#7E1E21] hover:shadow-xl transition-all active:scale-[0.98] whitespace-nowrap ${featured ? 'px-5 py-3.5 text-sm' : 'px-4 md:px-5 py-2.5 text-[12px] md:text-[13px]'}`}
                        >
                            {isLeadCourse
                                ? 'Đăng ký khóa học'
                                : previewLessonCount > 0
                                    ? 'Học thử miễn phí'
                                    : 'Xem khóa học'}
                            {isLeadCourse
                                ? <MessageCircleMore className="h-4 w-4" />
                                : previewLessonCount > 0
                                    ? <PlayCircle className="h-4 w-4" />
                                    : <ArrowRight className="h-4 w-4" />}
                        </ActionLink>

                        {isLeadCourse && previewLessonCount > 0 && (
                            <Link
                                to={previewUrl}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-emerald-700 transition hover:text-emerald-800"
                            >
                                <PlayCircle className="h-3.5 w-3.5" />
                                Học thử {previewLessonCount} buổi miễn phí
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

export default CourseCard;
