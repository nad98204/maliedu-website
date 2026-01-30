import { useEffect, useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Clock, Check, RefreshCw } from "lucide-react";

import { getAllOrders, approveOrder, formatPrice } from "../../utils/orderService";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            // toast.error("Lỗi tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleApprove = async (orderId) => {
        if (!window.confirm("Xác nhận đã nhận được tiền và kích hoạt khóa học?")) return;

        setProcessingId(orderId);
        try {
            await approveOrder(orderId);
            // toast.success("Đã duyệt đơn và kích hoạt khóa học!");
            alert("Đã kích hoạt khóa học cho học viên thành công!");
            fetchOrders(); // Reload list
        } catch (error) {
            console.error("Approve error:", error);
            alert("Lỗi khi duyệt đơn: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Đơn hàng</h1>
                    <p className="text-slate-500">Xem và duyệt các đơn hàng đăng ký khóa học.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchOrders}
                        className="p-2 text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                        title="Làm mới"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn, tên, email, sđt..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Mã đơn</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4">Khóa học</th>
                                <th className="px-6 py-4">Tổng tiền</th>
                                <th className="px-6 py-4">Ngày tạo</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        Không tìm thấy đơn hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                                            {order.orderCode}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.customerName}</div>
                                            <div className="text-xs text-slate-500">{order.customerEmail}</div>
                                            <div className="text-xs text-slate-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate" title={order.courseName}>
                                            {order.courseName}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {formatPrice(order.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                    <CheckCircle className="w-3 h-3" /> Hoàn thành
                                                </span>
                                            ) : order.status === 'cancelled' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                    <XCircle className="w-3 h-3" /> Đã hủy
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                    <Clock className="w-3 h-3" /> Chờ duyệt
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(order.id)}
                                                    disabled={processingId === order.id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                                                    title="Xác nhận thanh toán & Kích hoạt"
                                                >
                                                    {processingId === order.id ? 'Đang xử lý...' : <><Check className="w-3 h-3" /> Duyệt đơn</>}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
