import { ArrowRight, Phone, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { onValue, ref } from "firebase/database";
import { crmFirestore, crmRealtimeDB } from "../../../firebase";
import { submitToCRM } from "../../../services/crmService";
import {
  createMetaEventId,
  getMetaBrowserData,
  hashData,
  initMetaPixel,
  normalizeNameForHash,
  resolveMetaEventData,
  setMetaUserData,
  trackMetaEvent,
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
  isLoading: true,
  fbCurrency: "VND",
  fbEventValue: 0,
  course_k: "K41", // Giá trị mặc định
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

const OPTIONS_REFERRER = [
  "Văn Trường",
  "Đức Tuệ",
  "Thành Seven",
  "Thầy Mong Thành",
  "Người khác giới thiệu tôi",
];

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

const matchLeaderNameFromUtm = (leaderNames = [], value = "") => {
  const compactValue = compactLeaderIdentity(value);
  if (!compactValue) return "";

  return (
    leaderNames.find((name) => {
      const compactName = compactLeaderIdentity(name);
      return compactName === compactValue ||
        compactName.includes(compactValue) ||
        compactValue.includes(compactName);
    }) || ""
  );
};

const CustomRadio = ({ label, options, value, onChange, error, layout = "grid" }) => (
  <div className="space-y-1.5 sm:space-y-2">
    <label className="block text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/80">
      {label}
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
        * Vui lòng chọn
      </p>
    )}
  </div>
);

