import React, { useState, useEffect } from "react";
import { crmFirestore, crmRealtimeDB } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { toast } from "react-hot-toast";
import { normalizeMetaCurrency } from "../../utils/metaPixel";
import { KHOI_THONG_SCHEDULE_CONFIG_DOC_ID } from "../../landing-templates/khoi-thong-dong-tien/landingConfig";
import {
    Layout, Settings, Save,
    AlertTriangle, CheckCircle,
    Plus, Trash2, Globe, Zap, Edit2, LayoutList,
    UserCheck, Filter as FilterIcon, Link, Eye, Copy,
    Users, TrendingUp, Search, Database, RefreshCw,
    Calendar, Laptop, Star, MoreVertical
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
    const [scheduleConfig, setScheduleConfig] = useState({
        eventStart: "2026-05-21T20:00",
        ctaScheduleLabel: "20h00, 21-22-23-24/05",
        thankYouCountdownSeconds: "300",
        thankYouZaloLink: "",
    });
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);

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
        fbCapiToken: "",
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
    const isSalesOwner = (user = {}) => {
        const role = String(user.role || "").toUpperCase();
        const team = String(user.team || "").toUpperCase();
        return role === "SALE" || role === "SALE_MANAGER" || role === "SALE_LEADER" || team.includes("SALE");
    };
    const crmSaleUsers = crmUsers.filter(isSalesOwner);
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

    const normalizeDatetimeLocal = (value = "2026-05-21T20:00") => String(value || "2026-05-21T20:00").slice(0, 16);

    const getSelectedUtmLeader = () =>
        crmLeaderUsers.find((user) => user.email === utmBuilder.leaderEmail) || null;

    const getLeaderUtmSlug = () => {
        const selectedLeader = getSelectedUtmLeader();
        return createUtmSlug(utmBuilder.customSlug || selectedLeader?.name || "");
    };

    const getLeaderUtmLink = () => {
        const slug = getLeaderUtmSlug();
        if (!slug || !form.slug) return "";

        const url = new URL(form.slug.startsWith("/") ? form.slug : `/${form.slug}`, "https://maliedu.vn");
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

    const syncSourceConfig = async ({
        sourceKey,
        landing,
        targetFunnel,
        funnelType,
        targetCourseId,
        targetK,
        assignedSale,
        targetZalo,
        previousSourceKey,
    }) => {
        const normalizedFunnelType = normalizeFunnelType(funnelType || targetFunnel);
        const normalizedAssignedSale = normalizedFunnelType === "leader" ? "" : (assignedSale || "Round Robin");
        await setDoc(doc(crmFirestore, "source_configs", sourceKey), {
            id: sourceKey,
            sourceKey,
            source_name: landing.name,
            name: landing.name,
            landingPageId: landing.id,
            landingSlug: landing.slug,
            targetCourseId: targetCourseId || "",
            targetK: targetK || landing.course_k || "K41",
            targetFunnel,
            funnel_type: normalizedFunnelType,
            assignedSale: normalizedAssignedSale,
            assignmentMode: normalizedFunnelType === "leader" ? "leader_referrer" : "sales",
            targetZalo: targetZalo || landing.zaloLink || "",
            updatedAt: serverTimestamp()
        }, { merge: true });

        if (previousSourceKey && previousSourceKey !== sourceKey) {
            const oldKeyStillUsed = landings.some((item) =>
                item.id !== landing.id &&
                String(item.active_source_key || "").trim().toLowerCase() === String(previousSourceKey || "").trim().toLowerCase()
            );
            if (!oldKeyStillUsed) {
                await deleteDoc(doc(crmFirestore, "source_configs", previousSourceKey)).catch(() => {});
            }
        }
    };

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

    const loadScheduleConfig = async () => {
        try {
            const snap = await getDoc(doc(crmFirestore, "public_settings", KHOI_THONG_SCHEDULE_CONFIG_DOC_ID));
            let data = snap.exists() ? snap.data() : null;

            if (!data) {
                const landingSnap = await getDocs(collection(crmFirestore, "landing_pages"));
                data = landingSnap.docs
                    .map((item) => item.data())
                    .find((item) => item.eventStart || item.ctaScheduleLabel || item.thankYouCountdownSeconds);
            }

            if (!data) return;

            setScheduleConfig({
                eventStart: normalizeDatetimeLocal(data.eventStart),
                ctaScheduleLabel: data.ctaScheduleLabel || "20h00, 21-22-23-24/05",
                thankYouCountdownSeconds: String(data.thankYouCountdownSeconds || 300),
                thankYouZaloLink: data.thankYouZaloLink || data.zaloLink || "",
            });
        } catch (e) {
            console.error("Load schedule config error:", e);
        }
    };

    const handleSaveScheduleConfig = async () => {
        const parsedThankYouSeconds = Number.parseInt(scheduleConfig.thankYouCountdownSeconds, 10);
        const thankYouCountdownSeconds = Number.isFinite(parsedThankYouSeconds) && parsedThankYouSeconds > 0 ? parsedThankYouSeconds : 300;

        setIsSavingSchedule(true);
        try {
            await setDoc(doc(crmFirestore, "public_settings", KHOI_THONG_SCHEDULE_CONFIG_DOC_ID), {
                eventStart: scheduleConfig.eventStart ? `${scheduleConfig.eventStart}:00+07:00` : "",
                ctaScheduleLabel: scheduleConfig.ctaScheduleLabel || "",
                thankYouCountdownSeconds,
                thankYouZaloLink: scheduleConfig.thankYouZaloLink || "",
                updatedAt: serverTimestamp(),
            }, { merge: true });
            setScheduleConfig((prev) => ({ ...prev, thankYouCountdownSeconds: String(thankYouCountdownSeconds) }));
            toast.success("Đã lưu lịch học chung cho 3 phễu!");
        } catch (e) {
            toast.error("Lỗi lưu lịch học chung: " + e.message);
        } finally {
            setIsSavingSchedule(false);
        }
    };

    // Sync Data
    useEffect(() => {
        const unsubLandings = onSnapshot(collection(crmFirestore, "landing_pages"), (snap) => {
            setLandings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        refreshCrmData();
        loadScheduleConfig();

        const usersRef = ref(crmRealtimeDB, 'system_settings/users');
        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.values(data).filter(u => u?.isActive !== false);
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
        const landingFunnelType = getLandingFunnelType(l);
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
            funnel_type: normalizeFunnelType(landing.funnel_type || mappingData.funnel_type || landing.targetFunnel || "ads"),
            assignedSale: mappingData.assignedSale || "Round Robin",
            zaloLink: mappingData.targetZalo || landing.zaloLink || "",
            thankYouZaloLink: landing.thankYouZaloLink || landing.zaloLink || "",
            fbPixel: landing.fbPixel || "",
            fbCapiToken: landing.fbCapiToken || "",
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
            fbCapiToken: "",
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
        if (!form.name || !form.slug) return toast.error("Vui lòng nhập Tên và Link!");

        const id = activeEditId === "new" ? slugify(form.name) : activeEditId;
        const funnelType = normalizeFunnelType(form.funnel_type || form.targetFunnel || "ads");
        const targetFunnel = getCrmTargetFunnel(funnelType);
        
        // --- LOGIC ÉP HẬU TỐ SOURCE_KEY (Sửa tận gốc ở Firebase) ---
        let sourceKey = String(form.active_source_key || "organic_web").trim();
        const currentK = (form.course_k || "K41").toLowerCase().replace(/k/g, "");
        const suffix = `_k${currentK}`;

        // Nếu mã nguồn chưa có hậu tố _k[số], tự động gắn vào
        if (!sourceKey.toLowerCase().match(/_k\d+$/i)) {
            sourceKey = `${sourceKey}${suffix}`;
            console.log(`[AdminLandings] 🛠 Auto-fixing sourceKey: ${form.active_source_key} -> ${sourceKey}`);
        }

        const uniqueResult = getUniqueSourceKey(sourceKey, funnelType, id);
        sourceKey = uniqueResult.sourceKey;

        const fbCurrency = normalizeMetaCurrency(form.fbCurrency);
        const parsedEventValue = Number(String(form.fbEventValue ?? "").replace(",", "."));
        const fbEventValue = Number.isFinite(parsedEventValue) && parsedEventValue >= 0 ? parsedEventValue : 0;
        const previousSourceKey = landings.find((landing) => landing.id === id)?.active_source_key || "";
        const assignedSaleForConfig = funnelType === "leader" ? "" : form.assignedSale;
        try {
            if (uniqueResult.changed) {
                toast(`Mã nguồn bị trùng, đã tự đổi thành: ${sourceKey}`);
            }
            // 1. Lưu vào Landing Pages config
            await setDoc(doc(crmFirestore, "landing_pages", id), {
                name: form.name,
                slug: form.slug,
                active_source_key: sourceKey, // Lưu mã đã có hậu tố
                is_maintenance: form.is_maintenance,
                zaloLink: form.zaloLink || "",
                thankYouZaloLink: form.thankYouZaloLink || form.zaloLink || "",
                fbPixel: form.fbPixel || "",
                fbCapiToken: form.fbCapiToken || "",
                fbCurrency,
                fbEventValue,
                course_k: form.course_k || "K41",
                targetFunnel,
                funnel_type: funnelType,
                assignmentMode: funnelType === "leader" ? "leader_referrer" : "sales",
                updatedAt: serverTimestamp()
            }, { merge: true });

            // 2. Lưu vào Source Configs (Để CRM nhận diện được metadata)
            await setDoc(doc(crmFirestore, "source_configs", sourceKey), {
                id: sourceKey,
                sourceKey,
                source_name: form.name,
                name: form.name,
                landingPageId: id,
                landingSlug: form.slug,
                targetCourseId: selectedCourseId,
                targetK: selectedK || form.course_k || "K41",
                targetFunnel,
                funnel_type: funnelType,
                assignedSale: assignedSaleForConfig,
                assignmentMode: funnelType === "leader" ? "leader_referrer" : "sales",
                targetZalo: form.zaloLink || "",
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast.success(`Đã lưu thành công! Mã nguồn: ${sourceKey}`);
            if (previousSourceKey && previousSourceKey !== sourceKey) {
                const oldKeyStillUsed = landings.some((landing) =>
                    landing.id !== id &&
                    String(landing.active_source_key || "").trim().toLowerCase() === previousSourceKey.toLowerCase()
                );
                if (!oldKeyStillUsed) {
                    await deleteDoc(doc(crmFirestore, "source_configs", previousSourceKey)).catch(() => {});
                }
            }

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

    const handleQuickFunnelChange = async (landingId, nextFunnelType) => {
        const landing = landings.find((item) => item.id === landingId);
        if (!landing) return;

        const funnelType = normalizeFunnelType(nextFunnelType);
        const targetFunnel = getCrmTargetFunnel(funnelType);
        const uniqueResult = getUniqueSourceKey(landing.active_source_key || "organic_web", funnelType, landingId);
        const sourceKey = uniqueResult.sourceKey;
        const previousSourceKey = landing.active_source_key || "";

        try {
            const previousSnap = previousSourceKey
                ? await getDoc(doc(crmFirestore, "source_configs", previousSourceKey))
                : null;
            const previousConfig = previousSnap?.exists() ? previousSnap.data() : {};

            await setDoc(doc(crmFirestore, "landing_pages", landingId), {
                targetFunnel,
                funnel_type: funnelType,
                active_source_key: sourceKey,
                assignmentMode: funnelType === "leader" ? "leader_referrer" : "sales",
                updatedAt: serverTimestamp()
            }, { merge: true });

            await syncSourceConfig({
                sourceKey,
                landing: {
                    ...landing,
                    active_source_key: sourceKey,
                    targetFunnel,
                    funnel_type: funnelType,
                },
                targetFunnel,
                funnelType,
                targetCourseId: previousConfig.targetCourseId || "",
                targetK: previousConfig.targetK || landing.course_k || "K41",
                assignedSale: funnelType === "leader" ? "" : (previousConfig.assignedSale || "Round Robin"),
                targetZalo: previousConfig.targetZalo || landing.zaloLink || "",
                previousSourceKey,
            });

            toast.success(uniqueResult.changed ? `Đã đổi phễu và tách mã: ${sourceKey}` : "Đã cập nhật phễu đích");
        } catch (e) {
            toast.error("Lỗi cập nhật phễu: " + e.message);
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

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
            const promises = landings.map(async (l) => {
                const base = String(l.active_source_key || "").split('_k')[0];
                const funnelType = getLandingFunnelType(l);
                const targetFunnel = getCrmTargetFunnel(funnelType);
                const uniqueResult = getUniqueSourceKey(`${base}${suffix}`, funnelType, l.id, reservedKeys);
                const newKey = uniqueResult.sourceKey;
                reservedKeys.add(newKey);

                await setDoc(doc(crmFirestore, "landing_pages", l.id), {
                    course_k: quickEditK,
                    active_source_key: newKey,
                    targetFunnel,
                    funnel_type: funnelType,
                    assignmentMode: funnelType === "leader" ? "leader_referrer" : "sales",
                    updatedAt: serverTimestamp()
                }, { merge: true });

                return syncSourceConfig({
                    sourceKey: newKey,
                    landing: { ...l, course_k: quickEditK, active_source_key: newKey },
                    targetFunnel,
                    funnelType,
                    targetCourseId: "",
                    targetK: quickEditK,
                    assignedSale: "Round Robin",
                    targetZalo: l.zaloLink || "",
                    previousSourceKey: l.active_source_key || "",
                });
            });
            await Promise.all(promises);
            toast.success("Đã đồng bộ toàn bộ hệ thống!");
            setIsQuickEditing(false);
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickEditSingleK = async (landingId, newK) => {
        const landing = landings.find(l => l.id === landingId);
        const base = String(landing?.active_source_key || "").split('_k')[0];
        const suffix = `_k${newK.toLowerCase().replace('k', '')}`;
        const funnelType = getLandingFunnelType(landing);
        const targetFunnel = getCrmTargetFunnel(funnelType);
        const newKey = getUniqueSourceKey(`${base}${suffix}`, funnelType, landingId).sourceKey;

        try {
            await setDoc(doc(crmFirestore, "landing_pages", landingId), {
                course_k: newK,
                active_source_key: newKey,
                targetFunnel,
                funnel_type: funnelType,
                assignmentMode: funnelType === "leader" ? "leader_referrer" : "sales",
                updatedAt: serverTimestamp()
            }, { merge: true });
            await syncSourceConfig({
                sourceKey: newKey,
                landing: { ...landing, course_k: newK, active_source_key: newKey },
                targetFunnel,
                funnelType,
                targetCourseId: "",
                targetK: newK,
                assignedSale: "Round Robin",
                targetZalo: landing?.zaloLink || "",
                previousSourceKey: landing?.active_source_key || "",
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleRestoreStandardCodes = async () => {
        if (!window.confirm("Khôi phục mã chuẩn (Ads: 03248, Leader: 83248)?")) return;
        setIsLoading(true);
        try {
            const reservedKeys = new Set();
            const promises = landings.map(async (l) => {
                let base = String(l.active_source_key || "").split('_k')[0];
                const kSuffix = `_k${(l.course_k || "K41").toLowerCase().replace('k', '')}`;
                
                const name = l.name?.toLowerCase() || "";
                const slug = String(l.slug || "").toLowerCase();
                const funnelType = name.includes("leader") || slug.includes("leader")
                    ? "leader"
                    : getLandingFunnelType(l);
                const targetFunnel = getCrmTargetFunnel(funnelType);
                if (funnelType === "leader") base = "1768973783248";
                else if (funnelType === "ads" || name.includes("chính") || name.includes("ads")) base = "1768973703248";
                const uniqueResult = getUniqueSourceKey(`${base}${kSuffix}`, funnelType, l.id, reservedKeys);
                const nextSourceKey = uniqueResult.sourceKey;
                reservedKeys.add(nextSourceKey);

                await setDoc(doc(crmFirestore, "landing_pages", l.id), {
                    active_source_key: nextSourceKey,
                    targetFunnel,
                    funnel_type: funnelType,
                    assignmentMode: funnelType === "leader" ? "leader_referrer" : "sales",
                    updatedAt: serverTimestamp()
                }, { merge: true });

                return syncSourceConfig({
                    sourceKey: nextSourceKey,
                    landing: { ...l, active_source_key: nextSourceKey, targetFunnel, funnel_type: funnelType },
                    targetFunnel,
                    funnelType,
                    targetCourseId: "",
                    targetK: l.course_k || "K41",
                    assignedSale: "Round Robin",
                    targetZalo: l.zaloLink || "",
                    previousSourceKey: l.active_source_key || "",
                });
            });
            await Promise.all(promises);
            toast.success("Đã khôi phục mã nguồn chuẩn cho các phễu!");
        } catch (e) {
            toast.error("Lỗi: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-8rem)] gap-6">
            {/* LEFT SIDEBAR - CREATE/EDIT FORM */}
            <div className={`transition-all duration-300 shrink-0 ${showCreateForm ? 'w-full lg:w-[480px] block' : 'w-0 overflow-hidden hidden lg:block'}`}>
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
                                            placeholder="https://maliedu.vn/..."
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
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Sale phụ trách</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium cursor-pointer"
                                        value={form.assignedSale}
                                        onChange={e => setForm({ ...form, assignedSale: e.target.value })}
                                    >
                                        <option value="Round Robin">Chia Vòng Tròn (Auto)</option>
                                        {crmSaleUsers.map(u => (
                                            <option key={u.email} value={u.name}>{u.name} ({u.team})</option>
                                        ))}
                                    </select>
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
            <div className="flex-1 overflow-y-auto p-4 pt-6 md:p-6">
                {/* Title header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Quản lý Landing Pages</h1>
                        <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">Đã cấu hình {landings.length} landing pages</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={18} />
                        Tạo mới
                    </button>
                </div>

                {/* Toolbar: Tabs & Search */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            const count = tab.id === "ALL" 
                                ? landings.length 
                                : landings.filter(l => getLandingFunnelType(l) === tab.id.toLowerCase()).length;
                                
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                                        isActive
                                            ? 'bg-indigo-50/40 text-indigo-600 border-indigo-200 shadow-sm'
                                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-700'
                                    }`}
                                >
                                    <tab.icon size={16} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                                    {tab.label}
                                    <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                        isActive ? 'bg-indigo-100/80 text-indigo-600' : 'bg-slate-100 text-slate-500'
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
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl outline-none text-sm transition-all font-medium text-slate-700"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Lịch học chung 3 phễu */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm mb-6">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50/50 text-indigo-600 rounded-xl border border-indigo-50">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm md:text-base">Lịch học chung 3 phễu</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Áp dụng cho Landing Page Chính, Leader và Thương hiệu.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveScheduleConfig}
                            disabled={isSavingSchedule}
                            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 hover:shadow-lg"
                        >
                            <Save size={14} />
                            {isSavingSchedule ? "Đang lưu..." : "Lưu lịch chung"}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Thời gian bắt đầu</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="datetime-local"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-slate-700"
                                    value={scheduleConfig.eventStart || ""}
                                    onChange={e => setScheduleConfig({ ...scheduleConfig, eventStart: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Dòng thời gian trên nút CTA</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-slate-700"
                                placeholder="20h00, 21-22-23-24/05"
                                value={scheduleConfig.ctaScheduleLabel || ""}
                                onChange={e => setScheduleConfig({ ...scheduleConfig, ctaScheduleLabel: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Đếm ngược cảm ơn (giây)</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-slate-700"
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
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-slate-700"
                                    placeholder="https://zalo.me/g/..."
                                    value={scheduleConfig.thankYouZaloLink || ""}
                                    onChange={e => setScheduleConfig({ ...scheduleConfig, thankYouZaloLink: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quản lý Nhanh & Đồng bộ Khóa K (Card List Layout) */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <h3 className="font-extrabold text-slate-800 text-base md:text-lg flex items-center gap-2">
                            <LayoutList size={22} className="text-[#6366F1]" />
                            Quản lý Nhanh & Đồng bộ Khóa K
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <button
                            onClick={handleRestoreStandardCodes}
                            className="flex items-center justify-center gap-2 px-4 py-3 text-xs md:text-sm font-bold text-[#B45309] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] rounded-xl transition-all"
                            title="Khôi phục mã 03248 (Ads) và 83248 (Leader) dựa theo tên trang"
                        >
                            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                            Sửa mã chuẩn
                        </button>
                        {isQuickEditing ? (
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in zoom-in duration-200">
                                <input 
                                    type="text" 
                                    placeholder="Khóa K mới"
                                    className="flex-1 px-3 py-1.5 text-xs font-bold uppercase rounded-lg border-none focus:ring-0 bg-slate-50"
                                    value={quickEditK}
                                    onChange={e => setQuickEditK(e.target.value.toUpperCase())}
                                />
                                <button 
                                    onClick={handleQuickEditKAll}
                                    className="bg-[#4F46E5] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    Lưu
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
                                className="flex items-center justify-center gap-2 bg-[#ECFDF5] text-[#047857] px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all border border-[#A7F3D0] hover:bg-emerald-100"
                            >
                                <Edit2 size={15} />
                                Sửa nhanh Khóa K
                            </button>
                        )}
                    </div>

                    {filteredLandings.length > 0 ? (
                        <div className="flex flex-col gap-4">
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
                                        className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow relative"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left side: Icon + Title/URL */}
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconConfig.bg}`}>
                                                    <iconConfig.icon size={22} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-extrabold text-slate-800 text-sm md:text-base truncate">{landing.name}</h4>
                                                    <p className="text-xs text-slate-400 mt-1 truncate font-medium">
                                                        maliedu.vn{landing.slug}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right side: 3-dots Menu Button */}
                                            <div className="relative shrink-0">
                                                <button
                                                    onClick={() => setActiveMenuId(activeMenuId === landing.id ? null : landing.id)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {activeMenuId === landing.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                                                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 w-36 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
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
                                                                    navigator.clipboard.writeText(`https://maliedu.vn${landing.slug}`);
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
                                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                                            {/* Khóa K */}
                                            <div className="flex flex-col items-start w-full min-w-0">
                                                <span className="block text-[11px] font-semibold text-slate-400 mb-1 tracking-tight truncate w-full">Khóa K</span>
                                                <input 
                                                    type="text"
                                                    value={landing.course_k || ""}
                                                    onChange={(e) => handleQuickEditSingleK(landing.id, e.target.value.toUpperCase())}
                                                    className="w-full px-2 py-1.5 text-xs font-black text-[#4F46E5] bg-[#EEF2FF] border-none rounded-lg text-center focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
                                                />
                                            </div>

                                            {/* Mã nguồn */}
                                            <div className="flex flex-col items-start w-full min-w-0">
                                                <span className="block text-[11px] font-semibold text-slate-400 mb-1 tracking-tight truncate w-full">Mã nguồn</span>
                                                <span className="block w-full text-center text-[11px] font-mono font-bold text-slate-500 bg-[#F1F5F9] px-2 py-1.5 rounded-lg truncate" title={landing.active_source_key}>
                                                    {landing.active_source_key}
                                                </span>
                                            </div>

                                            {/* Đích đến */}
                                            <div className="flex flex-col items-start w-full min-w-0">
                                                <span className="block text-[11px] font-semibold text-slate-400 mb-1 tracking-tight truncate w-full">Đích đến (phễu)</span>
                                                <select
                                                    className={`w-full rounded-xl border px-2 py-1.5 text-[11px] font-bold outline-none transition-all cursor-pointer shadow-sm ${getFunnelOption(getLandingFunnelType(landing)).tone}`}
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
            </div>
        </div>
    );
};

export default AdminLandings;
