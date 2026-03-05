import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";

const RESULTS = [
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594568/mali-edu/xxs1ozzr8zay8nzxpoy0.jpg", badge: "Đã xác thực" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594567/mali-edu/mca6ztdrgp5vkmkbdttp.jpg", badge: "Thành công" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594566/mali-edu/z3sjtfp8sh6njnasfvpb.jpg", badge: "Chữa lành" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594565/mali-edu/p9dyvcbothx4g36qtmd8.jpg", badge: "Tài chính" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594565/mali-edu/flothwl2s1au4thit0r2.jpg", badge: "Thịnh vượng" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594563/mali-edu/cdeld8i8qhktgod306mf.jpg", badge: "Bình an" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594562/mali-edu/q8kh6kynsjexrzubwgqf.jpg", badge: "Hạnh phúc" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594560/mali-edu/qj47dc6sdsly0lfoxxig.jpg", badge: "Đã xác thực" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594561/mali-edu/wpjcakitt7wxadewsvh4.jpg", badge: "Thành công" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594559/mali-edu/rrysvuhozu4m3mzcxpyq.jpg", badge: "Tài chính" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594558/mali-edu/adn8cqxzegdnxkeeblio.jpg", badge: "Thịnh vượng" },
  { img: "https://res.cloudinary.com/dstukyjzd/image/upload/v1772594557/mali-edu/hnbecsflroyxflbu9bej.jpg", badge: "Chữa lành" },
];

const TOTAL = RESULTS.length;

export default function KetQuaHocVien() {
  const [active, setActive] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
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
        <div className="text-center space-y-3 px-4 sm:px-6 mb-2">
          <span className="inline-block py-1.5 px-5 rounded-full text-[11px] font-bold tracking-[0.25em] uppercase border border-[#C9961A] bg-white/70 text-[#7A2113] backdrop-blur-sm">
            Minh chứng thực tế
          </span>
          <div className="space-y-0">
            <h2
              className="font-extrabold text-[#3A2208] tracking-tight"
              style={{ fontSize: "clamp(1.3rem, 5.2vw, 3.75rem)", lineHeight: 1.4 }}
            >
              KẾT QUẢ KHI ÁP DỤNG
            </h2>
            <h2
              className="font-extrabold text-[#7A2113] tracking-tight"
              style={{ fontSize: "clamp(1.3rem, 5.2vw, 3.75rem)", lineHeight: 1.4 }}
            >
              KHƠI THÔNG DÒNG TIỀN
            </h2>
          </div>
          <div className="w-20 h-[3px] mx-auto rounded-full bg-gradient-to-r from-transparent via-[#C9961A] to-transparent" />
        </div>

        {/* ── MOBILE: 3-card carousel (hidden on desktop) ── */}
        <div
          className="relative overflow-hidden md:hidden"
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
                    className="relative rounded-2xl overflow-hidden w-full transition-all duration-500 cursor-pointer"
                    onClick={() => setSelectedImage(item.img)}
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

        {/* ── DESKTOP: Marquee auto-scroll (hidden on mobile) ── */}
        <div className="hidden md:block relative w-full overflow-hidden">
          <style>
            {`
              @keyframes slideMarquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-50% - 12px)); } /* 12px is half of gap-6 (24px) */
              }
              .animate-marquee {
                display: flex;
                width: max-content;
                animation: slideMarquee 50s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
              .marquee-item {
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, z-index 0s;
                transform-origin: center;
                z-index: 1;
              }
              .marquee-item:hover {
                transform: scale(1.3);
                z-index: 50;
                box-shadow: 0 20px 40px rgba(122,33,19,0.25), 0 0 0 3px #C9961A;
              }
            `}
          </style>

          {/* Wrapper to add mask for smooth fading on edges */}
          <div 
            className="w-full flex"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
            }}
          >
            <div className="animate-marquee gap-6 py-20 px-4">
              {[...RESULTS, ...RESULTS].map((item, idx) => (
                <div
                  key={idx}
                  className="marquee-item relative rounded-2xl flex-shrink-0 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(item.img)}
                  style={{
                    width: "260px",
                    aspectRatio: "9/16",
                    border: "2px solid rgba(201,150,26,0.6)",
                  }}
                >
                  <img
                    src={item.img}
                    alt="Kết quả học viên"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(58,34,8,0.65)] to-transparent pointer-events-none" />
                  {item.badge && (
                    <div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-xl px-3 py-1 text-white text-xs font-bold shadow-lg whitespace-nowrap"
                      style={{
                        background: "rgba(122,33,19,0.88)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(201,150,26,0.4)",
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#C9961A]" />
                      {item.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>
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

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[101]"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Phóng to kết quả" 
            className="max-w-[95vw] max-h-[90vh] sm:max-w-[80vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
            draggable={false}
          />
        </div>
      )}
    </section>
  );
}
