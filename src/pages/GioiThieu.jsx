import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../components/SEO";
import {
  BookOpenCheck,
  Compass,
  HeartHandshake,
  Layers,
  Leaf,
  ShieldCheck,
  Sparkles,
  Target,
  Quote,
  Star,
  ArrowRight
} from "lucide-react";

// --- DỮ LIỆU CẬP NHẬT THEO YÊU CẦU ---

const missionPoints = [
  "Giúp mỗi người nhìn lại gốc rễ bên trong: niềm tin, cảm xúc, tư duy và thói quen đang chi phối cuộc sống hiện tại.",
  "Hướng dẫn cách làm việc với tiềm thức và nội tâm một cách tỉnh thức, thực tế và có hệ thống.",
  "Đồng hành cùng học viên trong quá trình chuyển hóa từ bên trong để tạo ra thay đổi bên ngoài, đặc biệt trong lĩnh vực tài chính, công việc và các mối quan hệ.",
  "Mali Edu tin rằng: Khi bên trong thay đổi đúng cách, kết quả bên ngoài sẽ tự nhiên thay đổi theo.",
];

const visionHighlights = [
  "Sự rõ ràng trong nhận thức",
  "Sự vững vàng trong nội tâm",
  "Sự bền vững trong tài chính và cuộc sống",
];

const coreValues = [
  {
    title: "Thực tế & ứng dụng",
    description: "Mọi nội dung đào tạo đều hướng tới khả năng áp dụng trong đời sống, công việc và tài chính.",
    Icon: Target,
  },
  {
    title: "Trung thực & tỉnh thức",
    description: "Không hứa hẹn viển vông, không dẫn dắt bằng nỗi sợ hay kỳ vọng ảo.",
    Icon: ShieldCheck,
  },
  {
    title: "Chuyển hóa từ gốc",
    description: "Tập trung xử lý nguyên nhân bên trong thay vì chỉ sửa bề mặt hành vi.",
    Icon: Layers,
  },
  {
    title: "Phát triển bền vững",
    description: "Hướng tới sự ổn định lâu dài, không chạy theo thành công ngắn hạn.",
    Icon: Leaf,
  },
];

const trainingFields = [
  {
    title: "Huấn luyện Tiềm Thức & Luật Hấp Dẫn ứng dụng",
    description: "Thực hành vận hành tiềm thức để kiến tạo kết quả cụ thể.",
    icon: Sparkles,
  },
  {
    title: "Chuyển hóa niềm tin – cảm xúc – nội tâm",
    description: "Quan sát, giải tỏa và tái lập những niềm tin và cảm xúc đang kìm hãm.",
    icon: Layers,
  },
  {
    title: "Năng lượng tiền & mục tiêu tài chính",
    description: "Tối ưu năng lượng, tư duy và thói quen để tiền bạc lưu thông bền vững.",
    icon: Target,
  },
  {
    title: "Phát triển bản thân cho cá nhân, người kinh doanh và chủ doanh nghiệp",
    description: "Xây dựng nội lực vững vàng cho người làm kinh doanh và lãnh đạo.",
    icon: Compass,
  },
];

const fourPillars = [
  {
    title: "Khám phá Tiềm Thức",
    description: "Đánh thức sức mạnh ngu quần để phục vụ mục tiêu của bạn.",
    Icon: Sparkles,
  },
  {
    title: "Luật Hấp Dẫn Ứng dụng",
    description: "Biến các quy luật vô hình thành kết quả hữ hình (tiền bạc, nhà cửa, sự nghiệp).",
    Icon: Target,
  },
  {
    title: "Phát triển Thịnh vượng",
    description: "Xây dựng tâm thế của người giàu có từ bên trong để thu hút vật chất bên ngoài.",
    Icon: Star,
  },
  {
    title: "Sống Cuộc Đời Tự Do Trọn Vẹn",
    description: "Kết hợp sự giàu có về vật chất với sự bình an trong tâm hồn để tận hưởng hạnh phúc trong từng khoảnh khắc.",
    Icon: HeartHandshake,
  },
];

