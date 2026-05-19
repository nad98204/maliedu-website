import { ArrowRight, ChevronRight, Brain, Compass, Heart, TrendingUp, Leaf, CheckCircle, Users, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";

const ecosystemCards = [
  {
    number: "01",
    title: "Tiềm thức",
    description: "Hiểu cơ chế vận hành bên trong để thay đổi từ gốc.",
    icon: Brain,
    colorTheme: "green",
  },
  {
    number: "02",
    title: "Chữa lành",
    description: "Chuyển hóa tổn thương, niềm tin cũ và kết nối lại với chính mình.",
    icon: Heart,
    colorTheme: "terracotta",
  },
  {
    number: "03",
    title: "Tài chính",
    description: "Xây dựng tư duy tiền bạc và dòng chảy thịnh vượng bền vững.",
    icon: TrendingUp,
    colorTheme: "green",
  },
  {
    number: "04",
    title: "Coaching thực chiến",
    description: "Đồng hành ứng dụng rõ ràng, có lộ trình và hành động cụ thể.",
    icon: Compass,
    colorTheme: "terracotta",
  },
];

const themeStyles = {
  green: {
    text: "text-[#123F33]",
    iconMobile: "w-16 h-16 text-[#C99A45] border-[#C99A45]/20 bg-[#FAF7F1]",
    iconDesktop: "sm:w-14 sm:h-14 sm:text-[#0F4A3A] sm:border-[#0F4A3A]/10 sm:bg-white",
    borderBottom: "border-b-4 border-b-[#0F4A3A]",
    badgeBg: "bg-[#0F4A3A]",
    hoverBorder: "hover:border-[#0F4A3A]/30",
  },
  terracotta: {
    text: "text-[#9E2F26]",
    iconMobile: "w-16 h-16 text-[#C99A45] border-[#C99A45]/20 bg-[#FAF7F1]",
    iconDesktop: "sm:w-14 sm:h-14 sm:text-[#9E2F26] sm:border-[#9E2F26]/10 sm:bg-white",
    borderBottom: "border-b-4 border-b-[#9E2F26]",
    badgeBg: "bg-[#9E2F26]",
    hoverBorder: "hover:border-[#9E2F26]/30",
  },
};

const bottomFeatures = [
  {
    icon: CheckCircle,
    text: "Lộ trình rõ ràng",
    color: "green",
  },
  {
    icon: Users,
    text: "Đồng hành 1:1 & cộng đồng",
    color: "terracotta",
  },
  {
    icon: BookOpen,
    text: "Ứng dụng thực tế",
    color: "green",
  },
  {
    icon: Award,
    text: "Kết quả bền vững",
    color: "terracotta",
  },
];

const MaliEcosystemSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#FAF7F1] py-14 lg:py-24">
      {/* Decorative background grids/lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0F4A3A]/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#0F4A3A]/10 to-transparent" />

      {/* Decorative mobile circle (off-screen top-right) */}
      <div className="absolute right-0 top-0 w-[360px] h-[360px] rounded-full border border-dashed border-[#C99A45]/20 -translate-y-12 translate-x-24 pointer-events-none lg:hidden">
        <div className="absolute bottom-[24%] left-[12%] w-1.5 h-1.5 rounded-full bg-[#C99A45]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        
        {/* Header Layout */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-8">
          <div className="max-w-2xl text-left">
            {/* Tag / Label */}
            <div className="inline-flex items-center gap-1.5 lg:gap-1.5 bg-[#FAF7F1] border border-[#C99A45]/25 lg:border-[#9E2F26]/20 px-4 lg:px-3.5 py-1.5 rounded-full text-xs font-bold text-[#9E2F26] tracking-wider uppercase mb-5 lg:mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C99A45] lg:hidden" />
              <Leaf className="w-3.5 h-3.5 text-[#9E2F26] hidden lg:block" strokeWidth={2} />
              HỆ SINH THÁI ĐÀO TẠO
            </div>
            
            {/* Headline */}
            <h2 className="font-serif text-[38px] xs:text-[42px] sm:text-[46px] lg:text-5xl font-black text-[#111827] lg:text-[#123F33] leading-[1.1] lg:leading-tight mb-4">
              Hệ sinh thái <span className="text-[#0F4A3A] lg:text-inherit block lg:inline">Mali EDU</span>
            </h2>
            
            {/* Description */}
            <p className="text-[#4B5563] text-[15px] sm:text-base md:text-lg leading-relaxed mb-6 max-w-xl">
              4 mảng đào tạo trọng tâm đồng hành cùng hành trình phát triển bên trong, chữa lành và xây dựng tư duy thịnh vượng bền vững.
            </p>

            {/* CTA Button */}
            <div>
              <Link
                to="/gioi-thieu"
                className="inline-flex items-center justify-center gap-2 bg-[#9E2F26] hover:bg-[#8B2E2E] text-white px-6 py-3.5 rounded-[14px] font-semibold text-sm transition-all duration-300 shadow-md active:scale-95 lg:bg-[#123F33] lg:hover:bg-[#0F4A3A] lg:pl-6 lg:pr-4 lg:py-3 lg:rounded-full lg:border lg:border-[#D6A84F]/30 lg:shadow-lg lg:shadow-[#123F33]/15 lg:hover:shadow-xl lg:hover:shadow-[#123F33]/20 lg:font-medium lg:tracking-wide group"
              >
                Tìm hiểu thêm
                {/* Mobile Arrow */}
                <ArrowRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5 lg:hidden" />
                {/* Desktop Arrow badge */}
                <span className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/10 group-hover:bg-white/20 transition-colors">
                  <ArrowRight className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-[#D6A84F] group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* Decorative Circle Graphic on Right (Desktop Only) */}
          <div className="relative w-[300px] h-[300px] hidden lg:flex items-center justify-center flex-shrink-0 select-none">
            {/* Outer dashed circle */}
            <div 
              className="absolute w-[260px] h-[260px] rounded-full border border-dashed border-[#C99A45]/30"
              style={{ animation: "spin 120s linear infinite" }}
            />
            
            {/* Inner dotted circle */}
            <div className="absolute w-[200px] h-[200px] rounded-full border border-dotted border-[#0F4A3A]/20" />
            
            {/* Center circle with Lotus */}
            <div className="absolute w-24 h-24 rounded-full border border-[#C99A45]/30 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-center z-10">
              <svg viewBox="0 0 64 64" className="w-14 h-14 text-[#C99A45]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M32 16 C35 25, 35 38, 32 48 C29 38, 29 25, 32 16 Z" />
                <path d="M32 24 C24 28, 22 38, 32 48 C26 44, 26 34, 32 24 Z" />
                <path d="M32 24 C40 28, 42 38, 32 48 C38 44, 38 34, 32 24 Z" />
                <path d="M32 30 C16 32, 14 42, 32 48 C18 45, 20 38, 32 30 Z" />
                <path d="M32 30 C48 32, 50 42, 32 48 C46 45, 44 38, 32 30 Z" />
                <path d="M22 48 C27 52, 37 52, 42 48" />
              </svg>
            </div>

            {/* Interactive Nodes on outer circle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-[#9E2F26]/20 bg-white shadow-sm flex items-center justify-center z-20">
              <Heart className="w-4.5 h-4.5 text-[#9E2F26]" strokeWidth={1.5} />
            </div>
            
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-[#0F4A3A]/20 bg-white shadow-sm flex items-center justify-center z-20">
              <TrendingUp className="w-4.5 h-4.5 text-[#0F4A3A]" strokeWidth={1.5} />
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-9 h-9 rounded-full border border-[#9E2F26]/20 bg-white shadow-sm flex items-center justify-center z-20">
              <Compass className="w-4.5 h-4.5 text-[#9E2F26]" strokeWidth={1.5} />
            </div>

            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-[#0F4A3A]/20 bg-white shadow-sm flex items-center justify-center z-20">
              <Brain className="w-4.5 h-4.5 text-[#0F4A3A]" strokeWidth={1.5} />
            </div>

            {/* Accent Gold dots on outer circle */}
            <div className="absolute top-[14%] right-[14%] w-1.5 h-1.5 rounded-full bg-[#C99A45]/80" />
            <div className="absolute bottom-[14%] right-[14%] w-1.5 h-1.5 rounded-full bg-[#C99A45]/80" />
            <div className="absolute bottom-[14%] left-[14%] w-1.5 h-1.5 rounded-full bg-[#C99A45]/80" />
            <div className="absolute top-[14%] left-[14%] w-1.5 h-1.5 rounded-full bg-[#C99A45]/80" />
          </div>
        </div>

        {/* Cards Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 mt-12 lg:mt-16 relative">
          {ecosystemCards.map((card, index) => {
            const Icon = card.icon;
            const styles = themeStyles[card.colorTheme];

            return (
              <div 
                key={index} 
                className={`relative bg-white rounded-[24px] sm:rounded-[32px] border border-[#0F4A3A]/10 ${styles.borderBottom} ${styles.hoverBorder} p-5 sm:px-6 sm:pt-12 sm:pb-14 flex flex-row sm:flex-col items-center sm:items-center gap-5 sm:gap-0 text-left sm:text-center transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(15,74,58,0.06)] sm:hover:shadow-[0_12px_30px_rgba(15,74,58,0.06)] group`}
              >
                {/* Card Icon */}
                <div className={`rounded-full border ${styles.iconMobile} ${styles.iconDesktop} flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105`}>
                  <Icon className="w-7 h-7 sm:w-6 sm:h-6 text-inherit" strokeWidth={1.5} />
                </div>

                {/* Card Info */}
                <div className="flex-grow sm:w-full">
                  {/* Card Title */}
                  <h3 className={`text-lg sm:text-[22px] font-bold font-sans sm:font-serif tracking-wide text-[#123F33] ${card.colorTheme === "green" ? "sm:text-[#123F33]" : "sm:text-[#9E2F26]"} sm:mb-3`}>
                    {card.title}
                  </h3>

                  {/* Desktop/Tablet Divider — o — */}
                  <div className="hidden sm:flex items-center justify-center gap-2 my-4">
                    <span className="w-5 h-[1px] bg-[#C99A45]/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C99A45]" />
                    <span className="w-5 h-[1px] bg-[#C99A45]/40" />
                  </div>

                  {/* Card Description */}
                  <p className="text-[#4B5563] text-sm leading-relaxed max-w-[240px] sm:max-w-[220px] sm:mx-auto font-sans">
                    {card.description}
                  </p>
                </div>

                {/* Desktop/Tablet Number Badge */}
                <div className={`hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 ${styles.badgeBg} text-white font-serif font-black text-xs px-4 py-1 rounded-full shadow-md tracking-wider border-2 border-white`}>
                  {card.number}
                </div>

                {/* Mobile Right indicators (Number + Arrow) */}
                <div className="flex flex-col items-end justify-between sm:hidden flex-shrink-0 self-stretch min-h-[76px]">
                  <span className="text-[32px] font-serif font-black text-[#C99A45]/35 leading-none">
                    {card.number}
                  </span>
                  <div className="w-7 h-7 rounded-full border border-[#9E2F26]/30 flex items-center justify-center bg-transparent mt-auto">
                    <ChevronRight className="w-4 h-4 text-[#9E2F26]" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Desktop Dotted Connector between cards */}
                {index < 3 && (
                  <div className="hidden lg:flex items-center absolute top-1/2 -right-[15px] lg:-right-[17px] -translate-y-1/2 w-[30px] lg:w-[34px] z-10 pointer-events-none">
                    <div className="w-full border-t border-dashed border-[#C99A45]/40" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FAF7F1] border border-[#C99A45]/30 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-[#C99A45]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quote Card Block */}
        <div className="sm:hidden mt-12 bg-[#F8F3EA]/60 border border-[#C99A45]/15 rounded-[24px] p-6 text-center max-w-3xl mx-auto shadow-sm">
          <span className="font-serif text-3xl text-[#9E2F26] leading-none block mb-1">“</span>
          <p className="text-[#123F33] text-sm md:text-base font-semibold leading-relaxed max-w-xl mx-auto font-sans">
            Mali EDU tin rằng khi bạn thay đổi bên trong,<br className="hidden sm:block" /> bạn sẽ kiến tạo cuộc sống bên ngoài.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 select-none">
            <span className="w-10 h-[1px] bg-[#C99A45]/30" />
            <svg viewBox="0 0 64 64" className="w-5 h-5 text-[#C99A45]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M32 16 C35 25, 35 38, 32 48 C29 38, 29 25, 32 16 Z" />
              <path d="M32 24 C24 28, 22 38, 32 48 C26 44, 26 34, 32 24 Z" />
              <path d="M32 24 C40 28, 42 38, 32 48 C38 44, 38 34, 32 24 Z" />
              <path d="M32 30 C16 32, 14 42, 32 48 C18 45, 20 38, 32 30 Z" />
              <path d="M32 30 C48 32, 50 42, 32 48 C46 45, 44 38, 32 30 Z" />
              <path d="M22 48 C27 52, 37 52, 42 48" />
            </svg>
            <span className="w-10 h-[1px] bg-[#C99A45]/30" />
          </div>
        </div>

        {/* Bottom Features Row */}
        <div className="hidden lg:block mt-24 max-w-5xl mx-auto">
          <div className="bg-[#F8F3EA]/50 border border-[#0F4A3A]/8 rounded-[24px] p-1.5 md:p-2 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-0 lg:divide-x divide-[#0F4A3A]/10">
              {bottomFeatures.map((feat, index) => {
                const Icon = feat.icon;
                const colorClass = feat.color === "green" ? "text-[#0F4A3A]" : "text-[#9E2F26]";
                return (
                  <div key={index} className="flex items-center justify-center gap-3 py-3 px-4 text-center">
                    <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0`} strokeWidth={1.8} />
                    <span className="text-[#123F33] text-sm md:text-[15px] font-semibold tracking-wide font-sans">
                      {feat.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MaliEcosystemSection;
