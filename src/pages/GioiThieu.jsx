import { useEffect } from "react";
import { useLocation, Link } from "react-router";
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
  ArrowRight,
  Sun,
  Key,
  CheckCircle2,
} from "lucide-react";
import "./GioiThieu.css";

const coreValues = [
  {
    title: "Thực tế & Ứng dụng",
    description: "Mọi nội dung đào tạo đều hướng tới khả năng áp dụng thật trong đời sống, công việc và tài chính.",
    Icon: Target,
    roman: "I",
  },
  {
    title: "Trung thực & Tỉnh thức",
    description: "Không hứa hẹn viển vông, không dẫn dắt bằng nỗi sợ hay kỳ vọng ảo. Nhìn thẳng vào sự thật để chuyển hóa.",
    Icon: ShieldCheck,
    roman: "II",
  },
  {
    title: "Chuyển hóa từ gốc rễ",
    description: "Tập trung giải phóng nguyên nhân và niềm tin giới hạn bên trong thay vì chỉ sửa bề mặt hành vi.",
    Icon: Layers,
    roman: "III",
  },
  {
    title: "Phát triển bền vững",
    description: "Hướng tới sự thịnh vượng và an lạc dài lâu, xây dựng nội lực vững vàng không chạy theo kết quả chớp nhoáng.",
    Icon: Leaf,
    roman: "IV",
  },
];

const trainingFields = [
  {
    title: "Huấn luyện Tiềm Thức & Luật Hấp Dẫn",
    description: "Hiểu đúng và vận hành các quy luật vũ trụ vào đời sống thực tế để kiến tạo kết quả cụ thể.",
    icon: Sparkles,
  },
  {
    title: "Chuyển hóa Niềm Tin & Cảm Xúc",
    description: "Quan sát, giải tỏa những tổn thương cũ và tái lập hệ thống niềm tin đủ đầy từ tâm thức.",
    icon: Layers,
  },
  {
    title: "Năng Lượng Tiền & Mục Tiêu Tài Chính",
    description: "Tối ưu hóa năng lượng, hàn gắn mối quan hệ với tiền để dòng tiền lưu thông tự nhiên và bền vững.",
    icon: Target,
  },
  {
    title: "Đồng Hành Cùng Doanh Nhân & Lãnh Đạo",
    description: "Xây dựng nội lực kiên định, bản lĩnh vững vàng và tư duy kinh doanh từ tâm phụng sự.",
    icon: Compass,
  },
];

const fourPillars = [
  {
    title: "Khám phá Tiềm Thức",
    description: "Đánh thức nguồn sức mạnh vô tận đang ngủ quên bên trong để phụng sự cho mục tiêu cuộc đời.",
    Icon: Sparkles,
    roman: "01",
  },
  {
    title: "Luật Hấp Dẫn Ứng Dụng",
    description: "Biến các quy luật tự nhiên vô hình thành kết quả hữu hình: tài chính, sự nghiệp và bình an.",
    Icon: Target,
    roman: "02",
  },
  {
    title: "Phát Triển Thịnh Vượng",
    description: "Xây dựng tâm thế giàu có từ bên trong để tự nhiên thu hút vật chất và quý nhân bên ngoài.",
    Icon: Star,
    roman: "03",
  },
  {
    title: "Tự Do & An Lạc Trọn Vẹn",
    description: "Kết hợp sự đủ đầy về vật chất với sự an lạc trong tâm hồn để tận hưởng từng khoảnh khắc cuộc sống.",
    Icon: HeartHandshake,
    roman: "04",
  },
];

const methodPillars = [
  {
    title: "Nhận thức đúng",
    description: "Thấu hiểu cơ chế vận hành của tiềm thức, năng lượng và cảm xúc theo góc nhìn khoa học và thực chứng.",
    Icon: BookOpenCheck,
    sub: "The Awareness",
  },
  {
    title: "Thực hành có hướng dẫn",
    description: "Thiền định, quan sát nội tâm, ghi nhận lòng biết ơn và các bài tập ứng dụng cụ thể mỗi ngày.",
    Icon: Compass,
    sub: "The Practice",
  },
  {
    title: "Hành động tỉnh thức",
    description: "Gắn kết thế giới nội tâm với hành động kỷ luật trong đời thực để tạo ra kết quả bền vững.",
    Icon: HeartHandshake,
    sub: "The Manifestation",
  },
];

