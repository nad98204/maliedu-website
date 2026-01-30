import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/orderService";

const Cart = () => {
    const { cartItems, removeFromCart, totalAmount } = useCart();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20">
            <div className="container max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Giỏ hàng của bạn</h1>

                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-semibold text-slate-700 mb-2">Giỏ hàng trống</h2>
                        <p className="text-slate-500 mb-8">Bạn chưa thêm khóa học nào vào giỏ hàng.</p>
                        <Link
                            to="/khoa-hoc"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-secret-wax text-white font-bold rounded-xl hover:bg-secret-ink transition-colors"
                        >
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center group hover:border-secret-wax/30 transition-all"
                                >
                                    <Link to={`/khoa-hoc/${item.slug}`} className="shrink-0 overflow-hidden rounded-lg">
                                        <img
                                            src={item.thumbnailUrl || "https://via.placeholder.com/150"}
                                            alt={item.name}
                                            className="w-24 h-24 object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/khoa-hoc/${item.slug}`}>
                                            <h3 className="font-bold text-slate-900 text-lg hover:text-secret-wax transition-colors line-clamp-2">
                                                {item.name}
                                            </h3>
                                        </Link>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                                        <div className="font-bold text-red-600 text-lg">
                                            {formatPrice(item.salePrice || item.price)}
                                        </div>
                                        {item.salePrice && (
                                            <div className="text-sm text-slate-400 line-through">
                                                {formatPrice(item.price)}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Xóa khỏi giỏ hàng"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-6 sticky top-24">
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Tóm tắt đơn hàng</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                                        <span className="font-medium">{formatPrice(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-100 pt-4">
                                        <span>Tổng cộng</span>
                                        <span className="text-red-600">{formatPrice(totalAmount)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate("/thanh-toan/cart")}
                                    className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    THANH TOÁN NGAY <ArrowRight className="w-5 h-5" />
                                </button>
                                <p className="text-xs text-center text-slate-500 mt-4">
                                    Bằng việc tiến hành thanh toán, bạn đồng ý với điều khoản dịch vụ của chúng tôi.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
