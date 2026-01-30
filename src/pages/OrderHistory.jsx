import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // Adjust path if needed
import { formatPrice } from "../utils/orderService";
import { Loader2, Package, Check, Clock, XCircle, ArrowRight } from "lucide-react";

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch orders where userId == current user uid
                    // Assuming 'orders' collection exists
                    const q = query(
                        collection(db, "orders"),
                        where("userId", "==", user.uid),
                        orderBy("createdAt", "desc")
                    );

                    const querySnapshot = await getDocs(q);
                    const ordersData = [];
                    querySnapshot.forEach((doc) => {
                        ordersData.push({ id: doc.id, ...doc.data() });
                    });
                    setOrders(ordersData);
                } catch (error) {
                    console.error("Error fetching orders:", error);
                    // If index error, might need to create index in Firebase Console
                } finally {
                    setLoading(false);
                }
            } else {
                // Not logged in, redirect
                navigate("/admin/login");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-secret-wax" />
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><Check className="w-3.5 h-3.5" /> Thành công</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><Clock className="w-3.5 h-3.5" /> Đang xử lý</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Thất bại</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20">
            <div className="container max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <Package className="w-8 h-8 text-secret-wax" />
                    Lịch sử đơn hàng
                </h1>

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Package className="w-20 h-20 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 border-none">Bạn chưa có đơn hàng nào</h3>
                        <p className="text-slate-500 mb-6">Hãy tham khảo các khóa học của chúng tôi nhé!</p>
                        <Link to="/khoa-hoc" className="inline-flex items-center gap-2 px-6 py-3 bg-secret-wax text-white font-bold rounded-xl hover:bg-secret-ink transition-colors">
                            Xem khóa học <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã đơn</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Khóa học</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày mua</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                #{order.orderCode}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {/* Display single course name or 'Combo X courses' */}
                                                {order.items ? (
                                                    <div className="flex flex-col gap-1">
                                                        {order.items.slice(0, 2).map((item, idx) => (
                                                            <div key={idx} className="line-clamp-1 max-w-xs" title={item.name}>• {item.name}</div>
                                                        ))}
                                                        {order.items.length > 2 && <div className="text-xs text-slate-400 italic">...và {order.items.length - 2} khóa khác</div>}
                                                    </div>
                                                ) : (
                                                    // Backward compatibility
                                                    <div className="line-clamp-2 max-w-xs" title={order.courseName}>{order.courseName}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {/* Handle createdAt possibly being a Firestore timestamp */}
                                                {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("vi-VN") : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                                                {formatPrice(order.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getStatusBadge(order.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
