import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackCtaClick } from "../ctaTracking";
import { scrollToRegistrationForm } from "../scrollToRegistration";

const LANDING_ASSET_BASE = "/assets/landing/khoi-thong-dong-tien";
const IMG_PORTRAIT = `${LANDING_ASSET_BASE}/founder-portrait.webp`;
const IMG_GIEO_GAT = `${LANDING_ASSET_BASE}/founder-gieo-gat.webp`;
const IMG_TANSO = `${LANDING_ASSET_BASE}/founder-tan-so.webp`;
const IMG_AM_THI = `${LANDING_ASSET_BASE}/founder-am-thi.webp`;
const IMG_DAY_HOC = `${LANDING_ASSET_BASE}/founder-day-hoc.webp`;

const STRUGGLES = [
  "Tôi là người tốt mà, tại sao cứ gặp toàn điều xui xẻo?",
  "Tôi đâu hại ai, sao mọi thứ cứ chống lại mình?",
  "Suốt nhiều tháng tôi sống trong tiêu cực, cố gắng kiếm tiền trả nợ, làm lại… mà mọi thứ vẫn cứ như vậy.",
];

const BARRIERS = [
  {
    title: "Tần số rung động quá thấp",
    img: IMG_TANSO,
    number: "01",
    text: "Tôi luôn lo lắng, sợ hãi, thiếu thốn và nó khiến tôi thu hút nợ nần, rắc rối, bế tắc. Năng lượng quyết định 90% kết quả.",
  },
  {
    title: "Niềm tin tài chính sai lệch",
    img: IMG_AM_THI,
    number: "02",
    text: "Những ám thị cũ: Muốn có tiền phải cực khổ, mình không đủ giỏi. Khi chuyển hóa chúng, tiền mới đến nhẹ nhàng.",
  },
  {
    title: "Hiểu sai về Nhân Quả",
    img: IMG_DAY_HOC,
    number: "03",
    text: "Mỗi ý nghĩ đều là hạt giống gieo vào Tiềm Thức. Vận may thay đổi khi tôi tỉnh thức và gieo mầm năng lượng thịnh vượng.",
  },
];

