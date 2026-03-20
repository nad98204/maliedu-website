import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingCart, Clock, ExternalLink, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { formatPrice, cancelOrder } from "../utils/orderService";

const Cart = () => {
    const { cartItems, removeFromCart, totalAmount, pendingOrders } = useCart();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(
        pendingOrders.length > 0 && cartItems.length === 0 ? 'pending' : 'cart'
    );
    const [cancelConfirm, setCancelConfirm] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = async (orderId) => {
        setCancelling(true);
        try {
            await cancelOrder(orderId);
            toast.success('Đã hủy đơn hàng thành công');
            setCancelConfirm(null);
        } catch (error) {
            toast.error('Lỗi hủy đơn: ' + error.message);
        } finally {
            setCancelling(false);
        }
    };

    const tabs = [
        { id: 'cart', label: 'Giỏ hàng', icon: ShoppingCart, count: cartItems.length },
        { id: 'pending', label: 'Chờ thanh toán', icon: Clock, count: pendingOrders.length },
    ];

    return (
        <>
            {/* ====== MODAL XÁC NHẬN HỦY ====== */}
            {cancelConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => !cancelling && setCancelConfirm(null)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-9 h-9 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Hủy đơn hàng?</h3>
                                <p className="text-slate-500 text-sm mt-2">
                                    Nếu đã chuyển khoản, vui lòng liên hệ admin để hoàn tiền.<br />
                                    Hành động này <strong>không thể hoàn tác</strong>.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setCancelConfirm(null)}
                                    disabled={cancelling}
                                    className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    Giữ lại
                                </button>
                                <button
                                    onClick={() => handleCancel(cancelConfirm)}
                                    disabled={cancelling}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {cancelling
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang hủy...</>
                                        : <><XCircle className="w-4 h-4" /> Xác nhận hủy</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== MAIN PAGE ====== */}
            <div className="min-h-screen bg-slate-50 pt-32 pb-20">
                <div className="container max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">Giỏ hàng của bạn</h1>

                    {/* Tab switcher */}
                    <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive
                                        ? tab.id === 'pending'
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                            : 'bg-secret-wax text-white shadow-lg shadow-secret-wax/20'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold rounded-full ${isActive
                                            ? 'bg-white/30 text-white'
                                            : tab.id === 'pending'
                                                ? 'bg-orange-100 text-orange-600'
                                                : 'bg-secret-wax/10 text-secret-wax'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ============ TAB: GIỎ HÀNG ============ */}
                    {activeTab === 'cart' && (
                        cartItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <ShoppingCart className="w-16 h-16 text-slate-200 mb-4" />
                                <h2 className="text-xl font-semibold text-slate-700 mb-2">Giỏ hàng trống</h2>
                                <p className="text-slate-500 mb-6">Bạn chưa thêm khóa học nào vào giỏ hàng.</p>
                                {pendingOrders.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-50 text-orange-600 font-bold rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Bạn có {pendingOrders.length} đơn chờ thanh toán →
                                    </button>
                                )}
                                <Link
                                    to="/khoa-hoc"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-secret-wax text-white font-bold rounded-xl hover:bg-secret-ink transition-colors"
                                >
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        )
                    )}

                    {/* ============ TAB: ĐƠN CHỜ THANH TOÁN ============ */}
                    {activeTab === 'pending' && (
                        pendingOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <CheckCircle className="w-16 h-16 text-green-300 mb-4" />
                                <h2 className="text-xl font-semibold text-slate-700 mb-2">Không có đơn nào chờ thanh toán</h2>
                                <p className="text-slate-500 mb-8">Tất cả đơn hàng của bạn đã được xử lý.</p>
                                <Link to="/khoa-hoc"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-secret-wax text-white font-bold rounded-xl hover:bg-secret-ink transition-colors">
                                    Khám phá khóa học
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-2xl">
                                {/* Banner */}
                                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-orange-800 text-sm">Bạn có {pendingOrders.length} đơn hàng chưa thanh toán</p>
                                        <p className="text-orange-600 text-xs mt-0.5">
                                            Hoàn tất thanh toán để kích hoạt khóa học. Đơn sẽ tự động duyệt sau khi nhận chuyển khoản.
                                        </p>
                                    </div>
                                </div>

                                {pendingOrders.map((order) => (
                                    <div key={order.id}
                                        className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-300 transition-all">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-5 py-3 bg-orange-50 border-b border-orange-100">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                <span className="font-mono font-bold text-orange-700 text-sm">{order.orderCode}</span>
                                            </div>
                                            <span className="text-xs text-orange-500 font-medium">
                                                {order.createdAt?.toDate
                                                    ? order.createdAt.toDate().toLocaleDateString('vi-VN', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })
                                                    : ''}
                                            </span>
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                                                    {order.courseName || order.items?.[0]?.name}
                                                </h3>
                                                {order.items && order.items.length > 1 && (
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        + {order.items.length - 1} khóa học khác
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-bold text-red-600 text-xl">
                                                    {formatPrice(order.amount)}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">Chờ xác nhận</div>
                                            </div>
                                        </div>

                                        {/* Footer - 2 nút */}
                                        <div className="px-5 pb-5 flex gap-3">
                                            <button
                                                onClick={() => setCancelConfirm(order.id)}
                                                className="flex items-center justify-center gap-1.5 py-2.5 px-4 border-2 border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-sm"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Hủy đơn
                                            </button>
                                            <Link
                                                to={`/dat-hang-thanh-cong/${order.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 text-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Xem thông tin thanh toán
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    );
};

export default Cart;
