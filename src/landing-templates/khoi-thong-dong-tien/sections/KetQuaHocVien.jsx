import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { trackCtaClick } from "../ctaTracking";
import { scrollToRegistrationForm } from "../scrollToRegistration";

const RESULT_ASSET_BASE = "/assets/landing/khoi-thong-dong-tien";
const RESULTS = [
  { img: `${RESULT_ASSET_BASE}/student-result-01.webp`, badge: "Đã xác thực" },
  { img: `${RESULT_ASSET_BASE}/student-result-02.webp`, badge: "Thành công" },
  { img: `${RESULT_ASSET_BASE}/student-result-03.webp`, badge: "Chữa lành" },
  { img: `${RESULT_ASSET_BASE}/student-result-04.webp`, badge: "Tài chính" },
  { img: `${RESULT_ASSET_BASE}/student-result-05.webp`, badge: "Thịnh vượng" },
  { img: `${RESULT_ASSET_BASE}/student-result-06.webp`, badge: "Bình an" },
  { img: `${RESULT_ASSET_BASE}/student-result-07.webp`, badge: "Hạnh phúc" },
  { img: `${RESULT_ASSET_BASE}/student-result-08.webp`, badge: "Đã xác thực" },
  { img: `${RESULT_ASSET_BASE}/student-result-09.webp`, badge: "Thành công" },
  { img: `${RESULT_ASSET_BASE}/student-result-10.webp`, badge: "Tài chính" },
  { img: `${RESULT_ASSET_BASE}/student-result-11.webp`, badge: "Thịnh vượng" },
  { img: `${RESULT_ASSET_BASE}/student-result-12.webp`, badge: "Chữa lành" },
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
    autoRef.current = setInterval(next, 5000);
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
        <div className="mb-3 px-5 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9961A]/70 bg-white/80 px-4 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.19em] text-[#7A2113] shadow-[0_5px_16px_rgba(122,33,19,0.06)] backdrop-blur-sm sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9961A] shadow-[0_0_0_3px_rgba(201,150,26,0.13)]" />
            Minh chứng thực tế
          </span>
          <div className="mt-4 space-y-1.5">
            <h2 className="whitespace-nowrap text-[clamp(1.35rem,6vw,4.4rem)] font-black leading-[1.15] tracking-[-0.035em] text-[#3A2208]">
              KẾT QUẢ KHI ÁP DỤNG
            </h2>
            <h2 className="whitespace-nowrap text-[clamp(1.08rem,5vw,3.7rem)] font-black leading-[1.15] tracking-[-0.025em] text-[#7A2113]">
              KHƠI THÔNG DÒNG TIỀN
            </h2>
          </div>
          <p className="mx-auto mt-3 max-w-md text-[0.76rem] leading-relaxed text-[#5C3A1A]/70 sm:text-sm">
            Những chia sẻ và kết quả thực tế từ học viên đã tham gia chương trình.
          </p>
        </div>

        {/* ── MOBILE: focused proof carousel ── */}
        <div
          className="relative px-5 md:hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative overflow-hidden rounded-[1.75rem] border border-[#D6A73A]/70 p-2.5"
            style={{
              background: "linear-gradient(155deg, #7A2113 0%, #4E100B 100%)",
              boxShadow: "0 18px 42px rgba(96,25,15,0.24), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <div className="flex items-center justify-between gap-3 px-2 pb-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.13em] text-[#FFE483]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFE483] shadow-[0_0_0_3px_rgba(255,228,131,0.14)]" />
                {RESULTS[active].badge}
              </span>
              <span className="text-[0.65rem] font-bold tracking-[0.12em] text-white/65">
                {String(active + 1).padStart(2, "0")} / {TOTAL}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedImage(RESULTS[active].img)}
              className="block aspect-[7/10] w-full overflow-hidden rounded-[1.25rem] border border-white/20 bg-[#FBF7EC]"
              aria-label={`Xem rõ kết quả học viên ${active + 1}`}
            >
              <img
                key={RESULTS[active].img}
                src={RESULTS[active].img}
                alt={`Kết quả thực tế của học viên ${active + 1}`}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-full border border-[#D4B572]/45 bg-white/70 p-1.5 shadow-[0_8px_22px_rgba(91,49,14,0.07)] backdrop-blur-sm">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#7A2113] text-[#FFE483] shadow-md transition active:scale-95"
              aria-label="Xem kết quả trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <span className="block text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-[#7A2113]">
                Vuốt để xem thêm
              </span>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#D4B572]/25">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9961A] to-[#7A2113] transition-all duration-500"
                  style={{ width: `${((active + 1) / TOTAL) * 100}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#7A2113] text-[#FFE483] shadow-md transition active:scale-95"
              aria-label="Xem kết quả tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-center text-[0.66rem] font-medium text-[#6A4A2A]/65">
            Chạm vào ảnh để xem rõ hơn
          </p>
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
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(58,34,8,0.65)] to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2.5 px-5 pt-2 sm:px-6">
          <a
            href="#dang-ky"
            onClick={(e) => {
              e.preventDefault();
              trackCtaClick("KetQuaHocVien");
              scrollToRegistrationForm();
            }}
            className="inline-flex w-full max-w-[390px] items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[0.7rem] font-black uppercase tracking-[0.025em] text-[#FFE566] transition hover:-translate-y-[2px] active:scale-95 min-[380px]:text-[0.76rem] sm:px-10 sm:py-4 sm:text-sm"
            style={{
              background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
              boxShadow: "0 14px 30px rgba(156,12,18,0.45), 0 0 0 2px rgba(255,229,102,0.18)",
            }}
          >
            ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC
            <ArrowRight className="w-5 h-5 text-[#FFE566]" />
          </a>
          <p className="text-[0.7rem] font-medium text-[#7A2113]/70 sm:text-xs">
            Học online qua Zoom • Nhận hướng dẫn tham gia
          </p>
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
