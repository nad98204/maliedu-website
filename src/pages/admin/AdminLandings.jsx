import React, { useState, useEffect } from "react";
import { crmFirestore, crmRealtimeDB } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { toast } from "react-hot-toast";
import { normalizeMetaCurrency } from "../../utils/metaPixel";
import {
    Layout, Settings, Save,
    AlertTriangle, CheckCircle,
    Plus, Trash2, Globe, Zap, Edit2,
    UserCheck, Filter as FilterIcon, Link, Eye, Copy,
    Users, TrendingUp, Search, Database, RefreshCw
} from "lucide-react";

const AdminLandings = () => {
    const [landings, setLandings] = useState([]);
    const [courses, setCourses] = useState([]);
    const [crmUsers, setCrmUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEditId, setActiveEditId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [form, setForm] = useState({
        name: "",
        slug: "",
        active_source_key: "organic_web",
        is_maintenance: false,
        targetFunnel: "ADS",
        funnel_type: "ads", // Mặc định là ads
        assignedSale: "Round Robin",
        zaloLink: "",
        fbPixel: "",
        fbCapiToken: "",
        fbCurrency: "VND",
        fbEventValue: "0",
        course_k: "K41"
    });
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedK, setSelectedK] = useState("");
    const [isQuickEditing, setIsQuickEditing] = useState(false);
    const [quickEditK, setQuickEditK] = useState("");

    const slugify = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');

    const refreshCrmData = async () => {
        setIsLoading(true);
        try {
            const snap = await getDocs(collection(crmFirestore, "courses_config"));
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(list);
            toast.success("Đã đồng bộ dữ liệu Khóa K từ CRM!");
        } catch (e) {
            toast.error("Lỗi đồng bộ: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Sync Data
    useEffect(() => {
        const unsubLandings = onSnapshot(collection(crmFirestore, "landing_pages"), (snap) => {
            setLandings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        refreshCrmData();

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

    // Manual Re-fetch when switching tabs (User Requirement)
    useEffect(() => {
        if (activeTab) {
            // Briefly show loading for transition
            setIsLoading(true);
            getDocs(collection(crmFirestore, "landing_pages")).then(snap => {
                setLandings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setIsLoading(false);
            }).catch(err => {
                console.error("Fetch Error:", err);
                setIsLoading(false);
            });
        }
    }, [activeTab]);

    const filteredLandings = landings.filter(l => {
        // Tab logic: "ALL" hiện mọi LP, các tab khác lọc theo funnel_type
        const landingFunnelType = l.funnel_type || (l.targetFunnel ? l.targetFunnel.toLowerCase() : "ads");
        const matchTab = activeTab === "ALL" || landingFunnelType === activeTab.toLowerCase();
        const matchSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.slug.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    const handleEdit = async (landing) => {
        setActiveEditId(landing.id);
        setShowCreateForm(true);

        const mappingRef = doc(crmFirestore, "source_configs", landing.active_source_key);
        const mappingSnap = await getDoc(mappingRef);
        const mappingData = mappingSnap.exists() ? mappingSnap.data() : {};

        setForm({
            ...landing,
            targetFunnel: landing.targetFunnel || mappingData.targetFunnel || "ADS",
            funnel_type: landing.funnel_type || (landing.targetFunnel ? landing.targetFunnel.toLowerCase() : "ads"),
            assignedSale: mappingData.assignedSale || "Round Robin",
            zaloLink: mappingData.targetZalo || landing.zaloLink || "",
            fbPixel: landing.fbPixel || "",
            fbCapiToken: landing.fbCapiToken || "",
            fbCurrency: landing.fbCurrency || "VND",
            fbEventValue: String(landing.fbEventValue ?? 0),
            course_k: landing.course_k || "K41"
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
            funnel_type: "ads",
            assignedSale: "Round Robin",
            zaloLink: "",
            fbPixel: "",
            fbCapiToken: "",
            fbCurrency: "VND",
            fbEventValue: "0",
            course_k: "K41"
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
        const fbCurrency = normalizeMetaCurrency(form.fbCurrency);
        const parsedEventValue = Number(String(form.fbEventValue ?? "").replace(",", "."));
        const fbEventValue = Number.isFinite(parsedEventValue) && parsedEventValue >= 0 ? parsedEventValue : 0;

        try {
            await setDoc(doc(crmFirestore, "landing_pages", id), {
                name: form.name,
                slug: form.slug,
                active_source_key: sourceKey,
                is_maintenance: form.is_maintenance,
                zaloLink: form.zaloLink || "",
                fbPixel: form.fbPixel || "",
                fbCapiToken: form.fbCapiToken || "",
                fbCurrency,
                fbEventValue,
                course_k: form.course_k || "",
                targetFunnel: (form.funnel_type || "ads").toUpperCase(), // Sync with funnel_type
                funnel_type: form.funnel_type || "ads",
                updatedAt: serverTimestamp()
            }, { merge: true });

            await setDoc(doc(crmFirestore, "source_configs", sourceKey), {
                id: sourceKey,
                source_name: form.name,
                targetCourseId: selectedCourseId,
                targetK: selectedK,
                targetFunnel: (form.funnel_type || "ads").toUpperCase(),
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

    const tabs = [
        { id: "ALL", label: "Tất cả", icon: Layout },
        { id: "ADS", label: "Phễu ADS", icon: TrendingUp, color: "indigo" },
        { id: "LEADER", label: "Phễu Leader", icon: Users, color: "emerald" },
        { id: "ORGANIC", label: "Web/Organic", icon: Globe, color: "amber" }
    ];

    const handleQuickEditKAll = async () => {
        if (!quickEditK) return toast.error("Vui lòng nhập Khóa K mới!");
        if (!window.confirm(`Bạn có chắc chắn muốn đổi TOÀN BỘ Landing Page trong Phễu Leader sang ${quickEditK}?`)) return;

        const leaderLandings = landings.filter(l => (l.funnel_type === "leader" || l.targetFunnel === "LEADER"));
        if (leaderLandings.length === 0) return toast.error("Không có Landing Page nào để cập nhật!");

        setIsLoading(true);
        try {
            const promises = leaderLandings.map(l => {
                return setDoc(doc(crmFirestore, "landing_pages", l.id), {
                    course_k: quickEditK,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });
            await Promise.all(promises);
            toast.success(`Đã cập nhật ${leaderLandings.length} landing pages sang ${quickEditK}`);
            setIsQuickEditing(false);
            setQuickEditK("");
        } catch (e) {
            toast.error("Lỗi cập nhật: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickEditSingleK = async (landingId, newK) => {
        try {
            await setDoc(doc(crmFirestore, "landing_pages", landingId), {
                course_k: newK,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast.success("Đã cập nhật!");
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        }
    };

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
                        <div className="space-y-4 bg-emerald-50 p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                                <Database size={48} className="text-emerald-300" />
                            </div>
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-emerald-500">
                                <CheckCircle size={16} className="text-emerald-600" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Tuyển sinh cho (Sync CRM)</h3>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Khóa học *</label>
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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-slate-600">Chọn Khóa K *</label>
                                    <button 
                                        onClick={refreshCrmData}
                                        className="text-[10px] flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold bg-white px-2 py-1 rounded-md border border-emerald-100 shadow-sm"
                                        title="Tải lại danh sách từ CRM"
                                    >
                                        <RefreshCw size={10} />
                                        Làm mới dữ liệu từ CRM
                                    </button>
                                </div>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm font-bold uppercase cursor-pointer"
                                    value={form.course_k}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setForm({ ...form, course_k: val });
                                        handleKChange(val);
                                    }}
                                >
                                    <option value="">-- Chọn Khóa K --</option>
                                    {(courses.find(c => String(c.id) === String(selectedCourseId))?.batches || []).map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-emerald-600 mt-1 font-medium italic">* Danh sách này được đồng bộ trực tiếp từ CRM</p>
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
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Phân loại Landing (Funnel) *</label>
                                <select
                                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white outline-none transition-all text-sm font-bold cursor-pointer ${
                                        form.funnel_type === 'leader' 
                                        ? 'border-emerald-500 ring-4 ring-emerald-100 text-emerald-700' 
                                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                                    }`}
                                    value={form.funnel_type || (form.targetFunnel ? form.targetFunnel.toLowerCase() : "ads")}
                                    onChange={e => setForm({ ...form, funnel_type: e.target.value, targetFunnel: e.target.value.toUpperCase() })}
                                >
                                    <option value="ads">⚡ Phễu ADS (Mặc định)</option>
                                    <option value="leader">⭐ Phễu LEADER (Cấu hình Riêng)</option>
                                    <option value="organic">🌐 Web / Organic</option>
                                </select>
                                {form.funnel_type === 'leader' && (
                                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-pulse">
                                        <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                                            💡 <strong>Gợi ý từ CRM:</strong> Landing này sẽ được đẩy về nhánh Leader. Hãy đảm bảo mục "Sale phụ trách" bên dưới đã chọn đúng Leader hoặc để "Chia Vòng Tròn" để phân phối tự động.
                                        </p>
                                    </div>
                                )}
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Mã Facebook Pixel (ID)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                                    placeholder="VD: 123456789012345"
                                    value={form.fbPixel || ""}
                                    onChange={e => setForm({ ...form, fbPixel: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Facebook Conversions API (Access Token)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                                    placeholder="Điền Meta Conversions API Access Token..."
                                    value={form.fbCapiToken || ""}
                                    onChange={e => setForm({ ...form, fbCapiToken: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Mã tiền tệ Meta</label>
                                    <input
                                        type="text"
                                        maxLength={3}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm uppercase"
                                        placeholder="VND"
                                        value={form.fbCurrency || ""}
                                        onChange={e => setForm({ ...form, fbCurrency: e.target.value.toUpperCase() })}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Mã 3 ký tự như `VND` hoặc `USD`.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Giá trị event</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                                        placeholder="0"
                                        value={form.fbEventValue ?? "0"}
                                        onChange={e => setForm({ ...form, fbEventValue: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Để `0` hoặc bỏ trống nếu không muốn gửi value cho Meta.</p>
                                </div>
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
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Quản lý Landing Pages</h1>
                        <p className="text-sm text-slate-500 mt-1">Đã cấu hình {landings.length} landing pages</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={20} />
                        Tạo mới
                    </button>
                </div>

                {/* Toolbar: Tabs & Search */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.id !== "ALL" && (
                                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                                        activeTab === tab.id ? 'bg-indigo-50 text-indigo-400' : 'bg-slate-200 text-slate-400'
                                    }`}>
                                        {landings.filter(l => {
                                            const lType = l.funnel_type || (l.targetFunnel ? l.targetFunnel.toLowerCase() : "ads");
                                            return lType === tab.id.toLowerCase();
                                        }).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm landing page..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl outline-none text-sm transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List View */}
                {activeTab === "LEADER" ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Users size={18} className="text-emerald-600" />
                                Danh sách Landing Phễu Leader
                            </h3>
                            <div className="flex items-center gap-2">
                                {isQuickEditing ? (
                                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-indigo-200 shadow-sm animate-in fade-in zoom-in duration-200">
                                        <input 
                                            type="text" 
                                            placeholder="Khóa K mới (VD: K42)"
                                            className="px-3 py-1.5 text-xs font-bold uppercase rounded-md border-none focus:ring-0 w-32"
                                            value={quickEditK}
                                            onChange={e => setQuickEditK(e.target.value.toUpperCase())}
                                        />
                                        <button 
                                            onClick={handleQuickEditKAll}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            Cập nhật tất cả
                                        </button>
                                        <button 
                                            onClick={() => setIsQuickEditing(false)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsQuickEditing(true)}
                                        className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                                    >
                                        <Edit2 size={14} />
                                        Sửa nhanh Khóa K
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Landing Page</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Khóa K</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Mã nguồn</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLandings.map(landing => (
                                        <tr key={landing.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{landing.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">maliedu.vn{landing.slug}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text"
                                                        value={landing.course_k || ""}
                                                        onChange={(e) => handleQuickEditSingleK(landing.id, e.target.value.toUpperCase())}
                                                        className="w-16 px-2 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 border-none rounded focus:ring-2 focus:ring-indigo-200 text-center"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {landing.active_source_key}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleEdit(landing)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Sửa chi tiết"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`https://maliedu.vn${landing.slug}`);
                                                            toast.success("Đã copy link!");
                                                        }}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Copy Link"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : filteredLandings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLandings.map(landing => (
                            <div
                                key={landing.id}
                                className="bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-lg group"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${
                                            landing.targetFunnel === "LEADER" ? 'bg-emerald-50 text-emerald-600' : 
                                            landing.targetFunnel === "BRAND" ? 'bg-amber-50 text-amber-600' : 
                                            'bg-indigo-50 text-indigo-600'
                                        }`}>
                                            <Globe size={24} />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${landing.is_maintenance ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {landing.is_maintenance ? '🔧 Bảo trì' : '✓ Hoạt động'}
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                                                landing.targetFunnel === "LEADER" ? 'bg-emerald-600 text-white' : 
                                                landing.targetFunnel === "BRAND" ? 'bg-amber-500 text-white' : 
                                                'bg-indigo-600 text-white'
                                            }`}>
                                                {landing.targetFunnel || "ADS"}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{landing.name}</h3>

                                    {/* URL Box - click to copy */}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`https://maliedu.vn${landing.slug}`);
                                            toast.success("Đã copy link!");
                                        }}
                                        className="w-full text-left mb-4 group/link"
                                        title="Click để copy link"
                                    >
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white hover:border-indigo-200 transition-colors">
                                            <Link size={12} className="text-slate-400 flex-shrink-0" />
                                            <p className="text-[11px] font-mono text-slate-600 truncate flex-1">maliedu.vn{landing.slug}</p>
                                            <Copy size={11} className="text-slate-300 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </div>
                                    </button>

                                    <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] text-slate-400 uppercase font-black">Khóa K</p>
                                            <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 rounded">{landing.course_k || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] text-slate-400 uppercase font-black">Mã nguồn</p>
                                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{landing.active_source_key}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(landing)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2 rounded-lg font-bold text-sm hover:bg-indigo-100 transition-colors"
                                        >
                                            <Edit2 size={14} />
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`https://maliedu.vn${landing.slug}`);
                                                toast.success("Đã copy link!");
                                            }}
                                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            title="Copy link"
                                        >
                                            <Copy size={14} />
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
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <Globe size={64} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Không tìm thấy Landing Page</h3>
                        <p className="text-slate-400 mb-6">Thử đổi tab hoặc từ khóa tìm kiếm nhé</p>
                        <button
                            onClick={() => {setActiveTab("ALL"); setSearchQuery("");}}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            Quay lại Tất cả
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLandings;
