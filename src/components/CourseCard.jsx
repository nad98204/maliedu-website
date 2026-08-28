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
                <div className={`flex flex-wrap items-center font-bold text-slate-600 ${compact ? 'mb-2.5 mt-auto gap-1 text-[9px] sm:mb-3 sm:gap-1.5 sm:text-[11px]' : `gap-2 text-[12px] ${featured ? 'mb-7' : 'mb-5 mt-auto'}`}`}>
                    <div className={`flex items-center rounded-lg bg-slate-50 ${compact ? 'gap-1 px-1.5 py-1.5 sm:px-2' : 'gap-1.5 px-2.5 py-1.5'}`} title="Lượt xem khóa học">
                        <Eye className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[#9B2528]`} />
                        <span>{formatMetric(course.views)}<span className={compact ? 'hidden 2xl:inline' : ''}> lượt xem</span></span>
                    </div>
                    <div className={`flex items-center rounded-lg bg-slate-50 ${compact ? 'gap-1 px-1.5 py-1.5 sm:px-2' : 'gap-1.5 px-2.5 py-1.5'}`} title="Số lượng học viên">
                        <Users className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[#9B2528]`} />
                        <span>{formatMetric(studentCount)}<span className={compact ? 'hidden 2xl:inline' : ''}> học viên</span></span>
                    </div>
                    <div className={`flex items-center rounded-lg bg-slate-50 ${compact ? 'gap-1 px-1.5 py-1.5 sm:px-2' : 'gap-1.5 px-2.5 py-1.5'}`} title="Số bài học">
                        <BookOpen className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[#9B2528]`} />
                        <span>{formatMetric(lessonCount)}<span className={compact ? 'hidden 2xl:inline' : ''}> bài học</span></span>
                    </div>
                </div>

                {/* Footer: Price & Button */}
                <div className={`mt-auto flex gap-3 border-t border-slate-100 ${compact ? 'flex-col items-stretch pt-2.5 sm:pt-3' : 'items-center justify-between pt-5'}`}>
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
                        ) : startingPlan?.salePrice !== null && startingPlan?.price > startingPlan?.salePrice ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 line-through font-bold">
                                        {course.accessPlansEnabled ? 'Giá gốc ' : ''}{formatPrice(startingPlan.price)}
                                    </span>
                                    <span className="inline-flex items-center rounded-md bg-[#F85149] px-2 py-0.5 text-[11px] sm:text-xs font-black text-white shadow-sm">
                                        GIẢM {Math.round(((startingPlan.price - startingPlan.salePrice) / startingPlan.price) * 100)}%
                                    </span>
                                </div>
                                <div className={`${compact ? 'text-[18px] sm:text-[20px]' : 'text-[20px] md:text-[24px]'} whitespace-nowrap font-black leading-none text-[#8B2E2E]`}>
                                    {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                                </div>
                            </div>
                        ) : (
                            <span className={`${compact ? 'text-[18px] sm:text-[20px]' : 'text-[20px] md:text-[24px]'} whitespace-nowrap font-black leading-none text-[#8B2E2E]`}>
                                {course.accessPlansEnabled ? 'Từ ' : ''}{formatPrice(startingPrice)}
                            </span>
                        )}
                    </div>

                    <div className={`flex shrink-0 flex-col items-stretch gap-2 ${compact ? 'w-full' : ''}`}>
                        <ActionLink
                            {...actionLinkProps}
                            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#9B2528] font-black text-white shadow-lg shadow-red-950/10 transition-all hover:bg-[#7E1E21] hover:shadow-xl active:scale-[0.98] ${featured ? 'px-5 py-3.5 text-sm' : compact ? 'w-full px-1.5 py-2.5 text-[10px] sm:px-3 sm:text-xs' : 'px-4 py-2.5 text-[12px] md:px-5 md:text-[13px]'}`}
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
