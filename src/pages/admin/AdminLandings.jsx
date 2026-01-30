import React, { useState, useEffect, useMemo } from "react";
import { crmFirestore, crmRealtimeDB } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { toast } from "react-hot-toast";
import {
    Layout, Shield, Settings, Save,
    AlertTriangle, CheckCircle, GraduationCap,
    Plus, Trash2, Globe, ExternalLink, Zap, X,
    UserCheck, Filter as FilterIcon, Link
} from "lucide-react";

const AdminLandings = () => {
    const [landings, setLandings] = useState([]);
    const [courses, setCourses] = useState([]);
    const [crmUsers, setCrmUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEditId, setActiveEditId] = useState(null);

    // Form State for editing
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

    // 1. Sync Data from Firestore & RTDB
    useEffect(() => {
        // Listen to Landings
        const unsubLandings = onSnapshot(collection(crmFirestore, "landing_pages"), (snap) => {
            setLandings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        // Load Courses
        getDocs(collection(crmFirestore, "courses_config")).then(snap => {
            setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Load CRM Users (Sales) from Realtime DB
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

        // Fetch current mapping config from source_configs
        const mappingRef = doc(crmFirestore, "source_configs", landing.active_source_key);
        const mappingSnap = await getDoc(mappingRef);
        const mappingData = mappingSnap.exists() ? mappingSnap.data() : {};

        setForm({
            ...landing,
            targetFunnel: mappingData.targetFunnel || "ADS",
            assignedSale: mappingData.assignedSale || "Round Robin",
            zaloLink: mappingData.targetZalo || landing.zaloLink || ""
        });

        // Parse source key to select fields
        const parts = landing.active_source_key.split('_');
        setSelectedCourseId(parts[0]);
        if (parts[1]) setSelectedK(parts[1].toUpperCase());
    };

    const handleAddNew = () => {
        setActiveEditId("new");
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
            // 1. Save Landing Remote Config
            await setDoc(doc(crmFirestore, "landing_pages", id), {
                name: form.name,
                slug: form.slug,
                active_source_key: sourceKey,
                is_maintenance: form.is_maintenance,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // 2. Save CRM Mapping Config (THE MAGIC GỘP)
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

            toast.success("Đã đồng bộ hóa Landing & CRM thành công!");
            setActiveEditId(null);
        } catch (e) {
            toast.error("Lỗi đồng bộ: " + e.message);
        }
    };

    if (isLoading) return <div className="p-20 text-center text-slate-400 animate-pulse">Đang tối ưu hóa hệ thống vạn năng...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">HỆ THỐNG QUẢN LÝ TẬP TRUNG</h1>
                    <p className="text-sm text-slate-500 font-medium">Một nơi duy nhất để điều khiển Landing Page và phân phối Lead CRM</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all transform hover:scale-105"
                >
                    <Plus size={18} /> THÊM TRANG MỚI
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List of Landings */}
                <div className="lg:col-span-1 space-y-4">
                    {landings.map(landing => (
                        <div
                            key={landing.id}
                            onClick={() => handleEdit(landing)}
                            className={`p-5 rounded-3xl border-2 cursor-pointer transition-all group ${activeEditId === landing.id ? 'border-indigo-500 bg-indigo-50/30 shadow-indigo-100 shadow-xl' : 'border-white bg-white hover:border-slate-200 shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Globe size={18} />
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${landing.is_maintenance ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {landing.is_maintenance ? 'BẢO TRÌ' : 'ĐANG CHẠY'}
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase text-sm">{landing.name}</h3>
                            <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{landing.slug}</p>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mã nguồn (Mapping)</span>
                                    <span className="text-xs font-bold text-indigo-600 font-mono tracking-tighter">{landing.active_source_key}</span>
                                </div>
                                <Trash2
                                    size={14}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm("Xóa cấu hình trang này?")) deleteDoc(doc(crmFirestore, "landing_pages", landing.id));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Unified Edit Form */}
                <div className="lg:col-span-2">
                    {activeEditId ? (
                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden sticky top-8">
                            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                        <Settings size={20} />
                                    </div>
                                    <h2 className="font-black text-slate-800 uppercase tracking-tight">Cấu hình Độc Bản</h2>
                                </div>
                                <button onClick={() => setActiveEditId(null)} className="p-2 hover:bg-white rounded-full"><X size={20} /></button>
                            </div>

                            <div className="p-8 space-y-10">
                                {/* PHẦN 1: THÔNG TIN TRANG */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest border-l-4 border-indigo-500 pl-3">
                                        I. THÔNG TIN TRANG & LINK
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Tên Gắn CRM</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                                placeholder="VD: TikTok Ads - K38"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Đường dẫn (Slug)</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 font-mono focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                                placeholder="/dang-ky"
                                                value={form.slug}
                                                onChange={e => setForm({ ...form, slug: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* PHẦN 2: CHỈ ĐỊNH KHÓA HỌC */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest border-l-4 border-emerald-500 pl-3">
                                        II. TUYỂN SINH CHO KHÓA HỌC
                                    </div>
                                    <div className="bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase">Khóa học Đích</p>
                                                <select
                                                    className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-900 outline-none focus:ring-4 focus:ring-emerald-200 transition-all cursor-pointer"
                                                    value={selectedCourseId}
                                                    onChange={(e) => handleCourseChange(e.target.value)}
                                                >
                                                    <option value="">-- Chọn Khóa học --</option>
                                                    {courses.map(course => (
                                                        <option key={course.id} value={course.id}>{course.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase">Khóa K cụ thể</p>
                                                <select
                                                    className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-900 outline-none focus:ring-4 focus:ring-emerald-200 transition-all cursor-pointer"
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
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-emerald-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mã Vạn Năng (Auto-Generated)</label>
                                            <div className="bg-slate-900 rounded-2xl px-6 py-3 flex justify-between items-center group">
                                                <span className="text-white font-mono text-xl font-bold">{form.active_source_key}</span>
                                                <Zap size={20} className="text-amber-400 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* PHẦN 3: PHÂN PHỐI LEAD CRM */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest border-l-4 border-orange-500 pl-3">
                                        III. PHÂN PHỐI LEAD & CRM (QUAN TRỌNG)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-2 uppercase">
                                                <FilterIcon size={14} /> Phễu Data (Funnel)
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                value={form.targetFunnel}
                                                onChange={e => setForm({ ...form, targetFunnel: e.target.value })}
                                            >
                                                <option value="ADS">PHỄU ADS (Mặc định)</option>
                                                <option value="LEADER">PHỄU TƯ VẤN (Leader)</option>
                                                <option value="BRAND">THƯƠNG HIỆU / ORGANIC</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-2 uppercase">
                                                <UserCheck size={14} /> Sale phụ trách
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                value={form.assignedSale}
                                                onChange={e => setForm({ ...form, assignedSale: e.target.value })}
                                            >
                                                <option value="Round Robin">Chia Vòng Tròn (Mặc định)</option>
                                                {crmUsers.map(u => (
                                                    <option key={u.email} value={u.name}>{u.name} ({u.team})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-2 uppercase">
                                                <Link size={14} /> Link Zalo Group tham gia
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white outline-none"
                                                placeholder="https://zalo.me/g/..."
                                                value={form.zaloLink || ""}
                                                onChange={e => setForm({ ...form, zaloLink: e.target.value })}
                                            />
                                            <p className="text-[10px] text-slate-400 ml-1 italic">* Lead về CRM sẽ tự động hiển thị link này để Sale gửi cho khách.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* PHẦN 4: BẢO TRÌ */}
                                <div className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between ${form.is_maintenance ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${form.is_maintenance ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'}`}>
                                            {form.is_maintenance ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm uppercase">Chế độ bảo trì</p>
                                            <p className="text-[10px] text-slate-500">Khi bật, khách không thể đăng ký tại trang này.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setForm({ ...form, is_maintenance: !form.is_maintenance })}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${form.is_maintenance ? 'bg-red-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${form.is_maintenance ? 'translate-x-8' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="pt-6 border-t flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        className="bg-slate-900 text-white px-12 py-4 rounded-3xl font-black uppercase text-sm shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-2 scale-105"
                                    >
                                        <Save size={18} /> LƯU CẤU HÌNH HỢP NHẤT
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] border-4 border-dashed border-slate-100 rounded-[50px] flex flex-col items-center justify-center text-slate-300 p-10">
                            <Zap size={60} className="mb-4 opacity-10 animate-pulse text-indigo-500" />
                            <h3 className="text-xl font-black uppercase opacity-20">Bộ điều khiển siêu cấp</h3>
                            <p className="text-xs font-medium opacity-20 mt-2 text-center max-w-xs">Chọn 1 trang để bắt đầu cấu hình đồng thời cho cả Landing và CRM</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLandings;
