import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, ArrowLeft, ShieldCheck, CreditCard } from "lucide-react";

import { db, auth } from "../firebase";
import { createOrder, formatPrice } from "../utils/orderService";
import { getActiveAffiliateRef, validateCouponCode } from "../utils/affiliateService";
import { trackMetaEvent } from "../utils/metaPixel";
import { isLeadGenerationCourse, openCourseLeadLanding } from "../utils/courseMarketing";
import AuthModal from "../components/AuthModal";
import {
    formatAccessDuration,
    getActiveCourseAccessPlans,
    getCourseAccessPlanById,
    getDefaultCourseAccessPlan,
    getPlanEffectivePrice,
} from "../utils/coursePricing";
import { INITIAL_TRACKS } from "../data/hypnosisTracksData";

const Checkout = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        note: ""
    });

    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState(null); // { code: 'MALI20', discountPercent: 20 }
    const [checkingCoupon, setCheckingCoupon] = useState(false);
    const selectedPlan = useMemo(() => {
        if (!course) return null;
        return getCourseAccessPlanById(course, selectedPlanId);
    }, [course, selectedPlanId]);
    const accessPlans = useMemo(() => (
        !course ? [] : getActiveCourseAccessPlans(course)
    ), [course]);
    const finalPrice = useMemo(() => {
        if (!course) return 0;
        const basePrice = getPlanEffectivePrice(selectedPlan || getDefaultCourseAccessPlan(course));
        if (!couponApplied) return basePrice;
        const discountAmount = basePrice * (couponApplied.discountPercent / 100);
        return Math.max(0, Math.round(basePrice - discountAmount));
    }, [course, couponApplied, selectedPlan]);

    const buildHypnosisPayload = (hData) => {
        const parseNumeric = (val) => {
            if (typeof val === 'number') return val;
            const n = String(val || '').replace(/\D/g, '');
            return n ? parseInt(n, 10) : 0;
        };

        const currentPrice = parseNumeric(hData.price);
        const originalPrice = parseNumeric(hData.originalPrice);

        // In coursePricing logic:
        // price: the listed/original price (shown crossed out if salePrice exists)
        // salePrice: the effective discounted price
        const hasDiscount = originalPrice > 0 && originalPrice > currentPrice;
        const basePrice = hasDiscount ? originalPrice : currentPrice;
        const effectiveSalePrice = hasDiscount ? currentPrice : null;

        return {
            id: hData.id,
            name: hData.title || hData.name || "Bản thôi miên",
            thumbnailUrl: hData.coverImageSquare || hData.coverImage || hData.thumbnailUrl || "",
            isHypnosis: true,
            author: hData.author || "Master Coach Mong",
            price: basePrice,
            salePrice: effectiveSalePrice,
            originalPrice: hasDiscount ? originalPrice : (currentPrice ? currentPrice * 2 : 0),
            accessPlansEnabled: true,
            accessPlans: [
                {
                    id: 'lifetime-audio',
                    name: 'Nghe & Sở hữu trọn đời',
                    price: basePrice,
                    salePrice: effectiveSalePrice,
                    accessType: 'lifetime',
                    isActive: true,
                    isRecommended: true,
                }
            ],
            defaultAccessPlanId: 'lifetime-audio'
        };
    };

    useEffect(() => {
        let active = true;
        const fetchCourse = async () => {
            setLoading(true);
            setCourse(null);
            setCouponApplied(null);

            // 1. Kiểm tra khóa học trong Firestore
            try {
                const docSnap = await getDoc(doc(db, "courses", courseId));
                if (!active) return;
                if (docSnap.exists()) {
                    const courseData = { ...docSnap.data(), id: docSnap.id };
                    if (isLeadGenerationCourse(courseData)) {
                        openCourseLeadLanding({ course: courseData, navigate });
                        return;
                    }
                    setCourse(courseData);
                    const requestedPlanId = searchParams.get('plan');
                    setSelectedPlanId(getCourseAccessPlanById(courseData, requestedPlanId)?.id || '');
                    return;
                }
            } catch (courseErr) {
                console.warn("Could not query courses collection:", courseErr);
            }

            // 2. Kiểm tra bản thôi miên trong Firestore (hypnosis_audios)
            try {
                const hypnosisSnap = await getDoc(doc(db, "hypnosis_audios", courseId));
                if (!active) return;
                if (hypnosisSnap.exists()) {
                    const hypnosisCourseData = buildHypnosisPayload({ ...hypnosisSnap.data(), id: hypnosisSnap.id });
                    setCourse(hypnosisCourseData);
                    setSelectedPlanId('lifetime-audio');
                    return;
                }
            } catch (hypnosisErr) {
                console.warn("Could not query hypnosis_audios collection:", hypnosisErr);
            }

            // 3. Kiểm tra bản thôi miên trong INITIAL_TRACKS mẫu
            const sampleTrack = INITIAL_TRACKS.find(t => t.id === courseId);
            if (sampleTrack) {
                const hypnosisCourseData = buildHypnosisPayload(sampleTrack);
                setCourse(hypnosisCourseData);
                setSelectedPlanId('lifetime-audio');
                return;
            }

            // 4. Không tìm thấy sản phẩm
            if (active) {
                setCourse(null);
            }
        };

        if (courseId) {
            fetchCourse().finally(() => {
                if (active) setLoading(false);
            });
        } else {
            setLoading(false);
        }

        return () => { active = false; };
    }, [courseId, navigate, searchParams]);

    useEffect(() => {
        // Check Auth and autofill
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setFormData(prev => ({
                    ...prev,
                    fullName: currentUser.displayName || "",
                    email: currentUser.email || ""
                }));
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (course) {
            trackMetaEvent("InitiateCheckout", {
                content_name: course.name || "Checkout",
                content_ids: [course.id],
                content_type: 'product',
                num_items: 1,
                value: finalPrice,
                currency: 'VND'
            });
        }
    }, [course, finalPrice]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCheckingCoupon(true);
        try {
            const couponData = await validateCouponCode(couponCode.trim().toUpperCase());

            setCouponApplied({
                code: couponData.code,
                discountPercent: couponData.discountPercent
            });
            alert(`Áp dụng mã ${couponData.code} giảm ${couponData.discountPercent}% thành công!`);

        } catch (error) {
            console.error("Error checking coupon:", error);
            setCouponApplied(null);
            alert(error.message || "Lỗi khi kiểm tra mã giảm giá");
        } finally {
            setCheckingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponApplied(null);
        setCouponCode("");
    };

    const calculateFinalPrice = () => {
        return finalPrice;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }
        setSubmitting(true);
        try {
            const finalUserId = user?.uid || null;
            const customerEmail = user?.email || formData.email;

            const isHypnosis = Boolean(course.isHypnosis);
            const orderItems = [{
                id: course.id,
                name: course.name,
                accessPlanId: selectedPlan?.id || 'lifetime-audio',
                accessPlanName: selectedPlan?.name || (isHypnosis ? 'Nghe & Sở hữu trọn đời' : 'Truy cập vĩnh viễn'),
                accessDuration: isHypnosis ? 'Trọn đời' : formatAccessDuration(selectedPlan),
                price: getPlanEffectivePrice(selectedPlan),
                thumbnailUrl: course.thumbnailUrl,
                productType: isHypnosis ? 'hypnosis' : 'course',
            }];

            const activeAffiliateCode = await getActiveAffiliateRef();

            const orderData = {
                userId: finalUserId,
                userEmail: customerEmail,
                // Customer Info
                customerName: formData.fullName,
                customerPhone: formData.phone,
                customerEmail: formData.email,
                customerNote: formData.note,
                // Order Info
                items: orderItems,
                courseId: course.id,
                courseName: course.name,
                productType: isHypnosis ? 'hypnosis' : 'course',
                trackId: isHypnosis ? course.id : null,
                trackTitle: isHypnosis ? course.name : null,
                amount: calculateFinalPrice(), // Final amount after coupon
                originalAmount: getPlanEffectivePrice(selectedPlan),
                couponCode: couponApplied ? couponApplied.code : null,
                discountPercent: couponApplied ? couponApplied.discountPercent : 0,
                affiliateCode: activeAffiliateCode || null,
            };

            const result = await createOrder(orderData);

            navigate(`/dat-hang-thanh-cong/${result.id}`);
        } catch (error) {
            console.error("Submit Error:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-secret-wax" />
        </div>
    );

    if (!course) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-20 flex items-center justify-center">
                <div className="max-w-md w-full mx-4 bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowLeft className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy sản phẩm</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Sản phẩm hoặc bản thôi miên bạn đang tìm không tồn tại hoặc đã ngừng phát hành.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate("/thoi-mien")}
                            className="w-full py-3 bg-secret-wax text-white font-medium rounded-xl hover:bg-secret-ink transition-colors"
                        >
                            Khám phá Thư viện Thôi miên
                        </button>
                        <button
                            onClick={() => navigate("/khoa-hoc")}
                            className="w-full py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Xem Danh sách Khóa học
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="container max-w-6xl mx-auto px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-secret-ink mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secret-wax text-white text-sm">1</span>
                                Thông tin đăng ký
                            </h2>

                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            required
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                                            placeholder="0912345678"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                                        placeholder="email@example.com"
                                    />
                                    <p className="text-xs text-slate-500">
                                        {course.isHypnosis
                                            ? "Bản thôi miên sẽ được lưu vào tài khoản và thông tin gửi qua email này."
                                            : "Thông tin khóa học sẽ được gửi qua email này và dùng để kích hoạt tài khoản."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ghi chú (nếu có)</label>
                                    <textarea
                                        name="note"
                                        rows="3"
                                        value={formData.note}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                                        placeholder="Lời nhắn..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secret-wax text-white text-sm">2</span>
                                Phương thức thanh toán
                            </h2>

                            <div className="p-4 border-2 border-secret-wax bg-secret-wax/5 rounded-xl flex items-center gap-4 cursor-pointer">
                                <div className="w-5 h-5 rounded-full border-[6px] border-secret-wax bg-white"></div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-secret-wax" />
                                        Chuyển khoản ngân hàng (QR Code)
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Quét mã QR để thanh toán. Hệ thống tự đối chiếu giao dịch và kích hoạt {course.isHypnosis ? "bản thôi miên" : "khóa học"}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden sticky top-24">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900">Tóm tắt đơn hàng</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex gap-4">
                                    <img
                                        src={course.thumbnailUrl || "https://via.placeholder.com/150"}
                                        alt={course.name}
                                        className="w-20 h-20 rounded-lg object-cover bg-slate-100"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 line-clamp-2 text-sm">{course.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{selectedPlan?.name || (course.isHypnosis ? 'Nghe & Sở hữu trọn đời' : 'Truy cập vĩnh viễn')} · {formatAccessDuration(selectedPlan)}</p>
                                    </div>
                                </div>

                                {course.accessPlansEnabled && accessPlans.length > 1 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Gói quyền học</label>
                                        <select
                                            value={selectedPlanId}
                                            onChange={(event) => {
                                                setSelectedPlanId(event.target.value);
                                                setCouponApplied(null);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/10"
                                        >
                                            {accessPlans.map((plan) => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} — {formatAccessDuration(plan)} — {formatPrice(getPlanEffectivePrice(plan))}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-3 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Giá gốc</span>
                                        <span className="text-slate-400 line-through">
                                            {formatPrice(selectedPlan?.price ?? course?.price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-900">Thành tiền</span>
                                        <div className="text-right">
                                            {couponApplied ? (
                                                <>
                                                    <span className="block text-sm text-slate-400 line-through">
                                                        {formatPrice(getPlanEffectivePrice(selectedPlan || course))}
                                                    </span>
                                                    <span className="text-red-600 text-lg">
                                                        {formatPrice(calculateFinalPrice())}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-red-600 text-lg">
                                                    {formatPrice(calculateFinalPrice())}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Coupon Section */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nhập mã ưu đãi"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                disabled={!!couponApplied}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-1 focus:ring-secret-wax"
                                            />
                                            {couponApplied ? (
                                                <button
                                                    type="button"
                                                    onClick={removeCoupon}
                                                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleApplyCoupon}
                                                    disabled={checkingCoupon || !couponCode}
                                                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70"
                                                >
                                                    {checkingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                                                </button>
                                            )}
                                        </div>
                                        {couponApplied && (
                                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" />
                                                Đã giảm {couponApplied.discountPercent}% với mã {couponApplied.code}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                    <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>Cam kết bảo mật thông tin và hoàn tiền nếu không hài lòng trong 7 ngày đầu.</span>
                                </div>

                                <button
                                    form="checkout-form"
                                    disabled={submitting}
                                    className="w-full bg-secret-wax text-white font-bold py-4 rounded-xl shadow-lg hover:bg-secret-ink hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Xử lý...
                                        </>
                                    ) : (
                                        user ? "ĐẶT HÀNG & THANH TOÁN" : "ĐĂNG NHẬP ĐỂ THANH TOÁN"
                                    )}
                                </button>
                                {!user && (
                                    <p className="text-center text-xs leading-5 text-amber-700">
                                        Bạn cần đăng nhập để hệ thống tự cấp đúng {course.isHypnosis ? "bài thôi miên" : "khóa học"} ngay sau khi nhận tiền.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default Checkout;