const methodPillars = [
  {
    title: "Nhận thức đúng",
    description: "Hiểu rõ cơ chế vận hành của tiềm thức, cảm xúc và năng lượng.",
    Icon: BookOpenCheck,
  },
  {
    title: "Thực hành có hướng dẫn",
    description: "Thiền, quan sát nội tâm, bài tập chuyển hóa và ứng dụng đời sống.",
    Icon: Compass,
  },
  {
    title: "Hành động tỉnh thức",
    description: "Gắn nội tâm với hành động thực tế để tạo kết quả bền vững.",
    Icon: HeartHandshake,
  },
];

const commitments = [
  "Nội dung đào tạo rõ ràng, có hệ thống",
  "Đồng hành cùng học viên trong quá trình chuyển hóa",
  "Tôn trọng nhịp độ phát triển cá nhân của mỗi người",
  "Luôn đặt lợi ích lâu dài của học viên lên hàng đầu",
];

// --- COMPONENT CON ĐỂ TÁI SỬ DỤNG ---

const SectionHeading = ({ sub, title, align = "center", light = false }) => (
  <div className={`space-y-3 mb-10 ${align === "center" ? "text-center" : "text-left"}`}>
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${light ? "bg-white/20 text-white border border-white/30" : "bg-[#8B2E2E]/10 text-[#8B2E2E] border border-[#8B2E2E]/20"}`}>
      {sub}
    </span>
    <h2 className={`text-3xl md:text-4xl font-playfair font-bold ${light ? "text-white" : "text-gray-900"}`}>
      {title}
    </h2>
    <div className={`h-1 w-20 bg-[#D4AF37] mt-4 rounded-full ${align === "center" ? "mx-auto" : ""}`} />
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-[#e5e7eb] hover:border-[#D4AF37]/50 hover:shadow-[0_20px_40px_-10px_rgba(212,175,55,0.2)] transition-all duration-300 group ${className}`}>
    {children}
  </div>
);

// --- COMPONENT CHÍNH ---

const GioiThieu = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [hash]);

  return (
    <div className="bg-[#FAF9F6] text-gray-800 font-sans selection:bg-[#D4AF37] selection:text-white">
      <SEO 
        title="Giới thiệu về Mali Edu"
        description="Tìm hiểu về Mali Edu - Đơn vị đào tạo phát triển bản thân, chuyển hóa nội tâm và vận hành tiềm thức thực tế."
        url="/gioi-thieu"
      />

      {/* 1. HERO SECTION - Refined Artistic Style */}
      <section id="ve-mali-edu" className="relative pt-16 pb-8 lg:pt-32 lg:pb-16 overflow-hidden bg-secret-paper bg-paper-texture text-secret-ink">
        {/* Subtle decorative blurs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secret-gold/5 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 -ml-20 w-72 h-72 bg-secret-wax/5 rounded-full blur-3xl -z-0" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8">
              {/* Mobile Eyebrow */}
              <div className="lg:hidden inline-flex items-center gap-2 text-secret-wax font-bold tracking-widest text-xs uppercase mb-4">
                <span className="w-6 h-0.5 bg-secret-gold"></span>
                Giới thiệu Mali Edu
              </div>

              {/* Desktop Eyebrow */}
              <div className="hidden lg:inline-flex items-center gap-3 text-secret-wax font-bold tracking-widest text-sm uppercase">
                <span className="w-10 h-0.5 bg-secret-gold"></span>
                Giới thiệu Mali Edu
              </div>

              {/* Mobile Title Stack */}
              <h1 className="lg:hidden font-playfair font-bold text-secret-ink leading-tight mb-4">
                <span className="block text-3xl">Đào tạo chuyển hóa nội tâm</span>
                <span className="block text-4xl text-secret-wax mt-2">Vận hành tiềm thức</span>
              </h1>

              {/* Desktop Title */}
              <h1 className="hidden lg:block font-playfair font-bold text-secret-ink leading-snug">
                <span className="block whitespace-nowrap text-4xl sm:text-5xl lg:text-5xl">
                  Đào tạo chuyển hóa nội tâm
                </span>
                <span className="block whitespace-nowrap text-5xl sm:text-6xl lg:text-7xl text-secret-wax mt-4">
                  Vận hành tiềm thức
                </span>
              </h1>

              {/* Mobile Description */}
              <p className="lg:hidden text-base text-secret-ink/80 leading-relaxed mb-4">
                Mali Edu là đơn vị đào tạo và huấn luyện phát triển bản thân...
              </p>

              {/* Desktop Description */}
              <p className="hidden lg:block text-lg text-secret-ink/80 leading-relaxed max-w-2xl">
                Mali Edu là đơn vị đào tạo và huấn luyện phát triển bản thân, tập trung vào tiềm thức – nội tâm – năng lượng – tài chính, với định hướng giúp con người hiểu đúng – vận hành đúng – thay đổi bền vững từ gốc rễ.
              </p>

              {/* Mobile Quote */}
              <div className="lg:hidden border-l-2 border-secret-gold/50 pl-4 italic text-sm text-secret-ink/70 mb-6">
                "Chúng tôi không dạy lý thuyết suông..."
              </div>

              {/* Desktop Quote */}
              <div className="hidden lg:block border-l-2 border-secret-gold/50 pl-6 italic text-secret-ink/70">
                "Chúng tôi không dạy lý thuyết suông, không cổ vũ niềm tin mơ hồ, mà tập trung vào nhận thức đúng, thực hành đúng và tạo ra kết quả thật trong cuộc sống, công việc và tài chính."
              </div>
            </div>

            {/* Mobile Triết Lý Card */}
            <div className="lg:hidden bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-secret-dark/10">
              <h3 className="font-playfair text-lg font-bold text-secret-wax mb-3">Triết Lý Cốt Lõi</h3>
              <p className="text-sm text-secret-ink/80 mb-4 italic">"Khi thế giới bên trong..."</p>

              <div className="space-y-3">
                {['Hướng vào bên trong', 'Hành động tỉnh thức', 'Kết quả bền vững'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-secret-gold/10 flex items-center justify-center text-secret-gold font-bold text-sm">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-secret-ink">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content / Note Card - Desktop Only */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl shadow-secret-wax/10 border border-secret-dark/10">

                {/* Wax Seal */}
                <div className="absolute -top-7 -right-7 transform rotate-12">
                  <div className="w-24 h-24 bg-secret-wax rounded-full flex items-center justify-center text-white font-bold text-center text-xs p-2 shadow-lg ring-4 ring-white/50">
                    Kết quả<br />Thật
                  </div>
                </div>

                <h3 className="font-playfair text-2xl font-bold text-secret-wax mb-4">Triết Lý Cốt Lõi</h3>
                <p className="text-secret-ink/80 mb-6 italic">
                  "Khi thế giới bên trong thay đổi đúng cách, thế giới bên ngoài sẽ tự nhiên thay đổi theo."
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secret-gold/10 flex items-center justify-center text-secret-gold shadow-inner font-bold text-lg">1</div>
                    <div>
                      <p className="font-bold text-secret-ink">Hướng vào bên trong</p>
                      <p className="text-xs text-secret-ink/60">Gốc rễ của mọi vấn đề</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secret-gold/10 flex items-center justify-center text-secret-gold shadow-inner font-bold text-lg">2</div>
                    <div>
                      <p className="font-bold text-secret-ink">Hành động tỉnh thức</p>
                      <p className="text-xs text-secret-ink/60">Không lý thuyết suông</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secret-gold/10 flex items-center justify-center text-secret-gold shadow-inner font-bold text-lg">3</div>
                    <div>
                      <p className="font-bold text-secret-ink">Kết quả bền vững</p>
                      <p className="text-xs text-secret-ink/60">Tài chính & Mối quan hệ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SỨ MỆNH MALI EDU - The Secret Manuscript Style */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Parchment gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F0] via-[#F5EDE0] to-[#FAF7F0]" />
        {/* Subtle paper texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B4513' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header with Title & Quote */}
          <div className="text-center mb-12 lg:mb-16">
            {/* Wax Seal Badge */}
            <div className="inline-flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-secret-wax flex items-center justify-center shadow-lg shadow-secret-wax/30 ring-4 ring-white/50">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Main Title */}
            <h2 className="text-5xl lg:text-6xl font-black text-[#5D4037] tracking-wide mb-2">
              SỨ MỆNH
              <span className="text-secret-wax"> MALI</span>
              <span className="text-[#D4AF37]"> EDU</span>
            </h2>

            {/* Quote Box */}
            <div className="relative max-w-3xl mx-auto mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#D4AF37]/30">
                {/* Decorative quotes */}
                <div className="absolute -top-4 left-6 text-5xl text-[#D4AF37] font-serif">"</div>
                <div className="absolute -bottom-8 right-6 text-5xl text-[#D4AF37] font-serif">"</div>
                
                <p className="text-xl md:text-2xl italic text-[#5D4037] font-serif text-center leading-relaxed px-8">
                  Cái gì có trong đầu, sẽ có trên tay.
                </p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* Left: Mission Story */}
            <div className="space-y-6">
              <div className="space-y-6 text-[#6D4C41] leading-[1.8] text-lg max-w-xl">
                <p>
                  Sứ mệnh của Mali Edu là hiện thực hóa câu nói đó cho hàng triệu người Việt Nam thông qua việc làm chủ Luật Hấp Dẫn.
                </p>
                <p>
                  Chúng tôi tin rằng Luật Hấp Dẫn không phải là sự chờ đợi phép màu, mà là khoa học cứu sự tập trung và niềm tin. Mali Edu tập trung trang bị cho bạn tư duy đúng, công cụ đúng để Manifest (Kiến tạo) chính xác những gì bạn khao khát: Tự do tài chính, mối quan hệ hoàn hảo và sự bình an nội tại.
                </p>
              </div>
              
              {/* CTA */}
              <div className="pt-4">
                <a href="#" className="inline-flex items-center gap-2 text-secret-wax font-bold text-lg underline decoration-2 underline-offset-4 hover:text-[#D4AF37] transition-colors">
                  Mali Edu – Cùng bạn kiến tạo cuộc đời thịnh vượng từ sức mạnh tâm thức.
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Right: 4 Pillars Grid */}
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
              {fourPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="group bg-white rounded-3xl p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-[#D4AF37] hover:-translate-y-1 hover:scale-[1.02]"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#F5EDE0] flex items-center justify-center mb-4 group-hover:bg-secret-wax transition-colors duration-300">
                    <pillar.Icon className="w-6 h-6 text-[#8B4513] group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-bold text-lg text-[#5D4037] mb-2 leading-tight">
                    {pillar.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-[#8D6E63] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 3. GIÁ TRỊ CỐT LÕI */}
      <section className="py-10 lg:py-20 bg-[#F2EFE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading sub="Giá trị cốt lõi" title="Mali Edu vận hành dựa trên 4 giá trị" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map(({ title, description, Icon }, idx) => (
              <Card key={idx} className="text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 mx-auto bg-[#F9F5F0] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#8B2E2E] transition-colors duration-500">
                  <Icon className="w-8 h-8 text-[#8B2E2E] group-hover:text-[#D4AF37] transition-colors duration-500" />
                </div>
                <h4 className="text-lg font-bold font-playfair text-gray-900 mb-3">{title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CÂU CHUYỆN HÌNH THÀNH - Classic Paper Style */}
      <section id="cau-chuyen" className="py-10 lg:py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main container with paper texture background */}
          <div className="relative rounded-2xl p-8 md:p-16 text-secret-ink shadow-[0_20px_60px_-20px_rgba(139,46,46,0.15)] bg-secret-paper border border-secret-dark/5 bg-paper-texture">
            {/* Decorative subtle hue */}
            <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-secret-wax/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 relative z-10 items-center">
              {/* Left side: The Story */}
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-playfair font-bold text-secret-ink">
                  Câu Chuyện Hình Thành
                </h2>
                <div className="space-y-4 text-secret-ink/90 text-base md:text-lg leading-relaxed">
                  <p>
                    Mali Edu được hình thành từ chính những trải nghiệm thật về bế tắc tài chính, khủng hoảng nội tâm và quá trình tự chuyển hóa.
                  </p>
                  <p>
                    Thay vì tìm kiếm giải pháp bên ngoài một cách vội vàng, hành trình của Mali Edu bắt đầu từ việc quay vào bên trong, quan sát lại niềm tin, cảm xúc, thói quen và cách mỗi người đang vận hành cuộc sống của mình.
                  </p>
                  <p>
                    Từ đó, các phương pháp được hệ thống hóa, đơn giản hóa và chuyển thành các chương trình đào tạo, giúp học viên đi lại con đường chuyển hóa một cách rõ ràng, có lộ trình và an toàn.
                  </p>
                </div>
              </div>

              {/* Right side: The Quote Box */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-8 border border-secret-wax/20 flex flex-col justify-center items-center text-center shadow-lg border-l-4 border-l-secret-wax">
                <Quote className="w-12 h-12 text-secret-gold mb-6 opacity-80" />
                <p className="text-xl font-playfair italic leading-relaxed text-secret-ink">
                  "Hành trình vạn dặm bắt đầu từ một bước chân quay vào bên trong."
                </p>
                {/* Accent line with wax color */}
                <div className="mt-8 w-24 h-1 bg-secret-wax rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LĨNH VỰC ĐÀO TẠO */}
      <section className="py-10 lg:py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading sub="Lĩnh vực chuyên môn" title="Lĩnh Vực Đào Tạo Chính" />
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12 -mt-6">
            Các chương trình được thiết kế theo hướng dễ hiểu – dễ áp dụng – phù hợp với đời sống thực tế của người Việt.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {trainingFields.map((field, idx) => (
              <div key={idx} className="group flex items-start gap-6 bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-[#FAF9F6] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#8B2E2E] transition-colors duration-300">
                  <field.icon className="w-7 h-7 text-[#8B2E2E] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-xl font-bold font-playfair text-gray-900 mb-2 group-hover:text-[#8B2E2E] transition-colors">{field.title}</h4>
                  {/* Hiển thị description nếu có (từ code cũ), hoặc để trống nếu bạn muốn hoàn toàn y nguyên text input (input chỉ có tiêu đề) */}
                  {/* Ở đây tôi giữ description để layout không bị trống trải, nhưng nội dung description phù hợp với context */}
                  <p className="text-gray-600 leading-relaxed text-sm">{field.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PHƯƠNG PHÁP ĐÀO TẠO */}
      <section className="py-10 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#8B2E2E] font-bold tracking-widest uppercase text-xs mb-2 block">Phương pháp độc đáo</span>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-6">Ba Trụ Cột Chuyển Hóa</h2>
            <p className="text-gray-600">Chúng tôi tin rằng chuyển hóa thật sự không đến từ nghe nhiều, mà từ thực hành đúng và đủ.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {methodPillars.map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute inset-0 bg-[#F2EFE5] rounded-3xl transform rotate-3 transition-transform group-hover:rotate-6"></div>
                <div className="relative bg-white border border-[#e5e7eb] rounded-3xl p-8 h-full shadow-lg transition-transform group-hover:-translate-y-2">
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6 text-[#D4AF37]">
                    <item.Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold font-playfair mb-3">{item.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CAM KẾT GIÁ TRỊ - Brand Aligned */}
      <section className="py-10 lg:py-20 bg-secret-paper bg-paper-texture">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Quote className="w-12 h-12 text-secret-wax mx-auto mb-6 opacity-70" />
          <h2 className="text-3xl font-playfair font-bold mb-10 text-secret-wax">Mali Edu Cam Kết</h2>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {commitments.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 bg-white/50 backdrop-blur-sm p-5 rounded-xl border border-secret-wax/20 hover:border-secret-wax/40 transition-all duration-300 shadow-lg shadow-secret-wax/10 hover:shadow-xl hover:shadow-secret-wax/20"
              >
                <Star className="w-5 h-5 text-secret-gold flex-shrink-0 mt-1" />
                <p className="font-medium text-secret-ink">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <p className="text-secret-ink/70 text-sm mb-4">Bạn đã sẵn sàng cho hành trình thay đổi?</p>
            <button className="bg-secret-wax hover:bg-secret-gold text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-secret-wax/40 hover:shadow-secret-gold/30 transition-all duration-300 transform hover:-translate-y-1">
              Liên hệ tư vấn ngay
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default GioiThieu;
