import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Heart,
    LifeBuoy,
    PlayCircle,
    ShieldCheck,
    ShoppingCart,
} from 'lucide-react';
import { formatPrice } from '../utils/orderService';
import { HOTLINE } from '../menuData';
import { useCart } from '../context/CartContext';

const CourseSidebar = ({ course, onBuyClick, isEnrolled }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [wishlist, setWishlist] = useState(false);
    const isPreviewOnlyCourse = course.isForSale === false && !isEnrolled;

    const handleBuyNow = () => {
        if (onBuyClick) {
            onBuyClick();
            return;
        }

        if (isEnrolled) {
            navigate(`/bai-giang/${course.id}`);
            return;
        }

        if (course.isForSale === false) {
            navigate(`/bai-giang/${course.id}?preview=1`);
            return;
        }

        navigate(`/thanh-toan/${course.id}`);
    };

    return (
        <div className="sticky top-24 z-10">
            <div className="ring-1 ring-gray-100/50 flex min-h-[600px] flex-col overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl">
                <div className="relative aspect-video">
                    <img
                        src={course.thumbnailUrl || 'https://via.placeholder.com/600x400'}
                        alt={course.name}
                        className="h-full w-full object-cover"
                    />
                    {!isEnrolled && course.isForSale !== false && course.salePrice && (
                        <div className="absolute right-2 top-2 animate-pulse rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                            Tiết kiệm{' '}
                            {Math.round(((course.price - course.salePrice) / course.price) * 100)}%
                        </div>
                    )}
                </div>

                <div className="flex flex-grow flex-col p-6">
                    <div className="mb-6">
                        {isEnrolled ? (
                            <div className="text-center">
                                <span className="text-3xl font-extrabold text-[#16a34a]">
                                    ĐÃ SỞ HỮU
                                </span>
                            </div>
                        ) : course.isForSale === false ? (
                            <div className="text-center">
                                <span className="text-3xl font-extrabold text-[#16a34a]">
                                    HỌC THỬ
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#B91C1C]">
                                    {formatPrice(course.salePrice || course.price)}
                                </span>
                                {course.salePrice && (
                                    <span className="text-lg text-gray-400 line-through decoration-1">
                                        {formatPrice(course.price)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mb-6 space-y-3">
                        <button
                            onClick={handleBuyNow}
                            className={`group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold text-white shadow-lg transition-all active:translate-y-0 ${
                                isEnrolled || course.isForSale === false
                                    ? 'bg-[#16a34a] hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-xl'
                                    : 'bg-[#ef4444] hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl'
                            }`}
                        >
                            {isEnrolled ? (
                                <>
                                    <PlayCircle className="h-6 w-6" /> VÀO HỌC NGAY
                                </>
                            ) : course.isForSale === false ? (
                                <>
                                    <PlayCircle className="h-6 w-6" /> XEM BÀI HỌC THỬ
                                </>
                            ) : (
                                <>ĐĂNG KÝ NGAY</>
                            )}
                        </button>

                        {!isEnrolled && course.isForSale !== false && (
                            <button
                                onClick={() => addToCart(course)}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:border-[#FCD34D] hover:bg-slate-50"
                            >
                                <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-[#FCD34D]" />
                                Thêm vào giỏ hàng
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setWishlist(!wishlist)}
                        className={`flex w-full items-center justify-start gap-2 text-sm font-medium transition-colors ${
                            wishlist ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Heart className={`h-5 w-5 ${wishlist ? 'fill-current' : ''}`} />
                        {wishlist ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
                    </button>

                    <div className="flex-grow"></div>

                    <hr className="my-6 border-gray-100" />

                    <ul className="space-y-4 text-sm font-medium text-slate-700">
                        {isPreviewOnlyCourse ? (
                            <>
                                <li className="flex items-start gap-3">
                                    <PlayCircle className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Chỉ xem được các bài học mở xem thử</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Cần admin cấp quyền để xem toàn bộ nội dung</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <LifeBuoy className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Học được trên Mobile và PC</span>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Sở hữu khóa học trọn đời</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Cấp chứng nhận hoàn thành</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <LifeBuoy className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Hỗ trợ chuyên môn 24/7</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-amber-500" />
                                    <span>Học trên mọi thiết bị (Mobile, PC)</span>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="mb-2 text-sm text-slate-500">Bạn cần tư vấn thêm?</p>
                <a
                    href={`tel:${HOTLINE.replace(/\s/g, '')}`}
                    className="font-bold text-slate-800 transition-colors hover:text-secret-wax"
                >
                    Hotline: {HOTLINE}
                </a>
            </div>
        </div>
    );
};

export default CourseSidebar;
