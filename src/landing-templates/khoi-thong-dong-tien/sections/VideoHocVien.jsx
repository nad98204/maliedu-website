import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Hand, Play } from "lucide-react";

const STUDENT_VIDEOS = [
  {
    name: "Lan Anh",
    label: "Học viên Khóa Học",
    status: "THÀNH CÔNG",
    desc: "Chia sẻ trải nghiệm chân thực và kết quả đột phá sau khi thấu hiểu quy luật Luật Hấp Dẫn.",
    views: "1.2K lượt xem",
    videoUrl: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1774580108130-491093613-B-nh-Xe-Cu-c---i.mp4",
  },
  {
    name: "Hoàng Minh",
    label: "Thành viên Cộng đồng",
    status: "BỨT PHÁ",
    desc: "Từ nghi ngờ đến tin tưởng tuyệt đối, áp dụng và nhận về kết quả tài chính vượt ngoài mong đợi.",
    views: "956 lượt xem",
    videoUrl: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1774580108130-491093613-B-nh-Xe-Cu-c---i.mp4",
  },
  {
    name: "Quỳnh Hoa",
    label: "Học viên Khóa Học",
    status: "HẠNH PHÚC",
    desc: "Tìm thấy sự bình an trong tâm trí và thu hút dòng tiền bền vững thông qua thực hành tỉnh thức.",
    views: "1.5K lượt xem",
    videoUrl: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1774580108130-491093613-B-nh-Xe-Cu-c---i.mp4",
  },
];

// Duplicate for seamless scroll
const DISPLAY_VIDEOS = [...STUDENT_VIDEOS, ...STUDENT_VIDEOS, ...STUDENT_VIDEOS];

const CARD_WIDTH = 340;

