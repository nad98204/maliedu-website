import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
    Award,
    CheckCircle2,
    ChevronRight,
    Copy,
    CreditCard,
    DollarSign,
    ExternalLink,
    Gift,
    HelpCircle,
    Info,
    Layers,
    Link as LinkIcon,
    Loader2,
    MousePointerClick,
    Percent,
    PieChart,
    PlusCircle,
    QrCode,
    RefreshCw,
    Share2,
    ShieldCheck,
    Sparkles,
    Tag,
    TrendingUp,
    UserCheck,
    Users,
    Wallet,
    Headphones,
    BookOpen,
    Search
} from "lucide-react";
import toast from "react-hot-toast";

import { auth, db } from "../firebase";
import SEO from "../components/SEO";
import AuthModal from "../components/AuthModal";
import { getHypnosisCatalog } from "../utils/hypnosisService";
import {
    createPayoutRequest,
    getAffiliateByUserId,
    getAffiliateCommissions,
    getAffiliatePayouts,
    getAffiliateSettings,
    registerAffiliate,
    updateAffiliateBankInfo
} from "../utils/affiliateService";
import { formatPrice } from "../utils/orderService";

const VIETNAM_BANKS = [
    "Techcombank",
    "Vietcombank",
    "MB Bank",
    "ACB",
    "VietinBank",
    "BIDV",
    "TPBank",
    "VPBank",
    "VIB",
    "Sacombank",
    "HDBank",
    "OCB",
    "MSB",
    "SHB",
    "SeABank",
    "Agribank",
    "Khác (Điền rõ trong tên)"
];

const formatAffiliateDate = (value, withTime = false) => {
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (!Number.isFinite(date.getTime())) return "Gần đây";
    return withTime ? date.toLocaleString("vi-VN") : date.toLocaleDateString("vi-VN");
};

