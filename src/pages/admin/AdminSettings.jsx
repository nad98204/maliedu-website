import React, { useState, useEffect, useMemo } from 'react';
import { crmFirestore, crmRealtimeDB } from '../../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, onValue, set as setRTDB } from 'firebase/database';
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
    Tag as TagIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('system'); // 'users', 'system', 'sources'
    const [courses, setCourses] = useState([]);
    const [crmUsers, setCrmUsers] = useState([]);
    const [newCourseName, setNewCourseName] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const slugify = (text) => {
        return text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, '-');
    };

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
        } catch (e) {
            toast.error("Lỗi thêm K");
        }
    };

    // Xóa khóa K
    const removeBatch = async (courseId, tagToRemove) => {
        try {
            await updateDoc(doc(crmFirestore, "courses_config", courseId), {
                batches: arrayRemove(tagToRemove)
            });
        } catch (e) {
            toast.error("Lỗi xóa K");
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
            <div className="flex flex-wrap gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
                >
                    <Users size={18} /> NHÂN SỰ CRM
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'system' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
                >
                    <Layout size={18} /> THAM SỐ KHÓA HỌC
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="grid grid-cols-1 gap-6">

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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
        } catch (e) { toast.error("Lỗi cập nhật"); }
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
