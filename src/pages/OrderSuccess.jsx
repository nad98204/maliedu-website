import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, CheckCircle, Home, Loader2, RefreshCw, Clock, AlertCircle, Zap, Smartphone, X, ChevronRight } from "lucide-react";

import { getOrderById, formatPrice } from "../utils/orderService";
import { getBankSettings, generateQrUrl, generateTransferContent } from "../utils/bankPaymentService";

// ============================
// DANH SÁCH NGÂN HÀNG + DEEPLINK
// ============================
const BANK_DEEPLINKS = [
    {
        id: "MB",
        name: "MB Bank",
        color: "#9b2330",
        logo: "https://api.vietqr.io/img/MB.png",
        deeplink: (accountNo, amount, content) =>
            `https://online.mbbank.com.vn/transfer?toAccountNumber=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "VIETCOMBANK",
        name: "Vietcombank",
        color: "#00703C",
        logo: "https://api.vietqr.io/img/VCB.png",
        deeplink: (accountNo, amount, content) =>
            `https://vcbdigibank.vietcombank.com.vn/transfer?to=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "TECHCOMBANK",
        name: "Techcombank",
        color: "#EE0033",
        logo: "https://api.vietqr.io/img/TCB.png",
        deeplink: (accountNo, amount, content) =>
            `https://techcombank.com/transfer?accountNo=${accountNo}&amount=${amount}&desc=${encodeURIComponent(content)}`
    },
    {
        id: "BIDV",
        name: "BIDV",
        color: "#1a5276",
        logo: "https://api.vietqr.io/img/BIDV.png",
        deeplink: (accountNo, amount, content) =>
            `https://smartbanking.bidv.com.vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "VIETINBANK",
        name: "VietinBank",
        color: "#003087",
        logo: "https://api.vietqr.io/img/CTG.png",
        deeplink: (accountNo, amount, content) =>
            `https://ipay.vietinbank.vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "AGRIBANK",
        name: "Agribank",
        color: "#00843D",
        logo: "https://api.vietqr.io/img/AGR.png",
        deeplink: (accountNo, amount, content) =>
            `https://agribank.com.vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "TPBANK",
        name: "TPBank",
        color: "#7b3fe4",
        logo: "https://api.vietqr.io/img/TPB.png",
        deeplink: (accountNo, amount, content) =>
            `https://ebank.tpb.vn/retail/vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "VPBANK",
        name: "VPBank",
        color: "#00B74A",
        logo: "https://api.vietqr.io/img/VPB.png",
        deeplink: (accountNo, amount, content) =>
            `https://vpbank.com.vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "ACB",
        name: "ACB",
        color: "#0066B3",
        logo: "https://api.vietqr.io/img/ACB.png",
        deeplink: (accountNo, amount, content) =>
            `https://acb.com.vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "SACOMBANK",
        name: "Sacombank",
        color: "#005BAA",
        logo: "https://api.vietqr.io/img/STB.png",
        deeplink: (accountNo, amount, content) =>
            `https://mbanking.sacombank.com.vn/transfer?account=${accountNo}&amount=${amount}&content=${encodeURIComponent(content)}`
    },
    {
        id: "MOMO",
        name: "MoMo",
        color: "#AF206E",
        logo: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
        deeplink: (accountNo, amount, content) =>
            `https://nhantien.momo.vn/transfer?to=${accountNo}&amount=${amount}&comment=${encodeURIComponent(content)}`
    },
    {
        id: "ZALOPAY",
        name: "ZaloPay",
        color: "#0068ff",
        logo: "https://zalopay.vn/images/logo.png",
        deeplink: (accountNo, amount, content) =>
            `https://zalopay.vn/transfer?to=${accountNo}&amount=${amount}&description=${encodeURIComponent(content)}`
    },
];

