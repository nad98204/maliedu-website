import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";
import { trackCtaClick } from "../ctaTracking";
import { scrollToRegistrationForm } from "../scrollToRegistration";

/* ─── Floating Gold Particles ───────────────────────────── */
const GOLD_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    size: 2 + (i % 5),
    delay: (i % 7) * 0.8,
    duration: 3 + (i % 5),
}));

const GoldParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {GOLD_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: "radial-gradient(circle, #F8E08A, #C9961A)",
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Card component ────────────────────────────────────── */
const TargetCard = ({ title, Icon, desc, painPoints, number, delay }) => {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative flex w-full flex-1 flex-col rounded-[1.6rem] transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] transition-transform duration-300 hover:-translate-y-1.5"
        style={{
          background: "linear-gradient(155deg, rgba(255,255,255,0.98) 0%, #FFFCF4 58%, #FFF6E4 100%)",
          border: "1px solid rgba(201,150,26,0.55)",
          boxShadow: "0 16px 42px rgba(91,49,14,0.09), 0 3px 10px rgba(122,33,19,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: "linear-gradient(180deg, #7A2113 0%, #C9961A 48%, #F1D477 100%)" }}
        />
        <div
          className="absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-40 blur-3xl"
          style={{ background: "#F5D979" }}
        />

        {/* Content */}
        <div className="relative flex flex-1 flex-col px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="mb-4 flex items-start gap-3.5 pr-10 text-left">
            <div
              className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(145deg, #7A2113 0%, #A83A20 100%)",
                border: "1px solid rgba(201,150,26,0.65)",
                boxShadow: "0 8px 20px rgba(122,33,19,0.2), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <Icon
                className="h-6 w-6 text-[#FFE795]"
                strokeWidth={1.9}
              />
            </div>
            <div className="min-w-0 pt-0.5">
              <span className="mb-1 block text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#C18A13]">
                Nhóm {String(number).padStart(2, "0")}
              </span>
              <h3 className="text-[0.8rem] font-black uppercase leading-[1.35] tracking-[-0.01em] text-[#55280F] sm:text-[0.95rem]">
                {title.map((line) => (
                  <span key={line} className="block whitespace-nowrap">{line}</span>
                ))}
              </h3>
            </div>
          </div>

          <span
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[0.7rem] font-black text-white"
            style={{
              background: "linear-gradient(145deg, #C9961A, #7A2113)",
              boxShadow: "0 6px 16px rgba(122,33,19,0.24)",
            }}
          >
            {number}
          </span>

          {/* Description */}
          <p className="mb-4 border-l-2 border-[#E3BF65] pl-3 text-left text-[0.78rem] leading-[1.65] text-[#6A4A2A] sm:text-sm">
            {desc}
          </p>

          {/* Pain Points Checklist */}
          <div className="mt-auto w-full space-y-2 text-left">
            {painPoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-2.5 rounded-xl border border-[#EEDFB9]/70 bg-[#FAF4E5]/75 px-3 py-2.5 transition-colors group-hover:bg-[#FAF1DC]"
              >
                <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#C9961A]/15">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#B77B00]" strokeWidth={2.4} />
                </span>
                <span className="text-[0.76rem] leading-[1.45] text-[#4B2E13] sm:text-[13px]">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Section ──────────────────────────────────────── */
const DoiTuongPhuHop = () => {
  const cards = [
    {
      title: ["Người muốn ổn định", "tài chính"],
      Icon: Users,
      desc: "Bạn đang muốn thoát khỏi tình trạng thu nhập thiếu ổn định, khó tích lũy và chưa biết nên bắt đầu thay đổi từ đâu.",
      painPoints: [
        "Thu nhập chưa ổn định hoặc khó giữ lại tiền",
        "Chưa có mục tiêu tài chính rõ ràng",
        "Muốn xây dựng kế hoạch phù hợp với thực tế",
      ],
    },
    {
      title: ["Người kinh doanh,", "bán hàng"],
      Icon: BriefcaseBusiness,
      desc: "Bạn đang nỗ lực tìm kiếm khách hàng và gia tăng doanh số nhưng kết quả chưa ổn định, khiến tinh thần dễ bị ảnh hưởng.",
      painPoints: [
        "Doanh số lên xuống thất thường",
        "Dễ mất động lực khi kết quả chưa như mong muốn",
        "Muốn cải thiện tư duy, cảm xúc và cách hành động",
      ],
    },
    {
      title: ["Chủ doanh nghiệp,", "người quản lý"],
      Icon: Building2,
      desc: "Bạn đang chịu nhiều áp lực về doanh thu, nhân sự và vận hành, nên cần một trạng thái vững vàng hơn để đưa ra quyết định.",
      painPoints: [
        "Thường xuyên chịu áp lực tài chính",
        "Quá tải vì phải xử lý nhiều vấn đề cùng lúc",
        "Muốn có định hướng và kế hoạch rõ ràng hơn",
      ],
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-3xl py-12 sm:py-16"
      style={{
        background: "linear-gradient(160deg, #FFF9EC 0%, #F8EDCF 52%, #F3E3BF 100%)",
        border: "1px solid #D4B572",
        boxShadow: "0 24px 60px rgba(122,33,19,0.08)",
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#C9961A_1px,transparent_1px)] bg-[length:28px_28px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.12] blur-[100px] bg-[#C9961A] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.08] blur-[80px] bg-[#7A2113] pointer-events-none" />
      <GoldParticles />

      <div className="relative max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-10">
        {/* ── Header ── */}
        <div
          className="relative mx-auto mb-10 max-w-3xl overflow-hidden rounded-[1.8rem] border border-[#D5A942]/70 lg:mb-12"
          style={{
            background: "linear-gradient(145deg, #8D2417 0%, #65170F 58%, #4B100B 100%)",
            boxShadow: "0 18px 46px rgba(94,24,14,0.24), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-[#F2D579]/15 bg-[#D8A92D]/10" />
          <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-[#C9961A]/10 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-8 right-2 text-[8rem] font-black leading-none text-white/[0.035] sm:text-[11rem]">
            03
          </span>

          <div className="relative px-5 py-6 text-left sm:px-10 sm:py-9">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F3D477]/45 bg-white/10 px-3.5 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.17em] text-[#FFE99A] backdrop-blur-sm sm:text-[0.68rem]">
              <Sparkles className="h-3.5 w-3.5" />
              Chương trình dành cho ai?
            </span>

            <h2 className="mt-5 font-black uppercase leading-[1.14] tracking-[-0.025em]">
              <span className="block whitespace-nowrap text-[clamp(1rem,4.5vw,1.4rem)] text-white">
                Bạn sẽ phù hợp với
              </span>
              <span className="mt-1 block whitespace-nowrap text-[clamp(1.12rem,5.2vw,1.75rem)] text-[#FFE27A]">
                chương trình này nếu…
              </span>
            </h2>

            <p className="mt-4 max-w-xl border-l-2 border-[#E7C15D]/65 pl-3 text-[0.78rem] leading-[1.65] text-white/75 sm:text-sm">
              Dù đang làm công việc nào, bạn đều mong muốn hiểu rõ vấn đề tài chính của mình và xây dựng hướng thay đổi cụ thể hơn.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
              {["Cá nhân", "Kinh doanh", "Quản lý"].map((group) => (
                <span
                  key={group}
                  className="rounded-full border border-white/15 bg-white/[0.08] px-2 py-2 text-center text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-white/85 backdrop-blur-sm sm:text-[0.65rem]"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cards Grid ── */}
        <div className="mb-10 flex flex-wrap items-stretch justify-center gap-5 lg:mb-12 lg:gap-7">
          {cards.map((card, idx) => (
            <div key={card.title} className="w-full md:w-[320px] lg:w-[350px] flex">
              <TargetCard
                {...card}
                number={idx + 1}
                delay={idx * 150}
              />
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div
          className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[1.7rem] border border-white/80 px-4 py-5 text-center sm:px-7 sm:py-7"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.88), rgba(255,248,230,0.76))",
            boxShadow: "0 14px 38px rgba(122,33,19,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <div className="space-y-1">
            <p className="text-base font-black uppercase leading-tight tracking-[0.01em] text-[#5B2412] sm:text-lg">
              Sẵn sàng bắt đầu?
            </p>
            <p className="text-[0.76rem] leading-relaxed text-[#6A4A2A]/80 sm:text-sm">
              Đăng ký để nhận lịch học và hướng dẫn tham gia.
            </p>
          </div>

          {/* CTA Button */}
          <div className="relative w-full max-w-[420px]">
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ background: "#C8282E" }}
            />
            <a
              href="#dang-ky"
              onClick={(e) => {
                e.preventDefault();
                trackCtaClick("DoiTuongPhuHop");
                scrollToRegistrationForm();
              }}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full py-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] sm:py-[18px]"
              style={{
                background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
                boxShadow: "0 12px 32px rgba(156,12,18,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="whitespace-nowrap text-[0.72rem] font-black uppercase tracking-[0.025em] text-[#FFE566] drop-shadow min-[380px]:text-[0.8rem] sm:text-[0.95rem]">
                ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC
              </span>
              <ArrowRight className="h-4 w-4 flex-none text-[#FFE566] transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-center text-[0.72rem] font-medium leading-relaxed text-[#7A2113]/75 sm:text-sm">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#C9961A]" />
            <span>Học online qua Zoom • Chỉ cần họ tên và số điện thoại</span>
          </div>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-20px) scale(1.3); opacity: 0.2; }
        }
      `}</style>
    </section>
  );
};

export default DoiTuongPhuHop;
