import { ArrowRight, Brain, Coins, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const PROGRAMS = [
  {
    title: "Luật Hấp Dẫn",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682596/LU%E1%BA%ACT_H%E1%BA%A4P_D%E1%BA%AAN_dnrvn0.jpg",
    summary:
      "Tiếp cận Luật Hấp Dẫn như một hệ thống làm việc với tiềm thức, cảm xúc và niềm tin gốc rễ để thay đổi cuộc sống từ bên trong.",
    bullets: [
      "Nhận diện niềm tin vô thức đang chi phối lựa chọn & hành vi",
      "Làm chủ cảm xúc, thoát vòng lặp lo âu – sợ hãi – trì hoãn",
      "Kết nối bản thân, sống chủ động và tỉnh thức mỗi ngày",
      "Xây nền tảng nội tâm vững chắc cho tiền bạc, quan hệ, sự nghiệp",
    ],
    link: "/dao-tao/luat-hap-dan",
    ctaLine1: "TÌM HIỂU CHƯƠNG TRÌNH",
    ctaLine2: "LUẬT HẤP DẪN",
    icon: Brain,
    colorTheme: {
      border: "border-[#f59e0b]/30 group-hover:border-[#f59e0b]/80", // Amber
      iconGradient: "from-[#fcd34d] via-[#f59e0b] to-[#b45309]",
      iconColor: "text-[#451a03]",
      bullet: "text-[#fbbf24]",
      button: "border-[#f59e0b]/50 text-[#fef3c7] hover:bg-[#f59e0b]/10 hover:border-[#f59e0b] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      title: "text-[#fcd34d]",
      cardBg: "bg-gradient-to-br from-[#f59e0b]/15 to-[#f59e0b]/5"
    }
  },
  {
    title: "Khơi Thông Dòng Tiền",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682614/Kh%C6%A1i_Th%C3%B4ng_D%C3%B2ng_Ti%E1%BB%81n_M%C3%A0u_Xanh_sjajsx.jpg",
    summary:
      "Chữa lành mối quan hệ với tài chính, gỡ niềm tin giới hạn và mở rộng dòng chảy thu nhập bền vững.",
    bullets: [
      "Nhận diện vết thương tài chính từ gia đình & quá khứ",
      "Gỡ bỏ niềm tin giới hạn: “tiền khó kiếm”, “tôi không xứng đáng”",
      "Tái lập mối quan hệ lành mạnh với tiền",
      "Giữ – hút – phát triển tiền bằng nội tâm và hành động thực tế",
    ],
    link: "/dao-tao/khoi-thong-dong-tien",
    ctaLine1: "TÌM HIỂU CHƯƠNG TRÌNH",
    ctaLine2: "KHƠI THÔNG DÒNG TIỀN",
    icon: Coins,
    colorTheme: {
      border: "border-[#10b981]/30 group-hover:border-[#10b981]/80", // Emerald
      iconGradient: "from-[#6ee7b7] via-[#10b981] to-[#047857]",
      iconColor: "text-[#022c22]",
      bullet: "text-[#34d399]",
      button: "border-[#10b981]/50 text-[#ecfdf5] hover:bg-[#10b981]/10 hover:border-[#10b981] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      title: "text-[#6ee7b7]",
      cardBg: "bg-gradient-to-br from-[#10b981]/15 to-[#10b981]/5"
    },
    featured: true, // Keeping this if strictly needed, but styling is now theme-based
  },
  {
    title: "Vút Tốc Mục Tiêu",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682425/V%C3%BAt_T%E1%BB%91c_M%E1%BB%A5c_Ti%C3%AAu_2024_b%E1%BA%A3n_2_d6mhn3.jpg",
    summary:
      "Kết nối mục tiêu với tiềm thức và hành động thực tế để tăng tốc kết quả trong công việc & cuộc sống.",
    bullets: [
      "Xác định mục tiêu rõ ràng, đúng bản chất và năng lực",
      "Loại bỏ xung đột nội tâm gây trì hoãn hoặc tự sabotaged",
      "Kết nối mục tiêu với cảm xúc – động lực – hành động",
      "Đi nhanh – đi đúng – đi bền cho công việc & cuộc sống",
    ],
    link: "/dao-tao/vut-toc-muc-tieu",
    ctaLine1: "TÌM HIỂU CHƯƠNG TRÌNH",
    ctaLine2: "VÚT TỐC MỤC TIÊU",
    icon: Rocket,
    colorTheme: {
      border: "border-[#ef4444]/30 group-hover:border-[#ef4444]/80", // Red
      iconGradient: "from-[#fca5a5] via-[#ef4444] to-[#b91c1c]",
      iconColor: "text-[#450a0a]",
      bullet: "text-[#f87171]",
      button: "border-[#ef4444]/50 text-[#fef2f2] hover:bg-[#ef4444]/10 hover:border-[#ef4444] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
      title: "text-[#fca5a5]",
      cardBg: "bg-gradient-to-br from-[#ef4444]/15 to-[#ef4444]/5"
    }
  },
];

const ProgramsSection = () => {
  return (
    <section className="pillars relative overflow-hidden py-10 lg:py-24">
      <style>{`
        .pillars__backdrop {
          background:
            radial-gradient(circle at 15% 20%, rgba(243,167,18,0.18), transparent 35%),
            radial-gradient(circle at 80% 0%, rgba(139,46,46,0.16), transparent 42%),
            linear-gradient(135deg, #100d0f 0%, #1d1511 40%, #0f0c0b 100%);
        }
        .pillars__noise {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0);
          background-size: 24px 24px;
          mix-blend-mode: soft-light;
          opacity: 0.18;
        }
        /* Base Card Styles - Border color handled by Tailwind classes now */
        .pillars__card {
          box-shadow: 0 26px 70px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(16px);
        }
        .pillars__card:hover {
          box-shadow: 0 30px 90px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .pillars__media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.35) 100%);
          pointer-events: none;
        }
        /* Button Base Styles - Border/Color handled by Tailwind */
        .pillars__btn {
          box-shadow: 0 12px 28px rgba(0,0,0,0.25);
        }
        @media (prefers-reduced-motion: reduce) {
          .pillars__card,
          .pillars__media img,
          .pillars__btn {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="absolute inset-0 pillars__backdrop" />
      <div className="absolute inset-0 pillars__noise" />
      <div className="relative max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f3c272]">
            HỆ THỐNG GIÁO DỤC TOÀN DIỆN
          </span>
          <h2 className="mt-3 text-2xl lg:text-4xl font-extrabold leading-tight text-[#f6eee5] uppercase tracking-wide">
            CHƯƠNG TRÌNH <span className="block md:inline bg-clip-text text-transparent bg-gradient-to-r from-[#f8c77d] via-[#f3a712] to-[#e17f3e]">ĐÀO TẠO MALI EDU</span>
          </h2>
          <p className="mt-4 text-[#e9dfd4] text-sm sm:text-base leading-relaxed max-w-[60ch] mx-auto">
            Nhận thức nội tâm, chữa lành tài chính và tăng tốc hành động — chọn chương trình phù hợp nhất với điểm nghẽn hiện tại của bạn.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {PROGRAMS.map(({ title, summary, bullets, ctaLine1, ctaLine2, link, icon: Icon, image, colorTheme }) => (
            <article
              key={title}
              className={`pillars__card group relative overflow-hidden rounded-[22px] p-6 flex flex-col gap-4 transition duration-300 ease-out motion-reduce:transition-none hover:-translate-y-1.5 border ${colorTheme.border} ${colorTheme.cardBg}`}
            >
              <div className="pillars__media relative overflow-hidden rounded-[18px]">
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  className="h-44 w-full object-cover transition duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${colorTheme.iconGradient} ${colorTheme.iconColor} shadow-[0_12px_30px_rgba(0,0,0,0.25)] border border-white/10`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className={`text-xl font-bold ${colorTheme.title}`}>{title}</h3>
              </div>

              <p className="text-sm text-[#e7ddcf] leading-relaxed">{summary}</p>

              <ul className="space-y-2.5 text-sm text-[#d9cfc3] leading-relaxed">
                {bullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className={`${colorTheme.bullet} mt-[2px]`}>✦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  to={link}
                  className={`pillars__btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-center transition duration-200 ease-out border ${colorTheme.button}`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-light uppercase tracking-widest opacity-90">{ctaLine1}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.14em]">{ctaLine2}</span>
                  </div>
                  <ArrowRight size={16} className="ml-2 transition duration-200 ease-out group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
