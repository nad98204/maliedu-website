import { useEffect, useMemo, useRef, useState } from "react";

const EVENT_START = "2026-03-16T20:00:00+07:00";
const VIDEO_URL =
  "https://storage.googleapis.com/msgsndr/Ap9y6wdpftIPKJBsddZ2/media/689611b86346f43e6e53ff86.mp4";
const TITLE_IMG_URL =
  "https://assets.cdn.filesafe.space/Ap9y6wdpftIPKJBsddZ2/media/6895aa923b96f708cbbf70c2.jpeg";

/* ─── VideoPlayer ────────────────────────────────────────────── */
const VideoPlayer = () => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [showPause, setShowPause] = useState(false);
  let hideTimer = useRef(null);

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
  };

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
          loop
          playsInline
          preload="auto"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

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

        {/* ── Mute/Unmute Button – always visible, prominent ── */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95"
          style={{
            background: muted
              ? "rgba(30,30,30,0.85)"
              : "linear-gradient(135deg, #C9961A, #F8E08A)",
            color: muted ? "#fff" : "#3A1A00",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            backdropFilter: "blur(6px)",
          }}
          aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
        >
          <span className="text-base leading-none">{muted ? "🔇" : "🔊"}</span>
          <span className="tracking-wide">{muted ? "Bật tiếng" : "Tắt tiếng"}</span>
        </button>



      </div>
    </div>
  );
};



/* ─── Countdown ─────────────────────────────────────────────── */
const Countdown = () => {
  const target = useMemo(() => new Date(EVENT_START).getTime(), []);
  const [left, setLeft] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const s = Math.floor(left / 1000);
  const parts = [
    { label: "NGÀY", value: Math.floor(s / 86400) },
    { label: "GIỜ",  value: Math.floor((s % 86400) / 3600) },
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
    style={{ background: "linear-gradient(180deg, #F5EDD8 0%, #EAD9B8 50%, #DEC9A0 100%)" }}
  >
    {/* ── Top bar ── */}
    <div
      className="relative w-full py-2.5 text-center z-10"
      style={{ background: "linear-gradient(90deg, #4A1F08, #7C3910, #4A1F08)" }}
    >
      <span className="text-[#FFE566] text-xs sm:text-sm font-black tracking-[0.18em] uppercase drop-shadow">
        ✦ 4 BUỔI TỐI HỌC ONLINE MIỄN PHÍ ✦
      </span>
    </div>

    {/* ── Body card ── */}
    <div className="relative z-10 max-w-[640px] lg:max-w-7xl mx-auto px-4 sm:px-6 pb-12 mt-4 sm:mt-8 space-y-6 sm:space-y-8 lg:space-y-0 lg:flex lg:flex-row lg:items-center lg:gap-12 lg:pb-16">
      
      {/* ── Left Column (Desktop) / Top Section (Mobile) ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start space-y-6 sm:space-y-8">
        
        {/* Title Image (now inside the column on desktop) */}
        <div className="w-full flex justify-center lg:justify-start lg:-ml-4">
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
        <div className="text-center lg:text-left px-2 lg:px-0 max-w-[500px]">
          <p className="text-[1rem] sm:text-[1.1rem] lg:text-[1.2rem] leading-[1.8] text-[#3A2208] italic font-medium">
            Giúp bạn giải phóng tắc nghẽn tài chính, nâng cao tần số nội tâm và xây dựng lộ trình đạt mục tiêu tài chính
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center lg:items-start gap-4 lg:gap-5 w-full">
          {/* Glow */}
          <div className="relative w-full max-w-[360px] lg:max-w-[400px]">
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
                  20h00, 16-17-18-19/03
                </span>
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-[0.72rem] sm:text-[0.8rem] lg:text-[0.85rem] text-[#5A3A1A] font-semibold bg-white/60 backdrop-blur-sm px-4 py-1.5 lg:py-2 rounded-full border border-white/70 shadow-sm transition hover:bg-white/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            Đã có <b className="text-[#8C0C12] mx-0.5">500+</b> người đăng ký tham gia
          </div>
        </div>

        {/* Countdown */}
        <div className="w-full flex justify-center lg:justify-start">
          <Countdown />
        </div>
      </div>

      {/* ── Right Column (Desktop Only Video) ── */}
      <div className="hidden lg:flex w-full lg:w-1/2 justify-center lg:justify-end items-center relative">
         <div className="w-full max-w-[580px] xl:max-w-[620px] relative z-20 transition-transform duration-500 hover:scale-[1.02]">
           <VideoPlayer />
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