function CTA() {
  return (
    <a
      href="#dang-ky"
      onClick={(event) => {
        event.preventDefault();
        trackCtaClick("CauChuyenNguoiSangLap");
        scrollToRegistrationForm();
      }}
      className="group inline-flex w-full max-w-[420px] items-center justify-center gap-2 rounded-full px-4 py-4 text-[0.7rem] font-black uppercase tracking-[0.025em] text-[#FFE566] transition hover:-translate-y-0.5 active:scale-[0.98] min-[380px]:text-[0.78rem] sm:text-sm"
      style={{
        background: "linear-gradient(180deg, #ED3B41 0%, #A30D13 100%)",
        boxShadow: "0 14px 32px rgba(156,12,18,0.42), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC
      <ArrowRight className="h-4 w-4 flex-none transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
    </a>
  );
}

const CauChuyenNguoiSangLap = ({ content } = {}) => {
  if (content?.standalone) {
    const startingPoint = content.startingPoint || [];
    const struggles = content.struggles || [];
    const energyTraps = content.energyTraps || [];
    return (
      <section
        className="relative overflow-hidden rounded-2xl sm:rounded-[32px] px-3.5 py-7 sm:px-8 sm:py-12 shadow-[0_16px_44px_rgba(83,48,18,0.06)]"
        style={{
          background: "linear-gradient(180deg, #FFFDF9 0%, #FAF3E3 50%, #F5E9D0 100%)",
          border: "1px solid rgba(212, 181, 114, 0.65)",
        }}
      >
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-20 -left-20 sm:-top-24 sm:-left-24 h-60 w-60 sm:h-72 sm:w-72 rounded-full bg-[#E8C87A]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 sm:-bottom-24 sm:-right-24 h-60 w-60 sm:h-72 sm:w-72 rounded-full bg-[#BA141A]/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl space-y-5 sm:space-y-6">
          {/* ── Section Header ── */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B572]/70 bg-white/95 px-3.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-[#7A2113] shadow-xs mb-2.5 sm:mb-3.5">
              <span className="text-[#C9961A]">✦</span>
              <span>{content.badge || "CÂU CHUYỆN THẬT"}</span>
              <span className="text-[#C9961A]">✦</span>
            </div>

            <h2 className="font-sans font-black uppercase tracking-tight text-center">
              {content.headingLead && (
                <span className="block text-[14px] min-[390px]:text-[15.5px] sm:text-2xl text-[#4A1E08] leading-snug">
                  {content.headingLead}
                </span>
              )}
              {content.headingBreak && (
                <span className="block mt-1 sm:mt-1.5 text-[17px] min-[390px]:text-[19px] sm:text-3xl lg:text-[2.2rem] text-[#8C0C12] leading-tight tracking-tight">
                  <span className="block sm:inline">{content.headingBreak[0]}</span>{" "}
                  <span className="block sm:inline sm:ml-2">{content.headingBreak[1]}</span>
                </span>
              )}
            </h2>

            {/* Divider */}
            <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
              <span className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-[#C9961A]" />
              <span className="text-[#C9961A] text-xs">✦</span>
              <span className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-[#C9961A]" />
            </div>
          </div>

          {/* ── CARD 1: Xuất phát điểm & Portrait (2 cols on md+) ── */}
          <article className="overflow-hidden rounded-2xl border border-[#D4B572]/65 bg-white/95 shadow-[0_8px_24px_rgba(83,48,18,0.06)] md:grid md:grid-cols-[0.85fr_1.15fr]">
            <div className="relative aspect-[339/392] md:aspect-auto md:min-h-[360px] bg-[#FAF3E3] overflow-hidden">
              <img
                src={IMG_PORTRAIT}
                alt="Mong Coaching - Tôi năm 2016"
                className="h-full w-full object-cover object-top"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-12 pb-4 px-4 sm:px-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFE58A]/60 bg-black/60 px-4 py-1.5 text-sm sm:text-base font-black uppercase tracking-wide text-[#FFE58A] backdrop-blur-md shadow-md">
                  <span>{content.photoTag || "Tôi năm 2016"}</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-white/90 drop-shadow-xs">
                  Mong Coaching
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-7 lg:p-8 flex flex-col justify-center space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7A2113] text-white text-xs font-black">01</span>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-[#9A6610]">Xuất phát điểm</span>
              </div>

              <div className="space-y-2 sm:space-y-2.5 text-[13.5px] sm:text-[15px] leading-relaxed text-[#4A2610] font-medium">
                {startingPoint.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          </article>

          {/* ── 2 COLS CONTRAST: Bế tắc (Trách móc) vs Thức tỉnh (Thay đổi) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* CARD 2: Giai đoạn bế tắc */}
            <article
              className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D7A83A]/70 p-4 sm:p-6 text-white shadow-[0_12px_32px_rgba(92,21,13,0.18)]"
              style={{ background: "linear-gradient(145deg, #7E1E14 0%, #54110C 100%)" }}
            >
              <span className="pointer-events-none absolute -right-2 -top-8 font-serif text-[7rem] sm:text-[8rem] leading-none text-white/[0.06]">“</span>

              <div>
                <div className="relative mb-3.5 sm:mb-4 flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#FFE388]/30 bg-white/10 text-xs font-black text-[#FFE388]">02</span>
                  <div>
                    <span className="block text-[9.5px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-[#F1CD69]">Giai đoạn bế tắc</span>
                    <h3 className="text-[14.5px] sm:text-lg font-black uppercase leading-tight text-white">
                      Tôi từng trách móc cuộc đời
                    </h3>
                  </div>
                </div>

                <div className="relative space-y-2 sm:space-y-2.5">
                  {struggles.map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-white/10 bg-white/[0.08] p-3 sm:p-3.5 backdrop-blur-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F0CB64]/20 text-[#FFE388] text-xs font-black">
                        {idx + 1}
                      </span>
                      <p className="text-[13px] sm:text-sm leading-snug text-white/90 italic">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* CARD 3: Bước ngoặt thay đổi */}
            <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4B572]/65 bg-white/95 p-4 sm:p-6 shadow-[0_8px_24px_rgba(83,48,18,0.06)]">
              <div>
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C9961A] text-white text-xs font-black">03</span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-[#9A6610]">Bước ngoặt thức tỉnh</span>
                </div>

                <h3 className="text-[17px] sm:text-lg font-black uppercase leading-tight text-[#7A2113]">
                  Rồi mọi thứ bắt đầu thay đổi
                </h3>
                <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-sm leading-relaxed text-[#4A2610] font-medium mb-3">
                  {content.awakeningLead}
                </p>

                {/* 3 Sai lầm năng lượng */}
                <div className="space-y-2 sm:space-y-2.5">
                  {energyTraps.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-[#EEDFB9]/75 bg-[#FAF4E5]/80 p-2.5 sm:p-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7A2113] text-white text-xs font-black">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-[13px] sm:text-sm font-black text-[#4A1E08] leading-snug">
                          {item.title}
                        </h4>
                        <p className="mt-0.5 text-[12px] sm:text-xs text-[#6A4A2A] leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          {/* ── CARD 4: Sứ mệnh & Kêu gọi (Lộ trình 3 bước) ── */}
          <article
            className="relative overflow-hidden rounded-2xl border border-[#D6A73A]/70 p-5 sm:p-8 text-center text-white shadow-[0_14px_38px_rgba(89,20,12,0.22)]"
            style={{ background: "linear-gradient(145deg, #7A2113 0%, #4A0E09 100%)" }}
          >
            <span className="pointer-events-none absolute -right-3 -top-10 font-serif text-[8rem] sm:text-[10rem] leading-none text-white/[0.04]">“</span>

            <div className="max-w-2xl mx-auto">
              <p className="text-[13px] sm:text-base leading-relaxed text-white/90">
                {content.transformation}
              </p>

              <div className="my-4 sm:my-5 rounded-xl border border-[#FFE388]/25 bg-white/[0.08] p-4 sm:p-6 backdrop-blur-xs">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-[#F1CD69]">
                  {content.missionBadge || "TÔI MUỐN CHIA SẺ LẠI VỚI BẠN"}
                </span>
                <h3 className="mt-1.5 text-[18px] min-[390px]:text-[20px] sm:text-3xl font-black uppercase leading-tight text-white tracking-tight">
                  {content.missionTitle}
                </h3>
                <p className="mt-2 text-[12px] sm:text-sm leading-relaxed text-white/80">
                  {content.missionDesc}
                </p>
              </div>

              <p className="mb-4 sm:mb-5 text-[12.5px] sm:text-sm font-bold italic text-[#FFE7A0]">
                {content.quote}
              </p>

              <div className="flex flex-col items-center gap-2">
                <CTA />
                <span className="text-[10.5px] sm:text-xs text-white/60">
                  Học online qua Zoom • Chỉ cần họ tên và số điện thoại
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
  <section
    className="relative overflow-hidden rounded-3xl py-12 sm:py-16"
    style={{
      background: "linear-gradient(145deg, #FFF9EC 0%, #F8EDCF 52%, #F1DFB7 100%)",
      border: "1px solid #D4B572",
      boxShadow: "0 20px 50px rgba(122,33,19,0.06)",
    }}
  >
    <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#C9961A]/10 blur-[100px]" />
    <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#7A2113]/10 blur-[110px]" />

    <div className="relative mx-auto max-w-3xl space-y-7 px-5 sm:space-y-10 sm:px-10 lg:max-w-6xl">
      {/* 01 — Starting point */}
      <article className="overflow-hidden rounded-[1.8rem] border border-[#D4B572]/65 bg-white/80 shadow-[0_18px_42px_rgba(91,49,14,0.1)] backdrop-blur-sm md:grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[500px]">
          <img
            src={IMG_PORTRAIT}
            alt="Mong Coaching"
            className="h-full w-full object-cover object-[center_28%]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3E0D09]/90 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.24em] text-[#FFE388]">Người truyền cảm hứng</span>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.03em] sm:text-4xl">Mong Coaching</h2>
          </div>
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A2113] text-[0.65rem] font-black text-[#FFE388]">01</span>
            <span className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#9A6610]">Xuất phát điểm</span>
          </div>
          <p className="text-[0.86rem] font-medium leading-[1.75] text-[#5C3A1A] sm:text-base">
            Hơn chục năm trước, tôi đam mê đầu tư, muốn giàu nhanh và bị lừa mất hết. Tiền tích lũy tiêu tan, còn vướng nợ, bị đuổi việc và thất nghiệp.
          </p>
          <blockquote className="mt-5 rounded-2xl border-l-4 border-[#7A2113] bg-[#7A2113]/[0.055] px-4 py-4 text-[0.82rem] font-bold italic leading-[1.65] text-[#7A2113] sm:text-[0.95rem]">
            “Mọi thứ bắt đầu thay đổi khi tôi hiểu đúng về Luật Hấp Dẫn và Nhân Quả.”
          </blockquote>
        </div>
      </article>

      {/* Emotional low point */}
      <article
        className="relative overflow-hidden rounded-[1.8rem] border border-[#D7A83A]/60 px-5 py-6 text-white sm:px-8 sm:py-8"
        style={{
          background: "linear-gradient(145deg, #852217 0%, #58120D 100%)",
          boxShadow: "0 18px 44px rgba(92,21,13,0.2)",
        }}
      >
        <span className="pointer-events-none absolute -right-2 -top-10 font-serif text-[9rem] leading-none text-white/[0.055]">“</span>
        <div className="relative mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FFE388]/30 bg-white/10 text-[0.65rem] font-black text-[#FFE388]">02</span>
          <div>
            <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-[#F1CD69]">Giai đoạn bế tắc</span>
            <h3 className="mt-1 text-[1.05rem] font-black uppercase leading-tight sm:text-xl">Tôi từng trách móc cuộc đời</h3>
          </div>
        </div>

        <div className="relative space-y-2.5">
          {STRUGGLES.map((text, index) => (
            <div key={text} className="grid grid-cols-[24px_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0CB64]/15 text-[0.62rem] font-black text-[#FFE388]">
                {index + 1}
              </span>
              <p className="text-[0.78rem] italic leading-[1.6] text-white/80 sm:text-sm">{text}</p>
            </div>
          ))}
        </div>
      </article>

      {/* 03 — Turning point */}
      <article className="overflow-hidden rounded-[1.8rem] border border-[#D4B572]/60 bg-white/75 shadow-[0_16px_38px_rgba(91,49,14,0.08)] md:grid md:grid-cols-2 md:items-center">
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C9961A] text-[0.65rem] font-black text-white">03</span>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-[#9A6610]">Bước ngoặt thay đổi</span>
          </div>
          <h3 className="text-[1.45rem] font-black uppercase leading-[1.18] tracking-[-0.035em] text-[#7A2113] sm:text-3xl">
            Rồi mọi thứ<br />bắt đầu thay đổi
          </h3>
          <p className="mt-4 text-[0.85rem] leading-[1.75] text-[#5C3A1A] sm:text-base">
            Khi tôi thực sự hiểu đúng về <strong className="text-[#3A2208]">Luật Hấp Dẫn</strong> và <strong className="text-[#3A2208]">Luật Nhân Quả</strong>.
          </p>
        </div>
        <div className="relative m-4 mt-0 overflow-hidden rounded-2xl border border-white shadow-xl md:m-5 md:ml-0">
          <img src={IMG_GIEO_GAT} alt="Nguyên tắc gieo gặt" className="aspect-video w-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-right">
            <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
              Quy luật vận hành
            </span>
          </div>
        </div>
      </article>

      {/* Barriers */}
      <div>
        <div className="mb-6 text-center sm:mb-8">
          <span className="inline-flex rounded-full border border-[#C9961A]/45 bg-white/60 px-4 py-1.5 text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#9A6610]">
            Điều tôi nhận ra
          </span>
          <h3 className="mx-auto mt-3 max-w-xl text-[1.35rem] font-black uppercase leading-[1.2] tracking-[-0.03em] text-[#5B2412] sm:text-3xl">
            3 rào cản khiến cuộc đời luôn gặp khủng hoảng
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {BARRIERS.map(({ title, img, text, number }) => (
            <article key={title} className="group overflow-hidden rounded-[1.6rem] border border-[#D4B572]/45 bg-white/90 shadow-[0_12px_32px_rgba(91,49,14,0.08)] transition hover:-translate-y-1.5 hover:shadow-xl">
              <div className="relative aspect-video overflow-hidden">
                <img src={img} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#7A2113] text-[0.68rem] font-black text-[#FFE388] shadow-lg">
                  {number}
                </span>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h4 className="text-[0.98rem] font-black leading-snug text-[#7A2113] sm:text-lg">{title}</h4>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#C9961A]" strokeWidth={2.2} />
                </div>
                <p className="text-[0.78rem] leading-[1.65] text-[#5C3A1A] sm:text-sm">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Closing transformation card */}
      <article
        className="relative overflow-hidden rounded-[1.9rem] border border-[#D6A73A]/65 px-5 py-7 text-center text-white sm:px-9 sm:py-10"
        style={{
          background: "linear-gradient(145deg, #7A2113 0%, #4A0E09 100%)",
          boxShadow: "0 20px 48px rgba(89,20,12,0.24)",
        }}
      >
        <span className="pointer-events-none absolute -right-4 -top-12 font-serif text-[10rem] leading-none text-white/[0.045]">“</span>
        <div className="relative mx-auto max-w-2xl">
          <p className="text-[0.76rem] leading-[1.7] text-white/70 sm:text-sm">
            Từ một người <strong className="text-[#FFE388]">trắng tay</strong>, hôm nay tôi đã có một cuộc sống mới: tài chính vững vàng, năng lượng tích cực và một sứ mệnh trọn vẹn.
          </p>

          <div className="my-5 rounded-2xl border border-[#FFE388]/20 bg-white/[0.07] px-4 py-5 backdrop-blur-sm sm:px-7">
            <span className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#F1CD69]">Tôi muốn chia sẻ lại với bạn</span>
            <h4 className="mt-2 text-[1.35rem] font-black uppercase leading-[1.12] tracking-[-0.03em] text-white sm:text-3xl">
              Lộ trình 3 bước
              <span className="mt-1 block text-[#FFE065]">Khơi thông dòng tiền</span>
            </h4>
            <p className="mx-auto mt-3 max-w-lg text-[0.74rem] leading-[1.65] text-white/70 sm:text-sm">
              Để bạn sớm tìm thấy sự thịnh vượng mà không cần phải mất cả chục năm bế tắc như tôi đã từng.
            </p>
          </div>

          <p className="mb-5 text-[0.76rem] font-bold italic leading-relaxed text-[#FFE7A0] sm:text-sm">
            “Bạn hoàn toàn có thể thay đổi – ngay khi bạn chọn bắt đầu hôm nay.”
          </p>

          <div className="flex flex-col items-center gap-2.5">
            <CTA />
            <span className="text-[0.68rem] font-medium text-white/60">Học online qua Zoom • Nhận hướng dẫn tham gia</span>
          </div>
        </div>
      </article>
    </div>
  </section>
  );
};

export default CauChuyenNguoiSangLap;
