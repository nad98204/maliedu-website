import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { trackCtaClick } from "../ctaTracking";

const RESULTS = [
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239109825-745089269-z6872970557588-ef9b4c68fb455ae97e0689a1e6b89b1a.jpg", badge: "Đã xác thực" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239108868-193166368-z6872965008097-69573745489f2b7741dd76ba80379fef.jpg", badge: "Thành công" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239109398-258986797-z6872969159069-89daa20741f2957ae50e3f2aff7b4db2.jpg", badge: "Chữa lành" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239107986-44915151-z6872964996920-94c9969ffc17ff0bd240dfee07a2efda.jpg", badge: "Tài chính" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239107597-888278364-z6872964986051-238748b361c2bf706bf0bc880d2c6b21.jpg", badge: "Thịnh vượng" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239108458-793790834-z6872965006390-8a14d0b53fd44040a89733fbf4d6e76a.jpg", badge: "Bình an" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239106818-375307557-5.jpg", badge: "Hạnh phúc" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239107207-498431161-z6872964982486-0fe1da8f6e57a1086375e2b275d0a5a1.jpg", badge: "Đã xác thực" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239106320-501773316-4.jpg", badge: "Thành công" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239105777-96366976-3.jpg", badge: "Tài chính" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239104262-933547219-1.jpg", badge: "Thịnh vượng" },
  { img: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776239105269-245301649-2.jpg", badge: "Chữa lành" },
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
      className="relative rounded-3xl py-12 sm:py-16 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 35%), linear-gradient(135deg, #FDF6E6 0%, #F8EFD6 45%, #F6E8C2 100%)",
        border: "1px solid rgba(201,150,26,0.45)",
        boxShadow: "0 22px 56px rgba(122,33,19,0.09)",
      }}
    >
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#C9961A] rounded-full blur-[150px] opacity-[0.14]" />
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border border-[#C9961A]/25" />
      </div>

      <div className="relative space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 px-4 sm:px-6 mb-1">
          <span className="inline-block py-1.5 px-5 rounded-full text-[10px] sm:text-[11px] font-black tracking-[0.22em] uppercase border border-[#C9961A]/70 bg-white/75 text-[#7A2113] backdrop-blur-sm">
            Minh chứng thực tế
          </span>
          <div className="space-y-2 sm:space-y-2.5">
            <h2
              className="font-extrabold text-[#3A2208] tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 6.8vw, 4.4rem)", lineHeight: 1.18 }}
            >
              KẾT QUẢ KHI ÁP DỤNG
            </h2>
            <h2
              className="font-extrabold text-[#7A2113] tracking-tight drop-shadow-[0_2px_6px_rgba(122,33,19,0.18)] whitespace-nowrap"
              style={{ fontSize: "clamp(1.2rem, 5.3vw, 3.7rem)", lineHeight: 1.18 }}
            >
              KHƠI THÔNG DÒNG TIỀN
            </h2>
          </div>
          <div className="w-24 h-[3px] mx-auto rounded-full bg-gradient-to-r from-transparent via-[#C9961A] to-transparent" />
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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 border border-[#D4B572] shadow-md hover:bg-[#7A2113] hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 border border-[#D4B572] shadow-md hover:bg-[#7A2113] hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Cards row — center is always flex center */}
          <div className="flex items-center justify-center py-3.5 gap-3 px-2" style={{ height: "500px" }}>
            {cards.map(({ idx, pos }) => {
              const isCenter = pos === "center";
              const item = RESULTS[idx];
              return (
                <div
                  key={`${pos}-${idx}`}
                  className="flex-shrink-0 transition-all duration-500 h-full"
                  style={{
                    /* Center card takes 75% width, side cards 20% each */
                    width: isCenter ? "74%" : "13%",
                    opacity: isCenter ? 1 : 0.35,
                    filter: isCenter
                      ? "brightness(1.05)"
                      : "brightness(0.6) grayscale(40%)",
                    zIndex: isCenter ? 10 : 1,
                  }}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden w-full h-full transition-all duration-500 cursor-pointer"
                    onClick={() => setSelectedImage(item.img)}
                    style={{
                      border: isCenter ? "3px solid #C9961A" : "1px solid rgba(212,181,114,0.85)",
                      boxShadow: isCenter
                        ? "0 6px 24px rgba(201,150,26,0.35), 0 0 0 2px rgba(201,150,26,0.25)"
                        : "none",
                      transform: isCenter ? "scale(1)" : "scale(0.92)",
                    }}
                  >
                    <img
                      src={item.img}
                      alt="Kết quả học viên"
                      className={`w-full h-full bg-[#F7EFD8] ${isCenter ? "object-contain" : "object-cover"}`}
                      draggable={false}
                    />
                    {/* Gradient on center only */}
                    {isCenter && (
                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(58,34,8,0.72)] to-transparent" />
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
          <div className="animate-marquee gap-6 py-16 px-4">
              {[...RESULTS, ...RESULTS].map((item, idx) => (
                <div
                  key={idx}
                  className="marquee-item relative rounded-2xl flex-shrink-0 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(item.img)}
                  style={{
                    width: "260px",
                    height: "460px",
                    border: "2px solid rgba(201,150,26,0.6)",
                  }}
                >
                  <img
                    src={item.img}
                    alt="Kết quả học viên"
                    className="w-full h-full object-contain bg-[#F7EFD8]"
                    draggable={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(58,34,8,0.65)] to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 px-6">
          <a
            href="#dang-ky"
            onClick={() => trackCtaClick("KetQuaHocVien")}
            className="inline-flex items-center gap-2 rounded-full font-extrabold uppercase tracking-[0.06em] text-[#FFE566] text-[0.78rem] sm:text-sm px-8 sm:px-10 py-3.5 sm:py-4 transition active:scale-95 hover:-translate-y-[2px] whitespace-nowrap"
            style={{
              background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
              boxShadow: "0 14px 30px rgba(156,12,18,0.45), 0 0 0 2px rgba(255,229,102,0.18)",
            }}
          >
            ĐĂNG KÝ NHẬN VÉ MIỄN PHÍ
            <ArrowRight className="w-5 h-5 text-[#FFE566]" />
          </a>
          <p className="text-xs text-[#7A2113] italic font-medium">Số lượng vé có hạn - Đăng ký ngay hôm nay</p>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/92 backdrop-blur-sm transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh kết quả học viên"
        >
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[101]">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-white text-sm font-semibold border border-white/35 bg-black/55 hover:bg-black/70 transition-colors shadow-lg"
              onClick={() => setSelectedImage(null)}
              aria-label="Đóng ảnh"
            >
              <X className="w-4 h-4" />
              Đóng
            </button>
          </div>

          <div className="w-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Phóng to kết quả" 
              className="max-w-[95vw] max-h-[90vh] sm:max-w-[80vw] object-contain rounded-xl shadow-2xl border border-white/20"
              draggable={false}
            />
          </div>
        </div>
      )}
    </section>
  );
}
