import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  PlayCircle,
  Target,
} from "lucide-react";
import Footer from "../../components/Footer";
import FloatingContact from "../../components/FloatingContact";
import ScrollToTop from "../../components/ScrollToTop";

const HERO_IMAGE =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1773736929295-661078967--o-Tr-ng-C--i-Gh-p-Banner.png";
const MALI_LOGO =
  "https://res.cloudinary.com/dstukyjzd/image/upload/v1768455801/Logo_Mali_Ngang_M%C3%80U_CAM_u5lrng.png";
const BANNER_IMAGE = 
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1773736864490-976832550-D-ng-Ti-n-Th-nh-V--ng-T--B-n-Th-.png";
const ZALO_GROUP_LINK = "https://zalo.me/g/fedjcewig0zvk3kkvvp0";

const heroHighlights = [
  {
    icon: Clock3,
    title: "12 buổi tối học online",
    description: "22h30 - 23h30",
  },
  {
    icon: Target,
    title: "04 buổi Coach Zoom chuyên sâu về tiền",
    description: "Thực hành, khai mở và gỡ nghẽn tài chính",
  },
];

const courseRoadmap = [
  {
    week: "TUẦN 1",
    theme: "THỨC TỈNH GIÁ TRỊ BẢN THÂN",
    sessions: [
      { id: 1, title: "Sự thật về tiền & Giá trị bản thân", points: ["Tại sao có người kiếm tiền nhanh dễ, có người vật lộn khó khăn?", "Công thức thật sự của tiền, nguyên tắc tăng trưởng tài chính vô hạn.", "Ba cấp độ kiếm tiền, bạn đang ở cấp mấy?"] },
      { id: 2, title: "Nâng giá trị bản thân", points: ["Vì sao nhiều người không tăng được giá trị kiếm tiền 1h?", "3 trụ cột nâng giá trị tài chính bản thân.", "Lộ trình nâng giá trị kiếm tiền 1h của bản thân."] },
      { id: 3, title: "Xây dựng niềm tin thành công", points: ["Niềm tin khiến bạn thành công hay thất bại ra sao?", "3 loại trải nghiệm khiến bạn mang theo niềm tin sai về bản thân và tài chính.", "4 bước xây dựng niềm tin thành công."] }
    ],
    zoom: {
      title: "Kế hoạch nâng cấp bản thân & Xử lý niềm tin",
      points: [
        "Phân tích lại công việc: Lỗ hổng kiến thức ở đâu?",
        "Đánh giá sự chuyển hóa công việc/khách hàng đang làm.",
        "Kế hoạch nâng cấp giá trị cá nhân.",
        "Xử lý niềm tin giới hạn, gieo vào mình các ám thị tích cực."
      ]
    }
  },
  {
    week: "TUẦN 2",
    theme: "GỠ TẮC NGHẼN TÀI CHÍNH TRONG TÂM TRÍ",
    sessions: [
      { id: 4, title: "Năng lượng tiềm thức và dòng tiền", points: ["Hiểu đúng về Năng Lượng, Luật Hấp Dẫn và Tiền.", "Quá trình gửi và thu năng lượng từ tiềm thức tới vũ trụ.", "Hiểu về năng lượng áp lực và thiếu thốn ngăn dòng tiền.", "Dấu ấn Tiền trong quá khứ - Điểm chặn lớn nhất."] },
      { id: 5, title: "Ám thị tài chính và lập trình tiềm thức", points: ["Ám thị tài chính là gì? Ảnh hưởng tới hiện tại ra sao?", "2 tầng ám thị tài chính.", "Chữa lành dấu ấn Tiền - Thiết lập ám thị mới."] },
      { id: 6, title: "Nâng tần số rung động - Khơi thông dòng chảy", points: ["Các loại tần số rung động đang hủy hoại dòng tiền.", "3 nhóm tần số thay đổi cuộc đời.", "Sức mạnh Lòng Biết Ơn trong việc thu hút may mắn."] }
    ],
    zoom: {
      title: "Coach gỡ tắc nghẽn & Chữa lành mối quan hệ Tiền",
      points: [
        "Coach trực tiếp các vấn đề về tắc nghẽn tiền hiện tại.",
        "Chữa lành mối quan hệ tâm linh với tiền.",
        "Hướng dẫn thực hành nâng tần số rung động mỗi ngày."
      ]
    }
  },
  {
    week: "TUẦN 3",
    theme: "TĂNG TỐC MỤC TIÊU TÀI CHÍNH",
    sessions: [
      { id: 7, title: "Phát triển mục tiêu tăng tốc tài chính", points: ["Tại sao tiền chỉ đến khi có mục tiêu chuẩn bản thân?", "Phương pháp kiến tạo mục tiêu tài chính chuẩn.", "Cách dùng Luật Hấp Dẫn hút mục tiêu nhanh nhất."] },
      { id: 8, title: "Lên kế hoạch đạt mục tiêu thực tế", points: ["Đánh giá nguồn lực (năng lực và công việc đang có).", "Phương pháp thiết lập kế hoạch tháng, tuần, ngày."] },
      { id: 9, title: "Thu hút các nguồn lực đạt mục tiêu", points: ["Nhận thức sai lầm khi hành động theo lối mòn cũ.", "Cách đón nhận thông điệp vũ trụ để lấy nguồn lực nhanh."] }
    ],
    zoom: {
      title: "Coach mục tiêu & Thiền kiến tạo nguồn lực",
      points: [
        "Coach mục tiêu: Vì sao bạn hay thất bại và từ bỏ?",
        "Luyện tập thiền mục tiêu & Đánh giá kế hoạch.",
        "Phân tích các lỗi sai phổ biến khi thu hút nguồn lực."
      ]
    }
  },
  {
    week: "TUẦN 4",
    theme: "KỶ LUẬT VÀ KIỂM SOÁT TÀI CHÍNH",
    sessions: [
      { id: 10, title: "Kỷ luật bằng tiềm thức", points: ["Tại sao ta không thể kỷ luật khi theo đuổi mục tiêu?", "Lộ trình cân bằng SƯỚNG - KHỔ để kích hoạt tiềm thức.", "3 bước giao tiếp khiến tiềm thức tự động làm việc."] },
      { id: 11, title: "Luật Hấp Dẫn trong bán hàng", points: ["Sự nguy hiểm của áp lực và mệt mỏi trong bán hàng.", "Cách chuyển hóa trạng thái áp lực hàng tồn, gia đình.", "Thiền đẩy hàng đi nhanh (bất động sản, hàng tồn)."] },
      { id: 12, title: "Nguyên tắc kiểm soát và đầu tư", points: ["Thiết lập bản đồ tài chính cá nhân & gia đình.", "Nguyên tắc đầu tư an toàn hiệu quả.", "Chiến tranh tiền tệ và hướng dịch chuyển tài chính."] }
    ],
    zoom: {
      title: "Giao tiếp bản thân & Định hướng đầu tư",
      points: [
        "Hướng dẫn luyện tập giao tiếp với bản thân thực tế.",
        "Coach: Tại sao tôi thất bại trong kinh doanh?",
        "Đánh giá thời điểm vàng: Nên đầu tư gì hiệu quả hiện nay?"
      ]
    }
  }
];

