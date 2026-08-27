import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    CheckCircle,
    Heart,
    LifeBuoy,
    MessageCircleMore,
    PlayCircle,
    ShieldCheck,
} from 'lucide-react';
import { formatPrice } from '../utils/orderService';
import { HOTLINE } from '../menuData';
import { getPreviewableLessonKeys } from '../utils/courseAccess';
import { isLeadGenerationCourse, openCourseLeadLanding } from '../utils/courseMarketing';

const CourseSidebar = ({ course, onBuyClick, onPreviewClick, isEnrolled }) => {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState(false);
    const isLeadCourse = isLeadGenerationCourse(course) && !isEnrolled;
    const isPreviewOnlyCourse = course.isForSale === false && !isEnrolled && !isLeadCourse;
    const hasPreviewLessons = getPreviewableLessonKeys(course).length > 0;

    const handleBuyNow = () => {
        if (onBuyClick) {
            onBuyClick();
            return;
        }

        if (isEnrolled) {
            navigate(`/bai-giang/${course.id}`);
            return;
        }

        if (isLeadGenerationCourse(course)) {
            openCourseLeadLanding({ course, navigate });
            return;
        }

        if (course.isForSale === false) {
            navigate(`/bai-giang/${course.id}?preview=1`);
            return;
        }

        navigate(`/thanh-toan/${course.id}`);
    };

    const handlePreview = () => {
        if (onPreviewClick) {
            onPreviewClick();
            return;
        }

        navigate(`/bai-giang/${course.id}?preview=1`);
    };

    return (
        <aside>
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
                <div className="relative aspect-video bg-slate-100">
                    <img
                        src={course.thumbnailUrl || 'https://via.placeholder.com/600x400'}
                        alt={course.name}
                        loading="eager"
                        width="600"
                        height="338"
                        className="h-full w-full object-cover"
                    />
                    {!isEnrolled && course.isForSale !== false && course.salePrice && (
                        <div className="absolute right-3 top-3 rounded-full bg-[#D93035] px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
                            Giảm {Math.round(((course.price - course.salePrice) / course.price) * 100)}%
                        </div>
                    )}
                    {!isEnrolled && !isLeadCourse && hasPreviewLessons && (
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
                            <PlayCircle className="h-3.5 w-3.5" /> Có bài học thử
                        </div>
                    )}
                </div>

                <div className="p-5 sm:p-6">
                    {isEnrolled ? (
                        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <CheckCircle className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-black text-emerald-800">Bạn đã sở hữu khóa học</p>
                                <p className="mt-0.5 text-xs text-emerald-700/70">Tiếp tục học từ bài gần nhất.</p>
                            </div>
                        </div>
                    ) : isLeadCourse ? (
                        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wider text-amber-700">Chương trình chuyên sâu</p>
                            <p className="mt-1 text-lg font-black text-amber-950">Đăng ký để được tư vấn lộ trình</p>
                        </div>
                    ) : course.isForSale === false ? (
                        <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Trải nghiệm miễn phí</p>
                            <p className="mt-1 text-lg font-black text-emerald-900">Học thử các bài được mở</p>
                        </div>
                    ) : (
                        <div className="mb-5">
                            <p className="text-xs font-bold text-slate-400">Giá khóa học</p>
                            <div className="mt-1 flex flex-wrap items-end gap-2.5">
                                <span className="text-3xl font-black tracking-tight text-[#9B2528]">
                                    {formatPrice(course.salePrice || course.price)}
                                </span>
                                {course.salePrice && (
                                    <span className="pb-1 text-sm font-bold text-slate-400 line-through">
                                        {formatPrice(course.price)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        <button
                            onClick={handleBuyNow}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 active:translate-y-0 ${
                                isEnrolled || isPreviewOnlyCourse
                                    ? 'bg-emerald-600 shadow-emerald-900/10 hover:bg-emerald-700'
                                    : 'bg-[#9B2528] shadow-red-950/10 hover:bg-[#7E1E21]'
                            }`}
                        >
                            {isEnrolled ? (
                                <><PlayCircle className="h-5 w-5" /> Vào học ngay</>
                            ) : isLeadCourse ? (
                                <><MessageCircleMore className="h-5 w-5" /> Đăng ký tư vấn</>
                            ) : course.isForSale === false ? (
                                <><PlayCircle className="h-5 w-5" /> Xem bài học thử</>
                            ) : (
                                <>Đăng ký khóa học</>
                            )}
                        </button>

                        {!isEnrolled && !isLeadCourse && course.isForSale !== false && hasPreviewLessons && (
                            <button
                                onClick={handlePreview}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                            >
                                <PlayCircle className="h-5 w-5" /> Học thử miễn phí
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setWishlist(!wishlist)}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-colors ${
                            wishlist ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                    >
                        <Heart className={`h-4 w-4 ${wishlist ? 'fill-current' : ''}`} />
                        {wishlist ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
                    </button>

                    <div className="my-5 h-px bg-slate-100" />

                    <ul className="space-y-3 text-[13px] font-medium text-slate-600">
                        {isLeadCourse ? (
                            <>
                                <li className="flex items-start gap-2.5"><MessageCircleMore className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Được tư vấn lộ trình phù hợp</span></li>
                                <li className="flex items-start gap-2.5"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Đội ngũ Mali Edu chủ động liên hệ</span></li>
                                <li className="flex items-start gap-2.5"><LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Giải đáp lịch học và chính sách tham gia</span></li>
                            </>
                        ) : isPreviewOnlyCourse ? (
                            <>
                                <li className="flex items-start gap-2.5"><PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Xem các bài học được mở miễn phí</span></li>
                                <li className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Cần cấp quyền để xem toàn bộ nội dung</span></li>
                                <li className="flex items-start gap-2.5"><LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Học trên điện thoại và máy tính</span></li>
                            </>
                        ) : (
                            <>
                                <li className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Sở hữu khóa học trọn đời</span></li>
                                <li className="flex items-start gap-2.5"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Cấp chứng nhận hoàn thành</span></li>
                                <li className="flex items-start gap-2.5"><LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Hỗ trợ chuyên môn 24/7</span></li>
                                <li className="flex items-start gap-2.5"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Học trên điện thoại và máy tính</span></li>
                            </>
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-xs text-slate-500">Cần tư vấn thêm?</p>
                <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="mt-1 inline-block text-sm font-black text-slate-800 hover:text-secret-wax">
                    Hotline: {HOTLINE}
                </a>
            </div>
        </aside>
    );
};

export default CourseSidebar;
