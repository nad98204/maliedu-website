import { ArrowRight, Phone, Sparkles, User, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { submitToCRM } from "../../../services/crmService";
import {
  createMetaEventId,
  getMetaBrowserData,
  hashData,
  initMetaPixel,
  normalizeNameForHash,
  resolveMetaEventData,
  setMetaUserData,
  trackMetaEventForPixel,
} from "../../../utils/metaPixel";

const BANNER_URL =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776245418122-943458166-Kh-i-Th-ng-D-ng-Ti-n-Mobile.jpg";

const DEFAULT_REMOTE_CONFIG = {
  fbPixel: "1526874981588150",
  fbCapiToken:
    "EAAOUx21ZARaYBQ6jZAiffdq7ZCsCj7Xko24I8De60ufxpJ0ZBNGE1dbbJBI8MDDeZB8n37IhzpUPZAahSZA69WFnDiTAB9wwfriQIoeKQUjVj6pzIumRzDCXHLGATDxJOAlZAiz3wIdYhwo0aTwoZAEFNTBZCRVKDZC7OvjtZBfQ1TUHXAdWFAii06GZBGRRe5I8ZBSsm51QZDZD",
  active_source_key: "",
  targetFunnel: "ADS",
  funnel_type: "ads",
  landingPageId: "",
  is_maintenance: false,
  isLoading: false,
  fbCurrency: "VND",
  fbEventValue: 110000,
  course_k: "K41", // Giá trị mặc định
};

const normalizeFunnelType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "leader" || normalized === "leader_funnel" || normalized.includes("leader")) {
    return "leader";
  }
  if (
    normalized === "thuonghieu" ||
    normalized === "thuonghieu_funnel" ||
    normalized === "brand" ||
    normalized === "brand_funnel" ||
    normalized.includes("thuonghieu")
  ) {
    return "thuonghieu";
  }
  if (normalized === "ads" || normalized === "ads_funnel" || normalized.includes("ads")) {
    return "ads";
  }
  return "";
};

const resolveRouteFunnel = (normalizedPath = "") => {
  if (normalizedPath.includes("thuonghieu")) return "thuonghieu";
  if (normalizedPath.includes("leader")) return "leader";
  return "ads";
};

const normalizePath = (path) => {
  if (!path) return "/";
  try {
    // Giải mã URL (để khớp với tiếng Việt có dấu nếu có)
    const decoded = decodeURIComponent(path.split("?")[0].split("#")[0]);
    // lowerCase, bỏ gạch chéo ở cả đầu và cuối để so sánh nguyên bản nhất
    return decoded.toLowerCase().replace(/^\/+|\/+$/g, "") || "root";
  } catch {
    return path.split("?")[0].split("#")[0].toLowerCase().replace(/^\/+|\/+$/g, "") || "root";
  }
};

/** Firestore CRM — dynamic import, gọi sau khi user tương tác form hoặc submit. */
const fetchLandingRemoteConfig = async () => {
  const [{ crmFirestore }, { collection, doc, getDoc, getDocs }] = await Promise.all([
    import("../../../firebase"),
    import("firebase/firestore"),
  ]);
  const normalizedRequestPath = normalizePath(window.location.pathname);

  const querySnap = await getDocs(collection(crmFirestore, "landing_pages"));

  let matchDoc = querySnap.docs.find((item) => {
    const configSlug = normalizePath(item.data().slug || "");
    return configSlug !== "root" && configSlug === normalizedRequestPath;
  });

  if (!matchDoc) {
    matchDoc = querySnap.docs.find((item) => {
      const configSlug = normalizePath(item.data().slug || "");
      return (
        (item.id === "khoi-thong-dong-tien" || configSlug === "dao-tao/khoi-thong-dong-tien") &&
        normalizedRequestPath.includes("khoi-thong-dong-tien") &&
        !normalizedRequestPath.includes("leader") &&
        !normalizedRequestPath.includes("thuonghieu")
      );
    });
  }

  if (matchDoc) {
    const configData = matchDoc.data();
    return {
      ...DEFAULT_REMOTE_CONFIG,
      ...configData,
      landingPageId: matchDoc.id,
      isLoading: false,
    };
  }

  const docRef = doc(crmFirestore, "public_settings", "landing_config");
  const docSnap = await getDoc(docRef);
  return docSnap.exists()
    ? {
        ...DEFAULT_REMOTE_CONFIG,
        ...docSnap.data(),
        isLoading: false,
      }
    : { ...DEFAULT_REMOTE_CONFIG, isLoading: false };
};

const OPTIONS_REFERRER = [
  "Văn Trường",
  "Đức Tuệ",
  "Thành Seven",
  "Thầy Mong Thành",
  "Người khác giới thiệu tôi",
];

const OTHER_REFERRER_OPTION = OPTIONS_REFERRER[OPTIONS_REFERRER.length - 1];

const OPTIONS_LOA = ["ĐÃ HỌC LUẬT HẤP DẪN", "CHƯA HỌC"];