const commitments = [
  "Nội dung đào tạo chuẩn mực, có hệ thống và khoa học",
  "Đồng hành tận tâm cùng học viên trong suốt hành trình chuyển hóa",
  "Tôn trọng nhịp điệu phát triển riêng biệt của từng cá nhân",
  "Luôn đặt sự chuyển hóa và lợi ích lâu dài của học viên lên hàng đầu",
];

// Con dấu sáp đỏ chuẩn The Secret (Clean & Realistic)
function TheSecretWaxSealBadge({ label = "MALI EDU" }) {
  return (
    <div className="the-secret-seal-badge" title={label}>
      <div className="the-secret-seal-disc">
        <span className="the-secret-seal-letter">S</span>
        <span className="the-secret-seal-text">{label}</span>
      </div>
    </div>
  );
}

export default function GioiThieu() {
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
    <div className="the-secret-page min-h-screen">
      <SEO
        title="Giới thiệu Mali Edu - The Secret of Mind & Law of Attraction"
        description="Mali Edu - Đơn vị đào tạo phát triển bản thân, chuyển hóa nội tâm và vận hành tiềm thức thực tế theo phong cách The Secret."
        url="/gioi-thieu"
      />

      {/* 1. HERO SECTION - CHUẨN THIẾT KẾ THE SECRET */}
      <section id="ve-mali-edu" className="relative pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="the-secret-container">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">

            {/* Left Column: Headline & Editorial Prose */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Eyebrow */}
              <div className="the-secret-eyebrow">
                THE SECRET OF MIND · MALI EDU
              </div>

              {/* Main Headline */}
              <h1 className="the-secret-title-serif text-3xl sm:text-4xl lg:text-5xl leading-tight">
                <span className="block text-[#2C1810]">Đào tạo chuyển hóa nội tâm</span>
                <span className="block text-[#8D1C24] mt-1.5">Vận hành tiềm thức</span>
              </h1>

              {/* Sub-quote in The Secret Italic */}
              <p className="the-secret-quote-serif text-xl sm:text-2xl text-[#8D1C24] leading-relaxed">
                “Cái gì có trong đầu, sẽ có trên tay.”
              </p>

              {/* Description Prose */}
              <p className="text-base sm:text-lg text-[#5C4A42] leading-relaxed max-w-2xl">
                <strong>Mali Edu</strong> là đơn vị đào tạo và huấn luyện phát triển bản thân, tập trung vào <span className="font-semibold text-[#8D1C24]">tiềm thức – nội tâm – năng lượng – tài chính</span>, với định hướng giúp con người hiểu đúng – vận hành đúng – thay đổi bền vững từ gốc rễ.
              </p>

              {/* Speech / Quote Box */}
              <div className="the-secret-speech-box mt-4">
                <p className="text-sm sm:text-base italic text-[#4A3932] leading-relaxed">
                  “Chúng tôi không dạy lý thuyết suông, không cổ vũ niềm tin mơ hồ, mà tập trung vào <strong>nhận thức đúng, thực hành đúng và tạo ra kết quả thật</strong> trong cuộc sống, công việc và tài chính.”
                </p>
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#CB9549] uppercase tracking-wider">
                  <span>Mali Edu · Giá Trị Cốt Lõi</span>
                  <span className="text-[#8D1C24]">Kết quả thật</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <a href="#su-menh" className="the-secret-btn-primary">
                  <span>Khám phá sứ mệnh</span>
                  <ArrowRight size={15} />
                </a>

                <Link to="/dao-tao" className="the-secret-btn-gold">
                  <span>Các chương trình đào tạo</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Editorial Core Philosophy Card */}
            <div className="lg:col-span-5">
              <div className="the-secret-panel relative">
                
                {/* Header with Seal and Title */}
                <div className="flex items-center justify-between border-b border-[#EDE3D2] pb-5 mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#CB9549] block">
                      PHILOSOPHY
                    </span>
                    <h3 className="the-secret-title-serif text-2xl text-[#2C1810] mt-0.5">
                      Triết Lý Cốt Lõi
                    </h3>
                  </div>
                  <TheSecretWaxSealBadge label="MALI" />
                </div>

                {/* Italic Lead Quote */}
                <blockquote className="the-secret-quote-serif text-lg sm:text-xl leading-snug mb-6 block">
                  “Khi thế giới bên trong thay đổi đúng cách, thế giới bên ngoài sẽ tự nhiên thay đổi theo.”
                </blockquote>

                {/* 3 Pillars List */}
                <div className="space-y-3.5">
                  {[
                    {
                      num: "1",
                      title: "Hướng vào bên trong",
                      desc: "Gốc rễ và nguyên nhân của mọi sự thịnh vượng",
                    },
                    {
                      num: "2",
                      title: "Hành động tỉnh thức",
                      desc: "Không lý thuyết suông, thực hành có kỷ luật",
                    },
                    {
                      num: "3",
                      title: "Kết quả bền vững",
                      desc: "Tài chính lưu thông, tâm hồn an lạc trọn vẹn",
                    },
                  ].map((item) => (
                    <div
                      key={item.num}
                      className="flex items-start gap-4 p-3.5 rounded-lg bg-[#FCF9F2] border border-[#EDE3D2]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#8D1C24] text-[#FFF] flex items-center justify-center font-serif font-bold text-xs flex-shrink-0 shadow-sm">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#2C1810] text-sm">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#6E5A52] mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-[#EDE3D2] text-center">
                  <span className="text-[11px] font-bold tracking-widest text-[#CB9549] uppercase">
                    Mali Edu · The Secret of Life
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SỨ MỆNH MALI EDU - THE SECRET PHILOSOPHY */}
      <section id="su-menh" className="py-16 lg:py-24 border-t border-[#DBCBB2] bg-[#FFFFFF]">
        <div className="the-secret-container">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="the-secret-eyebrow mb-2">
              THE MISSION
            </div>
            
            <h2 className="the-secret-title-serif text-3xl sm:text-4xl lg:text-5xl text-[#2C1810]">
              SỨ MỆNH <span className="text-[#8D1C24]">MALI EDU</span>
            </h2>

            <div className="the-secret-divider-line">
              <Sparkles size={16} className="text-[#CB9549]" />
            </div>

            <p className="the-secret-quote-serif text-2xl sm:text-3xl text-[#8D1C24]">
              “Cái gì có trong đầu, sẽ có trên tay.”
            </p>

            <p className="text-base text-[#5C4A42] mt-4 leading-relaxed">
              Sứ mệnh của Mali Edu là hiện thực hóa câu nói đó cho hàng triệu người Việt Nam thông qua việc hiểu đúng, vận hành đúng và làm chủ Luật Hấp Dẫn. Chúng tôi tin rằng Luật Hấp Dẫn là khoa học của niềm tin và sự tập trung nhất quán.
            </p>
          </div>

          {/* 4 Pillars Grid (Libro Cards like thesecret.tv) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fourPillars.map((pillar) => {
              const IconComp = pillar.Icon;
              return (
                <div key={pillar.title} className="the-secret-libro-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#FAF5E8] flex items-center justify-center text-[#8D1C24] border border-[#DBCBB2]">
                        <IconComp size={22} />
                      </div>
                      <span className="font-serif font-bold text-base text-[#CB9549]">
                        {pillar.roman}
                      </span>
                    </div>

                    <h3 className="the-secret-title-serif text-xl text-[#2C1810] mb-2.5">
                      {pillar.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#5C4A42] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#EDE3D2] flex items-center gap-1.5 text-xs font-bold text-[#8D1C24]">
                    <span>Tìm hiểu thêm</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 3. BỐN GIÁ TRỊ CỐT LÕI */}
      <section className="py-16 lg:py-24 bg-[#FAF5E8] border-y border-[#DBCBB2]">
        <div className="the-secret-container">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="the-secret-eyebrow mb-2">
              CORE VALUES
            </div>
            <h2 className="the-secret-title-serif text-3xl sm:text-4xl text-[#2C1810]">
              Bốn Trụ Cột Giá Trị
            </h2>
            <div className="the-secret-divider-line">
              <Star size={14} className="text-[#CB9549]" />
            </div>
            <p className="text-sm text-[#6E5A52]">
              Mọi chương trình đào tạo của Mali Edu đều được xây dựng dựa trên 4 nguyên tắc bất biến:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val) => {
              const IconComp = val.Icon;
              return (
                <div key={val.title} className="the-secret-panel text-center flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-[#FAF5E8] border border-[#CB9549] mx-auto flex items-center justify-center text-[#8D1C24] mb-5 shadow-sm">
                      <IconComp size={24} />
                    </div>

                    <span className="font-serif font-bold text-sm text-[#CB9549] block mb-1">
                      {val.roman}
                    </span>

                    <h3 className="the-secret-title-serif text-lg text-[#2C1810] mb-2.5">
                      {val.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#6E5A52] leading-relaxed">
                      {val.description}
                    </p>
                  </div>

                  <div className="w-8 h-0.5 bg-[#CB9549] mx-auto mt-6 rounded-full" />
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. CÂU CHUYỆN KHỞI NGUYÊN - THE SECRET CHAMBER */}
      <section className="the-secret-dark-section py-20 lg:py-28">
        <div className="the-secret-container">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold tracking-[2.5px] text-[#CB9549] uppercase block">
                THE ORIGIN STORY
              </span>

              <h2 className="the-secret-title-serif text-3xl sm:text-4xl lg:text-5xl text-[#FFFFFF]">
                Câu Chuyện Hình Thành
              </h2>

              <div className="w-16 h-1 bg-[#CB9549] rounded-full" />

              <div className="space-y-4 text-[#D8C9B5] text-base leading-relaxed font-light">
                <p>
                  Mali Edu được hình thành từ chính những trải nghiệm thật về khủng hoảng, bế tắc tài chính và hành trình tự chuyển hóa của những người sáng lập.
                </p>
                <p>
                  Thay vì vội vã tìm kiếm giải pháp bên ngoài, con đường của Mali Edu bắt đầu từ việc <strong className="text-[#FFF]">quay vào bên trong</strong> — quan sát lại niềm tin, cảm xúc, năng lượng và cách tiềm thức đang vận hành cuộc đời mình.
                </p>
                <p>
                  Từ quá trình ứng dụng thành công các quy luật của The Secret và khoa học tâm trí, các phương pháp được hệ thống hóa thành những khóa huấn luyện thực chiến, dễ hiểu và an toàn cho cộng đồng.
                </p>
              </div>
            </div>

            {/* Right Quote Panel */}
            <div className="lg:col-span-5">
              <div className="the-secret-dark-card text-center">
                <Quote className="w-10 h-10 text-[#CB9549] mx-auto mb-4 opacity-80" />
                <p className="the-secret-quote-serif text-2xl text-[#FFF4E0] leading-relaxed">
                  “Hành trình vạn dặm bắt đầu từ một bước chân quay vào bên trong.”
                </p>
                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[#CB9549] font-bold">
                    TRIẾT LÝ MALI EDU
                  </span>
                  <TheSecretWaxSealBadge label="SEAL" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. LĨNH VỰC ĐÀO TẠO CHÍNH */}
      <section className="py-16 lg:py-24 bg-[#FFFFFF] border-b border-[#DBCBB2]">
        <div className="the-secret-container">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="the-secret-eyebrow mb-2">
              CURRICULUM
            </div>
            <h2 className="the-secret-title-serif text-3xl sm:text-4xl text-[#2C1810]">
              Lĩnh Vực Đào Tạo Chính
            </h2>
            <div className="the-secret-divider-line">
              <Key size={14} className="text-[#CB9549]" />
            </div>
            <p className="text-sm text-[#6E5A52]">
              Các chương trình được thiết kế theo hướng dễ hiểu – dễ áp dụng – phù hợp với đời sống thực tế của người Việt:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {trainingFields.map((field) => {
              const IconComp = field.icon;
              return (
                <div key={field.title} className="the-secret-panel flex items-start gap-5">
                  <div className="w-12 h-12 rounded-lg bg-[#FAF5E8] border border-[#CB9549] flex items-center justify-center text-[#8D1C24] flex-shrink-0">
                    <IconComp size={24} />
                  </div>
                  <div>
                    <h3 className="the-secret-title-serif text-xl text-[#2C1810] mb-2">
                      {field.title}
                    </h3>
                    <p className="text-sm text-[#5C4A42] leading-relaxed">
                      {field.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 6. BA TRỤ CỘT PHƯƠNG PHÁP */}
      <section className="py-16 lg:py-24 bg-[#FAF5E8]">
        <div className="the-secret-container">

          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="the-secret-eyebrow mb-2">
              METHODOLOGY
            </div>
            <h2 className="the-secret-title-serif text-3xl sm:text-4xl text-[#2C1810]">
              Ba Trụ Cột Chuyển Hóa
            </h2>
            <div className="the-secret-divider-line">
              <Compass size={14} className="text-[#CB9549]" />
            </div>
            <p className="text-sm text-[#6E5A52]">
              Chúng tôi tin rằng chuyển hóa thật sự không đến từ nghe nhiều, mà từ thực hành đúng và đủ:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {methodPillars.map((item) => {
              const IconComp = item.Icon;
              return (
                <div key={item.title} className="the-secret-panel text-center flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-[#FAF5E8] border-2 border-[#CB9549] mx-auto flex items-center justify-center text-[#8D1C24] mb-5 shadow-sm">
                      <IconComp size={26} />
                    </div>

                    <span className="text-[11px] font-bold tracking-widest text-[#CB9549] uppercase block mb-1">
                      {item.sub}
                    </span>

                    <h3 className="the-secret-title-serif text-2xl text-[#2C1810] mb-3">
                      {item.title}
                    </h3>

                    <p className="text-sm text-[#5C4A42] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#EDE3D2] text-xs font-bold text-[#8D1C24]">
                    Mali Edu · Phương Pháp Độc Bản
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. BẢN CAM KẾT & CTA */}
      <section className="py-20 lg:py-28 bg-[#FFFFFF] border-t border-[#DBCBB2] text-center">
        <div className="the-secret-container max-w-3xl">
          
          <div className="mb-6 flex justify-center">
            <TheSecretWaxSealBadge label="CAM KẾT" />
          </div>

          <h2 className="the-secret-title-serif text-3xl sm:text-4xl text-[#2C1810]">
            Mali Edu Cam Kết
          </h2>

          <p className="the-secret-quote-serif text-xl sm:text-2xl text-[#8D1C24] mt-2 mb-10">
            “Đồng hành chuyển hóa cùng sự thịnh vượng của bạn”
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left mb-12">
            {commitments.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg bg-[#FAF5E8] border border-[#DBCBB2]"
              >
                <CheckCircle2 size={18} className="text-[#8D1C24] flex-shrink-0 mt-0.5" />
                <p className="font-medium text-xs sm:text-sm text-[#2C1810] leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="inline-block p-8 rounded-lg bg-[#FAF5E8] border border-[#CB9549] shadow-lg max-w-lg mx-auto">
            <h3 className="the-secret-title-serif text-2xl text-[#2C1810] mb-2">
              Bạn đã sẵn sàng cho hành trình thay đổi?
            </h3>
            <p className="text-xs sm:text-sm text-[#6E5A52] mb-6 leading-relaxed">
              Khám phá các khóa học chuyển hóa nội tâm và khơi thông dòng tiền cùng Mali Edu ngay hôm nay.
            </p>

            <Link
              to="/dao-tao/khoi-thong-dong-tien"
              className="the-secret-btn-primary"
            >
              <span>Tham gia khóa học ngay</span>
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
