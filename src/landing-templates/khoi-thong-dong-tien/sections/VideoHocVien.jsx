import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, Play, X } from "lucide-react";

const STUDENT_VIDEOS = [
  {
    name: "Vân Nguyễn",
    label: "Học viên Khóa Học",
    status: "THÀNH CÔNG",
    desc: "Chia sẻ trải nghiệm chân thực và kết quả đột phá sau khi thấu hiểu quy luật Luật Hấp Dẫn.",
    views: "1.2K lượt xem",
    videoUrl: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776243259065-371557249-V-n-Nguy-n.mp4",
  },
  {
    name: "Thúy Nguyệt",
    label: "Học viên Khóa Học",
    status: "BỨT PHÁ",
    desc: "Từ nghi ngờ đến tin tưởng tuyệt đối, áp dụng và nhận về kết quả tài chính vượt ngoài mong đợi.",
    views: "956 lượt xem",
    videoUrl: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776243242346-87859924-CH--NGUY-T.mp4",
  },
];

const TOTAL = STUDENT_VIDEOS.length;
// 6 bản sao để track luôn rộng hơn viewport; animation dịch -1/6 (một bộ gốc) để seamless
const LOOP_VIDEOS = [...Array(6)].flatMap(() => STUDENT_VIDEOS);

/* ─── shared card UI ─── */
const VideoCard = ({ item, onOpen, width = 280 }) => {
  const thumbRef = useRef(null);
  return (
  <div
    className="flex-shrink-0 cursor-pointer group"
    style={{ width }}
    onClick={() => onOpen(item)}
  >
    <div
      className="rounded-2xl bg-white border border-[#D4B572]/25 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-[#C9961A]/40"
      style={{ boxShadow: "0 6px 20px rgba(122,33,19,0.07)" }}
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        <video
          ref={thumbRef}
          className="h-full w-full object-cover opacity-75"
          playsInline
          muted
          preload="metadata"
          onLoadedMetadata={() => { if (thumbRef.current) thumbRef.current.currentTime = 1; }}
        >
          <source src={item.videoUrl} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/90 shadow-lg text-[#7A2113] transition duration-300 group-hover:scale-110 group-hover:bg-white">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-[#7A2113] text-white flex items-center justify-center font-black text-[8px]">
              {item.name.charAt(0)}
            </div>
            <span className="text-[9px] font-bold text-[#3A2208] uppercase tracking-wider">{item.name}</span>
          </div>
        </div>
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-[#C9961A] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">
            {item.status}
          </span>
        </div>
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white/90">
            <Eye className="w-2.5 h-2.5" />
            <span className="text-[8px] font-bold">{item.views}</span>
          </div>
        </div>
      </div>
      <div className="p-3.5 space-y-1.5 bg-[#FFFDF7] border-t border-[#D4B572]/15 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9961A]" />
          <span className="text-[9.5px] font-bold text-[#7A2113]/60 uppercase tracking-widest">{item.label}</span>
        </div>
        <p className="text-[12px] text-[#5C3A1A] leading-relaxed italic line-clamp-2">
          "{item.desc}"
        </p>
      </div>
    </div>
  </div>
  );
};

/* ─── main component ─── */
const VideoHocVien = () => {
  /* mobile snap carousel */
  const [active, setActive] = useState(0);
  const mobileRef = useRef(null);
  const cardRefs = useRef([]);
  const autoRef = useRef(null);
  const touchStartX = useRef(null);

  // Scroll so card i is exactly centered in its container
  const scrollToCard = useCallback((i) => {
    const container = mobileRef.current;
    const card = cardRefs.current[i];
    if (!container || !card) return;
    const cRect = container.getBoundingClientRect();
    const kRect = card.getBoundingClientRect();
    const newLeft = container.scrollLeft + (kRect.left - cRect.left) - (cRect.width - kRect.width) / 2;
    container.scrollTo({ left: newLeft, behavior: "smooth" });
  }, []);

  const goTo = useCallback((idx) => {
    const i = (idx + TOTAL) % TOTAL;
    setActive(i);
    scrollToCard(i);
  }, [scrollToCard]);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActive(i => {
        const next = (i + 1) % TOTAL;
        scrollToCard(next);
        return next;
      });
    }, 3500);
  }, [scrollToCard]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  /* touch swipe on mobile */
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    clearInterval(autoRef.current);
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -40)       { goTo(active + 1); startAuto(); }
    else if (dx > 40)   { goTo(active - 1); startAuto(); }
    else                  startAuto();
  };


  /* modal */
  const [modalVideo, setModalVideo] = useState(null);
  const modalVideoRef = useRef(null);
  const closeModal = () => {
    if (modalVideoRef.current) modalVideoRef.current.pause();
    setModalVideo(null);
  };

  return (
    <section
      className="relative rounded-3xl py-12 sm:py-16"
      style={{
        background: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.7) 0%, transparent 40%), linear-gradient(135deg, #FDF8EE 0%, #F5E6BF 100%)",
        border: "1px solid rgba(212,181,114,0.4)",
        boxShadow: "0 20px 50px rgba(122,33,19,0.05)",
        overflow: "visible",
      }}
    >
      <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#C9961A]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#7A2113]/5 rounded-full blur-[100px]" />
      </div>

      <style>{`
        @keyframes videoMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 6)); }
        }
        .vm-track {
          display: flex;
          width: max-content;
          animation: videoMarquee 28s linear infinite;
        }
        .vm-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="relative space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 px-4">
          <span className="inline-block py-1.5 px-5 rounded-full text-[10px] sm:text-[11px] font-black tracking-[0.22em] uppercase border border-[#C9961A]/70 bg-white/75 text-[#7A2113] backdrop-blur-sm">
            Chia sẻ từ trái tim
          </span>
          <div>
            <h2 className="font-extrabold text-[#3A2208] tracking-tight leading-[1.15]"
              style={{ fontSize: "clamp(1.5rem, 6.2vw, 3.8rem)" }}>
              KẾT QUẢ KHI ÁP DỤNG
            </h2>
            <h2 className="font-extrabold text-[#7A2113] tracking-tight leading-[1.15]"
              style={{ fontSize: "clamp(1.3rem, 5.5vw, 3.4rem)" }}>
              KHƠI THÔNG DÒNG TIỀN
            </h2>
          </div>
          <p className="text-[10.5px] sm:text-[12px] text-[#5C3A1A]/75 italic leading-relaxed px-2">
            "Lắng nghe hành trình chuyển hóa của các học viên sau khi áp dụng Lộ trình Khơi Thông Dòng Tiền"
          </p>
          <div className="w-20 h-[2px] mx-auto rounded-full bg-gradient-to-r from-transparent via-[#C9961A]/50 to-transparent" />
        </div>

        {/* ── MOBILE: snap carousel ── */}
        <div className="md:hidden">
          <div
            ref={mobileRef}
            className="overflow-x-auto scrollbar-hide"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
              paddingLeft: "9vw",
              paddingRight: "9vw",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex gap-3 pb-1">
              {STUDENT_VIDEOS.map((item, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  className="flex-shrink-0 transition-all duration-300"
                  style={{
                    width: "82vw",
                    scrollSnapAlign: "center",
                    opacity: idx === active ? 1 : 0.55,
                    transform: idx === active ? "scale(1)" : "scale(0.95)",
                  }}
                >
                  <VideoCard item={item} onOpen={setModalVideo} width="100%" />
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-3">
            {STUDENT_VIDEOS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { goTo(i); startAuto(); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? "22px" : "7px",
                  height: "7px",
                  background: i === active ? "#C9961A" : "#D4B572",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── DESKTOP: CSS marquee ── */}
        <div
          className="hidden md:block w-full overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black 7%, black 93%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 7%, black 93%, transparent)" }}
        >
          <div className="vm-track gap-5 py-2 px-3">
            {LOOP_VIDEOS.map((item, idx) => (
              <VideoCard key={idx} item={item} onOpen={setModalVideo} />
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-[#7A2113]/40 font-bold uppercase tracking-[0.18em] -mt-3">
          Vuốt hoặc nhấn để xem
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 px-4">
          <p className="text-[11px] sm:text-[13px] text-[#3A2208] font-semibold text-center leading-snug whitespace-nowrap">
            Bạn có muốn là câu chuyện thành công tiếp theo?
          </p>
          <a
            href="#dang-ky"
            className="group relative inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 font-black uppercase tracking-[0.08em] text-[#FFE566] text-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
              boxShadow: "0 12px 28px rgba(156,12,18,0.4), 0 0 0 2px rgba(255,229,102,0.15)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-full bg-white/20" />
            BẤM ĐỂ NHẬN VÉ THAM DỰ
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <p className="text-[8.5px] text-[#7A2113]/50 font-bold uppercase tracking-[0.15em] text-center whitespace-nowrap">
            Chỉ dành cho những ai khao khát thay đổi
          </p>
        </div>
      </div>

      {/* Video Modal */}
      {modalVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white text-xs font-semibold border border-white/30 bg-black/50 hover:bg-black/70 transition-colors"
              onClick={closeModal}
            >
              <X className="w-3.5 h-3.5" /> Đóng
            </button>
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a0a00]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#7A2113] text-white flex items-center justify-center font-black text-[10px]">
                  {modalVideo.name.charAt(0)}
                </div>
                <span className="text-white text-[11px] font-bold uppercase tracking-wider">{modalVideo.name}</span>
              </div>
              <span className="bg-[#C9961A] text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-[0.1em]">
                {modalVideo.status}
              </span>
            </div>
            <video ref={modalVideoRef} className="w-full aspect-video bg-black" controls autoPlay playsInline>
              <source src={modalVideo.videoUrl} type="video/mp4" />
            </video>
            <div className="px-4 py-3 bg-[#FFFDF7] border-t border-[#D4B572]/20">
              <p className="text-[11px] font-bold text-[#7A2113]/60 uppercase tracking-widest mb-1">{modalVideo.label}</p>
              <p className="text-[13px] text-[#5C3A1A] italic leading-relaxed">"{modalVideo.desc}"</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoHocVien;
