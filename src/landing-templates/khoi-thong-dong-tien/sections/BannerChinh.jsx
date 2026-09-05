import { useEffect, useMemo, useState } from "react";
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

/* ─── BannerChinh ────────────────────────────────────────────── */
const BannerChinh = () => {
  const isDesktop = useViewportMinLg();
  const landingConfig = useKhoiThongLandingConfig();
  return (
  <section
    className="relative w-full overflow-hidden font-sans"
    style={{ background: "radial-gradient(ellipse at 35% 30%, rgba(255,229,102,0.18), transparent 65%), radial-gradient(ellipse at 70% 75%, rgba(255,255,255,0.5), transparent 65%)" }}
  >
    <h1 className="sr-only">Khơi Thông Dòng Tiền - 4 buổi học online miễn phí</h1>
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
        <div className="w-full flex justify-center">
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
            <span className="block whitespace-nowrap">
              Nhận diện <strong className="font-black text-[#7A2113]">điểm nghẽn tài chính</strong>, <strong className="font-black text-[#7A2113]">điều chỉnh tư duy</strong>
            </span>
            <span className="block whitespace-nowrap">
              về tiền và xây dựng <strong className="font-black text-[#7A2113]">kế hoạch hành động</strong> rõ ràng.
            </span>
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
