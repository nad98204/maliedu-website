import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Play, X } from "lucide-react";
import { trackCtaClick } from "../ctaTracking";
import { scrollToRegistrationForm } from "../scrollToRegistration";

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
  {
    name: "Chị Phương",
    label: "Học viên Mong Coaching – MALI",
    status: "DẪN DẮT",
    desc: "Khi hệ thống đứng trước nguy cơ đổ vỡ, chị lựa chọn thay đổi chính mình, rèn luyện trạng thái và dẫn dắt bằng năng lượng, tư duy cùng sự thấu hiểu con người.",
    views: "Video thực tế",
    youtubeId: "F-VCxNtQNuM",
    videoUrl: "https://www.youtube.com/watch?v=F-VCxNtQNuM",
  },
  {
    name: "Học viên MALI",
    label: "Học viên Vút Tốc Mục Tiêu",
    status: "BƯỚC NGOẶT",
    desc: "Từng ôm hai con ra đi với hai bàn tay trắng, cô đã thay đổi góc nhìn để nhận ra quyết định năm ấy chính là bước ngoặt giúp mình trưởng thành và mạnh mẽ hơn.",
    views: "Video thực tế",
    youtubeId: "9V15y_pUJXk",
    videoUrl: "https://www.youtube.com/watch?v=9V15y_pUJXk",
  },
  {
    name: "Anh Dương",
    label: "Học viên Mong Coaching – MALI",
    status: "ĐỨNG DẬY",
    desc: "Hành trình đứng dậy từ nợ nần và áp lực tài chính bằng việc thay đổi tư duy, thực hành biết ơn, nâng lại năng lượng và từng bước hành động.",
    views: "Video thực tế",
    youtubeId: "cQDNT8LcL-0",
    videoUrl: "https://www.youtube.com/watch?v=cQDNT8LcL-0",
  },
];

const TOTAL = STUDENT_VIDEOS.length;
// 6 bản sao để track luôn rộng hơn viewport; animation dịch -1/6 (một bộ gốc) để seamless
const LOOP_VIDEOS = [...Array(6)].flatMap(() => STUDENT_VIDEOS);

