import React, { useState, useEffect, useMemo } from "react";
import { crmFirestore, crmRealtimeDB } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { toast } from "react-hot-toast";
import {
    Layout, Settings, Save,
    AlertTriangle, CheckCircle,
    Plus, Trash2, Globe, Zap, Edit2,
    UserCheck, Filter as FilterIcon, Link, Eye, Copy
} from "lucide-react";

const AdminLandings = () => {
    const [landings, setLandings] = useState([]);
    const [courses, setCourses] = useState([]);
    const [crmUsers, setCrmUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEditId, setActiveEditId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form State
    const [form, setForm] = useState({
        name: "",
        slug: "",
        active_source_key: "organic_web",
        is_maintenance: false,
        targetFunnel: "ADS",
        assignedSale: "Round Robin",
        zaloLink: ""
    });
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedK, setSelectedK] = useState("");

    const slugify = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');

    // Sync Data
    useEffect(() => {
        const unsubLandings = onSnapshot(collection(crmFirestore, "landing_pages"), (snap) => {
            setLandings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        getDocs(collection(crmFirestore, "courses_config")).then(snap => {
            setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const usersRef = ref(crmRealtimeDB, 'system_settings/users');
        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.values(data).filter(u => u.role === 'SALE' || u.role === 'ADMIN' || u.role === 'SALE_LEADER');
                setCrmUsers(list);
            }
        });

        return () => {
            unsubLandings();
            unsubUsers();
        };
    }, []);

    const currentCourse = useMemo(() => {
        if (!selectedCourseId) return null;
        return courses.find(c => String(c.id) === String(selectedCourseId) || slugify(c.name || "") === selectedCourseId);
    }, [courses, selectedCourseId]);

    const handleEdit = async (landing) => {
        setActiveEditId(landing.id);
        setShowCreateForm(true);

        const mappingRef = doc(crmFirestore, "source_configs", landing.active_source_key);
        const mappingSnap = await getDoc(mappingRef);
        const mappingData = mappingSnap.exists() ? mappingSnap.data() : {};

        setForm({
            ...landing,
            targetFunnel: mappingData.targetFunnel || "ADS",
            assignedSale: mappingData.assignedSale || "Round Robin",
            zaloLink: mappingData.targetZalo || landing.zaloLink || ""
        });

        const parts = landing.active_source_key.split('_');
        setSelectedCourseId(parts[0]);
        if (parts[1]) setSelectedK(parts[1].toUpperCase());
    };

    const handleAddNew = () => {
        setActiveEditId("new");
        setShowCreateForm(true);
        setForm({
            name: "",
            slug: "",
            active_source_key: "organic_web",
            is_maintenance: false,
            targetFunnel: "ADS",
            assignedSale: "Round Robin",
            zaloLink: ""
        });
        setSelectedCourseId("");
        setSelectedK("");
    };

    const handleCourseChange = (courseId) => {
        setSelectedCourseId(courseId);
        setSelectedK("");
        const course = courses.find(c => String(c.id) === String(courseId));
        const keyBase = course ? (course.id.length > 15 ? slugify(course.name) : course.id) : courseId;
        setForm(prev => ({ ...prev, active_source_key: keyBase }));
    };

    const handleKChange = (k) => {
        const kVal = k.toUpperCase();
        setSelectedK(kVal);
        if (selectedCourseId) {
            const course = courses.find(c => String(c.id) === String(selectedCourseId));
            const keyBase = course ? (course.id.length > 15 ? slugify(course.name) : course.id) : selectedCourseId;
            setForm(prev => ({ ...prev, active_source_key: `${keyBase}_${kVal.toLowerCase()}` }));
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.slug) return toast.error("Vui lòng nhập Tên và Link!");

        const id = activeEditId === "new" ? slugify(form.name) : activeEditId;
        const sourceKey = form.active_source_key;

        try {
            await setDoc(doc(crmFirestore, "landing_pages", id), {
                name: form.name,
                slug: form.slug,
                active_source_key: sourceKey,
                is_maintenance: form.is_maintenance,
                updatedAt: serverTimestamp()
            }, { merge: true });

            await setDoc(doc(crmFirestore, "source_configs", sourceKey), {
                id: sourceKey,
                source_name: form.name,
                targetCourseId: selectedCourseId,
                targetK: selectedK,
                targetFunnel: form.targetFunnel,
                assignedSale: form.assignedSale,
                targetZalo: form.zaloLink || "",
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast.success("Đã lưu Landing Page thành công!");
            setShowCreateForm(false);
            setActiveEditId(null);
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Xóa landing page này?")) {
            try {
                await deleteDoc(doc(crmFirestore, "landing_pages", id));
                toast.success("Đã xóa!");
            } catch (e) {
                toast.error("Lỗi xóa: " + e.message);
            }
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* LEFT SIDEBAR - CREATE/EDIT FORM */}
            <div className={`transition-all duration-300 ${showCreateForm ? 'w-[480px]' : 'w-0 overflow-hidden'}`}>
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-full overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Layout size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {activeEditId === "new" ? "Tạo Landing Page" : "Chỉnh sửa Landing"}
                                    </h2>
                                    <p className="text-xs text-indigo-100">Cấu hình đồng bộ Landing & CRM</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setShowCreateForm(false); setActiveEditId(null); }}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-500">
                                <Globe size={16} className="text-indigo-600" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Thông tin Landing</h3>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Tên Landing Page *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                                    placeholder="VD: TikTok Ads - K38"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Đường dẫn (Slug) *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-mono"
                                    placeholder="/dang-ky-khoa-hoc"
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">URL: https://maliedu.vn{form.slug}</p>
                            </div>
                        </div>

                        {/* Khóa học */}
                        <div className="space-y-4 bg-emerald-50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-emerald-500">
                                <CheckCircle size={16} className="text-emerald-600" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Tuyển sinh cho</h3>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Khóa học</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm font-medium cursor-pointer"
                                    value={selectedCourseId}
                                    onChange={(e) => handleCourseChange(e.target.value)}
                                >
                                    <option value="">-- Chọn khóa học --</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Khóa K</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm font-medium cursor-pointer disabled:opacity-50"
                                    value={selectedK}
                                    onChange={(e) => handleKChange(e.target.value)}
                                    disabled={!selectedCourseId}
                                >
                                    <option value="">-- Chọn K --</option>
                                    {currentCourse?.batches?.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Mã nguồn (Auto)</p>
                                    <p className="text-white font-mono font-bold">{form.active_source_key}</p>
                                </div>
                                <Zap size={20} className="text-amber-400" />
                            </div>
                        </div>

                        {/* CRM Config */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-500">
                                <UserCheck size={16} className="text-orange-600" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Phân phối Lead</h3>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Phễu Data</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium cursor-pointer"
                                    value={form.targetFunnel}
                                    onChange={e => setForm({ ...form, targetFunnel: e.target.value })}
                                >
                                    <option value="ADS">PHỄU ADS</option>
                                    <option value="LEADER">PHỄU TƯ VẤN (Leader)</option>
                                    <option value="BRAND">THƯƠNG HIỆU / ORGANIC</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Sale phụ trách</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium cursor-pointer"
                                    value={form.assignedSale}
                                    onChange={e => setForm({ ...form, assignedSale: e.target.value })}
                                >
                                    <option value="Round Robin">Chia Vòng Tròn (Auto)</option>
                                    {crmUsers.map(u => (
                                        <option key={u.email} value={u.name}>{u.name} ({u.team})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Link Zalo Group</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                                    placeholder="https://zalo.me/g/..."
                                    value={form.zaloLink || ""}
                                    onChange={e => setForm({ ...form, zaloLink: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Maintenance Toggle */}
                        <div className={`p-4 rounded-xl border-2 ${form.is_maintenance ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={20} className={form.is_maintenance ? 'text-red-600' : 'text-slate-400'} />
                                    <div>
                                        <p className="font-bold text-sm">Chế độ bảo trì</p>
                                        <p className="text-xs text-slate-500">Tắt đăng ký tạm thời</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setForm({ ...form, is_maintenance: !form.is_maintenance })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${form.is_maintenance ? 'bg-red-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${form.is_maintenance ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                        >
                            <Save size={18} />
                            {activeEditId === "new" ? "Tạo Landing Page" : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT CONTENT - LIST */}
            <div className="flex-1 overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Quản lý Landing Pages</h1>
                        <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các trang landing đồng bộ với CRM</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={20} />
                        Tạo mới
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {landings.map(landing => (
                        <div
                            key={landing.id}
                            className="bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-lg group"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                                        <Globe size={24} className="text-indigo-600" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${landing.is_maintenance ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {landing.is_maintenance ? '🔧 Bảo trì' : '✓ Hoạt động'}
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{landing.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mb-4 truncate">{landing.slug}</p>

                                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Mã nguồn</p>
                                    <p className="text-xs font-mono font-bold text-indigo-600">{landing.active_source_key}</p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(landing)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(landing.id)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {landings.length === 0 && (
                    <div className="text-center py-20">
                        <Globe size={64} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Chưa có Landing Page nào</h3>
                        <p className="text-slate-400 mb-6">Bắt đầu bằng cách tạo Landing Page đầu tiên</p>
                        <button
                            onClick={handleAddNew}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={20} />
                            Tạo Landing Page đầu tiên
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLandings;