const VideoHocVien = () => {
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);
  const [playingIndex, setPlayingIndex] = useState(-1);

  const pauseOthers = (idx) => {
    videoRefs.current.forEach((video, i) => {
      if (video && i !== idx) {
        video.pause();
        video.currentTime = 0;
      }
    });
  };

  const togglePlay = (idx) => {
    const target = videoRefs.current[idx];
    if (!target) return;

    if (playingIndex === idx) {
      target.pause();
      setPlayingIndex(-1);
    } else {
      pauseOthers(idx);
      target.muted = false;
      target.play();
      setPlayingIndex(idx);
    }
  };

  const scrollByCard = (dir = 1) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const { scrollLeft, scrollWidth, clientWidth } = slider;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10;
    const isAtStart = scrollLeft <= 10;

    if (dir === 1 && isAtEnd) {
      slider.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir === -1 && isAtStart) {
      slider.scrollTo({ left: scrollWidth, behavior: "smooth" });
      return;
    }

    slider.scrollBy({ left: dir * (CARD_WIDTH + 24), behavior: "smooth" });
  };

  const handleScroll = () => {
    // 1. Auto-pause logic
    if (playingIndex !== -1) {
      const target = videoRefs.current[playingIndex];
      if (target && !target.paused) {
        target.pause();
        setPlayingIndex(-1);
      }
    }

    // 2. Loop logic for infinite effect
    const slider = sliderRef.current;
    if (slider) {
      const { scrollLeft, scrollWidth, clientWidth } = slider;
      
      // If we reach the absolute end of the tripled list, jump back to middle visually
      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        slider.scrollLeft = scrollWidth / 3;
      } 
      // If we reach the absolute start, jump to middle
      else if (scrollLeft <= 5) {
        slider.scrollLeft = scrollWidth / 3;
      }
    }
  };

  return (
    <section
      className="relative rounded-[2.5rem] py-16 sm:py-24 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FDF8EE 0%, #F5E6BF 100%)",
        border: "1px solid rgba(212, 181, 114, 0.4)",
        boxShadow: "0 25px 60px rgba(122, 33, 19, 0.04)"
      }}
    >
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-[#C9961A]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-100px] w-[300px] h-[300px] bg-[#7A2113]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-100px] left-[20%] w-[400px] h-[400px] bg-[#C9961A]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-2 sm:px-10 space-y-12 w-full">
        {/* Header - Impactful */}
        <div className="text-center space-y-3 w-full mx-auto px-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7A2113]/5 border border-[#7A2113]/10 text-[#7A2113] text-[10px] font-bold uppercase tracking-[0.25em]">
             Chia sẻ từ trái tim
          </div>
          <h2 className="text-[22px] sm:text-4xl font-black text-[#3A2208] leading-tight tracking-tighter scale-x-105 transform origin-center">
            <span className="block whitespace-nowrap">KẾT QUẢ KHI ÁP DỤNG</span>
            <span className="block whitespace-nowrap text-[#7A2113] text-[24px] sm:text-4xl mt-1">KHƠI THÔNG DÒNG TIỀN</span>
          </h2>
          <div className="text-[14px] sm:text-lg text-[#5C3A1A] font-medium opacity-80 leading-relaxed tracking-tighter scale-x-105 transform origin-center">
            <span className="block whitespace-nowrap italic">"Lắng nghe hành trình chuyển hóa của các học viên"</span>
            <span className="block whitespace-nowrap italic mt-1">"sau khi áp dụng Lộ trình Khơi Thông Dòng Tiền"</span>
          </div>
        </div>


        {/* Slider Area */}
        <div className="relative group/slider px-2">
          {/* Nav Buttons - Desktop only */}
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="hidden lg:flex absolute -left-8 top-[40%] -translate-y-1/2 z-30 w-14 h-14 items-center justify-center rounded-full bg-white/60 backdrop-blur-md border border-white shadow-xl hover:bg-[#7A2113] hover:text-white transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="hidden lg:flex absolute -right-8 top-[40%] -translate-y-1/2 z-30 w-14 h-14 items-center justify-center rounded-full bg-white/60 backdrop-blur-md border border-white shadow-xl hover:bg-[#7A2113] hover:text-white transition-all duration-300"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="overflow-hidden pb-10">
            <div
              ref={sliderRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {DISPLAY_VIDEOS.map((item, idx) => {
                const isPlaying = playingIndex === idx;
                return (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex-shrink-0 snap-center p-1"
                    style={{ width: `${CARD_WIDTH}px` }}
                  >
                    <div
                      className="group relative h-full rounded-[2rem] bg-white border border-[#D4B572]/30 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-[#7A2113]/30"
                      style={{ boxShadow: "0 15px 35px rgba(122, 33, 19, 0.05)" }}
                    >
                      {/* Video Container */}
                      <div className="relative aspect-video bg-black overflow-hidden cursor-pointer">
                        <video
                          ref={(el) => { videoRefs.current[idx] = el; }}
                          className="h-full w-full object-cover"
                          playsInline
                          loop
                          controls={isPlaying}
                          onPlay={() => setPlayingIndex(idx)}
                          onPause={() => { if (playingIndex === idx) setPlayingIndex(-1); }}
                          onClick={() => togglePlay(idx)}
                        >
                          <source src={item.videoUrl} type="video/mp4" />
                        </video>

                        {/* Custom Overlay when NOT playing - Hide when playing */}
                        {!isPlaying && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/40 group/play"
                            onClick={() => togglePlay(idx)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-60" />
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping scale-150 opacity-0 group-hover/play:opacity-100 transition-opacity" />
                              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-2xl text-[#7A2113] transform transition duration-500 group-hover/play:scale-110 group-active/play:scale-95">
                                <Play className="w-7 h-7 fill-current ml-1" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Badges on Video - Hide when playing */}
                        {!isPlaying && (
                          <>
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                              <div className="inline-flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-lg border border-white">
                                <div className="w-6 h-6 rounded-full bg-[#7A2113] text-white flex items-center justify-center font-black text-[10px]">
                                  {item.name.charAt(0)}
                                </div>
                                <span className="text-[10px] font-bold text-[#3A2208] uppercase tracking-wider">{item.name}</span>
                              </div>
                            </div>

                            <div className="absolute top-4 right-4 z-10">
                              <span className="bg-[#C9961A] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] shadow-lg">
                                {item.status}
                              </span>
                            </div>
                            
                            {/* View Count Badge */}
                            <div className="absolute bottom-4 left-4 z-10">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/90">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">{item.views}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-6 space-y-3 bg-[#FDF8EE] border-t border-[#D4B572]/20 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#C9961A]" />
                          <span className="text-[11px] font-bold text-[#7A2113]/70 uppercase tracking-widest">{item.label}</span>
                        </div>
                        <p className="text-[15px] text-[#5C3A1A] leading-relaxed font-medium italic">
                          "{item.desc}"
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex lg:hidden justify-center items-center gap-3 text-xs text-[#7A2113] font-bold uppercase tracking-widest opacity-60">
            <Hand className="w-5 h-5 animate-bounce" />
            <span>Vuốt để nghe chia sẻ</span>
          </div>
        </div>

        {/* CTA - High Conversion Style */}
        <div className="relative pt-6 flex flex-col items-center gap-6">
          <div className="absolute top-0 w-full max-w-lg h-[1px] bg-gradient-to-r from-transparent via-[#D4B572]/50 to-transparent" />
          
          <div className="text-center w-full overflow-hidden px-1">
            <p className="text-[#3A2208] text-[14px] sm:text-lg font-bold leading-tight whitespace-nowrap tracking-tighter scale-x-105 transform origin-center">
              Bạn có muốn là câu chuyện thành công tiếp theo?
            </p>
          </div>

          <div className="flex justify-center w-full">
            <a
              href="#dang-ky"
              className="group relative inline-flex items-center gap-3 rounded-full px-10 py-5 font-black uppercase tracking-[0.1em] text-[#FFE566] text-xs sm:text-base overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(232,57,63,0.3)] active:scale-95 text-center"
              style={{
                background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
                boxShadow: "0 15px 35px rgba(156,12,18,0.4)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-white/20" />
              BẤM ĐỂ NHẬN VÉ THAM DỰ
              <ArrowRight className="w-5 h-5 transform transition group-hover:translate-x-1" />
            </a>
          </div>
          
          <div className="text-center space-y-1 scale-x-105 transform origin-center">
            <p className="text-[11px] sm:text-[12px] text-[#7A2113] font-bold uppercase tracking-[0.1em] opacity-50 whitespace-nowrap">
              Chỉ dành cho những ai
            </p>
            <p className="text-[11px] sm:text-[12px] text-[#7A2113] font-bold uppercase tracking-[0.1em] opacity-50 whitespace-nowrap">
              khao khát thay đổi
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoHocVien;
