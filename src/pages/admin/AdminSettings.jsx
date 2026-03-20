import React, { useState, useEffect } from 'react';
import { crmFirestore, crmRealtimeDB, db, firebaseConfig } from '../../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    X,
    Trash2,
    Settings,
    Users,
    Database,
    Box,
    Layout,
    Shield,
    AlertCircle,
    Zap,
    Tag as TagIcon,
    RefreshCw,
    Key,
    Edit,
    Lock,
    Mail,
    Check,
    CreditCard,
    Building2,
    QrCode,
    Send,
    Eye,
    EyeOff,
    Save,
    CheckCircle,
    ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getBankSettings, saveBankSettings, VIETNAM_BANKS, runAutoVerification } from '../../utils/bankPaymentService';

const slugify = (text) => {
    return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u0111\u0110]/g, "d")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, '-');
};

const ALL_MODULES = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'banners', label: 'Trang chủ' },
    { key: 'posts', label: 'Tin Tức & Bài Viết' },
    { key: 'knowledge', label: 'Kho Kiến Thức' },
    { key: 'courses', label: 'Khóa học Online' },
    { key: 'orders', label: 'Đơn hàng' },
    { key: 'students', label: 'Học viên' },
    { key: 'recruitment', label: 'Tuyển dụng' },
    { key: 'testimonials', label: 'Cảm nhận HV' },
    { key: 'landings', label: 'Landing Page' },
    { key: 'settings', label: 'C\u1ea5u h\u00ecnh' },
];

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('payment'); // 'users', 'system', 'payment'
    const [courses, setCourses] = useState([]);
    const [crmUsers, setCrmUsers] = useState([]);
    const [newCourseName, setNewCourseName] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [webUserEmails, setWebUserEmails] = useState([]);
    const [webUsers, setWebUsers] = useState([]);
    const [isSyncingUser, setIsSyncingUser] = useState(null);
    const [editingWebUser, setEditingWebUser] = useState(null);
    const [isSavingUser, setIsSavingUser] = useState(false);

    // Bank Payment Settings
    const [bankSettings, setBankSettings] = useState(null);
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [showSecrets, setShowSecrets] = useState({});
    const [isRunningVerify, setIsRunningVerify] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);

    // Fetch Web Users to cross check
    const fetchWebUsers = async () => {
        try {
            const snap = await getDocs(collection(db, "users"));
            const emails = snap.docs.map(d => d.data().email?.toLowerCase()).filter(Boolean);
            const fullUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setWebUserEmails(emails);
            setWebUsers(fullUsers);
        } catch (error) {
            console.error("Error fetching web users:", error);
        }
    };

    useEffect(() => {
        fetchWebUsers();
    }, []);

    // Load bank settings
    useEffect(() => {
        getBankSettings().then(settings => setBankSettings(settings));
    }, []);

    const handleSaveBankSettings = async () => {
        if (!bankSettings) return;
        setIsSavingBank(true);
        try {
            await saveBankSettings(bankSettings);
            toast.success('Đã lưu cấu hình thanh toán!');
        } catch (error) {
            toast.error('Lỗi lưu cấu hình: ' + error.message);
        } finally {
            setIsSavingBank(false);
        }
    };

    const handleRunVerify = async () => {
        setIsRunningVerify(true);
        setVerifyResult(null);
        try {
            const result = await runAutoVerification();
            setVerifyResult(result);
            if (result.success && result.approvedCount > 0) {
                toast.success(`Đã tự động duyệt ${result.approvedCount} đơn hàng!`);
            } else if (result.success) {
                toast.success('Kiểm tra hoàn tất - Không có giao dịch khớp');
            } else {
                toast.error(result.message || result.error || 'Lỗi xác minh');
            }
        } catch (error) {
            toast.error('Lỗi: ' + error.message);
        } finally {
            setIsRunningVerify(false);
        }
    };

    const toggleSecret = (key) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const updateBankSetting = (key, value) => {
        setBankSettings(prev => ({ ...prev, [key]: value }));
    };

    // 1. Lắng nghe Khóa Học từ Firestore (Shared across CRM & Web)
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(crmFirestore, "courses_config"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(list);

            // AUTO-LINK: Nếu Firestore trống nhưng CRM RealtimeDB có data, chúng ta sẽ lôi sang
            // (Thực hiện logic này phía CRM sẽ tốt hơn nhưng check ở đây để đảm bảo link)
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Lắng nghe Nhân sự từ CRM Realtime Database (Linked 100%)
    useEffect(() => {
        const usersRef = ref(crmRealtimeDB, 'system_settings/users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(k => ({ ...data[k], dbKey: k }));
                setCrmUsers(list);
            }
        });
        return () => unsubscribe();
    }, []);


    // Thêm Khóa học mới (Ghi vào Firestore cho cả 2 hệ thống thấy)
    const handleAddCourse = async () => {
        if (!newCourseName.trim()) return;
        const id = slugify(newCourseName);

        try {
            await setDoc(doc(crmFirestore, "courses_config", id), {
                id: id,
                name: newCourseName,
                type: "Khóa Miễn Phí",
                batches: [],
                createdAt: Date.now()
            });
            setNewCourseName("");
            toast.success(`Đã thêm khóa học: ${newCourseName}`);
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        }
    };

    // Thêm khóa K (Batch)
    const handleAddBatch = async (courseId, newBatch) => {
        if (!newBatch.trim()) return;
        try {
            await updateDoc(doc(crmFirestore, "courses_config", courseId), {
                batches: arrayUnion(newBatch.toUpperCase())
            });
            toast.success(`Đã thêm ${newBatch}`);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi thêm K");
        }
    };

    // Xóa khóa K
    const removeBatch = async (courseId, tagToRemove) => {
        try {
            await updateDoc(doc(crmFirestore, "courses_config", courseId), {
                batches: arrayRemove(tagToRemove)
            });
        } catch (error) {
            console.error(error);
            toast.error("Lỗi xóa K");
        }
    };

    // Đồng bộ user (CRM -> Web System as Admin)
    const handleSyncToWebAdmin = async (user) => {
        if (!user.email || !user.name) return;
        setIsSyncingUser(user.email);
        let secondaryApp = null;
        try {
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp_" + Date.now());
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, "Mali@123");
            const newWebUser = userCredential.user;

            await setDoc(doc(db, "users", newWebUser.uid), {
                uid: newWebUser.uid,
                email: newWebUser.email,
                displayName: user.name,
                role: 'admin',
                createdAt: serverTimestamp()
            });

            await signOut(secondaryAuth);
            toast.success(`Đã tạo tài khoản Web Admin cho: ${user.name} (Mật khẩu: Mali@123)`, { duration: 5000 });
            fetchWebUsers();
        } catch (error) {
            console.error("Sync Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Email này đã được dùng trên Web (Có thể là học viên hoặc đã tạo).");
            } else {
                toast.error("Lỗi đồng bộ: " + error.message);
            }
        } finally {
            if (secondaryApp) deleteApp(secondaryApp);
            setIsSyncingUser(null);
        }
    };

    // Đổi mật khẩu cho nhân viên (gửi email reset)
    const handleResetPassword = async (email) => {
        try {
            const mainAuth = getAuth();
            await sendPasswordResetEmail(mainAuth, email);
            toast.success(`Đã gửi email đặt lại mật khẩu đến: ${email}`, { duration: 5000 });
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("Lỗi gửi email: " + error.message);
        }
    };

    // Cập nhật vai trò và modules
    const handleSaveWebUser = async (userData) => {
        if (!userData?.id) return;
        setIsSavingUser(true);
        try {
            await updateDoc(doc(db, "users", userData.id), {
                role: userData.role || 'student',
                allowedModules: userData.allowedModules || [],
            });
            toast.success(`Đã cập nhật quyền cho: ${userData.displayName || userData.email}`);
            fetchWebUsers();
            setEditingWebUser(null);
        } catch (error) {
            toast.error("Lỗi cập nhật: " + error.message);
        } finally {
            setIsSavingUser(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-slate-400" />
                        Cấu Hình Hệ Thống (LINKED CRM)
                    </h1>
                    <p className="text-sm text-slate-500">Dữ liệu được đồng bộ hóa trực tiếp với hệ thống Antigravity CRM</p>
                </div>

                {/* Connection Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    CONNECTED TO CRM
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex flex-wrap gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200">
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'payment' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
                >
                    <CreditCard size={18} /> THANH TOÁN NGÂN HÀNG
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
                >
                    <Users size={18} /> NHÂN SỰ CRM
                </button>
                <button
                    onClick={() => setActiveTab('web_accounts')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'web_accounts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
                >
                    <Lock size={18} /> TÀI KHOẢN WEB
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'system' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
                >
                    <Layout size={18} /> THAM SỐ KHÓA HỌC
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="grid grid-cols-1 gap-6">

                {/* TAB: THANH TOÁN NGÂN HÀNG */}
                {activeTab === 'payment' && bankSettings && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-xl text-green-700 shrink-0">
                                <CreditCard size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-900">Cấu hình Thanh toán Tự động</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    Thiết lập thông tin tài khoản ngân hàng để tạo QR Code VietQR và kết nối webhook để tự động duyệt đơn hàng khi phát hiện giao dịch phù hợp.
                                </p>
                            </div>
                            <div className="shrink-0">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={bankSettings.isEnabled || false}
                                        onChange={e => updateBankSetting('isEnabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ml-2 text-sm font-bold text-green-800">{bankSettings.isEnabled ? 'Đang bật' : 'Đã tắt'}</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Card 1: Thông tin ngân hàng */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                                    <div className="p-2 bg-blue-100 rounded-xl text-blue-700"><Building2 size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Thông tin Tài khoản Ngân hàng</h4>
                                        <p className="text-xs text-slate-500">Dùng để tạo mã QR VietQR cho khách hàng</p>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    {/* Chọn ngân hàng */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngân hàng *</label>
                                        <select
                                            value={bankSettings.bankId || ''}
                                            onChange={e => {
                                                const bank = VIETNAM_BANKS.find(b => b.id === e.target.value);
                                                updateBankSetting('bankId', e.target.value);
                                                if (bank) updateBankSetting('bankName', bank.name);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-medium"
                                        >
                                            <option value="">-- Chọn ngân hàng --</option>
                                            {VIETNAM_BANKS.map(bank => (
                                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Số tài khoản */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số tài khoản *</label>
                                        <input
                                            type="text"
                                            value={bankSettings.accountNo || ''}
                                            onChange={e => updateBankSetting('accountNo', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-mono font-bold"
                                            placeholder="0123456789"
                                        />
                                    </div>

                                    {/* Tên chủ tài khoản */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên chủ tài khoản * (IN HOA)</label>
                                        <input
                                            type="text"
                                            value={bankSettings.accountName || ''}
                                            onChange={e => updateBankSetting('accountName', e.target.value.toUpperCase())}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-bold uppercase"
                                            placeholder="NGUYEN VAN A"
                                        />
                                    </div>

                                    {/* Chi nhánh */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chi nhánh (tùy chọn)</label>
                                        <input
                                            type="text"
                                            value={bankSettings.branch || ''}
                                            onChange={e => updateBankSetting('branch', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                                            placeholder="Chi nhánh Hà Nội"
                                        />
                                    </div>

                                    {/* Prefix nội dung CK */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prefix nội dung chuyển khoản *</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={bankSettings.transferPrefix || 'MALI'}
                                                onChange={e => updateBankSetting('transferPrefix', e.target.value.toUpperCase())}
                                                className="w-32 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-mono font-bold uppercase"
                                                placeholder="MALI"
                                            />
                                            <span className="text-slate-400 text-sm">+</span>
                                            <div className="flex-1 px-3 py-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-sm font-mono text-yellow-800 font-bold">
                                                {bankSettings.transferPrefix || 'MALI'} 123456
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Ví dụ: Khách sẽ nhập nội dung "<strong>{bankSettings.transferPrefix || 'MALI'} MALI-442972</strong>"</p>
                                    </div>

                                    {/* Template QR */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template QR VietQR</label>
                                        <select
                                            value={bankSettings.qrTemplate || 'compact2'}
                                            onChange={e => updateBankSetting('qrTemplate', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                                        >
                                            <option value="compact2">compact2 (Khuyến nghị - Đẹp nhất)</option>
                                            <option value="compact">compact (Nhỏ gọn)</option>
                                            <option value="qr_only">qr_only (Chỉ QR)</option>
                                            <option value="print">print (Bản in)</option>
                                        </select>
                                    </div>

                                    {/* Preview QR */}
                                    {bankSettings.accountNo && bankSettings.bankId && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center gap-3">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xem trước QR Code</p>
                                            <img
                                                src={`https://img.vietqr.io/image/${bankSettings.bankId}-${bankSettings.accountNo}-${bankSettings.qrTemplate || 'compact2'}.png?amount=500000&addInfo=${encodeURIComponent((bankSettings.transferPrefix || 'MALI') + ' MALI-123456')}&accountName=${encodeURIComponent(bankSettings.accountName || '')}`}
                                                alt="QR Preview"
                                                className="w-48 h-auto rounded-lg shadow-md"
                                                onError={e => e.target.style.display = 'none'}
                                            />
                                            <p className="text-xs text-slate-400 text-center">QR mẫu với 500,000đ</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Xác minh tự động */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                                        <div className="p-2 bg-green-100 rounded-xl text-green-700"><Zap size={20} /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Xác minh Tự động</h4>
                                            <p className="text-xs text-slate-500">Kết nối API để tự động duyệt đơn</p>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {/* Bật/tắt tự động */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">Tự động duyệt đơn hàng</p>
                                                <p className="text-xs text-slate-500">Kích hoạt khóa học ngay khi phát hiện giao dịch khớp</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                                <input
                                                    type="checkbox"
                                                    checked={bankSettings.autoApproveEnabled || false}
                                                    onChange={e => updateBankSetting('autoApproveEnabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        {/* Phương thức */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phương thức xác minh</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { value: 'manual', label: '👤 Thủ công', desc: 'Admin duyệt tay qua trang Quản lý Đơn hàng' },
                                                    { value: 'sepay', label: '⚡ SePay Webhook', desc: 'Miễn phí - Realtime qua API SePay.vn' },
                                                    { value: 'casso', label: '💎 Casso API', desc: 'Có phí - Realtime qua API Casso.vn' },
                                                ].map(opt => (
                                                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${bankSettings.autoVerifyMethod === opt.value ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                                        <input
                                                            type="radio"
                                                            name="verifyMethod"
                                                            value={opt.value}
                                                            checked={bankSettings.autoVerifyMethod === opt.value}
                                                            onChange={e => updateBankSetting('autoVerifyMethod', e.target.value)}
                                                            className="mt-1"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                                                            <p className="text-xs text-slate-500">{opt.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SePay Config */}
                                        {bankSettings.autoVerifyMethod === 'sepay' && (
                                            <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-blue-800">⚡ Cấu hình SePay</p>
                                                    <a href="https://sepay.vn" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                        sepay.vn <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-700 mb-1">SePay API Key</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type={showSecrets.sepayKey ? 'text' : 'password'}
                                                            value={bankSettings.sepayApiKey || ''}
                                                            onChange={e => updateBankSetting('sepayApiKey', e.target.value)}
                                                            className="flex-1 px-3 py-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-mono"
                                                            placeholder="sep_live_xxxxxxxxxxxx"
                                                        />
                                                        <button type="button" onClick={() => toggleSecret('sepayKey')} className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50">
                                                            {showSecrets.sepayKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-blue-600">
                                                    💡 <strong>Hướng dẫn:</strong> Đăng nhập SePay → Tích hợp → API → Tạo API Key. Sau đó vào Webhook và trỏ về URL của bạn.
                                                </p>
                                            </div>
                                        )}

                                        {/* Casso Config */}
                                        {bankSettings.autoVerifyMethod === 'casso' && (
                                            <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-purple-800">💎 Cấu hình Casso</p>
                                                    <a href="https://casso.vn" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                                                        casso.vn <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-purple-700 mb-1">Casso API Key</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type={showSecrets.cassoKey ? 'text' : 'password'}
                                                            value={bankSettings.cassoApiKey || ''}
                                                            onChange={e => updateBankSetting('cassoApiKey', e.target.value)}
                                                            className="flex-1 px-3 py-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm font-mono"
                                                            placeholder="AK_xxxxxxxxxxxxxxxxxx"
                                                        />
                                                        <button type="button" onClick={() => toggleSecret('cassoKey')} className="px-3 py-2 bg-white border border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50">
                                                            {showSecrets.cassoKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-purple-600">
                                                    💡 <strong>Hướng dẫn:</strong> Đăng nhập Casso → Cài đặt → API Key → Tạo mới.
                                                </p>
                                            </div>
                                        )}

                                        {/* Run Manual Check */}
                                        {bankSettings.autoVerifyMethod !== 'manual' && (
                                            <div className="pt-2">
                                                <button
                                                    onClick={handleRunVerify}
                                                    disabled={isRunningVerify}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                                                >
                                                    {isRunningVerify ? (
                                                        <><RefreshCw size={16} className="animate-spin" /> Đang kiểm tra giao dịch...</>
                                                    ) : (
                                                        <><Zap size={16} /> Chạy xác minh ngay</>  
                                                    )}
                                                </button>
                                                {verifyResult && (
                                                    <div className={`mt-3 p-3 rounded-xl text-sm ${verifyResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                                        {verifyResult.success ? (
                                                            <>
                                                                <p className="font-bold">✅ Kết quả từ {verifyResult.source}</p>
                                                                <p>Đã kiểm tra: {verifyResult.transactionsChecked} giao dịch</p>
                                                                <p>Đã duyệt: <strong>{verifyResult.approvedCount}</strong> đơn hàng</p>
                                                            </>
                                                        ) : (
                                                            <p>❌ {verifyResult.message || verifyResult.error}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Telegram Notifications */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                                        <div className="p-2 bg-sky-100 rounded-xl text-sky-700"><Send size={20} /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Thông báo Telegram (tùy chọn)</h4>
                                            <p className="text-xs text-slate-500">Nhận thông báo khi có đơn hàng mới</p>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bot Token</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type={showSecrets.telegramToken ? 'text' : 'password'}
                                                    value={bankSettings.telegramBotToken || ''}
                                                    onChange={e => updateBankSetting('telegramBotToken', e.target.value)}
                                                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-mono"
                                                    placeholder="123456:ABCdefGHijklMNOPqrstUVWxyz"
                                                />
                                                <button type="button" onClick={() => toggleSecret('telegramToken')} className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-200">
                                                    {showSecrets.telegramToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chat ID</label>
                                            <input
                                                type="text"
                                                value={bankSettings.telegramChatId || ''}
                                                onChange={e => updateBankSetting('telegramChatId', e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-mono"
                                                placeholder="-1001234567890 hoặc @username"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            💡 Tạo bot tại @BotFather → Lấy chat ID tại @userinfobot
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveBankSettings}
                                disabled={isSavingBank}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all disabled:opacity-50"
                            >
                                {isSavingBank ? (
                                    <><RefreshCw size={18} className="animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><Save size={18} /> Lưu cấu hình thanh toán</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB: THAM SỐ HỆ THỐNG */}
                {activeTab === 'system' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. Cấu Hình Sản Phẩm (Khóa Học) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                        <Box size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Cấu Hình Sản Phẩm</h2>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Shared config via Firestore</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <input
                                        type="text"
                                        value={newCourseName}
                                        onChange={(e) => setNewCourseName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                                        placeholder="Tên khóa học mới (VD: Khơi thông dòng tiền)..."
                                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-inner bg-slate-50/10"
                                    />
                                </div>

                                {/* Danh sách khóa học */}
                                <div className="space-y-3">
                                    {isLoading ? (
                                        <div className="text-center py-10 text-slate-400">Đang tải...</div>
                                    ) : courses.length === 0 ? (
                                        <div className="text-center py-10 text-slate-300 italic border-2 border-dashed border-slate-100 rounded-3xl">Chưa có khóa học nào trên Firestore</div>
                                    ) : courses.map(course => (
                                        <div key={course.id} className="group border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-blue-200">
                                            <div
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${expandedId === course.id ? 'bg-blue-50/30' : 'bg-white'}`}
                                                onClick={() => setExpandedId(expandedId === course.id ? null : course.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {expandedId === course.id ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-slate-400" />}
                                                    <span className={`font-bold transition-colors ${expandedId === course.id ? 'text-blue-600' : 'text-slate-700'}`}>{course.name}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm("Xóa khóa học này khỏi hệ thống?")) deleteDoc(doc(crmFirestore, "courses_config", course.id));
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {expandedId === course.id && (
                                                <div className="p-5 bg-white border-t border-slate-50 space-y-5">
                                                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {course.batches && course.batches.length > 0 ? course.batches.map(k => (
                                                                <div key={k} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-xs font-black shadow-sm group/tag">
                                                                    {k}
                                                                    <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeBatch(course.id, k)} />
                                                                </div>
                                                            )) : (
                                                                <p className="text-xs text-slate-400 italic">Chưa có khóa K nào</p>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Thêm K (VD: K38)..."
                                                            className="w-full text-xs font-bold text-slate-500 outline-none bg-transparent placeholder:text-slate-300 border-t border-slate-100 pt-3"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleAddBatch(course.id, e.currentTarget.value);
                                                                    e.currentTarget.value = "";
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Cấu hình CRM Statuses/Meta (Linked to RTDB) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                                    <Zap size={24} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Cấu hình Luồng Lead</h2>
                            </div>
                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-800 italic text-sm">
                                Các tham số về Trạng thái Lead, Nguồn Chi tiêu hiện đang được quản lý tập trung tại Web CRM.
                                <br /><br />
                                <b>Lưu ý:</b> Các khóa học được thêm tại đây sẽ xuất hiện ngay lập tức trên CRM để Sale chọn.
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: QUẢN LÝ NHÂN SỰ (LINKED DATA) */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                    <Users size={24} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Nhân Sự Hệ Thống CRM</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto p-4">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
                                        <th className="p-4">Nhân sự</th>
                                        <th className="p-4">Vai trò / Team</th>
                                        <th className="p-4">Trạng thái</th>
                                        <th className="p-4">Truy cập lần cuối</th>
                                        <th className="p-4 text-right">Tài Khoản Web</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {crmUsers.map(user => (
                                        <tr key={user.email} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-700">{user.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase mr-2">{user.role}</span>
                                                <span className="text-xs font-bold text-slate-400">{user.team}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {user.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-slate-400 font-mono italic">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Chưa đăng nhập'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {webUserEmails.includes(user.email?.toLowerCase()) ? (
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100">
                                                        ĐÃ CÓ TÀI KHOẢN
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleSyncToWebAdmin(user)}
                                                        disabled={isSyncingUser === user.email}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold transition hover:bg-slate-800 disabled:opacity-50"
                                                    >
                                                        {isSyncingUser === user.email ? (
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <RefreshCw size={12} />
                                                        )}
                                                        Tạo tài khoản
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: QUẢN LÝ TÀI KHOẢN WEB */}
                {activeTab === 'web_accounts' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Quản lý Tài Khoản Web Admin</h2>
                                    <p className="text-xs text-slate-400">Thay đổi mật khẩu, vai trò, và quyền truy cập module cho từng nhân viên</p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto p-4">
                            {webUsers.filter(u => u.role === 'admin').length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <Lock size={40} className="mx-auto mb-4 text-slate-200" />
                                    <p className="font-bold">Chưa có tài khoản Admin nào</p>
                                    <p className="text-xs mt-1">Hãy đồng bộ từ tab Nhân sự CRM trước</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
                                            <th className="p-4">Tài khoản</th>
                                            <th className="p-4">Vai trò</th>
                                            <th className="p-4">Module được phép</th>
                                            <th className="p-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {webUsers.filter(u => u.role === 'admin').map(user => (
                                            <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700">{user.displayName || 'Unnamed'}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                        user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-green-100 text-green-700 border border-green-200'
                                                    }`}>
                                                        {user.role === 'admin' ? 'ADMIN' : 'HỌC VIÊN'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(!user.allowedModules || user.allowedModules.length === 0) ? (
                                                            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">TOÀN QUYỀN</span>
                                                        ) : (
                                                            user.allowedModules.map(m => {
                                                                const mod = ALL_MODULES.find(am => am.key === m);
                                                                return mod ? (
                                                                    <span key={m} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                                        {mod.label}
                                                                    </span>
                                                                ) : null;
                                                            })
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => setEditingWebUser({ ...user })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold transition hover:bg-indigo-700"
                                                    >
                                                        <Edit size={12} /> Chỉnh sửa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL: CHỈNH SỬA TÀI KHOẢN WEB */}
                {editingWebUser && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setEditingWebUser(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa tài khoản</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{editingWebUser.displayName || editingWebUser.email}</p>
                                    </div>
                                    <button onClick={() => setEditingWebUser(null)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                                {/* 1. MẬT KHẨU */}
                                <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <Key size={16} className="text-orange-500" />
                                        Mật khẩu
                                    </div>
                                    <p className="text-xs text-slate-400">Gửi email đặt lại mật khẩu cho nhân viên. Họ sẽ nhận được link để tự đặt mật khẩu mới.</p>
                                    <button
                                        onClick={() => handleResetPassword(editingWebUser.email)}
                                        disabled={isSavingUser}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold transition hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        <Mail size={14} /> Gửi email đặt lại mật khẩu
                                    </button>
                                </div>

                                {/* 2. VAI TRÒ */}
                                <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <Shield size={16} className="text-purple-500" />
                                        Vai trò
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setEditingWebUser(prev => ({ ...prev, role: 'admin' }))}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                                editingWebUser.role === 'admin'
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            🛡️ Admin
                                        </button>
                                        <button
                                            onClick={() => setEditingWebUser(prev => ({ ...prev, role: 'student' }))}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                                editingWebUser.role === 'student'
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            🎓 Học viên
                                        </button>
                                    </div>
                                </div>

                                {/* 3. PHÂN QUYỀN MODULE */}
                                {editingWebUser.role === 'admin' && (
                                    <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <Settings size={16} className="text-blue-500" />
                                                Phân quyền Module
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const allChecked = !editingWebUser.allowedModules || editingWebUser.allowedModules.length === 0;
                                                    if (allChecked) {
                                                        // Currently full access, uncheck all (only give dashboard to prevent lockout)
                                                        setEditingWebUser(prev => ({ ...prev, allowedModules: ['dashboard'] }));
                                                    } else {
                                                        // Give full access
                                                        setEditingWebUser(prev => ({ ...prev, allowedModules: [] }));
                                                    }
                                                }}
                                                className="text-xs font-bold text-indigo-600 hover:underline"
                                            >
                                                {(!editingWebUser.allowedModules || editingWebUser.allowedModules.length === 0) ? 'Tùy chỉnh' : 'Chọn toàn quyền'}
                                            </button>
                                        </div>

                                        {(!editingWebUser.allowedModules || editingWebUser.allowedModules.length === 0) ? (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                                <span className="text-sm font-bold text-emerald-600">✅ TOÀN QUYỀN - Truy cập tất cả module</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {ALL_MODULES.map(mod => {
                                                    const isChecked = editingWebUser.allowedModules?.includes(mod.key);
                                                    return (
                                                        <label
                                                            key={mod.key}
                                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                                                                isChecked
                                                                    ? 'border-blue-200 bg-blue-50/50'
                                                                    : 'border-slate-100 hover:border-slate-200'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    setEditingWebUser(prev => {
                                                                        const current = prev.allowedModules || [];
                                                                        if (current.includes(mod.key)) {
                                                                            return { ...prev, allowedModules: current.filter(m => m !== mod.key) };
                                                                        } else {
                                                                            return { ...prev, allowedModules: [...current, mod.key] };
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                            />
                                                            <span className={`text-sm font-bold ${isChecked ? 'text-blue-700' : 'text-slate-500'}`}>
                                                                {mod.label}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 flex items-center gap-3">
                                <button
                                    onClick={() => setEditingWebUser(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleSaveWebUser(editingWebUser)}
                                    disabled={isSavingUser}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSavingUser ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Check size={16} />
                                    )}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: DATA SOURCES */}
                {activeTab === 'sources' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                                    <Database size={24} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Data Source Mapping</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <SourceTable courses={courses} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SourceTable = ({ courses }) => {
    const [sources, setSources] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(collection(crmFirestore, "source_configs"), (snap) => {
            setSources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsub;
    }, []);

    const updateSource = async (id, field, value) => {
        try {
            await updateDoc(doc(crmFirestore, "source_configs", id), { [field]: value });
        } catch { toast.error("Lỗi cập nhật"); }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] border-b border-slate-100">
                        <th className="pb-4 px-2">Mã Source Key</th>
                        <th className="pb-4 px-2">Khóa học Đích</th>
                        <th className="pb-4 px-2">Mã K</th>
                        <th className="pb-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sources.map(src => (
                        <tr key={src.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-2">
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-sm">{src.id}</span>
                            </td>
                            <td className="py-4 px-2">
                                <select
                                    className="bg-transparent font-bold text-slate-600 outline-none text-sm w-full"
                                    value={src.targetCourseId}
                                    onChange={(e) => updateSource(src.id, 'targetCourseId', e.target.value)}
                                >
                                    <option value="">-- Chọn khóa --</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </td>
                            <td className="py-4 px-2">
                                <select
                                    className="bg-transparent font-bold text-blue-600 outline-none text-sm w-full"
                                    value={src.targetK}
                                    onChange={(e) => updateSource(src.id, 'targetK', e.target.value)}
                                >
                                    <option value="">-- Chọn K --</option>
                                    {(() => {
                                        const course = courses.find(c => String(c.id) === String(src.targetCourseId) || slugify(c.name || "") === String(src.targetCourseId));
                                        return course?.batches?.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ));
                                    })()}
                                </select>
                            </td>
                            <td className="py-4 text-right">
                                <button onClick={() => deleteDoc(doc(crmFirestore, "source_configs", src.id))} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminSettings;
