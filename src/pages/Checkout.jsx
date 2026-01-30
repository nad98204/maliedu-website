import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, ArrowLeft, ShieldCheck, CreditCard } from "lucide-react";

import { db, auth } from "../firebase";
import { createOrder, formatPrice } from "../utils/orderService";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useCart } from "../context/CartContext";

const Checkout = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { cartItems, clearCart, totalAmount } = useCart();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        note: ""
    });

    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState(null); // { code: 'MALI20', discountPercent: 20 }
    const [checkingCoupon, setCheckingCoupon] = useState(false);

    useEffect(() => {
        // Fetch Course Info or Load Cart
        const fetchCourseOrCart = async () => {
            if (courseId === 'cart') {
                if (cartItems.length === 0) {
                    alert("Giỏ hàng trống!");
                    navigate("/khoa-hoc");
                    return;
                }
                // Mock a "course" object for compatibility or just use items
                setCourse({
                    id: 'cart',
                    name: `Đơn hàng (${cartItems.length} khóa học)`,
                    price: totalAmount,
                    salePrice: totalAmount,
                    thumbnailUrl: cartItems[0]?.thumbnailUrl // Use first item thumb
                });
                setLoading(false);
            } else {
                try {
                    const docRef = doc(db, "courses", courseId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setCourse({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        alert("Khóa học không tồn tại!");
                        navigate("/khoa-hoc");
                    }
                } catch (error) {
                    console.error("Error fetching course:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (courseId) fetchCourseOrCart();

        // Check Auth and autofill
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setFormData(prev => ({
                    ...prev,
                    fullName: currentUser.displayName || "",
                    email: currentUser.email || ""
                }));
            }
        });

        return () => unsubscribe();
    }, [courseId, navigate, cartItems, totalAmount]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCheckingCoupon(true);
        try {
            const q = query(
                collection(db, "coupons"),
                where("code", "==", couponCode.trim().toUpperCase()),
                where("isActive", "==", true)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
                setCouponApplied(null);
                return;
            }

            const couponData = snapshot.docs[0].data();
            const now = new Date();
            const expiry = new Date(couponData.expiryDate);

            if (now > expiry) {
                alert("Mã giảm giá đã hết hạn!");
                setCouponApplied(null);
                return;
            }

            setCouponApplied({
                code: couponData.code,
                discountPercent: couponData.discountPercent
            });
            alert(`Áp dụng mã ${couponData.code} giảm ${couponData.discountPercent}% thành công!`);

        } catch (error) {
            console.error("Error checking coupon:", error);
            alert("Lỗi khi kiểm tra mã giảm giá");
        } finally {
            setCheckingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponApplied(null);
        setCouponCode("");
    };

    const calculateFinalPrice = () => {
        if (!course) return 0;
        const basePrice = course.salePrice || course.price || 0;
        if (!couponApplied) return basePrice;
        const discountAmount = basePrice * (couponApplied.discountPercent / 100);
        return Math.max(0, basePrice - discountAmount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalUserId = user?.uid;
            const customerEmail = user?.email || formData.email;

            // 1. If user is NOT logged in, find or create a user in Firestore
            if (!finalUserId) {
                // Check if user exists with this email
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("email", "==", customerEmail));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Start using existing user
                    const foundUser = querySnapshot.docs[0];
                    finalUserId = foundUser.id;
                    // Optional: Update phone/name if missing? 
                    // For now, respect existing data to avoid overwrites
                } else {
                    // Create NEW Shadow User
                    const newUserRef = await addDoc(usersRef, {
                        email: customerEmail,
                        displayName: formData.fullName,
                        phoneNumber: formData.phone || "",
                        role: 'student',
                        createdAt: serverTimestamp(),
                        photoURL: null,
                        isShadow: true
                    });
                    finalUserId = newUserRef.id;
                }
            }

            const isCartOrder = courseId === 'cart';
            // Prepare items array
            const orderItems = isCartOrder ? cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.salePrice || item.price || 0,
                thumbnailUrl: item.thumbnailUrl
            })) : [{
                id: course.id,
                name: course.name,
                price: calculateFinalPrice(), // For single course, price is calculated
                thumbnailUrl: course.thumbnailUrl
            }];

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
                courseId: isCartOrder ? 'cart-order' : course.id, // Legacy compatibility
                courseName: isCartOrder ? `Đơn hàng gồm ${cartItems.length} khóa học` : course.name,
                amount: calculateFinalPrice(), // Final amount after coupon
                originalAmount: isCartOrder ? totalAmount : (course.salePrice || course.price || 0),
                couponCode: couponApplied ? couponApplied.code : null,
                discountPercent: couponApplied ? couponApplied.discountPercent : 0,
            };

            const result = await createOrder(orderData);

            if (isCartOrder) {
                clearCart();
            }

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

    if (!course) return null;

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
                                    <p className="text-xs text-slate-500">Thông tin khóa học sẽ được gửi qua email này và dùng để kích hoạt tài khoản.</p>
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
                                        Quét mã QR để thanh toán nhanh chóng. Đơn hàng sẽ được kích hoạt sau khi admin xác nhận.
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
                                {courseId === 'cart' ? (
                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex gap-4">
                                                <img
                                                    src={item.thumbnailUrl || "https://via.placeholder.com/150"}
                                                    alt={item.name}
                                                    className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 line-clamp-2 text-xs">{item.name}</h4>
                                                    <p className="text-xs text-red-600 font-bold mt-1">
                                                        {formatPrice(item.salePrice || item.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <img
                                            src={course.thumbnailUrl || "https://via.placeholder.com/150"}
                                            alt={course.name}
                                            className="w-20 h-20 rounded-lg object-cover bg-slate-100"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-900 line-clamp-2 text-sm">{course.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">Trọn đời</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Giá gốc</span>
                                        <span className="text-slate-400 line-through">{formatPrice(course.price)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-900">Thành tiền</span>
                                        <div className="text-right">
                                            {couponApplied ? (
                                                <>
                                                    <span className="block text-sm text-slate-400 line-through">
                                                        {formatPrice(course.salePrice || course.price)}
                                                    </span>
                                                    <span className="text-red-600 text-lg">
                                                        {formatPrice(calculateFinalPrice())}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-red-600 text-lg">
                                                    {formatPrice(course.salePrice || course.price)}
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
                                        "ĐẶT HÀNG & THANH TOÁN"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
