import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BarChart,
    Users,
    ShoppingCart,
    BookOpen,
    TrendingUp,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle
} from "lucide-react";

import { getDashboardStats } from "../../utils/dashboardService";
import { formatPrice } from "../../utils/orderService";

const StatCard = ({ title, value, icon: Icon, color, subText }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {subText && <p className={`text-xs mt-2 ${subText.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>{subText}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        users: 0,
        pendingOrders: 0,
        totalCourses: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <Loader2 className="w-8 h-8 animate-spin text-secret-wax" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
                <div className="text-sm text-slate-500">
                    Cập nhật: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng Doanh Thu"
                    value={formatPrice(stats.revenue)}
                    icon={TrendingUp}
                    color="bg-green-500"
                    subText="+12% so với tháng trước"
                />
                <StatCard
                    title="Học Viên"
                    value={stats.users}
                    icon={Users}
                    color="bg-blue-500"
                    subText="Tổng số account"
                />
                <StatCard
                    title="Đơn Hàng Mới"
                    value={stats.pendingOrders}
                    icon={ShoppingCart}
                    color={stats.pendingOrders > 0 ? "bg-yellow-500" : "bg-slate-400"}
                    subText={stats.pendingOrders > 0 ? "Cần xử lý ngay" : "Đã xử lý hết"}
                />
                <StatCard
                    title="Tổng Khóa Học"
                    value={stats.totalCourses}
                    icon={BookOpen}
                    color="bg-purple-500"
                    subText="Đang hoạt động"
                />
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        Đơn hàng mới nhất
                    </h2>
                    <Link to="/admin/orders" className="text-sm text-secret-wax font-medium hover:underline">
                        Xem tất cả
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Mã Đơn</th>
                                <th className="px-6 py-4">Khách Hàng</th>
                                <th className="px-6 py-4">Khóa Học</th>
                                <th className="px-6 py-4">Số Tiền</th>
                                <th className="px-6 py-4">Trạng Thái</th>
                                <th className="px-6 py-4 text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Chưa có đơn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                stats.recentOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">
                                            {order.orderCode}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.customerName}</div>
                                            <div className="text-xs text-slate-400">{order.customerEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate" title={order.courseName}>
                                            {order.courseName}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            {formatPrice(order.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    <CheckCircle className="w-3 h-3" /> Hoàn thành
                                                </span>
                                            ) : order.status === 'cancelled' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                    <AlertCircle className="w-3 h-3" /> Đã hủy
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                                    <Clock className="w-3 h-3" /> Chờ duyệt
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to="/admin/orders"
                                                state={{ highlight: order.id }}
                                                className="text-secret-wax font-medium hover:underline"
                                            >
                                                Chi tiết
                                            </Link>
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

export default AdminDashboard;