const AffiliatePortal = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const [affiliate, setAffiliate] = useState(null);
    const [settings, setSettings] = useState(null);
    const [courses, setCourses] = useState([]);
    const [hypnosisTracks, setHypnosisTracks] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Active sub-tab in portal
    const [activeTab, setActiveTab] = useState("links"); // links | commissions | payouts | settings

    // Form states
    const [registerCode, setRegisterCode] = useState("");
    const [registerPhone, setRegisterPhone] = useState("");
    const [registerBankName, setRegisterBankName] = useState(VIETNAM_BANKS[0]);
    const [registerAccountNumber, setRegisterAccountNumber] = useState("");
    const [registerAccountHolder, setRegisterAccountHolder] = useState("");
    const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

    // Link Generator & Filter state
    const [selectedTargetKey, setSelectedTargetKey] = useState("all_courses");
    const [courseSearch, setCourseSearch] = useState("");
    const [hypnosisSearch, setHypnosisSearch] = useState("");
    const [mobileProductTab, setMobileProductTab] = useState("courses"); // courses | hypnosis
    const [copiedKey, setCopiedKey] = useState(null);

    // Payout modal state
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutNote, setPayoutNote] = useState("");
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

    // Edit Bank state
    const [editBankName, setEditBankName] = useState("");
    const [editAccountNumber, setEditAccountNumber] = useState("");
    const [editAccountHolder, setEditAccountHolder] = useState("");
    const [isSavingBank, setIsSavingBank] = useState(false);

    // Check Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAffiliate(null);
            setCommissions([]);
            setPayouts([]);
            setEditBankName("");
            setEditAccountNumber("");
            setEditAccountHolder("");
            setIsPayoutModalOpen(false);
            setRegisterCode("");
            setCurrentUser(user);
            setAuthLoading(false);
            if (user) {
                loadAffiliateData(user.uid);
            }
        });
        return unsubscribe;
    }, []);

    // Load initial settings, courses and hypnosis tracks
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [appSettings, coursesSnap, hypnosisSnap] = await Promise.all([
                    getAffiliateSettings(),
                    getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc"))),
                    getHypnosisCatalog()
                ]);
                setSettings(appSettings);
                setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const hypList = hypnosisSnap.filter(track => track.available);
                setHypnosisTracks(hypList.filter(t => !t.isFree && t.isAffiliateEnabled !== false));
            } catch (err) {
                console.error("Error loading courses/hypnosis/settings:", err);
            }
        };
        fetchInitial();
    }, []);

    const loadAffiliateData = async (uid) => {
        setLoadingData(true);
        try {
            const affProfile = await getAffiliateByUserId(uid);
            if (auth.currentUser?.uid !== uid) return;
            setAffiliate(affProfile);

            if (affProfile) {
                setEditBankName(affProfile.bankInfo?.bankName || VIETNAM_BANKS[0]);
                setEditAccountNumber(affProfile.bankInfo?.accountNumber || "");
                setEditAccountHolder(affProfile.bankInfo?.accountHolder || "");

                const [commList, payList] = await Promise.all([
                    getAffiliateCommissions(uid),
                    getAffiliatePayouts(uid)
                ]);
                if (auth.currentUser?.uid !== uid) return;
                setCommissions(commList);
                setPayouts(payList);
            }
        } catch (error) {
            console.error("Error loading affiliate profile:", error);
            if (auth.currentUser?.uid === uid) toast.error("Không thể tải thông tin đối tác.");
        } finally {
            if (auth.currentUser?.uid === uid) setLoadingData(false);
        }
    };

    // Auto-suggest code from email or name
    useEffect(() => {
        if (currentUser) {
            const suggested = (currentUser.displayName || currentUser.email?.split("@")[0] || "MALI")
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 10);
            setRegisterCode((current) => current || suggested);
        }
    }, [currentUser]);

    // Handle Copy to clipboard
    const copyToClipboard = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success("Đã sao chép vào bộ nhớ tạm!");
        setTimeout(() => setCopiedKey(null), 2500);
    };

    // Handle Register Affiliate
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
        }

        setIsSubmittingRegister(true);
        try {
            const newAffiliate = await registerAffiliate(currentUser, {
                affiliateCode: registerCode,
                phone: registerPhone,
                bankInfo: {
                    bankName: registerBankName,
                    accountNumber: registerAccountNumber,
                    accountHolder: registerAccountHolder.toUpperCase(),
                }
            });
            setAffiliate(newAffiliate);
            toast.success("Chúc mừng bạn đã trở thành Đối tác Tiếp thị Mali Edu!");
            await loadAffiliateData(currentUser.uid);
        } catch (error) {
            toast.error(error.message || "Đăng ký thất bại, vui lòng thử lại.");
        } finally {
            setIsSubmittingRegister(false);
        }
    };

    // Handle Submit Payout Request
    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        const amountNum = Number(payoutAmount);
        const minAmount = Number(settings?.minPayoutAmount || 200000);

        if (!amountNum || amountNum < minAmount) {
            toast.error(`Số tiền rút tối thiểu là ${formatPrice(minAmount)}.`);
            return;
        }

        if (amountNum > Number(affiliate?.stats?.balance || 0)) {
            toast.error("Số dư khả dụng của bạn không đủ.");
            return;
        }

        setIsSubmittingPayout(true);
        try {
            await createPayoutRequest(
                currentUser.uid,
                amountNum,
                affiliate.bankInfo || {},
                payoutNote
            );
            toast.success("Đã gửi yêu cầu rút tiền! Admin sẽ duyệt chi sớm nhất.");
            setIsPayoutModalOpen(false);
            setPayoutAmount("");
            setPayoutNote("");
            await loadAffiliateData(currentUser.uid);
        } catch (error) {
            toast.error(error.message || "Không thể tạo yêu cầu rút tiền.");
        } finally {
            setIsSubmittingPayout(false);
        }
    };

    // Handle Save Bank Info
    const handleSaveBankInfo = async (e) => {
        e.preventDefault();
        setIsSavingBank(true);
        try {
            await updateAffiliateBankInfo(currentUser.uid, {
                bankName: editBankName,
                accountNumber: editAccountNumber,
                accountHolder: editAccountHolder.toUpperCase(),
            });
            toast.success("Đã cập nhật thông tin ngân hàng thành công!");
            await loadAffiliateData(currentUser.uid);
        } catch {
            toast.error("Lỗi khi lưu thông tin ngân hàng.");
        } finally {
            setIsSavingBank(false);
        }
    };

    // Generated links
    const origin = typeof window !== "undefined" ? window.location.origin : "https://luathapdan.vn";
    const currentAffCode = affiliate?.affiliateCode || "REF_CODE";
    const generatedLink = useMemo(() => {
        if (selectedTargetKey === "all_courses" || selectedTargetKey === "all") {
            return `${origin}/khoa-hoc?ref=${currentAffCode}`;
        }
        if (selectedTargetKey === "all_hypnosis") {
            return `${origin}/thoi-mien?ref=${currentAffCode}`;
        }
        if (selectedTargetKey.startsWith("course:")) {
            const slugOrId = selectedTargetKey.replace("course:", "");
            return `${origin}/khoa-hoc/${slugOrId}?ref=${currentAffCode}`;
        }
        if (selectedTargetKey.startsWith("hypnosis:")) {
            const trackId = selectedTargetKey.replace("hypnosis:", "");
            return `${origin}/thanh-toan/${trackId}?ref=${currentAffCode}`;
        }
        return `${origin}/khoa-hoc/${selectedTargetKey}?ref=${currentAffCode}`;
    }, [selectedTargetKey, currentAffCode, origin]);

    const filteredCourses = useMemo(() => {
        if (!courseSearch.trim()) return courses;
        const q = courseSearch.toLowerCase();
        return courses.filter((c) => (c.name || "").toLowerCase().includes(q));
    }, [courses, courseSearch]);

    const filteredHypnosisTracks = useMemo(() => {
        if (!hypnosisSearch.trim()) return hypnosisTracks;
        const q = hypnosisSearch.toLowerCase();
        return hypnosisTracks.filter((t) => (t.title || "").toLowerCase().includes(q) || (t.author || "").toLowerCase().includes(q));
    }, [hypnosisTracks, hypnosisSearch]);

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pt-24 pb-20">
            <SEO
                title="Chương trình Tiếp thị liên kết (Affiliate) - Mali Edu"
                description="Đồng hành cùng Mali Edu lan tỏa các khóa học chất lượng và nhận hoa hồng hấp dẫn từ 30% đến 50% mỗi đơn hàng."
                url="/affiliate"
            />

            {/* Top Banner Hero */}
            <section className="relative overflow-hidden border-b border-amber-200/60 bg-gradient-to-br from-[#FFF9EE] via-[#FFF3DD] to-[#FCE8D5] py-12 lg:py-16">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

                <div className="container mx-auto px-4 max-w-6xl relative">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="max-w-2xl text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-[#9B2528] text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
                                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                                <span>Đối Tác Tiếp Thị Mali Edu</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                                Lan tỏa tri thức & <span className="text-[#9B2528]">Nhận hoa hồng 30% - 50%</span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg font-medium text-slate-600 leading-relaxed">
                                Chia sẻ các khóa học Luật Hấp Dẫn, Thôi Miên & Phát Triển Bản Thân tới cộng đồng. Nhận hoa hồng theo từng khóa học tự động, thanh toán minh bạch và linh hoạt.
                            </p>

                            {!affiliate && (
                                <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                    {currentUser ? (
                                        <a
                                            href="#register-section"
                                            className="px-8 py-4 rounded-2xl bg-[#9B2528] text-white font-black text-base shadow-lg shadow-red-950/20 hover:bg-[#7E1E21] transition-all hover:scale-105 active:scale-95"
                                        >
                                            Đăng ký làm Đối tác ngay
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsAuthModalOpen(true)}
                                            className="px-8 py-4 rounded-2xl bg-[#9B2528] text-white font-black text-base shadow-lg shadow-red-950/20 hover:bg-[#7E1E21] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <UserCheck className="w-5 h-5" />
                                            Đăng nhập để tham gia
                                        </button>
                                    )}
                                    <a
                                        href="#how-it-works"
                                        className="px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-base hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Tìm hiểu cơ chế
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Highlight Card */}
                        <div className="w-full lg:w-96 bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xl shadow-amber-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Quyền Lợi Đặc Quyền</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">
                                    Đang mở đăng ký
                                </span>
                            </div>
                            <ul className="space-y-3.5 text-sm font-semibold text-slate-700">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Hoa hồng hấp dẫn <strong>từng khóa học (20% - 50%)</strong> trên mỗi đơn thành công.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Ghi nhận qua <strong>Link ref</strong> & <strong>Mã giảm giá riêng</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Thời hạn lưu cookie <strong>{settings?.cookieDurationDays === 0 ? "Vĩnh viễn" : `${settings?.cookieDurationDays || 30} ngày`}</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Rút tiền linh hoạt về mọi ngân hàng Việt Nam.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN PORTAL CONTENT */}
            <div className="container mx-auto px-4 max-w-6xl mt-10">

                {authLoading || loadingData ? (
                    <div className="py-24 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-[#9B2528] mx-auto" />
                        <p className="mt-4 text-sm font-bold text-slate-500">Đang đồng bộ dữ liệu đối tác...</p>
                    </div>
                ) : !currentUser ? (
                    /* CASE 1: Chưa đăng nhập */
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Bắt đầu kiếm thu nhập cùng Mali Edu
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Đăng nhập tài khoản học viên của bạn để kích hoạt mã giới thiệu và theo dõi hoa hồng trực tiếp.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsAuthModalOpen(true)}
                            className="px-8 py-3.5 rounded-2xl bg-[#9B2528] text-white font-black text-sm shadow-md hover:bg-[#7E1E21] transition-all"
                        >
                            Đăng nhập / Đăng ký tài khoản
                        </button>
                    </div>
                ) : !affiliate ? (
                    /* CASE 2: Đã đăng nhập nhưng CHƯA là CTV -> Form Đăng Ký */
                    <div id="register-section" className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200 shadow-lg max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#9B2528] flex items-center justify-center mx-auto mb-3 shadow-inner">
                                <Award className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Đăng ký trở thành Đối tác Tiếp thị</h2>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                                Điền thông tin bên dưới để tạo mã giới thiệu độc quyền của riêng bạn
                            </p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                    Mã tiếp thị cá nhân (Affiliate Code) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={registerCode}
                                        onChange={(e) => setRegisterCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                                        placeholder="VD: THAYMONG, HUONGCOACH, MALI99"
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 font-black text-slate-900 tracking-wider outline-none focus:border-[#9B2528] focus:ring-4 focus:ring-[#9B2528]/10 uppercase"
                                    />
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                                    Link của bạn sẽ có dạng: <code>{origin}/khoa-hoc?ref=<strong>{registerCode || "MA_CUA_BAN"}</strong></code>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                    Số điện thoại Zalo liên hệ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={registerPhone}
                                    onChange={(e) => setRegisterPhone(e.target.value)}
                                    placeholder="0912345678"
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528] focus:ring-4 focus:ring-[#9B2528]/10"
                                />
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#9B2528]" />
                                    Tài khoản ngân hàng nhận hoa hồng
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngân hàng</label>
                                        <select
                                            value={registerBankName}
                                            onChange={(e) => setRegisterBankName(e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-[#9B2528]"
                                        >
                                            {VIETNAM_BANKS.map((b) => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Số tài khoản</label>
                                        <input
                                            type="text"
                                            required
                                            value={registerAccountNumber}
                                            onChange={(e) => setRegisterAccountNumber(e.target.value)}
                                            placeholder="VD: 1903..."
                                            className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên chủ tài khoản (In hoa)</label>
                                        <input
                                            type="text"
                                            required
                                            value={registerAccountHolder}
                                            onChange={(e) => setRegisterAccountHolder(e.target.value.toUpperCase())}
                                            placeholder="NGUYEN VAN A"
                                            className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528] uppercase"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingRegister}
                                className="w-full h-14 rounded-2xl bg-[#9B2528] text-white font-black text-base shadow-lg shadow-red-950/20 hover:bg-[#7E1E21] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                            >
                                {isSubmittingRegister ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Đang khởi tạo đối tác...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Xác Nhận & Kích Hoạt Ngay</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* CASE 3: ĐÃ LÀ ĐỐI TÁC -> HIỂN THỊ DASHBOARD THỰC THỤ */
                    <div className="space-y-8">

                        {affiliate.status !== "active" && (
                            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                                <p className="font-bold">{affiliate.status === "pending" ? "Tài khoản CTV đang chờ duyệt" : "Tài khoản CTV đang tạm khóa"}</p>
                                <p className="mt-1">Link giới thiệu và mã giảm giá chỉ hoạt động khi tài khoản được quản trị viên kích hoạt.</p>
                            </div>
                        )}

                        {/* Top Overview Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Card 1: Số dư ví */}
                            <div className="col-span-2 sm:col-span-1 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#9B2528] to-[#7E1E21] p-4 sm:p-6 text-white shadow-xl shadow-red-950/15 relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-200">Số dư khả dụng</span>
                                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                                    </div>
                                    <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-black tracking-tight">
                                        {formatPrice(affiliate.stats?.balance || 0)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPayoutModalOpen(true)}
                                    disabled={(affiliate.stats?.balance || 0) < (settings?.minPayoutAmount || 200000)}
                                    className="mt-3 sm:mt-4 w-full py-2 rounded-xl bg-white text-[#9B2528] font-black text-xs shadow-sm hover:bg-amber-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {(affiliate.stats?.balance || 0) < (settings?.minPayoutAmount || 200000)
                                        ? `Cần tối thiểu ${formatPrice(settings?.minPayoutAmount || 200000)}`
                                        : "Yêu cầu rút tiền ngay"}
                                </button>
                            </div>

                            {/* Card 2: Tổng hoa hồng */}
                            <div className="col-span-1 rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Tổng hoa hồng</span>
                                        <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600">
                                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:mt-3 text-base sm:text-2xl font-black text-slate-900 truncate">
                                        {formatPrice(affiliate.stats?.totalCommission || 0)}
                                    </div>
                                </div>
                                <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold text-slate-500 truncate">
                                    Đã nhận: {formatPrice(affiliate.stats?.paidAmount || 0)}
                                </p>
                            </div>

                            {/* Card 3: Đơn hàng thành công */}
                            <div className="col-span-1 rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Đơn thành công</span>
                                        <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:mt-3 text-base sm:text-2xl font-black text-slate-900">
                                        {affiliate.stats?.totalOrders || 0} <span className="text-xs sm:text-sm font-bold text-slate-400">đơn</span>
                                    </div>
                                </div>
                                <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold text-slate-500 truncate">
                                    DT: {formatPrice(affiliate.stats?.totalRevenue || 0)}
                                </p>
                            </div>

                            {/* Card 4: Lượt click */}
                            <div className="col-span-2 sm:col-span-1 rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Lượt click link</span>
                                        <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
                                            <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:mt-3 text-base sm:text-2xl font-black text-slate-900">
                                        {affiliate.stats?.totalClicks || 0} <span className="text-xs sm:text-sm font-bold text-slate-400">lượt</span>
                                    </div>
                                </div>
                                <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold text-slate-500">
                                    Mã CTV: <strong className="text-[#9B2528]">{affiliate.affiliateCode}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("links")}
                                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                                    activeTab === "links"
                                        ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                }`}
                            >
                                <LinkIcon className="w-4 h-4" />
                                <span>Tạo Link & Mã Coupon</span>
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
                                <span>Lịch sử hoa hồng ({commissions.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("payouts")}
                                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                                    activeTab === "payouts"
                                        ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                }`}
                            >
                                <Wallet className="w-4 h-4" />
                                <span>Lịch sử rút tiền ({payouts.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("settings")}
                                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                                    activeTab === "settings"
                                        ? "bg-[#9B2528] text-white shadow-md shadow-red-950/15"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Tài khoản ngân hàng</span>
                            </button>
                        </div>

                        {/* TAB 1: TẠO LINK & COUPON */}
                        {activeTab === "links" && (
                            <div className="space-y-6 sm:space-y-8">
                                {/* HÀNG 1: TRÌNH TẠO LINK & MÃ COUPON ĐỘC QUYỀN */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                                    {/* Left: Link Generator */}
                                    <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 sm:space-y-5">
                                        <div className="space-y-3.5 sm:space-y-4">
                                            <div className="flex items-center gap-2.5 sm:gap-3">
                                                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-red-50 text-[#9B2528] shrink-0">
                                                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-black text-slate-900">Trình tạo Link Giới Thiệu</h3>
                                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Chọn khóa học hoặc bài thôi miên để tạo link riêng</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5 sm:mb-2">Chọn trang đích / Sản phẩm tiếp thị:</label>
                                                <select
                                                    value={selectedTargetKey}
                                                    onChange={(e) => setSelectedTargetKey(e.target.value)}
                                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-[#9B2528] bg-white transition-colors"
                                                >
                                                    <optgroup label="🌟 Trang danh mục chung">
                                                        <option value="all_courses">🌟 Toàn bộ danh mục khóa học (/khoa-hoc)</option>
                                                        <option value="all_hypnosis">🌙 Toàn bộ danh mục Thôi Miên (/thoi-mien)</option>
                                                    </optgroup>
                                                    <optgroup label="📚 Khóa học trực tuyến">
                                                        {courses.map((c) => {
                                                            const commPercent = affiliate?.customCommissionPercent != null
                                                                ? affiliate.customCommissionPercent
                                                                : (c.affiliateCommissionPercent != null && c.affiliateCommissionPercent !== "" ? Number(c.affiliateCommissionPercent) : (settings?.defaultCommissionPercent || 30));
                                                            const estReward = Math.round(((c.price || 0) * commPercent) / 100);
                                                            return (
                                                                <option key={c.id} value={`course:${c.slug || c.id}`}>
                                                                    [Khóa học] {c.name} — Hoa hồng: {commPercent}% (~{formatPrice(estReward)})
                                                                </option>
                                                            );
                                                        })}
                                                    </optgroup>
                                                    <optgroup label="🎧 Bản Thôi Miên Tiềm Thức">
                                                        {hypnosisTracks.map((t) => {
                                                            const rawPrice = t.price;
                                                            const trackPrice = typeof rawPrice === 'number' ? rawPrice : (Number(String(rawPrice || 0).replace(/\D/g, '')) || 0);
                                                            const isFixed = t.affiliateCommissionType === 'fixed' && Number(t.affiliateCommissionAmount) > 0;
                                                            const commPercent = affiliate?.customCommissionPercent != null
                                                                ? affiliate.customCommissionPercent
                                                                : (t.affiliateCommissionPercent != null && t.affiliateCommissionPercent !== "" ? Number(t.affiliateCommissionPercent) : (settings?.defaultCommissionPercent || 30));
                                                            const estReward = isFixed ? Number(t.affiliateCommissionAmount) : Math.round((trackPrice * commPercent) / 100);
                                                            const rewardLabel = isFixed ? formatPrice(t.affiliateCommissionAmount) : `${commPercent}% (~${formatPrice(estReward)})`;
                                                            const buyerTag = Number(t.affiliateBuyerDiscountPercent) > 0 ? ` • Giảm ${t.affiliateBuyerDiscountPercent}% KH` : '';
                                                            return (
                                                                <option key={t.id} value={`hypnosis:${t.id}`}>
                                                                    [Thôi miên] {t.title} — Hoa hồng: {rewardLabel}{buyerTag}
                                                                </option>
                                                            );
                                                        })}
                                                    </optgroup>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5 sm:mb-2">Link tiếp thị của bạn:</label>
                                                <div className="flex items-stretch gap-1.5 sm:gap-2">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={generatedLink}
                                                        className="flex-1 min-w-0 h-11 sm:h-12 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-[11px] sm:text-sm text-slate-700 select-all outline-none truncate"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(generatedLink, "link")}
                                                        className="h-11 sm:h-12 px-3.5 sm:px-6 rounded-xl bg-[#9B2528] text-white font-black text-xs sm:text-sm shadow-md hover:bg-[#7E1E21] transition-all flex items-center justify-center gap-1.5 shrink-0"
                                                    >
                                                        {copiedKey === "link" ? (
                                                            <>
                                                                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                                                                <span>Đã chép</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-4 h-4" />
                                                                <span>Sao chép</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] sm:text-xs font-medium text-amber-900 flex items-start gap-2 sm:gap-2.5">
                                            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <span>
                                                Hệ thống lưu mã của bạn trong <strong>{settings?.cookieDurationDays === 0 ? "Vĩnh viễn" : `${settings?.cookieDurationDays || 30} ngày`}</strong>. Khi khách hàng thanh toán bất kỳ lúc nào, bạn đều được tự động cộng hoa hồng!
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Personal Coupon Card */}
                                    <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-br from-amber-50/70 via-white to-red-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-amber-200/80 shadow-sm flex flex-col justify-between space-y-3.5 sm:space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                                                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                                                    <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-black text-slate-900">Mã Coupon Độc Quyền</h3>
                                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Tặng bạn bè ưu đãi đặc biệt</p>
                                                </div>
                                            </div>

                                            <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-[#9B2528]/40 bg-white p-3.5 sm:p-5 text-center space-y-1 sm:space-y-1.5 shadow-inner">
                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#9B2528]">Mã giảm giá của bạn</span>
                                                <div className="text-xl sm:text-3xl font-black text-slate-950 tracking-wider select-all">
                                                    {affiliate.couponCode || `${affiliate.affiliateCode}10`}
                                                </div>
                                                <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold border border-emerald-200">
                                                    Giảm ngay {affiliate.couponDiscountPercent ?? 10}% cho người mua
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 sm:space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(affiliate.couponCode || `${affiliate.affiliateCode}10`, "coupon")}
                                                className="w-full h-11 sm:h-12 rounded-xl bg-slate-900 text-white font-black text-xs sm:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                {copiedKey === "coupon" ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span>Đã chép mã coupon!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        <span>Sao chép mã Coupon</span>
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium text-center leading-relaxed">
                                                Khách nhập mã này lúc thanh toán để được giảm giá, hoa hồng tự động ghi nhận cho bạn kể cả không qua link!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* HÀNG 2: BẢNG SẢN PHẨM & HOA HỒNG */}
                                <div className="space-y-3.5 sm:space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                                        <div>
                                            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#9B2528]" />
                                                <span>Bảng Tỷ Lệ Hoa Hồng Tiếp Thị Từng Sản Phẩm</span>
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                                Xem mức hoa hồng chi tiết và lấy link chia sẻ trực tiếp cho từng khóa học hoặc bản thôi miên
                                            </p>
                                        </div>

                                        {/* Mobile Tab Switcher: Gọn gàng, dễ bấm, không bị kéo dài lê thê trên mobile */}
                                        <div className="flex lg:hidden p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setMobileProductTab("courses")}
                                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                                    mobileProductTab === "courses"
                                                        ? "bg-[#9B2528] text-white shadow-sm"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>Khóa học ({courses.length})</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMobileProductTab("hypnosis")}
                                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                                    mobileProductTab === "hypnosis"
                                                        ? "bg-purple-700 text-white shadow-sm"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                <Headphones className="w-3.5 h-3.5" />
                                                <span>Thôi miên ({hypnosisTracks.length})</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2 Cột: Desktop song song (khóa học 1 bên, thôi miên 1 bên) - Mobile chuyển tab mượt mà */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
                                        {/* CỘT TRÁI: KHÓA HỌC ONLINE */}
                                        <div className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col ${
                                            mobileProductTab === "courses" ? "flex" : "hidden lg:flex"
                                        }`}>
                                            {/* Column Header */}
                                            <div className="p-3.5 sm:p-5 bg-gradient-to-r from-red-50/80 via-white to-white border-b border-slate-100 space-y-2.5 sm:space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#9B2528] text-white flex items-center justify-center shadow-md shadow-red-950/20 shrink-0">
                                                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                                                                <span>Khóa Học Online</span>
                                                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#9B2528] text-[10px] sm:text-[11px] font-black">
                                                                    {courses.length}
                                                                </span>
                                                            </h4>
                                                            <p className="text-[11px] sm:text-xs text-slate-500">Các chương trình đào tạo trực tuyến</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Link toàn bộ danh mục khóa học */}
                                                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-red-100/90 shadow-sm flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs block truncate">🌟 Link Danh Mục Toàn Bộ Khóa Học</span>
                                                        <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block">/khoa-hoc?ref={currentAffCode}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(`${origin}/khoa-hoc?ref=${currentAffCode}`, "cat-courses")}
                                                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-red-50 hover:bg-[#9B2528] hover:text-white text-[#9B2528] border border-red-200/80 font-black text-[11px] sm:text-xs shrink-0 transition-all flex items-center gap-1"
                                                    >
                                                        {copiedKey === "cat-courses" ? (
                                                            <>
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Đã chép</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" />
                                                                <span>Lấy link</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Ô tìm kiếm khóa học */}
                                                <div className="relative">
                                                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={courseSearch}
                                                        onChange={(e) => setCourseSearch(e.target.value)}
                                                        placeholder="Tìm khóa học theo tên..."
                                                        className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-[11px] sm:text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#9B2528] outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Danh sách khóa học */}
                                            <div className="p-2 sm:p-4 divide-y divide-slate-100 max-h-[380px] sm:max-h-[500px] overflow-y-auto">
                                                {filteredCourses.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 text-xs font-medium">
                                                        {courseSearch ? "Không tìm thấy khóa học nào phù hợp" : "Chưa có khóa học nào"}
                                                    </div>
                                                ) : (
                                                    filteredCourses.map((c) => {
                                                        const commPercent = affiliate?.customCommissionPercent != null
                                                            ? affiliate.customCommissionPercent
                                                            : (c.affiliateCommissionPercent != null && c.affiliateCommissionPercent !== "" ? Number(c.affiliateCommissionPercent) : (settings?.defaultCommissionPercent || 30));
                                                        const estReward = Math.round(((c.price || 0) * commPercent) / 100);
                                                        const itemLink = `${origin}/khoa-hoc/${c.slug || c.id}?ref=${currentAffCode}`;

                                                        return (
                                                            <div key={`course-${c.id}`} className="py-2.5 sm:py-3 px-2 rounded-xl hover:bg-slate-50/90 transition-colors flex items-center justify-between gap-2.5">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                                                                        {c.name}
                                                                    </div>
                                                                    <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                                                                        Giá bán: <span className="font-bold text-slate-700">{formatPrice(c.price || 0)}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                                                                    <div className="text-right">
                                                                        <span className="inline-block px-1.5 sm:px-2 py-0.5 rounded-lg bg-red-50 text-[#9B2528] font-black text-[11px] sm:text-xs border border-red-200">
                                                                            {commPercent}%
                                                                        </span>
                                                                        <div className="text-[10px] sm:text-[11px] font-black text-emerald-600 mt-0.5">
                                                                            +{formatPrice(estReward)}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(itemLink, `course-${c.id}`)}
                                                                        className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 hover:border-[#9B2528] hover:bg-red-50 hover:text-[#9B2528] font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all text-slate-700 shrink-0"
                                                                    >
                                                                        {copiedKey === `course-${c.id}` ? (
                                                                            <>
                                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                                <span className="text-[11px]">Đã chép</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                                <span className="text-[11px]">Lấy link</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                        {/* CỘT PHẢI: BẢN THÔI MIÊN TIỀM THỨC */}
                                        <div className={`bg-white rounded-2xl sm:rounded-3xl border border-purple-200/90 shadow-sm overflow-hidden flex flex-col ${
                                            mobileProductTab === "hypnosis" ? "flex" : "hidden lg:flex"
                                        }`}>
                                            {/* Column Header */}
                                            <div className="p-3.5 sm:p-5 bg-gradient-to-r from-purple-50/80 via-white to-white border-b border-purple-100 space-y-2.5 sm:space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-950/20 shrink-0">
                                                            <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm sm:text-base font-black text-purple-950 flex items-center gap-2">
                                                                <span>Bản Thôi Miên Tiềm Thức</span>
                                                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] sm:text-[11px] font-black">
                                                                    {hypnosisTracks.length}
                                                                </span>
                                                            </h4>
                                                            <p className="text-[11px] sm:text-xs text-slate-500">Bản thu âm trị liệu tiềm thức & cài đặt tư duy</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Link toàn bộ danh mục thôi miên */}
                                                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-purple-100/90 shadow-sm flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-purple-950 text-[11px] sm:text-xs block truncate">🌙 Link Danh Mục Toàn Bộ Thôi Miên</span>
                                                        <span className="text-[9px] sm:text-[10px] text-purple-400 truncate block">/thoi-mien?ref={currentAffCode}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(`${origin}/thoi-mien?ref=${currentAffCode}`, "cat-hypnosis")}
                                                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-50 hover:bg-purple-700 hover:text-white text-purple-700 border border-purple-200/80 font-black text-[11px] sm:text-xs shrink-0 transition-all flex items-center gap-1"
                                                    >
                                                        {copiedKey === "cat-hypnosis" ? (
                                                            <>
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Đã chép</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" />
                                                                <span>Lấy link</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Ô tìm kiếm thôi miên */}
                                                <div className="relative">
                                                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={hypnosisSearch}
                                                        onChange={(e) => setHypnosisSearch(e.target.value)}
                                                        placeholder="Tìm bản thôi miên theo tiêu đề, tác giả..."
                                                        className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-[11px] sm:text-xs rounded-xl border border-purple-200 bg-purple-50/40 focus:bg-white focus:border-purple-600 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Danh sách thôi miên */}
                                            <div className="p-2 sm:p-4 divide-y divide-slate-100 max-h-[380px] sm:max-h-[500px] overflow-y-auto">
                                                {filteredHypnosisTracks.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 text-xs font-medium">
                                                        {hypnosisSearch ? "Không tìm thấy bản thôi miên nào phù hợp" : "Chưa có bản thôi miên nào"}
                                                    </div>
                                                ) : (
                                                    filteredHypnosisTracks.map((t) => {
                                                        const rawPrice = t.price;
                                                        const trackPrice = typeof rawPrice === 'number' ? rawPrice : (Number(String(rawPrice || 0).replace(/\D/g, '')) || 0);
                                                        const isFixed = t.affiliateCommissionType === 'fixed' && Number(t.affiliateCommissionAmount) > 0;
                                                        const commPercent = affiliate?.customCommissionPercent != null
                                                            ? affiliate.customCommissionPercent
                                                            : (t.affiliateCommissionPercent != null && t.affiliateCommissionPercent !== "" ? Number(t.affiliateCommissionPercent) : (settings?.defaultCommissionPercent || 30));
                                                        const estReward = isFixed ? Number(t.affiliateCommissionAmount) : Math.round((trackPrice * commPercent) / 100);
                                                        const itemLink = `${origin}/thanh-toan/${t.id}?ref=${currentAffCode}`;

                                                        return (
                                                            <div key={`hypnosis-${t.id}`} className="py-2.5 sm:py-3 px-2 rounded-xl hover:bg-purple-50/50 transition-colors flex items-center justify-between gap-2.5">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                                                                            {t.title}
                                                                        </span>
                                                                        {Number(t.affiliateBuyerDiscountPercent) > 0 && (
                                                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-black border border-emerald-200 shrink-0">
                                                                                Mã -{t.affiliateBuyerDiscountPercent}% KH
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                                        <span>Giá bán: <strong className="text-slate-700">{formatPrice(trackPrice)}</strong></span>
                                                                        {t.author && <span className="text-slate-400">• {t.author}</span>}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                                                                    <div className="text-right">
                                                                        <span className="inline-block px-1.5 sm:px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-black text-[11px] sm:text-xs border border-purple-200">
                                                                            {isFixed ? formatPrice(t.affiliateCommissionAmount) : `${commPercent}%`}
                                                                        </span>
                                                                        <div className="text-[10px] sm:text-[11px] font-black text-emerald-600 mt-0.5">
                                                                            +{formatPrice(estReward)}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(itemLink, `hypnosis-${t.id}`)}
                                                                        className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50 hover:text-purple-700 font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all text-slate-700 shrink-0"
                                                                    >
                                                                        {copiedKey === `hypnosis-${t.id}` ? (
                                                                            <>
                                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                                <span className="text-[11px]">Đã chép</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                                <span className="text-[11px]">Lấy link</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: LỊCH SỬ HOA HỒNG */}
                        {activeTab === "commissions" && (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900">Danh Sách Đơn Hàng Ghi Nhận Hoa Hồng</h3>
                                    <button
                                        type="button"
                                        onClick={() => loadAffiliateData(currentUser.uid)}
                                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Làm mới
                                    </button>
                                </div>

                                {commissions.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400">
                                        <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-bold text-sm">Chưa có đơn hàng nào được ghi nhận.</p>
                                        <p className="text-xs mt-1">Hãy chia sẻ link tiếp thị để bắt đầu nhận những khoản hoa hồng đầu tiên!</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                    <th className="pb-3">Mã đơn</th>
                                                    <th className="pb-3">Sản phẩm</th>
                                                    <th className="pb-3">Giá trị đơn</th>
                                                    <th className="pb-3">Tỷ lệ</th>
                                                    <th className="pb-3 text-right">Hoa hồng nhận</th>
                                                    <th className="pb-3 text-center">Nguồn</th>
                                                    <th className="pb-3 text-right">Thời gian</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                                {commissions.map((comm) => (
                                                    <tr key={comm.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3.5 font-bold text-slate-900">
                                                            {comm.orderCode || comm.orderId?.slice(0, 8)}
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
                                )}
                            </div>
                        )}

                        {/* TAB 3: LỊCH SỬ RÚT TIỀN */}
                        {activeTab === "payouts" && (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Lịch Sử Rút Tiền</h3>
                                        <p className="text-xs text-slate-500 font-medium">Theo dõi tiến độ thanh toán hoa hồng từ Mali Edu</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPayoutModalOpen(true)}
                                        disabled={(affiliate.stats?.balance || 0) < (settings?.minPayoutAmount || 200000)}
                                        className="px-5 py-2.5 rounded-xl bg-[#9B2528] text-white font-black text-xs shadow-md hover:bg-[#7E1E21] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        + Rút tiền mới
                                    </button>
                                </div>

                                {payouts.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400">
                                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-bold text-sm">Chưa có yêu cầu rút tiền nào.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                    <th className="pb-3">Mã yêu cầu</th>
                                                    <th className="pb-3">Số tiền</th>
                                                    <th className="pb-3">Ngân hàng nhận</th>
                                                    <th className="pb-3">Trạng thái</th>
                                                    <th className="pb-3 text-right">Ngày yêu cầu</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                                {payouts.map((pay) => (
                                                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3.5 font-bold text-slate-900 text-xs">
                                                            #{pay.id.slice(0, 8)}
                                                        </td>
                                                        <td className="py-3.5 font-black text-slate-900">
                                                            {formatPrice(pay.amount || 0)}
                                                        </td>
                                                        <td className="py-3.5 text-xs text-slate-600">
                                                            <div>{pay.bankInfo?.bankName} - {pay.bankInfo?.accountNumber}</div>
                                                            <div className="text-[10px] text-slate-400">{pay.bankInfo?.accountHolder}</div>
                                                        </td>
                                                        <td className="py-3.5">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                                                pay.status === "completed"
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : pay.status === "rejected"
                                                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                                            }`}>
                                                                {pay.status === "completed" ? "Đã chuyển khoản" : pay.status === "rejected" ? "Từ chối" : "Đang chờ duyệt"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 text-xs text-slate-400 text-right">
                                                            {formatAffiliateDate(pay.createdAt)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: CÀI ĐẶT NGÂN HÀNG */}
                        {activeTab === "settings" && (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-xl space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Thông Tin Ngân Hàng Nhận Tiền</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Cập nhật tài khoản chính xác để nhận hoa hồng từ Mali Edu</p>
                                </div>

                                <form onSubmit={handleSaveBankInfo} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngân hàng</label>
                                        <select
                                            value={editBankName}
                                            onChange={(e) => setEditBankName(e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-[#9B2528]"
                                        >
                                            {VIETNAM_BANKS.map((b) => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Số tài khoản ngân hàng</label>
                                        <input
                                            type="text"
                                            required
                                            value={editAccountNumber}
                                            onChange={(e) => setEditAccountNumber(e.target.value)}
                                            placeholder="VD: 1903..."
                                            className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên chủ tài khoản (In hoa không dấu)</label>
                                        <input
                                            type="text"
                                            required
                                            value={editAccountHolder}
                                            onChange={(e) => setEditAccountHolder(e.target.value.toUpperCase())}
                                            placeholder="NGUYEN VAN A"
                                            className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#9B2528] uppercase"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSavingBank}
                                        className="h-12 px-6 rounded-xl bg-[#9B2528] text-white font-black text-xs hover:bg-[#7E1E21] transition-all disabled:opacity-50 flex items-center gap-2 mt-4"
                                    >
                                        {isSavingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        <span>Lưu thông tin ngân hàng</span>
                                    </button>
                                </form>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* MODAL YÊU CẦU RÚT TIỀN */}
            {isPayoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-[#9B2528]" />
                                Yêu Cầu Rút Tiền
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsPayoutModalOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="text-xs font-bold text-slate-400">Số dư khả dụng:</div>
                            <div className="text-2xl font-black text-[#9B2528]">
                                {formatPrice(affiliate?.stats?.balance || 0)}
                            </div>
                        </div>

                        <form onSubmit={handlePayoutSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Số tiền muốn rút (VNĐ) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={settings?.minPayoutAmount || 200000}
                                    max={affiliate?.stats?.balance || 0}
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder={`Tối thiểu ${formatPrice(settings?.minPayoutAmount || 200000)}`}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 font-black text-slate-900 text-lg outline-none focus:border-[#9B2528]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Ghi chú (Tùy chọn)
                                </label>
                                <textarea
                                    value={payoutNote}
                                    onChange={(e) => setPayoutNote(e.target.value)}
                                    rows="2"
                                    placeholder="Lời nhắn tới Admin..."
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#9B2528]"
                                />
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-50 text-[11px] font-semibold text-amber-900">
                                Tiền sẽ được chuyển về tài khoản: <strong>{affiliate?.bankInfo?.bankName} - {affiliate?.bankInfo?.accountNumber} ({affiliate?.bankInfo?.accountHolder})</strong>.
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPayoutModalOpen(false)}
                                    className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPayout}
                                    className="flex-1 h-12 rounded-xl bg-[#9B2528] text-white font-black text-xs shadow-md hover:bg-[#7E1E21] disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {isSubmittingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi Yêu Cầu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Auth Modal if user clicks login */}
            {isAuthModalOpen && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AffiliatePortal;
