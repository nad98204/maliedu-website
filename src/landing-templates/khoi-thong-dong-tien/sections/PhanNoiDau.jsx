import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { trackCtaClick } from "../ctaTracking";
import { scrollToRegistrationForm } from "../scrollToRegistration";

/* ─── Design Tokens (cùng palette BannerChinh) ─────────────────
   Primary:   #7A2113  (đỏ nâu)
   Gold:      #C9961A  (vàng gold)
   Cream bg:  #F5EDD8
   Text dark: #3A2208
   Border:    #D4B572
──────────────────────────────────────────────────────────────── */

const PainPoints = () => {
  const pains = [
    "Làm việc rất nhiều nhưng thu nhập vẫn chưa cải thiện như mong muốn.",
    "Có tiền nhưng khó giữ lại, cuối tháng gần như không còn khoản dư.",
    "Muốn thay đổi tài chính nhưng chưa biết nên bắt đầu từ đâu.",
    "Áp lực tiền bạc khiến bạn mất tập trung, dễ trì hoãn và quyết định theo cảm xúc.",
    "Đặt mục tiêu nhiều lần nhưng vẫn chưa duy trì được hành động đến cùng.",
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {pains.map((item, idx) => (
          <div
            key={item}
            className={`group relative overflow-hidden rounded-[1.15rem] border border-[#D4B572]/45 bg-white/85 p-4 shadow-[0_7px_24px_rgba(87,45,16,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9961A]/65 hover:shadow-[0_14px_34px_rgba(87,45,16,0.11)] sm:p-5 ${
              idx === pains.length - 1 ? "w-full sm:col-span-2" : ""
            }`}
          >
            <span className="absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#E4B94D] via-[#C9961A] to-[#8C2517]" />
            <div className="flex items-start gap-3.5">
              <span
                className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#E9C86F]/65 text-sm font-black text-[#FFF2C2] shadow-[0_5px_14px_rgba(99,23,14,0.24)] transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: "linear-gradient(145deg, #9E3020 0%, #74180F 100%)",
                }}
              >
                {idx + 1}
              </span>
              <p className="pt-0.5 text-[0.9rem] font-medium leading-[1.65] text-[#402817] sm:text-[0.96rem]">
                {item}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};

const TransformBlock = () => (
  <div
    className="relative overflow-hidden rounded-[1.5rem] p-[1px]"
    style={{
      background: "linear-gradient(145deg, #F1D888 0%, #A66A13 48%, #F1D888 100%)",
      boxShadow: "0 22px 52px rgba(84,20,12,0.2), 0 8px 24px rgba(201,150,26,0.12)",
    }}
  >
    <div
      className="relative overflow-hidden rounded-[1.45rem] px-5 py-8 text-center sm:px-8 sm:py-10"
      style={{
        background: "linear-gradient(150deg, #74180F 0%, #571009 52%, #3B0906 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F5CE65]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[#C9961A]/20 blur-3xl" />

      <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#F8E08A] to-transparent" />

      <div className="relative flex justify-center mb-5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-[#F8E08A]/40 bg-[#FFF4C7]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFE9A3] shadow-sm sm:text-[11px]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#F8E08A]" strokeWidth={2.2} />
          Bước khởi đầu
        </span>
      </div>

      <h3 className="relative -mx-2 mb-5 text-[clamp(0.86rem,4.1vw,1.02rem)] font-black uppercase leading-[1.35] tracking-[-0.04em] text-white sm:mx-0 sm:text-lg lg:text-[1.08rem] xl:text-[1.2rem]">
        <span className="block whitespace-nowrap">Có thể bạn không thiếu cố gắng,</span>
        <span className="mt-1 block whitespace-nowrap text-[#F3C955]">mà chỉ chưa nhìn đúng điểm nghẽn</span>
      </h3>

      <p className="relative mx-auto mb-6 max-w-xl text-[0.82rem] leading-[1.75] text-white/80 sm:text-[0.95rem]">
        Trong 4 buổi học, bạn sẽ được hướng dẫn nhận diện những suy nghĩ, cảm xúc và thói quen đang ảnh hưởng đến tài chính; từ đó xác định mục tiêu và xây dựng kế hoạch hành động rõ ràng.
      </p>

      <div className="relative mb-7 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 rounded-2xl border border-white/10 bg-black/15 px-2 py-3 text-[0.62rem] font-black uppercase tracking-[0.04em] text-[#FFE9A3] min-[380px]:text-[0.68rem] sm:px-4 sm:text-xs">
        <span>Hiểu đúng</span>
        <ArrowRight className="h-3.5 w-3.5 text-[#E4B94D]" aria-hidden="true" />
        <span>Điều chỉnh</span>
        <ArrowRight className="h-3.5 w-3.5 text-[#E4B94D]" aria-hidden="true" />
        <span>Hành động</span>
      </div>

      <div className="relative flex justify-center">
        <a
          href="#dang-ky"
          onClick={(e) => {
            e.preventDefault();
            trackCtaClick("PhanNoiDau");
            scrollToRegistrationForm();
          }}
          className="inline-flex w-full max-w-[360px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/40 px-3 py-3.5 text-[0.68rem] font-black uppercase tracking-[0.015em] text-[#5A120B] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(25,3,2,0.38)] active:translate-y-0 min-[380px]:text-[0.72rem] sm:w-auto sm:px-7 sm:text-sm sm:tracking-[0.035em]"
          style={{
            background: "linear-gradient(180deg, #FFE99A 0%, #E6B93E 100%)",
            boxShadow: "0 10px 28px rgba(18,2,1,0.32), inset 0 1px 0 rgba(255,255,255,0.65)",
          }}
        >
          ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC
          <ArrowRight className="h-4 w-4 shrink-0 text-[#7A2113] sm:h-5 sm:w-5" />
        </a>
      </div>
    </div>
  </div>
);

const PhanNoiDau = () => {
  const revealRef = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="relative space-y-6 overflow-hidden rounded-3xl px-4 pb-10 pt-7 sm:space-y-7 sm:px-10 sm:pb-14 sm:pt-9"
      style={{
        background: "linear-gradient(155deg, #FDF7EA 0%, #F9F0DC 38%, #F3E6C8 100%)",
        border: "1px solid rgba(212,181,114,0.55)",
        boxShadow:
          "0 24px 60px rgba(122,33,19,0.07), 0 0 0 1px rgba(255,255,255,0.5) inset, inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    >
      {/* nền trang trí */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 10% 0%, rgba(201,150,26,0.14), transparent 50%),
              radial-gradient(ellipse 70% 45% at 92% 8%, rgba(122,33,19,0.1), transparent 48%),
              radial-gradient(ellipse 60% 40% at 50% 100%, rgba(201,150,26,0.08), transparent 55%)
            `,
          }}
        />
        <div className="absolute top-24 right-[8%] w-2 h-2 rounded-full bg-[#C9961A]/40 blur-[1px]" />
        <div className="absolute bottom-32 left-[12%] w-1.5 h-1.5 rounded-full bg-[#7A2113]/30" />
      </div>

      <div ref={revealRef} className="relative max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* ── Tiêu đề (gọn, trong một khối) ── */}
        <header className="relative mx-auto max-w-[min(100%,42rem)] px-2 py-1 text-center sm:py-3">
            <p className="mb-0">
              <span className="inline-flex items-center rounded-full border border-[#D4B572]/60 bg-white/65 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#7A2113] shadow-sm sm:px-5 sm:text-[11px]">
                Bạn có đang gặp?
              </span>
            </p>

            <h2
              className="mb-4 mt-4 pt-1 font-black uppercase leading-[1.08] tracking-[0.025em] text-[#3A2208] sm:mb-5 sm:mt-5 sm:tracking-[0.045em]"
              style={{
                fontSize: "clamp(1.65rem, 6.5vw, 2.8rem)",
                textShadow: "0 2px 0 rgba(255,255,255,0.5)",
              }}
            >
              <span className="block">5 dấu hiệu tài chính</span>
              <span className="mt-1 block text-[#8C2517]">
                đang mắc kẹt
              </span>
            </h2>

            <div className="mx-auto max-w-xl pt-1">
              <span className="mx-auto mb-4 block h-[2px] w-14 rounded-full bg-gradient-to-r from-transparent via-[#C9961A] to-transparent" />
              <p className="text-[0.86rem] font-semibold leading-relaxed text-[#5C3A1A] sm:text-base">
                Dù đã rất cố gắng, bạn vẫn thường xuyên rơi vào những tình trạng sau:
              </p>
            </div>
        </header>

        {/* ── Hai cột ── */}
        <div
          className={`flex flex-col lg:flex-row gap-9 lg:gap-14 xl:gap-16 items-stretch transition-all duration-1000 ease-out ${
            show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="w-full lg:w-[58%] flex flex-col justify-center min-w-0">
            <PainPoints />
          </div>
          <div className="w-full lg:w-[42%] flex flex-col justify-center min-w-0 lg:min-w-[300px]">
            <TransformBlock />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhanNoiDau;