const normalizeLeaderIdentity = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const compactLeaderIdentity = (value = "") =>
  normalizeLeaderIdentity(value).replace(/[^a-z0-9]/g, "");

const createLeaderUtmSlug = (value = "") => compactLeaderIdentity(value);

const isLeaderOwnerUser = (user = {}) => {
  const role = normalizeLeaderIdentity(user.role || "").toUpperCase();
  const team = normalizeLeaderIdentity(user.team || "").toUpperCase();
  const title = normalizeLeaderIdentity(user.title || user.position || "").toUpperCase();

  if (role === "LEADER" || role === "MENTOR_VIP") return true;
  if (role.includes("SALE_LEADER") || role.includes("TRUONG SALE")) return false;
  if (role.includes("LEADER") && !role.includes("SALE")) return true;
  if (team.includes("LEADER") && !team.includes("SALE")) return true;
  if (title.includes("LEADER") && !title.includes("SALE")) return true;
  return false;
};

const LEADER_UTM_ALIASES = {
  vantruong: OPTIONS_REFERRER[0],
  ductue: OPTIONS_REFERRER[1],
  thanhseven: OPTIONS_REFERRER[2],
  thaymongthanh: OPTIONS_REFERRER[3],
  mongthanh: OPTIONS_REFERRER[3],
};

const matchLeaderNameFromUtm = (leaderNames = [], value = "") => {
  const compactValue = compactLeaderIdentity(value);
  if (!compactValue) return "";

  const aliasMatch = Object.entries(LEADER_UTM_ALIASES).find(([slug]) =>
    compactValue === slug || compactValue.includes(slug)
  );
  if (aliasMatch) return aliasMatch[1];

  return (
    leaderNames.find((name) => {
      const compactName = compactLeaderIdentity(name);
      return compactName === compactValue ||
        compactName.includes(compactValue) ||
        compactValue.includes(compactName);
    }) || ""
  );
};

const resolveLeaderUtmValue = (searchParams, leaderNames = []) => {
  const explicitKeys = ["l", "leader", "from", "ref"];
  const utmKeys = ["utm_source", "utm_campaign", "utm_content", "utm_medium", "utm_term"];

  const explicitValue = explicitKeys
    .map((key) => searchParams.get(key)?.trim())
    .find(Boolean);
  if (explicitValue) return explicitValue;

  const candidates = utmKeys
    .map((key) => searchParams.get(key)?.trim())
    .filter(Boolean);

  return candidates.find((value) => matchLeaderNameFromUtm(leaderNames, value)) || candidates[0] || "";
};

const CustomRadio = ({
  label,
  options,
  value,
  onChange,
  error,
  layout = "grid",
  requiredMark = false,
  errorMessage = "* Vui lòng chọn",
}) => (
  <div className="space-y-1.5 sm:space-y-2">
    <label className="flex flex-wrap items-center gap-x-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/80">
      <span>{label}</span>
      {requiredMark && (
        <span className="text-[#E8393F]" aria-hidden>
          *
        </span>
      )}
    </label>
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-2 gap-2"
          : "grid grid-cols-2 gap-2"
      }
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`group flex items-center gap-1.5 px-2.5 py-2 sm:py-2.5 rounded-lg border text-[10px] sm:text-[12px] transition-all duration-300 text-left ${
            value === opt
              ? "bg-[#C9961A]/30 border-[#C9961A] text-[#FFE566] shadow-[0_0_15px_rgba(201,150,26,0.25)] ring-1 ring-[#C9961A]/50"
              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-[#C9961A]/30"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              value === opt ? "border-[#FFE566] bg-[#C9961A]" : "border-white/20 group-hover:border-[#C9961A]/50"
            }`}
          >
            {value === opt && <div className="w-1 h-1 rounded-full bg-white animate-scale-in" />}
          </div>
          <span className="font-bold tracking-tight leading-tight uppercase">
            {opt.replace("LEADER ", "")}
          </span>
        </button>
      ))}
    </div>
    {error && (
      <p className="text-[#E8393F] text-[9px] font-bold uppercase tracking-widest animate-pulse italic mt-1 ml-1">
        {errorMessage}
      </p>
    )}
  </div>
);

