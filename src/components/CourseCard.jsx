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

const CourseCard = ({ course, featured = false, compact = false }) => {
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
    const hasDiscount = startingPlan?.salePrice !== null
        && Number(startingPlan?.price || 0) > Number(startingPlan?.salePrice || 0);
    const discountPercent = hasDiscount
        ? Math.round(
            ((Number(startingPlan.price) - Number(startingPlan.salePrice))
                / Number(startingPlan.price)) * 100
        )
        : 0;
    const actionUrl = isLeadCourse
        ? normalizeCourseLandingUrl(getCourseLeadLandingUrl(course))
        : previewUrl;
    const ActionLink = isExternalCourseUrl(actionUrl) ? 'a' : Link;
    const actionLinkProps = isExternalCourseUrl(actionUrl)
        ? { href: actionUrl }
        : { to: actionUrl };
    const courseDescription = stripHtml(course.description);

    return (
        <article className={`group h-full overflow-hidden border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.07)] transition-all duration-300 hover:shadow-[0_22px_50px_rgba(15,23,42,0.11)] ${compact ? 'rounded-2xl sm:rounded-[20px]' : 'rounded-[28px]'} ${featured ? 'md:grid md:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]' : 'flex flex-col'}`}>
            {/* Image Container */}
            <Link
                to={courseUrl}
                className={`relative block overflow-hidden bg-slate-100 ${featured ? 'aspect-[16/10] md:aspect-auto md:min-h-[390px]' : compact ? 'aspect-[4/3] sm:aspect-[16/10]' : 'aspect-[16/10]'}`}
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
            </Link>

            {/* Content */}
            <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8 lg:p-10' : compact ? 'p-2.5 sm:p-3' : 'p-5 sm:p-6'}`}>
                {featured && (
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#8B2E2E]">
                        {isLeadCourse ? 'Chương trình đào tạo chuyên sâu' : 'Khóa học dành cho bạn'}
                    </p>
                )}

                <Link to={courseUrl} className="block w-full">
                    <h3 className={`${featured ? 'text-2xl sm:text-3xl' : compact ? 'mb-1.5 text-[13px] sm:text-lg' : 'text-xl'} ${compact ? '' : 'mb-3'} line-clamp-2 font-black leading-tight text-[#0F172A] transition-colors group-hover:text-[#8B2E2E]`}>
                        {course.name}
                    </h3>
                </Link>

                {compact ? (
                    <>
                        <p className="mb-3 min-h-[2.85rem] w-full line-clamp-3 text-left text-[10px] font-medium leading-[1.45] text-slate-500 sm:hidden">
                            {courseDescription}
                        </p>
                        <p className="mb-4 hidden min-h-[2.6rem] w-full overflow-hidden text-left text-xs font-medium leading-[1.3rem] text-slate-500 sm:[-webkit-box-orient:vertical] sm:[-webkit-line-clamp:2] sm:[display:-webkit-box]">
                            {courseDescription}
                        </p>
                    </>
                ) : (
                    <p className={`${featured ? 'mb-6 line-clamp-4 text-[15px]' : 'mb-4 min-h-[3.75rem] line-clamp-3 text-[13.5px]'} text-left font-medium leading-relaxed text-slate-500`}>
                        {courseDescription}
                    </p>
                )}

                {/* Metrics */}
                {compact ? (
                    <div className="mb-2.5 mt-auto flex flex-wrap items-center gap-1 text-[9px] font-bold text-slate-600 sm:mb-3 sm:gap-1.5 sm:text-[11px]">
                        <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-1.5 sm:px-2" title="Lượt xem khóa học">
                            <Eye className="h-3.5 w-3.5 text-[#9B2528]" />
                            <span>{formatMetric(course.views)}</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-1.5 sm:px-2" title="Số lượng học viên">
                            <Users className="h-3.5 w-3.5 text-[#9B2528]" />
                            <span>{formatMetric(studentCount)}</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-1.5 sm:px-2" title="Số bài học">
                            <BookOpen className="h-3.5 w-3.5 text-[#9B2528]" />
                            <span>{formatMetric(lessonCount)}</span>
                        </div>
                    </div>
                ) : (
                    <div className={`grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 ${featured ? 'mb-7' : 'mb-4 mt-auto'}`}>
                        <div className="flex min-w-0 flex-col items-center justify-center px-1 py-2 text-center" title="Lượt xem khóa học">
                            <div className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5 text-[#9B2528]" />
                                <strong className="text-xs font-black leading-none text-slate-700">{formatMetric(course.views)}</strong>
                            </div>
                            <span className="mt-1 text-[9px] font-semibold leading-none text-slate-400">lượt xem</span>
                        </div>
                        <div className="flex min-w-0 flex-col items-center justify-center px-1 py-2 text-center" title="Số lượng học viên">
                            <div className="flex min-w-0 items-center gap-1">
                                <Users className="h-3.5 w-3.5 shrink-0 text-[#9B2528]" />
                                <strong className="max-w-full truncate text-xs font-black leading-none text-slate-700">{formatMetric(studentCount)}</strong>
                            </div>
                            <span className="mt-1 text-[9px] font-semibold leading-none text-slate-400">học viên</span>
                        </div>
                        <div className="flex min-w-0 flex-col items-center justify-center px-1 py-2 text-center" title="Số bài học">
                            <div className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5 text-[#9B2528]" />
                                <strong className="text-xs font-black leading-none text-slate-700">{formatMetric(lessonCount)}</strong>
                            </div>
                            <span className="mt-1 text-[9px] font-semibold leading-none text-slate-400">bài học</span>
                        </div>
                    </div>
                )}

                {/* Footer: Price & Button */}
                <div className={`mt-auto flex gap-3 border-t border-slate-100 ${compact ? 'flex-col items-stretch pt-2.5 sm:pt-3' : 'flex-col items-stretch pt-5 sm:flex-row sm:items-end sm:justify-between'}`}>
                    <div className="flex flex-col">
                        {isLeadCourse ? (
                            <>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                                    Khóa học chuyên sâu
                                </span>
                                <span className={`${compact ? 'text-base' : 'text-lg'} font-black text-[#8B2E2E]`}>
                                    Tư vấn lộ trình
                                </span>
                            </>
                        ) : course.isForSale === false ? (
                            <span className={`${compact ? 'text-lg' : 'text-xl'} font-black text-emerald-600`}>
                                Miễn phí
                            </span>
                        ) : hasDiscount ? (
                            compact ? (
                                <div className="min-w-0 rounded-xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-amber-50 p-2">
                                    <div className="flex min-w-0 items-center justify-between gap-1.5">
                                        <span className="min-w-0 truncate text-[11px] font-bold text-slate-500 line-through">
                                            {course.accessPlansEnabled ? 'Giá gốc ' : ''}{formatPrice(startingPlan.price)}
                                        </span>
                                        <span className="inline-flex shrink-0 items-center rounded-full bg-[#E5484D] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
                                            -{discountPercent}%
                                        </span>
                                    </div>
                                    <div className="mt-1.5 whitespace-nowrap text-[18px] font-black leading-none tracking-tight text-[#8B2E2E] sm:text-[20px]">
                                        {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full min-w-0 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-amber-50 p-3.5 shadow-sm sm:min-w-[210px]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9B2528]/70">
                                                Giá ưu đãi
                                            </p>
                                            <div className="mt-1 whitespace-nowrap text-[24px] font-black leading-none tracking-tight text-[#8B2E2E]">
                                                {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                                            </div>
                                        </div>
                                        <span className="inline-flex shrink-0 flex-col items-center rounded-xl bg-[#E5484D] px-3 py-1.5 text-white shadow-md shadow-red-500/15">
                                            <span className="text-[9px] font-bold uppercase tracking-wide text-red-100">
                                                Tiết kiệm
                                            </span>
                                            <span className="text-sm font-black leading-tight">
                                                {discountPercent}%
                                            </span>
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-red-100/80 pt-2">
                                        <span className="text-sm font-extrabold text-slate-600">Giá gốc</span>
                                        <span className="whitespace-nowrap text-sm font-extrabold text-slate-500 line-through decoration-slate-400 decoration-2">
                                            {formatPrice(startingPlan.price)}
                                        </span>
                                    </div>
                                </div>
                            )
                        ) : (
                            <span className={`${compact ? 'text-[18px] sm:text-[20px]' : 'text-[20px] md:text-[24px]'} whitespace-nowrap font-black leading-none text-[#8B2E2E]`}>
                                {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                            </span>
                        )}
                    </div>

                    <div className={`flex shrink-0 flex-col items-stretch gap-2 ${compact ? 'w-full' : 'w-full sm:w-auto'}`}>
                        <ActionLink
                            {...actionLinkProps}
                            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#9B2528] font-black text-white shadow-lg shadow-red-950/10 transition-all hover:bg-[#7E1E21] hover:shadow-xl active:scale-[0.98] ${featured ? 'px-5 py-3.5 text-sm' : compact ? 'w-full px-1.5 py-2.5 text-[10px] sm:px-3 sm:text-xs' : 'w-full px-4 py-3 text-[13px] sm:w-auto md:px-5'}`}
                        >
                            <span>
                                {isLeadCourse
                                    ? 'Đăng ký khóa học'
                                    : previewLessonCount > 0
                                        ? 'Học thử miễn phí'
                                        : 'Xem khóa học'}
                            </span>
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
