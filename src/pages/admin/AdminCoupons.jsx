import { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy
} from "firebase/firestore";
import {
    Plus,
    Trash2,
    Tag,
    Calendar,
    CheckCircle,
    XCircle,
    Loader2,
    Percent,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { db } from "../../firebase";

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        discountPercent: "",
        expiryDate: "",
        isActive: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddCoupon = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            // Basic Validation
            if (!formData.code || !formData.discountPercent || !formData.expiryDate) {
                throw new Error("Vui lòng điền đầy đủ thông tin");
            }

            const newCoupon = {
                code: formData.code.toUpperCase().trim(),
                discountPercent: Number(formData.discountPercent),
                expiryDate: new Date(formData.expiryDate).toISOString(),
                isActive: formData.isActive,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "coupons"), newCoupon);

            setMessage('Tạo mã giảm giá thành công!');
            setIsAdding(false);
            setFormData({ code: "", discountPercent: "", expiryDate: "", isActive: true });
            fetchCoupons(); // Refresh list

        } catch (error) {
            console.error("Error adding coupon:", error);
            setMessage('Lỗi: ' + error.message);
        } finally {
            setSubmitting(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa mã này?")) {
            try {
                await deleteDoc(doc(db, "coupons", id));
                setCoupons(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error deleting coupon:", error);
                alert("Lỗi khi xóa mã");
            }
        }
    };

    const toggleCouponStatus = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, "coupons", id), {
                isActive: !currentStatus
            });
            setCoupons(prev => prev.map(c =>
                c.id === id ? { ...c, isActive: !currentStatus } : c
            ));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <Loader2 className="w-8 h-8 animate-spin text-secret-wax" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-secret-wax" />
                        Quản lý Mã giảm giá
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Tạo và quản lý các chương trình khuyến mãi</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-secret-wax text-white rounded-lg hover:bg-secret-ink transition-colors font-medium shadow-md"
                >
                    {isAdding ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isAdding ? "Hủy tạo mới" : "Thêm mã mới"}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.includes('Lỗi') ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {message}
                </div>
            )}

            {/* Add Coupon Form */}
            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-slide-down">
                    <h3 className="font-bold text-lg mb-4">Thông tin mã giảm giá</h3>
                    <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Mã Coupon <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                placeholder="VD: MALI20"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Giảm giá (%) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="discountPercent"
                                    value={formData.discountPercent}
                                    onChange={handleInputChange}
                                    placeholder="20"
                                    min="1"
                                    max="100"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax"
                                    required
                                />
                                <Percent className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ngày hết hạn <span className="text-red-500">*</span></label>
                            <input
                                type="datetime-local"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-8">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secret-wax/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secret-wax"></div>
                                <span className="ml-3 text-sm font-medium text-slate-700">Kích hoạt ngay</span>
                            </label>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-secret-wax text-white rounded-lg shadow-md hover:bg-secret-ink transition-all font-bold disabled:opacity-70 flex items-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Lưu mã giảm giá
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Chưa có mã giảm giá nào. Hãy tạo mã đầu tiên!</p>
                    </div>
                ) : (
                    coupons.map(coupon => {
                        const isExpired = new Date(coupon.expiryDate) < new Date();
                        return (
                            <div key={coupon.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-slate-100 text-slate-800 font-mono font-bold px-3 py-1 rounded text-lg tracking-wide border border-slate-200">
                                            {coupon.code}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleCouponStatus(coupon.id, coupon.isActive)}
                                                className={`p-1.5 rounded-full transition-colors ${coupon.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                title={coupon.isActive ? "Đang hoạt động" : "Đang tắt"}
                                            >
                                                {coupon.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                                className="p-1.5 rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title="Xóa mã"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-4xl font-bold text-secret-wax mb-4">
                                        {coupon.discountPercent}% <span className="text-sm font-medium text-slate-500 self-end mb-1">OFF</span>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Hết hạn: {new Date(coupon.expiryDate).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isExpired ? (
                                                <span className="text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Đã hết hạn</span>
                                            ) : coupon.isActive ? (
                                                <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đang hoạt động</span>
                                            ) : (
                                                <span className="text-slate-400 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Tạm ngưng</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-5 py-3 text-xs text-slate-400 border-t border-slate-100 flex justify-between">
                                    <span>ID: {coupon.id.slice(0, 8)}...</span>
                                    <span>Tạo bởi Admin</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminCoupons;
