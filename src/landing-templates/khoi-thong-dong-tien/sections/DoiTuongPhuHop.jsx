import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";

/* ─── Floating Gold Particles ───────────────────────────── */
const GoldParticles = () => {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 6,
    duration: 3 + Math.random() * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
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

/* ─── Animated Number Badge ─────────────────────────────── */
const AnimBadge = ({ number }) => (
  <div
    className="absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white z-20"
    style={{
      background: "linear-gradient(135deg, #7A2113, #C9961A)",
      boxShadow: "0 4px 14px rgba(122,33,19,0.35)",
    }}
  >
    {number}
  </div>
);

/* ─── Card component ────────────────────────────────────── */
const TargetCard = ({ title, Icon, desc, painPoints, highlight, number, delay }) => {
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
      className="relative flex flex-col rounded-3xl transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Glow behind highlighted card */}
      {highlight && (
        <div
          className="absolute -inset-1 rounded-3xl opacity-50 blur-xl pointer-events-none"
          style={{ background: "linear-gradient(135deg, #C9961A 0%, #7A2113 100%)" }}
        />
      )}

      <div
        className={`relative flex flex-col h-full rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl ${
          highlight ? "z-10" : ""
        }`}
        style={{
          background: highlight
            ? "linear-gradient(165deg, #FFFDF5 0%, #FFF9E8 40%, #FFF3D0 100%)"
            : "linear-gradient(165deg, #FFFFFF 0%, #FFFCF5 40%, #FFF8EC 100%)",
          border: highlight ? "2px solid #C9961A" : "1px solid #D4B572",
          boxShadow: highlight
            ? "0 20px 60px rgba(201,150,26,0.25), 0 8px 24px rgba(122,33,19,0.1), inset 0 1px 0 rgba(255,255,255,0.8)"
            : "0 10px 35px rgba(122,33,19,0.07), 0 4px 14px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Top gradient bar */}
        {highlight && (
          <div
            className="h-1.5 rounded-t-[22px]"
            style={{ background: "linear-gradient(90deg, #7A2113, #C9961A, #F8E08A, #C9961A, #7A2113)" }}
          />
        )}

        {/* Content */}
        <div className="flex flex-col items-center text-center p-5 sm:px-6 sm:py-7 flex-1">
          {/* Icon Frame */}
          <div className="relative mb-4">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-md"
              style={{
                background: highlight
                  ? "radial-gradient(circle, rgba(201,150,26,0.35), transparent 70%)"
                  : "radial-gradient(circle, rgba(212,181,114,0.25), transparent 70%)",
                transform: "scale(1.6)",
              }}
            />
            {/* Icon container */}
            <div
              className="relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center"
              style={{
                background: highlight
                  ? "linear-gradient(135deg, #F5EDD8, #FFF3D0)"
                  : "linear-gradient(135deg, #F8F2E4, #FFF8EC)",
                border: highlight ? "2px solid #C9961A" : "1.5px solid #D4B572",
                boxShadow: highlight
                  ? "0 8px 24px rgba(201,150,26,0.2), inset 0 1px 0 rgba(255,255,255,0.8)"
                  : "0 6px 18px rgba(212,181,114,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <Icon
                className="w-7 h-7"
                strokeWidth={1.8}
                style={{ color: highlight ? "#7A2113" : "#8B5E3C" }}
              />
            </div>
          </div>

          {/* Tag */}
          {highlight && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] mb-3"
              style={{
                background: "linear-gradient(135deg, #7A2113, #C9961A)",
                color: "#FFE566",
                boxShadow: "0 2px 8px rgba(122,33,19,0.2)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              Phổ biến nhất
            </span>
          )}

          {/* Title */}
          <h3
            className="text-[0.9rem] sm:text-base font-extrabold uppercase tracking-[0.02em] mb-2 leading-snug whitespace-nowrap"
            style={{ color: highlight ? "#7A2113" : "#5C3A1A" }}
          >
            {title}
          </h3>

          {/* Gold divider */}
          <div
            className="w-10 h-[3px] rounded-full mb-3"
            style={{
              background: highlight
                ? "linear-gradient(90deg, transparent, #C9961A, transparent)"
                : "linear-gradient(90deg, transparent, #D4B572, transparent)",
            }}
          />

          {/* Description */}
          <p className="text-[13px] sm:text-sm leading-relaxed text-[#5C3A1A]/90 mb-4 italic">{desc}</p>

          {/* Pain Points Checklist */}
          <div className="w-full space-y-2.5 text-left mt-2">
            {painPoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-colors"
                style={{ background: "rgba(245,237,216,0.5)" }}
              >
                <CheckCircle2
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  strokeWidth={2.2}
                  style={{ color: "#C9961A" }}
                />
                <span className="text-[13px] leading-snug text-[#3A2208]">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AnimBadge number={number} />
    </div>
  );
};

/* ─── Main Section ──────────────────────────────────────── */
const DoiTuongPhuHop = () => {
  const cards = [
    {
      title: "Người đang bế tắc tài chính",
      highlight: false,
      Icon: Users,
      desc: "Bạn đang muốn tìm ra một hướng đi rõ ràng, thoát khỏi sự mông lung.",
      painPoints: [
        "Thu nhập bấp bênh, không ổn định",
        "Không biết bắt đầu từ đâu",
        "Cảm thấy mông lung về tương lai",
      ],
    },
    {
      title: "Người kinh doanh",
      highlight: true,
      Icon: BriefcaseBusiness,
      desc: "Bán hàng mãi không ra đơn, càng cố gắng càng nản chí.",
      painPoints: [
        "Doanh số giảm sút liên tục",
        "Năng lượng tụt dốc mỗi ngày",
        "Marketing không hiệu quả",
        "Mất động lực kinh doanh",
      ],
    },
    {
      title: "Chủ doanh nghiệp",
      highlight: false,
      Icon: Building2,
      desc: "Đang chịu áp lực tài chính đè nặng, sống trong lo âu.",
      painPoints: [
        "Áp lực tài chính chồng chất",
        "Nhân sự không đồng lòng",
        "Trách nhiệm đè nặng trên vai",
      ],
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-3xl py-16 sm:py-20"
      style={{
        background: "linear-gradient(160deg, #FDF5E4 0%, #F7EBCC 50%, #F2E4C8 100%)",
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
        <div className="text-center mb-12 lg:mb-16 space-y-4">
          {/* Eyebrow */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase border border-[#C9961A] bg-white/60 text-[#7A2113] backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9961A]" />
            Dành cho bạn
          </span>

          {/* Title group */}
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-[0.04em] text-[#3A2208] leading-tight">
              KHÓA HỌC NÀY
            </h2>
            <h2 className="text-[1.55rem] sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-[0.03em] leading-tight">
              <span className="relative inline-block text-[#7A2113] whitespace-nowrap">
                PHÙ HỢP VỚI BẠN
                <span
                  className="absolute bottom-0 left-0 w-full h-1.5 -mb-1 rounded-full opacity-30"
                  style={{ background: "linear-gradient(90deg, transparent, #C9961A, transparent)" }}
                />
              </span>
            </h2>
          </div>

          <p className="text-base sm:text-lg text-[#5C3A1A]/80 max-w-xl mx-auto leading-relaxed">
            <span className="block">Nếu bạn thấy mình trong mô tả này,</span>
            <span className="block">
              chương trình này <strong className="text-[#7A2113]">dành cho bạn</strong>.
            </span>
          </p>
        </div>

        {/* ── Cards Grid ── */}
        <div className="flex flex-wrap justify-center gap-6 lg:gap-8 items-stretch mb-12 lg:mb-16">
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
        <div className="flex flex-col items-center gap-4">
          {/* CTA Button */}
          <div className="relative w-full max-w-[380px]">
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ background: "#C8282E" }}
            />
            <a
              href="#dang-ky"
              className="group relative flex items-center justify-center gap-2.5 w-full rounded-full py-4 sm:py-[18px] overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
                boxShadow: "0 12px 32px rgba(156,12,18,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="text-[#FFE566] font-black text-[1rem] sm:text-[1.1rem] uppercase tracking-[0.08em] drop-shadow whitespace-nowrap">
                BẤM ĐỂ NHẬN VÉ THAM DỰ
              </span>
              <ArrowRight className="w-5 h-5 text-[#FFE566]" />
            </a>
          </div>

          <div className="flex items-center gap-2 text-sm italic text-[#C9961A]">
            <Clock className="w-4 h-4" />
            <span>Ưu đãi có giới hạn thời gian</span>
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
