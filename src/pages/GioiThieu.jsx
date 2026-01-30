import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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
    description: "Quan sát, giải tỏa và tái lập những niềm tin và cảm xúc đang kìm hãm.", // Mượn mô tả cũ cho khớp layout hoặc để trống nếu muốn thuần text
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

      {/* 1. HERO SECTION - Refined Artistic Style */}
      <section id="ve-mali-edu" className="relative pt-24 pb-6 lg:pt-32 lg:pb-16 overflow-hidden bg-secret-paper bg-paper-texture text-secret-ink">
        {/* Subtle decorative blurs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secret-gold/5 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 -ml-20 w-72 h-72 bg-secret-wax/5 rounded-full blur-3xl -z-0" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-3 text-secret-wax font-bold tracking-widest text-sm uppercase">
                <span className="w-10 h-0.5 bg-secret-gold"></span>
                Giới thiệu Mali Edu
              </div>

              <h1 className="font-playfair font-bold text-secret-ink leading-snug">
                <span className="block whitespace-nowrap text-4xl sm:text-5xl lg:text-5xl">
                  Đào tạo chuyển hóa nội tâm
                </span>
                <span className="block whitespace-nowrap text-5xl sm:text-6xl lg:text-7xl text-secret-wax mt-4">
                  Vận hành tiềm thức
                </span>
              </h1>

              <p className="text-lg text-secret-ink/80 leading-relaxed max-w-2xl">
                Mali Edu là đơn vị đào tạo và huấn luyện phát triển bản thân, tập trung vào tiềm thức – nội tâm – năng lượng – tài chính, với định hướng giúp con người hiểu đúng – vận hành đúng – thay đổi bền vững từ gốc rễ.
              </p>

              <div className="border-l-2 border-secret-gold/50 pl-6 italic text-secret-ink/70">
                "Chúng tôi không dạy lý thuyết suông, không cổ vũ niềm tin mơ hồ, mà tập trung vào nhận thức đúng, thực hành đúng và tạo ra kết quả thật trong cuộc sống, công việc và tài chính."
              </div>
            </div>

            {/* Right Content / Note Card */}
            <div className="lg:col-span-5 relative">
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
              {/* Decorative dots removed for a cleaner, more artistic look */}
            </div>

          </div>
        </div>
      </section>

      {/* 2. SỨ MỆNH & TẦM NHÌN */}
      <section className="pt-6 pb-10 lg:pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Sứ mệnh */}
            <div className="relative">
              <SectionHeading sub="Sứ mệnh" title="Sứ Mệnh Của Mali Edu" align="left" />
              <div className="space-y-6">
                {missionPoints.map((point, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="mt-1 w-8 h-8 rounded-full bg-[#F2EFE5] flex items-center justify-center group-hover:bg-[#8B2E2E] transition-colors duration-300 flex-shrink-0">
                      <Star className="w-4 h-4 text-[#8B2E2E] group-hover:text-white transition-colors" />
                    </div>
                    <p className="flex-1 text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tầm nhìn */}
            <div className="relative bg-[#2C1810] rounded-3xl p-10 text-white overflow-hidden">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-2 bg-[#D4AF37] rounded-lg text-white">
                    <Target className="w-6 h-6" />
                  </span>
                  <span className="text-sm font-bold tracking-widest uppercase text-[#D4AF37]">Tầm nhìn</span>
                </div>

                <h3 className="text-2xl font-playfair font-bold mb-6 text-[#F1D7A6]">
                  Hệ sinh thái đào tạo phát triển nội tâm và tiềm thức uy tín tại Việt Nam
                </h3>

                <p className="text-white/80 mb-6 leading-relaxed">
                  Chúng tôi lựa chọn phát triển <span className="text-[#D4AF37] font-semibold">chậm mà chắc</span>, lấy giá trị thật và kết quả thật của học viên làm nền tảng cho thương hiệu.
                </p>

                <div className="grid gap-3">
                  {visionHighlights.map((item, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full"></div>
                      <p className="text-sm font-medium text-white/90">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
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