const FormDangKy = ({ targetFunnel, source_key: initialSourceKey }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState({ name: "", phone: "", referrer: "", hasLearnedLOA: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState(DEFAULT_REMOTE_CONFIG);
  const [leaderOwners, setLeaderOwners] = useState([]);

  const currentPathNormalized = normalizePath(window.location.pathname);
  const leaderUtmValue =
    searchParams.get("leader") ||
    searchParams.get("from") ||
    searchParams.get("ref") ||
    searchParams.get("utm_source") ||
    searchParams.get("utm_campaign") ||
    searchParams.get("utm_content") ||
    "";
  const dynamicReferrerOptions = leaderOwners.length > 0
    ? [...leaderOwners.map((item) => item.name).filter(Boolean), "Người khác giới thiệu tôi"]
    : OPTIONS_REFERRER;
  const matchedUtmLeaderName = matchLeaderNameFromUtm(dynamicReferrerOptions, leaderUtmValue);
  
  // --- PHÂN LUỒNG NGHIÊM NGẶT (Strict Routing Protocol) ---
  // Ưu tiên Props (Hardcoded) > Cấu hình Admin (Remote) > Logic đường dẫn (URL)
  const isLeader =
    targetFunnel === "leader" ||
    targetFunnel === "leader_funnel" ||
    String(remoteConfig.targetFunnel || "").toLowerCase().includes("leader") ||
    (remoteConfig.funnel_type && remoteConfig.funnel_type.toLowerCase().includes("leader")) ||
    (currentPathNormalized.includes("leader") && !targetFunnel);

  const finalFunnel = isLeader ? "leader" : "ads";
  const finalSourceKey = remoteConfig.active_source_key || initialSourceKey || "organic_web";

  // Debug để kiểm soát luồng
  useEffect(() => {
    console.log(`[FormSync] 🛰 Resolved Channel: ${finalFunnel} | Key: ${finalSourceKey}`);
  }, [finalFunnel, finalSourceKey]);

  useEffect(() => {
    const usersRef = ref(crmRealtimeDB, "system_settings/users");
    const unsubscribe = onValue(
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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLeader || formState.referrer || !matchedUtmLeaderName) return;
    setFormState((prev) => ({ ...prev, referrer: matchedUtmLeaderName }));
  }, [isLeader, formState.referrer, matchedUtmLeaderName]);

  useEffect(() => {
    let isCancelled = false;

    const fetchConfig = async () => {
      try {
        const normalizedRequestPath = normalizePath(window.location.pathname);
        console.log("[FormDangKy] 🔍 Attempting to match slug:", normalizedRequestPath);

        const querySnap = await getDocs(collection(crmFirestore, "landing_pages"));
        
        // 1. Ưu tiên tìm CHÍNH XÁC theo Slug (Đã chuẩn hóa)
        let matchDoc = querySnap.docs.find((item) => {
          const configSlug = normalizePath(item.data().slug || "");
          return configSlug !== "root" && configSlug === normalizedRequestPath;
        });

        // 2. Nếu không thấy chính xác, mới tìm theo ID (Fallback cho các bản cũ hoặc trang chính)
        if (!matchDoc) {
          matchDoc = querySnap.docs.find((item) => {
            const configSlug = normalizePath(item.data().slug || "");
            return (
              (item.id === "khoi-thong-dong-tien" || configSlug === "dao-tao/khoi-thong-dong-tien") &&
              normalizedRequestPath.includes("khoi-thong-dong-tien") && 
              !normalizedRequestPath.includes("leader")
            );
          });
        }

        if (isCancelled) return;

        if (matchDoc) {
          const configData = matchDoc.data();
          console.log("[FormDangKy] ✅ Matched Firestore Config:", matchDoc.id, configData);
          setRemoteConfig({
            ...DEFAULT_REMOTE_CONFIG,
            ...configData,
            landingPageId: matchDoc.id,
            isLoading: false,
          });
          return;
        }

        console.log("[FormDangKy] ⚠️ No specific slug match found in Firestore. Falling back to public_settings.");

        const docRef = doc(crmFirestore, "public_settings", "landing_config");
        const docSnap = await getDoc(docRef);
        if (isCancelled) return;

        setRemoteConfig(
          docSnap.exists()
            ? {
                ...DEFAULT_REMOTE_CONFIG,
                ...docSnap.data(),
                isLoading: false,
              }
            : { ...DEFAULT_REMOTE_CONFIG, isLoading: false }
        );
      } catch {
        if (!isCancelled) {
          setRemoteConfig((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    fetchConfig();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleAdvancedMatch = async (field, value) => {
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
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const setRadioValue = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    // Validation
    const newErrors = {};
    if (!formState.name.trim()) newErrors.name = true;
    if (!formState.phone.trim()) newErrors.phone = true;

    // Chỉ bắt buộc câu hỏi phụ cho Leader Funnel
    if (isLeader) {
      if (!formState.referrer) newErrors.referrer = true;
      if (!formState.hasLearnedLOA) newErrors.hasLearnedLOA = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[FormDangKy] 🔍 DEBUG:", {
        isLeader,
        initialSourceKey,
        currentPath: window.location.pathname,
        batch_id: remoteConfig.course_k,
        active_source_key: remoteConfig.active_source_key,
        isLoading_config: remoteConfig.isLoading,
      });

      // ===== SỬ DỤNG LUỒNG DỮ LIỆU ĐÃ CHUẨN HÓA (Strict Sync) =====
      const baseKey = finalSourceKey;
      const currentFunnel = finalFunnel;
      
      // Xác định người giới thiệu (Leader)
      const isReferrerLeader = formState.referrer && formState.referrer !== "Người khác giới thiệu tôi";
      const leaderUtmSlug = createLeaderUtmSlug(leaderUtmValue || formState.referrer);
      const selectedLeaderName = isReferrerLeader ? formState.referrer.trim() : "";
      
      // Routing logic: Nếu là phễu Leader hoặc có referrer cụ thể → gửi vào nhóm Leader
      let finalTargetFunnel;
      let funnelChannel;
      let assignedTo = selectedLeaderName;

      if (currentFunnel === "leader" || isReferrerLeader) {
        finalTargetFunnel = "leader";
        funnelChannel = "leader_funnel";
      } else {
        finalTargetFunnel = "ads";
        funnelChannel = "ads_funnel";
      }

      // Lấy Khóa K hiện tại (mặc định K41 nếu không có trong config)
      const currentBatch = remoteConfig.course_k || "K41";
      const batchSuffix = `_k${currentBatch.toLowerCase().replace(/k/g, "")}`;

      // Đảm bảo mã nguồn luôn có hậu tố khóa (VD: _k41)
      const submissionSourceKey = (() => {
        if (baseKey.toLowerCase().match(/_k\d+$/i)) return baseKey;
        return `${baseKey}${batchSuffix}`;
      })();

      console.log("[FormDangKy] 🚀 SUBMITTING PAYLOAD:", { 
        funnel: finalTargetFunnel, 
        channel: funnelChannel, 
        source: submissionSourceKey,
        assignedTo
      });

      const crmResponse = await submitToCRM({
        name: formState.name,
        phone: formState.phone.replace(/\s/g, ""),
        email: "",
        utm_source: searchParams.get("utm_source") || "",
        utm_medium: searchParams.get("utm_medium") || (leaderUtmSlug ? "leader" : ""),
        utm_campaign: searchParams.get("utm_campaign") || (leaderUtmSlug ? `${submissionSourceKey}_${leaderUtmSlug}` : ""),
        utm_content: searchParams.get("utm_content") || "",
        utm_term: searchParams.get("utm_term") || "",
        courseName: "Khơi Thông Dòng Tiền - Phễu",
        targetFunnel: finalTargetFunnel,
        funnel_type: finalTargetFunnel, // "ads" hoặc "leader"
        source_type: finalTargetFunnel === "ads" ? "ads" : "leader_funnel", 
        funnel_channel: funnelChannel, 
        assigned_to: assignedTo,
        registered_loa: formState.hasLearnedLOA,
        is_learned_loa: formState.hasLearnedLOA,
        referrer: formState.referrer || "",
        leaderName: selectedLeaderName,
        leader_utm: leaderUtmSlug,
        leaderUtm: leaderUtmSlug,
        leaderSlug: leaderUtmSlug,
        introducedBy: selectedLeaderName,
        staff_in_charge: assignedTo,
        course_k: currentBatch,
        batch_id: currentBatch,
        source_key: submissionSourceKey,
        sourceUrl: window.location.href,
        landingPageId: remoteConfig.landingPageId || "",
        landingPageSlug: currentPathNormalized,
      });

      const sha256 = async (input) => {
        const utf8 = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
      };

      const normalizeForHash = (value) =>
        value
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "");

      const normalizedPhone = formState.phone.replace(/\D/g, "").replace(/^0/, "84");
      const hashedPhone = normalizedPhone ? await sha256(normalizedPhone) : "";

      const nameParts = formState.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
      const lastName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";
      const hashedFn = firstName ? await sha256(normalizeForHash(firstName)) : "";
      const hashedLn = lastName ? await sha256(normalizeForHash(lastName)) : "";
      const hashedExternalId = crmResponse?.id ? await sha256(String(crmResponse.id)) : "";

      const completeRegistrationEventId = createMetaEventId("complete_registration");
      const leadEventId = createMetaEventId("lead");
      const metaEventData = resolveMetaEventData(remoteConfig);
      const leadEventData = {
        content_name: "Đăng ký Khơi Thông Dòng Tiền",
        ...metaEventData,
      };

      const userDataCommon = {
        ...(hashedPhone ? { ph: [hashedPhone] } : {}),
        ...(hashedFn ? { fn: [hashedFn] } : {}),
        ...(hashedLn ? { ln: [hashedLn] } : {}),
        ...(hashedExternalId ? { external_id: [hashedExternalId] } : {}),
      };

      if (remoteConfig.fbPixel) {
        initMetaPixel(remoteConfig.fbPixel);
        setMetaUserData(userDataCommon);
        trackMetaEvent("Lead", leadEventData, { eventID: leadEventId });
        trackMetaEvent("CompleteRegistration", metaEventData, {
          eventID: completeRegistrationEventId,
        });
      }

      if (remoteConfig.fbPixel && remoteConfig.fbCapiToken) {
        try {
          let clientIp = "";

          try {
            const ipResponse = await fetch("https://api64.ipify.org?format=json");
            const ipData = await ipResponse.json();
            clientIp = ipData.ip || "";
          } catch (ipError) {
            console.error("IP Fetch Error:", ipError);
          }

          const { fbp, fbc } = getMetaBrowserData(window.location.search);
          const userDataCapi = {
            ...userDataCommon,
            ...(clientIp ? { client_ip_address: clientIp } : {}),
            client_user_agent: navigator.userAgent,
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {}),
          };
          const eventTime = Math.floor(Date.now() / 1000);
          const payload = {
            data: [
              {
                event_name: "Lead",
                event_time: eventTime,
                action_source: "website",
                event_id: leadEventId,
                event_source_url: window.location.href,
                user_data: userDataCapi,
                custom_data: leadEventData,
              },
              {
                event_name: "CompleteRegistration",
                event_time: eventTime,
                action_source: "website",
                event_id: completeRegistrationEventId,
                event_source_url: window.location.href,
                user_data: userDataCapi,
                custom_data: metaEventData,
              },
            ],
          };

          const fbCapiUrl = `https://graph.facebook.com/v19.0/${remoteConfig.fbPixel}/events?access_token=${remoteConfig.fbCapiToken}`;
          fetch(fbCapiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify(payload),
          }).catch(console.error);
        } catch (capiError) {
          console.error("CAPI Error:", capiError);
        }
      }

      toast.success("Đăng ký thành công!");
      setFormState({ name: "", phone: "", referrer: "", hasLearnedLOA: "" });
      navigate(`/cam-on-khoi-thong?eventId=${encodeURIComponent(completeRegistrationEventId)}`);
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
        <div id="dang-ky" className="text-center mb-4 sm:mb-12 space-y-2 sm:space-y-4 scroll-mt-2 sm:scroll-mt-4">
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
                      <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/90">
                        <User className="w-3 h-3" /> Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={handleChange("name")}
                        placeholder="Nhập họ và tên đầy đủ"
                        required
                        autoComplete="name"
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
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C9961A]/90">
                        <Phone className="w-3 h-3" /> Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={handleChange("phone")}
                        placeholder="Nhập số điện thoại"
                        required
                        autoComplete="tel"
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
                      <CustomRadio
                        label="AI LÀ NGƯỜI GIỚI THIỆU BẠN ?"
                        options={dynamicReferrerOptions}
                        value={formState.referrer}
                        onChange={(val) => setRadioValue("referrer", val)}
                        error={errors.referrer}
                        layout="grid"
                      />

                      <CustomRadio
                        label="BẠN ĐÃ HỌC LUẬT HẤP DẪN CỦA THẦY MONG CHƯA ?"
                        options={OPTIONS_LOA}
                        value={formState.hasLearnedLOA}
                        onChange={(val) => setRadioValue("hasLearnedLOA", val)}
                        error={errors.hasLearnedLOA}
                        layout="row"
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
