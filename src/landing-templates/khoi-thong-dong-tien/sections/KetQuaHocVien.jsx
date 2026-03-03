import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

const RESULTS = [
  { img: "/assets/landing/khoi-thong-dong-tien/result-1.png", badge: "Đã xác thực" },
  { img: "/assets/landing/khoi-thong-dong-tien/result-2.png", badge: "Thành công" },
  { img: "/assets/landing/khoi-thong-dong-tien/result-3.png", badge: "Chữa lành" },
  { img: "/assets/landing/khoi-thong-dong-tien/result-4.png", badge: "Tài chính" },
  { img: "/assets/landing/khoi-thong-dong-tien/result-5.png", badge: "Thịnh vượng" },
];

const TOTAL = RESULTS.length;

export default function KetQuaHocVien() {
  const [active, setActive] = useState(0);
  const autoRef = useRef(null);
  const touchStartX = useRef(null);

  const prev = useCallback(() => setActive(i => (i - 1 + TOTAL) % TOTAL), []);
  const next = useCallback(() => setActive(i => (i + 1) % TOTAL), []);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 3000);
  }, [next]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const handlePrev = () => { prev(); startAuto(); };
  const handleNext = () => { next(); startAuto(); };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) handleNext();
    else if (dx > 40) handlePrev();
    touchStartX.current = null;
  };

  // Show 3 cards: prev, active, next
  const cards = [
    { idx: (active - 1 + TOTAL) % TOTAL, pos: "left" },
    { idx: active,                        pos: "center" },
    { idx: (active + 1) % TOTAL,          pos: "right" },
  ];

  return (
    <section
      className="relative rounded-3xl py-14 sm:py-16 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FDF5E4 0%, #F7EBCC 100%)",
        border: "1px solid #D4B572",
        boxShadow: "0 20px 50px rgba(122,33,19,0.06)",
      }}
    >
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9961A] rounded-full blur-[140px] opacity-[0.12]" />
      </div>

      <div className="relative space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 px-6">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-bold tracking-[0.22em] uppercase border border-[#C9961A] bg-white/60 text-[#7A2113]">
            Minh chứng thực tế
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A2208] leading-[1.3]">
            KẾT QUẢ KHI ÁP DỤNG
            <br />
            <span className="text-[#7A2113]">KHƠI THÔNG DÒNG TIỀN</span>
          </h2>
          <div className="w-14 h-0.5 mx-auto rounded-full bg-[#C9961A]" />
        </div>

        {/* ── 3-card layout ── */}
        <div
          className="relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Nav */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border border-[#D4B572] shadow-md hover:bg-[#7A2113] hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border border-[#D4B572] shadow-md hover:bg-[#7A2113] hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Cards row — center is always flex center */}
          <div className="flex items-center justify-center py-6 gap-3 px-2">
            {cards.map(({ idx, pos }) => {
              const isCenter = pos === "center";
              const item = RESULTS[idx];
              return (
                <div
                  key={`${pos}-${idx}`}
                  className="flex-shrink-0 transition-all duration-500"
                  style={{
                    /* Center card takes 75% width, side cards 20% each */
                    width: isCenter ? "72%" : "14%",
                    opacity: isCenter ? 1 : 0.35,
                    filter: isCenter
                      ? "brightness(1.05)"
                      : "brightness(0.6) grayscale(40%)",
                    zIndex: isCenter ? 10 : 1,
                  }}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden w-full transition-all duration-500"
                    style={{
                      aspectRatio: "9/16",
                      border: isCenter ? "3px solid #C9961A" : "1px solid #D4B572",
                      boxShadow: isCenter
                        ? "0 6px 24px rgba(201,150,26,0.35), 0 0 0 2px rgba(201,150,26,0.25)"
                        : "none",
                      transform: isCenter ? "scale(1)" : "scale(0.92)",
                    }}
                  >
                    <img
                      src={item.img}
                      alt="Kết quả học viên"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {/* Gradient + badge on center only */}
                    {isCenter && (
                      <>
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(58,34,8,0.65)] to-transparent" />
                        {item.badge && (
                          <div
                            className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-white text-xs font-bold shadow-lg whitespace-nowrap"
                            style={{
                              background: "rgba(122,33,19,0.88)",
                              backdropFilter: "blur(8px)",
                              border: "1px solid rgba(201,150,26,0.4)",
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C9961A]" />
                            {item.badge}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 pb-2">
            {RESULTS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setActive(i); startAuto(); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? "24px" : "7px",
                  height: "7px",
                  background: i === active ? "#C9961A" : "#D4B572",
                }}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 px-6">
          <a
            href="#dang-ky"
            className="inline-flex items-center gap-2 rounded-full font-extrabold uppercase tracking-[0.12em] text-[#FFE566] text-sm sm:text-base px-10 py-4 transition active:scale-95 hover:-translate-y-[2px]"
            style={{
              background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
              boxShadow: "0 12px 32px rgba(156,12,18,0.45), 0 0 0 2px rgba(255,229,102,0.15)",
            }}
          >
            ĐĂNG KÝ NHẬN VÉ MIỄN PHÍ
            <ArrowRight className="w-5 h-5 text-[#FFE566]" />
          </a>
          <p className="text-xs text-[#7A2113] italic">Số lượng vé có hạn – Đăng ký ngay hôm nay</p>
        </div>
      </div>
    </section>
  );
}
