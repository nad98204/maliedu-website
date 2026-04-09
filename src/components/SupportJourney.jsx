const supportCards = [
  {
    id: "coaching",
    keyword: "LẮNG NGHE SÂU",
    title: "Coaching 1:1 Cá Nhân Hóa",
    description:
      "Bạn được lắng nghe, nhìn thẳng vào vấn đề cốt lõi và nhận sự dẫn dắt phù hợp với hoàn cảnh, mục tiêu và giai đoạn phát triển của chính mình.",
    accent: "#3a7a4e",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.5 18.5a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.5 2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M15 20c2.5 0 4.5-1.9 4.5-4.2S17.5 11.5 15 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8.2 13.3h6.6M10.5 10.6l-2.3 2.7 2.3 2.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "roadmap",
    keyword: "TỪ RÕ → ĐẾN LÀM",
    title: "Xây Dựng Mục Tiêu & Lộ Trình Rõ Ràng",
    description:
      "Không mơ hồ, không áp khuôn. Mỗi mục tiêu đều được cụ thể hóa và chuyển thành lộ trình hành động phù hợp với năng lực thực tế.",
    accent: "#c9a227",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 6h14M5 12h10M5 18h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M18 11l2 1.5-2 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "relationships",
    keyword: "KẾT NỐI TỈNH THỨC",
    title: "Phát Triển Quan Hệ & Giao Tiếp Tỉnh Thức",
    description:
      "Cải thiện chất lượng các mối quan hệ trong gia đình, công việc và cộng đồng thông qua tư duy đúng và kỹ năng giao tiếp hiệu quả.",
    accent: "#b14a3a",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20s-6.5-4.2-8.2-8c-1.1-2.6.4-5.8 3.4-6.3 1.7-.3 3.3.4 4.2 1.8.9-1.4 2.5-2.1 4.2-1.8 3 .5 4.5 3.7 3.4 6.3-1.7 3.8-8.2 8-8.2 8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    id: "resilience",
    keyword: "KHÔNG PHỤ THUỘC CẢM XÚC",
    title: "Củng Cố Nội Lực & Động Lực Bền Vững",
    description:
      "Giúp bạn duy trì sự tự tin, năng lượng tích cực và khả năng hành động lâu dài, không phụ thuộc vào cảm xúc nhất thời.",
    accent: "#6b0f1a",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4l6 3v4c0 4.2-2.6 7.9-6 9-3.4-1.1-6-4.8-6-9V7l6-3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M9.2 12.2l2 2.2 3.6-4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const SupportJourney = () => {
  return (
    <section className="bg-[#F9F1D8] py-20 lg:py-24">
      <div className="max-w-[1160px] mx-auto px-5">
        <div className="text-center mb-8">
          <h2 className="font-['Playfair_Display'] text-[clamp(2.5rem,8vw,3.5rem)] md:text-[clamp(2.25rem,4.5vw,3.25rem)] font-bold text-[#1a1a1a] tracking-tight leading-[1.1] md:leading-tight mb-3 drop-shadow-[1px_2px_0_rgba(160,116,50,0.15)]">
            {/* Mobile: 2 lines */}
            <span className="md:hidden">Bạn Không Phải<br />Tự Đi Một Mình</span>
            {/* Desktop: 1 line */}
            <span className="hidden md:inline">Bạn Không Phải Tự Đi Một Mình</span>
          </h2>
          <p className="font-['Inter'] text-xs md:text-sm font-semibold tracking-[0.15em] md:tracking-[0.2em] text-[#8B2E2E] uppercase mb-4">
            {/* Mobile: 2 lines */}
            <span className="md:hidden">Mali Đồng Hành – Hỗ Trợ<br />Dẫn Dắt Đến Khi Bạn Tự Vững</span>
            {/* Desktop: 1 line */}
            <span className="hidden md:inline">Mali Đồng Hành – Hỗ Trợ – Dẫn Dắt Đến Khi Bạn Tự Vững</span>
          </p>
          
          <div className="flex items-center justify-center w-full max-w-[160px] mx-auto mb-5 relative">
            <div className="h-px flex-1 bg-[#D4AF37]/60" />
            <div className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45 mx-3" />
            <div className="h-px flex-1 bg-[#D4AF37]/60" />
          </div>

          <p className="font-['Playfair_Display'] italic text-sm text-[#8B2E2E] mb-3 whitespace-nowrap">
            Mỗi người có một hành trình riêng.
          </p>
          <p className="font-['Inter'] mx-auto text-sm md:text-[0.85rem] leading-[1.85] text-[#1a1a1a] mb-6 md:whitespace-nowrap">
            Mali EDU đồng hành bằng sự thấu hiểu và công cụ đã kiểm chứng, giúp bạn tháo gỡ giới hạn, xây nội lực vững vàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6 lg:gap-6 pt-4">
          {supportCards.map((card, index) => (
            <article
              key={card.id}
              className="relative bg-[#F9F1D8] border border-[#D4AF37] rounded-none p-6 md:p-8 flex flex-col items-center text-center gap-4 md:gap-6 transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-[5px] shadow-[0_10px_30px_-10px_rgba(92,64,51,0.15),inset_0_0_0_1px_rgba(255,255,255,0.4)] hover:shadow-[0_20px_40px_-12px_rgba(92,64,51,0.25),inset_0_0_0_1px_rgba(255,255,255,0.6)]"
            >
              {/* Flying Number - Position adjusted for mobile */}
              <span className="absolute -top-3 -left-2 md:-top-[30px] md:-left-[10px] font-['Playfair_Display'] italic text-5xl md:text-[3.5rem] font-bold text-[#D4AF37] leading-none z-10 drop-shadow-[3px_3px_0px_#F9F1D8]">
                {String(index + 1).padStart(2, '0')}
              </span>
              
              {/* Corner Ornaments - Hidden on mobile, show on md+ */}
              <span className="hidden md:block absolute top-2 left-2 w-5 h-5 border-[3px] border-double border-[#D4AF37]/60 rounded-tl-xl border-r-0 border-b-0" aria-hidden="true" />
              <span className="hidden md:block absolute top-2 right-2 w-5 h-5 border-[3px] border-double border-[#D4AF37]/60 rounded-tr-xl border-l-0 border-b-0" aria-hidden="true" />
              <span className="hidden md:block absolute bottom-2 left-2 w-5 h-5 border-[3px] border-double border-[#D4AF37]/60 rounded-bl-xl border-r-0 border-t-0" aria-hidden="true" />
              <span className="hidden md:block absolute bottom-2 right-2 w-5 h-5 border-[3px] border-double border-[#D4AF37]/60 rounded-br-xl border-l-0 border-t-0" aria-hidden="true" />

              {/* Wax Seal Icon */}
              <div 
                className="w-14 h-14 md:w-[72px] md:h-[72px] bg-[#8B2E2E] text-[#F9F1D8] flex items-center justify-center rounded-[52%_48%_55%_45%/45%_55%_48%_52%] shadow-[inset_2px_2px_6px_rgba(255,255,255,0.2),inset_-2px_-2px_6px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2)] border-2 border-white/10 -rotate-6 transition-transform duration-300 hover:rotate-0 hover:scale-105"
                style={{ transform: 'rotate(-5deg)' }}
              >
                <div className="w-6 h-6 md:w-8 md:h-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {card.icon}
                </div>
              </div>
              
              {/* Card Content */}
              <div className="flex flex-col gap-2 md:gap-4">
                <h3 className="font-['Playfair_Display'] text-sm md:text-xl font-bold text-[#8B2E2E] uppercase tracking-wide leading-tight whitespace-nowrap md:whitespace-normal">
                  {card.title}
                </h3>
                <p className="font-['Inter'] text-sm md:text-[0.925rem] text-[#1a1a1a]/90 leading-relaxed max-w-[280px] mx-auto md:max-w-none md:mx-0">
                  {card.description}
                </p>
              </div>

              {/* Secret Mark - Hidden on mobile */}
              <div className="hidden md:block mt-auto pt-5 text-[#1a1a1a]/5 w-10 h-10" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-11v6h2v-6h-2z" />
                </svg>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a 
            href="#contact" 
            className="inline-flex items-center gap-2 font-['Inter'] font-semibold text-[#8B2E2E] no-underline tracking-wide border-b border-[#8B2E2E]/30 pb-0.5 transition-all duration-200 hover:text-[#1a1a1a] hover:border-[#1a1a1a] group"
          >
            Xem lộ trình phù hợp với tôi
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SupportJourney;
