import React, { useEffect, useState, useCallback } from 'react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { Plus, Trash2, UserPlus, X, Mail, BookOpen, Users, Lock, Key, Search, Edit, Send, Monitor, Smartphone, Shield, ClipboardList } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

// Use Named Import for Config
import { db, auth, firebaseConfig } from '../../firebase';
import { removeSession } from "../../utils/sessionService";
import { isSuperAdminEmail } from '../../utils/adminAccess';

const AdminStudents = () => {
    // TABS: 'list' (Users), 'enrollments' (Active Courses), 'create' (New Account), 'audit' (Super Admin only)
    const [activeTab, setActiveTab] = useState('list');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [currentAdminUser, setCurrentAdminUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentAdminUser(user);
            if (user) {
                setIsSuperAdmin(isSuperAdminEmail(user.email));
            } else {
                setIsSuperAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // DATA
    const [users, setUsers] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);

    // UI STATES
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'student'
    const [courseFilter, setCourseFilter] = useState('all'); // 'all' or courseId
    const [enrollmentSearch, setEnrollmentSearch] = useState('');
    const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState('all');

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
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Users
            const usersSnap = await getDocs(collection(db, 'users'));
            const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
                const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                return timeB - timeA;
            });
            setUsers(usersList);

            // 2. Fetch Enrollments
            const enrollSnap = await getDocs(collection(db, 'enrollments'));
            const enrollList = enrollSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
                const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                return timeB - timeA;
            });
            setEnrollments(enrollList);

            // 3. Fetch Courses (For Dropdown)
            const courseQuery = query(collection(db, 'courses'));
            const courseSnap = await getDocs(courseQuery);
            const courseList = courseSnap.docs
                .map(doc => ({ 
                    id: doc.id, 
                    name: doc.data().name || doc.data().title || "" 
                }))
                .filter(c => c.name.trim() !== "") // Filter out blank names
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
            setCourses(courseList);

        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Lỗi tải dữ liệu", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- ACTIONS ---
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Filter Users
    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (u.uid?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter || (!u.role && roleFilter === 'student');
        
        let matchesCourse = true;
        if (courseFilter !== 'all') {
            const userEnrollments = enrollments.filter(e => e.userId === (u.uid || u.id));
            matchesCourse = userEnrollments.some(e => e.courseId === courseFilter);
        }

        return matchesSearch && matchesRole && matchesCourse;
    });

    // Filter Enrollments
    const filteredEnrollments = enrollments.filter(e => {
        const matchesSearch = (e.userEmail?.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
                              (e.courseName?.toLowerCase().includes(enrollmentSearch.toLowerCase()));
        const matchesCourse = enrollmentCourseFilter === 'all' || e.courseId === enrollmentCourseFilter;
        return matchesSearch && matchesCourse;
    });

    // 1. CREATE ACCOUNT (Secondary App approach)
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let secondaryApp = null;
        try {
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, createData.email, createData.password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: createData.name,
                role: 'student',
                createdAt: serverTimestamp(),
                photoURL: user.photoURL || null
            });

            await signOut(secondaryAuth);

            showToast(`Đã tạo tài khoản thành công: ${createData.email}`);
            setCreateData({ email: '', password: '', name: '' });
            fetchData();
            setActiveTab('list');

        } catch (error) {
            console.error("Create User Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                showToast("Email này đã được sử dụng!", "error");
            } else {
                showToast("Lỗi khi tạo tài khoản: " + error.message, "error");
            }
        } finally {
            if (secondaryApp) {
                deleteApp(secondaryApp);
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
                progress: 0,
                grantedByEmail: currentAdminUser?.email || 'unknown',
                grantedByName: currentAdminUser?.displayName || currentAdminUser?.email || 'Admin'
            });

            const { arrayUnion } = await import('firebase/firestore');
            await setDoc(doc(db, 'courses', activateData.courseId), {
                students: arrayUnion(activateData.userId)
            }, { merge: true });

            showToast("Kích hoạt khóa học thành công!");
            setIsActivateModalOpen(false);
            setActivateData({ userId: '', email: '', courseId: '' });
            fetchData();
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
            const enrollment = enrollments.find(e => e.id === id);
            await deleteDoc(doc(db, 'enrollments', id));

            if (enrollment) {
                const { arrayRemove } = await import('firebase/firestore');
                await setDoc(doc(db, 'courses', enrollment.courseId), {
                    students: arrayRemove(enrollment.userId)
                }, { merge: true });
            }

            showToast("Đã hủy kích hoạt");
            setEnrollments(prev => prev.filter(e => e.id !== id));
        } catch {
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

        const mainAuth = getAuth();
        try {
            await sendPasswordResetEmail(mainAuth, editingUser.email);
            showToast(`Đã gửi email đổi mật khẩu tới ${editingUser.email}`);
        } catch (err) {
            console.error(err);
            showToast("Lỗi gửi email: " + err.message, "error");
        }
    };



    const handleEditUser = (user) => {
        setEditingUser({ ...user });
        setEditTab('info');
        setIsEditModalOpen(true);
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
            {/* TOAST */}
            {toast && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 duration-300 ${
                    toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-secret-ink text-secret-wax'
                }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'error' ? 'bg-white' : 'bg-secret-wax'}`} />
                    <span className="font-bold text-sm uppercase tracking-wider">{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">
                {/* HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-full xl:w-auto text-center xl:text-left flex flex-col items-center xl:items-start">
                        <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 md:gap-3 uppercase">
                            <Users className="w-6 h-6 md:w-8 md:h-8 text-secret-wax" />
                            Quản lý học viên
                        </h1>
                        <p className="text-slate-500 mt-1 md:mt-2 text-[10px] sm:text-[11px] md:text-[13px] font-medium whitespace-nowrap tracking-tight">Kích hoạt khóa học, quản lý tài khoản & thiết bị đăng nhập.</p>
                    </div>
                    
                    <div className="flex flex-row bg-slate-100 p-1 md:p-1.5 md:rounded-2xl rounded-xl w-full xl:w-auto shadow-inner border border-slate-200 gap-1 lg:gap-0">
                        <button 
                            onClick={() => setActiveTab('list')}
                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:px-4 py-2 md:py-3 lg:px-6 rounded-lg md:rounded-xl text-[9px] sm:text-[11px] md:text-sm font-bold transition-all text-center leading-tight min-w-0 ${activeTab === 'list' ? 'bg-white text-secret-wax shadow-sm md:shadow-md scale-[1.02] md:scale-105 border border-secret-wax/10 z-10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <Users className="w-[14px] h-[14px] sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate max-w-full">Danh sách</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('enrollments')}
                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:px-4 py-2 md:py-3 lg:px-6 rounded-lg md:rounded-xl text-[9px] sm:text-[11px] md:text-sm font-bold transition-all text-center leading-tight min-w-0 ${activeTab === 'enrollments' ? 'bg-white text-indigo-600 shadow-sm md:shadow-md scale-[1.02] md:scale-105 border border-indigo-100 z-10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <BookOpen className="w-[14px] h-[14px] sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate max-w-full">Kích hoạt</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:px-4 py-2 md:py-3 lg:px-6 rounded-lg md:rounded-xl text-[9px] sm:text-[11px] md:text-sm font-bold transition-all text-center leading-tight min-w-0 ${activeTab === 'create' ? 'bg-white text-emerald-600 shadow-sm md:shadow-md scale-[1.02] md:scale-105 border border-emerald-100 z-10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <UserPlus className="w-[14px] h-[14px] sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate max-w-full">Tạo Account</span>
                        </button>
                        {/* Chỉ Super Admin mới thấy tab Nhật ký */}
                        {isSuperAdmin && (
                            <button 
                                onClick={() => setActiveTab('audit')}
                                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:px-4 py-2 md:py-3 lg:px-6 rounded-lg md:rounded-xl text-[9px] sm:text-[11px] md:text-sm font-bold transition-all text-center leading-tight min-w-0 ${activeTab === 'audit' ? 'bg-white text-purple-600 shadow-sm md:shadow-md scale-[1.02] md:scale-105 border border-purple-100 z-10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                            >
                                <Shield className="w-[14px] h-[14px] sm:w-4 sm:h-4 shrink-0" />
                                <span className="truncate max-w-full">Nhật ký</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS CONTENT */}
                <div className="min-h-[500px]">
                    {/* 1. USERS LIST TAB */}
                    {activeTab === 'list' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            {/* Search Bar & Filters */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                                    <div className="relative flex-1 max-w-md w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm theo tên hoặc email..."
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax bg-white text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <select 
                                        className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax font-bold text-slate-600 w-full sm:w-auto"
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="all">Tất cả vai trò</option>
                                        <option value="student">Học viên</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                    <select 
                                        className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax truncate w-full sm:max-w-[200px] font-bold text-slate-600"
                                        value={courseFilter}
                                        onChange={(e) => setCourseFilter(e.target.value)}
                                    >
                                        <option value="all">Tất cả khóa học</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-row items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
                                    <div className="text-sm border border-secret-wax/20 bg-secret-wax/5 text-secret-wax px-4 py-2.5 rounded-xl font-bold shrink-0 text-center flex-1 sm:flex-none">
                                        Tổng: {filteredUsers.length} học viên
                                    </div>

                                </div>
                            </div>

                            <div className="">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <div className="w-12 h-12 border-4 border-secret-wax border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-slate-500 text-sm animate-pulse font-black tracking-widest uppercase opacity-60">Đang đồng bộ dữ liệu...</p>
                                    </div>
                                ) : (
                                    <table className="w-full lg:min-w-[1050px] text-left border-collapse block lg:table lg:table-fixed">
                                        <thead className="bg-slate-50 border-b border-slate-200 hidden lg:table-header-group">
                                            <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                                                <th className="px-4 py-3 font-black w-[300px]">Học viên</th>
                                                <th className="px-4 py-3 font-black w-[250px]">Email</th>
                                                <th className="px-4 py-3 font-black border-x border-slate-100 bg-slate-100/20">Khóa học hiện có</th>
                                                <th className="px-4 py-3 font-black text-center w-[150px]">Ngày tham gia</th>
                                                <th className="px-4 py-3 font-black text-right w-[150px]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="block lg:table-row-group divide-y-0 lg:divide-y divide-slate-100 space-y-4 lg:space-y-0 p-4 lg:p-0">
                                            {filteredUsers.length === 0 ? (
                                                <tr className="block lg:table-row">
                                                    <td colSpan="5" className="block lg:table-cell px-6 py-20 text-center text-slate-400 italic">
                                                        Không tìm thấy học viên nào khớp với tiêu chí tìm kiếm.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((u) => (
                                                    <tr key={u.id} className="block lg:table-row bg-white lg:bg-transparent lg:hover:bg-slate-50/80 transition-all group border border-slate-200 lg:border-none rounded-2xl lg:rounded-none shadow-sm lg:shadow-none p-4 lg:p-0 relative">
                                                        
                                                        {/* Avatar and Name */}
                                                        <td className="block lg:table-cell px-0 lg:px-4 py-2 lg:py-3 align-middle border-b lg:border-none border-dashed border-slate-200 pb-3 lg:pb-3">
                                                            <div className="flex flex-row items-center gap-3">
                                                                <div className="w-12 h-12 lg:w-10 lg:h-10 rounded-full lg:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow shrink-0">
                                                                    {u.photoURL ? (
                                                                        <img 
                                                                            src={u.photoURL} 
                                                                            alt="" 
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                e.target.onerror = null;
                                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email || 'U')}&background=F1F5F9&color=94A3B8&bold=true`;
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-slate-400 font-black text-base lg:text-lg">
                                                                            {u.displayName?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 pr-8 lg:pr-0">
                                                                    <div className="font-black text-slate-800 flex flex-wrap items-center gap-1.5 text-[15px] lg:text-[13px] uppercase tracking-tight leading-tight">
                                                                        <span className="truncate" title={u.displayName}>{u.displayName || 'Unnamed Learner'}</span>
                                                                        {u.role === 'admin' && (
                                                                            <span className="text-[9px] bg-secret-ink text-secret-wax px-2 py-0.5 rounded-full font-black uppercase ring-1 ring-secret-wax/20 shadow-sm shrink-0">Admin</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs lg:text-[10px] text-slate-500 font-medium lg:font-mono lg:italic lg:opacity-0 lg:group-hover:opacity-100 transition-opacity truncate" title={u.email}>{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Email (Hidden on mobile as it's under Name) */}
                                                        <td className="hidden lg:table-cell px-4 py-3 text-slate-600 text-[11px] font-bold tracking-tight whitespace-nowrap align-middle">{u.email}</td>
                                                         
                                                         {/* Courses */}
                                                         <td className="block lg:table-cell px-0 lg:px-4 py-3 lg:border-x border-slate-100 align-middle">
                                                             <div className="flex flex-col gap-2 lg:gap-1.5">
                                                                 <span className="lg:hidden text-[10px] uppercase tracking-widest font-black text-slate-400">Khóa học hiện có:</span>
                                                                 {(() => {
                                                                     const userEnrollments = enrollments.filter(e => e.userId === (u.uid || u.id));
                                                                     if (userEnrollments.length === 0) return (
                                                                         <div className="flex items-center gap-2 text-slate-400">
                                                                             <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                                                                 <BookOpen className="w-3 h-3" />
                                                                             </div>
                                                                             <span className="text-xs italic font-medium">Chưa có khóa học</span>
                                                                         </div>
                                                                     );
                                                                     return userEnrollments.map((e) => (
                                                                         <button
                                                                             key={e.id}
                                                                             onClick={() => {
                                                                                 setEnrollmentSearch('');
                                                                                 setEnrollmentCourseFilter(e.courseId);
                                                                                 setActiveTab('enrollments');
                                                                             }}
                                                                             title="Nhấp để xem chi tiết kích hoạt"
                                                                             className="group/course flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:border-indigo-600 transition-all"
                                                                         >
                                                                             <div className="w-6 h-6 rounded-lg bg-white border border-indigo-200 group-hover/course:bg-indigo-500 group-hover/course:border-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                                                                                 <BookOpen className="w-3 h-3 text-indigo-500 group-hover/course:text-white transition-colors" />
                                                                             </div>
                                                                             <span className="text-xs lg:text-[10px] font-bold text-indigo-700 group-hover/course:text-white transition-colors line-clamp-2 lg:whitespace-nowrap">{e.courseName}</span>
                                                                         </button>
                                                                     ));
                                                                 })()}
                                                             </div>
                                                         </td>

                                                        {/* Join Date */}
                                                        <td className="block lg:table-cell px-0 lg:px-4 py-3 align-middle lg:text-center text-slate-500 text-[11px] font-bold font-mono lg:whitespace-nowrap border-t lg:border-none border-dashed border-slate-200 mt-2 lg:mt-0 pt-3 lg:pt-3 flex items-center justify-between lg:block">
                                                            <span className="lg:hidden text-[10px] uppercase font-black tracking-widest text-slate-400">Ngày tham gia:</span>
                                                            {u.createdAt ? new Date(u.createdAt.seconds ? u.createdAt.seconds * 1000 : u.createdAt).toLocaleDateString('vi-VN') : '---'}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="block lg:table-cell px-0 lg:px-4 py-0 lg:py-3 align-middle text-right lg:whitespace-nowrap absolute lg:static top-4 right-4 lg:top-auto lg:right-auto">
                                                            <div className="flex justify-end lg:justify-end gap-2 lg:gap-3 lg:translate-x-2 lg:group-hover:translate-x-0 transition-transform">
                                                                <button
                                                                    onClick={() => handleEditUser(u)}
                                                                    className="p-2 lg:p-2.5 text-slate-400 hover:text-secret-wax bg-slate-100 lg:bg-white lg:border border-slate-100 hover:bg-secret-wax/10 rounded-full lg:rounded-2xl transition-all shadow-sm hover:border-secret-wax/20"
                                                                    title="Sửa thông tin / Quản lý thiết bị"
                                                                >
                                                                    <Edit className="w-[14px] h-[14px] lg:w-4 lg:h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActivateData({ userId: u.uid || u.id, email: u.email, courseId: '' });
                                                                        setIsActivateModalOpen(true);
                                                                    }}
                                                                    className="hidden lg:block text-[10px] bg-secret-wax text-white px-4 py-2.5 rounded-2xl hover:bg-secret-ink transition-all font-black uppercase tracking-widest shadow-lg shadow-secret-wax/10 active:scale-95"
                                                                >
                                                                    Kích hoạt
                                                                </button>
                                                                {/* Mobile specific activate button */}
                                                                <button
                                                                    onClick={() => {
                                                                        setActivateData({ userId: u.uid || u.id, email: u.email, courseId: '' });
                                                                        setIsActivateModalOpen(true);
                                                                    }}
                                                                    className="lg:hidden p-2 bg-secret-wax text-white rounded-full hover:bg-secret-ink transition-all shadow-md active:scale-95"
                                                                >
                                                                    <Plus className="w-[14px] h-[14px]" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. ENROLLMENTS TAB */}
                    {activeTab === 'enrollments' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm theo email hoặc tên khóa học..."
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax bg-white text-sm"
                                            value={enrollmentSearch}
                                            onChange={(e) => setEnrollmentSearch(e.target.value)}
                                        />
                                    </div>
                                    <select 
                                        className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax truncate max-w-[200px]"
                                        value={enrollmentCourseFilter}
                                        onChange={(e) => setEnrollmentCourseFilter(e.target.value)}
                                    >
                                        <option value="all">Tất cả khóa học</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                                    <div className="text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg font-bold shrink-0 hidden sm:block">
                                        Tổng: {filteredEnrollments.length} kích hoạt
                                    </div>
                                    <button
                                        onClick={() => setIsActivateModalOpen(true)}
                                        className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 rounded-lg bg-secret-wax px-4 py-2.5 text-sm font-bold text-white transition hover:bg-secret-ink shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" /> Kích hoạt thủ công
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left table-fixed">
                                    <thead className="bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[250px]">Email Học Viên</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Khóa Học</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[150px]">Ngày Kích Hoạt</th>
                                            {isSuperAdmin && (
                                                <th className="px-4 py-3 text-xs font-bold text-purple-600 uppercase flex items-center gap-1.5 w-[200px]">
                                                    <Shield className="w-3.5 h-3.5" /> Cấp bởi
                                                </th>
                                            )}
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-[120px]">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredEnrollments.length === 0 ? (
                                            <tr><td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-8 text-center text-slate-400">Chưa có kích hoạt nào khớp tìm kiếm.</td></tr>
                                        ) : (
                                            filteredEnrollments.map(e => (
                                                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-[11px] text-slate-900 whitespace-nowrap truncate">{e.userEmail}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-[13px] font-medium leading-snug truncate">{e.courseName}</td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                                        {new Date(e.createdAt).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    {isSuperAdmin && (
                                                        <td className="px-4 py-3 w-40">
                                                            {e.grantedByEmail ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                                                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs font-bold text-slate-700">{e.grantedByName || e.grantedByEmail}</div>
                                                                        <div className="text-[10px] text-slate-400 font-mono">{e.grantedByEmail}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                        <span className="text-[10px] text-slate-400 italic">-- Không rõ --</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
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

                    {/* 3. AUDIT LOG TAB - Super Admin only */}
                    {activeTab === 'audit' && isSuperAdmin && (() => {
                        // Group enrollments by grantedByEmail
                        const byAdmin = {};
                        enrollments.forEach(e => {
                            const key = e.grantedByEmail || '__unknown__';
                            if (!byAdmin[key]) byAdmin[key] = { email: e.grantedByEmail, name: e.grantedByName, records: [] };
                            byAdmin[key].records.push(e);
                        });
                        const adminGroups = Object.values(byAdmin).sort((a, b) => (b.records.length - a.records.length));

                        return (
                            <div className="space-y-6">
                                {/* Summary cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {adminGroups.map((group, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                                                <Shield className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-black text-slate-800 text-sm truncate">{group.name || group.email || 'Không rõ'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono truncate">{group.email || 'N/A'}</div>
                                                <div className="mt-1.5 inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    <ClipboardList className="w-3 h-3" /> {group.records.length} kích hoạt
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Full log table */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Toàn bộ nhật ký cấp quyền</h3>
                                        <span className="ml-auto text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold">{enrollments.length} bản ghi</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[950px] text-left table-fixed">
                                            <thead className="bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-bold text-purple-600 uppercase w-[250px]">Admin cấp quyền</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[250px]">Email Học Viên</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Khóa Học</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[150px]">Ngày Cấp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[...enrollments].sort((a,b) => (b.createdAt||0) - (a.createdAt||0)).map(e => (
                                                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 align-top md:align-middle whitespace-nowrap">
                                                            {e.grantedByEmail ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                                                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-black text-slate-800 truncate">{e.grantedByName || e.grantedByEmail}</div>
                                                                        <div className="text-[10px] text-slate-400 font-mono truncate">{e.grantedByEmail}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-1 rounded">Trước khi theo dõi</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-[11px] font-medium text-slate-700 whitespace-nowrap truncate align-top md:align-middle">{e.userEmail}</td>
                                                        <td className="px-4 py-3 align-top md:align-middle truncate">
                                                            <span className="inline-flex items-center gap-1 text-[11px] leading-tight font-bold text-secret-ink bg-secret-wax/10 border border-secret-wax/20 px-2 py-1.5 rounded-lg max-w-full">
                                                                <BookOpen className="w-3 h-3 shrink-0" />
                                                                <span className="truncate whitespace-normal">{e.courseName}</span>
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap align-top md:align-middle">
                                                            {e.createdAt ? new Date(e.createdAt).toLocaleString('vi-VN') : '---'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* 4. CREATE ACCOUNT TAB */}
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
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-secret-wax/20 outline-none font-bold text-slate-600"
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
                                    <div className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1 opacity-60">Thành viên được chọn</div>
                                    <div className="font-black text-secret-ink text-sm">{activateData.email}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Chọn khóa học để kích hoạt</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-secret-wax/20 outline-none font-bold text-slate-600"
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
                                className="w-full bg-secret-wax text-white font-black py-3 rounded-xl hover:bg-secret-ink transition-all mt-4 uppercase tracking-[0.2em] shadow-lg shadow-secret-wax/10"
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
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-100 flex flex-col max-h-[90vh] border border-white/20">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Chi tiết học viên</h3>
                            <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 shadow-inner border border-slate-200">
                            <button
                                onClick={() => setEditTab('info')}
                                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${editTab === 'info' ? 'bg-white text-secret-wax shadow-sm scale-105 border border-secret-wax/10' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Thông tin cá nhân
                            </button>
                            <button
                                onClick={() => setEditTab('devices')}
                                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${editTab === 'devices' ? 'bg-white text-secret-wax shadow-sm scale-105 border border-secret-wax/10' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Thiết bị ({editingUser.activeSessions?.length || 0})
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar">
                            {/* INFO TAB */}
                            {editTab === 'info' && (
                                <form onSubmit={handleUpdateUser} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Duy nhất)</label>
                                        <input
                                            type="text"
                                            value={editingUser.email}
                                            disabled
                                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 font-bold text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Họ và tên</label>
                                        <input
                                            type="text"
                                            value={editingUser.displayName || ''}
                                            onChange={e => setEditingUser({ ...editingUser, displayName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none font-bold text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4 shadow-inner">
                                        <h4 className="text-[11px] font-black text-orange-800 flex items-center gap-2 uppercase tracking-widest">
                                            <Lock className="w-4 h-4" /> Bảo mật & Mật khẩu
                                        </h4>
                                        <p className="text-xs text-orange-700 font-medium">
                                            Admin không thể xem mật khẩu. Hãy gửi email để học viên tự cài đặt lại mật khẩu mới.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleSendResetEmail}
                                            className="w-full flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-700 font-black py-3 rounded-xl hover:bg-orange-100 transition shadow-sm text-[10px] uppercase tracking-widest active:scale-95"
                                        >
                                            <Send className="w-4 h-4" /> Gửi email đặt lại
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-secret-ink text-secret-wax font-black py-4 rounded-2xl hover:bg-black transition shadow-xl mt-4 uppercase tracking-[0.2em] active:scale-95 shadow-secret-ink/20"
                                    >
                                        {isSubmitting ? 'Đang cập nhật...' : 'Lưu tất cả thay đổi'}
                                    </button>
                                </form>
                            )}

                            {/* DEVICES TAB */}
                            {editTab === 'devices' && (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 text-xs text-secret-ink bg-secret-wax/10 p-4 rounded-2xl border border-secret-wax/20">
                                        <Monitor className="w-5 h-5 text-secret-wax" />
                                        <span className="font-bold uppercase tracking-tight">Số thiết bị đang đăng nhập: <b className="text-lg">{editingUser.activeSessions?.length || 0}</b>/3</span>
                                    </div>

                                    {(editingUser.activeSessions || []).length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 text-sm italic opacity-60 flex flex-col items-center gap-4">
                                            < Smartphone className="w-12 h-12 opacity-20" />
                                            Học viên hiện không đăng nhập trên bất kỳ thiết bị nào.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {editingUser.activeSessions.map((session, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-secret-wax/10 group-hover:text-secret-wax transition-colors`}>
                                                            {session.deviceInfo?.toLowerCase().includes('mobile') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-[13px] uppercase tracking-tight">
                                                                {session.deviceInfo || "Thiết bị không tên"}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                Hoạt động: {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('vi-VN') : 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm("Xóa thiết bị này khỏi tài khoản học viên?")) return;
                                                            try {
                                                                await removeSession(editingUser.id, session.deviceId);
                                                                const newSessions = editingUser.activeSessions.filter(s => s.deviceId !== session.deviceId);
                                                                setEditingUser({ ...editingUser, activeSessions: newSessions });
                                                                setUsers(users.map(u => u.id === editingUser.id ? { ...u, activeSessions: newSessions } : u));
                                                                showToast("Đã xóa thiết bị đăng nhập");
                                                            } catch (e) {
                                                                console.error(e);
                                                                showToast("Lỗi xóa: " + e.message, "error");
                                                            }
                                                        }}
                                                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Xóa thiết bị"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
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
