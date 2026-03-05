import { ArrowRight, User, Phone, Sparkles, CheckCircle2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { submitToCRM } from "../../../services/crmService";
import { toast } from "react-hot-toast";
import { crmFirestore } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

const BANNER_URL = "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682614/Kh%C6%A1i_Th%C3%B4ng_D%C3%B2ng_Ti%E1%BB%81n_M%C3%A0u_Xanh_sjajsx.jpg";

const BENEFITS = [
  "Tháo gỡ tắc nghẽn năng lượng tiền bạc",
  "Kích hoạt dòng chảy tài chính tự nhiên",
  "Nhận link tham dự ngay sau đăng ký",
];

const FormDangKy = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ name: "", phone: "" });
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState({ active_source_key: "", is_maintenance: false, isLoading: true });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const normalizePath = (p) => {
          if (!p) return "/";
          let path = p.split("?")[0].split("#")[0];
          return path.replace(/\/+$/, "") || "/";
        };
        const currentPath = normalizePath(window.location.pathname);
        const { collection, getDocs } = await import("firebase/firestore");
        const querySnap = await getDocs(collection(crmFirestore, "landing_pages"));
        const matchDoc = querySnap.docs.find(d =>
          normalizePath(d.data().slug || "") === currentPath ||
          d.id === "khoi-thong-dong-tien" ||
          currentPath.includes("khoi-thong-dong-tien")
        );
        if (matchDoc) {
          setRemoteConfig({ ...matchDoc.data(), isLoading: false });
        } else {
          const docRef = doc(crmFirestore, "public_settings", "landing_config");
          const docSnap = await getDoc(docRef);
          setRemoteConfig(docSnap.exists() ? { ...docSnap.data(), isLoading: false } : prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setRemoteConfig(prev => ({ ...prev, isLoading: false }));
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (field) => (e) => setFormState(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const sourceKey = searchParams.get("source_key") || searchParams.get("src") || remoteConfig.active_source_key || "organic_web";
      await submitToCRM({
        name: formState.name, phone: formState.phone, email: formState.email,
        source_key: sourceKey,
        utm_source: searchParams.get("utm_source") || "",
        utm_medium: searchParams.get("utm_medium") || "",
        utm_campaign: searchParams.get("utm_campaign") || "",
        utm_content: searchParams.get("utm_content") || "",
        utm_term: searchParams.get("utm_term") || "",
      });

      const sha256 = async (string) => {
        const utf8 = new TextEncoder().encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
      };

      const hashedPhone = await sha256(formState.phone.replace(/\D/g, '').replace(/^0/, '84'));
      const eventId = 'register_' + Date.now() + Math.random().toString(36).substr(2, 5);

      if (remoteConfig.fbPixel && remoteConfig.fbCapiToken) {
        try {
          const fbCapiUrl = `https://graph.facebook.com/v19.0/${remoteConfig.fbPixel}/events?access_token=${remoteConfig.fbCapiToken}`;
          const payload = {
            data: [{
              event_name: "CompleteRegistration",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_id: eventId,
              user_data: { ph: [hashedPhone] },
              custom_data: { value: 0, currency: "VND" }
            }]
          };
          fetch(fbCapiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(console.error);
        } catch (e) {
          console.error("CAPI Error:", e);
        }
      }

      toast.success("Đăng ký thành công!");
      setFormState({ name: "", phone: "" });
      navigate(`/cam-on-khoi-thong?eventId=${eventId}`);
    } catch (error) {
      toast.error("Lỗi: " + (error.message || "Không xác định"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="dang-ky"
      className="relative rounded-3xl overflow-hidden py-14 sm:py-20"
      style={{
        background: "linear-gradient(145deg, #1A0A02 0%, #2D1005 40%, #3A1A06 70%, #1E0C03 100%)",
        border: "1px solid #8B6010",
        boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,150,26,0.2)",
      }}
    >
      {/* ── Decorative elements ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gold glow top-left */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#C9961A] opacity-[0.08] blur-[80px]" />
        {/* Red glow bottom-right */}
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-[#7A2113] opacity-[0.12] blur-[100px]" />
        {/* Subtle gold grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(201,150,26,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,150,26,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Top golden line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent opacity-60" />
        {/* Bottom golden line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent opacity-30" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-8">

        {/* ── HEADER ── */}
        <div className="text-center mb-12 space-y-4">
          {/* Urgency badge */}
          <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase border border-[#C9961A]/60 text-[#FFE566] bg-[#C9961A]/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#FFE566] animate-pulse" />
            CÒN CÁC SUẤT VÉ CUỐI — ĐĂNG KÝ NGAY
          </div>

          {/* Main title */}
          <div>
            <h2
              className="font-black text-white tracking-tight"
              style={{ fontSize: "clamp(2rem, 6vw, 4rem)", lineHeight: 1.15 }}
            >
              NHẬN VÉ THAM DỰ
            </h2>
            <h2
              className="font-black tracking-tight"
              style={{
                fontSize: "clamp(2rem, 6vw, 4rem)",
                lineHeight: 1.15,
                background: "linear-gradient(90deg, #C9961A, #FFE566, #C9961A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HOÀN TOÀN MIỄN PHÍ
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-[#B89060] text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Để lại thông tin — nhận link tham gia <span className="text-[#FFE566] font-semibold">ngay lập tức</span>
          </p>
        </div>

        {/* ── MAIN CARD ── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(201,150,26,0.3)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,150,26,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* ── 2 COLUMN: form left | image right (16:9) ── */}
          <div className="flex flex-col-reverse md:flex-row md:items-center">

            {/* Form column — LEFT */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center">
              {remoteConfig.is_maintenance ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center space-y-3">
                  <div className="text-amber-400 font-bold text-lg uppercase tracking-wider">Thông báo bảo trì</div>
                  <p className="text-white/70 text-sm leading-relaxed">Hệ thống đang bảo trì để nâng cấp. Vui lòng quay lại sau!</p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#C9961A]" />
                    <span className="text-[#C9961A] text-xs font-bold uppercase tracking-widest">Điền thông tin — Nhận link ngay!</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C9961A]">
                      <User className="w-3.5 h-3.5" /> Họ và tên
                    </label>
                    <input
                      type="text" value={formState.name} onChange={handleChange("name")}
                      placeholder="Nhập họ và tên đầy đủ" required
                      className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,150,26,0.25)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)" }}
                      onFocus={e => { e.target.style.border = "1px solid rgba(201,150,26,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,150,26,0.12)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
                      onBlur={e => { e.target.style.border = "1px solid rgba(201,150,26,0.25)"; e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C9961A]">
                      <Phone className="w-3.5 h-3.5" /> Số điện thoại
                    </label>
                    <input
                      type="tel" value={formState.phone} onChange={handleChange("phone")}
                      placeholder="Nhập số điện thoại" required
                      className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,150,26,0.25)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)" }}
                      onFocus={e => { e.target.style.border = "1px solid rgba(201,150,26,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,150,26,0.12)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
                      onBlur={e => { e.target.style.border = "1px solid rgba(201,150,26,0.25)"; e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                    />
                  </div>

                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full rounded-2xl py-4 font-black uppercase tracking-[0.1em] text-base transition-all duration-200 hover:-translate-y-[2px] disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: isSubmitting ? "rgba(122,33,19,0.5)" : "linear-gradient(135deg, #E8393F 0%, #C9961A 50%, #E8393F 100%)", color: "#FFE566", boxShadow: "0 12px 32px rgba(232,57,63,0.45)" }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting
                        ? <><span className="w-4 h-4 border-2 border-[#FFE566]/50 border-t-[#FFE566] rounded-full animate-spin" />Đang xử lý...</>
                        : <>NHẬN VÉ MIỄN PHÍ NGAY <ArrowRight className="w-5 h-5" /></>
                      }
                    </span>
                  </button>
                  <p className="text-center text-white/30 text-xs">🔒 Thông tin của bạn được bảo mật tuyệt đối</p>
                </form>
              )}
            </div>

            {/* Image column — RIGHT */}
            <div className="w-full md:w-1/2 p-6 sm:p-10 flex-shrink-0">
              {/* Added rounded corners and shadow to make the 16:9 image look like a embedded card inside its column */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#C9961A]/20">
                <img
                  src={BANNER_URL}
                  alt="Khơi Thông Dòng Tiền"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Course Title Overlay */}
                <div className="absolute top-4 left-4">
                   <div className="inline-block py-1 px-3 rounded text-[10px] font-bold tracking-widest uppercase border border-[#C9961A]/30 bg-black/50 text-[#C9961A] backdrop-blur-sm">
                      Khoá học
                   </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default FormDangKy;
