import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Hand, Play } from "lucide-react";

const STUDENT_VIDEOS = [
  {
    name: "Lan Anh",
    label: "Học viên Khóa Học",
    status: "THÀNH CÔNG",
    desc: "Chia sẻ trải nghiệm và kết quả sau khi học khóa học Luật Hấp Dẫn.",
    views: "1.2K lượt xem",
    videoUrl: "https://storage.googleapis.com/msgsndr/Ap9y6wdpftIPKJBsddZ2/media/689611b86346f43e6e53ff86.mp4",
  },
  {
    name: "Hoàng Minh",
    label: "Học viên Khóa Học",
    status: "THÀNH CÔNG",
    desc: "Từ nghi ngờ đến tin tưởng, áp dụng và nhận về kết quả tài chính tích cực.",
    views: "1.2K lượt xem",
    videoUrl: "https://storage.googleapis.com/msgsndr/Ap9y6wdpftIPKJBsddZ2/media/689611b86346f43e6e53ff86.mp4",
  },
  {
    name: "Quỳnh Hoa",
    label: "Học viên Khóa Học",
    status: "THÀNH CÔNG",
    desc: "Chia sẻ trải nghiệm và kết quả sau khi học khóa học Luật Hấp Dẫn.",
    views: "1.2K lượt xem",
    videoUrl: "https://storage.googleapis.com/msgsndr/Ap9y6wdpftIPKJBsddZ2/media/689611b86346f43e6e53ff86.mp4",
  },
];

const StudentTestimonialsVideoSection = () => {
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const CARD_WIDTH = 320;

  const pauseOthers = (idx) => {
    videoRefs.current.forEach((video, videoIdx) => {
      if (video && videoIdx !== idx) {
        video.pause();
        video.currentTime = 0;
      }
    });
  };

  const handlePlay = (idx) => {
    const target = videoRefs.current[idx];
    if (!target) return;

    pauseOthers(idx);
    target.muted = false;
    target.play();
    setPlayingIndex(idx);
  };

  const handleExternalPlay = (idx) => {
    pauseOthers(idx);
    setPlayingIndex(idx);
  };

  const handlePause = (idx) => {
    if (playingIndex === idx) {
      setPlayingIndex(-1);
    }
  };

  const scrollByCard = (direction = 1) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: direction * (CARD_WIDTH + 24), behavior: "smooth" });
  };

  return (
    <section className="relative bg-[#FAF7F0] py-16 sm:py-20 rounded-[32px] border border-[#E8D9B2] shadow-[0_24px_60px_rgba(31,77,58,0.06)] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute w-[520px] h-[520px] bg-[#C7A44A] rounded-full blur-[120px] opacity-20 -top-24 -left-32" />
        <div className="absolute w-[460px] h-[460px] bg-[#1F4D3A] rounded-full blur-[130px] opacity-14 bottom-[-180px] right-[-120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1F4D3A_0.6px,transparent_0.6px)] bg-[length:34px_34px] opacity-10" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="pt-serif-bold text-3xl sm:text-4xl text-[#1E2A2F] leading-[1.16]">
            <span className="block">HỌC VIÊN CHIA SẺ</span>
            <span className="block text-[#1F4D3A]">SAU KHI HỌC KHÓA HỌC</span>
          </h2>
          <p className="roboto text-base sm:text-lg text-[#2A3A3F]">Kết quả thật – Người thật – Câu chuyện thật</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-white/90 border border-[#E8D9B2] shadow-lg hover:bg-[#1F4D3A] hover:text-white hover:border-[#1F4D3A] transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-white/90 border border-[#E8D9B2] shadow-lg hover:bg-[#1F4D3A] hover:text-white hover:border-[#1F4D3A] transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="slider-mask overflow-hidden pb-4">
            <div
              ref={sliderRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {STUDENT_VIDEOS.map((item, idx) => {
                const isPlaying = playingIndex === idx;
                const initial = item.name.charAt(0);

                return (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex-shrink-0 snap-center"
                    style={{ width: `${CARD_WIDTH}px` }}
                  >
                    <div className="h-full rounded-3xl bg-white/85 border border-[#E8D9B2] shadow-[0_16px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
                      <div className="relative aspect-video bg-[#102f26]/70">
                        <video
                          ref={(el) => {
                            videoRefs.current[idx] = el;
                          }}
                          className="h-full w-full object-cover"
                          controls
                          playsInline
                          onPlay={() => handleExternalPlay(idx)}
                          onPause={() => handlePause(idx)}
                        >
                          <source src={item.videoUrl} type="video/mp4" />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>

                        {!isPlaying && (
                          <button
                            type="button"
                            onClick={() => handlePlay(idx)}
                            className="absolute inset-0 flex items-center justify-center w-14 h-14 m-auto rounded-full bg-white/90 text-[#1F4D3A] shadow-[0_14px_30px_rgba(31,77,58,0.2)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C7A44A]"
                            aria-label={`Phát video của ${item.name}`}
                          >
                            <Play className="w-6 h-6" />
                          </button>
                        )}

                        <div className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 text-[#1F4D3A] text-[11px] font-semibold px-3 py-1 shadow-sm border border-[#E8D9B2]">
                          <span className="w-6 h-6 rounded-full bg-[#1F4D3A] text-white flex items-center justify-center font-bold">
                            {initial}
                          </span>
                          {item.label}
                        </div>
                        <div className="absolute top-3 right-3 rounded-full bg-[#C7A44A] text-white text-[11px] font-semibold px-3 py-1.5 shadow-md uppercase tracking-[0.08em]">
                          {item.status}
                        </div>
                      </div>

                      <div className="p-4 space-y-3 flex flex-col flex-1">
                        <div className="flex items-center justify-between text-sm text-[#1F4D3A] font-semibold">
                          <span>{item.name}</span>
                          <span className="inline-flex items-center gap-1 text-[12px] text-[#1F4D3A] bg-[#1F4D3A]/8 px-2 py-1 rounded-full">
                            <Eye className="w-4 h-4" />
                            {item.views}
                          </span>
                        </div>
                        <p className="roboto text-[14px] text-[#2A3A3F] leading-[1.6]">{item.desc}</p>
                        <div className="mt-auto inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[#1F4D3A] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C7A44A]" />
                          Video trải nghiệm thực tế
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex sm:hidden justify-center items-center gap-2 text-sm text-[#1F4D3A] mt-1 font-medium opacity-80">
            <Hand className="w-5 h-5 animate-hand-swipe" />
            <span>Vuốt ngang để xem thêm</span>
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
          <p className="roboto text-sm italic text-[#1F4D3A]">Tham gia ngay để xem trọn bộ hành trình của học viên</p>
        </div>
      </div>
    </section>
  );
};

export default StudentTestimonialsVideoSection;
