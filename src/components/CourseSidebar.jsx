import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck, LifeBuoy, ShoppingCart, Heart } from 'lucide-react';
import { formatPrice } from '../utils/orderService';
import { HOTLINE } from '../menuData';
import { useCart } from '../context/CartContext';

const CourseSidebar = ({ course, onBuyClick }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [wishlist, setWishlist] = useState(false);

    const handleBuyNow = () => {
        if (onBuyClick) {
            onBuyClick();
            return;
        }
        if (course.isForSale === false) {
            navigate(`/bai-giang/${course.id}`);
        } else {
            navigate(`/thanh-toan/${course.id}`);
        }
    };

    return (
        <div className="sticky top-24 z-10">
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden ring-1 ring-gray-100/50 min-h-[600px] flex flex-col">
                {/* Thumbnail */}
                <div className="relative aspect-video">
                    <img
                        src={course.thumbnailUrl || "https://via.placeholder.com/600x400"}
                        alt={course.name}
                        className="w-full h-full object-cover"
                    />
                    {course.isForSale !== false && course.salePrice && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                            Tiết kiệm {Math.round(((course.price - course.salePrice) / course.price) * 100)}%
                        </div>
                    )}
                </div>

                <div className="p-6 flex-grow flex flex-col">
                    {/* Price */}
                    <div className="mb-6">
                        {course.isForSale === false ? (
                            <div className="text-center">
                                <span className="text-3xl font-extrabold text-[#16a34a]">MIỄN PHÍ</span>
                            </div>
                        ) : (
                            <div className="flex items-end gap-3 flex-wrap">
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

                    {/* Buttons */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleBuyNow}
                            className="w-full bg-[#ef4444] text-white font-bold py-4 px-6 rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
                        >
                            {course.isForSale === false ? (
                                <>
                                    VÀO HỌC NGAY
                                </>
                            ) : (
                                <>
                                    ĐĂNG KÝ NGAY
                                </>
                            )}
                        </button>

                        {course.isForSale !== false && (
                            <button
                                onClick={() => addToCart(course)}
                                className="w-full bg-white text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group hover:border-[#FCD34D]"
                            >
                                <ShoppingCart className="w-5 h-5 group-hover:text-[#FCD34D] transition-colors" />
                                Thêm vào giỏ hàng
                            </button>
                        )}
                    </div>

                    {/* Wishlist */}
                    <button
                        onClick={() => setWishlist(!wishlist)}
                        className={`w-full flex items-center justify-start gap-2 text-sm font-medium transition-colors ${wishlist ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${wishlist ? 'fill-current' : ''}`} />
                        {wishlist ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
                    </button>

                    <div className="flex-grow"></div>

                    <hr className="my-6 border-gray-100" />

                    {/* Features */}
                    <ul className="space-y-4 text-sm text-slate-700 font-medium">
                        <li className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>Sở hữu khóa học trọn đời</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>Cấp chứng nhận hoàn thành</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <LifeBuoy className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>Hỗ trợ chuyên môn 24/7</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>Học trên mọi thiết bị (Mobile, PC)</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Contact Support */}
            <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-sm text-slate-500 mb-2">Bạn cần tư vấn thêm?</p>
                <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="font-bold text-slate-800 hover:text-secret-wax transition-colors">
                    Hotline: {HOTLINE}
                </a>
            </div>
        </div>
    );
};

export default CourseSidebar;
