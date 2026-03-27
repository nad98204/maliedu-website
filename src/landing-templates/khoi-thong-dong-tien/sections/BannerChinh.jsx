import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KHOI_THONG_DONG_TIEN_CONFIG } from "../landingConfig";

const VIDEO_URL =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1774580108130-491093613-B-nh-Xe-Cu-c---i.mp4";
const TITLE_IMG_URL =
  "https://assets.cdn.filesafe.space/Ap9y6wdpftIPKJBsddZ2/media/6895aa923b96f708cbbf70c2.jpeg";
const VIDEO_POSTER_URL =
  "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682614/Kh%C6%A1i_Th%C3%B4ng_D%C3%B2ng_Ti%E1%BB%81n_M%C3%A0u_Xanh_sjajsx.jpg";

/* ─── VideoPlayer ────────────────────────────────────────────── */
const VideoPlayer = () => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [showPause, setShowPause] = useState(false);
  let hideTimer = useRef(null);

  const attemptAutoplay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    const playPromise = v.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        v.muted = true;
        const retryPromise = v.play();
        if (retryPromise?.catch) {
          retryPromise.catch(() => setPlaying(false));
        }
      });
    }
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    // Show play/pause feedback icon briefly
    setShowPause(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowPause(false), 800);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && volume === 0) {
      v.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    const v = videoRef.current;
    if (v) {
      v.volume = val;
      if (val > 0) {
        v.muted = false;
        setMuted(false);
      } else {
        v.muted = true;
        setMuted(true);
      }
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.defaultMuted = true;
      v.muted = true;
      v.volume = 0.7;
      attemptAutoplay();
    }
  }, [attemptAutoplay]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.18), 0 0 0 3px #C9961A, 0 0 0 5px #F8E08A" }}
      onClick={togglePlay}
    >
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          defaultMuted
          loop
          playsInline
          preload="auto"
          poster={VIDEO_POSTER_URL}
          onLoadedData={() => {
            setIsVideoReady(true);
            setHasVideoError(false);
            attemptAutoplay();
          }}
          onCanPlay={attemptAutoplay}
          onPlaying={() => {
            setPlaying(true);
            setIsVideoReady(true);
          }}
          onPause={() => setPlaying(false)}
          onError={() => {
            setHasVideoError(true);
            setIsVideoReady(false);
            setPlaying(false);
          }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {!isVideoReady && !hasVideoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none">
            <div className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFE566] bg-black/55 border border-[#C9961A]/70">
              Dang tai video...
            </div>
          </div>
        )}

        {/* Play/Pause feedback icon (briefly shown on click) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
          style={{ opacity: showPause ? 1 : 0 }}
        >
          <div className="bg-black/50 rounded-full w-16 h-16 flex items-center justify-center backdrop-blur-sm">
            {playing
              ? <span className="text-white text-3xl">▶</span>
              : <span className="text-white text-3xl ml-1">⏸</span>
            }
          </div>
        </div>

        {/* ── Overlay bật tiếng ── */}
        {muted && (
          <div
            className="absolute inset-0 flex items-end justify-center pb-4 z-20"
            style={{ pointerEvents: 'none' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                const v = videoRef.current;
                if (v) {
                  v.muted = false;
                  v.volume = 0.7;
                  setMuted(false);
                  setVolume(0.7);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm animate-bounce"
              style={{
                background: 'rgba(0,0,0,0.7)',
                border: '1.5px solid #C9961A',
                color: '#FFE566',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'all',
              }}
            >
              <span className="text-lg">🔊</span>
              Bấm để bật tiếng
            </button>
          </div>
        )}

        {/* ── Mute/Volume Controls ── */}
        <div
          className="absolute top-3 right-3 z-30 flex items-center gap-2 p-1.5 rounded-full transition-all duration-300"
          style={{
            background: "rgba(30,30,30,0.6)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Volume Slider - Chỉ hiển thị trên desktop */}
          <div className="hidden md:flex items-center pl-2 group/vol">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/vol:w-20 h-1.5 transition-all duration-300 accent-[#C9961A] cursor-pointer"
              style={{ padding: 0 }}
            />
          </div>

          <button
            onClick={toggleMute}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95"
            style={{
              background: (muted || volume === 0)
                ? "rgba(50,50,50,0.8)"
                : "linear-gradient(135deg, #C9961A, #F8E08A)",
              color: (muted || volume === 0) ? "#fff" : "#3A1A00",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
            aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
          >
            <span className="text-base leading-none">{(muted || volume === 0) ? "🔇" : "🔊"}</span>
            <span className="tracking-wide hidden sm:inline">{(muted || volume === 0) ? "Bật tiếng" : "Tắt tiếng"}</span>
          </button>
        </div>



      </div>
    </div>
  );
};



/* ─── Countdown ─────────────────────────────────────────────── */
const Countdown = () => {
  const target = useMemo(
    () => new Date(KHOI_THONG_DONG_TIEN_CONFIG.eventStart).getTime(),
    []
  );
  const [left, setLeft] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const s = Math.floor(left / 1000);
  const parts = [
    { label: "NGÀY", value: Math.floor(s / 86400) },
    { label: "GIỜ", value: Math.floor((s % 86400) / 3600) },
    { label: "PHÚT", value: Math.floor((s % 3600) / 60) },
    { label: "GIÂY", value: s % 60 },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {parts.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center w-[72px] h-[76px] sm:w-[84px] sm:h-[90px] rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #8B1A10 0%, #5A0A05 100%)", boxShadow: "0 6px 20px rgba(90,10,5,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" }}
        >
          <span className="text-[2rem] sm:text-[2.3rem] font-black text-white leading-none tracking-tight">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-red-200 uppercase tracking-[0.14em] mt-1">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── BannerChinh ────────────────────────────────────────────── */
const BannerChinh = () => (
  <section
    className="relative w-full overflow-hidden font-sans"
    style={{ background: "transparent" }}
  >
    {/* (Đã loại bỏ ảnh chữ và nền dư thừa để dùng chung với global layout KhoiThongDongTien) */}

    {/* ── Ánh sáng Gradient Ambient cho nền sáng ── */}
    <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#FFE566]/40 blur-[130px] rounded-full pointer-events-none z-0" />
    <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-white/70 blur-[150px] rounded-full pointer-events-none z-0" />

    {/* ── Top bar ── */}
    <div
      className="relative w-full py-2.5 sm:py-3 text-center z-10 border-b border-[#F8E08A]/30 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(74, 31, 8, 0.85), rgba(124, 57, 16, 0.8), rgba(74, 31, 8, 0.85)), url("https://res.cloudinary.com/dstukyjzd/image/upload/v1772610554/mali-edu/uqs2zpqprj1xhrh3kubu.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}
    >
      <span className="relative z-10 text-[#FFE566] text-xs sm:text-sm font-black tracking-[0.18em] uppercase drop-shadow-md">
        4 BUỔI TỐI HỌC ONLINE MIỄN PHÍ
      </span>
    </div>

    {/* ── Body card ── */}
    <div className="relative z-10 max-w-[640px] lg:max-w-7xl mx-auto px-4 sm:px-6 pb-12 mt-4 sm:mt-8 space-y-6 sm:space-y-8 lg:space-y-0 lg:flex lg:flex-row lg:items-center lg:gap-12 lg:pb-16">

      {/* ── Left Column (Desktop) / Top Section (Mobile) ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center space-y-6 sm:space-y-8">

        {/* Title Image (now inside the column on desktop) */}
        <div className="w-full flex justify-center">
          <img
            src={TITLE_IMG_URL}
            alt="Khơi Thông Dòng Tiền"
            className="w-full max-w-[680px] sm:max-w-[820px] lg:max-w-full h-auto object-contain drop-shadow-lg"
            style={{ display: "block" }}
          />
        </div>

        {/* Video (Mobile Only) */}
        <div className="w-full lg:hidden">
          <VideoPlayer />
        </div>

        {/* Quote */}
        <div className="relative text-center px-4 sm:px-10 py-5 lg:px-10 lg:py-5 max-w-[500px] mx-auto z-10 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
          {/* Dấu ngoặc kép trang trí */}
          <div className="absolute top-1 left-1.5 sm:left-3 text-[#C9961A] opacity-40 text-4xl font-serif leading-none">“</div>
          <div className="absolute bottom-[-12px] right-1.5 sm:right-3 text-[#C9961A] opacity-40 text-4xl font-serif leading-none">”</div>

          <p className="text-[0.8rem] sm:text-[0.85rem] lg:text-[0.9rem] leading-[1.6] text-[#5A3A1A] italic font-medium px-2">
            <span className="hidden sm:inline">Giúp bạn </span>
            giải phóng tắc nghẽn tài chính, nâng cao tần số nội tâm
            <br className="sm:hidden" />
            và xây dựng lộ trình đạt mục tiêu tài chính
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4 lg:gap-5 w-full">
          {/* Glow */}
          <div className="relative w-full max-w-[360px] lg:max-w-[400px] mx-auto">
            <div className="absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity hover:opacity-70"
              style={{ background: "#C8282E" }} />
            <a
              href="#dang-ky"
              className="group relative flex flex-col items-center justify-center w-full rounded-full py-4 lg:py-4.5 overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
                boxShadow: "0 10px 30px rgba(160,20,28,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <span className="absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="text-[#FFE566] font-black text-[1.05rem] sm:text-[1.2rem] lg:text-[1.25rem] uppercase tracking-[0.08em] drop-shadow">
                BẤM ĐỂ NHẬN VÉ THAM DỰ
              </span>
              <span className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE566] animate-ping opacity-80" />
                <span className="text-white/90 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-wider">
                  {KHOI_THONG_DONG_TIEN_CONFIG.ctaScheduleLabel}
                </span>
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-[0.72rem] sm:text-[0.8rem] lg:text-[0.85rem] text-[#5A3A1A] font-semibold bg-white/80 backdrop-blur-md px-4 py-1.5 lg:py-2 rounded-full border border-white shadow-sm transition hover:bg-white">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            Đã có <b className="text-[#8C0C12] mx-0.5">500+</b> người đăng ký tham gia
          </div>
        </div>

        {/* Countdown */}
        <div className="w-full flex justify-center">
          <Countdown />
        </div>
      </div>

      {/* ── Right Column (Desktop Only Video) ── */}
      <div className="hidden lg:flex w-full lg:w-1/2 justify-center lg:justify-end items-center relative">
        <div className="w-full max-w-[580px] xl:max-w-[620px] relative z-20 flex flex-col gap-6 lg:gap-8">

          <div className="w-full transition-transform duration-500 hover:scale-[1.02]">
            <VideoPlayer />
          </div>

          {/* Thêm phần nội dung dưới video */}
          <div className="w-full bg-white/70 backdrop-blur-xl rounded-2xl p-6 lg:p-7 border border-white/80 text-left transition-transform duration-500 hover:scale-[1.02]" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
            <h3 className="text-[#8C0C12] font-black text-lg mb-4 uppercase tracking-[0.05em] flex items-center gap-3">
              <span className="w-8 h-[3px] bg-gradient-to-r from-[#8C0C12] to-transparent inline-block rounded-full"></span>
              Trong 4 ngày bạn sẽ nhận được
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9961A] to-[#F8E08A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-[#3A1A00] text-sm font-bold">✓</span>
                </div>
                <p className="text-[#4A2F1D] text-[1rem] leading-[1.5]">
                  <strong>Giải mã gốc rễ</strong> nguyên nhân khiến dòng tiền tắc nghẽn trong tâm thức.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9961A] to-[#F8E08A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-[#3A1A00] text-sm font-bold">✓</span>
                </div>
                <p className="text-[#4A2F1D] text-[1rem] leading-[1.5]">
                  <strong>Bộ công cụ thực hành</strong> chuyển hóa năng lượng, gia tăng tần số thu hút sự thịnh vượng.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9961A] to-[#F8E08A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-[#3A1A00] text-sm font-bold">✓</span>
                </div>
                <p className="text-[#4A2F1D] text-[1rem] leading-[1.5]">
                  <strong>Xây dựng bản đồ tài chính</strong> cá nhân bền vững, hướng tới tự do tài chính.
                </p>
              </li>
            </ul>
          </div>

          {/* Decorative background glow behind video on desktop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#C9961A]/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        </div>
      </div>

    </div>

    {/* Tailwind custom animations */}
    <style>{`
      @keyframes shine { 0%{transform:translateX(-150%) skewX(-20deg)}100%{transform:translateX(250%) skewX(-20deg)} }
    `}</style>
  </section>
);

export default BannerChinh;
