import React, { useState, useEffect } from "react";
import { crmFirestore, crmRealtimeDB } from "../../firebase";
import { toast } from "react-hot-toast";
import {
    deleteLandingWithSource,
    getAdminLandingWorkspace,
    repairAdminLandingSources,
    saveLandingWithSource,
    saveSharedLandingSchedule,
    updateLandingRoutingBatch,
} from "../../services/adminLandingService";
import {
    KHOI_THONG_DONG_TIEN_CONFIG,
    KHOI_THONG_SCHEDULE_CONFIG_DOC_ID,
} from "../../landing-templates/khoi-thong-dong-tien/landingConfig";
import {
    Layout, Settings, Save,
    AlertTriangle, CheckCircle,
    Plus, Trash2, Globe, Zap, Edit2, LayoutList,
    UserCheck, Filter as FilterIcon, Link, Eye, Copy,
    Users, TrendingUp, Search, Database, RefreshCw,
    Calendar, Laptop, Star, MoreVertical, X, ArrowUpRight,
    Clock3, ShieldCheck
} from "lucide-react";

const DEFAULT_SCHEDULE_LOCAL = KHOI_THONG_DONG_TIEN_CONFIG.eventStart.slice(0, 16);
const DEFAULT_SCHEDULE_LABEL = KHOI_THONG_DONG_TIEN_CONFIG.ctaScheduleLabel;