const FormDangKy = ({
  targetFunnel,
  source_key: initialSourceKey,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState({ name: "", phone: "", referrer: "", otherReferrer: "", hasLearnedLOA: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState(DEFAULT_REMOTE_CONFIG);
  const [leaderOwners, setLeaderOwners] = useState([]);
  const [crmActivated, setCrmActivated] = useState(false);
  /** Khi có mã UTM khóa Leader: ô tên người giới thiệu thật (học viên…) chỉ mở khi user chủ động bấm */
  const [showAlternateReferrerInput, setShowAlternateReferrerInput] = useState(false);

  const engageCrm = useCallback(() => {
    setCrmActivated(true);
  }, []);

  const currentPathNormalized = normalizePath(window.location.pathname);
  const dynamicReferrerOptions = leaderOwners.length > 0
    ? [...leaderOwners.map((item) => item.name).filter(Boolean), OTHER_REFERRER_OPTION]
    : OPTIONS_REFERRER;
  const leaderUtmValue = resolveLeaderUtmValue(searchParams, dynamicReferrerOptions);
  const matchedUtmLeaderName = matchLeaderNameFromUtm(dynamicReferrerOptions, leaderUtmValue);
  const lockedLeaderName = matchedUtmLeaderName;
  
  // --- PHÂN LUỒNG NGHIÊM NGẶT (Strict Routing Protocol) ---
  // Ưu tiên Props (Hardcoded) > Cấu hình Admin (Remote) > Logic đường dẫn (URL)
  const propFunnel = normalizeFunnelType(targetFunnel);
  const remoteFunnel = normalizeFunnelType(remoteConfig.targetFunnel || remoteConfig.funnel_type);
  const routeFunnel = resolveRouteFunnel(currentPathNormalized);
  const finalFunnel = propFunnel || remoteFunnel || routeFunnel;
  const isLeader = finalFunnel === "leader";
  const finalSourceKey = remoteConfig.active_source_key || initialSourceKey || "organic_web";

  // Debug để kiểm soát luồng
  useEffect(() => {
    console.log(`[FormSync] 🛰 Resolved Channel: ${finalFunnel} | Key: ${finalSourceKey}`);
  }, [finalFunnel, finalSourceKey]);

  useEffect(() => {
    if (!crmActivated) return;

    let unsubscribe;
    let cancelled = false;

    (async () => {
      const [{ crmRealtimeDB }, { ref, onValue }] = await Promise.all([
        import("../../../firebase"),
        import("firebase/database"),
      ]);
      if (cancelled) return;

      const usersRef = ref(crmRealtimeDB, "system_settings/users");
      unsubscribe = onValue(
        usersRef,
        (snapshot) => {
          const data = snapshot.val() || {};
          const list = Object.values(data)
            .filter(isLeaderOwnerUser)
            .map((user) => ({
              name: user.name || user.displayName || user.email || "",
              email: user.email || "",
            }))
            .filter((user) => user.name)
            .sort((a, b) => a.name.localeCompare(b.name, "vi"));
          setLeaderOwners(list);
        },
        () => setLeaderOwners([])
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [crmActivated]);

  useEffect(() => {
    if (!crmActivated) return;

    let isCancelled = false;
    (async () => {
      try {
        const next = await fetchLandingRemoteConfig();
        if (!isCancelled) setRemoteConfig(next);
      } catch {
        if (!isCancelled) setRemoteConfig((prev) => ({ ...prev, isLoading: false }));
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [crmActivated]);

  useEffect(() => {
    if (!isLeader || !lockedLeaderName || formState.referrer === lockedLeaderName) return;
    setFormState((prev) => ({ ...prev, referrer: lockedLeaderName }));
  }, [isLeader, formState.referrer, lockedLeaderName]);

  useEffect(() => {
    setShowAlternateReferrerInput(false);
  }, [lockedLeaderName]);

  const handleAdvancedMatch = async (field, value) => {
    if (finalFunnel === "thuonghieu") return;

    try {
      if (field === "phone") {
        const normalized = value.replace(/\D/g, "").replace(/^0/, "84");
        if (normalized.length < 9) return;
        const hashed = await hashData(normalized);
        if (hashed) setMetaUserData({ ph: [hashed] });
      } else if (field === "name") {
        const parts = value.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return;
        const fn = parts[parts.length - 1];
        const ln = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
        const hashedFn = fn ? await hashData(normalizeNameForHash(fn)) : "";
        const hashedLn = ln ? await hashData(normalizeNameForHash(ln)) : "";
        const userData = {
          ...(hashedFn ? { fn: [hashedFn] } : {}),
          ...(hashedLn ? { ln: [hashedLn] } : {}),
        };
        if (Object.keys(userData).length > 0) setMetaUserData(userData);
      }
    } catch {
      // silent fail - không ảnh hưởng UX
    }
  };

  const handleChange = (field) => (event) => {
    let { value } = event.target;

    if (field === "phone") {
      const rawValue = value.replace(/\D/g, "");
      if (rawValue.length > 7) {
        value = rawValue.replace(/^(\d{4})(\d{3})(\d{0,4}).*/, "$1 $2 $3").trim();
      } else if (rawValue.length > 4) {
        value = rawValue.replace(/^(\d{4})(\d{0,3})/, "$1 $2").trim();
      } else {
        value = rawValue;
      }
    }

    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || (field === "referrer" && errors.otherReferrer)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const setRadioValue = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "referrer" && value !== OTHER_REFERRER_OPTION ? { otherReferrer: "" } : {}),
    }));
    if (errors[field] || (field === "referrer" && errors.otherReferrer)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (field === "referrer") delete next.otherReferrer;
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    // Validation
    const newErrors = {};
    const nameTrim = formState.name.trim();
    const phoneDigits = formState.phone.replace(/\D/g, "");

    if (!nameTrim || nameTrim.length < 2) newErrors.name = true;
    if (!formState.phone.trim() || phoneDigits.length < 9 || phoneDigits.length > 11) {
      newErrors.phone = true;
    }

    if (isLeader) {
      if (!lockedLeaderName && !formState.referrer) newErrors.referrer = true;
      if (!lockedLeaderName && formState.referrer === OTHER_REFERRER_OPTION && !formState.otherReferrer.trim()) {
        newErrors.otherReferrer = true;
      }
      if (!formState.hasLearnedLOA || !OPTIONS_LOA.includes(formState.hasLearnedLOA)) {
        newErrors.hasLearnedLOA = true;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const msgs = [];
      if (newErrors.name) msgs.push("họ và tên");
      if (newErrors.phone) msgs.push("số điện thoại hợp lệ");
      if (newErrors.hasLearnedLOA) msgs.push("câu hỏi Luật Hấp Dẫn");
      if (newErrors.referrer || newErrors.otherReferrer) msgs.push("người giới thiệu");
      toast.error(
        msgs.length > 0
          ? `Vui lòng điền: ${msgs.join(", ")}.`
          : "Vui lòng điền đầy đủ thông tin!"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      engageCrm();
      
      let clientIp = "";
      try {
        const ipRes = await fetch("https://api64.ipify.org?format=json");
        const ipData = await ipRes.json();
        clientIp = ipData.ip || "";
      } catch (ipErr) {
        console.error("IP Fetch error", ipErr);
      }

      let cfg = remoteConfig;
      try {
        cfg = await fetchLandingRemoteConfig();
        setRemoteConfig(cfg);
      } catch {
        /* dùng remoteConfig hiện tại */
      }

      const cfgRemoteFunnel = normalizeFunnelType(cfg.targetFunnel || cfg.funnel_type);

      // --- PHẦN 1: PHÂN LUỒNG & CHUẨN BỊ DATA ---
      const currentFunnel = propFunnel || cfgRemoteFunnel || routeFunnel;
      const baseKey = cfg.active_source_key || initialSourceKey || "organic_web";
      const linkSenderName = String(searchParams.get("l") || "").trim();
      
      const typedOtherReferrer = formState.otherReferrer.trim();
      const isOtherReferrer = !lockedLeaderName && formState.referrer === OTHER_REFERRER_OPTION;
      const isReferrerLeader = formState.referrer && !isOtherReferrer;
      const selectedLeaderName =
        currentFunnel === "thuonghieu"
          ? linkSenderName
          : lockedLeaderName || (isReferrerLeader ? formState.referrer.trim() : matchedUtmLeaderName);
      const directIntroducerName = typedOtherReferrer || (isOtherReferrer ? typedOtherReferrer : selectedLeaderName);
      const leaderUtmSlug = createLeaderUtmSlug(selectedLeaderName || matchedUtmLeaderName || leaderUtmValue);
      const utmOwnerSlug = leaderUtmSlug || createLeaderUtmSlug(selectedLeaderName);
      
      let finalTargetFunnel;
      let funnelChannel;
      let assignedTo = selectedLeaderName;

      if (currentFunnel === "leader") {
        finalTargetFunnel = "leader";
        funnelChannel = "leader_funnel";
      } else if (currentFunnel === "thuonghieu") {
        finalTargetFunnel = "thuonghieu";
        funnelChannel = "thuonghieu_funnel";
      } else {
        finalTargetFunnel = "ads";
        funnelChannel = "ads_funnel";
      }

      const currentBatch = cfg.course_k || "K41";
      const batchSuffix = `_k${currentBatch.toLowerCase().replace(/k/g, "")}`;
      const submissionSourceKey = baseKey.toLowerCase().match(/_k\d+$/i) ? baseKey : `${baseKey}${batchSuffix}`;
      const fallbackUtmSource = utmOwnerSlug || finalTargetFunnel;
      const fallbackUtmMedium =
        finalTargetFunnel === "leader"
          ? "leader"
          : finalTargetFunnel === "thuonghieu"
            ? "thuonghieu"
            : "landing";
      const fallbackUtmCampaign = utmOwnerSlug
        ? `${submissionSourceKey}_${utmOwnerSlug}`
        : submissionSourceKey;
      const fallbackUtmContent = selectedLeaderName || formState.referrer || "";

      /** Ghi chú CRM — phễu Leader: khớp hai khối form (Luật Hấp Dẫn + Người khác giới thiệu tôi) */
      const crmNoteParts = [];
      if (currentFunnel === "leader") {
        if (formState.hasLearnedLOA) {
          crmNoteParts.push(`Bạn đã học Luật Hấp Dẫn của thầy Mong chưa?: ${formState.hasLearnedLOA}`);
        }
        if (typedOtherReferrer) {
          crmNoteParts.push(`Người khác giới thiệu tôi — ${typedOtherReferrer}`);
        }
      } else if (currentFunnel === "thuonghieu" && linkSenderName) {
        crmNoteParts.push(`Nguoi gui link: ${linkSenderName}`);
      } else if (typedOtherReferrer) {
        crmNoteParts.push(`Người khác giới thiệu: ${typedOtherReferrer}`);
      }
      const crmNote = crmNoteParts.filter(Boolean).join(" | ");
      const trackingEnabled = finalTargetFunnel !== "thuonghieu";

      // --- PHẦN 2: CHUẨN BỊ TRACKING IDs ---
      const completeRegistrationEventId = trackingEnabled ? createMetaEventId("complete_registration") : "";
      const leadEventId = trackingEnabled ? createMetaEventId("lead") : "";
      const { fbp, fbc } = trackingEnabled ? getMetaBrowserData(window.location.search) : { fbp: "", fbc: "" };

      // --- PHẦN 3: GỬI CRM ---
      const crmResponse = await submitToCRM({
        name: nameTrim,
        phone: formState.phone.replace(/\s/g, ""),
        email: "",
        note: crmNote || "Đăng ký từ Landing Page",
        utm_source: searchParams.get("utm_source") || fallbackUtmSource,
        utm_medium: searchParams.get("utm_medium") || fallbackUtmMedium,
        utm_campaign: searchParams.get("utm_campaign") || fallbackUtmCampaign,
        utm_content: searchParams.get("utm_content") || fallbackUtmContent,
        utm_term: searchParams.get("utm_term") || "",
        utm_owner: fallbackUtmContent,
        utm_owner_slug: utmOwnerSlug,
        courseName: "Khơi Thông Dòng Tiền - Phễu",
        targetFunnel: finalTargetFunnel,
        funnel_type: finalTargetFunnel,
        source_type:
          finalTargetFunnel === "ads"
            ? "ads"
            : finalTargetFunnel === "leader"
              ? "leader_funnel"
              : "thuonghieu_funnel",
        funnel_channel: funnelChannel, 
        assigned_to: assignedTo,
        registered_loa: formState.hasLearnedLOA,
        is_learned_loa: formState.hasLearnedLOA,
        referrer: directIntroducerName || formState.referrer || "",
        referrer_type:
          finalTargetFunnel === "thuonghieu" && linkSenderName
            ? "link_sender"
            : typedOtherReferrer || isOtherReferrer
              ? "other"
              : "leader",
        other_referrer_name: typedOtherReferrer || (isOtherReferrer ? directIntroducerName : ""),
        leaderName: selectedLeaderName,
        leader_utm: utmOwnerSlug,
        leaderUtm: utmOwnerSlug,
        leaderSlug: utmOwnerSlug,
        introducedBy: directIntroducerName,
        staff_in_charge: assignedTo,
        course_k: currentBatch,
        batch_id: currentBatch,
        source_key: submissionSourceKey,
        sourceUrl: window.location.href,
        landingPageId: cfg.landingPageId || "",
        landingPageSlug: currentPathNormalized,
        // IDs cho Server-side CAPI matching
        meta_event_id: completeRegistrationEventId,
        lead_event_id: leadEventId,
        fbp: fbp || "",
        fbc: fbc || "",
        test_event_code: searchParams.get("test_event_code") || "",
        fbEventValue: cfg.fbEventValue || 0,
        fbCurrency: cfg.fbCurrency || "VND",
        userAgent: navigator.userAgent,
        clientIp: clientIp,
      });

      // --- LƯU VÀO FIRESTORE LEADS COLLECTION ---
      try {
        const [{ db }, { collection, addDoc }] = await Promise.all([
          import("../../../firebase"),
          import("firebase/firestore"),
        ]);
        await addDoc(collection(db, "leads"), {
          name: nameTrim,
          phone: formState.phone.replace(/\s/g, ""),
          source: "khoi-thong-dong-tien",
          createdAt: Date.now(),
          status: "new"
        });
      } catch (firestoreErr) {
        console.error("Lỗi lưu vào Firestore leads:", firestoreErr);
      }

      // --- PHẦN 4: XỬ LÝ HASH DATA CHO FB ---
      const normalizedPhone = formState.phone.replace(/\D/g, "").replace(/^0/, "84");
      const hashedPhone = normalizedPhone ? await hashData(normalizedPhone) : "";
      const nameParts = formState.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
      const lastName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";
      const hashedFn = firstName ? await hashData(normalizeNameForHash(firstName)) : "";
      const hashedLn = lastName ? await hashData(normalizeNameForHash(lastName)) : "";
      const hashedExternalId = crmResponse?.id ? await hashData(String(crmResponse.id)) : "";

      const metaEventData = resolveMetaEventData(cfg);
      const leadEventData = {
        content_name: "Đăng ký Khơi Thông Dòng Tiền",
        ...metaEventData,
      };

      const userDataCommon = {
        ...(hashedPhone ? { ph: hashedPhone } : {}),
        ...(hashedFn ? { fn: hashedFn } : {}),
        ...(hashedLn ? { ln: hashedLn } : {}),
        ...(hashedExternalId ? { external_id: hashedExternalId } : {}),
      };

      // --- PHẦN 5: TRACKING ---
      
      // 5.1 Browser Pixel
      if (trackingEnabled && cfg.fbPixel) {
        initMetaPixel(cfg.fbPixel);
        setMetaUserData(userDataCommon);
        // Chú ý: Ở đây chỉ bắn Lead. CompleteRegistration bắn ở trang Cảm ơn.
        trackMetaEventForPixel(cfg.fbPixel, "Lead", leadEventData, { eventID: leadEventId });
      }

      toast.success("Đăng ký thành công!");
      setFormState({ name: "", phone: "", referrer: "", otherReferrer: "", hasLearnedLOA: "" });
      setShowAlternateReferrerInput(false);
      sessionStorage.setItem("form_submitted", "true");
      sessionStorage.setItem("khoi_thong_funnel", finalTargetFunnel);
      sessionStorage.setItem("khoi_thong_pixel_id", trackingEnabled ? cfg.fbPixel || "" : "");
      sessionStorage.setItem("khoi_thong_source_key", submissionSourceKey);
      sessionStorage.setItem("khoi_thong_landing_page_id", cfg.landingPageId || "");
      const thankYouParams = new URLSearchParams({ funnel: finalTargetFunnel });
      if (completeRegistrationEventId) {
        thankYouParams.set("eventId", completeRegistrationEventId);
      }
      navigate(`/cam-on-khoi-thong?${thankYouParams.toString()}`);
    } catch (error) {
      toast.error("Lỗi: " + (error.message || "Không xác định"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="relative rounded-3xl overflow-hidden py-8 sm:py-12"
      style={{
        background: "linear-gradient(145deg, #1A0A02 0%, #2D1005 40%, #3A1A06 70%, #1E0C03 100%)",
        border: "1px solid #8B6010",
        boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,150,26,0.2)",
      }}
      onPointerDownCapture={engageCrm}
      onFocusCapture={engageCrm}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#C9961A] opacity-[0.08] blur-[80px]" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-[#7A2113] opacity-[0.12] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,150,26,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,150,26,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent opacity-30" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-4 sm:mb-12 space-y-2 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-3 sm:px-5 rounded-full text-[9px] sm:text-[11px] font-bold tracking-widest sm:tracking-[0.2em] uppercase border border-[#C9961A]/60 text-[#FFE566] bg-[#C9961A]/10 backdrop-blur-sm whitespace-nowrap">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFE566] animate-pulse flex-shrink-0" />
            CÒN CÁC SUẤT VÉ CUỐI - ĐĂNG KÝ NGAY
          </div>

          <div className="py-1 sm:py-0">
            <h2
              className="font-black text-white tracking-tight"
              style={{ fontSize: "clamp(1.8rem, 6vw, 4rem)", lineHeight: 1.3 }}
            >
              NHẬN VÉ THAM DỰ
            </h2>
            <h2
              className="font-black tracking-tight"
              style={{
                fontSize: "clamp(1.8rem, 6vw, 4rem)",
                lineHeight: 1.3,
                background: "linear-gradient(90deg, #C9961A, #FFE566, #C9961A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HOÀN TOÀN MIỄN PHÍ
            </h2>
          </div>

          <p className="text-[#B89060] text-[12px] sm:text-lg max-w-md mx-auto leading-relaxed tracking-tighter sm:tracking-normal whitespace-nowrap">
            Để lại thông tin - nhận link tham gia <span className="text-[#FFE566] font-semibold">ngay lập tức</span>
          </p>
        </div>

        <div
          className={`${isLeader ? "max-w-xl mx-auto" : ""} rounded-3xl overflow-hidden`}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(201,150,26,0.3)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,150,26,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className={`flex flex-col-reverse ${isLeader ? "" : "md:flex-row md:items-stretch"} capitalize-none`}>
            <div className="flex-1 p-5 sm:p-10 flex flex-col justify-center">
              {remoteConfig.is_maintenance ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center space-y-3">
                  <div className="text-amber-400 font-bold text-lg uppercase tracking-wider">Thông báo bảo trì</div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Hệ thống đang bảo trì để nâng cấp. Vui lòng quay lại sau.
                  </p>
                </div>
              ) : (
                <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9961A]" />
                    <span className="text-[#C9961A] text-[9px] sm:text-xs font-bold uppercase tracking-widest">
                      Điền thông tin - Nhận link ngay!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-5">
                    <div className="space-y-1">
                      <label className="flex flex-wrap items-center gap-x-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/90">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3 shrink-0" /> Họ và tên
                        </span>
                        <span className="text-[#E8393F]" aria-hidden>
                          *
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={handleChange("name")}
                        placeholder="Nhập họ và tên đầy đủ"
                        required
                        minLength={2}
                        autoComplete="name"
                        aria-invalid={errors.name ? true : undefined}
                        aria-required
                        className="w-full rounded-lg px-4 py-2.5 sm:py-3.5 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:outline-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: errors.name ? "1.5px solid #E8393F" : "1px solid rgba(201,150,26,0.2)",
                        }}
                        onFocus={(e) => {
                          e.target.style.border = "1px solid rgba(201,150,26,0.6)";
                          e.target.style.background = "rgba(255,255,255,0.09)";
                        }}
                        onBlur={(e) => {
                          e.target.style.border = errors.name ? "1.5px solid #E8393F" : "1px solid rgba(201,150,26,0.2)";
                          e.target.style.background = "rgba(255,255,255,0.06)";
                          handleAdvancedMatch("name", formState.name);
                        }}
                      />
                      {errors.name && (
                        <p className="text-[#E8393F] text-[9px] font-bold uppercase tracking-widest italic mt-1 ml-1">
                          * Nhập họ và tên (ít nhất 2 ký tự)
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="flex flex-wrap items-center gap-x-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/90">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0" /> Số điện thoại
                        </span>
                        <span className="text-[#E8393F]" aria-hidden>
                          *
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={handleChange("phone")}
                        placeholder="Nhập số điện thoại"
                        required
                        autoComplete="tel"
                        aria-invalid={errors.phone ? true : undefined}
                        aria-required
                        inputMode="numeric"
                        className="w-full rounded-lg px-4 py-2.5 sm:py-3.5 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:outline-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: errors.phone ? "1.5px solid #E8393F" : "1px solid rgba(201,150,26,0.2)",
                        }}
                        onFocus={(e) => {
                          e.target.style.border = "1px solid rgba(201,150,26,0.6)";
                          e.target.style.background = "rgba(255,255,255,0.09)";
                        }}
                        onBlur={(e) => {
                          e.target.style.border = errors.phone ? "1.5px solid #E8393F" : "1px solid rgba(201,150,26,0.2)";
                          e.target.style.background = "rgba(255,255,255,0.06)";
                          handleAdvancedMatch("phone", formState.phone);
                        }}
                      />
                      {errors.phone && (
                        <p className="text-[#E8393F] text-[9px] font-bold uppercase tracking-widest italic mt-1 ml-1">
                          * Nhập số điện thoại (9–11 chữ số)
                        </p>
                      )}
                    </div>

                  </div>

                  {isLeader && (
                    <div className="space-y-4 pt-1">
                      {leaderUtmValue && (
                        <div className="flex items-center gap-2 rounded-lg border border-[#C9961A]/30 bg-[#C9961A]/10 px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[#FFE566]">
                          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            Mã giới thiệu: {matchedUtmLeaderName || leaderUtmValue}
                          </span>
                        </div>
                      )}
                      {lockedLeaderName ? (
                        <div className="space-y-1.5 sm:space-y-2">
                          <span className="block text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/80">
                            LEADER PHỤ TRÁCH
                          </span>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                            <div className="min-w-0 flex-1 flex">
                              <div
                                role="group"
                                aria-label="Leader phụ trách"
                                className="flex min-h-[42px] w-full flex-1 items-center gap-1.5 rounded-lg border border-[#C9961A] bg-[#C9961A]/30 px-2.5 py-2 text-left text-[10px] sm:text-[12px] font-bold uppercase tracking-tight text-[#FFE566] shadow-[0_0_15px_rgba(201,150,26,0.2)] ring-1 ring-[#C9961A]/50 sm:py-2.5"
                              >
                                <span
                                  className="flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border border-[#FFE566] bg-[#C9961A]"
                                  aria-hidden
                                >
                                  <span className="h-1 w-1 rounded-full bg-white" />
                                </span>
                                <span className="truncate">{lockedLeaderName.replace("LEADER ", "")}</span>
                              </div>
                            </div>
                            <div className="flex w-full shrink-0 flex-col sm:w-[10.75rem] sm:self-stretch">
                              {!showAlternateReferrerInput ? (
                                <button
                                  type="button"
                                  onClick={() => setShowAlternateReferrerInput(true)}
                                  className="group flex min-h-[42px] flex-1 w-full items-center gap-2 rounded-lg border border-[#C9961A]/35 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(201,150,26,0.1)] transition-all hover:border-[#C9961A]/55 hover:from-[#C9961A]/12 hover:to-white/[0.04] hover:shadow-[0_0_20px_rgba(201,150,26,0.12)] active:scale-[0.99]"
                                >
                                  <span
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[#C9961A]/30 bg-[#C9961A]/10 transition-colors group-hover:border-[#C9961A]/50 group-hover:bg-[#C9961A]/18"
                                    aria-hidden
                                  >
                                    <UserPlus className="h-4 w-4 text-[#FFE566] opacity-90 group-hover:opacity-100" strokeWidth={2.25} />
                                  </span>
                                  <span className="min-w-0 flex-1 py-0.5">
                                    <span className="block text-[9px] font-black uppercase leading-[1.15] tracking-wide text-[#FFE566]">
                                      Người khác
                                    </span>
                                    <span className="mt-0.5 block text-[8px] font-bold uppercase leading-[1.15] tracking-wide text-[#FFE566]/55 group-hover:text-[#FFE566]/80">
                                      giới thiệu tôi
                                    </span>
                                  </span>
                                </button>
                              ) : (
                                <div className="flex min-h-[42px] flex-1 w-full items-center gap-1 rounded-lg border border-[#C9961A]/45 bg-white/[0.08] py-1 pl-2 pr-1 shadow-[inset_0_1px_0_rgba(201,150,26,0.12)]">
                                  <input
                                    type="text"
                                    value={formState.otherReferrer}
                                    onChange={handleChange("otherReferrer")}
                                    placeholder="Tên người giới thiệu"
                                    autoComplete="off"
                                    className="min-w-0 flex-1 bg-transparent py-1 text-[11px] sm:text-xs text-white placeholder:text-white/35 focus:outline-none"
                                    style={{
                                      border: "none",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    aria-label="Thu gọn"
                                    onClick={() => {
                                      setShowAlternateReferrerInput(false);
                                      setFormState((prev) => ({ ...prev, otherReferrer: "" }));
                                      setErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.otherReferrer;
                                        return next;
                                      });
                                    }}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
                                  >
                                    <X className="h-4 w-4" strokeWidth={2.25} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {errors.referrer && (
                            <p className="text-[#E8393F] text-[9px] font-bold uppercase tracking-widest animate-pulse italic mt-1 ml-1">
                              * Vui lòng chọn
                            </p>
                          )}
                        </div>
                      ) : (
                        <CustomRadio
                          label="AI LÀ NGƯỜI GIỚI THIỆU BẠN ?"
                          options={dynamicReferrerOptions}
                          value={formState.referrer}
                          onChange={(val) => setRadioValue("referrer", val)}
                          error={errors.referrer}
                          layout="grid"
                        />
                      )}

                      {!lockedLeaderName && formState.referrer === OTHER_REFERRER_OPTION && (
                        <div className="rounded-xl border border-[#C9961A]/35 bg-white/[0.04] px-3 py-2.5 space-y-1.5 shadow-[inset_0_1px_0_rgba(201,150,26,0.12),0_8px_24px_rgba(0,0,0,0.15)]">
                          <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/90">
                            <User className="w-3 h-3" /> Tên người giới thiệu
                          </label>
                          <input
                            type="text"
                            value={formState.otherReferrer}
                            onChange={handleChange("otherReferrer")}
                            placeholder="Nhập tên người đã giới thiệu bạn"
                            required
                            className="w-full rounded-lg px-3 py-2 sm:py-2.5 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: errors.otherReferrer ? "1.5px solid #E8393F" : "1px solid rgba(201,150,26,0.25)",
                            }}
                            onFocus={(e) => {
                              e.target.style.border = "1px solid rgba(201,150,26,0.6)";
                              e.target.style.background = "rgba(255,255,255,0.09)";
                            }}
                            onBlur={(e) => {
                              e.target.style.border = errors.otherReferrer ? "1.5px solid #E8393F" : "1px solid rgba(201,150,26,0.25)";
                              e.target.style.background = "rgba(255,255,255,0.06)";
                            }}
                          />
                          {errors.otherReferrer && (
                            <p className="text-[#E8393F] text-[9px] font-bold uppercase tracking-widest animate-pulse italic mt-1 ml-1">
                              * Vui lòng nhập tên người giới thiệu
                            </p>
                          )}
                        </div>
                      )}

                      <CustomRadio
                        label="BẠN ĐÃ HỌC LUẬT HẤP DẪN CỦA THẦY MONG CHƯA ?"
                        options={OPTIONS_LOA}
                        value={formState.hasLearnedLOA}
                        onChange={(val) => setRadioValue("hasLearnedLOA", val)}
                        error={errors.hasLearnedLOA}
                        layout="row"
                        requiredMark
                        errorMessage="* Bắt buộc chọn: Đã học hoặc Chưa học"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl py-3.5 sm:py-4 font-black uppercase tracking-[0.08em] text-sm sm:text-base transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group whitespace-nowrap"
                    style={{
                      background: isSubmitting
                        ? "rgba(122,33,19,0.5)"
                        : "linear-gradient(135deg, #E8393F 0%, #C9961A 50%, #E8393F 100%)",
                      color: "#FFE566",
                      boxShadow: "0 12px 32px rgba(232,57,63,0.35)",
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-[#FFE566]/50 border-t-[#FFE566] rounded-full animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          YES! TÔI ĐĂNG KÝ THAM GIA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </div>

            {!isLeader && (
              <div className="hidden md:flex w-full md:w-1/2 p-4 pb-0 md:p-10 flex-shrink-0 items-center">
                <div className="relative w-full aspect-video md:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-[#C9961A]/20 group/banner">
                  <img
                    src={BANNER_URL}
                    alt="Khơi Thông Dòng Tiền"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-110"
                    loading="lazy"
                    decoding="async"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormDangKy;
