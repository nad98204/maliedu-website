import { useEffect, useId, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  ClipboardCheck,
  Compass,
  Flag,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Phone,
  Route,
  Sparkles,
  Target,
  User,
  Users,
  X,
} from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import SEO from "../../../components/SEO";
import { db } from "../../../firebase";
import { submitToCRM } from "../../../services/crmService";
import {
  buildLeadSearchKeywords,
  normalizeLeadPhoneDigits,
  normalizeLeadSearchText,
} from "../../../utils/leadSearch";

const COURSE_IMAGE =
  "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682425/V%C3%BAt_T%E1%BB%91c_M%E1%BB%A5c_Ti%C3%AAu_2024_b%E1%BA%A3n_2_d6mhn3.jpg";

const painPoints = [
  "Có mục tiêu nhưng chưa biết bắt đầu từ đâu.",
  "Thường trì hoãn và dễ mất động lực giữa chừng.",
  "Làm rất nhiều nhưng kết quả chưa tương xứng.",
  "Thiếu một kế hoạch rõ ràng để theo dõi mỗi ngày.",
];

const outcomes = [
  {
    icon: <Target className="h-7 w-7" />,
    title: "Rõ mục tiêu",
    text: "Xác định điều thực sự quan trọng và kết quả bạn muốn đạt được.",
  },
  {
    icon: <Route className="h-7 w-7" />,
    title: "Có lộ trình",
    text: "Chia mục tiêu lớn thành các bước nhỏ, cụ thể và dễ thực hiện.",
  },
  {
    icon: <ClipboardCheck className="h-7 w-7" />,
    title: "Biết hành động",
    text: "Xây dựng kế hoạch phù hợp với thời gian và hoàn cảnh hiện tại.",
  },
  {
    icon: <Flag className="h-7 w-7" />,
    title: "Bền bỉ tới đích",
    text: "Duy trì sự tập trung, đo lường tiến độ và điều chỉnh đúng lúc.",
  },
];

const modules = [
  ["01", "Xác định đích đến", "Làm rõ mục tiêu và lý do bạn thực sự muốn đạt được mục tiêu đó."],
  ["02", "Nhận diện rào cản", "Nhìn thấy những thói quen, niềm tin và sự trì hoãn đang giữ bạn lại."],
  ["03", "Thiết kế bản đồ mục tiêu", "Chuyển mong muốn thành những cột mốc có thể quan sát và đo lường."],
  ["04", "Lập kế hoạch hành động", "Biết việc nào cần ưu tiên và bắt đầu bằng bước phù hợp nhất."],
  ["05", "Duy trì kỷ luật", "Tạo cách theo dõi đơn giản để không bỏ cuộc sau những ngày đầu."],
  ["06", "Đánh giá và bứt phá", "Kiểm tra tiến độ, điều chỉnh kế hoạch và tiếp tục tiến về phía trước."],
];

const audiences = [
  "Người đang có nhiều mục tiêu nhưng chưa biết ưu tiên.",
  "Người thường xuyên trì hoãn hoặc bỏ cuộc giữa chừng.",
  "Người muốn cải thiện công việc, tài chính và chất lượng cuộc sống.",
  "Người cần một phương pháp rõ ràng để biến mục tiêu thành hành động.",
];

const faqs = [
  {
    question: "Tôi chưa xác định được mục tiêu rõ ràng thì có tham gia được không?",
    answer:
      "Có. Chương trình bắt đầu từ việc giúp bạn nhìn lại điều mình thực sự mong muốn, sau đó mới xây dựng mục tiêu và kế hoạch phù hợp.",
  },
  {
    question: "Tôi lớn tuổi và không giỏi công nghệ có tham gia được không?",
    answer:
      "Được. Nội dung được trình bày rõ ràng, từng bước và dễ áp dụng. Sau khi đăng ký, đội ngũ Mali Edu sẽ liên hệ hướng dẫn cụ thể.",
  },
  {
    question: "Sau khi để lại thông tin, tôi cần làm gì tiếp theo?",
    answer:
      "Bạn chỉ cần giữ điện thoại. Đội ngũ Mali Edu sẽ liên hệ để tư vấn lịch học, hình thức học và các thông tin cần thiết.",
  },
  {
    question: "Tôi có phải thanh toán ngay khi đăng ký không?",
    answer:
      "Không. Việc điền thông tin là để nhận tư vấn. Bạn sẽ được cung cấp đầy đủ thông tin trước khi quyết định tham gia.",
  },
];

