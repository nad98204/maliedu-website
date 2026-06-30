import { useEffect, useId, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  Compass,
  Flag,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Phone,
  Route,
  Sparkles,
  Target,
  User,
  Video,
  X,
} from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import SEO from "../../../components/SEO";
import Footer from "../../../components/Footer";
import { db } from "../../../firebase";
import { submitToCRM } from "../../../services/crmService";
import {
  buildLeadSearchKeywords,
  normalizeLeadPhoneDigits,
  normalizeLeadSearchText,
} from "../../../utils/leadSearch";

const COURSE_IMAGE =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782120213116-146839060-Chinh-Ph-c-M-c-Ti-u-2026-3-2.jpg";
const HERO_IMAGE = "/assets/landing/chinh-phuc-muc-tieu/hero.png";
const MODULE_1_IMAGE = "/assets/landing/chinh-phuc-muc-tieu/module1.png";
const MODULE_2_IMAGE = "/assets/landing/chinh-phuc-muc-tieu/module2.png";
const MODULE_3_IMAGE = "/assets/landing/chinh-phuc-muc-tieu/module3.png";
const COURSE_START_TIME = new Date("2026-07-06T00:00:00+07:00").getTime();

const painPoints = [
  "Có mục tiêu nhưng chưa biết bắt đầu từ đâu.",
  "Thường trì hoãn và dễ mất động lực giữa chừng.",
  "Làm rất nhiều nhưng kết quả chưa tương xứng.",
  "Thiếu một kế hoạch rõ ràng để theo dõi mỗi ngày.",
];

const outcomes = [
  {
    icon: <Target className="h-7 w-7" />,
    title: "Rõ mục tiêu",
    text: "Xác định điều thực sự quan trọng và kết quả bạn muốn đạt được.",
  },
  {
    icon: <Route className="h-7 w-7" />,
    title: "Có lộ trình",
    text: "Chia mục tiêu lớn thành các bước nhỏ, cụ thể và dễ thực hiện.",
  },
  {
    icon: <ClipboardCheck className="h-7 w-7" />,
    title: "Biết hành động",
    text: "Xây dựng kế hoạch phù hợp với thời gian và hoàn cảnh hiện tại.",
  },
  {
    icon: <Flag className="h-7 w-7" />,
    title: "Bền bỉ tới đích",
    text: "Duy trì sự tập trung, đo lường tiến độ và điều chỉnh đúng lúc.",
  },
];

const modules = [
  {
    number: "01",
    title: "Tại Sao Mục Tiêu Bạn Cứ Mãi Dang Dở? Bạn Đang Sai Ở Đâu?",
    localImage: "/assets/landing/chinh-phuc-muc-tieu/module1.png",
    fallbackImage: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782134460288-618734151-Bu-i-1-T-I-SAO-M-C-TI-U-B-N-C--M-I-DANG-D--B-N--ANG-SAI-----U.jpg",
    lessons: [
      "5 yếu tố khiến 90% mọi người thất bại khi chinh phục mục tiêu",
      "Phương pháp xử lý 5 vấn đề trên",
      "Lộ trình 4 bước Chinh phục mục tiêu",
    ],
  },
  {
    number: "02",
    title: "Thiết Lập Bức Tranh Mục Tiêu Đầy Cảm Hứng Từ Tận Trong Tiềm Thức",
    localImage: "/assets/landing/chinh-phuc-muc-tieu/module2.png",
    fallbackImage: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782139719990-41206163-Bu-i-2-THI-T-L-P-B-C-TRANH-M-C-TI-U---Y-C-M-H-NG-T--T-N-TRONG-TI-M-TH-C-2.jpg",
    lessons: [
      "Nguyên lý Cân Bằng Bánh Xe Cuộc đời",
      "Tìm gốc cảm xúc thiết lập mục tiêu",
      "Thiết lập bức tranh mục tiêu rõ ràng",
    ],
  },
  {
    number: "03",
    title: "Kỷ Luật Bằng Tiềm Thức",
    localImage: "/assets/landing/chinh-phuc-muc-tieu/module3.png",
    fallbackImage: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782134462798-592287680-Bu-i-3-K--Lu-t-B-ng-Ti-m-Th-c-m-thanh.jpg",
    lessons: [
      "Nhận diện những mô thức sai khiến ta không thể kỷ luật được lâu",
      "Cài đặt lập trình thói quen kỷ luật từ tiềm thức",
      "Phương pháp duy trì kỷ luật bền vững",
    ],
  },
];

const studentVideos = [
  "qEIaX2OoMCQ",
  "3m1FyyM2jB4",
  "3KkZVeN8_18",
  "7_QVSMSu8dM",
  "CuTIq0nfXFY",
  "UAJITOjiJO8",
  "CYZB4ikhAqg",
  "IckLUPaf0U0",
];

const audiences = [
  "Người đang có nhiều mục tiêu nhưng chưa biết ưu tiên.",
  "Người thường xuyên trì hoãn hoặc bỏ cuộc giữa chừng.",
  "Người muốn cải thiện công việc, tài chính và chất lượng cuộc sống.",
  "Người cần một phương pháp rõ ràng để biến mục tiêu thành hành động.",
];

const faqs = [
  {
    question: "Tôi chưa xác định được mục tiêu rõ ràng thì có tham gia được không?",
    answer:
      "Có. Chương trình bắt đầu từ việc giúp bạn nhìn lại điều mình thực sự mong muốn, sau đó mới xây dựng mục tiêu và kế hoạch phù hợp.",
  },
  {
    question: "Tôi lớn tuổi và không giỏi công nghệ có tham gia được không?",
    answer:
      "Được. Nội dung được trình bày rõ ràng, từng bước và dễ áp dụng. Sau khi đăng ký, đội ngũ Mali Edu sẽ liên hệ hướng dẫn cụ thể.",
  },
  {
    question: "Sau khi để lại thông tin, tôi cần làm gì tiếp theo?",
    answer:
      "Bạn chỉ cần giữ điện thoại. Đội ngũ Mali Edu sẽ liên hệ để tư vấn lịch học, hình thức học và các thông tin cần thiết.",
  },
  {
    question: "Tôi có phải thanh toán ngay khi đăng ký không?",
    answer:
      "Không. Việc điền thông tin là để nhận tư vấn. Bạn sẽ được cung cấp đầy đủ thông tin trước khi quyết định tham gia.",
  },
];

