import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock, Sparkles } from "lucide-react";
import { useKhoiThongLandingConfig } from "../landingConfig";
import { trackCtaClick } from "../ctaTracking";
import { scrollToRegistrationForm } from "../scrollToRegistration";
import { HERO_TITLE_SRCSET, HERO_TITLE_SIZES, HERO_TITLE_WEBP, HERO_TITLE_WEBP_SRCSET, HERO_POSTER_WEBP, HERO_POSTER_WEBP_SRCSET, HERO_POSTER_SRCSET, HERO_POSTER_SIZES } from "../heroAssets";

const YOUTUBE_VIDEO_ID = "gPdub90aL9k";
const YOUTUBE_EMBED_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&playsinline=1`;
const MOBILE_BENEFITS = [
  "Nhận diện điểm nghẽn",
  "Điều chỉnh tư duy và cảm xúc",
  "Xây mục tiêu và kế hoạch",
];

/* ─── VideoPlayer ────────────────────────────────────────────── */
const VideoPlayer = ({ active }) => {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border border-[#C9961A]/70 bg-black shadow-[0_14px_36px_rgba(71,35,13,0.18)] select-none sm:rounded-[22px]"
    >
      <div className="relative aspect-video bg-black">
        {active && hasStarted ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={YOUTUBE_EMBED_URL}
            title="Bánh xe cuộc đời - Khơi Thông Dòng Tiền"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="group absolute inset-0 h-full w-full cursor-pointer overflow-hidden text-white"
            onClick={() => setHasStarted(true)}
            aria-label="Phát video Bánh xe cuộc đời"
          >
            <picture className="block h-full w-full">
            <source type="image/avif" srcSet={HERO_POSTER_SRCSET} sizes={HERO_POSTER_SIZES} />
            <img
              src={HERO_POSTER_WEBP}
              srcSet={HERO_POSTER_WEBP_SRCSET}
              sizes={HERO_POSTER_SIZES}
              alt="Xem video Bánh xe cuộc đời"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              width={1280}
              height={720}
            />
            </picture>
            <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/5" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[#A50F17]/95 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-4 ring-white/25 transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
                <span className="ml-1 text-2xl leading-none sm:text-3xl" aria-hidden="true">▶</span>
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};



/* ─── Countdown ─────────────────────────────────────────────── */
const Countdown = ({ eventStart }) => {
  const target = useMemo(() => {
    const value = new Date(eventStart).getTime();
    return Number.isFinite(value) ? value : 0;
  }, [eventStart]);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const initialUpdate = setTimeout(
      () => setLeft(Math.max(0, target - Date.now())),
      0,
    );
    const id = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => {
      clearTimeout(initialUpdate);
      clearInterval(id);
    };
  }, [target]);

  const s = Math.floor(left / 1000);
  const parts = [
    { label: "NGÀY", value: Math.floor(s / 86400) },
    { label: "GIỜ", value: Math.floor((s % 86400) / 3600) },
    { label: "PHÚT", value: Math.floor((s % 3600) / 60) },
    { label: "GIÂY", value: s % 60 },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full">
      {parts.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl sm:rounded-2xl border border-[#E2C78A]/70 bg-gradient-to-b from-white/95 to-[#FFF7E8] shadow-[0_2px_8px_rgba(83,48,18,0.06)]"
        >
          <span className="text-2xl sm:text-[1.8rem] font-black text-[#8C0C12] leading-none tracking-tight">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[8.5px] sm:text-[9.5px] font-extrabold text-[#8C6D3B] uppercase tracking-wider mt-1 sm:mt-1.5">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

/** Hai poster responsive có sẵn trong HTML; chỉ viewport đang hoạt động được mount iframe. */
function useViewportMinLg() {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setMatches(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return matches;
}

/* ─── CompactHero ────────────────────────────────────────────── */
const CompactHero = ({ content, landingConfig }) => {
  const rawSchedule = landingConfig?.ctaScheduleLabel || "11-12-13-14/09 · 20h00";
  const days = rawSchedule.replace(/\s*[-–·]\s*\d{1,2}(?:h|:)\d{2}.*$/i, "").trim() || "11-12-13-14/09";

  return (
    <section
      data-compact-hero
      className="relative w-full overflow-hidden font-sans"
      style={{
        background:
          "radial-gradient(ellipse at 50% 8%, rgba(255,235,170,0.42) 0%, transparent 60%), radial-gradient(ellipse at 88% 88%, rgba(255,245,220,0.65) 0%, transparent 60%), linear-gradient(180deg, #FFFDF8 0%, #FAF3E3 100%)",
      }}
    >
      {/* ── Background Decorative Elements ── */}
      {/* Arched inner frame */}
      <div className="pointer-events-none absolute hidden sm:block sm:inset-x-8 sm:top-12 sm:bottom-6 sm:rounded-[48px] border border-[#D4B572]/25" />

      {/* Right side concentric art-deco arcs */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full border border-[#D4B572]/15" />
      <div className="pointer-events-none absolute -top-8 -right-8 w-64 h-64 sm:w-[400px] sm:h-[400px] rounded-full border border-[#D4B572]/20" />
      <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 sm:w-[320px] sm:h-[320px] rounded-full border border-[#D4B572]/15" />

      {/* Left side botanical silhouette */}
      <svg
        className="pointer-events-none absolute hidden sm:block left-0 top-1/4 -translate-y-1/3 sm:w-56 h-auto text-[#A67512] opacity-15 filter blur-[0.6px]"
        viewBox="0 0 160 320"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M-20,40 Q40,80 70,120 Q50,70 10,40 Z M20,100 Q80,130 110,180 Q80,140 40,110 Z M-10,160 Q60,190 90,250 Q60,200 10,170 Z M30,220 Q90,250 120,310 Q80,270 40,230 Z" />
        <path d="M-10,30 Q20,120 50,220 Q70,280 90,340" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.4" />
      </svg>

      {/* ── Top bar: ribbon burgundy + gold ── */}
      <div className="relative w-full py-2.5 text-center z-10 overflow-hidden border-b border-[#F8E08A]/40 shadow-[0_2px_12px_rgba(26,10,6,0.3)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #140806 0%, #3a1410 25%, #6b2818 50%, #3a1410 75%, #140806 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "linear-gradient(180deg, rgba(248,224,138,0.25) 0%, transparent 60%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <div className="relative z-10 inline-flex items-center justify-center gap-2 text-[#FFEDB3] text-[11px] sm:text-[13px] font-black tracking-[0.12em] sm:tracking-[0.22em] uppercase">
          <span className="text-[#F8E08A] text-sm">✦</span>
          <span>4 BUỔI HỌC ONLINE MIỄN PHÍ</span>
          <span className="text-[#F8E08A] text-sm">✦</span>
        </div>
      </div>

      {/* ── Main Hero Content ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
        {/* Top Centered Header */}
        <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 max-w-4xl mx-auto">
          {/* Hook Question Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-2xl sm:rounded-full border border-[#D4B572]/60 bg-white/95 px-3 py-2.5 sm:px-4 sm:py-1.5 shadow-[0_2px_12px_rgba(83,48,18,0.06)]">
            <span className="hidden sm:flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8C0C12] text-[10px] font-black text-white shadow-xs">
              ?
            </span>
            <p className="text-[13px] sm:text-[0.88rem] font-semibold text-[#5A3A1A] leading-relaxed sm:leading-snug">
              <span>{content.question}</span>{" "}
              <strong className="block sm:inline font-extrabold text-[#7A2113]">
                {content.questionEmphasis}
              </strong>
            </p>
          </div>

          {/* Main Title */}
          <div className="w-full py-1 sm:px-2">
            <h1 className="font-black uppercase">
              <span
                className="loa-title-lead block text-[clamp(1.125rem,4.8vw,1.375rem)] sm:text-[2rem] lg:text-[2.2rem] xl:text-[2.45rem] font-bold uppercase tracking-normal font-sans"
                style={{
                  color: "#4E1E05",
                  lineHeight: 1.2,
                  paddingTop: "0.15em",
                }}
              >
                <span className="inline-block">ỨNG DỤNG</span>{" "}<span className="inline-block">LUẬT HẤP DẪN ĐỂ</span>
              </span>
              <span
                className="loa-title-main block mt-2 sm:mt-1 text-[clamp(2rem,8.6vw,2.4rem)] sm:text-[2.75rem] lg:text-[3.2rem] xl:text-[3.6rem] font-extrabold uppercase tracking-tight font-sans"
                style={{
                  lineHeight: 1.2,
                  paddingTop: "0.04em",
                  paddingBottom: "0.08em",
                  color: "#8C0C12",
                }}
              >
                <span className="inline-block">KHƠI THÔNG</span>{" "}<span className="inline-block">DÒNG TIỀN</span>
              </span>
            </h1>
          </div>

          {/* Divider Emblem */}
          <div className="hidden sm:flex items-center justify-center gap-2 my-1">
            <span className="h-px w-10 sm:w-14 bg-gradient-to-r from-transparent to-[#C9961A]/70" />
            <span className="text-[#C9961A] text-xs sm:text-sm">✦</span>
            <span className="h-px w-10 sm:w-14 bg-gradient-to-l from-transparent to-[#C9961A]/70" />
          </div>

          {/* Description */}
          <p className="loa-intro text-[14px] sm:text-[0.92rem] lg:text-[0.98rem] font-normal leading-[1.65] sm:leading-[1.7] text-[#5A3A1A] max-w-2xl px-1 sm:px-3">
            <span className="block [text-wrap:balance]">Tìm ra điều đang khiến bạn thực hành không ra kết quả và cung cấp bạn tấm bản đồ rõ ràng</span>
            <strong className="mt-1 block font-semibold text-[#7A130C] [text-wrap:balance]">
              – từ tư duy, cảm xúc đến <span className="loa-action inline-block">hành động thực tế tạo ra tiền.</span>
            </strong>
          </p>
        </div>

        {/* Media & Action Row: Video Player + Conversion Box */}
        <div className="mt-5 sm:mt-9 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8 items-center max-w-[1060px] mx-auto">
          {/* Video Player Card */}
          <div className="lg:col-span-7 flex items-center justify-center w-full order-1">
            <div className="relative w-full">
              <div className="pointer-events-none absolute -inset-2 bg-gradient-to-r from-[#D4931A]/15 to-[#8C0C12]/10 blur-2xl rounded-3xl -z-10" />
              <div className="w-full rounded-3xl border border-[#D4B572]/70 bg-white/90 p-1.5 sm:p-2.5 shadow-[0_16px_40px_rgba(83,48,18,0.10)] transition-transform duration-500 sm:hover:scale-[1.01]">
                <VideoPlayer active />
              </div>
            </div>
          </div>

          {/* Conversion / Action Card */}
          <div className="lg:col-span-5 flex items-center justify-center w-full order-2">
            <div className="w-full max-w-[460px] rounded-3xl sm:rounded-[26px] border border-[#D4B572]/50 bg-white p-3 min-[375px]:p-4 sm:p-6 shadow-[0_16px_40px_rgba(83,48,18,0.08)] flex flex-col gap-3 sm:gap-4">
              {/* Schedule Row */}
              <div className="order-1 grid grid-cols-2 gap-2 sm:gap-3 text-center">
                <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border border-[#D4B572]/50 bg-[#FFFBF2] sm:bg-white py-2.5 px-1.5 sm:px-3 text-xs sm:text-[13.5px] font-extrabold text-[#7A2113]">
                  <Calendar className="h-4 w-4 text-[#C97A1A] shrink-0" />
                  <span className="leading-snug">{days}</span>
                </div>
                <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border border-[#D4B572]/50 bg-[#FFFBF2] sm:bg-white py-2.5 px-1.5 sm:px-3 text-xs sm:text-[13.5px] font-extrabold text-[#7A2113]">
                  <Clock className="h-4 w-4 text-[#C97A1A] shrink-0" />
                  <span className="whitespace-nowrap">20:00 – 22:00</span>
                </div>
              </div>

              {/* Divider line with centered text */}
              <div className="order-3 sm:order-2 relative flex items-center justify-center my-1" aria-label="Đếm ngược đến ngày khai giảng">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D4B572]/35" />
                </div>
                <div className="relative bg-white px-3 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#8C6D3B]">
                  CHƯƠNG TRÌNH BẮT ĐẦU SAU:
                </div>
              </div>

              {/* Countdown 4 boxes */}
              <div className="order-4 sm:order-3"><Countdown eventStart={landingConfig.eventStart} /></div>

              {/* CTA Button */}
              <a
                href="#dang-ky"
                onClick={(event) => {
                  event.preventDefault();
                  trackCtaClick("BannerChinh");
                  scrollToRegistrationForm();
                }}
                className="order-2 sm:order-4 group relative flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-full py-3.5 sm:py-4 px-2 sm:px-6 font-black uppercase text-[13px] min-[375px]:text-sm sm:text-base tracking-normal sm:tracking-wider text-white transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A2113]"
                style={{
                  background: "linear-gradient(180deg, #BA141A 0%, #7A0A0E 100%)",
                  boxShadow: "0 10px 28px rgba(160, 16, 24, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                }}
              >
                <span className="absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-[200%]" />
                <span>ĐĂNG KÝ MIỄN PHÍ NGAY</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BannerChinh = ({ content, configPath } = {}) => {
  const isDesktop = useViewportMinLg();
  const landingConfig = useKhoiThongLandingConfig({ path: configPath });
  if (content?.compact) return <CompactHero content={content} landingConfig={landingConfig} />;
  return (
  <section
    className="relative w-full overflow-hidden font-sans"
    style={{ background: "radial-gradient(ellipse at 35% 30%, rgba(255,229,102,0.18), transparent 65%), radial-gradient(ellipse at 70% 75%, rgba(255,255,255,0.5), transparent 65%)" }}
  >
    <h1 className="sr-only">{content?.title || "Khơi Thông Dòng Tiền - 4 buổi học online miễn phí"}</h1>
    {/* (Đã loại bỏ ảnh chữ và nền dư thừa để dùng chung với global layout KhoiThongDongTien) */}

    {/* ── Top bar: ribbon burgundy + gold (không crop ảnh hero) ── */}
    <div className="relative w-full py-2.5 sm:py-3 text-center z-10 overflow-hidden border-b border-[#F8E08A]/40 shadow-[0_4px_28px_rgba(26,10,6,0.45)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #140806 0%, #3a1410 22%, #6b2818 50%, #3a1410 78%, #140806 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,224,138,0.2) 0%, rgba(201,150,26,0.06) 35%, transparent 55%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.92]"
        style={{
          background:
            "linear-gradient(100deg, transparent 5%, rgba(255,214,140,0.06) 42%, rgba(255,236,200,0.28) 50%, rgba(255,214,140,0.06) 58%, transparent 95%)",
        }}
      />
      <div className="pointer-events-none absolute top-0 left-[8%] right-[8%] h-px max-w-4xl mx-auto bg-gradient-to-r from-transparent via-[#F8E08A]/75 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 48px rgba(0,0,0,0.35)" }}
      />
      <span
        className="relative z-10 inline-block text-[#FFEDB3] text-xs sm:text-sm font-black tracking-[0.2em] sm:tracking-[0.22em] uppercase"
        style={{
          textShadow:
            "0 1px 2px rgba(0,0,0,0.9), 0 0 20px rgba(248,224,138,0.35), 0 0 1px rgba(255,255,255,0.4)",
        }}
      >
        4 BUỔI HỌC ONLINE MIỄN PHÍ
      </span>
    </div>

    {/* ── Body card ── */}
    <div className="relative z-10 max-w-[640px] lg:max-w-7xl mx-auto px-4 sm:px-6 pb-12 mt-4 sm:mt-8 space-y-6 sm:space-y-8 lg:space-y-0 lg:flex lg:flex-row lg:items-center lg:gap-12 lg:pb-16">

      {/* ── Left Column (Desktop) / Top Section (Mobile) ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center space-y-6 sm:space-y-8">

        {/* Title Image (now inside the column on desktop) */}
        <div className="w-full flex flex-col items-center justify-center">
          {content && <div className="mb-4 max-w-xl px-2 text-center">
            <p className="text-sm font-semibold leading-relaxed text-[#5A3A1A] sm:text-base">{content.question}<strong className="block text-[#7A2113]">{content.questionEmphasis}</strong></p>
            <p className="mt-5 text-lg font-black uppercase leading-snug text-[#7A2113] sm:text-2xl">Ứng dụng <span className="text-[#A67512]">Luật Hấp Dẫn</span> để</p>
          </div>}
          <picture className="block w-full">
          <source type="image/avif" srcSet={HERO_TITLE_SRCSET} sizes={HERO_TITLE_SIZES} />
          <img
            src={HERO_TITLE_WEBP}
            srcSet={HERO_TITLE_WEBP_SRCSET}
            sizes={HERO_TITLE_SIZES}
            alt="Khơi Thông Dòng Tiền"
            className="w-full max-w-[680px] sm:max-w-[820px] lg:max-w-full h-auto object-contain drop-shadow-lg"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            width={820}
            height={287}
            style={{ display: "block" }}
          />
          </picture>
        </div>

        <div className="relative max-w-[570px] px-2 text-center sm:px-3">
          <span className="mx-auto mb-2 block h-0.5 w-10 rounded-full bg-gradient-to-r from-transparent via-[#C9961A] to-transparent" />
          <p className="text-[0.85rem] font-semibold leading-[1.6] text-[#5A3A1A] min-[380px]:text-[0.9rem] sm:text-[1.05rem]">
            {content?.description || <><span className="block whitespace-nowrap">
              Nhận diện <strong className="font-black text-[#7A2113]">điểm nghẽn tài chính</strong>, <strong className="font-black text-[#7A2113]">điều chỉnh tư duy</strong>
            </span>
            <span className="block whitespace-nowrap">
              về tiền và xây dựng <strong className="font-black text-[#7A2113]">kế hoạch hành động</strong> rõ ràng.
            </span></>}
          </p>
        </div>

        {/* Poster mobile; iframe chỉ được tạo khi bấm và viewport mobile đang hoạt động. */}
          <div className="w-full rounded-[22px] border border-[#D4B572]/55 bg-white/70 p-2 shadow-[0_10px_32px_rgba(83,48,18,0.10)] backdrop-blur-sm sm:p-3 lg:hidden">
            <div className="flex items-center gap-3 px-2 pb-2.5 pt-1 sm:px-3 sm:pb-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C0C12] text-[0.72rem] text-white shadow-sm" aria-hidden="true">
                ▶
              </span>
              <div className="min-w-0 text-left">
                <span className="block text-[0.55rem] font-black uppercase tracking-[0.16em] text-[#B17B18]">
                  Video giới thiệu
                </span>
                <p className="mt-0.5 text-[0.7rem] font-bold leading-snug text-[#6F2B1C] sm:text-[0.82rem]">
                  Xem để biết chương trình có phù hợp với bạn không
                </p>
              </div>
            </div>
            <VideoPlayer active={!isDesktop} />
          </div>

        {/* CTA Section */}
        <div className="flex w-full flex-col items-center gap-3.5 lg:gap-4">
          {/* Glow */}
          <div className="relative w-full max-w-[360px] lg:max-w-[400px] mx-auto">
            <div className="absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity hover:opacity-70"
              style={{ background: "#C8282E" }} />
            <a
              href="#dang-ky"
              onClick={(e) => {
                e.preventDefault();
                trackCtaClick("BannerChinh");
                scrollToRegistrationForm();
              }}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-full px-3 py-4 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] lg:py-4.5"
              style={{
                background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
                boxShadow: "0 10px 30px rgba(160,20,28,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <span className="absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="whitespace-nowrap text-[0.88rem] font-black uppercase tracking-[0.025em] text-[#FFE566] drop-shadow sm:text-[1.03rem] sm:tracking-[0.04em] lg:text-[1.08rem]">
                ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC
              </span>
            </a>
          </div>

          <div className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#D4B572]/55 bg-white/80 text-center shadow-sm backdrop-blur-md">
            <div className="grid grid-cols-[0.82fr_1.45fr]">
              <div className="flex flex-col justify-center border-r border-[#D4B572]/35 px-3 py-2.5">
                <span className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-[#9A6A1A]">
                  Hình thức
                </span>
                <span className="mt-0.5 text-[0.72rem] font-extrabold text-[#7A2113] sm:text-[0.8rem]">
                  Học qua Zoom
                </span>
              </div>
              <div className="flex flex-col justify-center px-3 py-2.5">
                <span className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-[#9A6A1A]">
                  Thời gian
                </span>
                <span className="mt-0.5 text-[0.69rem] font-extrabold text-[#7A2113] sm:text-[0.78rem]">
                  {landingConfig.ctaScheduleLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-[#D4B572]/35 bg-[#FFF9EC]/75 px-4 py-2 text-[0.7rem] font-semibold text-[#5A3A1A] sm:text-[0.78rem]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
              </span>
              Hơn <b className="text-[#8C0C12]">500 học viên</b> đã đăng ký tham gia
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="w-full flex justify-center">
          <Countdown eventStart={landingConfig.eventStart} />
        </div>
      </div>

      {/* ── Right Column (Desktop Only Video) ── */}
      <div className="hidden lg:flex w-full lg:w-1/2 justify-center lg:justify-end items-center relative">
        <div className="w-full max-w-[580px] xl:max-w-[620px] relative z-20 flex flex-col gap-6 lg:gap-8">

          <div className="w-full rounded-[26px] border border-[#D4B572]/55 bg-white/70 p-3 shadow-[0_14px_40px_rgba(83,48,18,0.10)] backdrop-blur-sm transition-transform duration-500 hover:scale-[1.02]">
            <div className="flex items-center gap-3 px-3 pb-3 pt-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8C0C12] text-sm text-white shadow-sm" aria-hidden="true">
                ▶
              </span>
              <div className="text-left">
                <span className="block text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#B17B18]">
                  Video giới thiệu
                </span>
                <p className="mt-0.5 text-sm font-bold text-[#6F2B1C]">
                  Xem để biết chương trình có phù hợp với bạn không
                </p>
              </div>
            </div>
            <VideoPlayer active={isDesktop} />
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

    <div className="relative z-10 mx-auto -mt-5 grid max-w-[640px] grid-cols-3 gap-2 px-4 pb-12 lg:hidden">
      {MOBILE_BENEFITS.map((benefit) => (
        <div
          key={benefit}
          className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#D4B572]/60 bg-white/75 px-2 py-3 text-center shadow-sm backdrop-blur-sm"
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#C9961A] to-[#F8E08A] text-[0.7rem] font-black text-[#3A1A00]"
            aria-hidden="true"
          >
            ✓
          </span>
          <span className="text-[0.68rem] font-black leading-[1.3] text-[#7A2113] min-[380px]:text-[0.72rem]">
            {benefit}
          </span>
        </div>
      ))}
    </div>

    {/* Tailwind custom animations */}
    <style>{`
      @keyframes shine { 0%{transform:translateX(-150%) skewX(-20deg)}100%{transform:translateX(250%) skewX(-20deg)} }
    `}</style>
  </section>
  );
};

export default BannerChinh;
