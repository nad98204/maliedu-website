import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

/* ─── Design Tokens (cùng palette BannerChinh) ─────────────────
   Primary:   #7A2113  (đỏ nâu)
   Gold:      #C9961A  (vàng gold)
   Cream bg:  #F5EDD8
   Text dark: #3A2208
   Border:    #D4B572
──────────────────────────────────────────────────────────────── */

const PainPoints = () => {
  const pains = [
    "Nỗ lực kiếm tiền nhưng vẫn không thấy kết quả, càng làm càng bế tắc.",
    "Muốn thay đổi tài chính mà không biết bắt đầu từ đâu.",
    "Áp lực vì tiền khiến năng lượng tụt, kinh doanh thì bế tắc, đơn hàng bị từ chối.",
    "Cuộc sống rối loạn: tinh thần, công việc, gia đình đều đi xuống.",
    "Nợ tăng mỗi ngày, làm mãi không đủ trả, càng xoay càng rối.",
  ];

  return (
    <div className="relative">
      {/* đường nối mềm (chỉ desktop) */}
      <div
        className="pointer-events-none absolute left-[17px] top-8 bottom-8 w-px hidden sm:block opacity-30"
        style={{
          background: "linear-gradient(180deg, transparent, #C9961A 15%, #C9961A 85%, transparent)",
        }}
      />
      <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
        {pains.map((item, idx) => (
          <div
            key={item}
            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(122,33,19,0.12)] ${
              idx === pains.length - 1 ? "sm:col-span-2 w-full" : ""
            }`}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,252,245,0.88) 100%)",
              border: "1px solid rgba(212,181,114,0.45)",
              boxShadow: "0 4px 20px rgba(122,33,19,0.06), inset 0 1px 0 rgba(255,255,255,0.85)",
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-90 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(180deg, #C9961A 0%, #7A2113 50%, #C9961A 100%)",
              }}
            />
            <div className="flex items-start gap-3.5 pl-5 pr-5 py-5 sm:pl-6">
              <span
                className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: "linear-gradient(145deg, #8B2E1A 0%, #7A2113 45%, #5C180E 100%)",
                  boxShadow: "0 4px 12px rgba(122,33,19,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {idx + 1}
              </span>
              <p className="text-[#3A2208] leading-relaxed text-[15px] sm:text-[15.5px] pt-0.5">
                {item}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TransformBlock = () => (
  <div
    className="relative rounded-[1.35rem] p-[1px] overflow-hidden"
    style={{
      background: "linear-gradient(145deg, rgba(201,150,26,0.65) 0%, rgba(122,33,19,0.35) 50%, rgba(201,150,26,0.5) 100%)",
      boxShadow: "0 20px 50px rgba(122,33,19,0.12), 0 8px 24px rgba(201,150,26,0.08)",
    }}
  >
    <div
      className="relative rounded-[1.3rem] px-6 sm:px-8 py-9 sm:py-10 text-center overflow-hidden"
      style={{
        background: "linear-gradient(165deg, #FFFCF7 0%, #FFF8EC 45%, #FFF3E0 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.12] pointer-events-none bg-[#C9961A] blur-3xl" />
      <div className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full opacity-[0.1] pointer-events-none bg-[#7A2113] blur-3xl" />

      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent" />

      <div className="relative flex justify-center mb-5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A2113]/90 border border-[#D4B572]/50 bg-white/80 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C9961A]" strokeWidth={2.2} />
          Giải pháp
        </span>
      </div>

      <div className="relative text-[17px] sm:text-lg font-bold text-[#3A2208] mb-3 leading-snug space-y-1.5 text-center">
        <p>ĐỪNG LO, mọi vấn đề sẽ</p>
        <p>
          <span className="text-[#C9961A] font-extrabold" style={{ textShadow: "0 0 24px rgba(201,150,26,0.35)" }}>
            THÁO GỠ NGAY LẬP TỨC
          </span>
        </p>
      </div>
      <p className="relative text-[#5C3A1A]/95 text-[15px] sm:text-base mb-2">Khi bạn thực sự thấu hiểu cách</p>
      <p className="relative text-xl sm:text-2xl md:text-[1.65rem] font-extrabold text-[#7A2113] uppercase tracking-[0.06em] mb-7 leading-tight">
        NĂNG LƯỢNG TIỀN BẠC VẬN HÀNH
      </p>

      <div className="relative flex justify-center">
        <a
          href="#dang-ky"
          className="inline-flex items-center gap-2 rounded-full px-8 sm:px-10 py-3.5 font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-[#FFE566] text-xs sm:text-sm md:text-base whitespace-nowrap transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(156,12,18,0.45)] active:translate-y-0"
          style={{
            background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
            boxShadow: "0 10px 28px rgba(156,12,18,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          BẤM ĐỂ NHẬN VÉ THAM DỰ
          <ArrowRight className="w-5 h-5 text-[#FFE566] shrink-0" />
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
      className="relative overflow-hidden rounded-3xl px-5 sm:px-10 pt-6 sm:pt-8 pb-10 sm:pb-14 space-y-6 sm:space-y-7"
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
        <header className="relative mx-auto max-w-[min(100%,42rem)] text-center">
          <div
            className="relative rounded-2xl sm:rounded-[1.25rem] px-5 pt-5 pb-5 sm:px-8 sm:pt-7 sm:pb-7 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,250,240,0.55) 100%)",
              border: "1px solid rgba(212,181,114,0.45)",
              boxShadow: "0 10px 40px rgba(122,33,19,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px] opacity-90"
              style={{
                background: "linear-gradient(90deg, transparent 0%, #C9961A 20%, #E8C468 50%, #C9961A 80%, transparent 100%)",
              }}
            />
            <p className="mb-0">
              <span className="inline-flex items-center py-1.5 px-4 sm:px-5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#7A2113] bg-white/90 border border-[#D4B572]/55 shadow-sm">
                Bạn đang gặp gì?
              </span>
            </p>

            <h2
              className="font-black tracking-[0.06em] text-[#3A2208] mb-4 sm:mb-5 mt-4 sm:mt-5 leading-[1.08] pt-1"
              style={{
                fontSize: "clamp(2rem, 7vw, 3.35rem)",
                textShadow: "0 2px 0 rgba(255,255,255,0.5)",
              }}
            >
              ĐIỀU GÌ?
            </h2>

            <div className="mx-auto max-w-xl border-t border-[#D4B572]/35 pt-4 sm:pt-5 space-y-1.5 sm:space-y-2">
              <p
                className="font-extrabold uppercase tracking-[0.04em] leading-snug text-[#7A2113]"
                style={{ fontSize: "clamp(0.95rem, 2.8vw, 1.35rem)" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B4513] via-[#C9961A] to-[#8B4513]">
                  ĐANG CẢN TRỞ DÒNG CHẢY
                </span>
              </p>
              <p
                className="font-extrabold uppercase tracking-[0.05em] leading-snug text-[#7A2113]"
                style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.75rem)" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9961A] via-[#D4A84B] to-[#7A2113]">
                  TIỀN BẠC CỦA BẠN
                </span>
              </p>
            </div>
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
