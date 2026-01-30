import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Hand, ChevronLeft, ChevronRight } from "lucide-react";

const RESULTS = [
  {
    img: "https://via.placeholder.com/350x660/FDFBF6/1F4D3A?text=Hoc+Vien+1",
    badge: "Đã xác thực",
  },
  {
    img: "https://via.placeholder.com/350x660/F8F3E8/1F4D3A?text=Hoc+Vien+2",
    badge: "",
  },
  {
    img: "https://via.placeholder.com/350x660/FAF7F0/1F4D3A?text=Hoc+Vien+3",
    badge: "",
  },
  {
    img: "https://via.placeholder.com/350x660/FDFBF6/1F4D3A?text=Hoc+Vien+4",
    badge: "",
  },
  {
    img: "https://via.placeholder.com/350x660/F8F3E8/1F4D3A?text=Hoc+Vien+5",
    badge: "",
  },
];

const ResultsSection = () => {
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);
  const CARD_WIDTH = 320;

  const sliderItems = useMemo(() => {
    // buffer before/after to allow seamless loop
    return [...RESULTS, ...RESULTS, ...RESULTS];
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial scroll to the middle block so both directions work
    const initialOffset = RESULTS.length * CARD_WIDTH;
    container.scrollLeft = initialOffset;

    const handleScroll = () => {
      const center = container.getBoundingClientRect().left + container.clientWidth / 2;
      const cards = Array.from(container.querySelectorAll("[data-card]"));
      let closest = 0;
      let minDist = Number.MAX_VALUE;
      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = idx % RESULTS.length;
        }
      });
      setActive(closest);

      // Infinite loop wrap
      const totalRealWidth = RESULTS.length * CARD_WIDTH;
      if (container.scrollLeft < CARD_WIDTH * 0.5) {
        container.scrollLeft += totalRealWidth;
      } else if (container.scrollLeft > totalRealWidth * 2.5) {
        container.scrollLeft -= totalRealWidth;
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollByCard = (direction = 1) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * CARD_WIDTH, behavior: "smooth" });
  };

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden bg-[#FAF7F0] rounded-[32px] border border-[#E8D9B2] shadow-[0_24px_60px_rgba(31,77,58,0.06)]">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C7A44A] rounded-full blur-[120px] opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#1F4D3A_0.5px,transparent_0.5px)] bg-[length:32px_32px] opacity-10" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        <div className="text-center space-y-4">
          <span className="inline-block py-1.5 px-5 rounded-full text-xs font-bold tracking-[0.22em] uppercase border border-[#C7A44A] bg-white/70 backdrop-blur-sm text-[#1F4D3A]">
            Minh chứng thực tế
          </span>
          <h2 className="pt-serif-bold text-3xl sm:text-4xl md:text-5xl text-[#1E2A2F] leading-[1.16] sm:leading-[1.18] drop-shadow-sm space-y-1">
            <span className="block pt-serif-bold">KẾT QUẢ KHI ÁP DỤNG</span>{" "}
            <span className="relative inline-block block mt-1 pt-serif-bold">
              <span className="relative z-10 text-[#1F4D3A] pt-serif-bold">KHƠI THÔNG DÒNG TIỀN</span>
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#C7A44A] opacity-60 z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h2>
          <div className="w-16 h-1 mx-auto rounded-full bg-[#C7A44A]" />
        </div>

        <div className="relative group">
          {/* Navigation buttons visible on all breakpoints */}
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/90 border border-[#E8D9B2] shadow-lg hover:bg-[#1F4D3A] hover:text-white hover:border-[#1F4D3A] transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/90 border border-[#E8D9B2] shadow-lg hover:bg-[#1F4D3A] hover:text-white hover:border-[#1F4D3A] transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="slider-mask py-8 overflow-hidden">
            <div
              ref={containerRef}
              className="flex overflow-hidden gap-4 pb-6 items-center snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {sliderItems.map((item, idx) => {
                const realIndex = idx % RESULTS.length;
                const isActive = realIndex === active;
                const scale = isActive ? 1 : 0.86;
                const opacity = isActive ? 1 : 0.55;

                return (
                  <div
                    key={`${item.img}-${idx}`}
                    data-card
                    className="flex-shrink-0 px-2 snap-center"
                    style={{ width: `${CARD_WIDTH}px` }}
                  >
                    <div
                      className="relative rounded-2xl overflow-hidden border-2 transition-all duration-400"
                      style={{
                        borderColor: isActive ? "#C7A44A" : "#E8D9B2",
                        height: "620px",
                        transform: `scale(${scale})`,
                        opacity,
                        boxShadow: isActive
                          ? "0 18px 50px -16px rgba(0,0,0,0.14), 0 0 26px -8px rgba(199,164,74,0.28)"
                          : "0 8px 22px rgba(0,0,0,0.06)",
                        filter: isActive ? "grayscale(0%)" : "grayscale(18%)",
                        zIndex: isActive ? 20 : 1,
                      }}
                    >
                      <img src={item.img} alt="Kết quả học viên" className="w-full h-full object-cover rounded-xl" />
                      {item.badge && (
                        <div className="absolute bottom-4 right-4 glass-badge text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#FFD700]" />
                          {item.badge}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex md:hidden justify-center items-center gap-2 text-sm text-[#1F4D3A] -mt-2 font-medium opacity-80 mb-2">
            <Hand className="w-5 h-5 animate-hand-swipe" />
            <span>Chạm & lướt xem kết quả</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <a
            href="#dang-ky"
            className="btn-pulse group relative inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F4D3A] shadow-2xl hover:-translate-y-1 transition duration-300 bg-[#1F4D3A]"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-full opacity-25 bg-gradient-to-b from-transparent via-transparent to-[#0c2219]" />
            <span className="relative flex items-center gap-3 tracking-[0.08em]">
              BẤM ĐỂ NHẬN VÉ THAM DỰ
              <ArrowRight className="w-5 h-5 text-[#C7A44A] transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </a>
          <div className="flex items-center gap-2 text-sm italic text-[#1F4D3A]">
            <svg className="w-4 h-4 text-[#C7A44A]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Ưu đãi có giới hạn thời gian
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