// ============================
// MODAL CHỌN NGÂN HÀNG
// ============================
const BankSelectorModal = ({ isOpen, onClose, bankSettings, amount, transferContent }) => {
    if (!isOpen) return null;

    const handleBankClick = (bank) => {
        const url = bank.deeplink(bankSettings.accountNo, amount, transferContent);
        window.open(url, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <div
                className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '85vh' }}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Chọn ngân hàng</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Mở app ngân hàng với thông tin đã điền sẵn</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Thông tin sẽ điền tự động */}
                <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
                    <p className="text-xs text-yellow-700 font-medium">✨ Thông tin sẽ được điền tự động:</p>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                        <span className="text-xs bg-white border border-yellow-200 px-2 py-1 rounded-full text-slate-700">
                            💰 {formatPrice(amount)}
                        </span>
                        <span className="text-xs bg-white border border-yellow-200 px-2 py-1 rounded-full text-slate-700 font-mono">
                            📝 {transferContent}
                        </span>
                    </div>
                </div>

                {/* Danh sách ngân hàng */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
                    <div className="p-3 grid grid-cols-1 gap-1">
                        {BANK_DEEPLINKS.map((bank) => (
                            <button
                                key={bank.id}
                                onClick={() => handleBankClick(bank)}
                                className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group w-full"
                            >
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                                    style={{ backgroundColor: bank.color + '15', border: `1.5px solid ${bank.color}25` }}
                                >
                                    <img
                                        src={bank.logo}
                                        alt={bank.name}
                                        className="w-10 h-10 object-contain"
                                        onError={e => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<span class="font-black text-xs" style="color: ${bank.color}">${bank.name.slice(0, 3)}</span>`;
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 text-sm">{bank.name}</p>
                                    <p className="text-xs text-slate-400 truncate">Mở {bank.name} App →</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>

                    {/* Lưu ý */}
                    <div className="px-6 py-4 text-center">
                        <p className="text-xs text-slate-400">
                            💡 Cần cài sẵn app ngân hàng trên điện thoại.
                            <br />App sẽ mở và điền thông tin tự động cho bạn.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ============================
// MAIN COMPONENT
// ============================
const OrderSuccess = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bankSettings, setBankSettings] = useState(null);
    const [copied, setCopied] = useState(null);
    const [checking, setChecking] = useState(false);
    const [checkCount, setCheckCount] = useState(0);
    const [showBankSelector, setShowBankSelector] = useState(false);

    const fetchOrder = useCallback(async () => {
        try {
            if (orderId) {
                const data = await getOrderById(orderId);
                setOrder(data);
                return data;
            }
        } catch (error) {
            console.error("Error fetching order:", error);
        }
        return null;
    }, [orderId]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const [orderData, settings] = await Promise.all([
                fetchOrder(),
                getBankSettings()
            ]);
            setBankSettings(settings);
            setLoading(false);

            if (orderData?.status === 'pending') {
                const interval = setInterval(async () => {
                    const updated = await fetchOrder();
                    setCheckCount(prev => prev + 1);
                    if (updated?.status === 'completed') {
                        clearInterval(interval);
                    }
                }, 30000);
                return () => clearInterval(interval);
            }
        };
        init();
    }, [fetchOrder]);

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleManualCheck = async () => {
        setChecking(true);
        await fetchOrder();
        setChecking(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-secret-wax border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm">Đang tải thông tin đơn hàng...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <h2 className="text-xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
            <Link to="/" className="text-secret-wax hover:underline">Về trang chủ</Link>
        </div>
    );

    const isCompleted = order.status === 'completed';
    const transferContent = bankSettings ? generateTransferContent(bankSettings, order.orderCode) : `MALI ${order.orderCode}`;
    const qrUrl = bankSettings?.accountNo ? generateQrUrl(bankSettings, order.amount, transferContent) : null;

    return (
        <>
            {/* Modal chọn ngân hàng */}
            <BankSelectorModal
                isOpen={showBankSelector}
                onClose={() => setShowBankSelector(false)}
                bankSettings={bankSettings}
                amount={order.amount}
                transferContent={transferContent}
            />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-28 pb-20">
                <div className="container max-w-4xl mx-auto px-4">

                    {/* Header */}
                    <div className={`rounded-3xl p-8 text-center text-white mb-0 ${isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-secret-wax to-orange-600'}`}>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            {isCompleted ? (
                                <CheckCircle className="w-10 h-10 text-white" />
                            ) : (
                                <Clock className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <h1 className="text-3xl font-serif font-bold mb-2">
                            {isCompleted ? "Đã kích hoạt khóa học! 🎉" : "Đặt hàng thành công!"}
                        </h1>
                        <p className="opacity-90 text-sm">
                            Mã đơn hàng: <span className="font-mono font-bold text-lg">{order.orderCode}</span>
                        </p>
                        {!isCompleted && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang chờ xác nhận thanh toán...
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-b-3xl shadow-xl overflow-hidden border border-slate-100">
                        {isCompleted ? (
                            /* ======= ĐÃ HOÀN THÀNH ======= */
                            <div className="p-8 md:p-12 text-center">
                                <div className="max-w-md mx-auto">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Khóa học đã được kích hoạt!</h2>
                                    <p className="text-slate-500 mb-8">
                                        Chúc mừng bạn đã trở thành học viên của khóa học <strong>{order.courseName}</strong>.
                                        Bạn có thể bắt đầu học ngay bây giờ.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link to="/khoa-hoc-cua-toi"
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secret-wax text-white font-bold rounded-xl shadow-lg hover:bg-secret-ink transition-all">
                                            Vào học ngay
                                        </Link>
                                        <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all">
                                            <Home className="w-4 h-4" /> Về trang chủ
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ======= CHỜ THANH TOÁN ======= */
                            <div className="p-6 md:p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Left: Thông tin chuyển khoản */}
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                                                <span className="w-7 h-7 bg-secret-wax text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                                Chọn cách thanh toán
                                            </h3>
                                        </div>

                                        {/* NÚT MỞ APP NGÂN HÀNG - NỔIBẬT */}
                                        {bankSettings?.accountNo && (
                                            <button
                                                onClick={() => setShowBankSelector(true)}
                                                className="w-full relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 group"
                                            >
                                                {/* Shimmer effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
                                                    <Smartphone className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold text-lg leading-tight">Mở App Ngân hàng</p>
                                                    <p className="text-blue-100 text-sm mt-0.5">Chọn ngân hàng → Điền thông tin tự động ✨</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform shrink-0" />
                                            </button>
                                        )}

                                        {/* Divider */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-px bg-slate-200" />
                                            <span className="text-xs text-slate-400 font-medium px-2">hoặc chuyển khoản thủ công</span>
                                            <div className="flex-1 h-px bg-slate-200" />
                                        </div>

                                        {/* Thông tin CK thủ công */}
                                        {bankSettings?.accountNo ? (
                                            <div className="bg-slate-50 rounded-2xl p-5 space-y-3.5 border border-slate-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Ngân hàng</span>
                                                    <span className="font-bold text-slate-900">{bankSettings.bankName || bankSettings.bankId}</span>
                                                </div>
                                                <div className="flex justify-between items-center group">
                                                    <span className="text-sm text-slate-500">Số tài khoản</span>
                                                    <button onClick={() => copyToClipboard(bankSettings.accountNo, 'account')}
                                                        className="flex items-center gap-2 font-bold text-xl text-secret-ink hover:text-secret-wax transition-colors">
                                                        {bankSettings.accountNo}
                                                        {copied === 'account' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Chủ TK</span>
                                                    <span className="font-semibold text-slate-900 uppercase">{bankSettings.accountName}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                                    <span className="text-sm text-slate-500">Số tiền</span>
                                                    <button onClick={() => copyToClipboard(order.amount, 'amount')}
                                                        className="flex items-center gap-2 font-bold text-xl text-red-600">
                                                        {formatPrice(order.amount)}
                                                        {copied === 'amount' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500 shrink-0">Nội dung CK</span>
                                                    <button onClick={() => copyToClipboard(transferContent, 'content')}
                                                        className="flex items-center gap-2 font-mono font-bold text-secret-ink bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors ml-3 text-sm">
                                                        {transferContent}
                                                        {copied === 'content' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-yellow-600" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200 flex items-center gap-3 text-orange-700">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <p className="text-sm">Chưa cấu hình thông tin ngân hàng. Vui lòng liên hệ admin.</p>
                                            </div>
                                        )}

                                        {/* Auto verify notice */}
                                        {bankSettings?.autoApproveEnabled && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                                <Zap className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-green-800">Xác minh tự động đang hoạt động</p>
                                                    <p className="text-xs text-green-600 mt-0.5">Khóa học sẽ kích hoạt tự động trong vài phút.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Kiểm tra */}
                                        <div className="space-y-3">
                                            <button onClick={handleManualCheck} disabled={checking}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-secret-wax hover:text-secret-wax transition-all disabled:opacity-50">
                                                {checking ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...</>
                                                ) : (
                                                    <><RefreshCw className="w-4 h-4" /> Tôi đã chuyển khoản - Kiểm tra ngay</>
                                                )}
                                            </button>
                                            {checkCount > 0 && (
                                                <p className="text-xs text-center text-slate-400">Đã kiểm tra {checkCount} lần. Tự động mỗi 30 giây.</p>
                                            )}
                                            <Link to="/" className="flex items-center justify-center gap-2 text-slate-400 hover:text-secret-wax transition-colors text-sm">
                                                <Home className="w-4 h-4" /> Về trang chủ
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right: QR Code */}
                                    <div className="flex flex-col items-center justify-start space-y-6">
                                        <div className="w-full">
                                            <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                                <span className="w-7 h-7 bg-secret-wax text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                                Hoặc quét mã QR
                                            </h3>

                                            {qrUrl ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-white p-3 rounded-2xl shadow-2xl border-2 border-secret-wax/20 hover:scale-105 transition-transform duration-500 cursor-pointer"
                                                        onClick={() => setShowBankSelector(true)}
                                                        title="Nhấn để mở app ngân hàng">
                                                        <img src={qrUrl} alt="VietQR Payment" className="w-64 h-auto rounded-xl" />
                                                        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                                                            <Smartphone className="w-3.5 h-3.5" />
                                                            <span>Mở app ngân hàng → Quét mã</span>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                                                        onClick={() => setShowBankSelector(true)}>
                                                        📱 Hoặc nhấn đây để chọn app ngân hàng →
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="w-full h-48 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                                    <AlertCircle className="w-10 h-10 mb-2" />
                                                    <p className="text-sm text-center">Chuyển khoản thủ công theo thông tin bên trái.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chi tiết đơn */}
                                        <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                            <h4 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">📋 Chi tiết đơn hàng</h4>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Khóa học</span>
                                                    <span className="font-medium text-slate-900 text-right max-w-[55%] leading-tight">{order.courseName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Khách hàng</span>
                                                    <span className="font-medium text-slate-900">{order.customerName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Ngày đặt</span>
                                                    <span className="font-medium text-slate-900">
                                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                                                    <span className="font-bold text-slate-700">Trạng thái</span>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Chờ xác nhận
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <p className="text-xs text-blue-600 flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>Nếu đã chuyển khoản mà chưa được duyệt sau <strong>15 phút</strong>, chụp màn hình giao dịch và liên hệ hotline.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;
