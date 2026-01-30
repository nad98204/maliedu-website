import React, { useEffect, useState } from 'react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    where,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { Plus, Trash2, UserPlus, X, Mail, BookOpen, Users, Lock, Key, Search, Edit, Send, Monitor, Smartphone } from 'lucide-react';

// Use Named Import for Config
import { db, firebaseConfig } from '../../firebase';
import { removeSession } from "../../utils/sessionService";

const AdminStudents = () => {
    // TABS: 'list' (Users), 'enrollments' (Active Courses), 'create' (New Account)
    const [activeTab, setActiveTab] = useState('list');

    // DATA
    const [users, setUsers] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);

    // UI STATES
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // FORMS
    // 1. Activate Course Form (Modal)
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [activateData, setActivateData] = useState({ userId: '', email: '', courseId: '' });

    // 2. Create User Form (Tab)
    const [createData, setCreateData] = useState({ email: '', password: '', name: '' });

    // 3. Edit User Form (Modal)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editTab, setEditTab] = useState('info'); // 'info' | 'devices'

    // --- FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Users
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const usersSnap = await getDocs(usersQuery);
            const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);

            // 2. Fetch Enrollments
            const enrollQuery = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
            const enrollSnap = await getDocs(enrollQuery);
            const enrollList = enrollSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEnrollments(enrollList);

            // 3. Fetch Courses (For Dropdown)
            const courseQuery = query(collection(db, 'courses'));
            const courseSnap = await getDocs(courseQuery);
            const courseList = courseSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setCourses(courseList);

        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Lỗi tải dữ liệu", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ACTIONS ---
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Filter Users
    const filteredUsers = users.filter(u =>
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.uid?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 1. CREATE ACCOUNT (Secondary App approach)
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let secondaryApp = null;
        try {
            // Initialize User Creation App
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);

            // Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, createData.email, createData.password);
            const user = userCredential.user;

            // Create User Profile in Firestore (Main DB)
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: createData.name,
                role: 'student',
                createdAt: serverTimestamp(),
                photoURL: user.photoURL || null
            });

            // Sign out from secondary (important!)
            await signOut(secondaryAuth);

            showToast(`Đã tạo tài khoản thành công: ${createData.email}`);
            setCreateData({ email: '', password: '', name: '' });
            fetchData(); // Refresh list
            setActiveTab('list'); // Switch to List view

        } catch (error) {
            console.error("Create User Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                showToast("Email này đã được sử dụng!", "error");
            } else {
                showToast("Lỗi khi tạo tài khoản: " + error.message, "error");
            }
        } finally {
            if (secondaryApp) {
                deleteApp(secondaryApp); // Cleanup
            }
            setIsSubmitting(false);
        }
    };

    // 2. ACTIVATE COURSE
    const handleActivateCourse = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const selectedCourse = courses.find(c => c.id === activateData.courseId);
            if (!selectedCourse) throw new Error("Chọn khóa học hợp lệ");
            if (!activateData.userId) throw new Error("Chọn học viên hợp lệ");

            // Check duplicate
            const q = query(collection(db, 'enrollments'),
                where('userId', '==', activateData.userId),
                where('courseId', '==', activateData.courseId)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                showToast("Học viên này đã có khóa học này rồi!", "error");
                return;
            }

            await addDoc(collection(db, 'enrollments'), {
                userId: activateData.userId,
                userEmail: activateData.email,
                courseId: activateData.courseId,
                courseName: selectedCourse.name,
                createdAt: Date.now(),
                status: 'active',
                progress: 0
            });

            showToast("Kích hoạt khóa học thành công!");
            setIsActivateModalOpen(false);
            setActivateData({ userId: '', email: '', courseId: '' });
            fetchData(); // Refresh
        } catch (err) {
            console.error(err);
            showToast("Lỗi kích hoạt: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEnrollment = async (id) => {
        if (!window.confirm("Hủy kích hoạt khóa học này?")) return;
        try {
            await deleteDoc(doc(db, 'enrollments', id));
            showToast("Đã hủy kích hoạt");
            setEnrollments(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            showToast("Lỗi xóa", "error");
        }
    };

    // 3. EDIT USER & RESET PASSWORD
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSubmitting(true);
        try {
            await setDoc(doc(db, 'users', editingUser.id), {
                displayName: editingUser.displayName
            }, { merge: true });

            showToast("Đã cập nhật thông tin học viên");
            setIsEditModalOpen(false);
            setEditingUser(null);
            fetchData();
        } catch (err) {
            showToast("Lỗi cập nhật: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!editingUser?.email) return;
        if (!window.confirm(`Gửi email đổi mật khẩu tới ${editingUser.email}?`)) return;

        // Use main auth instance to send reset email
        const mainAuth = getAuth();
        try {
            await sendPasswordResetEmail(mainAuth, editingUser.email);
            showToast(`Đã gửi email đổi mật khẩu tới ${editingUser.email}`);
        } catch (err) {
            console.error(err);
            showToast("Lỗi gửi email: " + err.message, "error");
        }
    };


    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-bold animate-fade-in ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Học Viên & Tài Khoản</h1>
                    <p className="text-sm text-slate-500">Quản lý user, tạo tài khoản và kích hoạt khóa học</p>
                </div>
            </div>

            {/* TABS */}
            <div className="border-b border-slate-200">
                <nav className="flex gap-6 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'list' ? 'border-secret-wax text-secret-wax' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Danh sách Học viên
                    </button>
                    <button
                        onClick={() => setActiveTab('enrollments')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'enrollments' ? 'border-secret-wax text-secret-wax' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Key className="w-4 h-4 inline-block mr-2" />
                        Quản lý Kích hoạt (Enrollments)
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'create' ? 'border-secret-wax text-secret-wax' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserPlus className="w-4 h-4 inline-block mr-2" />
                        Tạo Tài Khoản Mới
                    </button>
                </nav>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[400px]">
                {/* 1. LIST USERS TAB */}
                {activeTab === 'list' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc email..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                                Tổng: {filteredUsers.length} học viên
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Họ tên</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Vai trò</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ngày tạo</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Không tìm thấy học viên nào.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{u.displayName || 'Unnamed'}</td>
                                                <td className="px-6 py-4 text-slate-600">{u.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                        {u.role || 'student'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser({ ...u });
                                                            setEditTab('info');
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-secret-ink hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Sửa thông tin / Quản lý thiết bị"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActivateData({ userId: u.uid || u.id, email: u.email, courseId: '' });
                                                            setIsActivateModalOpen(true);
                                                        }}
                                                        className="text-xs bg-secret-wax/10 text-secret-wax px-3 py-1.5 rounded-lg hover:bg-secret-wax hover:text-white transition-colors font-bold flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" /> Kích hoạt khóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. ENROLLMENTS TAB */}
                {activeTab === 'enrollments' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsActivateModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink shadow-sm"
                            >
                                <Plus className="h-4 w-4" /> Kích hoạt thủ công
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Email Học Viên</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Khóa Học</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ngày Kích Hoạt</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {enrollments.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Chưa có kích hoạt nào.</td></tr>
                                    ) : (
                                        enrollments.map(e => (
                                            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{e.userEmail}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{e.courseName}</td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    {new Date(e.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDeleteEnrollment(e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hủy kích hoạt">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. CREATE ACCOUNT TAB */}
                {activeTab === 'create' && (
                    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-secret-wax" />
                            Tạo tài khoản học viên mới
                        </h2>

                        <form onSubmit={handleCreateUser} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Họ và tên</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={createData.name}
                                        onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none transition-all"
                                        placeholder="VD: Nguyễn Văn A"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Email đăng nhập</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={createData.email}
                                        onChange={e => setCreateData({ ...createData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none transition-all"
                                        placeholder="hocvien@gmail.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={createData.password}
                                        onChange={e => setCreateData({ ...createData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none transition-all font-mono text-slate-600"
                                        placeholder="Tối thiểu 6 ký tự"
                                        minLength={6}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Mật khẩu nên có ít nhất 6 ký tự.</p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-secret-wax text-white font-bold py-3 rounded-lg hover:bg-secret-ink transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tạo...</>
                                    ) : (
                                        <>Tạo tài khoản ngay</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* MODAL: Activate Course (Shared) */}
            {isActivateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Kích hoạt khóa học</h3>
                            <button onClick={() => setIsActivateModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleActivateCourse} className="space-y-4">
                            {/* User Select (If not pre-filled) */}
                            {!activateData.userId && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Chọn thành viên</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-secret-wax/20 outline-none"
                                        value={activateData.userId}
                                        onChange={e => {
                                            const u = users.find(x => (x.uid || x.id) === e.target.value);
                                            setActivateData({ ...activateData, userId: e.target.value, email: u?.email || '' });
                                        }}
                                        required
                                    >
                                        <option value="">-- Chọn User --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.uid || u.id}>{u.email} ({u.displayName})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Pre-filled Email Display */}
                            {activateData.email && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Thành viên được chọn</div>
                                    <div className="font-medium text-slate-900">{activateData.email}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Chọn khóa học để kích hoạt</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-secret-wax/20 outline-none"
                                    value={activateData.courseId}
                                    onChange={e => setActivateData({ ...activateData, courseId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Chọn khóa học --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-secret-wax text-white font-bold py-2.5 rounded-lg hover:bg-secret-ink transition mt-4"
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận kích hoạt'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Edit User */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Chi tiết học viên</h3>
                            <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-slate-200 mb-6">
                            <button
                                onClick={() => setEditTab('info')}
                                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${editTab === 'info' ? 'border-secret-wax text-secret-wax' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Thông tin
                            </button>
                            <button
                                onClick={() => setEditTab('devices')}
                                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${editTab === 'devices' ? 'border-secret-wax text-secret-wax' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Thiết bị ({editingUser.activeSessions?.length || 0})
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar">
                            {/* INFO TAB */}
                            {editTab === 'info' && (
                                <form onSubmit={handleUpdateUser} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Email (Không thể sửa)</label>
                                        <input
                                            type="text"
                                            value={editingUser.email}
                                            disabled
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Họ và tên</label>
                                        <input
                                            type="text"
                                            value={editingUser.displayName || ''}
                                            onChange={e => setEditingUser({ ...editingUser, displayName: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                                        <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Đặt lại mật khẩu
                                        </h4>
                                        <p className="text-xs text-orange-700">
                                            Admin không thể xem mật khẩu. Hãy gửi email để học viên tự đặt lại.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleSendResetEmail}
                                            className="w-full flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-700 font-bold py-2 rounded-lg hover:bg-orange-100 transition shadow-sm text-sm"
                                        >
                                            <Send className="w-3 h-3" /> Gửi email đặt lại mật khẩu
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-secret-wax text-white font-bold py-2.5 rounded-lg hover:bg-secret-ink transition mt-2"
                                    >
                                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </form>
                            )}

                            {/* DEVICES TAB */}
                            {editTab === 'devices' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                        <Monitor className="w-4 h-4" />
                                        <span>Đang đăng nhập: <b>{editingUser.activeSessions?.length || 0}/3</b> thiết bị</span>
                                    </div>

                                    {(editingUser.activeSessions || []).length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm italic">Học viên chưa đăng nhập thiết bị nào.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {editingUser.activeSessions.map((session, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500`}>
                                                            {session.deviceInfo?.toLowerCase().includes('mobile') ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm">
                                                                {session.deviceInfo || "Unidentified Device"}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('vi-VN') : 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm("Xóa thiết bị này khỏi tài khoản học viên?")) return;
                                                            try {
                                                                // Use u.id or u.uid? users list has 'id' as doc id.
                                                                // editingUser was set from u.
                                                                // u.id is the docId.
                                                                await removeSession(editingUser.id, session.deviceId);

                                                                // Optimistic Update
                                                                const newSessions = editingUser.activeSessions.filter(s => s.deviceId !== session.deviceId);
                                                                setEditingUser({ ...editingUser, activeSessions: newSessions });
                                                                setUsers(users.map(u => u.id === editingUser.id ? { ...u, activeSessions: newSessions } : u));

                                                                showToast("Đã xóa thiết bị");
                                                            } catch (e) {
                                                                console.error(e);
                                                                showToast("Lỗi xóa: " + e.message, "error");
                                                            }
                                                        }}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Xóa thiết bị"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudents;