/* ─── shared card UI ─── */
const VideoCard = ({ item, onOpen, width = 280 }) => {
  const thumbRef = useRef(null);
  const wrapRef = useRef(null);
  const [srcLoaded, setSrcLoaded] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setSrcLoaded(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
  <div
    ref={wrapRef}
    className="flex-shrink-0 cursor-pointer group"
    style={{ width }}
    onClick={() => onOpen(item)}
  >
    <div
      className="rounded-2xl bg-white border border-[#D4B572]/25 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-[#C9961A]/40"
      style={{ boxShadow: "0 6px 20px rgba(122,33,19,0.07)" }}
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        {item.youtubeId ? (
          <img
            src={`https://i.ytimg.com/vi/${item.youtubeId}/maxresdefault.jpg`}
            alt={`Video chia sẻ của ${item.name}`}
            className="h-full w-full object-cover opacity-80"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <video
            ref={thumbRef}
            className="h-full w-full object-cover opacity-75"
            playsInline
            muted
            preload={srcLoaded ? "metadata" : "none"}
            onLoadedMetadata={() => { if (thumbRef.current) thumbRef.current.currentTime = 1; }}
          >
            {srcLoaded && <source src={item.videoUrl} type="video/mp4" />}
          </video>
        )}
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

const FeaturedVideoCard = ({ item, onOpen }) => {
  const videoRef = useRef(null);

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-[#D4B572]/55 bg-white/90 shadow-[0_16px_38px_rgba(91,49,14,0.12)]">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="group relative block aspect-video w-full overflow-hidden bg-black"
        aria-label={`Xem video chia sẻ của ${item.name}`}
      >
        {item.youtubeId ? (
          <img
            src={`https://i.ytimg.com/vi/${item.youtubeId}/maxresdefault.jpg`}
            alt={`Video chia sẻ của ${item.name}`}
            className="h-full w-full object-cover opacity-85"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <video
            key={item.videoUrl}
            ref={videoRef}
            src={item.videoUrl}
            className="h-full w-full object-cover opacity-80"
            playsInline
            muted
            preload="metadata"
            onLoadedMetadata={() => { if (videoRef.current) videoRef.current.currentTime = 1; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/15" />
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[0.58rem] font-bold text-white/90 backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5"><Eye className="h-3 w-3" />{item.views}</span>
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#C9961A] px-2.5 py-1 text-[0.55rem] font-black uppercase tracking-[0.1em] text-white shadow-lg">
          {item.status}
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/45 bg-white text-[#7A2113] shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
      </button>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#7A2113] text-sm font-black text-[#FFE388] shadow-md">
            {item.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <h3 className="text-[0.9rem] font-black uppercase text-[#3A2208]">{item.name}</h3>
            <p className="mt-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#A27313]">{item.label}</p>
          </div>
        </div>
        <blockquote className="border-l-2 border-[#C9961A]/65 pl-3 text-[0.78rem] italic leading-[1.65] text-[#5C3A1A]">
          “{item.desc}”
        </blockquote>
      </div>
    </article>
  );
};

/* ─── main component ─── */
const VideoHocVien = () => {
  /* mobile focused story */
  const [active, setActive] = useState(0);
  const autoRef = useRef(null);
  const touchStartX = useRef(null);

  const goTo = useCallback((idx) => {
    setActive((idx + TOTAL) % TOTAL);
  }, []);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActive(i => {
        const next = (i + 1) % TOTAL;
        return next;
      });
    }, 5500);
  }, []);

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

      <div className="relative space-y-7 sm:space-y-10">
        {/* Header */}
        <div className="px-5 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9961A]/70 bg-white/80 px-4 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.19em] text-[#7A2113] shadow-[0_5px_16px_rgba(122,33,19,0.06)] backdrop-blur-sm sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9961A]" />
            Chia sẻ từ trái tim
          </span>
          <div className="mt-4">
            <h2 className="whitespace-nowrap text-[clamp(1.45rem,6.3vw,3.8rem)] font-black leading-[1.1] tracking-[-0.04em] text-[#3A2208]">
              CÂU CHUYỆN THẬT
            </h2>
            <h2 className="mt-1 whitespace-nowrap text-[clamp(1.25rem,5.5vw,3.4rem)] font-black leading-[1.1] tracking-[-0.03em] text-[#7A2113]">
              TỪ HỌC VIÊN
            </h2>
          </div>
          <p className="mx-auto mt-3 max-w-md text-[0.76rem] leading-[1.65] text-[#5C3A1A]/70 sm:text-sm">
            Lắng nghe hành trình chuyển hóa sau khi áp dụng Lộ trình Khơi Thông Dòng Tiền.
          </p>
        </div>

        {/* ── MOBILE: focused student story ── */}
        <div
          className="px-5 md:hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <FeaturedVideoCard
            key={STUDENT_VIDEOS[active].videoUrl}
            item={STUDENT_VIDEOS[active]}
            onOpen={setModalVideo}
          />

          <div className="mt-3 flex items-center gap-3 rounded-full border border-[#D4B572]/45 bg-white/70 p-1.5 shadow-[0_8px_22px_rgba(91,49,14,0.07)] backdrop-blur-sm">
            <button
              type="button"
              onClick={() => { goTo(active - 1); startAuto(); }}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#7A2113] text-[#FFE388] shadow-md transition active:scale-95"
              aria-label="Xem câu chuyện trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <span className="block truncate text-[0.66rem] font-black uppercase text-[#5B2412]">
                {STUDENT_VIDEOS[active].name}
              </span>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#D4B572]/25">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#C9961A] to-[#7A2113] transition-all duration-500"
                    style={{ width: `${((active + 1) / TOTAL) * 100}%` }}
                  />
                </div>
                <span className="text-[0.55rem] font-black tracking-[0.08em] text-[#9A6610]">
                  {String(active + 1).padStart(2, "0")}/{String(TOTAL).padStart(2, "0")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { goTo(active + 1); startAuto(); }}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#7A2113] text-[#FFE388] shadow-md transition active:scale-95"
              aria-label="Xem câu chuyện tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-center text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#7A2113]/45">
            Vuốt để đổi câu chuyện • Chạm video để xem
          </p>
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

        <p className="mx-auto max-w-2xl px-6 text-center text-[0.66rem] leading-[1.6] text-[#6A4A2A]/55 sm:text-xs">
          Các chia sẻ là trải nghiệm thực tế của từng học viên. Kết quả của mỗi người có thể khác nhau tùy hoàn cảnh, quá trình thực hành và hành động thực tế.
        </p>

        {/* CTA */}
        <div className="mx-5 flex flex-col items-center gap-3 rounded-[1.6rem] border border-white/75 bg-white/55 px-4 py-5 text-center shadow-[0_12px_30px_rgba(91,49,14,0.07)] backdrop-blur-sm sm:mx-auto sm:max-w-xl sm:px-7">
          <div>
            <p className="text-[0.88rem] font-black uppercase leading-snug text-[#3A2208] sm:text-base">
              Câu chuyện tiếp theo có thể là của bạn
            </p>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-[#5C3A1A]/70 sm:text-xs">
              Bắt đầu bằng việc đăng ký và nhận hướng dẫn tham gia chương trình.
            </p>
          </div>
          <a
            href="#dang-ky"
            onClick={(e) => {
              e.preventDefault();
              trackCtaClick("VideoHocVien");
              scrollToRegistrationForm();
            }}
            className="group relative inline-flex w-full max-w-[410px] items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[0.7rem] font-black uppercase tracking-[0.025em] text-[#FFE566] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 min-[380px]:text-[0.77rem] sm:text-sm"
            style={{
              background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
              boxShadow: "0 12px 28px rgba(156,12,18,0.4), 0 0 0 2px rgba(255,229,102,0.15)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-full bg-white/20" />
            ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <p className="text-[0.68rem] font-medium text-[#7A2113]/60">
            Học online qua Zoom • Nhận hướng dẫn tham gia
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
            {modalVideo.youtubeId ? (
              <iframe
                className="aspect-video w-full bg-black"
                src={`https://www.youtube-nocookie.com/embed/${modalVideo.youtubeId}?autoplay=1&rel=0`}
                title={`Video chia sẻ của ${modalVideo.name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video ref={modalVideoRef} className="aspect-video w-full bg-black" controls autoPlay playsInline>
                <source src={modalVideo.videoUrl} type="video/mp4" />
              </video>
            )}
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