const SectionHeading = ({ eyebrow, title, description }) => (
  <div className="mx-auto mb-7 max-w-3xl text-left sm:mb-12 sm:text-center">
    {eyebrow ? (
      <p className="mb-2.5 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#B91C1C] sm:mb-3 sm:text-base sm:tracking-[0.14em]">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="text-[27px] font-black leading-[1.22] tracking-[-0.02em] text-[#242424] sm:text-4xl sm:tracking-normal lg:text-[42px]">
      {title}
    </h2>
    {description ? (
      <p className="mx-auto mt-3 max-w-2xl text-[17px] leading-7 text-[#555] sm:mt-4 sm:text-xl sm:leading-8">
        {description}
      </p>
    ) : null}
  </div>
);

const CtaButton = ({ onClick, label = "TÔI MUỐN ĐĂNG KÝ", className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#D62828] px-5 py-4 text-center text-[17px] font-black text-white shadow-[0_10px_24px_rgba(214,40,40,0.24)] transition active:scale-[0.985] hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-200 sm:w-auto sm:min-w-[320px] sm:rounded-xl sm:px-6 sm:text-lg ${className}`}
  >
    {label}
    <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
  </button>
);

const RegistrationModal = ({ isOpen, onClose }) => {
  const titleId = useId();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field) => (event) => {
    const value = field === "phone"
      ? event.target.value.replace(/[^\d+\s.-]/g, "")
      : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: false }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = form.name.trim();
    const phone = normalizeLeadPhoneDigits(form.phone);
    const nextErrors = {
      name: name.length < 2,
      phone: phone.length < 9 || phone.length > 11,
    };

    if (nextErrors.name || nextErrors.phone) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitToCRM({
        name,
        phone,
        email: "",
        targetFunnel: "ads",
        source_key: "chinh_phuc_muc_tieu_web",
        courseName: "Chinh Phục Mục Tiêu",
        note: "Đăng ký tư vấn từ landing Chinh Phục Mục Tiêu",
        sourceUrl: window.location.href,
        landingPageId: "chinh-phuc-muc-tieu",
        landingPageSlug: window.location.pathname,
        utm_source: searchParams.get("utm_source") || "website",
        utm_medium: searchParams.get("utm_medium") || "landing",
        utm_campaign: searchParams.get("utm_campaign") || "chinh_phuc_muc_tieu",
        utm_content: searchParams.get("utm_content") || "",
        utm_term: searchParams.get("utm_term") || "",
        userAgent: navigator.userAgent,
      });

      try {
        await addDoc(collection(db, "leads"), {
          name,
          phone,
          searchName: normalizeLeadSearchText(name),
          searchPhone: phone,
          searchKeywords: buildLeadSearchKeywords({ name, phone }),
          source: "chinh-phuc-muc-tieu",
          sourceUrl: window.location.href,
          createdAt: Date.now(),
          status: "new",
        });
      } catch (firestoreError) {
        console.error("Không thể lưu bản sao lead vào Firestore:", firestoreError);
      }

      setForm({ name: "", phone: "" });
      setIsSuccess(true);
      toast.success("Đăng ký thành công!");
    } catch (error) {
      console.error("Lỗi gửi đăng ký:", error);
      toast.error("Chưa thể gửi đăng ký. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:p-8"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D8C8C4] sm:hidden" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ đăng ký"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-[#555] hover:bg-red-50 hover:text-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100"
        >
          <X className="h-6 w-6" />
        </button>

        {isSuccess ? (
          <div className="py-7 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check className="h-10 w-10" strokeWidth={3} />
            </div>
            <h2 id={titleId} className="text-3xl font-black text-[#242424]">
              Đăng ký thành công
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#555]">
              Mali Edu đã nhận được thông tin và sẽ liên hệ tư vấn cho bạn trong thời gian sớm nhất.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 min-h-[52px] w-full rounded-xl bg-[#D62828] px-5 text-lg font-bold text-white hover:bg-[#B91C1C]"
            >
              ĐÓNG
            </button>
          </div>
        ) : (
          <>
            <div className="pr-9">
              <p className="font-bold uppercase tracking-wide text-[#B91C1C]">Đăng ký tư vấn</p>
              <h2 id={titleId} className="mt-2 text-[28px] font-black leading-tight text-[#242424] sm:text-3xl">
                Để lại thông tin của bạn
              </h2>
              <p className="mt-2.5 text-[17px] leading-7 text-[#555] sm:mt-3 sm:text-lg">
                Mali Edu sẽ gọi điện để tư vấn rõ ràng trước khi bạn quyết định tham gia.
              </p>
            </div>

            <form className="mt-5 space-y-4 sm:mt-7 sm:space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="goal-name" className="mb-2 block text-lg font-bold text-[#242424]">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]" />
                  <input
                    id="goal-name"
                    autoFocus
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    aria-invalid={errors.name || undefined}
                    className={`min-h-[56px] w-full rounded-xl border bg-white pl-12 pr-4 text-lg text-[#242424] outline-none focus:ring-4 ${
                      errors.name
                        ? "border-red-600 focus:ring-red-100"
                        : "border-[#D8C8C4] focus:border-[#D62828] focus:ring-red-100"
                    }`}
                    placeholder="Ví dụ: Nguyễn Văn An"
                  />
                </div>
                {errors.name ? <p className="mt-2 text-base font-semibold text-red-700">Vui lòng nhập họ và tên.</p> : null}
              </div>

              <div>
                <label htmlFor="goal-phone" className="mb-2 block text-lg font-bold text-[#242424]">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]" />
                  <input
                    id="goal-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    aria-invalid={errors.phone || undefined}
                    className={`min-h-[56px] w-full rounded-xl border bg-white pl-12 pr-4 text-lg text-[#242424] outline-none focus:ring-4 ${
                      errors.phone
                        ? "border-red-600 focus:ring-red-100"
                        : "border-[#D8C8C4] focus:border-[#D62828] focus:ring-red-100"
                    }`}
                    placeholder="Ví dụ: 0912 345 678"
                  />
                </div>
                {errors.phone ? <p className="mt-2 text-base font-semibold text-red-700">Vui lòng nhập số điện thoại hợp lệ.</p> : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-[#D62828] px-6 text-lg font-black text-white shadow-lg hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {isSubmitting ? "ĐANG GỬI..." : "ĐĂNG KÝ NGAY"}
              </button>

              <p className="flex items-start justify-center gap-2 text-center text-sm leading-6 text-[#666]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                Thông tin của bạn được bảo mật và chỉ dùng để tư vấn chương trình.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const VutTocMucTieu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const openRegistration = () => setIsModalOpen(true);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFFDF8] text-[#242424]">
      <SEO
        title="Chinh Phục Mục Tiêu"
        description="Biến mục tiêu thành kế hoạch rõ ràng và hành động thực tế cùng chương trình Chinh Phục Mục Tiêu tại Mali Edu."
        image={COURSE_IMAGE}
        url="/dao-tao/chinh-phuc-muc-tieu"
        preloadLcpImage={COURSE_IMAGE}
      />

      <main>
        <section className="bg-[#FFFDF8] pb-8 sm:pb-14">
          <div className="mx-auto max-w-6xl">
            <div className="aspect-[3/2] w-full overflow-hidden rounded-b-[26px] bg-[#F5E7E3] shadow-[0_8px_28px_rgba(80,25,20,0.10)] sm:rounded-none sm:shadow-none">
              <img
                src={COURSE_IMAGE}
                alt="Khóa học Chinh Phục Mục Tiêu tại Mali Edu"
                width="1200"
                height="800"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-4 pt-5 text-center sm:px-6 sm:pt-9">
              <CtaButton onClick={openRegistration} />
              <p className="mx-auto mt-3 max-w-xl text-[16px] leading-6 text-[#555] sm:mt-4 sm:text-lg sm:leading-7">
                Nhấn nút và để lại thông tin. Mali Edu sẽ liên hệ tư vấn cụ thể cho bạn.
              </p>
              <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-full bg-[#FFF4F1] px-3 py-2 text-[14px] font-bold text-[#7A2113] sm:hidden">
                <LockKeyhole className="h-4 w-4 shrink-0" />
                Không thanh toán ngay · Thông tin được bảo mật
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#FFF4F1] px-4 py-11 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Bạn có đang gặp tình trạng này?"
              title="Mục tiêu vẫn còn đó, nhưng bạn chưa tiến được bao xa"
              description="Không phải bạn thiếu khả năng. Điều bạn cần là một hướng đi rõ ràng và cách hành động phù hợp."
            />
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {painPoints.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#E8D8D4] bg-white p-4 shadow-sm sm:gap-4 sm:p-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-[#B91C1C] sm:h-11 sm:w-11">
                    <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  </div>
                  <p className="text-[17px] font-semibold leading-7 text-[#333] sm:pt-1 sm:text-[18px] sm:leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-11 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="px-4 sm:px-0">
              <SectionHeading
                eyebrow="Những gì bạn nhận được"
                title="Từng bước biến điều bạn muốn thành việc bạn có thể làm"
                description="Vuốt sang ngang để xem 4 kết quả chính."
              />
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {outcomes.map(({ icon, title, text }) => (
                <article key={title} className="w-[82vw] max-w-[315px] shrink-0 snap-center rounded-2xl border border-[#E8D8D4] bg-white p-5 shadow-sm sm:w-auto sm:max-w-none sm:p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D62828] text-white sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl">
                    {icon}
                  </div>
                  <h3 className="text-[22px] font-black text-[#242424] sm:text-2xl">{title}</h3>
                  <p className="mt-2 text-[17px] leading-7 text-[#555] sm:mt-3 sm:text-[18px] sm:leading-8">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-7 px-4 text-center sm:mt-9 sm:px-0">
              <CtaButton onClick={openRegistration} label="TÔI MUỐN THAY ĐỔI" />
            </div>
          </div>
        </section>

        <section className="bg-[#FFF4F1] px-4 py-11 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow="Nội dung chương trình"
              title="Lộ trình 6 bước dễ hiểu, dễ thực hiện"
              description="Mỗi phần tập trung vào một việc quan trọng để bạn không bị quá tải."
            />
            <div className="space-y-3 sm:space-y-4">
              {modules.map(([number, title, text]) => (
                <article key={number} className="grid grid-cols-[48px_1fr] gap-3 rounded-2xl border border-[#E8D8D4] bg-white p-4 shadow-sm sm:grid-cols-[76px_1fr] sm:items-center sm:gap-4 sm:p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D62828] text-lg font-black text-white sm:h-16 sm:w-16 sm:rounded-2xl sm:text-2xl">
                    {number}
                  </div>
                  <div>
                    <h3 className="text-[20px] font-black leading-6 text-[#242424] sm:text-2xl">{title}</h3>
                    <p className="mt-1.5 text-[16px] leading-6 text-[#555] sm:mt-2 sm:text-[18px] sm:leading-8">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-11 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-5 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-3xl bg-[#B91C1C] p-6 text-white shadow-xl sm:p-10">
              <Sparkles className="h-10 w-10 text-[#FFD5CB] sm:h-12 sm:w-12" />
              <h2 className="mt-4 text-[28px] font-black leading-tight sm:mt-6 sm:text-4xl">
                Chương trình phù hợp với bạn nếu...
              </h2>
              <p className="mt-3 text-[17px] leading-7 text-white/90 sm:mt-5 sm:text-[18px] sm:leading-8">
                Bạn thực sự muốn thay đổi nhưng cần một phương pháp rõ ràng và người đồng hành để bắt đầu.
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {audiences.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#E8D8D4] bg-white p-4 sm:gap-4 sm:p-5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </div>
                  <p className="text-[17px] font-semibold leading-7 text-[#333] sm:text-[18px] sm:leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFF4F1] py-11 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="px-4 sm:px-0">
              <SectionHeading
                eyebrow="Đồng hành cùng Mali Edu"
                title="Không chỉ nghe, bạn sẽ được hướng dẫn để bắt tay vào làm"
              />
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
              {[
                [<Compass key="compass" className="h-8 w-8" />, "Hướng dẫn rõ ràng", "Nội dung đi thẳng vào vấn đề, trình bày từng bước dễ theo dõi."],
                [<HeartHandshake key="heart" className="h-8 w-8" />, "Đồng hành tận tâm", "Đội ngũ Mali Edu hỗ trợ để bạn hiểu cách áp dụng vào hoàn cảnh của mình."],
                [<CalendarCheck key="calendar" className="h-8 w-8" />, "Tập trung thực hành", "Bạn từng bước xây dựng kế hoạch và hành động ngay trong hành trình học."],
              ].map(([icon, title, text]) => (
                <article key={title} className="w-[82vw] max-w-[315px] shrink-0 snap-center rounded-2xl bg-white p-5 text-left shadow-sm md:w-auto md:max-w-none md:p-6 md:text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-[#B91C1C] md:mx-auto md:h-16 md:w-16">
                    {icon}
                  </div>
                  <h3 className="mt-4 text-[22px] font-black md:mt-5 md:text-2xl">{title}</h3>
                  <p className="mt-2 text-[17px] leading-7 text-[#555] md:mt-3 md:text-[18px] md:leading-8">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-11 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl rounded-3xl border border-[#E8D8D4] bg-white p-6 text-left shadow-sm sm:p-12 sm:text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D62828] text-white sm:mx-auto sm:h-16 sm:w-16">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-[28px] font-black leading-tight sm:mt-6 sm:text-4xl">
              Câu chuyện thật từ học viên Mali Edu
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[17px] leading-7 text-[#555] sm:mt-4 sm:text-[18px] sm:leading-8">
              Xem những chia sẻ thực tế từ những người đã tham gia hành trình mục tiêu cùng Mali Edu.
            </p>
            <Link
              to="/cam-nhan/vut-toc-muc-tieu"
              className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#B91C1C] px-4 text-[16px] font-black text-[#B91C1C] active:scale-[0.985] hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 sm:mt-7 sm:w-auto sm:rounded-xl sm:px-6 sm:text-lg"
            >
              XEM CẢM NHẬN HỌC VIÊN
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="bg-[#FFF4F1] px-4 py-11 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <SectionHeading eyebrow="Câu hỏi thường gặp" title="Thông tin bạn có thể đang quan tâm" />
            <div className="space-y-3 sm:space-y-4">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <article key={item.question} className="overflow-hidden rounded-2xl border border-[#E8D8D4] bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-4 text-left focus:outline-none focus:ring-4 focus:ring-inset focus:ring-red-100 sm:min-h-[68px] sm:gap-4 sm:px-6"
                    >
                      <span className="text-[17px] font-black leading-6 text-[#242424] sm:text-xl sm:leading-7">
                        {item.question}
                      </span>
                      <ChevronDown className={`h-6 w-6 shrink-0 text-[#B91C1C] transition ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen ? (
                      <p className="border-t border-[#F0E3DF] px-4 py-4 text-[17px] leading-7 text-[#555] sm:px-6 sm:py-5 sm:text-[18px] sm:leading-8">
                        {item.answer}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#B91C1C] px-4 py-11 text-left text-white sm:px-6 sm:py-20 sm:text-center">
          <div className="mx-auto max-w-3xl">
            <Target className="h-12 w-12 text-[#FFD5CB] sm:mx-auto sm:h-14 sm:w-14" />
            <h2 className="mt-4 text-[29px] font-black leading-tight sm:mt-5 sm:text-[42px]">
              Mục tiêu chỉ trở thành kết quả khi bạn bắt đầu hành động
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-7 text-white/90 sm:mt-5 sm:text-xl sm:leading-8">
              Để lại thông tin để Mali Edu tư vấn và giúp bạn hiểu rõ chương trình trước khi tham gia.
            </p>
            <CtaButton
              onClick={openRegistration}
              className="mt-6 !bg-white !text-[#B91C1C] hover:!bg-[#FFF4F1] sm:mt-8"
            />
          </div>
        </section>
      </main>

      <div className="h-[86px] sm:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-red-100 bg-white/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur sm:hidden">
        <CtaButton onClick={openRegistration} className="!min-h-[56px] !rounded-2xl !py-3" />
      </div>

      <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default VutTocMucTieu;