const heroLinks = [];

const titleStyle = {
  color: "#b07d2b",
  fontFamily: '"Playfair Display", "Times New Roman", serif',
};

// Custom animation for the shimmer effect
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const DongTienThinhVuongTuBanThe = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const floatAnimation = {
    y: [-8, 8],
    transition: {
      duration: 5,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  };

  return (
    <main className="min-h-screen bg-[#fffdfa] text-[#3f2a15] selection:bg-[#f6e4bf] selection:text-[#5a3812]">
      <Helmet>
        <title>Dòng Tiền Thịnh Vượng Từ Bản Thể - Mali Edu</title>
        <meta name="description" content="Khai mở tư duy, hoá giải nghẽn tắc và thiếp lập sự thông tuệ tài chính từ gốc rễ nội lực, mang lại sự thịnh vượng bền vững." />
        <meta property="og:title" content="Dòng Tiền Thịnh Vượng Từ Bản Thể - Mali Edu" />
        <meta property="og:description" content="Khai mở tư duy, hoá giải nghẽn tắc và thiếp lập sự thông tuệ tài chính từ gốc rễ nội lực, mang lại sự thịnh vượng bền vững." />
        <meta property="og:image" content={BANNER_IMAGE} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
      </Helmet>
      <style>{shimmerKeyframes}</style>
      {/* Premium Hero Section */}
      <section className="relative isolate flex flex-col overflow-hidden lg:h-screen lg:max-h-[950px]">
        {/* Background Layers */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Restore Original Rich Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,235,180,0.8),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(246,198,104,0.3),_transparent_40%),linear-gradient(180deg,_#fffdfa_0%,_#fbf3e4_60%,_#f2e1c1_100%)]" />

          {/* Banner Image as Subtle Overlay Blend */}
          <div className="absolute inset-0 opacity-[0.08] mix-blend-multiply">
            <img 
              src={BANNER_IMAGE} 
              alt="" 
              className="h-full w-full object-cover blur-[2px]"
            />
          </div>

          {/* Animated Background Elements */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.6, 0.4],
              x: [0, 50, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[-5%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#fceac4]/50 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-[#f1c26d]/30 blur-[130px]"
          />

          {/* Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply" 
            style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/silk-weave.png")` }} 
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1260px] lg:flex-1 flex-col px-5 pt-10 pb-12 sm:px-10 lg:pt-6 lg:pb-16">
          {/* Header/Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center"
          >
            <img
              src={MALI_LOGO}
              alt="Mali Magic To Life"
              className="h-8 w-auto opacity-90 brightness-110 sm:h-10"
            />
          </motion.div>

          <div className="mt-6 flex flex-1 flex-col justify-center lg:justify-center lg:mt-5 px-4 sm:px-6 lg:px-8 gap-8 lg:gap-0">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] xl:gap-20">
              {/* Content Column */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left lg:scale-[0.96] origin-center lg:origin-left"
              >
                <motion.div variants={itemVariants} className="mb-4 inline-flex items-center space-x-2 rounded-full border border-[#efd8af]/40 bg-[#fff5e1]/55 px-3 py-1 backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#cd9228] opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#cd9228]"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#9a6a22]">
                    Lộ trình huấn luyện tài chính thức tỉnh
                  </span>
                </motion.div>

                <motion.div variants={itemVariants} className="mb-6">
                  <h1
                    className="relative flex flex-col font-extrabold tracking-tight text-[clamp(3.2rem,15vw,5.5rem)] lg:text-[clamp(2.6rem,6.8vw,4.8rem)] leading-[1.1]"
                    style={titleStyle}
                  >
                    <span className="block text-[#4c3218] story-script py-2 -my-2">Dòng Tiền</span>
                    <span className="block text-transparent bg-clip-text bg-[linear-gradient(to_right,#b07d2b,#daa34a,#b07d2b)] story-script py-3 -my-3 px-4 -mx-4">Thịnh Vượng</span>
                    <span className="block text-[#4c3218] story-script py-2 -my-2 mt-1 lg:mt-0">Từ Bản Thể</span>
                    
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "130px" }}
                      viewport={{ once: true }}
                      transition={{ delay: 1, duration: 1 }}
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 h-1 bg-[#daa34a]/35 rounded-full" 
                    />
                  </h1>
                </motion.div>

                <motion.p variants={itemVariants} className="mb-8 text-[10px] sm:text-[12px] lg:text-[15px] leading-relaxed text-[#6b4e2f]/80 font-medium">
                  <span className="block">Khai mở tư duy, hoá giải nghẽn tắc và thiếp lập sự thông tuệ tài chính</span>
                  <span className="block">từ gốc rễ nội lực, mang lại sự thịnh vượng bền vững.</span>
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 lg:justify-start">
                  {heroHighlights.map(({ icon: Icon, title, description }) => (
                    <div
                      key={title}
                      className="group flex w-fit items-center gap-3 rounded-2xl border border-[#ecd9b6]/35 bg-white/45 p-3 pr-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white/65"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#fce3a1_0%,_#d9a144_100%)] text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <Icon size={18} className="text-[#5a3812]" />
                      </div>
                      <div className="text-left">
                        <h3 className="whitespace-nowrap text-[12.5px] font-black leading-tight text-[#4c3218] sm:text-[13.5px]">
                          {title}
                        </h3>
                        <p className="whitespace-nowrap text-[10.5px] leading-tight text-[#7a5a35]/90 mt-0.5 sm:text-[11.5px]">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Button đã chuyển xuống phía dưới banner image */}
              </motion.div>

              {/* Visual Column */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative hidden lg:block"
              >
                <motion.div 
                  animate={floatAnimation}
                  className="relative z-10 overflow-hidden rounded-[32px] border border-white/40 bg-white/10 p-2 shadow-[20px_40px_100px_rgba(165,112,30,0.12)] ring-1 ring-[#ecd9b6]/30"
                >
                  <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.1)_100%)] backdrop-blur-3xl" />
                  
                  <div className="relative overflow-hidden rounded-[26px]">
                    <img
                      src={BANNER_IMAGE}
                      alt="Dòng Tiền Thịnh Vượng"
                      className="aspect-video w-full object-cover shadow-inner transition-transform duration-700 hover:scale-105"
                    />
                    {/* Artistic Overlays */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <p className="story-script text-3xl text-[#f7dc98] drop-shadow-lg">Dòng Tiền Thịnh Vượng</p>
                      <p className="story-script text-2xl text-white/90 drop-shadow-md">Từ Bản Thể</p>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/20" />
                  </div>

                  {/* Decorative Accents on the frame */}
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[radial-gradient(circle,_#f9df9b_0%,_transparent_70%)] opacity-40" />
                </motion.div>

                {/* Sub-banner CTAs moved here */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="mt-8 flex flex-col items-center gap-5"
                >
                  <a
                    href={ZALO_GROUP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(135deg,_#f7dc98_0%,_#daa34a_60%,_#bb7922_100%)] px-10 py-4 text-base font-black text-[#2f1b0b] shadow-[0_20px_50px_rgba(192,128,40,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(192,128,40,0.35)]"
                  >
                    <span className="absolute inset-0 block h-full w-full animate-[shimmer_2s_infinite] bg-[linear-gradient(120deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_70%)] opacity-0 group-hover:opacity-100" />
                    THAM GIA NHÓM ZALO
                    <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </a>

                  <div className="flex items-center gap-3.5 text-[#51361c]">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dcb26a] bg-white text-[#b67b22] shadow-md backdrop-blur-md"
                    >
                      <PlayCircle size={22} fill="rgba(182, 123, 34, 0.1)" />
                    </motion.div>
                    <span className="text-[13px] font-black uppercase tracking-[0.2em]">Học trực tiếp Zoom tối</span>
                  </div>
                </motion.div>

                {/* Background Decoration */}
                <div className="absolute -bottom-10 -right-4 -z-10 h-48 w-48 rounded-full border-[0.5px] border-[#ecd9b6]/20" />
                <div className="absolute -left-12 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-[#fceac4]/10 blur-3xl opacity-60" />
              </motion.div>

              {/* Mobile Image + CTA bên dưới ảnh */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="lg:hidden mb-4 flex flex-col gap-4"
              >

                {/* Nút CTA nằm dướdi banner chỉ hiện trên mobile */}
                <div className="flex justify-center">
                  <a
                    href={ZALO_GROUP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(135deg,_#f7dc98_0%,_#daa34a_60%,_#bb7922_100%)] px-8 py-3.5 text-sm font-black text-[#2f1b0b] shadow-[0_12px_35px_rgba(192,128,40,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(192,128,40,0.3)]"
                  >
                    <span className="absolute inset-0 block h-full w-full animate-[shimmer_2s_infinite] bg-[linear-gradient(120deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_70%)] opacity-0 group-hover:opacity-100" />
                    THAM GIA NHÓM ZALO
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-6 hidden sm:flex flex-col items-center justify-between gap-4 border-t border-[#f0e0c4]/30 pt-4 sm:flex-row lg:mb-8"
          >
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {heroLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-full border border-[#ecd9b6]/20 bg-white/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#845a22] backdrop-blur-sm hover:bg-[#fff2d9]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#845a22]/80 sm:flex"
            >
              Khám phá nội dung
              <ChevronDown size={14} className="stroke-[3px]" />
            </motion.div>
          </motion.div>
        </div>
      </section>


      <section
        id="lo-trinh-hoc"
        className="relative border-t border-[#f0dfc0] bg-[#fffcf5] py-12 px-4 sm:px-6 lg:py-24 lg:px-10 overflow-hidden"
      >
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fff4e2] to-transparent" />
        <div className="absolute -right-48 top-1/4 w-96 h-96 bg-[#f1c26d]/10 rounded-full blur-[100px]" />
        <div className="absolute -left-48 bottom-1/4 w-96 h-96 bg-[#fceac4]/15 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-8 lg:mb-16 px-2 sm:px-4">
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a06d24]/70 mb-4"
            >
              Lộ trình huấn luyện CHI TIẾT
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[30px] md:text-5xl font-extrabold text-[#4c3218] tracking-tight mb-6 leading-[1.2]"
            >
              Hành Trình Khai Thông <br className="hidden md:block" />
              <span className="mt-2 block text-transparent bg-clip-text bg-[linear-gradient(to_right,#8a5e1d,#b07d2b,#8a5e1d)] story-script text-[1.3em] pb-4 leading-normal">Dòng Tiền Thịnh Vượng</span>
            </motion.h2>
            <motion.div 
               initial={{ width: 0 }}
               whileInView={{ width: "120px" }}
               viewport={{ once: true }}
               className="h-1 bg-[#daa34a] mx-auto rounded-full opacity-30"
            />
          </div>

          <div className="grid gap-8 lg:gap-12">
            {courseRoadmap.map((item, index) => (
              <motion.div
                key={item.week}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative"
              >
                {/* Week Indicator Sidebar (Desktop) */}
                <div className="absolute -left-16 top-0 hidden xl:flex flex-col items-center">
                  <div className="text-xs font-black text-[#a06d24]/40 rotate-180 [writing-mode:vertical-lr] tracking-[0.5em] mb-4 uppercase">
                    Module {index + 1}
                  </div>
                  <div className="w-[1px] h-full bg-gradient-to-b from-[#dcb26a]/40 to-transparent" />
                </div>

                <div className="grid lg:grid-cols-[1fr_380px] gap-5 lg:gap-8">
                  {/* Left Column: Sessions */}
                  <div className="rounded-[28px] lg:rounded-[40px] border border-[#ecd9b6]/30 bg-white/40 p-5 sm:p-8 md:p-10 lg:p-12 shadow-[0_25px_70px_rgba(165,112,30,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_45px_100px_rgba(165,112,30,0.08)] ring-1 ring-[#ecd9b6]/10">
                    <div className="mb-6 lg:mb-10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#daa34a] border border-[#daa34a]/30 px-2 py-0.5 rounded-full">{item.week}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#4c3218] uppercase tracking-wide">
                        {item.theme}
                      </h3>
                    </div>

                    <div className="space-y-8 lg:space-y-12">
                      {item.sessions.map((session) => (
                        <div key={session.title} className="relative pl-8">
                          {/* Dot indicator */}
                          <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-[#daa34a] bg-white group-hover:bg-[#daa34a] transition-colors duration-300" />
                          <div className="absolute left-[5px] top-[18px] h-[calc(100%+24px)] w-[2px] bg-gradient-to-b from-[#dcb26a]/20 to-transparent last:hidden" />
                          
                          <h4 className="text-lg font-bold text-[#6b4e2f] mb-4">
                            Buổi {session.id}: {session.title}
                          </h4>
                          <ul className="grid gap-3">
                            {session.points.map((point, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-3 group/item">
                                <div className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#daa34a]/40 group-hover/item:bg-[#daa34a] transition-colors" />
                                <span className="text-[15px] leading-relaxed text-[#7a5a35] group-hover/item:text-[#4c3218] transition-colors">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Zoom Session – desktop sticky, mobile flat */}
                  <div className="relative">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="lg:sticky top-24 rounded-[24px] lg:rounded-[32px] overflow-hidden bg-[linear-gradient(145deg,_#4c3218_0%,_#2f1b0b_100%)] p-5 sm:p-7 lg:p-8 text-white shadow-2xl shadow-amber-900/20"
                    >
                      {/* Decorative elements */}
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#daa34a]/10 blur-2xl" />
                      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-[#daa34a]/5 blur-xl" />

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7dc98] to-[#daa34a] text-[#4c3218] shadow-lg">
                              <PlayCircle size={24} />
                           </div>
                           <span className="text-xs font-black uppercase tracking-[0.2em] text-[#f7dc98]">Zoom Chuyên Sâu</span>
                        </div>

                        <h4 className="text-xl font-bold mb-6 leading-tight">
                          {item.zoom.title}
                        </h4>

                        <div className="space-y-4">
                          {item.zoom.points.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-3 group/zoom">
                              <div className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#daa34a] shadow-[0_0_8px_rgba(218,163,74,0.6)]" />
                              <span className="text-sm leading-relaxed text-amber-50/80 group-hover/zoom:text-white transition-colors">
                                {point}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                           <div className="flex -space-x-2">
                             {[1,2,3].map(i => (
                               <div key={i} className="h-8 w-8 rounded-full border-2 border-[#4c3218] bg-[#6b4e2f] flex items-center justify-center overflow-hidden">
                                 <div className="h-full w-full bg-gradient-to-br from-[#f7dc98] to-[#daa34a] opacity-60" />
                               </div>
                             ))}
                             <div className="h-8 w-8 rounded-full border-2 border-[#4c3218] bg-[#daa34a] flex items-center justify-center text-[10px] font-bold text-[#4c3218]">
                               +99
                             </div>
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[#f7dc98]/70">Deep Coaching</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 lg:mt-24 text-center"
          >
             <a
              href={ZALO_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-[linear-gradient(135deg,_#4c3218_0%,_#2f1b0b_100%)] px-12 py-5 text-lg font-black text-white shadow-[0_20px_50px_rgba(47,27,11,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(47,27,11,0.35)]"
            >
              THAM GIA NHÓM ZALO
              <ArrowRight size={22} className="transition-transform duration-300 group-hover:translate-x-2" />
            </a>
            <p className="mt-6 text-[9px] sm:text-[11px] uppercase font-black tracking-[0.1em] sm:tracking-[0.4em] text-[#a06d24]">Cơ hội chuyển hóa tài chính duy nhất trong năm</p>
          </motion.div>
        </div>
      </section>
      <Footer />
      <FloatingContact />
      <ScrollToTop />
    </main>
  );
};

export default DongTienThinhVuongTuBanThe;
