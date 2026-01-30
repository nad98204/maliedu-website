import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

const EVENT_START = "2026-01-21T20:00:00+07:00";
const VIDEO_EMBED_URL =
  "https://storage.googleapis.com/msgsndr/Ap9y6wdpftIPKJBsddZ2/media/689611b86346f43e6e53ff86.mp4";

const Countdown = () => {
  const targetTime = useMemo(() => new Date(EVENT_START).getTime(), []);
  const [timeLeft, setTimeLeft] = useState(() => targetTime - Date.now());

  useEffect(() => {
    const update = () => setTimeLeft(targetTime - Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  if (timeLeft <= 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#C7A44A] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1E2A2F] shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#1F4D3A] animate-pulse" />
        Đã khai giảng
      </div>
    );
  }

  const seconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [
    { label: "Ngày", value: days },
    { label: "Giờ", value: hours },
    { label: "Phút", value: minutes },
    { label: "Giây", value: secs },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 justify-center">
      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#1E2A2F]">
        <Clock className="h-4 w-4 text-[#1F4D3A]" />
        Đếm ngược ngày khai giảng
      </div>
      <div className="flex items-center gap-2">
        {parts.map((item) => (
          <div
            key={item.label}
            className="w-16 rounded-2xl bg-white border border-[#E7DBC0] text-center px-3 py-2 shadow-[0_10px_30px_rgba(31,77,58,0.12),0_6px_16px_rgba(0,0,0,0.04)]"
          >
            <div className="text-lg font-bold text-[#1E2A2F] leading-none">
              {String(item.value).padStart(2, "0")}
            </div>
            <div className="text-[11px] text-[#4B5563] mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Hero = () => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.volume = 1;
    videoEl.muted = isMuted;
    const tryPlay = async () => {
      try {
        await videoEl.play();
        setAutoplayBlocked(false);
      } catch {
        setAutoplayBlocked(true);
      }
    };
    tryPlay();
  }, [isMuted]);

  const handleMuteToggle = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoEl.muted = nextMuted;
    videoEl.volume = 1;
    try {
      await videoEl.play();
      setAutoplayBlocked(false);
    } catch {
      setAutoplayBlocked(true);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="bg-[#F6F2EA] text-[#1F4D3A] text-xs sm:text-sm font-semibold uppercase tracking-[0.34em] text-center py-2.5 border-b border-[#E7DBC0] shadow-[0_8px_18px_rgba(31,77,58,0.06)]">
        ✦ 4 BUỔI TỐI HỌC ONLINE MIỄN PHÍ ✦
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(199,164,74,0.14),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(31,77,58,0.12),transparent_40%),radial-gradient(circle_at_50%_88%,rgba(199,164,74,0.1),transparent_42%)]" />
      <div className="absolute inset-0 opacity-45 bg-[linear-gradient(120deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.3)_100%)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16 space-y-8 sm:space-y-10">
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="pt-serif-bold text-[2.55rem] sm:text-[3.5rem] lg:text-[4rem] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-[#1F4D3A] leading-[1.08] drop-shadow-[0_10px_28px_rgba(31,77,58,0.12)]">
            KHƠI THÔNG DÒNG TIỀN
          </h1>
          <p className="roboto text-[14px] sm:text-xl leading-[1.5] text-[#4B5563] italic max-w-2xl mx-auto text-center">
            “Giúp bạn giải phóng tắc nghẽn tài chính, nâng cao tần số nội tâm và xây dựng lộ trình đạt mục tiêu tài chính”
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-center">
          <a
            href="#dang-ky"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-8 sm:px-10 py-3 text-[15px] sm:text-sm font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-[#1F4D3A] border border-[#C7A44A] shadow-[0_14px_30px_rgba(31,77,58,0.12)] transition duration-200 hover:-translate-y-[2px] hover:bg-[#F6F2EA]"
          >
            <span className="block text-center leading-tight">BẤM ĐỂ NHẬN VÉ THAM DỰ</span>
          </a>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div
              className="relative overflow-hidden bg-[#FDFBF6] rounded-[22px]"
              style={{
                boxShadow: "0 30px 80px rgba(199,164,74,0.16), 0 10px 30px rgba(31,77,58,0.08)",
              }}
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#F1E4C8] bg-[#FBF6EB]">
                <div className="text-[12px] uppercase tracking-[0.18em] text-[#1E2A2F] font-semibold">
                  Video giới thiệu
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1F4D3A]/10 px-3 py-1.5 text-[11px] text-[#1F4D3A] shadow-sm border border-[#1F4D3A]/20">
                  Xem ngay
                  <span className="w-2 h-2 rounded-full bg-[#1F4D3A] animate-pulse" />
                </div>
              </div>
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  controls
                  preload="metadata"
                  autoPlay
                  muted={isMuted}
                  playsInline
                >
                  <source src={VIDEO_EMBED_URL} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={handleMuteToggle}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 text-[#1F4D3A] text-[10px] font-semibold uppercase tracking-[0.1em] px-3.5 py-1.5 border border-[#1F4D3A]/30 shadow-[0_10px_20px_rgba(31,77,58,0.14)] hover:bg-white transition"
                  >
                    {isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                  </button>
                  {autoplayBlocked && (
                    <span className="text-[10px] sm:text-xs text-[#1E2A2F] bg-white/90 px-3 py-1 rounded-full border border-[#E7DBC0] shadow-sm">
                      Nhấn “Bật âm thanh” để nghe
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center gap-2">
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#C7A44A] bg-white/90 shadow-[0_8px_18px_rgba(31,77,58,0.08)] text-[14px] font-semibold uppercase tracking-[0.16em] text-[#1E2A2F]">
                20h00, 4-5-6-7/01
              </div>
              <Countdown />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
