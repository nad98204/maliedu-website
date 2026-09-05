import React, { useEffect, useState } from "react";
import {
    Award,
    Banknote,
    Check,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Edit3,
    ExternalLink,
    Filter,
    HelpCircle,
    Loader2,
    Lock,
    Percent,
    PieChart,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Tag,
    Trash2,
    TrendingUp,
    Unlock,
    UserCheck,
    Users,
    Wallet,
    X,
    XCircle,
    Headphones,
    BookOpen
} from "lucide-react";
import toast from "react-hot-toast";

import { collection, doc, getDocs, updateDoc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { INITIAL_TRACKS } from "../../data/hypnosisTracksData";
import {
    getAllAffiliates,
    getAllCommissions,
    getAllPayoutRequests,
    getAdminAffiliateSettings,
    processPayoutStatus,
    saveAffiliateSettings,
    updateAffiliateByAdmin
} from "../../utils/affiliateService";
import { formatPrice } from "../../utils/orderService";

const formatAffiliateDate = (value) => {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString("vi-VN") : "Gần đây";
};

const AdminAffiliates = () => {
    const [activeTab, setActiveTab] = useState("settings"); // settings | affiliates | payouts | commissions
    const [loading, setLoading] = useState(true);

    // Data states
    const [settings, setSettings] = useState({
        defaultCommissionPercent: 30,
        cookieDurationDays: 30,
        minPayoutAmount: 200000,
        autoApproveAffiliate: true,
        payoutTerms: "Hoa hồng được đối soát và thanh toán linh hoạt khi đạt số dư tối thiểu.",
    });
    const [isForeverCookie, setIsForeverCookie] = useState(false);

    const [affiliates, setAffiliates] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [courseRates, setCourseRates] = useState({});
    const [savingCourseId, setSavingCourseId] = useState(null);
    const [isSavingAllCourses, setIsSavingAllCourses] = useState(false);

    // Hypnosis tracks commission states
    const [hypnosisTracks, setHypnosisTracks] = useState([]);
    const [hypnosisConfig, setHypnosisConfig] = useState({});
    const [savingHypnosisId, setSavingHypnosisId] = useState(null);
    const [isSavingAllHypnosis, setIsSavingAllHypnosis] = useState(false);
    const [commissionProductTab, setCommissionProductTab] = useState("courses"); // "courses" | "hypnosis"

    // Search and filters
    const [searchQuery, setSearchQuery] = useState("");
    const [payoutStatusFilter, setPayoutStatusFilter] = useState("all");

    // Edit Affiliate Modal
    const [selectedAffiliate, setSelectedAffiliate] = useState(null);
    const [editCommissionPercent, setEditCommissionPercent] = useState("");
    const [editCouponCode, setEditCouponCode] = useState("");
    const [editCouponDiscount, setEditCouponDiscount] = useState("");
    const [editStatus, setEditStatus] = useState("active");
    const [isSavingAffiliate, setIsSavingAffiliate] = useState(false);

    // VietQR Modal
    const [qrPayout, setQrPayout] = useState(null);

    // Action Payout Modal
    const [actionPayout, setActionPayout] = useState(null);
    const [payoutActionType, setPayoutActionType] = useState("completed"); // completed | rejected
    const [payoutAdminNote, setPayoutAdminNote] = useState("");
    const [payoutTransactionRef, setPayoutTransactionRef] = useState("");
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);

    // Load all data
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [sett, affList, payList, commList, coursesSnap, hypnosisSnap] = await Promise.all([
                getAdminAffiliateSettings(),
                getAllAffiliates(),
                getAllPayoutRequests(),
                getAllCommissions(),
                getDocs(collection(db, "courses")),
                getDocs(collection(db, "hypnosis_audios"))
            ]);

            setSettings(sett);
            setIsForeverCookie(Number(sett.cookieDurationDays) === 0);
            setAffiliates(affList);
            setPayouts(payList);
            setCommissions(commList);

            const courseList = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(courseList);

            const initialRates = {};
            courseList.forEach(c => {
                initialRates[c.id] = c.affiliateCommissionPercent != null ? String(c.affiliateCommissionPercent) : "";
            });
            setCourseRates(initialRates);

            let hypList = [];
            if (!hypnosisSnap.empty) {
                hypList = hypnosisSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            } else {
                hypList = [...INITIAL_TRACKS];
            }
            const paidHypList = hypList.filter(t => !t.isFree);
            setHypnosisTracks(paidHypList);

            const initialHypConfig = {};
            paidHypList.forEach(t => {
                initialHypConfig[t.id] = {
                    isEnabled: t.isAffiliateEnabled !== false,
                    type: t.affiliateCommissionType || 'percent',
                    percent: t.affiliateCommissionPercent != null ? String(t.affiliateCommissionPercent) : "",
                    amount: t.affiliateCommissionAmount != null ? String(t.affiliateCommissionAmount) : "",
                    buyerDiscount: t.affiliateBuyerDiscountPercent != null ? String(t.affiliateBuyerDiscountPercent) : "",
                };
            });
            setHypnosisConfig(initialHypConfig);
        } catch (error) {
            console.error("Error loading affiliate admin data:", error);
            toast.error("Không thể tải dữ liệu Affiliate.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Save Settings
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const updated = {
                ...settings,
                defaultCommissionPercent: Number(settings.defaultCommissionPercent),
                cookieDurationDays: isForeverCookie ? 0 : Number(settings.cookieDurationDays),
                minPayoutAmount: Number(settings.minPayoutAmount),
            };
            const saved = await saveAffiliateSettings(updated);
            setSettings(saved);
            setIsForeverCookie(saved.cookieDurationDays === 0);
            toast.success("Đã lưu cài đặt Affiliate thành công!");
        } catch {
            toast.error("Lỗi khi lưu cài đặt.");
        }
    };

    // Save single course rate
    const handleSaveCourseRate = async (courseId) => {
        setSavingCourseId(courseId);
        try {
            const rawRate = courseRates[courseId];
            const parsedRate = rawRate !== "" && rawRate != null ? Number(rawRate) : null;
            await updateDoc(doc(db, "courses", courseId), {
                affiliateCommissionPercent: parsedRate,
                updatedAt: Date.now()
            });
            toast.success("Đã lưu % hoa hồng cho khóa học!");
        } catch (error) {
            console.error("Error saving course commission rate:", error);
            toast.error("Lỗi khi lưu tỷ lệ hoa hồng khóa học.");
        } finally {
            setSavingCourseId(null);
        }
    };

    // Save all course rates
    const handleSaveAllCourseRates = async () => {
        setIsSavingAllCourses(true);
        try {
            const batch = writeBatch(db);
            courses.forEach(c => {
                const rawRate = courseRates[c.id];
                const parsedRate = rawRate !== "" && rawRate != null ? Number(rawRate) : null;
                batch.update(doc(db, "courses", c.id), {
                    affiliateCommissionPercent: parsedRate,
                    updatedAt: Date.now()
                });
            });
            await batch.commit();
            toast.success("Đã cập nhật tỷ lệ hoa hồng cho toàn bộ khóa học!");
        } catch (error) {
            console.error("Error saving all course commission rates:", error);
            toast.error("Lỗi khi cập nhật danh sách khóa học.");
        } finally {
            setIsSavingAllCourses(false);
        }
    };

    // Save single hypnosis rate
    const handleSaveHypnosisRate = async (trackId) => {
        setSavingHypnosisId(trackId);
        try {
            const conf = hypnosisConfig[trackId] || {};
            const isEnabled = Boolean(conf.isEnabled);
            const type = conf.type || 'percent';
            const parsedPercent = conf.percent !== "" && conf.percent != null ? Number(conf.percent) : null;
            const parsedAmount = conf.amount !== "" && conf.amount != null ? Number(String(conf.amount).replace(/\D/g, '')) : null;
            const parsedBuyerDiscount = conf.buyerDiscount !== "" && conf.buyerDiscount != null ? Number(conf.buyerDiscount) : null;

            await setDoc(doc(db, "hypnosis_audios", trackId), {
                isAffiliateEnabled: isEnabled,
                affiliateCommissionType: type,
                affiliateCommissionPercent: parsedPercent,
                affiliateCommissionAmount: parsedAmount,
                affiliateBuyerDiscountPercent: parsedBuyerDiscount,
                updatedAt: Date.now()
            }, { merge: true });
            toast.success("Đã lưu cấu hình Affiliate cho bản thôi miên!");
        } catch (error) {
            console.error("Error saving hypnosis commission config:", error);
            toast.error("Lỗi khi lưu cấu hình Affiliate thôi miên.");
        } finally {
            setSavingHypnosisId(null);
        }
    };

    // Save all hypnosis rates
    const handleSaveAllHypnosisRates = async () => {
        setIsSavingAllHypnosis(true);
        try {
            const batch = writeBatch(db);
            hypnosisTracks.forEach(t => {
                const conf = hypnosisConfig[t.id] || {};
                const isEnabled = Boolean(conf.isEnabled);
                const type = conf.type || 'percent';
                const parsedPercent = conf.percent !== "" && conf.percent != null ? Number(conf.percent) : null;
                const parsedAmount = conf.amount !== "" && conf.amount != null ? Number(String(conf.amount).replace(/\D/g, '')) : null;
                const parsedBuyerDiscount = conf.buyerDiscount !== "" && conf.buyerDiscount != null ? Number(conf.buyerDiscount) : null;

                batch.set(doc(db, "hypnosis_audios", t.id), {
                    isAffiliateEnabled: isEnabled,
                    affiliateCommissionType: type,
                    affiliateCommissionPercent: parsedPercent,
                    affiliateCommissionAmount: parsedAmount,
                    affiliateBuyerDiscountPercent: parsedBuyerDiscount,
                    updatedAt: Date.now()
                }, { merge: true });
            });
            await batch.commit();
            toast.success("Đã cập nhật toàn bộ cấu hình Affiliate thôi miên!");
        } catch (error) {
            console.error("Error saving all hypnosis commission configs:", error);
            toast.error("Lỗi khi cập nhật danh sách thôi miên.");
        } finally {
            setIsSavingAllHypnosis(false);
        }
    };

    // Open Edit Affiliate Modal
    const handleOpenEditAffiliate = (aff) => {
        setSelectedAffiliate(aff);
        setEditCommissionPercent(aff.customCommissionPercent != null ? String(aff.customCommissionPercent) : "");
        setEditCouponCode(aff.couponCode || "");
        setEditCouponDiscount(String(aff.couponDiscountPercent ?? 10));
        setEditStatus(aff.status === "suspended" ? "paused" : (aff.status || "active"));
    };

    // Save Edit Affiliate
    const handleSaveAffiliate = async (e) => {
        e.preventDefault();
        if (!selectedAffiliate) return;

        setIsSavingAffiliate(true);
        try {
            const updatePayload = {
                customCommissionPercent: editCommissionPercent !== "" ? Number(editCommissionPercent) : null,
                couponCode: editCouponCode.trim().toUpperCase(),
                couponDiscountPercent: editCouponDiscount === "" ? 10 : Number(editCouponDiscount),
                status: editStatus,
            };
            await updateAffiliateByAdmin(selectedAffiliate.id, updatePayload);
            toast.success(`Đã cập nhật CTV ${selectedAffiliate.affiliateCode}`);
            setSelectedAffiliate(null);
            await loadAllData();
        } catch (error) {
            toast.error(error.message || "Lỗi khi cập nhật CTV.");
        } finally {
            setIsSavingAffiliate(false);
        }
    };

    // Process Payout (Approve / Reject)
    const handleProcessPayout = async (e) => {
        e.preventDefault();
        if (!actionPayout) return;

        setIsProcessingPayout(true);
        try {
            await processPayoutStatus(actionPayout.id, payoutActionType, {
                adminNote: payoutAdminNote,
                transactionRef: payoutTransactionRef,
            });
            toast.success(payoutActionType === "completed" ? "Đã duyệt và đánh dấu thanh toán!" : "Đã từ chối yêu cầu và hoàn lại số dư!");
            setActionPayout(null);
            setPayoutAdminNote("");
            setPayoutTransactionRef("");
            await loadAllData();
        } catch (error) {
            toast.error(error.message || "Lỗi khi xử lý yêu cầu rút tiền.");
        } finally {
            setIsProcessingPayout(false);
        }
    };

    // Filtered Affiliates
    const filteredAffiliates = affiliates.filter((a) => {
        const query = searchQuery.toLowerCase();
        return (
            (a.name || "").toLowerCase().includes(query) ||
            (a.email || "").toLowerCase().includes(query) ||
            (a.affiliateCode || "").toLowerCase().includes(query) ||
            (a.couponCode || "").toLowerCase().includes(query)
        );
    });

    // Filtered Payouts
    const filteredPayouts = payouts.filter((p) => {
        if (payoutStatusFilter !== "all" && p.status !== payoutStatusFilter) return false;
        const query = searchQuery.toLowerCase();
        return (
            (p.affiliateName || "").toLowerCase().includes(query) ||
            (p.affiliateCode || "").toLowerCase().includes(query) ||
            (p.bankInfo?.accountNumber || "").includes(query)
        );
    });

    // Overview metrics
    const totalAffiliateRevenue = affiliates.reduce((sum, a) => sum + (a.stats?.totalRevenue || 0), 0);
    const totalAffiliateCommission = affiliates.reduce((sum, a) => sum + (a.stats?.totalCommission || 0), 0);
    const pendingPayoutCount = payouts.filter(p => p.status === "pending").length;

    // Helper generate VietQR image URL
    const getVietQrUrl = (bankName, accNumber, accHolder, amount, memo) => {
        const cleanAcc = String(accNumber || "").replace(/\s/g, "");
        // Map common bank short names to VietQR bank code
        const bankMap = {
            "techcombank": "TCB",
            "vietcombank": "VCB",
            "mb bank": "MB",
            "mbbank": "MB",
            "acb": "ACB",
            "vietinbank": "ICB",
            "bidv": "BIDV",
            "tpbank": "TPB",
            "vpbank": "VPB",
            "vib": "VIB",
            "sacombank": "STB",
            "agribank": "VBA",
        };
        const normalizedBank = (bankName || "").toLowerCase().trim();
        let bankCode = null;
        for (const [key, code] of Object.entries(bankMap)) {
            if (normalizedBank.includes(key)) {
                bankCode = code;
                break;
            }
        }

        // Never silently substitute a different recipient bank or alter its account number.
        if (!bankCode || !/^[0-9]{5,40}$/.test(cleanAcc)) return null;

        const encodedHolder = encodeURIComponent(accHolder || "");
        const encodedMemo = encodeURIComponent(memo || "Thanh toan hoa hong MaliEdu");
        return `https://img.vietqr.io/image/${bankCode}-${cleanAcc}-compact2.png?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedHolder}`;
    };

    const payoutQrUrl = qrPayout ? getVietQrUrl(
        qrPayout.bankInfo?.bankName,
        qrPayout.bankInfo?.accountNumber,
        qrPayout.bankInfo?.accountHolder,
        qrPayout.amount,
        `Hoa hong ${qrPayout.affiliateCode}`,
    ) : null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#9B2528] mb-1">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span>Quản Lý Doanh Thu & Đối Tác</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Tiếp Thị Liên Kết (Affiliate)
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={loadAllData}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Làm mới</span>
                    </button>
                    <a
                        href="/affiliate"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Xem trang CTV</span>
                    </a>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Tổng số CTV</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Users className="w-4 h-4" /></div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">{affiliates.length}</div>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">Đối tác đang hoạt động</p>
                </div>

                <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Doanh thu qua CTV</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="w-4 h-4" /></div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-700">{formatPrice(totalAffiliateRevenue)}</div>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">Từ các đơn hàng giới thiệu</p>
                </div>

                <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Hoa hồng phát sinh</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><DollarSign className="w-4 h-4" /></div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#9B2528]">{formatPrice(totalAffiliateCommission)}</div>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">Tổng hoa hồng các CTV nhận</p>
                </div>

                <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Chờ rút tiền</span>
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600"><Clock className="w-4 h-4" /></div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-rose-600">{pendingPayoutCount} yêu cầu</div>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">Cần admin duyệt thanh toán</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                        activeTab === "settings"
                            ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    <span>1. Cài đặt hoa hồng & Cookie</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("affiliates")}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                        activeTab === "affiliates"
                            ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>2. Danh sách CTV ({affiliates.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("payouts")}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 relative ${
                        activeTab === "payouts"
                            ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>3. Yêu cầu rút tiền ({payouts.length})</span>
                    {pendingPayoutCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("commissions")}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                        activeTab === "commissions"
                            ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                >
                    <DollarSign className="w-4 h-4" />
                    <span>4. Lịch sử đơn hàng ({commissions.length})</span>
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#9B2528] mx-auto" />
                    <p className="mt-3 text-xs font-bold text-slate-500">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <>
                    {/* TAB 1: CÀI ĐẶT HỆ THỐNG */}
                    {activeTab === "settings" && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-[#9B2528]" />
                                    Cài Đặt Chính Sách Hoa Hồng & Lưu Nhớ (Tracking)
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    Điều chỉnh các thông số áp dụng mặc định cho toàn bộ hệ thống Affiliate Mali Edu
                                </p>
                            </div>

                            <form onSubmit={handleSaveSettings} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Mức hoa hồng mặc định */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                            Mức hoa hồng mặc định (%) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="100"
                                                value={settings.defaultCommissionPercent}
                                                onChange={(e) => setSettings({ ...settings, defaultCommissionPercent: e.target.value })}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 font-black text-slate-900 text-lg outline-none focus:border-[#9B2528]"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Áp dụng cho mọi CTV trừ khi CTV đó được đặt tỷ lệ VIP riêng.</p>
                                    </div>

                                    {/* Số tiền rút tối thiểu */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                            Số tiền rút tối thiểu (VNĐ) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="50000"
                                            step="10000"
                                            value={settings.minPayoutAmount}
                                            onChange={(e) => setSettings({ ...settings, minPayoutAmount: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 font-black text-slate-900 text-lg outline-none focus:border-[#9B2528]"
                                        />
                                        <p className="text-[11px] text-slate-400">Số dư ví tối thiểu để CTV có thể tạo lệnh rút tiền.</p>
                                    </div>
                                </div>

                                {/* Thời hạn lưu Cookie */}
                                <div className="space-y-3 border-t border-slate-100 pt-5">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                        Thời hạn lưu nhớ giới thiệu (Cookie Duration)
                                    </label>
                                    
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800">
                                            <input
                                                type="checkbox"
                                                checked={isForeverCookie}
                                                onChange={(e) => setIsForeverCookie(e.target.checked)}
                                                className="h-5 w-5 rounded text-[#9B2528] focus:ring-[#9B2528]"
                                            />
                                            <span>✨ Vĩnh viễn (Forever - Ghi nhớ trọn đời)</span>
                                        </label>

                                        {!isForeverCookie && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={settings.cookieDurationDays}
                                                    onChange={(e) => setSettings({ ...settings, cookieDurationDays: e.target.value })}
                                                    className="w-24 h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 text-center outline-none focus:border-[#9B2528]"
                                                />
                                                <span className="text-xs font-bold text-slate-600">ngày</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        {isForeverCookie 
                                            ? "Khách bấm qua link ref sẽ gắn liền với CTV vĩnh viễn đến khi họ mua hàng (hoặc bấm link CTV khác)."
                                            : `Khách bấm qua link ref sẽ được tính hoa hồng nếu mua hàng trong vòng ${settings.cookieDurationDays} ngày.`}
                                    </p>
                                </div>

                                {/* Tự động duyệt */}
                                <div className="border-t border-slate-100 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoApproveAffiliate}
                                            onChange={(e) => setSettings({ ...settings, autoApproveAffiliate: e.target.checked })}
                                            className="h-5 w-5 rounded text-[#9B2528] focus:ring-[#9B2528]"
                                        />
                                        <span>Tự động kích hoạt tài khoản CTV ngay khi học viên đăng ký</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="px-8 py-3.5 rounded-2xl bg-[#9B2528] text-white font-black text-sm shadow-md hover:bg-[#7E1E21] transition-all flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Lưu Cài Đặt Hệ Thống</span>
                                </button>
                            </form>
                        </div>

                        {/* Product-Specific Affiliate Commissions */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            {/* Sub-tab switcher */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Percent className="w-5 h-5 text-[#9B2528]" />
                                        Cài Đặt % Hoa Hồng Riêng Cho Từng Sản Phẩm
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        Bạn có thể đặt % hoa hồng riêng cho từng khóa học hoặc bài thôi miên. Nếu để trống sẽ tự động áp dụng mức hoa hồng mặc định ({settings.defaultCommissionPercent}%).
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setCommissionProductTab("courses")}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                            commissionProductTab === "courses"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5 text-[#9B2528]" />
                                        Khóa học ({courses.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommissionProductTab("hypnosis")}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                            commissionProductTab === "hypnosis"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        <Headphones className="w-3.5 h-3.5 text-purple-600" />
                                        Bản Thôi Miên ({hypnosisTracks.length})
                                    </button>
                                </div>
                            </div>

                            {/* TAB: COURSES */}
                            {commissionProductTab === "courses" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">
                                            Danh sách khóa học trực tuyến ({courses.length})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleSaveAllCourseRates}
                                            disabled={isSavingAllCourses || courses.length === 0}
                                            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                                        >
                                            {isSavingAllCourses ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Đang lưu...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Lưu Tất Cả Khóa Học</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                    <th className="pb-3">Khóa học</th>
                                                    <th className="pb-3">Giá bán</th>
                                                    <th className="pb-3 w-48">% Hoa hồng riêng</th>
                                                    <th className="pb-3">Hoa hồng ước tính</th>
                                                    <th className="pb-3 text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                                {courses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                                                            Đang tải danh sách khóa học...
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    courses.map((course) => {
                                                        const currentVal = courseRates[course.id] ?? "";
                                                        const effectivePercent = currentVal !== "" ? Number(currentVal) : Number(settings.defaultCommissionPercent || 30);
                                                        const coursePrice = Number(course.price || 0);
                                                        const estComm = Math.round((coursePrice * effectivePercent) / 100);
                                                        const isSavingThis = savingCourseId === course.id;

                                                        return (
                                                            <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                                                                <td className="py-3.5 pr-4">
                                                                    <div className="font-black text-slate-900">{course.name}</div>
                                                                    <div className="text-[11px] text-slate-400 font-normal">{course.slug}</div>
                                                                </td>
                                                                <td className="py-3.5 pr-4 text-slate-600">
                                                                    {formatPrice(coursePrice)}
                                                                </td>
                                                                <td className="py-3.5 pr-4">
                                                                    <div className="relative flex items-center max-w-[140px]">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={courseRates[course.id] ?? ""}
                                                                            onChange={(e) => setCourseRates({
                                                                                ...courseRates,
                                                                                [course.id]: e.target.value
                                                                            })}
                                                                            placeholder={`Mặc định (${settings.defaultCommissionPercent}%)`}
                                                                            className="w-full h-9 px-3 pr-7 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                                                        />
                                                                        <span className="absolute right-2.5 text-slate-400 font-bold text-xs">%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3.5 pr-4">
                                                                    <span className="text-emerald-700 font-black">
                                                                        {formatPrice(estComm)}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400 ml-1 font-normal">
                                                                        ({effectivePercent}%)
                                                                    </span>
                                                                </td>
                                                                <td className="py-3.5 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveCourseRate(course.id)}
                                                                        disabled={isSavingThis}
                                                                        className="px-3.5 py-1.5 rounded-lg bg-red-50 text-[#9B2528] hover:bg-[#9B2528] hover:text-white font-black text-xs transition-colors border border-red-200/80 disabled:opacity-50 inline-flex items-center gap-1"
                                                                    >
                                                                        {isSavingThis ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Check className="w-3 h-3" />
                                                                        )}
                                                                        <span>Lưu</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB: HYPNOSIS */}
                            {commissionProductTab === "hypnosis" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">
                                            Danh sách bài thôi miên có tính phí ({hypnosisTracks.length})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleSaveAllHypnosisRates}
                                            disabled={isSavingAllHypnosis || hypnosisTracks.length === 0}
                                            className="px-4 py-2 rounded-xl bg-purple-900 text-white font-black text-xs hover:bg-purple-800 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                                        >
                                            {isSavingAllHypnosis ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Đang lưu...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Lưu Tất Cả Thôi Miên</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                    <th className="pb-3">Bản thôi miên</th>
                                                    <th className="pb-3">Giá bán</th>
                                                    <th className="pb-3 text-center">Bật Affiliate</th>
                                                    <th className="pb-3 w-56">Hoa hồng CTV</th>
                                                    <th className="pb-3 w-32">Voucher khách</th>
                                                    <th className="pb-3">Hoa hồng ước tính</th>
                                                    <th className="pb-3 text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                                {hypnosisTracks.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                                                            Không có bài thôi miên nào hoặc đang tải...
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    hypnosisTracks.map((track) => {
                                                        const conf = hypnosisConfig[track.id] || {
                                                            isEnabled: track.isAffiliateEnabled !== false,
                                                            type: track.affiliateCommissionType || 'percent',
                                                            percent: track.affiliateCommissionPercent != null ? String(track.affiliateCommissionPercent) : "",
                                                            amount: track.affiliateCommissionAmount != null ? String(track.affiliateCommissionAmount) : "",
                                                            buyerDiscount: track.affiliateBuyerDiscountPercent != null ? String(track.affiliateBuyerDiscountPercent) : "",
                                                        };
                                                        const isEnabled = conf.isEnabled !== false;
                                                        const type = conf.type || 'percent';
                                                        const rawPrice = track.price;
                                                        const trackPrice = typeof rawPrice === 'number' ? rawPrice : (Number(String(rawPrice || 0).replace(/\D/g, '')) || 0);

                                                        let estComm = 0;
                                                        let estCommText = "";
                                                        if (!isEnabled) {
                                                            estCommText = "Đang tắt";
                                                        } else if (type === 'fixed') {
                                                            estComm = conf.amount !== "" ? Number(String(conf.amount).replace(/\D/g, '')) : 0;
                                                            estCommText = formatPrice(estComm);
                                                        } else {
                                                            const effectivePercent = conf.percent !== "" ? Number(conf.percent) : Number(settings.defaultCommissionPercent || 30);
                                                            estComm = Math.round((trackPrice * effectivePercent) / 100);
                                                            estCommText = `${formatPrice(estComm)} (${effectivePercent}%)`;
                                                        }

                                                        const isSavingThis = savingHypnosisId === track.id;

                                                        return (
                                                            <tr key={track.id} className={`transition-colors ${isEnabled ? 'hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-60'}`}>
                                                                {/* 1. Track Info */}
                                                                <td className="py-3.5 pr-4">
                                                                    <div className="flex items-center gap-3">
                                                                        {(track.coverImage || track.coverImageSquare) && (
                                                                            <img
                                                                                src={track.coverImageSquare || track.coverImage}
                                                                                alt={track.title}
                                                                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                                                                            />
                                                                        )}
                                                                        <div>
                                                                            <div className="font-black text-slate-900">{track.title}</div>
                                                                            <div className="text-[11px] text-slate-400 font-normal">
                                                                                {track.segment || track.category} {track.author ? `• ${track.author}` : ''}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* 2. Price */}
                                                                <td className="py-3.5 pr-4 text-slate-600">
                                                                    {formatPrice(trackPrice)}
                                                                </td>

                                                                {/* 3. Enable Toggle */}
                                                                <td className="py-3.5 pr-4 text-center">
                                                                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isEnabled}
                                                                            onChange={(e) => setHypnosisConfig({
                                                                                ...hypnosisConfig,
                                                                                [track.id]: {
                                                                                    ...conf,
                                                                                    isEnabled: e.target.checked
                                                                                }
                                                                            })}
                                                                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                                                        />
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                            isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                                        }`}>
                                                                            {isEnabled ? 'Bật' : 'Tắt'}
                                                                        </span>
                                                                    </label>
                                                                </td>

                                                                {/* 4. Commission Rate / Amount */}
                                                                <td className="py-3.5 pr-4">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {/* Type Switcher */}
                                                                        <div className="flex p-0.5 bg-slate-100 rounded-lg shrink-0">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setHypnosisConfig({
                                                                                    ...hypnosisConfig,
                                                                                    [track.id]: { ...conf, type: 'percent' }
                                                                                })}
                                                                                className={`px-2 py-1 rounded text-[10px] font-black transition ${
                                                                                    type === 'percent' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400'
                                                                                }`}
                                                                                title="Tính theo %"
                                                                            >
                                                                                %
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setHypnosisConfig({
                                                                                    ...hypnosisConfig,
                                                                                    [track.id]: { ...conf, type: 'fixed' }
                                                                                })}
                                                                                className={`px-2 py-1 rounded text-[10px] font-black transition ${
                                                                                    type === 'fixed' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400'
                                                                                }`}
                                                                                title="Tính theo tiền cố định VNĐ"
                                                                            >
                                                                                đ
                                                                            </button>
                                                                        </div>

                                                                        {/* Value Input */}
                                                                        <div className="relative flex-1 min-w-[90px]">
                                                                            {type === 'percent' ? (
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    disabled={!isEnabled}
                                                                                    value={conf.percent ?? ""}
                                                                                    onChange={(e) => setHypnosisConfig({
                                                                                        ...hypnosisConfig,
                                                                                        [track.id]: { ...conf, percent: e.target.value }
                                                                                    })}
                                                                                    placeholder={`Mặc định (${settings.defaultCommissionPercent}%)`}
                                                                                    className="w-full h-8 px-2 pr-6 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-purple-600 disabled:opacity-40"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    disabled={!isEnabled}
                                                                                    value={conf.amount ?? ""}
                                                                                    onChange={(e) => setHypnosisConfig({
                                                                                        ...hypnosisConfig,
                                                                                        [track.id]: { ...conf, amount: e.target.value }
                                                                                    })}
                                                                                    placeholder="VD: 50.000"
                                                                                    className="w-full h-8 px-2 pr-6 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-purple-600 disabled:opacity-40"
                                                                                />
                                                                            )}
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                                                                {type === 'percent' ? '%' : 'đ'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* 5. Buyer Voucher Discount */}
                                                                <td className="py-3.5 pr-4">
                                                                    <div className="relative max-w-[100px]">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            disabled={!isEnabled}
                                                                            value={conf.buyerDiscount ?? ""}
                                                                            onChange={(e) => setHypnosisConfig({
                                                                                ...hypnosisConfig,
                                                                                [track.id]: { ...conf, buyerDiscount: e.target.value }
                                                                            })}
                                                                            placeholder="Giảm %"
                                                                            className="w-full h-8 px-2 pr-6 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-40"
                                                                        />
                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">%</span>
                                                                    </div>
                                                                </td>

                                                                {/* 6. Estimated Reward */}
                                                                <td className="py-3.5 pr-4">
                                                                    <span className={`font-black ${isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                                        {estCommText}
                                                                    </span>
                                                                </td>

                                                                {/* 7. Action Button */}
                                                                <td className="py-3.5 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveHypnosisRate(track.id)}
                                                                        disabled={isSavingThis}
                                                                        className="px-3.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-700 hover:text-white font-black text-xs transition-colors border border-purple-200/80 disabled:opacity-50 inline-flex items-center gap-1"
                                                                    >
                                                                        {isSavingThis ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Check className="w-3 h-3" />
                                                                        )}
                                                                        <span>Lưu</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                    {/* TAB 2: DANH SÁCH CTV */}
                    {activeTab === "affiliates" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm theo tên, email, mã ref, coupon..."
                                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#9B2528]"
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    Hiển thị {filteredAffiliates.length} đối tác
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            <th className="pb-3">Cộng tác viên</th>
                                            <th className="pb-3">Mã Ref / Coupon</th>
                                            <th className="pb-3">Tỷ lệ hoa hồng</th>
                                            <th className="pb-3">Doanh số</th>
                                            <th className="pb-3">Số dư ví</th>
                                            <th className="pb-3">Trạng thái</th>
                                            <th className="pb-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                        {filteredAffiliates.map((aff) => (
                                            <tr key={aff.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-bold text-slate-900">{aff.name}</div>
                                                    <div className="text-xs text-slate-400">{aff.email}</div>
                                                    {aff.phone && <div className="text-[11px] text-slate-500">Zalo: {aff.phone}</div>}
                                                </td>
                                                <td className="py-4">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-[#9B2528] font-black text-xs border border-amber-200">
                                                        <span>{aff.affiliateCode}</span>
                                                    </div>
                                                    {aff.couponCode && (
                                                        <div className="text-[11px] text-purple-700 font-bold mt-1">
                                                            Coupon: {aff.couponCode} (-{aff.couponDiscountPercent ?? 10}%)
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    {aff.customCommissionPercent != null ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-black text-xs border border-red-200">
                                                            {aff.customCommissionPercent}% (VIP)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                                                            {settings.defaultCommissionPercent}% (Mặc định)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-xs">
                                                    <div>{aff.stats?.totalOrders || 0} đơn ({aff.stats?.totalClicks || 0} click)</div>
                                                    <div className="font-bold text-slate-900 mt-0.5">{formatPrice(aff.stats?.totalRevenue || 0)}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="font-black text-[#9B2528]">{formatPrice(aff.stats?.balance || 0)}</div>
                                                    <div className="text-[10px] text-slate-400">Đã nhận: {formatPrice(aff.stats?.paidAmount || 0)}</div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                                        aff.status === "active"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-rose-50 text-rose-700"
                                                    }`}>
                                                        {aff.status === "active" ? "Hoạt động" : aff.status === "pending" ? "Chờ duyệt" : "Tạm khóa"}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditAffiliate(aff)}
                                                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-secret-wax hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1.5"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        <span>Chỉnh sửa</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: YÊU CẦU RÚT TIỀN */}
                    {activeTab === "payouts" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPayoutStatusFilter("all")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                            payoutStatusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        Tất cả ({payouts.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPayoutStatusFilter("pending")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                            payoutStatusFilter === "pending" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        Chờ duyệt ({pendingPayoutCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPayoutStatusFilter("completed")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                            payoutStatusFilter === "completed" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
                                        }`}
                                    >
                                        Đã chuyển
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            <th className="pb-3">Cộng tác viên</th>
                                            <th className="pb-3">Số tiền rút</th>
                                            <th className="pb-3">Ngân hàng nhận</th>
                                            <th className="pb-3">Trạng thái</th>
                                            <th className="pb-3 text-right">Quét QR & Duyệt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                        {filteredPayouts.map((pay) => (
                                            <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-bold text-slate-900">{pay.affiliateName}</div>
                                                    <div className="text-xs text-[#9B2528] font-black">{pay.affiliateCode}</div>
                                                    <div className="text-[11px] text-slate-400">{pay.affiliateEmail}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="text-base font-black text-slate-900">
                                                        {formatPrice(pay.amount || 0)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {formatAffiliateDate(pay.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-xs">
                                                    <div className="font-black text-slate-800">{pay.bankInfo?.bankName}</div>
                                                    <div className="font-mono text-slate-900 font-bold">{pay.bankInfo?.accountNumber}</div>
                                                    <div className="text-[11px] text-slate-500 uppercase">{pay.bankInfo?.accountHolder}</div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                                        pay.status === "completed"
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : pay.status === "rejected"
                                                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                                    }`}>
                                                        {pay.status === "completed" ? "Đã thanh toán" : pay.status === "rejected" ? "Từ chối" : "Chờ duyệt chi"}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQrPayout(pay)}
                                                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <QrCode className="w-3.5 h-3.5 text-[#9B2528]" />
                                                        <span>VietQR</span>
                                                    </button>

                                                    {pay.status === "pending" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActionPayout(pay);
                                                                    setPayoutActionType("completed");
                                                                }}
                                                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Duyệt</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActionPayout(pay);
                                                                    setPayoutActionType("rejected");
                                                                }}
                                                                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold inline-flex items-center gap-1"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                <span>Từ chối</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: LỊCH SỬ HOA HỒNG */}
                    {activeTab === "commissions" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Chi Tiết Đơn Hàng Hoa Hồng</h3>
                                <span className="text-xs font-bold text-slate-400">100 đơn gần nhất</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            <th className="pb-3">Mã đơn</th>
                                            <th className="pb-3">Cộng tác viên</th>
                                            <th className="pb-3">Khóa học</th>
                                            <th className="pb-3">Giá trị đơn</th>
                                            <th className="pb-3">Tỷ lệ</th>
                                            <th className="pb-3 text-right">Tiền hoa hồng</th>
                                            <th className="pb-3 text-center">Nguồn</th>
                                            <th className="pb-3 text-right">Ngày mua</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                        {commissions.map((comm) => (
                                            <tr key={comm.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 font-mono font-bold text-slate-900 text-xs">
                                                    {comm.orderCode || comm.orderId?.slice(0, 8)}
                                                </td>
                                                <td className="py-3.5">
                                                    <div className="font-bold text-slate-900">{comm.affiliateName}</div>
                                                    <div className="text-xs text-[#9B2528] font-black">{comm.affiliateCode}</div>
                                                </td>
                                                <td className="py-3.5 text-xs text-slate-800 max-w-[200px] truncate">
                                                    {comm.courseName}
                                                </td>
                                                <td className="py-3.5 text-xs">
                                                    {formatPrice(comm.orderAmount || 0)}
                                                </td>
                                                <td className="py-3.5 text-xs">
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px]">
                                                        {comm.commissionPercent != null ? `${comm.commissionPercent}%` : "Theo từng khóa"}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 font-black text-[#9B2528] text-right">
                                                    +{formatPrice(comm.commissionAmount || 0)}
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        comm.attributionType === "coupon"
                                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                            : "bg-blue-50 text-blue-700 border border-blue-200"
                                                    }`}>
                                                        {comm.attributionType === "coupon" ? "Mã Coupon" : "Link Ref"}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-xs text-slate-400 text-right">
                                                    {formatAffiliateDate(comm.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* MODAL SỬA CTV */}
            {selectedAffiliate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-[#9B2528]" />
                                Chỉnh Sửa CTV: {selectedAffiliate.affiliateCode}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedAffiliate(null)}
                                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveAffiliate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Tỷ lệ hoa hồng riêng (VIP %)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    placeholder={`Mặc định hệ thống (${settings.defaultCommissionPercent}%)`}
                                    value={editCommissionPercent}
                                    onChange={(e) => setEditCommissionPercent(e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Để trống nếu muốn dùng % mặc định của hệ thống.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Mã Coupon độc quyền của CTV
                                </label>
                                <input
                                    type="text"
                                    value={editCouponCode}
                                    onChange={(e) => setEditCouponCode(e.target.value.toUpperCase())}
                                    placeholder="VD: MONG10"
                                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-bold text-slate-900 uppercase outline-none focus:border-[#9B2528]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    % Giảm giá cho người mua khi nhập mã Coupon
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editCouponDiscount}
                                    onChange={(e) => setEditCouponDiscount(e.target.value)}
                                    placeholder="10"
                                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                >
                                    <option value="active">✅ Đang hoạt động (Active)</option>
                                    <option value="pending">Chờ duyệt (Pending)</option>
                                    <option value="paused">⛔ Tạm khóa (Paused)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAffiliate(null)}
                                    className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingAffiliate}
                                    className="flex-1 h-11 rounded-xl bg-[#9B2528] text-white font-black text-xs shadow-md hover:bg-[#7E1E21]"
                                >
                                    {isSavingAffiliate ? "Đang lưu..." : "Lưu Thay Đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VIETQR CHUYỂN KHOẢN NHANH */}
            {qrPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Mã VietQR Thanh Toán</h3>
                            <button
                                type="button"
                                onClick={() => setQrPayout(null)}
                                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-center">
                            {payoutQrUrl ? <img
                                src={payoutQrUrl}
                                alt="VietQR"
                                className="w-64 h-auto rounded-xl shadow-sm"
                            /> : <p className="text-sm text-slate-600">Chưa hỗ trợ tạo QR cho tài khoản này. Vui lòng chuyển khoản theo thông tin bên dưới và kiểm tra tên người nhận trong ứng dụng ngân hàng.</p>}
                        </div>

                        <div className="text-xs space-y-1 text-left bg-amber-50 p-3 rounded-xl border border-amber-200">
                            <div><strong>Ngân hàng:</strong> {qrPayout.bankInfo?.bankName}</div>
                            <div><strong>Số TK:</strong> {qrPayout.bankInfo?.accountNumber}</div>
                            <div><strong>Chủ TK:</strong> {qrPayout.bankInfo?.accountHolder}</div>
                            <div><strong>Số tiền:</strong> <span className="font-black text-[#9B2528]">{formatPrice(qrPayout.amount)}</span></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setQrPayout(null)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DUYỆT / TỪ CHỐI RÚT TIỀN */}
            {actionPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">
                                {payoutActionType === "completed" ? "✅ Duyệt Đã Thanh Toán" : "❌ Từ Chối Yêu Cầu Rút Tiền"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActionPayout(null)}
                                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                            <div>CTV: <strong>{actionPayout.affiliateName} ({actionPayout.affiliateCode})</strong></div>
                            <div>Số tiền: <strong className="text-[#9B2528] text-sm">{formatPrice(actionPayout.amount)}</strong></div>
                            <div>Ngân hàng: {actionPayout.bankInfo?.bankName} - {actionPayout.bankInfo?.accountNumber}</div>
                        </div>

                        <form onSubmit={handleProcessPayout} className="space-y-4">
                            {payoutActionType === "completed" ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Mã giao dịch / Mã tham chiếu ngân hàng (Tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={payoutTransactionRef}
                                        onChange={(e) => setPayoutTransactionRef(e.target.value)}
                                        placeholder="VD: FT240828..."
                                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Lý do từ chối <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={payoutAdminNote}
                                        onChange={(e) => setPayoutAdminNote(e.target.value)}
                                        rows="3"
                                        placeholder="Nhập lý do gửi tới CTV..."
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#9B2528]"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActionPayout(null)}
                                    className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessingPayout}
                                    className={`flex-1 h-11 rounded-xl text-white font-black text-xs shadow-md ${
                                        payoutActionType === "completed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                    }`}
                                >
                                    {isProcessingPayout ? "Đang xử lý..." : payoutActionType === "completed" ? "Xác Nhận Đã Chuyển" : "Xác Nhận Từ Chối"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAffiliates;
