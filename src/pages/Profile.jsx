import { useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Camera, LogOut, Package, Check, Clock, XCircle, AlertCircle, Key, Eye, EyeOff, Lock, Monitor, Smartphone, Trash2 } from "lucide-react";

import { auth, db } from "../firebase";
import { uploadToCloudinary } from "../utils/uploadService";
import { formatPrice } from "../utils/orderService";
import { removeSession, getDeviceId } from "../utils/sessionService";
import { doc, getDoc } from "firebase/firestore";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // profile, orders, password

    // Profile State
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Orders State
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Sessions State
    const [sessions, setSessions] = useState([]);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || "");
                setAvatarUrl(currentUser.photoURL || "");
                fetchOrders(currentUser.uid);
            } else {
                navigate("/admin/login");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchSessions = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                setSessions(userDoc.data().activeSessions || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'devices' && user) {
            fetchSessions(user.uid);
        }
    }, [activeTab, user]);

    const handleRemoveSession = async (deviceId) => {
        if (!confirm("Bạn có chắc muốn đăng xuất thiết bị này?")) return;
        try {
            await removeSession(user.uid, deviceId);
            setMessage({ type: 'success', text: 'Đã đăng xuất thiết bị thành công' });
            fetchSessions(user.uid);
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
        }
    };

    const fetchOrders = async (userId) => {
        setLoadingOrders(true);
        try {
            const q = query(
                collection(db, "orders"),
                where("userId", "==", userId),
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
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            await updateProfile(auth.currentUser, {
                displayName: displayName,
                photoURL: avatarUrl
            });
            setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        } catch (error) {
            console.error("Update error:", error);
            setMessage({ type: 'error', text: 'Lỗi cập nhật: ' + error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUpdating(true);
        try {
            const result = await uploadToCloudinary(file);
            setAvatarUrl(result.secureUrl);
        } catch (error) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', text: 'Lỗi upload ảnh: ' + error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            return;
        }

        setIsUpdating(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Password update error:", error);
            if (error.code === 'auth/wrong-password') {
                setMessage({ type: 'error', text: 'Mật khẩu hiện tại không đúng.' });
            } else {
                setMessage({ type: 'error', text: 'Lỗi đổi mật khẩu: ' + error.message });
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-secret-wax" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    {/* Sidebar */}
                    <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col items-center md:items-start gap-6">
                        <div className="text-center md:text-left w-full">
                            <div className="relative w-24 h-24 mx-auto md:mx-0 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 bg-slate-200">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <h2 className="font-bold text-slate-900 truncate text-lg">{user?.displayName || "Học viên"}</h2>
                            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                        </div>

                        <div className="w-full space-y-2 flex-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === 'profile'
                                    ? 'bg-white text-secret-wax shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <User className="w-5 h-5" /> Thông tin cá nhân
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === 'orders'
                                    ? 'bg-white text-secret-wax shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <Package className="w-5 h-5" /> Lịch sử thanh toán
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === 'password'
                                    ? 'bg-white text-secret-wax shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <Key className="w-5 h-5" /> Đổi mật khẩu
                            </button>
                            <button
                                onClick={() => setActiveTab('devices')}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === 'devices'
                                    ? 'bg-white text-secret-wax shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <Monitor className="w-5 h-5" /> Quản lý thiết bị
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm text-red-600 hover:bg-red-50 mt-auto"
                        >
                            <LogOut className="w-5 h-5" /> Đăng xuất
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto">

                        {/* Messages */}
                        {message.text && (
                            <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {message.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="max-w-xl animate-fade-in">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Cập nhật thông tin</h1>
                                <p className="text-slate-500 mb-8">Quản lý thông tin hồ sơ của bạn để bảo mật tài khoản</p>

                                <form onSubmit={handleUpdateProfile} className="space-y-8">
                                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleAvatarUpload}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 mb-1">Ảnh đại diện</h3>
                                            <p className="text-sm text-slate-500">Chạm vào ảnh để thay đổi. Nên dùng ảnh vuông, tối đa 2MB.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Họ và tên hiển thị</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                                            placeholder="Nhập tên hiển thị của bạn"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Email đăng nhập</label>
                                        <input
                                            type="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="bg-secret-wax text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-secret-ink transition-all disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Lưu thay đổi
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Lịch sử thanh toán</h1>
                                <p className="text-slate-500 mb-8">Xem lại các khóa học bạn đã mua và trạng thái đơn hàng</p>

                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    {loadingOrders ? (
                                        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                                            <Loader2 className="w-8 h-8 animate-spin text-secret-wax" />
                                            <p>Đang tải dữ liệu...</p>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Package className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-900 mb-1">Bạn chưa có đơn hàng nào</p>
                                            <p className="text-sm mb-6">Các khóa học bạn mua sẽ hiển thị ở đây.</p>
                                            <button onClick={() => navigate('/khoa-hoc')} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all">
                                                Xem danh sách khóa học
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4">Mã đơn</th>
                                                        <th className="px-6 py-4">Khóa học</th>
                                                        <th className="px-6 py-4">Ngày mua</th>
                                                        <th className="px-6 py-4">Tổng tiền</th>
                                                        <th className="px-6 py-4">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {orders.map((order) => (
                                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                                                #{order.orderCode?.substring(0, 8) || 'Unknown'}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate" title={order.courseName}>
                                                                {order.courseName}
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-500">
                                                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-secret-wax">
                                                                {formatPrice(order.amount)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {order.status === 'completed' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                                        <Check className="w-3 h-3" /> Thành công
                                                                    </span>
                                                                ) : order.status === 'cancelled' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                                        <XCircle className="w-3 h-3" /> Thất bại
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                                        <Clock className="w-3 h-3" /> Đang xử lý
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="max-w-xl animate-fade-in">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Đổi mật khẩu</h1>
                                <p className="text-slate-500 mb-8">Cập nhật mật khẩu thường xuyên để bảo vệ tài khoản</p>

                                <form onSubmit={handleChangePassword} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-slate-400" /> Mật khẩu hiện tại
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all pr-12"
                                                placeholder="Nhập mật khẩu đang dùng"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Key className="w-4 h-4 text-slate-400" /> Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all pr-12"
                                                placeholder="Nhập mật khẩu mới"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 pl-1">Mật khẩu nên có ít nhất 6 ký tự để bảo mật.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Check className="w-4 h-4 text-slate-400" /> Nhập lại mật khẩu mới
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                                            placeholder="Gõ lại mật khẩu mới lần nữa"
                                            required
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="w-full bg-slate-900 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Lưu mật khẩu mới
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'devices' && (
                            <div className="max-w-3xl animate-fade-in">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Quản lý thiết bị</h1>
                                <p className="text-slate-500 mb-8">
                                    Tài khoản của bạn được phép đăng nhập tối đa trên 3 thiết bị.
                                </p>

                                <div className="space-y-4">
                                    {sessions.length === 0 ? (
                                        <p className="text-slate-500 italic">Không tìm thấy thông tin phiên đăng nhập.</p>
                                    ) : (
                                        sessions.map((session, idx) => {
                                            const isCurrent = session.deviceId === getDeviceId();
                                            return (
                                                <div key={idx} className={`flex items-center justify-between p-5 rounded-xl border ${isCurrent ? 'border-secret-wax bg-orange-50/50' : 'border-slate-200 bg-white'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-orange-100 text-secret-wax' : 'bg-slate-100 text-slate-500'}`}>
                                                            {session.deviceInfo?.toLowerCase().includes('mobile') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                                {session.deviceInfo || "Thiết bị không xác định"}
                                                                {isCurrent && <span className="text-[10px] bg-secret-wax text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Hiện tại</span>}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                Hoạt động lần cuối: {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('vi-VN') : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {!isCurrent && (
                                                        <button
                                                            onClick={() => handleRemoveSession(session.deviceId)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Đăng xuất thiết bị này"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                                    <p className="flex gap-2">
                                        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
                                        Nếu bạn đạt giới hạn 3 thiết bị, bạn cần đăng xuất bớt một thiết bị cũ trong danh sách này để đăng nhập thiết bị mới.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