const AdminLandings = () => {
    const [landings, setLandings] = useState([]);
    const [courses, setCourses] = useState([]);
    const [crmUsers, setCrmUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEditId, setActiveEditId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [scheduleConfig, setScheduleConfig] = useState({
        eventStart: DEFAULT_SCHEDULE_LOCAL,
        ctaScheduleLabel: DEFAULT_SCHEDULE_LABEL,
        thankYouCountdownSeconds: "300",
        thankYouZaloLink: "",
    });
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [isSavingLanding, setIsSavingLanding] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [courseKDrafts, setCourseKDrafts] = useState({});
    const [sourceConfigs, setSourceConfigs] = useState({});
    const [formError, setFormError] = useState("");
    const [isRepairingSources, setIsRepairingSources] = useState(false);

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
        thankYouZaloLink: "",
        fbPixel: "",
        fbCurrency: "VND",
        fbEventValue: "0",
        course_k: "K41"
    });
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedK, setSelectedK] = useState("");
    const [isQuickEditing, setIsQuickEditing] = useState(false);
    const [quickEditK, setQuickEditK] = useState("");
    const [utmBuilder, setUtmBuilder] = useState({ leaderEmail: "", customSlug: "" });

    const slugify = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');
    const normalizeIdentity = (text = "") => String(text || "").trim().toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
    const createUtmSlug = (text = "") => normalizeIdentity(text).replace(/[^a-z0-9]/g, "");
    const isLeaderOwner = (user = {}) => {
        const role = normalizeIdentity(user.role || "").toUpperCase();
        const team = normalizeIdentity(user.team || "").toUpperCase();
        const title = normalizeIdentity(user.title || user.position || "").toUpperCase();
        if (role === "LEADER" || role === "MENTOR_VIP") return true;
        if (role.includes("SALE_LEADER") || role.includes("TRUONG SALE")) return false;
        if (role.includes("LEADER") && !role.includes("SALE")) return true;
        if (team.includes("LEADER") && !team.includes("SALE")) return true;
        if (title.includes("LEADER") && !title.includes("SALE")) return true;
        return false;
    };
    const crmLeaderUsers = crmUsers.filter(isLeaderOwner);

    const FUNNEL_OPTIONS = [
        { value: "ads", target: "ADS", label: "Phễu ADS", tone: "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE] focus:border-[#4F46E5]" },
        { value: "leader", target: "LEADER", label: "Phễu Leader", tone: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] focus:border-[#047857]" },
        { value: "brand", target: "BRAND", label: "Phễu Brand", tone: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] focus:border-[#B45309]" },
        { value: "organic", target: "ADS", label: "Web / Organic", tone: "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] focus:border-[#475569]" },
    ];

    const normalizeFunnelType = (value = "ads") => {
        const text = String(value || "ads").trim().toLowerCase();
        if (text.includes("leader")) return "leader";
        if (text.includes("brand") || text.includes("thuong_hieu") || text.includes("thương_hiệu")) return "brand";
        if (text.includes("organic") || text.includes("web")) return "organic";
        return "ads";
    };

    const getCrmTargetFunnel = (value = "ads") => {
        const normalized = normalizeFunnelType(value);
        return FUNNEL_OPTIONS.find((item) => item.value === normalized)?.target || "ADS";
    };

    const getFunnelOption = (value = "ads") =>
        FUNNEL_OPTIONS.find((item) => item.value === normalizeFunnelType(value)) || FUNNEL_OPTIONS[0];

    const getLandingFunnelType = (landing = {}) =>
        normalizeFunnelType(landing.funnel_type || landing.targetFunnel || "ads");

    const normalizeDatetimeLocal = (value = DEFAULT_SCHEDULE_LOCAL) => String(value || DEFAULT_SCHEDULE_LOCAL).slice(0, 16);

    const getSelectedUtmLeader = () =>
        crmLeaderUsers.find((user) => user.email === utmBuilder.leaderEmail) || null;

    const getLeaderUtmSlug = () => {
        const selectedLeader = getSelectedUtmLeader();
        return createUtmSlug(utmBuilder.customSlug || selectedLeader?.name || "");
    };

    const getLeaderUtmLink = () => {
        const slug = getLeaderUtmSlug();
        if (!slug || !form.slug) return "";

        const url = new URL(form.slug.startsWith("/") ? form.slug : `/${form.slug}`, "https://luathapdan.vn");
        url.searchParams.set("utm_source", slug);
        url.searchParams.set("utm_medium", "leader");
        url.searchParams.set("utm_campaign", `${form.active_source_key || "leader"}_${slug}`);
        url.searchParams.set("leader", slug);
        url.hash = "dang-ky";
        return url.toString();
    };

    const handleCopyLeaderUtmLink = async () => {
        const link = getLeaderUtmLink();
        if (!link) return toast.error("Chọn Leader và nhập slug landing trước.");
        await navigator.clipboard.writeText(link);
        toast.success("Đã copy link UTM Leader");
    };

    const splitSourceKeyBatch = (sourceKey = "") => {
        const key = String(sourceKey || "").trim().replace(/\s+/g, "_").toLowerCase();
        const match = key.match(/^(.*?)(_k\d+)$/i);
        if (!match) return { base: key, suffix: "" };
        return { base: match[1], suffix: match[2].toLowerCase() };
    };

    const buildSourceKeyWithFunnelSegment = (sourceKey, funnelType) => {
        const { base, suffix } = splitSourceKeyBatch(sourceKey);
        const cleanBase = base.replace(/_(ads|leader|brand|organic)(_\d+)?$/i, "");
        const segment = getCrmTargetFunnel(funnelType).toLowerCase();
        return `${cleanBase}_${segment}${suffix}`;
    };

    const hasDuplicateSourceKey = (sourceKey, currentId, reservedKeys = new Set()) => {
        const normalized = String(sourceKey || "").trim().toLowerCase();
        if (!normalized) return false;
        if (reservedKeys.has(normalized)) return true;
        return landings.some((landing) =>
            landing.id !== currentId &&
            String(landing.active_source_key || "").trim().toLowerCase() === normalized
        );
    };

    const getUniqueSourceKey = (candidate, funnelType, currentId, reservedKeys = new Set()) => {
        const normalizedCandidate = String(candidate || "organic_web").trim().replace(/\s+/g, "_").toLowerCase();
        if (!hasDuplicateSourceKey(normalizedCandidate, currentId, reservedKeys)) {
            return { sourceKey: normalizedCandidate, changed: false };
        }

        const { base, suffix } = splitSourceKeyBatch(buildSourceKeyWithFunnelSegment(normalizedCandidate, funnelType));
        let nextKey = `${base}${suffix}`;
        let index = 2;

        while (hasDuplicateSourceKey(nextKey, currentId, reservedKeys)) {
            const cleanBase = base.replace(/_\d+$/i, "");
            nextKey = `${cleanBase}_${index}${suffix}`;
            index += 1;
        }

        return { sourceKey: nextKey, changed: true };
    };

    const refreshCrmData = async ({ notify = true, showLoading = true } = {}) => {
        if (showLoading) setIsLoading(true);
        try {
            const workspace = await getAdminLandingWorkspace({
                firestore: crmFirestore,
                realtimeDatabase: crmRealtimeDB,
                scheduleDocumentId: KHOI_THONG_SCHEDULE_CONFIG_DOC_ID,
            });
            setCourses(workspace.courses || []);
            setCrmUsers(workspace.crmUsers || []);
            setLandings(workspace.landings || []);
            setSourceConfigs(workspace.sourceConfigs || {});

            const data = workspace.schedule;
            if (data) {
                const remoteEventStartMs = new Date(data.eventStart).getTime();
                const defaultEventStartMs = new Date(KHOI_THONG_DONG_TIEN_CONFIG.eventStart).getTime();
                const hasCurrentRemoteSchedule = Number.isFinite(remoteEventStartMs) && remoteEventStartMs >= defaultEventStartMs;

                setScheduleConfig({
                    eventStart: hasCurrentRemoteSchedule ? normalizeDatetimeLocal(data.eventStart) : DEFAULT_SCHEDULE_LOCAL,
                    ctaScheduleLabel: hasCurrentRemoteSchedule ? data.ctaScheduleLabel || DEFAULT_SCHEDULE_LABEL : DEFAULT_SCHEDULE_LABEL,
                    thankYouCountdownSeconds: String(data.thankYouCountdownSeconds || 300),
                    thankYouZaloLink: data.thankYouZaloLink || data.zaloLink || "",
                });
            }
            if (notify) toast.success("Đã đồng bộ dữ liệu Khóa K từ CRM!");
        } catch (e) {
            toast.error("Lỗi đồng bộ: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveScheduleConfig = async () => {
        setIsSavingSchedule(true);
        try {
            const result = await saveSharedLandingSchedule({
                firestore: crmFirestore,
                documentId: KHOI_THONG_SCHEDULE_CONFIG_DOC_ID,
                schedule: {
                    eventStart: scheduleConfig.eventStart ? `${scheduleConfig.eventStart}:00+07:00` : "",
                    ctaScheduleLabel: scheduleConfig.ctaScheduleLabel,
                    thankYouCountdownSeconds: scheduleConfig.thankYouCountdownSeconds,
                    thankYouZaloLink: scheduleConfig.thankYouZaloLink,
                },
            });
            setScheduleConfig((prev) => ({
                ...prev,
                thankYouCountdownSeconds: String(result.thankYouCountdownSeconds),
            }));
            toast.success("Đã lưu lịch học chung cho 3 phễu!");
        } catch (e) {
            toast.error("Lỗi lưu lịch học chung: " + e.message);
        } finally {
            setIsSavingSchedule(false);
        }
    };

    useEffect(() => {
        refreshCrmData({ notify: false });
    // Workspace loading is intentionally established once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredLandings = landings.filter(l => {
        // Tab logic: "ALL" hiện mọi LP, các tab khác lọc theo funnel_type
        const landingFunnelType = getLandingFunnelType(l);
        const matchTab = activeTab === "ALL" || landingFunnelType === activeTab.toLowerCase();
        const matchSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.slug.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    const handleEdit = (landing) => {
        setActiveEditId(landing.id);
        setShowCreateForm(true);
        setFormError("");
        const mappingData = sourceConfigs[landing.active_source_key] || {};

        setForm({
            ...landing,
            targetFunnel: landing.targetFunnel || mappingData.targetFunnel || "ADS",
            funnel_type: normalizeFunnelType(landing.funnel_type || mappingData.funnel_type || landing.targetFunnel || "ads"),
            assignedSale: mappingData.assignedSale || "Round Robin",
            zaloLink: mappingData.targetZalo || landing.zaloLink || "",
            thankYouZaloLink: landing.thankYouZaloLink || landing.zaloLink || "",
            fbPixel: landing.fbPixel || "",
            fbCurrency: landing.fbCurrency || "VND",
            fbEventValue: String(landing.fbEventValue ?? 0),
            course_k: landing.course_k || "K41"
        });

        const parts = landing.active_source_key.split('_');
        setSelectedCourseId(mappingData.targetCourseId || landing.targetCourseId || parts[0]);
        setSelectedK(mappingData.targetK || landing.course_k || "");
        setUtmBuilder({ leaderEmail: "", customSlug: "" });
    };

    const handleAddNew = () => {
        setActiveEditId("new");
        setShowCreateForm(true);
        setFormError("");
        setForm({
            name: "",
            slug: "",
            active_source_key: "organic_web",
            is_maintenance: false,
            targetFunnel: "ADS",
            funnel_type: "ads",
            assignedSale: "Round Robin",
            zaloLink: "",
            thankYouZaloLink: "",
            fbPixel: "",
            fbCurrency: "VND",
            fbEventValue: "0",
            course_k: "K41"
        });
        setSelectedCourseId("");
        setSelectedK("");
        setUtmBuilder({ leaderEmail: "", customSlug: "" });
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
        
        // Cập nhật mã nguồn tự động
        if (selectedCourseId) {
            const course = courses.find(c => String(c.id) === String(selectedCourseId));
            const keyBase = course ? (course.id.length > 15 ? slugify(course.name) : course.id) : selectedCourseId;
            
            const nextSourceKey = `${keyBase}_${kVal.toLowerCase()}`;
            setForm(prev => ({ 
                ...prev, 
                course_k: kVal,
                active_source_key: nextSourceKey 
            }));
            console.log(`[AdminLandings] ⚡ Auto-generated preview: ${nextSourceKey}`);
        } else {
            setForm(prev => ({ ...prev, course_k: kVal }));
        }
    };

    const handleSave = async () => {
        if (isSavingLanding) return;

        setFormError("");
        if (!String(form.name || "").trim()) {
            setFormError("Vui lòng nhập tên Landing Page.");
            return;
        }
        if (!String(form.slug || "").trim()) {
            setFormError("Vui lòng nhập đường dẫn Landing.");
            return;
        }
        if (!selectedCourseId) {
            setFormError("Vui lòng chọn khóa học để đồng bộ CRM.");
            return;
        }
        if (!/^K\d+$/.test(String(form.course_k || "").trim().toUpperCase())) {
            setFormError("Khóa K phải có định dạng như K51.");
            return;
        }

        const id = activeEditId === "new" ? slugify(form.name) : activeEditId;
        const funnelType = normalizeFunnelType(form.funnel_type || form.targetFunnel || "ads");
        let sourceKey = String(form.active_source_key || "organic_web").trim();
        const currentK = (form.course_k || "K41").toLowerCase().replace(/k/g, "");
        const suffix = `_k${currentK}`;

        if (!sourceKey.toLowerCase().match(/_k\d+$/i)) {
            sourceKey = `${sourceKey}${suffix}`;
        }

        const uniqueResult = getUniqueSourceKey(sourceKey, funnelType, id);
        sourceKey = uniqueResult.sourceKey;

        setIsSavingLanding(true);
        try {
            if (uniqueResult.changed) {
                toast(`Mã nguồn bị trùng, đã tự đổi thành: ${sourceKey}`);
            }

            const savedLanding = await saveLandingWithSource({
                firestore: crmFirestore,
                input: {
                    landingId: id,
                    name: form.name,
                    slug: form.slug,
                    sourceKey,
                    isMaintenance: form.is_maintenance,
                    funnelType,
                    targetCourseId: selectedCourseId,
                    targetK: selectedK || form.course_k,
                    courseK: form.course_k,
                    zaloLink: form.zaloLink,
                    thankYouZaloLink: form.thankYouZaloLink,
                    fbPixel: form.fbPixel,
                    fbCurrency: form.fbCurrency,
                    fbEventValue: form.fbEventValue,
                },
            });

            setForm((current) => ({
                ...current,
                slug: savedLanding.slug,
                active_source_key: savedLanding.sourceKey,
                course_k: savedLanding.courseK,
            }));
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success(`Đã lưu Landing và CRM! Mã nguồn: ${savedLanding.sourceKey}`);
            setShowCreateForm(false);
            setActiveEditId(null);
        } catch (e) {
            const message = e.message || "Không thể lưu Landing Page.";
            setFormError(message);
            toast.error(message);
        } finally {
            setIsSavingLanding(false);
        }
    };

    const closeLandingEditor = () => {
        if (isSavingLanding) return;
        setShowCreateForm(false);
        setActiveEditId(null);
        setFormError("");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa Landing Page và cấu hình nguồn liên quan?")) return;

        try {
            await deleteLandingWithSource({ firestore: crmFirestore, landingId: id });
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success("Đã xóa Landing và cấu hình nguồn!");
        } catch (e) {
            toast.error("Lỗi xóa: " + e.message);
        }
    };

    const handleQuickFunnelChange = async (landingId, nextFunnelType) => {
        const landing = landings.find((item) => item.id === landingId);
        if (!landing) return;

        const funnelType = normalizeFunnelType(nextFunnelType);
        const uniqueResult = getUniqueSourceKey(landing.active_source_key || "organic_web", funnelType, landingId);

        try {
            await updateLandingRoutingBatch({
                firestore: crmFirestore,
                updates: [{
                    landingId,
                    sourceKey: uniqueResult.sourceKey,
                    funnelType,
                }],
            });
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success(uniqueResult.changed
                ? `Đã đổi phễu và tách mã: ${uniqueResult.sourceKey}`
                : "Đã cập nhật phễu đích và CRM");
        } catch (e) {
            toast.error("Lỗi cập nhật phễu: " + e.message);
        }
    };

    if (isLoading && landings.length === 0) {
        return (
            <div className="min-h-[520px] bg-[#F5F7FB] p-4 md:p-8" aria-busy="true" aria-label="Đang tải danh sách landing page">
                <div className="mx-auto max-w-[1680px] animate-pulse space-y-5">
                    <div className="h-40 rounded-[28px] bg-slate-200" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl bg-white" />)}
                    </div>
                    <div className="h-56 rounded-2xl bg-white" />
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "ALL", label: "Tất cả", icon: Layout },
        { id: "ADS", label: "Phễu ADS", icon: TrendingUp, color: "indigo" },
        { id: "LEADER", label: "Phễu Leader", icon: Users, color: "emerald" },
        { id: "BRAND", label: "Phễu Brand", icon: Globe, color: "amber" },
        { id: "ORGANIC", label: "Web/Organic", icon: Globe, color: "amber" }
    ];

    const handleQuickEditKAll = async () => {
        if (!quickEditK) return toast.error("Vui lòng nhập Khóa K mới!");
        if (!window.confirm(`Đồng bộ TOÀN BỘ Landing Page sang ${quickEditK}?`)) return;

        setIsLoading(true);
        const suffix = `_k${quickEditK.toLowerCase().replace('k', '')}`;
        try {
            const reservedKeys = new Set();
            const updates = landings.map((l) => {
                const base = String(l.active_source_key || "").split('_k')[0];
                const funnelType = getLandingFunnelType(l);
                const uniqueResult = getUniqueSourceKey(`${base}${suffix}`, funnelType, l.id, reservedKeys);
                const newKey = uniqueResult.sourceKey;
                reservedKeys.add(newKey);
                return {
                    landingId: l.id,
                    sourceKey: newKey,
                    funnelType,
                    courseK: quickEditK,
                };
            });
            await updateLandingRoutingBatch({ firestore: crmFirestore, updates });
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success("Đã đồng bộ khóa K cho Landing và CRM!");
            setIsQuickEditing(false);
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickEditSingleK = async (landingId, newK) => {
        const landing = landings.find(l => l.id === landingId);
        if (!landing) return;

        const normalizedK = String(newK || "").trim().toUpperCase();
        const currentK = String(landing.course_k || "").trim().toUpperCase();
        const clearDraft = () => setCourseKDrafts((current) => {
            const next = { ...current };
            delete next[landingId];
            return next;
        });

        if (normalizedK === currentK) {
            clearDraft();
            return;
        }
        if (!/^K\d+$/.test(normalizedK)) {
            toast.error("Khóa K phải có định dạng như K51.");
            clearDraft();
            return;
        }

        const base = String(landing?.active_source_key || "").split('_k')[0];
        const suffix = `_k${normalizedK.toLowerCase().replace('k', '')}`;
        const funnelType = getLandingFunnelType(landing);
        const newKey = getUniqueSourceKey(`${base}${suffix}`, funnelType, landingId).sourceKey;

        try {
            await updateLandingRoutingBatch({
                firestore: crmFirestore,
                updates: [{ landingId, sourceKey: newKey, funnelType, courseK: normalizedK }],
            });
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success(`Đã chuyển Landing sang ${normalizedK}.`);
        } catch (e) {
            toast.error("Lỗi cập nhật khóa K: " + e.message);
        } finally {
            clearDraft();
        }
    };

    const handleRestoreStandardCodes = async () => {
        if (!window.confirm("Khôi phục mã chuẩn (Ads: 03248, Leader: 83248)?")) return;
        setIsLoading(true);
        try {
            const reservedKeys = new Set();
            const updates = landings.map((l) => {
                let base = String(l.active_source_key || "").split('_k')[0];
                const kSuffix = `_k${(l.course_k || "K41").toLowerCase().replace('k', '')}`;
                
                const name = l.name?.toLowerCase() || "";
                const slug = String(l.slug || "").toLowerCase();
                const funnelType = name.includes("leader") || slug.includes("leader")
                    ? "leader"
                    : getLandingFunnelType(l);
                if (funnelType === "leader") base = "1768973783248";
                else if (funnelType === "ads" || name.includes("chính") || name.includes("ads")) base = "1768973703248";
                const uniqueResult = getUniqueSourceKey(`${base}${kSuffix}`, funnelType, l.id, reservedKeys);
                const nextSourceKey = uniqueResult.sourceKey;
                reservedKeys.add(nextSourceKey);
                return {
                    landingId: l.id,
                    sourceKey: nextSourceKey,
                    funnelType,
                    courseK: l.course_k || "K41",
                };
            });
            await updateLandingRoutingBatch({ firestore: crmFirestore, updates });
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success("Đã khôi phục mã nguồn chuẩn cho các phễu!");
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRepairSourceConfigs = async () => {
        if (isRepairingSources) return;
        setIsRepairingSources(true);
        try {
            const preview = await repairAdminLandingSources({ firestore: crmFirestore, apply: false });
            const summary = preview.summary || {};
            if (summary.conflicts > 0) {
                toast.error(`Có ${summary.conflicts} mã nguồn đang bị nhiều Landing dùng chung. Vui lòng tách mã trước.`);
                return;
            }

            const repairable = Number(summary.claimable || 0) + Number(summary.orphans || 0);
            if (repairable === 0) {
                const suffix = summary.missingSources
                    ? ` Còn ${summary.missingSources} Landing thiếu cấu hình nguồn và cần mở chỉnh sửa để bổ sung.`
                    : "";
                toast.success(`Dữ liệu Landing và CRM đang nhất quán.${suffix}`);
                return;
            }

            const confirmed = window.confirm(
                `Tìm thấy ${summary.claimable || 0} cấu hình cần gắn lại và ${summary.orphans || 0} cấu hình mồ côi có chủ sở hữu cũ. Tiến hành sửa?`,
            );
            if (!confirmed) return;

            const result = await repairAdminLandingSources({ firestore: crmFirestore, apply: true });
            await refreshCrmData({ notify: false, showLoading: false });
            toast.success(
                `Đã gắn lại ${result.summary?.claimable || 0} và xóa ${result.summary?.orphans || 0} cấu hình mồ côi.`,
            );
        } catch (error) {
            toast.error("Không thể rà soát cấu hình nguồn: " + error.message);
        } finally {
            setIsRepairingSources(false);
        }
    };

    return (
        <div className="relative min-h-full bg-[#F5F7FB] text-slate-900">
            {/* CREATE / EDIT DRAWER */}
            {showCreateForm && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-[100000] cursor-default bg-slate-950/35 backdrop-blur-[2px]"
                        aria-label="Đóng bảng cấu hình landing"
                        onClick={closeLandingEditor}
                    />
                    <aside
                        className="fixed inset-y-0 right-0 z-[100001] flex h-[100dvh] w-full max-w-[620px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
                        aria-label={activeEditId === "new" ? "Tạo Landing Page" : "Chỉnh sửa Landing"}
                    >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="z-10 shrink-0 border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-[#602020] p-5 text-white shadow-lg md:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-sm">
                                    <Layout size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold tracking-tight md:text-xl">
                                        {activeEditId === "new" ? "Tạo Landing Page" : "Chỉnh sửa Landing"}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-white/65">Cấu hình nội dung và đồng bộ dữ liệu CRM</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={closeLandingEditor}
                                disabled={isSavingLanding}
                                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                                aria-label="Đóng"
                            >
                                <X size={19} />
                            </button>
                        </div>
                    </div>

                    <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 md:p-6">
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
                                    required
                                    aria-label="Tên Landing Page"
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
                                    required
                                    aria-label="Đường dẫn Landing"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-mono"
                                    placeholder="/dang-ky-khoa-hoc"
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">URL: https://luathapdan.vn{form.slug}</p>
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
                                    required
                                    aria-label="Khóa học đồng bộ CRM"
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
                                        onClick={() => refreshCrmData()}
                                        className="text-[10px] flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold bg-white px-2 py-1 rounded-md border border-emerald-100 shadow-sm"
                                        title="Tải lại danh sách từ CRM"
                                    >
                                        <RefreshCw size={10} />
                                        Làm mới dữ liệu từ CRM
                                    </button>
                                </div>
                                <select
                                    required
                                    aria-label="Khóa K"
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
                                    required
                                    aria-label="Phân loại Landing"
                                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white outline-none transition-all text-sm font-bold cursor-pointer ${
                                        form.funnel_type === 'leader' 
                                        ? 'border-emerald-500 ring-4 ring-emerald-100 text-emerald-700' 
                                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                                    }`}
                                    value={form.funnel_type || (form.targetFunnel ? form.targetFunnel.toLowerCase() : "ads")}
                                    onChange={e => setForm({ ...form, funnel_type: e.target.value, targetFunnel: getCrmTargetFunnel(e.target.value) })}
                                >
                                    <option value="ads">⚡ Phễu ADS (Mặc định)</option>
                                    <option value="leader">⭐ Phễu LEADER (Cấu hình Riêng)</option>
                                    <option value="brand">Phễu BRAND</option>
                                    <option value="organic">🌐 Web / Organic</option>
                                </select>
                                {form.funnel_type === 'leader' && (
                                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                                            <strong>CRM:</strong> Lead Leader được gán theo UTM/người giới thiệu trên form. Sale và chia vòng tròn chỉ áp dụng cho phễu ADS.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {form.funnel_type === 'leader' ? (
                                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center gap-2">
                                        <Link size={16} className="text-emerald-600" />
                                        <h4 className="text-sm font-bold text-emerald-800">Link UTM Leader</h4>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Người giới thiệu</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm font-medium cursor-pointer"
                                            value={utmBuilder.leaderEmail}
                                            onChange={e => {
                                                const leader = crmLeaderUsers.find((item) => item.email === e.target.value);
                                                setUtmBuilder({
                                                    leaderEmail: e.target.value,
                                                    customSlug: leader ? createUtmSlug(leader.name) : "",
                                                });
                                            }}
                                        >
                                            <option value="">-- Chọn Leader --</option>
                                            {crmLeaderUsers.map(u => (
                                                <option key={u.email || u.name} value={u.email}>{u.name} ({u.team || u.role})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Mã UTM tùy chỉnh</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm font-mono"
                                            placeholder="thanhseven"
                                            value={utmBuilder.customSlug}
                                            onChange={e => setUtmBuilder({ ...utmBuilder, customSlug: createUtmSlug(e.target.value) })}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-emerald-200 bg-white text-[11px] font-mono text-slate-600"
                                            value={getLeaderUtmLink()}
                                            placeholder="https://luathapdan.vn/..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCopyLeaderUtmLink}
                                            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                                        >
                                            <Copy size={14} />
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Sale phụ trách</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">CRM tự chia theo tỷ lệ của từng phễu.</p>
                                    <p className="mt-1 text-xs text-slate-500">Website chỉ gửi mã nguồn, khóa K và đích đến phễu; không gán sale tại màn Landing.</p>
                                </div>
                            )}

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
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Link Zalo trang cảm ơn</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                                    placeholder="Để trống sẽ dùng Link Zalo Group"
                                    value={form.thankYouZaloLink || ""}
                                    onChange={e => setForm({ ...form, thankYouZaloLink: e.target.value })}
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
                                    type="button"
                                    onClick={() => setForm({ ...form, is_maintenance: !form.is_maintenance })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${form.is_maintenance ? 'bg-red-500' : 'bg-slate-300'}`}
                                    aria-pressed={form.is_maintenance}
                                    aria-label="Bật hoặc tắt chế độ bảo trì"
                                >
                                    <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${form.is_maintenance ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-12px_35px_rgba(15,23,42,0.08)] backdrop-blur md:px-6">
                        {formError ? (
                            <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700" role="alert">
                                {formError}
                            </p>
                        ) : (
                            <p className="mb-2 text-center text-[10px] font-semibold text-slate-400">
                                Landing và cấu hình CRM sẽ được lưu đồng thời, không tách rời.
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSavingLanding}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B2E2E] py-3.5 text-sm font-bold uppercase text-white shadow-[0_10px_28px_rgba(139,46,46,0.28)] transition-all hover:bg-[#722525] hover:shadow-[0_14px_34px_rgba(139,46,46,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSavingLanding ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSavingLanding
                                ? "Đang lưu và đồng bộ..."
                                : activeEditId === "new" ? "Tạo Landing Page" : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
                    </aside>
                </>
            )}

            {/* PAGE CONTENT */}
            <main className="mx-auto w-full max-w-[1680px] p-4 pb-12 md:p-6 lg:p-8">
                {/* Page header */}
                <section className="relative mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-[#5f2020] px-5 py-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.16)] md:px-7 md:py-7">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-rose-400/10 blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 sm:flex">
                                <Globe size={27} />
                            </div>
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-100">
                                    <ShieldCheck size={13} /> Trung tâm quản lý phễu
                                </div>
                                <h1 className="text-2xl font-black tracking-tight md:text-3xl">Landing Pages</h1>
                                <p className="mt-1 max-w-2xl text-xs leading-5 text-white/60 md:text-sm">
                                    Quản lý lịch học, nguồn chiến dịch và đích đến CRM tại một nơi.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddNew}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-xl shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:bg-amber-50 lg:w-auto"
                        >
                            <Plus size={18} />
                            Tạo Landing mới
                            <ArrowUpRight size={16} className="text-[#8B2E2E]" />
                        </button>
                    </div>
                    <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:flex sm:flex-wrap sm:gap-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Tổng landing</p>
                            <p className="mt-1 text-lg font-black">{landings.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Đang hoạt động</p>
                            <p className="mt-1 text-lg font-black text-emerald-300">{landings.filter((landing) => !landing.is_maintenance).length}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 text-xs font-semibold text-white/55 sm:ml-auto">
                            <Clock3 size={15} /> Dữ liệu được đồng bộ trực tiếp với CRM
                        </div>
                    </div>
                </section>

                {/* Toolbar: Tabs & Search */}
                <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm md:p-4">
                    <div className="mb-3 flex min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            const count = tab.id === "ALL" 
                                ? landings.length 
                                : landings.filter(l => getLandingFunnelType(l) === tab.id.toLowerCase()).length;
                                
                            return (
                                <button
                                    type="button"
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-pressed={isActive}
                                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all md:text-sm ${
                                        isActive
                                            ? 'border-[#8B2E2E]/15 bg-[#8B2E2E]/[0.07] text-[#8B2E2E] shadow-sm'
                                            : 'border-transparent bg-slate-50 text-slate-500 hover:border-slate-200 hover:text-slate-800'
                                    }`}
                                >
                                    <tab.icon size={16} className={isActive ? "text-[#8B2E2E]" : "text-slate-400"} />
                                    {tab.label}
                                    <span className={`ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                        isActive ? 'bg-[#8B2E2E] text-white' : 'bg-white text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm landing page..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#8B2E2E]/40 focus:bg-white focus:ring-4 focus:ring-[#8B2E2E]/[0.07]"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Lịch học chung 3 phễu */}
                <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-5">
                    <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-[#8B2E2E]/10 bg-[#8B2E2E]/[0.06] p-2.5 text-[#8B2E2E]">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm md:text-base">Lịch học chung 3 phễu</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Áp dụng cho Landing Page Chính, Leader và Thương hiệu.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleSaveScheduleConfig}
                            disabled={isSavingSchedule}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#8B2E2E] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#8B2E2E]/15 transition-all hover:bg-[#722525] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            <Save size={14} />
                            {isSavingSchedule ? "Đang lưu..." : "Lưu lịch chung"}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Thời gian bắt đầu</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#8B2E2E]/40 focus:bg-white focus:ring-4 focus:ring-[#8B2E2E]/[0.07]"
                                    value={scheduleConfig.eventStart || ""}
                                    onChange={e => setScheduleConfig({ ...scheduleConfig, eventStart: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Dòng thời gian trên nút CTA</label>
                            <input
                                type="text"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#8B2E2E]/40 focus:bg-white focus:ring-4 focus:ring-[#8B2E2E]/[0.07]"
                                placeholder={DEFAULT_SCHEDULE_LABEL}
                                value={scheduleConfig.ctaScheduleLabel || ""}
                                onChange={e => setScheduleConfig({ ...scheduleConfig, ctaScheduleLabel: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Đếm ngược cảm ơn (giây)</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#8B2E2E]/40 focus:bg-white focus:ring-4 focus:ring-[#8B2E2E]/[0.07]"
                                placeholder="300"
                                value={scheduleConfig.thankYouCountdownSeconds || ""}
                                onChange={e => setScheduleConfig({ ...scheduleConfig, thankYouCountdownSeconds: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Link Zalo trang cảm ơn</label>
                            <div className="relative">
                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#8B2E2E]/40 focus:bg-white focus:ring-4 focus:ring-[#8B2E2E]/[0.07]"
                                    placeholder="https://zalo.me/g/..."
                                    value={scheduleConfig.thankYouZaloLink || ""}
                                    onChange={e => setScheduleConfig({ ...scheduleConfig, thankYouZaloLink: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quản lý Nhanh & Đồng bộ Khóa K (Card List Layout) */}
                <div className="mb-6">
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 md:text-lg">
                                <LayoutList size={22} className="text-[#8B2E2E]" />
                                Danh sách Landing
                            </h3>
                            <p className="mt-1 text-xs font-medium text-slate-400">Chỉnh nhanh khóa K, mã nguồn và phễu nhận lead.</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500">Hiển thị {filteredLandings.length}/{landings.length}</p>
                    </div>

                    <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm md:grid-cols-3">
                        <button
                            type="button"
                            onClick={handleRestoreStandardCodes}
                            className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100 md:text-sm"
                            title="Khôi phục mã 03248 (Ads) và 83248 (Leader) dựa theo tên trang"
                        >
                            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                            Sửa mã chuẩn
                        </button>
                        {isQuickEditing ? (
                            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 animate-in fade-in zoom-in duration-200">
                                <input 
                                    type="text" 
                                    placeholder="Khóa K mới"
                                    className="min-w-0 flex-1 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-100"
                                    value={quickEditK}
                                    onChange={e => setQuickEditK(e.target.value.toUpperCase())}
                                />
                                <button 
                                    type="button"
                                    onClick={handleQuickEditKAll}
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                                >
                                    Lưu
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsQuickEditing(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                                    aria-label="Hủy sửa nhanh khóa K"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button"
                                onClick={() => setIsQuickEditing(true)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 md:text-sm"
                            >
                                <Edit2 size={15} />
                                Sửa nhanh Khóa K
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleRepairSourceConfigs}
                            disabled={isRepairingSources}
                            className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-700 transition-all hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                            title="Kiểm tra Landing và source_configs, chỉ xóa cấu hình mồ côi có chủ sở hữu cũ"
                        >
                            <Database size={15} className={isRepairingSources ? "animate-pulse" : ""} />
                            {isRepairingSources ? "Đang rà soát..." : "Rà soát đồng bộ"}
                        </button>
                    </div>

                    {filteredLandings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {filteredLandings.map(landing => {
                                const name = (landing.name || "").toLowerCase();
                                const funnelType = getLandingFunnelType(landing);
                                let iconConfig = {
                                    icon: Globe,
                                    bg: "bg-[#EEF2FF] text-[#6366F1]",
                                };
                                if (funnelType === "leader" || name.includes("leader")) {
                                    iconConfig = {
                                        icon: Laptop,
                                        bg: "bg-[#EEF2FF] text-[#4F46E5]",
                                    };
                                } else if (funnelType === "brand" || name.includes("thương hiệu") || name.includes("brand")) {
                                    iconConfig = {
                                        icon: Star,
                                        bg: "bg-[#FFFBEB] text-[#D97706]",
                                    };
                                }

                                return (
                                    <div 
                                        key={landing.id} 
                                        className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg md:p-5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left side: Icon + Title/URL */}
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/[0.03] ${iconConfig.bg}`}>
                                                    <iconConfig.icon size={22} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <h4 className="truncate text-sm font-extrabold text-slate-900 md:text-base">{landing.name}</h4>
                                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${landing.is_maintenance ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {landing.is_maintenance ? 'Bảo trì' : 'Hoạt động'}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={landing.slug || "#"}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-[#8B2E2E]"
                                                    >
                                                        <span className="truncate">luathapdan.vn{landing.slug}</span>
                                                        <ArrowUpRight size={12} className="shrink-0" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Right side: 3-dots Menu Button */}
                                            <div className="relative shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMenuId(activeMenuId === landing.id ? null : landing.id)}
                                                    className="rounded-xl border border-transparent p-2 text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                                                    aria-label={`Mở thao tác cho ${landing.name}`}
                                                    aria-expanded={activeMenuId === landing.id}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {activeMenuId === landing.id && (
                                                    <>
                                                        <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-20 cursor-default" onClick={() => setActiveMenuId(null)} />
                                                        <div className="absolute right-0 top-11 z-30 w-40 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                                            <button
                                                                onClick={() => {
                                                                    handleEdit(landing);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Edit2 size={14} className="text-slate-400" />
                                                                Sửa chi tiết
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`https://luathapdan.vn${landing.slug}`);
                                                                    toast.success("Đã copy link!");
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Copy size={14} className="text-slate-400" />
                                                                Copy Link
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleDelete(landing.id);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                                                            >
                                                                <Trash2 size={14} className="text-red-400" />
                                                                Xóa Landing
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom row: Khóa K, Mã nguồn, Đích đến (phễu) */}
                                        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                                            {/* Khóa K */}
                                            <div className="flex flex-col items-start w-full min-w-0">
                                                <span className="block text-[11px] font-semibold text-slate-400 mb-1 tracking-tight truncate w-full">Khóa K</span>
                                                <input 
                                                    type="text"
                                                    value={courseKDrafts[landing.id] ?? landing.course_k ?? ""}
                                                    onChange={(e) => setCourseKDrafts((current) => ({
                                                        ...current,
                                                        [landing.id]: e.target.value.toUpperCase(),
                                                    }))}
                                                    onBlur={(e) => handleQuickEditSingleK(landing.id, e.currentTarget.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") e.currentTarget.blur();
                                                        if (e.key === "Escape") {
                                                            setCourseKDrafts((current) => {
                                                                const next = { ...current };
                                                                delete next[landing.id];
                                                                return next;
                                                            });
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    className="w-full rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-2 text-center text-xs font-black uppercase text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-100"
                                                />
                                            </div>

                                            {/* Mã nguồn */}
                                            <div className="flex flex-col items-start w-full min-w-0">
                                                <span className="block text-[11px] font-semibold text-slate-400 mb-1 tracking-tight truncate w-full">Mã nguồn</span>
                                                <span className="block w-full truncate rounded-lg bg-slate-100 px-2 py-2 text-center font-mono text-[11px] font-bold text-slate-500" title={landing.active_source_key}>
                                                    {landing.active_source_key}
                                                </span>
                                            </div>

                                            {/* Đích đến */}
                                            <div className="flex flex-col items-start w-full min-w-0">
                                                <span className="block text-[11px] font-semibold text-slate-400 mb-1 tracking-tight truncate w-full">Đích đến (phễu)</span>
                                                <select
                                                    className={`w-full cursor-pointer rounded-lg border px-2 py-2 text-[11px] font-bold outline-none transition-all ${getFunnelOption(getLandingFunnelType(landing)).tone}`}
                                                    value={getLandingFunnelType(landing)}
                                                    onChange={(e) => handleQuickFunnelChange(landing.id, e.target.value)}
                                                >
                                                    {FUNNEL_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
            </main>
        </div>
    );
};

export default AdminLandings;
