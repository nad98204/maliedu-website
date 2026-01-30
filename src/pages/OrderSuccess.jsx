import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, CheckCircle, Home, ArrowRight } from "lucide-react";

import { getOrderById, formatPrice } from "../utils/orderService";

// BANK CONFIG
const BANK_INFO = {
    BANK_ID: "MB", // MB Bank
    ACCOUNT_NO: "0355067656", // Fake or provided Account
    ACCOUNT_NAME: "NGUYEN THI MONG", // Example Name
    TEMPLATE: "compact2" // VietQR Template
};

const OrderSuccess = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (orderId) {
                    const data = await getOrderById(orderId);
                    setOrder(data);
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Đã sao chép: " + text);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-secret-wax border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <h2 className="text-xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
            <Link to="/" className="text-secret-wax hover:underline">Về trang chủ</Link>
        </div>
    );

    // QR Code URL Generation
    // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<INFO>&accountName=<NAME>
    const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-${BANK_INFO.TEMPLATE}.png?amount=${order.amount}&addInfo=${encodeURIComponent(`MALI ${order.orderCode}`)}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`;

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="container max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="bg-green-600 p-8 text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold mb-2">Đặt hàng thành công!</h1>
                        <p className="opacity-90">Mã đơn hàng: <span className="font-mono font-bold">{order.orderCode}</span></p>
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Left: Payment Info */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-4 border-l-4 border-secret-wax pl-3">Thông tin chuyển khoản</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Vui lòng chuyển khoản chính xác số tiền và nội dung bên dưới để hệ thống tự động kích hoạt khóa học.
                                    </p>

                                    <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500">Ngân hàng</span>
                                            <span className="font-semibold text-slate-900">{BANK_INFO.BANK_ID} (MB Bank)</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500">Số tài khoản</span>
                                            <button onClick={() => copyToClipboard(BANK_INFO.ACCOUNT_NO)} className="flex items-center gap-2 font-bold text-lg text-secret-ink hover:text-secret-wax transition-colors">
                                                {BANK_INFO.ACCOUNT_NO} <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500">Chủ tài khoản</span>
                                            <span className="font-semibold text-slate-900 uppercase">{BANK_INFO.ACCOUNT_NAME}</span>
                                        </div>
                                        <div className="flex justify-between items-center group pt-4 border-t border-slate-200">
                                            <span className="text-sm text-slate-500">Số tiền</span>
                                            <button onClick={() => copyToClipboard(order.amount)} className="flex items-center gap-2 font-bold text-xl text-red-600">
                                                {formatPrice(order.amount)} <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500">Nội dung CK</span>
                                            <button onClick={() => copyToClipboard(`MALI ${order.orderCode}`)} className="flex items-center gap-2 font-mono font-bold text-secret-ink bg-yellow-100 px-2 py-1 rounded border border-yellow-200">
                                                MALI {order.orderCode} <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        className="w-full bg-secret-wax text-white font-bold py-3 rounded-xl shadow-lg hover:bg-secret-ink transition-all"
                                        onClick={() => alert("Cảm ơn bạn! Admin sẽ kiểm tra và duyệt đơn sớm nhất.")}
                                    >
                                        TÔI ĐÃ CHUYỂN KHOẢN
                                    </button>
                                    <div className="text-center">
                                        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-secret-wax transition-colors text-sm font-medium">
                                            <Home className="w-4 h-4" /> Về trang chủ
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right: QR Code & Order Detail */}
                            <div className="flex flex-col items-center justify-center space-y-8">
                                <div className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-secret-wax/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <img src={qrUrl} alt="VietQR Payment" className="w-64 h-auto rounded-lg" />
                                    <p className="text-center text-xs text-slate-400 mt-2 font-medium">Quét mã để thanh toán tự động</p>
                                </div>

                                <div className="w-full bg-slate-50 rounded-xl p-6 border border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Chi tiết đơn hàng</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Khóa học</span>
                                            <span className="font-medium text-slate-900 text-right max-w-[60%]">{order.courseName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Khách hàng</span>
                                            <span className="font-medium text-slate-900">{order.customerName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Ngày đặt</span>
                                            <span className="font-medium text-slate-900">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                                            <span className="font-bold text-slate-700">Trạng thái</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {order.status === 'completed' ? 'Đã kích hoạt' : 'Chờ xác nhận'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