const coaches = [
  {
    name: "Mong Coaching",
    subtitle: "Nhà đào tạo & Huấn luyện",
    role: "Chuyên gia Luật Hấp Dẫn & Kích hoạt Tiềm Thức",
    image: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782141836382-308577835-505393465-122137320068616236-3602726724362190836-n.jpg",
    bio: "Với lộ trình đào tạo và huấn luyện rõ ràng, hiệu quả, Mong Coaching hiện là một trong những nhà sáng tạo nội dung và tổ chức đào tạo về Luật Hấp Dẫn hàng đầu tại Việt Nam, giúp hàng ngàn học viên chuyển hóa và chinh phục các mục tiêu cuộc sống.",
    details: [
      ["Thế mạnh cốt lõi", "Khả năng đơn giản hóa các quy luật vũ trụ, đi sâu vào bản chất của \"Tần Số Rung Động Cảm Xúc\" thay vì những câu tuyên bố sáo rỗng. Anh chuyên giúp học viên bẻ gãy các rào cản tâm lý để kích hoạt tư duy tài chính tích cực và ứng dụng Luật Hấp Dẫn một cách thực tế, ra kết quả ngay."],
      ["Thấu hiểu và Đồng cảm", "Hiểu rõ nỗi đau của những ai đang loay hoay với bài toán tài chính, những người nỗ lực rất nhiều nhưng chưa đạt kết quả vì chưa biết cách \"gieo hạt\" đúng tần số. Từ sự thấu cảm đó, các buổi livestream và chương trình coach trực tiếp của anh luôn chạm đúng \"gốc rễ\" vấn đề của học viên."],
      ["Kiến thức truyền đạt", "Không giáo điều, không lý thuyết suông. Tất cả đều là những quy trình thực chứng thực tế, dễ hiểu, dễ ứng dụng để ngay cả những ai mới bắt đầu nghe về Luật Hấp Dẫn hay Tiềm Thức đều có thể thực hành và thấy ngay sự thay đổi trong cuộc sống hàng ngày."]
    ],
    quote: "Tôi tạo ra các chương trình huấn luyện này với mong muốn đồng hành cùng bạn trên con đường làm chủ năng lượng và làm chủ cuộc đời. Hãy ngừng tuyên bố sáo rỗng, hãy bắt đầu thay đổi từ Tần số cảm xúc bên trong. Nếu tôi làm được, bạn chắc chắn sẽ làm được!"
  },
  {
    name: "Nguyễn Mong Thành",
    subtitle: "Nhà đào tạo & Huấn luyện",
    role: "Chuyên gia Coaching Tâm Thức - Diễn giả truyền cảm hứng",
    image: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782141835659-987112338-488687318-3086001678220451-8119727030914301333-n.jpg",
    bio: "Với hơn 7 năm kinh nghiệm thực chiến trong lĩnh vực đào tạo và huấn luyện, hiện đang giữ vai trò Giám Đốc Đào Tạo & Huấn Luyện tại Công ty Cổ phần Đào tạo và Tư vấn MALI, Nguyễn Mong Thành là một người đồng hành tin cậy trên hành trình đánh thức tiềm năng và chuyển hóa tâm thức của hàng ngàn học viên.",
    details: [
      ["Thế mạnh cốt lõi", "Chuyên sâu về Coaching Tâm Thức, định hướng Mục Tiêu, tái kết nối Mối Quan Hệ và ứng dụng quy luật của Vũ trụ (Luật Hấp Dẫn) để giúp học viên kiến tạo một cuộc sống bình an, hạnh phúc và thịnh vượng từ gốc rễ."],
      ["Thấu hiểu và Đồng cảm", "Bản thân anh cũng từng đi qua những thăng trầm, trải nghiệm sâu sắc những rào cản tâm lý, sự mất phương hướng hay những tổn thương trong mối quan hệ mà số đông đang gặp phải. Chính vì vậy, anh luôn lắng nghe và thấu hiểu bằng cả trái tim."],
      ["Giá trị truyền đạt", "Không đi vào những lý thuyết suông hay giáo điều xa rời thực tế. Những bài học, quy trình thực hành từ anh đều được đúc kết từ trải nghiệm thực chứng đầy sống động, đơn giản hóa tối đa để bất kỳ ai – dù đang ở vạch xuất phát nào – cũng có thể dễ dàng thấu cảm, ứng dụng và thấy ngay sự thay đổi trong tâm thức từng ngày."]
    ],
    quote: "Tôi tạo ra các chương trình huấn luyện này với khát khao đồng hành cùng bạn trên con đường đánh thức sức mạnh nội tại. Giúp bạn chuyển hóa tư duy, làm chủ cảm xúc và vận dụng Luật Hấp Dẫn một cách thực tế để đạt được mọi mục tiêu trong đời. Chỉ cần bạn có khát khao và kỷ luật, tôi tin bạn sẽ thành công!"
  }
];

