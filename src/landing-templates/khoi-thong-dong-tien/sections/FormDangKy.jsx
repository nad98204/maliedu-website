import { ArrowRight } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { submitToCRM } from "../../../services/crmService";
import { toast } from "react-hot-toast";
import { crmFirestore } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

const BANNER_URL = "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682614/Kh%C6%A1i_Th%C3%B4ng_D%C3%B2ng_Ti%E1%BB%81n_M%C3%A0u_Xanh_sjajsx.jpg";

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

        // Hash data đơn giản (Lưu ý: trên production nên dùng sha256)
        const sha256 = async (string) => {
          const utf8 = new TextEncoder().encode(string);
          const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
        };

        const hashedPhone = await sha256(formState.phone.replace(/\D/g, '').replace(/^0/, '84'));
        const eventId = 'register_' + Date.now() + Math.random().toString(36).substr(2, 5);

        // Gửi event Facebook CAPI nếu có cấu hình
        if (remoteConfig.fbPixel && remoteConfig.fbCapiToken) {
          try {
            const fbCapiUrl = `https://graph.facebook.com/v19.0/${remoteConfig.fbPixel}/events?access_token=${remoteConfig.fbCapiToken}`;
            
            const payload = {
              data: [
                {
                  event_name: "CompleteRegistration",
                  event_time: Math.floor(Date.now() / 1000),
                  action_source: "website",
                  event_id: eventId,
                  user_data: {
                    ph: [hashedPhone]
                  },
                  custom_data: {
                    value: 0,
                    currency: "VND"
                  }
                }
              ]
            };

            fetch(fbCapiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            }).catch(console.error); // Ignore CAPI errors so the user UI doesn't break
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
      className="relative rounded-3xl py-14 sm:py-16 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FDF5E4 0%, #F7EBCC 100%)", border: "1px solid #D4B572", boxShadow: "0 20px 50px rgba(122,33,19,0.06)" }}
    >
      {/* Orb bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-[-80px] w-[280px] h-[280px] bg-[#7A2113] rounded-full blur-[120px] opacity-10" />
        <div className="absolute bottom-[-180px] right-[-100px] w-[360px] h-[360px] bg-[#C9961A] rounded-full blur-[140px] opacity-10" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <span className="inline-block py-1.5 px-4 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase border border-[#C9961A] bg-white/60 text-[#7A2113] mb-1">
            CÒN CÁC SUẤT VÉ CUỐI - HÃY ĐĂNG KÝ NGAY!
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A2208] uppercase tracking-[0.06em]">
            <span className="block">NHẬN VÉ THAM DỰ</span>
            <span className="block mt-1">MIỄN PHÍ</span>
          </h2>
          <p className="text-base text-[#5C3A1A] leading-relaxed">
            <span className="block">Vui lòng để lại thông tin để nhận link</span>
            <span className="block">tham gia chương trình.</span>
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden border border-[#D4B572]"
             style={{ boxShadow: "0 16px 40px rgba(122,33,19,0.1)", background: "white" }}>
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-0 items-stretch">
            {/* Left – banner image */}
            <div className="relative w-full h-full min-h-[240px] sm:min-h-[300px] md:min-h-full overflow-hidden bg-[#3A1A00]">
              <img src={BANNER_URL} alt="Khơi Thông Dòng Tiền" className="absolute inset-0 h-full w-full object-cover" />
            </div>

            {/* Right – form */}
            <div className="p-6 sm:p-8 space-y-5 flex flex-col justify-center">
              {remoteConfig.is_maintenance ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="text-amber-600 font-bold text-lg uppercase tracking-wider">Thông báo bảo trì</div>
                  <p className="text-[#3A2208] text-base leading-relaxed">Hệ thống đang bảo trì để nâng cấp. Vui lòng quay lại sau!</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {[
                    { label: "Họ và tên", field: "name", type: "text", placeholder: "Nhập họ và tên" },
                    { label: "Số điện thoại", field: "phone", type: "tel", placeholder: "Nhập số điện thoại" },
                  ].map(({ label, field, type, placeholder }) => (
                    <label key={field} className="flex flex-col gap-1.5 text-sm font-semibold text-[#7A2113]">
                      {label}
                      <input
                        type={type}
                        value={formState[field]}
                        onChange={handleChange(field)}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-[#D4B572] bg-[#FFFCF5] px-4 py-3 text-[#3A2208] placeholder:text-[#A08060] focus:outline-none focus:ring-2 focus:ring-[#C9961A]/60 transition"
                        required
                      />
                    </label>
                  ))}

                  <div className="flex justify-center pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold uppercase tracking-[0.1em] text-[#FFE566] text-sm transition hover:-translate-y-[2px] disabled:opacity-70"
                      style={{ background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)", boxShadow: "0 10px 28px rgba(156,12,18,0.4)" }}
                    >
                      {isSubmitting ? "Đang xử lý..." : "NHẬN VÉ NGAY"}
                      {!isSubmitting && <ArrowRight className="w-5 h-5 text-[#FFE566]" />}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormDangKy;