const SectionHeading = ({ eyebrow, title, description, theme = "light", titleClassName = "" }) => {
  const isDark = theme === "dark";
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center px-4 relative z-10 font-sans">
      {eyebrow ? (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold uppercase tracking-[0.12em] ${
          isDark 
            ? "text-[#FF8A8A] bg-red-950/40 border border-red-900/30" 
            : "text-[#B91C1C] bg-[#FFF4F1] border border-red-100"
        } mb-3 sm:mb-4`}>
          <Sparkles className="h-3.5 w-3.5 text-[#D62828] animate-pulse" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className={`text-[25px] sm:text-4xl lg:text-[40px] font-black leading-[1.3] tracking-tight ${
        isDark ? "text-white" : "text-[#1a1a1a]"
      } font-sans ${titleClassName}`}>
        {title}
      </h2>
      {description ? (
        <p className={`mx-auto mt-4 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed ${
          isDark ? "text-gray-300" : "text-gray-600"
        } font-semibold`}>
          {description}
        </p>
      ) : null}
    </div>
  );
};

const CtaButton = ({ onClick, label = "ĐĂNG KÝ HỌC MIỄN PHÍ", className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#D62828] to-[#B91C1C] px-5 py-4 text-center text-[17px] font-black text-white shadow-[0_10px_25px_rgba(214,40,40,0.3)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(214,40,40,0.45)] hover:scale-[1.01] active:scale-[0.985] focus:outline-none focus:ring-4 focus:ring-red-200 sm:w-auto sm:min-w-[320px] sm:rounded-xl sm:px-6 sm:text-lg ${className}`}
  >
    {label}
    <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
  </button>
);

const ModuleCard = ({ module, theme = "light" }) => {
  const [imgSrc, setImgSrc] = useState(module.localImage);
  const [isPng, setIsPng] = useState(true);
  const isDark = theme === "dark";

  return (
    <article className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-center z-10 ${
      isDark 
        ? "border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_45px_rgba(214,40,40,0.15)] hover:bg-white/[0.04] hover:border-white/[0.12]" 
        : "border-[#E8D8D4] bg-gradient-to-br from-white to-[#FFFBF9] shadow-[0_16px_40px_rgba(214,40,40,0.06)] hover:border-[#D62828]/35 hover:shadow-[0_22px_50px_rgba(214,40,40,0.12)] hover:-translate-y-1"
    }`}>
      {/* Dải màu trang trí dọc sang trọng ở cạnh trái */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#D62828] to-[#B91C1C] z-10 transition-all duration-300 group-hover:w-[7px]" />

      {/* Watermark số thứ tự buổi học nghệ thuật */}
      <div className={`absolute right-6 top-6 text-7xl sm:text-8xl font-sans font-black select-none pointer-events-none transition-all duration-500 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 ${
        isDark ? "text-white" : "text-[#B91C1C]"
      }`}>
        {module.number}
      </div>

      {/* Module Image Container */}
      <div className="w-full md:w-[35%] shrink-0 flex justify-center relative">
        {isPng ? (
          <div className="relative py-2">
            {/* Glow behind 3D PNG */}
            <div className={`absolute inset-0 rounded-full blur-2xl z-0 scale-90 ${
              isDark ? "bg-gradient-to-tr from-red-500/20 to-amber-500/10" : "bg-gradient-to-tr from-red-200/30 to-amber-200/20"
            }`} />
            <img
              src={imgSrc}
              alt={module.title}
              onError={() => {
                setImgSrc(module.fallbackImage);
                setIsPng(false);
              }}
              className="relative z-10 w-full max-w-[170px] aspect-square object-contain drop-shadow-[0_12px_24px_rgba(214,40,40,0.12)] group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg ${
            isDark ? "border border-white/10" : "border border-red-50/50"
          }`}>
            <img
              src={imgSrc}
              alt={module.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {/* Soft overlay gradient to enrich the image colors */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {/* Module Text Content */}
      <div className="w-full md:w-[65%] text-left font-sans flex flex-col items-start relative z-10">
        {/* Nhãn buổi học dạng Pill và Tag cực kỳ nổi bật */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#D62828] to-[#B91C1C] shadow-[0_4px_12px_rgba(214,40,40,0.2)]">
            BUỔI {Number(module.number)}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#D8C8C4]" />
          <span className={`text-[11px] sm:text-xs font-extrabold uppercase tracking-widest ${
            isDark ? "text-[#FF8A8A]" : "text-[#B91C1C]"
          }`}>
            Lộ trình bứt tốc
          </span>
        </div>

        {/* Tiêu đề buổi học căn lề trái cực đẹp */}
        <h3 className={`text-xl sm:text-2xl font-black leading-snug tracking-tight mb-4 ${
          isDark ? "text-white" : "text-[#1a1a1a]"
        }`}>
          {module.title}
        </h3>

        {/* Nội dung chi tiết buổi học */}
        <div className={`w-full border-t pt-4 ${
          isDark ? "border-white/[0.08]" : "border-gray-100"
        }`}>
          <p className={`mb-3 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
            isDark ? "text-gray-400" : "text-[#8A6B65]"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDark ? "bg-[#FF8A8A]" : "bg-[#B91C1C]"}`} />
            Nội dung trọng tâm:
          </p>
          <ul className="space-y-3.5">
            {module.lessons.map((lesson) => (
              <li key={lesson} className={`flex items-start gap-3.5 text-[16px] sm:text-[17px] font-semibold leading-relaxed ${
                isDark ? "text-gray-200" : "text-[#2d2d2d]"
              }`}>
                <span className={`mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full shadow-sm ${
                  isDark ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                }`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                </span>
                <span className="flex-1">{lesson}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
};

const OutcomeCard = ({ icon, title, text, index }) => {
  return (
    <article 
      className="relative overflow-hidden rounded-3xl border border-red-100/50 bg-gradient-to-br from-white to-[#FFFDFB] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(214,40,40,0.06)] hover:translate-y-[-2px] transition-all duration-300 flex flex-col items-start text-left z-10 group min-h-[220px]"
    >
      {/* Số thứ tự lớn làm Watermark chìm nghệ thuật ở góc dưới */}
      <span className="absolute right-4 bottom-2 text-7xl font-black text-[#B91C1C]/5 select-none transition-transform duration-300 group-hover:scale-110">
        0{index + 1}
      </span>

      {/* Icon Container có viền kép sang trọng */}
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D62828] to-[#B91C1C] text-white shadow-[0_4px_12px_rgba(214,40,40,0.2)] group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      
      <span className="text-[10px] font-black uppercase tracking-widest text-[#B91C1C] mb-1.5 opacity-75">
        Giai đoạn 0{index + 1}
      </span>
      
      <h3 className="text-xl font-extrabold text-[#1a1a1a] font-sans mb-2">
        {title}
      </h3>
      
      <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#555] font-medium z-10">
        {text}
      </p>
    </article>
  );
};

const CourseSchedule = () => {
  const calculateTimeLeft = () => {
    const distance = Math.max(0, COURSE_START_TIME - Date.now());
    return {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance / 3600000) % 24),
      minutes: Math.floor((distance / 60000) % 60),
      seconds: Math.floor((distance / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-[#E8D8D4] bg-[#FFF4F1] p-4 sm:mt-5 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-3 text-left">
          <CalendarCheck className="h-5 w-5 shrink-0 text-[#B91C1C]" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-[#8A6B65]">
              Thời gian
            </p>
            <p className="mt-0.5 text-[15px] font-black text-[#242424] sm:text-base">
              6–7–8/07
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-3 text-left">
          <Video className="h-5 w-5 shrink-0 text-[#B91C1C]" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-[#8A6B65]">
              Hình thức
            </p>
            <p className="mt-0.5 text-[15px] font-black text-[#242424] sm:text-base">
              Học qua Zoom
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[#7A2113]">
        <Clock3 className="h-4 w-4" />
        <p className="text-[13px] font-black uppercase tracking-[0.08em]">
          Thời gian còn lại đến khai giảng
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          ["Ngày", timeLeft.days],
          ["Giờ", timeLeft.hours],
          ["Phút", timeLeft.minutes],
          ["Giây", timeLeft.seconds],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#B91C1C] px-1 py-2.5 text-center text-white">
            <p className="text-[22px] font-black leading-none tabular-nums sm:text-2xl">
              {String(value).padStart(2, "0")}
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-white/80">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ZALO_GROUP_LINK = "https://zalo.me/g/hx6v1zuwxgvulcnr7b2c"; // Đường dẫn nhóm Zalo học tập

const RegistrationModal = ({ isOpen, onClose }) => {
  const titleId = useId();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field) => (event) => {
    const value = field === "phone"
      ? event.target.value.replace(/[^\d+\s.-]/g, "")
      : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: false }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = form.name.trim();
    const phone = normalizeLeadPhoneDigits(form.phone);
    const referralCode = String(
      searchParams.get("ref") || searchParams.get("leader") || "cong-ty"
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    const nextErrors = {
      name: name.length < 2,
      phone: phone.length < 9 || phone.length > 11,
    };

    if (nextErrors.name || nextErrors.phone) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitToCRM({
        name,
        phone,
        email: "",
        targetFunnel: "ads",
        source_key: "chinh_phuc_muc_tieu_web",
        courseName: "Chinh Phục Mục Tiêu",
        note: "Đăng ký tư vấn từ landing Chinh Phục Mục Tiêu",
        sourceUrl: window.location.href,
        landingPageId: "chinh-phuc-muc-tieu",
        landingPageSlug: window.location.pathname,
        referrer: referralCode,
        referrer_type:
          referralCode === "cong-ty" ? "company_direct" : "employee_referral",
        introducedBy: referralCode,
        leader_utm: referralCode,
        leaderUtm: referralCode,
        leaderSlug: referralCode,
        utm_owner: referralCode,
        utm_owner_slug: referralCode,
        utm_source: searchParams.get("utm_source") || "website",
        utm_medium: searchParams.get("utm_medium") || "landing",
        utm_campaign: searchParams.get("utm_campaign") || "chinh_phuc_muc_tieu",
        utm_content: searchParams.get("utm_content") || "",
        utm_term: searchParams.get("utm_term") || "",
        userAgent: navigator.userAgent,
      });

      try {
        await addDoc(collection(db, "leads"), {
          name,
          phone,
          searchName: normalizeLeadSearchText(name),
          searchPhone: phone,
          searchKeywords: buildLeadSearchKeywords({ name, phone }),
          source: "chinh-phuc-muc-tieu",
          courseId: "chinh-phuc-muc-tieu",
          courseName: "Chinh Phục Mục Tiêu",
          landingPageId: "chinh-phuc-muc-tieu",
          landingPageSlug: window.location.pathname,
          referralCode,
          utmSource:
            searchParams.get("utm_source") ||
            (referralCode === "cong-ty" ? "company_direct" : "employee_referral"),
          utmMedium: searchParams.get("utm_medium") || "landing",
          utmCampaign:
            searchParams.get("utm_campaign") || "chinh_phuc_muc_tieu",
          sourceUrl: window.location.href,
          createdAt: Date.now(),
          status: "new",
        });
      } catch (firestoreError) {
        console.error("Không thể lưu bản sao lead vào Firestore:", firestoreError);
      }

      setForm({ name: "", phone: "" });
      setIsSuccess(true);
      toast.success("Đăng ký thành công!");

      // Tự động chuyển hướng đến nhóm Zalo sau 1.5 giây
      setTimeout(() => {
        window.location.href = ZALO_GROUP_LINK;
      }, 1500);
    } catch (error) {
      console.error("Lỗi gửi đăng ký:", error);
      toast.error("Chưa thể gửi đăng ký. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:p-8"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D8C8C4] sm:hidden" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ đăng ký"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-[#555] hover:bg-red-50 hover:text-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100"
        >
          <X className="h-6 w-6" />
        </button>

        {isSuccess ? (
          <div className="py-7 text-center font-sans">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700 shadow-sm animate-bounce-slow">
              <Check className="h-10 w-10" strokeWidth={3} />
            </div>
            <h2 id={titleId} className="text-2xl sm:text-3xl font-black text-[#242424]">
              Đăng ký thành công!
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-gray-600 font-semibold">
              Mali Edu đã nhận được thông tin. Hệ thống đang tự động chuyển hướng bạn tham gia nhóm Zalo học tập...
            </p>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Nếu trình duyệt không tự chuyển hướng, vui lòng nhấn nút dưới đây để tham gia:
            </p>
            <a
              href={ZALO_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#D62828] to-[#B91C1C] px-6 text-lg font-black text-white shadow-[0_8px_20px_rgba(214,40,40,0.25)] hover:shadow-[0_10px_25px_rgba(214,40,40,0.35)] transition-all active:scale-[0.98]"
            >
              THAM GIA NHÓM ZALO
            </a>
          </div>
        ) : (
          <>
            <div className="pr-9">
              <p className="font-bold uppercase tracking-wide text-[#B91C1C]">Đăng ký tư vấn</p>
              <h2 id={titleId} className="mt-2 text-[28px] font-black leading-tight text-[#242424] sm:text-3xl">
                Để lại thông tin của bạn
              </h2>
              <p className="mt-2.5 text-[17px] leading-7 text-[#555] sm:mt-3 sm:text-lg">
                Mali Edu sẽ gọi điện để tư vấn rõ ràng trước khi bạn quyết định tham gia.
              </p>
            </div>

            <form className="mt-5 space-y-4 sm:mt-7 sm:space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="goal-name" className="mb-2 block text-lg font-bold text-[#242424]">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]" />
                  <input
                    id="goal-name"
                    autoFocus
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    aria-invalid={errors.name || undefined}
                    className={`min-h-[56px] w-full rounded-xl border bg-white pl-12 pr-4 text-lg text-[#242424] outline-none focus:ring-4 ${
                      errors.name
                        ? "border-red-600 focus:ring-red-100"
                        : "border-[#D8C8C4] focus:border-[#D62828] focus:ring-red-100"
                    }`}
                    placeholder="Ví dụ: Nguyễn Văn An"
                  />
                </div>
                {errors.name ? <p className="mt-2 text-base font-semibold text-red-700">Vui lòng nhập họ và tên.</p> : null}
              </div>

              <div>
                <label htmlFor="goal-phone" className="mb-2 block text-lg font-bold text-[#242424]">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]" />
                  <input
                    id="goal-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    aria-invalid={errors.phone || undefined}
                    className={`min-h-[56px] w-full rounded-xl border bg-white pl-12 pr-4 text-lg text-[#242424] outline-none focus:ring-4 ${
                      errors.phone
                        ? "border-red-600 focus:ring-red-100"
                        : "border-[#D8C8C4] focus:border-[#D62828] focus:ring-red-100"
                    }`}
                    placeholder="Ví dụ: 0912 345 678"
                  />
                </div>
                {errors.phone ? <p className="mt-2 text-base font-semibold text-red-700">Vui lòng nhập số điện thoại hợp lệ.</p> : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-[#D62828] px-6 text-lg font-black text-white shadow-lg hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {isSubmitting ? "ĐANG GỬI..." : "ĐĂNG KÝ NGAY"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const VideoCard = ({ videoId, index, onPlay }) => {
  return (
    <article
      onClick={() => onPlay(videoId)}
      className="group w-[280px] sm:w-[350px] shrink-0 overflow-hidden rounded-3xl border border-[#F2E4E1] bg-white shadow-[0_12px_36px_rgba(214,40,40,0.04)] hover:shadow-[0_20px_45px_rgba(214,40,40,0.08)] hover:-translate-y-1 hover:border-[#D62828]/25 transition-all duration-300 cursor-pointer relative"
    >
      <div className="aspect-video bg-[#2A1717] relative overflow-hidden">
        {/* Thumbnail Image */}
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={`Kết quả học viên Mali Edu ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300" />
        
        {/* Glowing Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#D62828] to-[#B91C1C] text-white shadow-[0_8px_20px_rgba(214,40,40,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_25px_rgba(214,40,40,0.6)]">
            <svg 
              className="h-6 w-6 fill-current translate-x-0.5" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75 pointer-events-none scale-105 group-hover:animate-none" />
          </div>
        </div>
        
        {/* Info Tag at bottom-left */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A8A]" />
          Học viên chia sẻ
        </div>
      </div>
    </article>
  );
};

const VutTocMucTieu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [isHeroPngOk, setIsHeroPngOk] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(null);

  const openRegistration = () => setIsModalOpen(true);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFFDF8] text-[#242424] relative font-sans">
      {/* Thanh tiến trình cuộn trang cao cấp trên cùng */}
      <div 
        className="fixed top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D62828] via-[#FF6B6B] to-[#B91C1C] z-[100] origin-left transition-transform duration-75"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />
      <SEO
        title="Chinh Phục Mục Tiêu - Khóa Học 3 Buổi Miễn Phí"
        description="Đăng ký miễn phí khóa học 3 buổi Chinh Phục Mục Tiêu tại Mali Edu để biến mục tiêu thành kế hoạch rõ ràng và hành động thực tế."
        image={COURSE_IMAGE}
        url="/dao-tao/chinh-phuc-muc-tieu"
        preloadLcpImage={COURSE_IMAGE}
      />

      {/* TẬP TRUNG HỆ THỐNG BACKGROUND GLOWS SANG TRỌNG & MƯỢT MÀ */}
      <div className="absolute top-0 inset-x-0 h-full pointer-events-none overflow-hidden z-0">
        {/* Glow 1 - Hero top */}
        <div className="absolute top-[2%] left-[-15%] w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-amber-200/25 to-rose-200/15 blur-[80px] sm:blur-[120px] opacity-70" />
        
        {/* Glow 2 - Hero right */}
        <div className="absolute top-[5%] right-[-15%] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-to-br from-[#FFF4F1] to-red-100/20 blur-[90px] sm:blur-[130px] opacity-80" />
        
        {/* Glow 3 - Pain Points */}
        <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-rose-100/30 blur-[70px] sm:blur-[110px]" />
        
        {/* Glow 4 - Outcomes */}
        <div className="absolute top-[35%] right-[-10%] w-[350px] h-[350px] sm:w-[550px] sm:h-[550px] rounded-full bg-amber-100/25 blur-[90px] sm:blur-[120px]" />
        
        {/* Glow 5 - Modules */}
        <div className="absolute top-[55%] left-[-15%] w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] rounded-full bg-red-50/40 blur-[80px] sm:blur-[110px]" />
        
        {/* Glow 6 - Companion */}
        <div className="absolute top-[72%] right-[-10%] w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] rounded-full bg-amber-50/50 blur-[80px] sm:blur-[115px]" />
        
        {/* Glow 7 - FAQs */}
        <div className="absolute top-[88%] left-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-rose-100/15 blur-[70px] sm:blur-[100px]" />
      </div>



      <main className="relative z-10">
        {/* HERO SECTION DỰ PHÒNG HOÀN HẢO CHO CẢ BANNER VÀ PNG TÁCH NỀN */}
        <section className="pb-8 sm:pb-16 relative">
          {isHeroPngOk ? (
            /* Layout 1: HTML Cao cấp kết hợp ảnh PNG tách nền */
            <div className="px-4 pt-4 pb-6 sm:px-6 sm:py-16 mx-auto max-w-6xl relative z-10">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7 text-left flex flex-col items-start font-sans">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-[#B91C1C] bg-[#FFF4F1] border border-red-100/80 mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-[#D62828] animate-pulse" />
                    Khóa học trực tuyến 3 buổi • Hoàn toàn miễn phí
                  </span>
                  
                  <h1 className="text-[32px] font-black tracking-tight text-[#1a1a1a] sm:text-5xl lg:text-6xl leading-[1.2] sm:leading-[1.15]">
                    Chinh Phục <br className="hidden sm:inline" />
                    <span className="text-[#D62828] bg-gradient-to-r from-[#D62828] to-[#B91C1C] bg-clip-text">Mục Tiêu 2026</span>
                  </h1>
                  
                  <p className="mt-3 text-[17px] sm:text-lg text-[#242424] leading-relaxed max-w-xl font-medium">
                    Đánh thức kỷ luật tiềm thức, làm chủ Bánh Xe Cuộc Đời và thiết lập lộ trình hành động thực tế để đạt được mọi mục tiêu bạn mong muốn trong cuộc sống.
                  </p>
                  
                  {/* Ảnh PNG hiển thị trên Mobile (nằm giữa nội dung và nút bấm) */}
                  <div className="w-full my-6 flex justify-center lg:hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/15 to-red-200/15 rounded-full blur-2xl z-0 scale-75" />
                    <img
                      src={HERO_IMAGE}
                      alt="Chinh Phục Mục Tiêu 2026"
                      width="450"
                      height="450"
                      fetchPriority="high"
                      onError={() => setIsHeroPngOk(false)}
                      className="relative z-10 w-full max-w-[280px] object-contain drop-shadow-[0_12px_24px_rgba(214,40,40,0.1)] active:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="w-full sm:w-auto mt-2 flex flex-col gap-4">
                    <CtaButton onClick={openRegistration} />
                    <CourseSchedule />
                  </div>
                </div>
                
                {/* Ảnh PNG hiển thị trên Desktop */}
                <div className="hidden lg:col-span-5 lg:flex justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/20 to-red-200/20 rounded-full blur-3xl z-0" />
                  <img
                    src={HERO_IMAGE}
                    alt="Chinh Phục Mục Tiêu 2026"
                    width="500"
                    height="500"
                    fetchPriority="high"
                    onError={() => setIsHeroPngOk(false)}
                    className="relative z-10 w-full max-w-[400px] object-contain drop-shadow-[0_15px_32px_rgba(214,40,40,0.12)] hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Layout 2: Fallback hiển thị banner ảnh JPG gốc khi chưa có ảnh PNG */
            <div className="mx-auto max-w-6xl">
              {/* Phiên bản Mobile (md:hidden) - Giữ nguyên layout cũ của bạn */}
              <div className="md:hidden">
                <div className="aspect-[3/2] w-full overflow-hidden rounded-b-[26px] bg-[#F5E7E3] shadow-[0_8px_28px_rgba(80,25,20,0.08)] sm:rounded-none sm:shadow-none">
                  <img
                    src={COURSE_IMAGE}
                    alt="Khóa học Chinh Phục Mục Tiêu tại Mali Edu"
                    width="1200"
                    height="800"
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="px-4 pt-6 text-center sm:px-6 sm:pt-9">
                  <CtaButton onClick={openRegistration} />
                  <CourseSchedule />
                </div>
              </div>

              {/* Phiên bản Desktop (hidden md:grid) - Thiết kế 2 cột sang trọng không ảnh hưởng Mobile */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-8 md:items-center md:py-8 px-4 sm:px-6">
                {/* Cột trái: Ảnh banner JPG tỉ lệ 3:2 có shadow và card bóng đổ 3D offset */}
                <div className="md:col-span-7 relative">
                  {/* Khung viền bóng đỏ phía sau tạo chiều sâu 3D */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D62828] to-[#B91C1C] rounded-[32px] translate-x-3.5 translate-y-3.5 z-0 opacity-[0.08]" />
                  
                  <div className="relative z-10 aspect-[3/2] w-full overflow-hidden rounded-[32px] border border-[#F2E4E1] bg-[#FFFBF9] shadow-[0_20px_50px_rgba(214,40,40,0.12)]">
                    <img
                      src={COURSE_IMAGE}
                      alt="Khóa học Chinh Phục Mục Tiêu tại Mali Edu"
                      width="1200"
                      height="800"
                      fetchPriority="high"
                      className="h-full w-full object-cover hover:scale-[1.015] transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Cột phải: Thông tin tiêu đề, mô tả, nút CTA đăng ký và đồng hồ đếm ngược */}
                <div className="md:col-span-5 text-left flex flex-col items-start font-sans pl-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-[#B91C1C] bg-[#FFF4F1] border border-red-100/80 mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-[#D62828] animate-pulse" />
                    Khóa học trực tuyến 3 buổi • Hoàn toàn miễn phí
                  </span>
                  
                  <p className="text-[15px] text-gray-600 leading-relaxed font-semibold mb-6">
                    Hãy tham gia cùng hàng ngàn học viên để giải mã bản thiết kế mục tiêu cuộc đời, thiết lập lộ trình bứt tốc và kỷ luật tâm thức ngay hôm nay.
                  </p>

                  <div className="w-full mb-2">
                    <CtaButton onClick={openRegistration} className="!w-full" />
                  </div>

                  <div className="w-full">
                    {/* Loại bỏ khoảng cách margin-top mặc định của CourseSchedule để cân đối hơn */}
                    <div className="[&>div]:!mt-0">
                      <CourseSchedule />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION NỖI ĐAU (PAIN POINTS) - NỀN GRADIENT ĐÀO ẤM ÁP */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-gradient-to-b from-[#FFFDF8] via-[#FFF3F0] to-white border-t border-b border-[#F5E5E2]/40">
          <div className="mx-auto max-w-6xl relative z-10">
            <SectionHeading
              eyebrow="Bạn có đang gặp tình trạng này?"
              title={<>Đâu là vấn đề <br className="sm:hidden" /> bạn đang gặp hiện tại?</>}
              description="Bạn không thiếu mục tiêu. Bạn chỉ cần một lộ trình đúng để bắt đầu."
            />
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {painPoints.map((item, index) => (
                <div 
                  key={item} 
                  className="flex items-start gap-4 rounded-3xl border border-white/60 bg-gradient-to-br from-white/90 to-[#FFFDFB]/85 backdrop-blur-md p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(214,40,40,0.06)] hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden group z-10"
                >
                  {/* Đường viền nổi bật bên trái xuất hiện mượt mà khi hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#D62828] to-[#B91C1C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Container Icon X đỏ cao cấp */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/80 text-[#D62828] border border-red-200/40 shadow-sm relative group-hover:scale-105 transition-transform duration-300">
                    <X className="h-5 w-5" strokeWidth={3.5} />
                  </div>
                  
                  {/* Nội dung rào cản */}
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B91C1C] mb-1.5 opacity-75">
                      Rào cản 0{index + 1}
                    </span>
                    <p className="text-[16px] sm:text-[18px] font-bold leading-relaxed text-[#242424] font-sans">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION KẾT QUẢ ĐẠT ĐƯỢC (OUTCOMES) - NỀN TRẮNG TINH KHIẾT */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-white">
          <div className="mx-auto max-w-6xl relative z-10">
            <div className="px-4 sm:px-0">
              <SectionHeading
                eyebrow="Bạn nhận được gì từ khóa học?"
                title={
                  <>
                    <span className="lg:block">Hành trình chuyển hóa </span>
                    <span className="lg:block">từ mục tiêu đến kết quả</span>
                  </>
                }
                description={
                  <>
                    <span className="lg:block">Trang bị phương pháp thực chiến giúp bạn tháo gỡ trì hoãn, </span>
                    <span className="lg:block">kỷ luật bản thân và cán đích xuất sắc.</span>
                  </>
                }
              />
            </div>
            
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-8 sm:mt-12">
              {outcomes.map(({ icon, title, text }, index) => (
                <OutcomeCard 
                  key={title} 
                  icon={icon} 
                  title={title} 
                  text={text} 
                  index={index} 
                />
              ))}
            </div>

            <div className="mt-10 sm:mt-12 px-4 text-center sm:px-0">
              <CtaButton onClick={openRegistration} label="GIỮ CHỖ HỌC MIỄN PHÍ" />
            </div>
          </div>
        </section>

        {/* SECTION NỘI DUNG 3 BUỔI HỌC (MODULES) - NỀN GRADIENT HỒNG ĐÀO HÀO HÒA */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-gradient-to-b from-white via-[#FFF5F1] to-[#FFFDFB] border-t border-b border-[#F5E5E2]/40 overflow-hidden">
          {/* Bong bóng phát sáng nhẹ tạo độ sâu cho nền */}
          <div className="absolute top-1/4 -left-36 w-80 h-80 rounded-full bg-[#FFF0EC] blur-3xl opacity-60 pointer-events-none z-0" />
          <div className="absolute bottom-1/4 -right-36 w-80 h-80 rounded-full bg-[#FFF3EE] blur-3xl opacity-70 pointer-events-none z-0" />

          <div className="mx-auto max-w-4xl relative z-10">
            <SectionHeading
              eyebrow="Nội dung chi tiết chương trình"
              title={<>Lộ trình học tập <br className="sm:hidden" /> trong 3 buổi Zoom</>}
              description="Mỗi buổi học được thiết kế để giải quyết triệt để từng rào cản và trang bị tư duy thực chiến."
            />
            
            <div className="space-y-4 relative">
              {/* Trục timeline chạy dọc nối kết các buổi học trên desktop, căn chỉnh khớp hoàn hảo với viền đỏ của thẻ */}
              <div className="absolute left-[2px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-[#D62828] via-[#FFF4F1] to-[#B91C1C] hidden md:block z-0 opacity-60" />
              
              {modules.map((module) => (
                <ModuleCard key={module.number} module={module} />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION CHIA SẺ HỌC VIÊN - NỀN HỒNG ĐÀO NHẸ */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-[#FFF8F7] border-t border-b border-[#F5E5E2]/30 overflow-hidden">
          {/* Style định nghĩa hiệu ứng chạy vô tận mượt mà sang trái */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-wrapper {
              display: flex;
              width: max-content;
              gap: 1.5rem;
              animation: marquee-left 45s linear infinite;
            }
            .marquee-wrapper:hover {
              animation-play-state: paused;
            }
          `}} />

          {/* Bong bóng phát sáng nhẹ tạo độ sâu cho nền */}
          <div className="absolute top-1/4 -left-36 w-80 h-80 rounded-full bg-[#FFF0EC] blur-3xl opacity-60 pointer-events-none z-0" />
          <div className="absolute bottom-1/4 -right-36 w-80 h-80 rounded-full bg-[#FFF3EE] blur-3xl opacity-70 pointer-events-none z-0" />

          <div className="mx-auto max-w-6xl relative z-10">
            <div className="px-4 sm:px-0">
              <SectionHeading
                eyebrow="Cảm nhận từ học viên"
                title="Hành trình bứt tốc mục tiêu và chuyển hóa thực tế"
                description="Những chia sẻ chân thực từ học viên sau khi đồng hành cùng các khóa học của Mali Edu."
              />
            </div>
            
            {/* Container bao bọc phần chạy marquee có viền làm mờ 2 bên cạnh */}
            <div className="relative w-full overflow-hidden py-4">
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FFF8F7] via-[#FFF8F7]/80 to-transparent z-20 pointer-events-none hidden md:block" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FFF8F7] via-[#FFF8F7]/80 to-transparent z-20 pointer-events-none hidden md:block" />
              
              <div 
                className="marquee-wrapper"
                style={{ animationPlayState: playingVideo ? 'paused' : 'running' }}
              >
                {[...studentVideos, ...studentVideos].map((videoId, index) => (
                  <VideoCard
                    key={`${videoId}-${index}`}
                    videoId={videoId}
                    index={index % studentVideos.length}
                    onPlay={setPlayingVideo}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-8 px-4 text-center sm:mt-10 sm:px-0">
              <CtaButton onClick={openRegistration} />
            </div>
          </div>
        </section>

        {/* SECTION ĐỐI TƯỢNG PHÙ HỢP - NỀN KEM NHẸ */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-[#FFFDF8]">
          <div className="mx-auto grid max-w-6xl gap-6 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center relative z-10">
            <div className="rounded-3xl bg-gradient-to-br from-[#B91C1C] to-[#8B2E2E] p-6 text-white shadow-xl sm:p-10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <Sparkles className="h-10 w-10 text-[#FFD5CB] sm:h-12 sm:w-12 animate-pulse" />
              <h2 className="mt-4 text-[26px] font-black leading-tight sm:mt-6 sm:text-4xl font-sans">
                Chương trình phù hợp với bạn nếu...
              </h2>
              <p className="mt-3 text-[17px] leading-relaxed text-white/90 sm:mt-4 sm:text-base sm:leading-7 font-sans font-semibold">
                Bạn thực sự muốn thiết lập cuộc sống trật tự, kỷ luật thói quen và muốn sở hữu một lộ trình hành động có kết quả vượt bậc mà không mất học phí.
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {audiences.map((item) => (
                <div 
                  key={item} 
                  className="flex gap-3.5 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-4 sm:gap-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.03)] transition-all"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 shadow-sm">
                    <Check className="h-4.5 w-4.5" strokeWidth={3} />
                  </div>
                  <p className="text-[17px] font-bold leading-relaxed text-[#111] font-sans">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION ĐỒNG HÀNH CÙNG MALI EDU - NỀN KEM ĐỒNG BỘ */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-[#FFFDF8] overflow-hidden">
          {/* Bong bóng phát sáng nhẹ tạo độ sâu cho nền */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FFF3F0]/60 blur-3xl opacity-70 pointer-events-none z-0" />

          <div className="mx-auto max-w-5xl lg:max-w-6xl relative z-10">
            <div className="px-4 sm:px-0">
              <SectionHeading
                eyebrow="Đồng hành cùng Mali Edu"
                title="Chúng tôi cam kết giúp bạn tháo gỡ khó khăn"
              />
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
              {[
                [<Compass key="compass" className="h-7 w-7" />, "Hướng dẫn rõ ràng", "Nội dung đi thẳng vào gốc rễ vấn đề, trình bày từng bước cực kỳ trực quan."],
                [<HeartHandshake key="heart" className="h-7 w-7" />, "Đồng hành tận tâm", "Đội ngũ support hỗ trợ chu đáo để bạn giải quyết đúng vướng mắc của mình."],
                [<CalendarCheck key="calendar" className="h-7 w-7" />, "Tập trung thực hành", "Thiết lập kế hoạch hành động ngay trong các buổi học trực tiếp."],
              ].map(([icon, title, text], index) => (
                <article 
                  key={title} 
                  className="group w-[80vw] max-w-[290px] shrink-0 snap-center rounded-3xl border border-[#F2E4E1] bg-gradient-to-br from-white to-[#FFFBF9] p-6 text-left shadow-[0_12px_36px_rgba(214,40,40,0.04)] md:w-auto md:max-w-none md:p-7 md:text-center hover:shadow-[0_20px_45px_rgba(214,40,40,0.08)] hover:-translate-y-1 hover:border-[#D62828]/25 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Watermark số thứ tự chìm nghệ thuật */}
                  <div className="absolute right-4 bottom-2 text-6xl font-sans font-black select-none pointer-events-none opacity-[0.02] text-[#B91C1C] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-300">
                    0{index + 1}
                  </div>

                  {/* Icon Container có khung viền kép và hiệu ứng xoay nhẹ khi hover */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF3F0] to-[#FFF0EC] text-[#B91C1C] border border-[#FADCD5]/60 shadow-[0_4px_12px_rgba(214,40,40,0.03)] md:mx-auto md:h-14 md:w-14 md:rounded-[20px] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                    {icon}
                  </div>

                  <h3 className="mt-4 text-xl font-black text-[#1a1a1a] md:mt-5 md:text-xl font-sans transition-colors duration-300 group-hover:text-[#B91C1C]">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-[16px] leading-relaxed text-gray-600 font-semibold md:mt-3 font-sans">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION NHÀ HUẤN LUYỆN (COACHES) - NỀN CHUYỂN TIẾP TỪ KEM SANG TRẮNG */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-gradient-to-b from-[#FFFDF8] via-[#FFF8F6] to-white border-t border-[#F5E5E2]/40 overflow-hidden">
          {/* Bong bóng phát sáng nhẹ tạo độ sâu cho nền */}
          <div className="absolute top-1/4 -right-36 w-80 h-80 rounded-full bg-[#FFF0EC] blur-3xl opacity-60 pointer-events-none z-0" />
          <div className="absolute bottom-1/4 -left-36 w-80 h-80 rounded-full bg-[#FFF3EE] blur-3xl opacity-70 pointer-events-none z-0" />

          <div className="mx-auto max-w-5xl relative z-10">
            <SectionHeading
              eyebrow="Người dẫn đường tận tâm"
              title="Đội Ngũ Đào Tạo & Huấn Luyện"
              description="Những người đồng hành tâm huyết luôn sẵn sàng dẫn dắt bạn trên hành trình chinh phục mục tiêu cuộc sống."
            />

            <div className="mt-12 sm:mt-16 space-y-16 sm:space-y-24 lg:space-y-10">
              {coaches.map((coach, index) => {
                const isEven = index % 2 === 0;
                return (
                  <article 
                    key={coach.name}
                    className={`flex flex-col ${
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    } gap-8 md:gap-12 items-center lg:items-start lg:gap-10 lg:rounded-[32px] lg:border lg:border-[#F0DEDA] lg:bg-white/90 lg:p-8 xl:p-10 lg:shadow-[0_20px_55px_rgba(80,25,20,0.07)]`}
                  >
                    {/* Cột 1: Ảnh chân dung tỉ lệ 3:2 có viền trang trí đổ bóng 3D */}
                    <div className="w-full md:w-[40%] shrink-0 flex justify-center lg:w-[38%] lg:sticky lg:top-8">
                      <div className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-none aspect-[3/2]">
                        {/* Shadow box trang trí phía sau */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D62828] to-[#B91C1C] rounded-[24px] translate-x-3.5 translate-y-3.5 z-0 opacity-[0.08] lg:translate-x-2.5 lg:translate-y-2.5" />
                        
                        {/* Ảnh huấn luyện viên */}
                        <img
                          src={coach.image}
                          alt={coach.name}
                          className="relative z-10 w-full h-full object-cover rounded-[24px] shadow-[0_15px_35px_rgba(214,40,40,0.08)] border border-[#F2E4E1] hover:scale-[1.01] transition-transform duration-300 lg:rounded-[22px]"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Cột 2: Nội dung mô tả chi tiết */}
                    <div className="w-full md:w-[60%] text-left font-sans flex flex-col items-start lg:w-[62%] lg:min-w-0">
                      <span className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#B91C1C] mb-1 lg:rounded-full lg:border lg:border-red-100 lg:bg-[#FFF5F2] lg:px-3 lg:py-1.5 lg:tracking-[0.12em]">
                        {coach.subtitle}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight mb-2 uppercase lg:mt-3 lg:text-[32px] lg:leading-tight">
                        {coach.name}
                      </h3>
                      <p className="text-sm sm:text-base font-extrabold text-[#8A6B65] uppercase tracking-wider mb-5 lg:text-[15px] lg:leading-6 lg:tracking-[0.08em]">
                        {coach.role}
                      </p>
                      
                      <p className="text-base sm:text-[17px] leading-relaxed text-gray-700 font-semibold mb-6 lg:max-w-[720px] lg:text-[16px] lg:leading-7 lg:font-medium">
                        {coach.bio}
                      </p>

                      {/* Danh sách các thế mạnh/giá trị */}
                      <div className="space-y-4 w-full mb-6 border-t border-gray-100 pt-5 lg:space-y-3 lg:rounded-2xl lg:border lg:border-[#F1E4E0] lg:bg-[#FFFCFB] lg:p-5">
                        {coach.details.map(([key, val]) => (
                          <div key={key} className="flex items-start gap-3 lg:rounded-xl lg:bg-white lg:px-4 lg:py-3 lg:shadow-[0_4px_14px_rgba(80,25,20,0.035)]">
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#B91C1C] border border-red-100/60 shadow-sm lg:h-7 lg:w-7">
                              <Sparkles className="h-3 w-3" />
                            </span>
                            <p className="text-[15px] sm:text-base leading-relaxed text-gray-700 font-semibold lg:text-[15px] lg:leading-6 lg:font-medium">
                              <strong className="text-[#1a1a1a] font-extrabold lg:block lg:mb-1 lg:text-[16px]">{key}</strong>
                              {val}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Câu danh ngôn (Quote) trích dẫn đặc sắc */}
                      <div className="relative w-full bg-gradient-to-br from-[#FFF5F1] to-[#FFF0EC] p-5 sm:p-6 rounded-2xl border border-[#FADCD5]/60 shadow-[0_4px_15px_rgba(214,40,40,0.02)] overflow-hidden lg:border-l-4 lg:border-l-[#D62828] lg:px-6 lg:py-5">
                        <div className="absolute right-4 top-2 text-6xl font-serif font-black select-none pointer-events-none opacity-[0.06] text-[#B91C1C]">“</div>
                        <p className="relative z-10 text-[15px] sm:text-[16px] italic leading-relaxed text-gray-700 font-semibold lg:text-[15px] lg:leading-7 lg:font-medium">
                          "{coach.quote}"
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION CÂU HỎI THƯỜNG GẶP (FAQS) - NỀN TRẮNG */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 relative bg-white">
          <div className="mx-auto max-w-3xl relative z-10">
            <SectionHeading 
              eyebrow="Giải đáp thắc mắc" 
              title="Những câu hỏi thường gặp nhất" 
              titleClassName="text-[19px] min-[375px]:text-[21px] min-[410px]:text-[23px] sm:text-4xl whitespace-nowrap"
            />
            <div className="space-y-3 px-4 sm:px-0">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <article 
                    key={item.question} 
                    className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      className="flex min-h-[60px] w-full items-center justify-between gap-3 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-red-100 sm:px-6"
                    >
                      <span className="text-[18px] font-black leading-snug text-[#1a1a1a] sm:text-lg">
                        {item.question}
                      </span>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-[#B91C1C] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen ? (
                      <p className="border-t border-[#F0E3DF]/50 px-5 py-4 text-[17px] leading-relaxed text-[#222] sm:px-6 sm:py-4 font-sans animate-fade-in font-medium">
                        {item.answer}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION ĐĂNG KÝ CUỐI TRANG */}
        <section className="bg-gradient-to-br from-[#B91C1C] to-[#8B2E2E] px-4 py-14 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50" />
          <div className="mx-auto max-w-3xl relative z-10 flex flex-col items-center">
            <Target className="h-12 w-12 text-[#FFD5CB] sm:h-14 sm:w-14 animate-bounce-slow" />
            <h2 className="mt-4 text-[26px] font-black leading-tight sm:mt-5 sm:text-4xl font-sans max-w-xl">
              Mục tiêu chỉ trở thành kết quả khi bạn bắt đầu hành động
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[16px] sm:text-[17px] leading-relaxed text-white/90">
              Đăng ký nhận vé tham gia Zoom hoàn toàn miễn phí ngay hôm nay để Mali Edu xác nhận chỗ và gửi lịch học sớm nhất cho bạn.
            </p>
            <CtaButton
              onClick={openRegistration}
              label="ĐĂNG KÝ NHẬN VÉ MIỄN PHÍ"
              className="mt-6 !bg-white !bg-none !text-[#B91C1C] hover:!bg-[#FFF4F1] hover:!text-[#8B2E2E] sm:mt-8 shadow-2xl"
            />
          </div>
        </section>
      </main>

      <Footer />

      {/* FLOATING MOBILE CTA ISLAND (THIẾT KẾ ĐẢO DI ĐỘNG CỰC KỲ CAO CẤP) */}
      <div className="h-[92px] sm:hidden" aria-hidden="true" />
      <div className="fixed bottom-4 inset-x-4 z-40 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-2.5 shadow-[0_12px_32px_rgba(214,40,40,0.12)] flex justify-between items-center sm:hidden transition-all duration-300">
        <div className="flex flex-col pl-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B91C1C] opacity-90 font-sans">Vé Học Qua Zoom</span>
          <span className="text-[15px] font-black text-[#1a1a1a] tracking-tight font-sans">MIỄN PHÍ 100%</span>
        </div>
        <CtaButton 
          onClick={openRegistration} 
          label="ĐĂNG KÝ NGAY" 
          className="!min-h-[46px] !w-auto !min-w-[135px] !rounded-xl !py-2.5 !text-xs !px-4 !shadow-md !from-[#D62828] !to-[#B91C1C]" 
        />
      </div>

      <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Lightbox xem video cảm nhận học viên */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#1A0B0B]">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${playingVideo}?autoplay=1&rel=0`}
              title="Cảm nhận từ học viên Mali Edu"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* Nút đóng góc trên bên phải */}
            <button
              type="button"
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all border border-white/20"
              aria-label="Đóng video"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VutTocMucTieu;
