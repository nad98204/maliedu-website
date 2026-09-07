import { useState } from "react";
import { Link } from "react-router";
import {
  Sun,
  Heart,
  Sparkles,
  Flame,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  MoveUpRight,
  Gift,
  BookOpen,
  Users,
  Quote,
  Smile,
  Compass,
  ChevronDown,
  Zap,
  HandHeart,
  Headphones,
  Check,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import SEO from "../../components/SEO";
import { ROUTE_SEO } from "../../seo/siteRoutes";
import "./NguyenMongThanh.css";

// Hình ảnh thực tế từ các chương trình và hoạt động đào tạo
const profileImages = {
  portrait: {
    src: "/assets/about/nguyen-mong-thanh/nguyen-mong-thanh-chan-dung.jpg",
    alt: "Nhà đào tạo Nguyễn Mong Thành - Nụ cười ấm áp, truyền cảm hứng",
    caption: "Nguyễn Mong Thành · Người Đồng Hành & Phụng Sự",
  },
  workshop: {
    src: "/assets/about/nguyen-mong-thanh/nguyen-mong-thanh-dao-tao.jpg",
    alt: "Nguyễn Mong Thành đứng lớp truyền lửa năng lượng tích cực cho học viên",
    caption: "Khoảnh khắc thắp sáng niềm tin cùng hàng trăm học viên",
  },
  teaching: {
    src: "/assets/landing/khoi-thong-dong-tien/founder-day-hoc.webp",
    alt: "Buổi giảng dạy tận tâm từng chi tiết của thầy Nguyễn Mong Thành",
    caption: "Tận tâm chia sẻ bài học thực chiến từ trái tim",
  },
  healing: {
    src: "/assets/landing/khoi-thong-dong-tien/founder-am-thi.webp",
    alt: "Phiên thiền dẫn thôi miên chữa lành tiềm thức",
    caption: "Giây phút lắng đọng, chữa lành và kết nối nội tâm",
  },
  community: {
    src: "/assets/landing/luat-hap-dan/luat-hap-dan-k47.jpg",
    alt: "Cộng đồng học viên K47 ngập tràn nụ cười và năng lượng",
    caption: "Cộng đồng học viên trao nhau tình yêu thương & lòng biết ơn",
  },
};

// Menu điều hướng nhanh
const quickNav = [
  { id: "tam-tinh", label: "Lời tâm tình" },
  { id: "tru-cot", label: "4 Trụ cột cho đi" },
  { id: "chuyen-hoa", label: "Chuyển hóa năng lượng" },
  { id: "phuong-phap", label: "Phương pháp đào tạo" },
  { id: "linh-vuc", label: "7 Lĩnh vực gieo hạt" },
  { id: "khoa-hoc", label: "Chương trình tiêu biểu" },
  { id: "khoanh-khac", label: "Hình ảnh lớp học" },
  { id: "cau-chuyen-hoc-vien", label: "Chuyện học viên" },
  { id: "qua-tang", label: "Món quà tri ân" },
  { id: "faq", label: "Hỏi đáp" },
];

// 4 Trụ cột năng lượng & Triết lý sống
const corePillars = [
  {
    icon: HandHeart,
    number: "01",
    title: "Tâm Cho Đi (Givers Gain)",
    tag: "Phụng sự vô điều kiện",
    color: "amber",
    desc: "Càng trao đi giá trị chân thành bằng cả tấm lòng, cuộc sống sẽ tự nhiên hồi đáp bằng sự đủ đầy, bình an và những điều kỳ diệu vượt ngoài mong đợi.",
    quote: "Cho đi là còn mãi • Hạnh phúc nhân đôi khi sẻ chia",
  },
  {
    icon: Heart,
    number: "02",
    title: "Lòng Biết Ơn (Deep Gratitude)",
    tag: "Gốc rễ của thịnh vượng",
    color: "rose",
    desc: "Biết ơn những gì đang có là chiếc chìa khóa vạn năng để mở cánh cửa đón nhận những điều tốt đẹp hơn. Nghịch cảnh cũng là món quà để ta trưởng thành.",
    quote: "Biết ơn để đủ đầy • Tha thứ để tự do",
  },
  {
    icon: Flame,
    number: "03",
    title: "Ngọn Lửa Nhiệt Huyết (Ignite Passion)",
    tag: "Động lực bứt phá",
    color: "orange",
    desc: "Động lực kéo bạn thức dậy mỗi sớm mai với niềm hân hoan. Không có ai sinh ra để sống nhỏ bé, bạn luôn có sẵn một con người phi thường đang chờ tỏa sáng.",
    quote: "Đừng bao giờ từ bỏ ước mơ của chính mình",
  },
  {
    icon: Compass,
    number: "04",
    title: "Kỷ Luật Trong Yêu Thương (Loving Discipline)",
    tag: "Hành động kiên định",
    color: "emerald",
    desc: "Kỷ luật không phải là gò ép hay trừng phạt, mà là cam kết yêu thương và tôn trọng tương lai của bản thân, thực hiện những điều đúng đắn mỗi ngày.",
    quote: "Một bước đi nhỏ hôm nay kiến tạo kỳ tích ngày mai",
  },
];

// So sánh trạng thái năng lượng
const energyComparison = [
  {
    from: "Sống trong nỗi sợ, lo âu và nghi ngờ chính mình",
    to: "Tự tin, bình an và vững tin vào giá trị độc bản của bản thân",
  },
  {
    from: "Bế tắc về tài chính, căng thẳng và áp lực nợ nần",
    to: "Khơi thông dòng tiền, nhìn thấy cơ hội và đón nhận thịnh vượng",
  },
  {
    from: "Trì hoãn, cảm xúc trồi sụt, mất phương hướng cuộc sống",
    to: "Hành động có kỷ luật trong hân hoan, mục tiêu rõ ràng mỗi ngày",
  },
  {
    from: "Trách móc hoàn cảnh, bám chấp vào tổn thương quá khứ",
    to: "Biết ơn nghịch cảnh, tha thứ từ tâm và nhẹ nhõm bước tiếp",
  },
];

// 5 Tầng chuyển hóa
const transformationSteps = [
  {
    step: "01",
    title: "Nhận thức tỉnh thức",
    desc: "Nhìn thẳng vào thực tại, nhận diện tiếng nói nhỏ và nỗi sợ vô hình đang kìm hãm bạn.",
  },
  {
    step: "02",
    title: "Gỡ bỏ niềm tin giới hạn",
    desc: "Chữa lành đứa trẻ bên trong, tha thứ cho quá khứ và tái lập tư duy đủ đầy.",
  },
  {
    step: "03",
    title: "Nâng cao tần số rung động",
    desc: "Thực hành lòng biết ơn, sống trong tình yêu thương và sự hân hoan đón nhận.",
  },
  {
    step: "04",
    title: "Hành động có kỷ luật",
    desc: "Biến khát khao thành những việc làm cụ thể mỗi ngày, kiên trì không bỏ cuộc.",
  },
  {
    step: "05",
    title: "Hoa trái ngọt lành",
    desc: "Tài chính lưu thông, mối quan hệ hòa hợp và một tâm hồn tự do, viên mãn.",
  },
];

// 7 Lĩnh vực gieo hạt
const trainingAreas = [
  {
    icon: Sparkles,
    title: "Luật Hấp Dẫn Thực Chiến",
    badge: "Tần số năng lượng",
    desc: "Không phải ngồi cầu nguyện viển vông. Học cách nâng cao tần số rung động tích cực để nhìn thấy cơ hội mới và hành động mạnh mẽ.",
  },
  {
    icon: Sun,
    title: "Vận Hành & Làm Chủ Tiềm Thức",
    badge: "Khai phóng nội tâm",
    desc: "Thấu hiểu ngôn ngữ của tiềm thức, giải mã những mô thức lặp lại trong quá khứ để tự do thiết lập lại cuộc đời mong ước.",
  },
  {
    icon: Zap,
    title: "Khơi Thông Dòng Tiền Thịnh Vượng",
    badge: "Chữa lành tài chính",
    desc: "Gỡ bỏ mặc cảm và nỗi sợ về tiền bạc. Xây dựng mối quan hệ hòa hợp, yêu thương với tiền để dòng tiền tự nhiên tuôn chảy.",
  },
  {
    icon: Flame,
    title: "Đánh Thức Mục Tiêu & Bản Lĩnh",
    badge: "Truyền lửa hành động",
    desc: "Biến ước mơ thành bản đồ hành động rõ ràng. Vượt qua sự trì hoãn, xây dựng sự tự tin và lòng quả cảm vượt qua mọi thử thách.",
  },
  {
    icon: HandHeart,
    title: "Kinh Doanh Bằng Sự Tử Tế & Cho Đi",
    badge: "Kinh doanh từ tâm",
    desc: "Bán hàng là phụng sự và giúp đỡ khách hàng. Khi bạn kinh doanh với trái tim chân thành, khách hàng và đối tác sẽ tự tìm đến.",
  },
  {
    icon: Heart,
    title: "Nuôi Dưỡng Nội Lực & Bình An",
    badge: "Cân bằng cảm xúc",
    desc: "Làm chủ cảm xúc trước áp lực sóng gió, giữ được sự tĩnh tại trong tâm trí và xây dựng những mối quan hệ gia đình yêu thương gắn kết.",
  },
  {
    icon: Compass,
    title: "Kỷ Luật Tự Thân Trong Biết Ơn",
    badge: "Thói quen thành công",
    desc: "Xây dựng thói quen tốt mỗi sớm mai: thiền định, biết ơn, tập luyện và kỷ luật hành động với niềm vui chứ không phải gồng ép.",
  },
];

// 3 Khóa học cốt lõi
const featuredCourses = [
  {
    id: "khoi-thong-dong-tien",
    title: "Khơi Thông Dòng Tiền",
    subtitle: "Chương trình phụng sự cộng đồng lớn nhất của Mali Edu",
    badge: "🌟 Khóa học cộng đồng",
    duration: "4 Buổi Zoom Trực Tiếp Chuyên Sâu",
    desc: "Giải phóng nỗi sợ hãi, niềm tin thiếu thốn về tiền bạc. Kết nối lại tình yêu với dòng tiền và cài đặt tư duy thịnh vượng bền vững.",
    features: [
      "Nhận diện 5 nút thắt vô hình chặn đứng dòng tiền",
      "Thực hành thiền dẫn khơi thông năng lượng tài chính",
      "Bài tập chuyển hóa niềm tin gốc rễ về sự giàu có",
      "Đồng hành và hỏi đáp trực tiếp cùng Thầy Mong",
    ],
    ctaText: "Khám phá chi tiết chương trình",
    ctaLink: "/dao-tao/khoi-thong-dong-tien",
    highlight: true,
  },
  {
    id: "luat-hap-dan",
    title: "Luật Hấp Dẫn Ứng Dụng Thực Chiến",
    subtitle: "Khai phóng sức mạnh tiềm thức và tần số rung động",
    badge: "✨ Ứng dụng thực tế",
    duration: "Lộ trình chuyển hóa chuyên sâu",
    desc: "Ứng dụng quy luật tự nhiên vào đời sống thực tế, công việc kinh doanh và mối quan hệ để thu hút quý nhân và những cơ hội tuyệt vời.",
    features: [
      "Nguyên lý vận hành của vũ trụ & trường năng lượng",
      "Cách phát sóng mong muốn đúng cách đến tiềm thức",
      "Bí quyết duy trì năng lượng đỉnh cao mỗi ngày",
      "Kế hoạch hành động song hành cùng luật hấp dẫn",
    ],
    ctaText: "Tìm hiểu chương trình",
    ctaLink: "/dao-tao/luat-hap-dan",
    highlight: false,
  },
  {
    id: "vut-toc-muc-tieu",
    title: "Vút Tốc Mục Tiêu & Làm Chủ Tiềm Thức",
    subtitle: "Bứt phá giới hạn cá nhân và kiến tạo kết quả vượt trội",
    badge: "🚀 Đột phá bản thân",
    duration: "Huấn luyện chiến lược & hành động",
    desc: "Xây dựng bản đồ mục tiêu sắc bén, triệt tiêu thói quen trì hoãn, kích hoạt lòng quả cảm và năng lực thực thi thần tốc.",
    features: [
      "Công thức thiết lập mục tiêu không thể chối từ",
      "Chiến lược kỷ luật bản thân bằng niềm vui sống",
      "Kỹ thuật vượt qua giai đoạn cạn kiệt năng lượng",
      "Định hình phong cách lãnh đạo và dẫn dắt đội ngũ",
    ],
    ctaText: "Xem lộ trình đào tạo",
    ctaLink: "/dao-tao/vut-toc-muc-tieu",
    highlight: false,
  },
];

// Cảm nhận học viên
const studentStories = [
  {
    name: "Nguyễn Thị Thu Hà",
    role: "Kinh doanh tự do, Hà Nội",
    tag: "Khơi Thông Dòng Tiền",
    quote:
      "Trước khi gặp Thầy Mong, em gánh khoản nợ gần 500 triệu, mất ngủ triền miên và luôn cáu gắt với con cái. Nhờ 4 buổi học và bài thực hành lòng biết ơn của Thầy, em khóc nấc vì nhận ra bao năm qua mình đã xua đuổi tiền bạc bằng sự sợ hãi. Sau 6 tháng kiên trì thực hành, em đã trả hết nợ, công việc kinh doanh thuận lợi kỳ lạ và quan trọng nhất là tâm em bình an!",
    result: "Trả hết nợ 500tr & Tìm lại nụ cười",
  },
  {
    name: "Trần Văn Hoàng",
    role: "Giám đốc công ty cơ khí, Đà Nẵng",
    tag: "Luật Hấp Dẫn Thực Chiến",
    quote:
      "Tôi vốn là dân kỹ thuật khô khan, không tin vào năng lượng hay tiềm thức. Nhưng khi công ty đứng bên bờ vực phá sản, tôi tham gia lớp của Thầy với tâm thế 'thử xem sao'. Sự chân thành và khoa học trong cách Thầy truyền đạt đã thuyết phục tôi. Tôi học cách biết ơn nhân viên, biết ơn khách hàng, và điều kỳ diệu là các hợp đồng lớn tự tìm đến như một phép màu.",
    result: "Cứu vãn doanh nghiệp & Hợp đồng tăng 200%",
  },
  {
    name: "Lê Phương Thảo",
    role: "Dược sĩ & Mẹ bỉm sữa, TP.HCM",
    tag: "Vút Tốc Mục Tiêu",
    quote:
      "Thầy Mong không bao giờ hô hào suông. Thầy cầm tay chỉ việc, truyền cho em niềm tin rằng 'Em xứng đáng được hạnh phúc'. Nhờ ngọn lửa nhiệt huyết của Thầy, từ một người mẹ bỉm tự ti ở nhà chăm con, em đã dám khởi nghiệp xây dựng hệ thống phân phối hơn 50 đại lý. Biết ơn người Thầy đã thắp sáng cuộc đời em!",
    result: "Xây dựng đội ngũ 50+ thành viên",
  },
];

// Món quà tri ân miễn phí
const freeGifts = [
  {
    icon: Headphones,
    title: "Audio Thiền Khơi Thông Năng Lượng Buổi Sáng",
    time: "15 phút nghe mỗi ngày",
    desc: "Bản ghi âm giọng dẫn ấm áp giúp bạn đánh thức tâm trí tỉnh táo, xua tan cảm giác mệt mỏi và đón nhận ngày mới với lòng biết ơn ngập tràn.",
    badge: "Tặng miễn phí",
    linkText: "Nghe ngay trên web",
    linkUrl: "/thoi-mien",
  },
  {
    icon: BookOpen,
    title: "Sổ Tay 28 Ngày Thực Hành Lòng Biết Ơn",
    time: "Ebook cẩm nang PDF",
    desc: "Bộ câu hỏi và bài thực hành mỗi ngày được thiết kế chi tiết để bạn rèn luyện thói quen nhìn thấy điều tốt đẹp, thu hút phước lành và bình an.",
    badge: "Tài liệu cộng đồng",
    linkText: "Đăng ký nhận sổ tay",
    linkUrl: "#dang-ky-qua",
  },
  {
    icon: Gift,
    title: "Khóa Học Khơi Thông Dòng Tiền (Vé Học Phễu)",
    time: "4 Buổi Zoom trực tiếp",
    desc: "Món quà trao giá trị lớn nhất từ Mali Edu dành cho những ai đang bế tắc và khao khát thay đổi cuộc sống tài chính từ gốc rễ.",
    badge: "Phụng sự cộng đồng",
    linkText: "Giữ chỗ miễn phí",
    linkUrl: "/dao-tao/khoi-thong-dong-tien",
  },
];

// FAQ Câu hỏi thường gặp
const faqList = [
  {
    q: "Tôi đang rất bế tắc, tự ti và nợ nần, tôi có thật sự thay đổi được không?",
    a: "Chắc chắn được bạn nhé! Bản thân Thầy Mong cũng từng trải qua giai đoạn nợ nần, mất phương hướng và tuyệt vọng tột cùng. Nghịch cảnh xuất hiện không phải để trừng phạt bạn, mà để nhắc bạn cần học bài học quay vào bên trong. Chỉ cần bạn còn sống, còn khao khát và sẵn sàng mở lòng đón nhận, bạn hoàn toàn có thể tái tạo lại cuộc đời mình.",
  },
  {
    q: "Tôi chưa từng học về tâm trí, tiềm thức hay năng lượng thì có theo kịp không?",
    a: "Các chương trình đào tạo của Thầy Nguyễn Mong Thành được thiết kế cực kỳ gần gũi, thực tế và dễ hiểu. Thầy không dùng từ ngữ hàn lâm khó hiểu mà giải thích bằng các ví dụ đời thường, kèm bài tập thực hành cụ thể từng ngày. Dù bạn là mẹ bỉm sữa, người lao động hay chủ doanh nghiệp đều có thể thấu hiểu và ứng dụng được ngay.",
  },
  {
    q: "Khóa học của Thầy có hô hào năng lượng ảo hay bắt làm những điều kỳ dị không?",
    a: "Tuyệt đối không! Triết lý của Thầy Mong là: 'Không dạy làm giàu ảo tưởng - Không hô hào năng lượng ngắn ngủi'. Mọi sự chuyển hóa đều bắt đầu từ nhận thức đúng, nhìn sâu vào gốc rễ niềm tin, rèn luyện kỷ luật và hành động thực tế mỗi ngày. Năng lượng tích cực đến từ sự bình an nội tại và lòng biết ơn chân thật, chứ không phải tiếng la hét bên ngoài.",
  },
  {
    q: "Sau khóa học, tôi có được hỗ trợ hay đồng hành tiếp không?",
    a: "Mali Edu và Thầy Nguyễn Mong Thành luôn coi học viên như người bạn đồng hành hữu duyên. Bạn sẽ được tham gia vào cộng đồng học tập, các buổi Zoom sáng rèn luyện thói quen, được đội ngũ trợ giảng và các anh chị đi trước hỗ trợ, cùng nhau gieo hạt và tiếp lửa cho nhau mỗi ngày.",
  },
];

export default function NguyenMongThanh() {
  const seo = ROUTE_SEO["/gioi-thieu/nguyen-mong-thanh"];
  const [openFaq, setOpenFaq] = useState(0);
  const [giftEmail, setGiftEmail] = useState("");
  const [giftSubmitted, setGiftSubmitted] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  const handleGiftSubmit = (e) => {
    e.preventDefault();
    if (giftEmail.trim()) {
      setGiftSubmitted(true);
    }
  };

  return (
    <div className="nmt-page font-sans">
      <SEO {...seo} />

      {/* 1. HERO SECTION - NGUỒN NĂNG LƯỢNG TÍCH CỰC VÀ SỨ MỆNH PHỤNG SỰ */}
      <section className="nmt-hero-warm relative overflow-hidden">
        {/* Ambient Warm Sun Glows */}
        <div className="nmt-sun-glow-1" aria-hidden="true" />
        <div className="nmt-sun-glow-2" aria-hidden="true" />

        <div className="nmt-container relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Đường dẫn" className="nmt-breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <Link to="/gioi-thieu">Giới thiệu</Link>
            <span>/</span>
            <span aria-current="page" className="nmt-breadcrumb-current">
              Nhà đào tạo Nguyễn Mong Thành
            </span>
          </nav>

          <div className="nmt-hero-grid items-center">
            {/* Left Copy */}
            <div className="nmt-hero-copy">
              {/* Mission Badge */}
              <div className="nmt-badge-warm">
                <Sun className="nmt-icon-spin text-amber-500" size={16} />
                <span>Sứ Mệnh Phụng Sự & Đồng Hành Chuyển Hóa</span>
              </div>

              {/* Eyebrow */}
              <p className="nmt-eyebrow-warm mt-4">
                NHÀ ĐÀO TẠO · NGƯỜI ĐỒNG HÀNH · DIỄN GIẢ TRUYỀN CẢM HỨNG
              </p>

              {/* Main Headline */}
              <h1 className="nmt-hero-title">
                Đánh thức <span className="nmt-text-gradient">Nội Lực</span>,
                <br />
                Sống trong <span className="nmt-text-warm">Biết Ơn</span>
                <br />& Tự do Kiến tạo.
              </h1>

              {/* Welcome Quote */}
              <div className="nmt-hero-quote-box">
                <Quote className="nmt-quote-icon" size={24} />
                <p className="nmt-hero-quote-text">
                  “Tôi không ở đây để dạy bảo bạn. Tôi ở đây như một người bạn
                  đồng hành – cùng bạn thắp sáng ngọn lửa tự tin bên trong, buông
                  bỏ nỗi sợ và bước ra ánh sáng của sự đủ đầy.”
                </p>
                <span className="nmt-hero-author">
                  — Nguyễn Mong Thành · Founder Mong Coaching
                </span>
              </div>

              {/* Action Buttons */}
              <div className="nmt-actions-warm">
                <a className="nmt-btn-primary" href="#tam-tinh">
                  <span>Cùng tôi bắt đầu hành trình</span>
                  <ArrowDown size={18} />
                </a>

                <a className="nmt-btn-secondary" href="#qua-tang">
                  <Gift size={18} className="text-amber-600" />
                  <span>Nhận quà tri ân miễn phí</span>
                </a>

                <Link className="nmt-btn-text" to="/dao-tao">
                  <span>Xem các khóa học</span>
                  <MoveUpRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right Visual - Arched Portrait with Warm Golden Aura */}
            <div className="nmt-hero-visual-warm">
              <div className="nmt-visual-aura" aria-hidden="true" />
              <div className="nmt-visual-ring" aria-hidden="true" />

              {/* Main Photo Arch: Không che mặt, hiển thị trọn vẹn chân dung */}
              <div className="nmt-arch-card shadow-2xl">
                <img
                  src={profileImages.portrait.src}
                  alt={profileImages.portrait.alt}
                  width={800}
                  height={1000}
                  className="nmt-arch-img"
                  loading="eager"
                />
              </div>

              {/* Card chú thích nổi góc dưới bên trái (bên ngoài ảnh, không che người) */}
              <div className="nmt-portrait-note-warm">
                <div className="nmt-note-header">
                  <div className="nmt-note-dot" />
                  <span>MONG COACHING · TRIẾT LÝ</span>
                </div>
                <p className="nmt-note-quote">
                  Khát khao · Kỷ luật<br />
                  <em>Thành công & Biết ơn.</em>
                </p>
                <div className="nmt-note-footer">
                  <Heart size={14} className="text-rose-500 fill-rose-500" />
                  <span>Nguyễn Mong Thành · Founder</span>
                </div>
              </div>

              {/* Huy hiệu nhỏ tinh tế góc trên ngoài khung vòm (không che mặt) */}
              <div className="nmt-pill-badge-top">
                <Sun size={16} className="nmt-icon-spin text-amber-500" />
                <span>Năng lượng bình an</span>
              </div>
            </div>
          </div>

          {/* Social Proof & Gratitude Numbers Bar */}
          <div className="nmt-impact-bar">
            <div className="nmt-impact-item">
              <div className="nmt-impact-icon-circle bg-amber-100 text-amber-700">
                <Calendar size={22} />
              </div>
              <div>
                <strong>5+ Năm</strong>
                <p>Bền bỉ gieo hạt tri thức & phụng sự cộng đồng</p>
              </div>
            </div>

            <div className="nmt-impact-item">
              <div className="nmt-impact-icon-circle bg-rose-100 text-rose-700">
                <Users size={22} />
              </div>
              <div>
                <strong>50.000+</strong>
                <p>Cuộc đời được tiếp thêm niềm tin & nghị lực sống</p>
              </div>
            </div>

            <div className="nmt-impact-item">
              <div className="nmt-impact-icon-circle bg-orange-100 text-orange-700">
                <Clock size={22} />
              </div>
              <div>
                <strong>1.000+ Giờ</strong>
                <p>Thiền dẫn & Zoom chia sẻ hoàn toàn miễn phí</p>
              </div>
            </div>

            <div className="nmt-impact-item">
              <div className="nmt-impact-icon-circle bg-emerald-100 text-emerald-700">
                <Smile size={22} />
              </div>
              <div>
                <strong>100%</strong>
                <p>Lắng nghe, thấu cảm & đồng hành từ trái tim</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STICKY QUICK NAVIGATION */}
      <nav className="nmt-sticky-nav" aria-label="Điều hướng nhanh">
        <div className="nmt-container">
          <div className="nmt-sticky-track">
            {quickNav.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="nmt-sticky-link">
                <span className="nmt-nav-dot" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* 3. LỜI TÂM TÌNH & BIẾT ƠN NGHỊCH CẢNH */}
      <section id="tam-tinh" className="nmt-section bg-[#FFFDF9]">
        <div className="nmt-container">
          <div className="nmt-story-warm-grid">
            {/* Left Column: Big Inspirational Quote Card */}
            <div className="nmt-story-quote-card">
              <div className="nmt-quote-glow" />
              <Quote className="nmt-story-large-quote-icon" size={48} />
              <blockquote className="nmt-story-quote-text">
                “Nghịch cảnh không xuất hiện để quật ngã bạn.
                <br />
                Nghịch cảnh đến để tôi luyện ý chí và đánh thức người khổng lồ
                đang ngủ quên bên trong bạn.”
              </blockquote>
              <div className="nmt-quote-author-line">
                <div className="nmt-author-dot" />
                <span>NGUYỄN MONG THÀNH</span>
              </div>

              <div className="nmt-author-credentials">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Founder Mong Coaching & Co-founder Mali Edu</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Chuyên gia nghiên cứu Tâm trí & Tiềm thức ứng dụng</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Người gieo hạt phụng sự cộng đồng</span>
                </div>
              </div>
            </div>

            {/* Right Column: Heart-to-Heart Story */}
            <div className="nmt-story-copy">
              <div className="nmt-tag-eyebrow">
                <span>01 / TÂM SỰ TỪ TRÁI TIM</span>
              </div>
              <h2 className="nmt-section-h2">
                Hành trình chuyển hóa:
                <br />
                <span className="nmt-text-gradient">
                  Từ bế tắc hoang mang đến người thắp lửa
                </span>
              </h2>

              <div className="nmt-story-paragraphs">
                <p>
                  <strong>Chào bạn thân mến,</strong>
                </p>
                <p>
                  Nếu hôm nay bạn đang cảm thấy mệt mỏi, bế tắc về tài chính, hay
                  hoang mang tự hỏi <em>“Tại sao mình nỗ lực mãi mà cuộc đời vẫn
                  chật vật?”</em>, thì hãy tin tôi:{" "}
                  <strong>bạn không hề cô đơn</strong>.
                </p>
                <p>
                  Cách đây nhiều năm, chính tôi cũng từng nếm trải những ngày
                  tháng tăm tối nhất: khởi nghiệp thất bại, nợ nần bủa vây, mất
                  phương hướng và sống trong nỗi sợ hãi tột cùng. Có những đêm
                  dài mất ngủ, tôi đã tự hỏi mình đã làm sai điều gì?
                </p>
                <div className="nmt-story-highlight-box">
                  <Sun size={24} className="text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Bước ngoặt thức tỉnh nhờ Lòng Biết Ơn:</strong>
                    <p className="mt-1 text-sm text-gray-700">
                      Tôi nhận ra rằng: <em>Tiền bạc và hoàn cảnh bên ngoài chỉ là
                      tấm gương phản chiếu thế giới bên trong.</em> Khi tôi thôi
                      oán trách nghịch cảnh, học cách cúi đầu biết ơn từng bữa
                      cơm, từng bài học đau đớn và tha thứ cho chính mình, nguồn
                      năng lượng bên trong bắt đầu hồi sinh kỳ diệu.
                    </p>
                  </div>
                </div>
                <p>
                  Từ quá trình tự chữa lành, nghiên cứu sâu về tiềm thức, quy luật
                  vũ trụ và tâm lý học hành vi, tôi đã tự tay xây dựng lại cuộc
                  đời mình từ con số âm. Và hôm nay, tôi dành trọn tâm huyết này
                  để trao lại cho bạn con đường đó —{" "}
                  <strong>chân thực, không giáo điều và tràn đầy tình yêu thương.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BỐN TRỤ CỘT NĂNG LƯỢNG & TINH THẦN CHO ĐI */}
      <section id="tru-cot" className="nmt-section bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EB]">
        <div className="nmt-container text-center">
          <div className="nmt-tag-eyebrow mx-auto">
            <span>02 / TRIẾT LÝ SỐNG & PHỤNG SỰ</span>
          </div>
          <h2 className="nmt-section-h2 mt-3">
            Bốn trụ cột nuôi dưỡng <span className="nmt-text-warm">Tâm Thức Đủ Đầy</span>
          </h2>
          <p className="nmt-section-intro mx-auto">
            Không hô hào khẩu hiệu sáo rỗng. Đây là 4 giá trị cốt lõi giúp hàng
            chục ngàn học viên khơi thông dòng năng lượng và kiến tạo sự bình an
            từ gốc rễ.
          </p>

          <div className="nmt-pillars-grid mt-12">
            {corePillars.map((pillar) => {
              const IconComp = pillar.icon;
              return (
                <div key={pillar.number} className={`nmt-pillar-card nmt-pillar-${pillar.color}`}>
                  <div className="nmt-pillar-top">
                    <div className="nmt-pillar-icon-box">
                      <IconComp size={24} />
                    </div>
                    <span className="nmt-pillar-number">{pillar.number}</span>
                  </div>
                  <span className="nmt-pillar-tag">{pillar.tag}</span>
                  <h3 className="nmt-pillar-title">{pillar.title}</h3>
                  <p className="nmt-pillar-desc">{pillar.desc}</p>
                  <div className="nmt-pillar-quote">
                    <em>"{pillar.quote}"</em>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini banner quote */}
          <div className="nmt-banner-quote-warm mt-12">
            <Sparkles className="text-amber-500 flex-shrink-0" size={24} />
            <p>
              “Khi tâm bạn trong sáng và hướng tới sự phụng sự, cả vũ trụ sẽ
              hiệp lực để đưa những nguồn lực tuyệt vời nhất đến với bạn.”
            </p>
          </div>
        </div>
      </section>

      {/* 5. CHUYỂN HÓA TRẠNG THÁI: TỪ CẠN KIỆT ĐẾN BỨT PHÁ */}
      <section id="chuyen-hoa" className="nmt-section bg-white">
        <div className="nmt-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="nmt-tag-eyebrow mx-auto">
              <span>03 / CHUYỂN HÓA TẦN SỐ RUNG ĐỘNG</span>
            </div>
            <h2 className="nmt-section-h2 mt-3">
              Thay đổi <span className="nmt-text-gradient">Trạng Thái Bên Trong</span>,
              <br />
              Đổi thay kết quả bên ngoài
            </h2>
            <p className="nmt-section-intro">
              Bạn không thể giải quyết một vấn đề với cùng một trạng thái tâm trí
              đã tạo ra nó. Hãy quan sát sự chuyển dịch kỳ diệu khi bạn lựa chọn
              nâng tầm nhận thức:
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Old State Card */}
            <div className="nmt-state-card nmt-state-old">
              <div className="flex items-center gap-3 mb-6">
                <span className="nmt-state-icon bg-gray-200 text-gray-700">🌧️</span>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">
                    Trạng thái cạn kiệt & Giới hạn cũ
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tần số rung động thấp, tắc nghẽn dòng chảy
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {energyComparison.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-gray-200">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.from}
                    </p>
                  </div>
                ))}
              </div>

              <p className="nmt-state-footer text-gray-500 italic mt-6">
                “Nếu tiếp tục tư duy cũ, bạn sẽ chỉ nhận lại kết quả cũ...”
              </p>
            </div>

            {/* New State Card */}
            <div className="nmt-state-card nmt-state-new">
              <div className="flex items-center gap-3 mb-6">
                <span className="nmt-state-icon bg-amber-200 text-amber-900">☀️</span>
                <div>
                  <h3 className="font-bold text-xl text-amber-950">
                    Trạng thái bình an & Khơi thông mới
                  </h3>
                  <p className="text-xs text-amber-700">
                    Tần số rung động cao, đón nhận sự thịnh vượng
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {energyComparison.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200 shadow-sm">
                    <Check className="text-emerald-600 font-bold mt-0.5" size={18} />
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {item.to}
                    </p>
                  </div>
                ))}
              </div>

              <p className="nmt-state-footer text-amber-800 font-semibold italic mt-6">
                “Bước vào trạng thái biết ơn, cơ hội và quý nhân sẽ tự tìm đến bạn!”
              </p>
            </div>
          </div>

          {/* 5 Transformation Layers Road */}
          <div className="mt-16 bg-[#FFFDF7] p-8 md:p-10 rounded-2xl border border-amber-200">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                LỘ TRÌNH 5 TẦNG CHUYỂN HÓA
              </span>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mt-2">
                Hành trình từ gốc rễ nội tâm đến kết quả bền vững
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {transformationSteps.map((step) => (
                <div key={step.step} className="nmt-step-item">
                  <div className="nmt-step-number">{step.step}</div>
                  <h4 className="font-bold text-gray-900 text-base mt-3">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. PHƯƠNG PHÁP HUẤN LUYỆN: CHÂN THÀNH • THỰC CHIẾN • THẤU CẢM */}
      <section id="phuong-phap" className="nmt-section bg-[#FAF6EE]">
        <div className="nmt-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Workshop Live Photo */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src={profileImages.workshop.src}
                  alt={profileImages.workshop.alt}
                  width={1200}
                  height={750}
                  className="w-full h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full mb-2">
                    LỚP HỌC THỰC TẾ
                  </span>
                  <p className="text-sm font-medium">
                    Hàng ngàn học viên bùng nổ năng lượng tích cực và tìm lại niềm tin cuộc sống.
                  </p>
                </div>
              </div>

              {/* Floating Quote Badge */}
              <div className="absolute -bottom-6 -right-4 bg-white p-4 rounded-xl shadow-xl border border-amber-200 hidden sm:flex items-center gap-3 max-w-xs">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    “Dạy từ tâm • Đồng hành tới cùng”
                  </p>
                  <span className="text-[11px] text-gray-500">
                    Không để bất kỳ học viên nào bị bỏ lại
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Coaching Principles */}
            <div className="lg:col-span-7 space-y-6">
              <div className="nmt-tag-eyebrow">
                <span>04 / PHƯƠNG PHÁP HUẤN LUYỆN</span>
              </div>
              <h2 className="nmt-section-h2">
                Không dạy lý thuyết suông.
                <br />
                <span className="nmt-text-gradient">
                  Cầm tay chỉ việc, chạm vào trái tim
                </span>
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                Nhiều người đi học khắp nơi nhưng không thay đổi được vì chỉ dừng
                lại ở tầng <em>“biết kiến thức”</em>. Phương pháp huấn luyện của
                Nguyễn Mong Thành là sự kết hợp nhuần nhuyễn giữa{" "}
                <strong>Thấu cảm — Chữa lành tiềm thức — Thực hành kỷ luật</strong> để
                tạo ra kết quả thật trong đời sống.
              </p>

              {/* 4 Steps Accordion Style Cards */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    num: "1",
                    title: "Lắng nghe & Thấu cảm không phán xét",
                    desc: "Tạo không gian an toàn tuyệt đối để bạn trải lòng về những tổn thương, bế tắc tài chính mà không sợ bị chê cười.",
                  },
                  {
                    num: "2",
                    title: "Gỡ nút thắt niềm tin giới hạn tận gốc",
                    desc: "Dùng kỹ thuật thôi miên trị liệu và NLP ứng dụng để giải phóng những ký ức tiêu cực và nỗi sợ tiền bạc từ thơ ấu.",
                  },
                  {
                    num: "3",
                    title: "Cài đặt tần số rung động tích cực & Lòng biết ơn",
                    desc: "Hướng dẫn thực hành thiền dẫn, viết sổ biết ơn mỗi sớm mai để tâm trí luôn ngập tràn năng lượng hạnh phúc.",
                  },
                  {
                    num: "4",
                    title: "Đồng hành rèn luyện kỷ luật hành động",
                    desc: "Học đi đôi với hành. Cung cấp bài tập thực tế mỗi ngày, kiểm tra tiến độ và tiếp lửa liên tục để bạn không bỏ cuộc.",
                  },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.num}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BẢY LĨNH VỰC GIEO HẠT & KHAI PHÓNG TIỀM NĂNG */}
      <section id="linh-vuc" className="nmt-section bg-white">
        <div className="nmt-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="nmt-tag-eyebrow mx-auto">
              <span>05 / 7 LĨNH VỰC GIEO HẠT</span>
            </div>
            <h2 className="nmt-section-h2 mt-3">
              Khai phóng toàn diện: <span className="nmt-text-gradient">Tâm trí • Tài chính • Hạnh phúc</span>
            </h2>
            <p className="nmt-section-intro">
              Mỗi bài giảng là một hạt mầm thiện lành, giúp bạn làm chủ nội tâm
              và từng bước mở lối cho sự thịnh vượng bền vững tràn vào cuộc sống:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingAreas.map((area) => {
              const IconComp = area.icon;
              return (
                <div key={area.title} className="nmt-area-card group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-amber-500 group-hover:text-white text-amber-600 flex items-center justify-center transition-colors">
                      <IconComp size={24} />
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      {area.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                    {area.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {area.desc}
                  </p>
                </div>
              );
            })}

            {/* Final CTA Card in the Grid */}
            <div className="nmt-area-card bg-gradient-to-br from-[#8B2E2E] to-[#672222] text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  ĐỒNG HÀNH CÙNG THẦY MONG
                </span>
                <h3 className="text-2xl font-serif font-bold text-white mt-3 leading-snug">
                  Bạn đã sẵn sàng bước qua giới hạn cũ?
                </h3>
                <p className="text-sm text-amber-100/90 mt-3 leading-relaxed">
                  Hãy để tôi đồng hành cùng bạn trên con đường tìm lại chính mình,
                  đánh thức niềm tin và làm chủ vận mệnh.
                </p>
              </div>

              <Link to="/dao-tao" className="inline-flex items-center justify-between w-full mt-6 py-3 px-4 bg-amber-500 text-gray-950 font-bold rounded-xl hover:bg-amber-400 transition">
                <span>Khám phá các khóa học</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CÁC CHƯƠNG TRÌNH ĐÀO TẠO & TRAO GIÁ TRỊ TIÊU BIỂU */}
      <section id="khoa-hoc" className="nmt-section bg-[#FAF7F0]">
        <div className="nmt-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="nmt-tag-eyebrow mx-auto">
              <span>06 / CHƯƠNG TRÌNH ĐÀO TẠO CỐT LÕI</span>
            </div>
            <h2 className="nmt-section-h2 mt-3">
              Những khóa học <span className="nmt-text-warm">Thay Đổi Cuộc Đời</span>
            </h2>
            <p className="nmt-section-intro">
              Được Thầy Nguyễn Mong Thành và Mali Edu thiết kế với tinh thần
              phụng sự cao nhất, mang lại giá trị thực tế cho từng học viên:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {featuredCourses.map((course) => (
              <div
                key={course.id}
                className={`nmt-course-card ${
                  course.highlight ? "nmt-course-highlight ring-2 ring-amber-500" : ""
                }`}
              >
                {course.highlight && (
                  <div className="nmt-course-ribbon">
                    <span>ĐƯỢC HỌC VIÊN YÊU THÍCH NHẤT</span>
                  </div>
                )}

                <div className="p-6 md:p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full">
                        {course.badge}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-2xl text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-amber-800 font-medium mb-4 italic">
                      {course.subtitle}
                    </p>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      {course.desc}
                    </p>

                    <div className="border-t border-gray-100 pt-4 mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                        Bạn sẽ nhận được:
                      </p>
                      <ul className="space-y-2.5">
                        {course.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    to={course.ctaLink}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                      course.highlight
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20"
                        : "bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                    }`}
                  >
                    <span>{course.ctaText}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. THƯ VIỆN KHOẢNH KHẮC & NHỮNG CÁI ÔM CHUYỂN HÓA */}
      <section id="khoanh-khac" className="nmt-section bg-white">
        <div className="nmt-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="nmt-tag-eyebrow mx-auto">
              <span>07 / KHOẢNH KHẮC LAN TỎA</span>
            </div>
            <h2 className="nmt-section-h2 mt-3">
              Năng lượng kết nối: <span className="nmt-text-gradient">Nụ Cười & Tình Yêu Thương</span>
            </h2>
            <p className="nmt-section-intro">
              Mỗi lớp học không chỉ là nơi truyền trao tri thức, mà là một mái
              nhà ấm áp — nơi học viên được thấu hiểu, ôm chặt lấy nhau và cùng
              nhau tái sinh năng lượng sống:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Gallery Image 1 */}
            <div className="nmt-gallery-item group">
              <img
                src={profileImages.workshop.src}
                alt="Lớp học trực tiếp bùng nổ năng lượng"
                className="nmt-gallery-img"
              />
              <div className="nmt-gallery-overlay">
                <p className="font-bold text-white text-sm">
                  Lớp học trực tiếp hàng trăm học viên
                </p>
                <span className="text-xs text-amber-200">
                  Năng lượng bùng nổ & Kết nối sâu
                </span>
              </div>
            </div>

            {/* Gallery Image 2 */}
            <div className="nmt-gallery-item group">
              <img
                src={profileImages.teaching.src}
                alt="Thầy Nguyễn Mong Thành giảng dạy tâm huyết"
                className="nmt-gallery-img"
              />
              <div className="nmt-gallery-overlay">
                <p className="font-bold text-white text-sm">
                  Tận tâm từng khoảnh khắc chia sẻ
                </p>
                <span className="text-xs text-amber-200">
                  Chỉ bảo chi tiết từng bài học cuộc đời
                </span>
              </div>
            </div>

            {/* Gallery Image 3 */}
            <div className="nmt-gallery-item group">
              <img
                src={profileImages.healing.src}
                alt="Thiền thôi miên chữa lành"
                className="nmt-gallery-img"
              />
              <div className="nmt-gallery-overlay">
                <p className="font-bold text-white text-sm">
                  Khoảnh khắc chữa lành nội tâm
                </p>
                <span className="text-xs text-amber-200">
                  Giọt nước mắt buông bỏ gánh nặng
                </span>
              </div>
            </div>

            {/* Gallery Image 4 */}
            <div className="nmt-gallery-item group">
              <img
                src={profileImages.community.src}
                alt="Cộng đồng học viên K47"
                className="nmt-gallery-img"
              />
              <div className="nmt-gallery-overlay">
                <p className="font-bold text-white text-sm">
                  Cộng đồng đồng hành bền vững
                </p>
                <span className="text-xs text-amber-200">
                  Cùng nhau gieo hạt & tiến bước
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CẢM NHẬN HỌC VIÊN: NHỮNG CUỘC ĐỜI ĐƯỢC THẮP SÁNG */}
      <section id="cau-chuyen-hoc-vien" className="nmt-section bg-[#FAF5EB]">
        <div className="nmt-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="nmt-tag-eyebrow mx-auto">
              <span>08 / TIẾNG LÒNG HỌC VIÊN</span>
            </div>
            <h2 className="nmt-section-h2 mt-3">
              Những cuộc đời được <span className="nmt-text-warm">Thắp Sáng Lại</span>
            </h2>
            <p className="nmt-section-intro">
              Hạnh phúc lớn nhất của một người thầy là nhìn thấy học viên của
              mình tìm lại được nụ cười, trả hết nợ nần và tự tin làm chủ cuộc
              đời:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {studentStories.map((item, idx) => (
              <div key={idx} className="nmt-testimonial-warm-card">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>

                <p className="text-sm text-gray-700 leading-relaxed italic mb-6">
                  "{item.quote}"
                </p>

                <div className="border-t border-amber-200/60 pt-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md">
                    <CheckCircle2 size={14} />
                    <span>Kết quả: {item.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/cam-nhan"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-800 hover:text-amber-900 hover:underline"
            >
              <span>Lắng nghe thêm hàng trăm câu chuyện chuyển hóa khác</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 11. MÓN QUÀ TRI ÂN VÌ CỘNG ĐỒNG (TINH THẦN CHO ĐI) */}
      <section id="qua-tang" className="nmt-section bg-gradient-to-b from-[#8B2E2E] to-[#5C1E1E] text-white">
        <div className="nmt-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-300/30">
              <Gift size={14} />
              <span>MÓN QUÀ TRI ÂN TỪ TRÁI TIM</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">
              Cho đi là còn mãi · Nhận quà miễn phí
            </h2>
            <p className="text-amber-100/80 text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
              Dù bạn có tham gia các khóa học chuyên sâu hay không, Thầy Mong và
              Mali Edu xin dành tặng bạn những món quà tinh thần này để tiếp thêm
              năng lượng mỗi ngày:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {freeGifts.map((gift, idx) => {
              const IconComp = gift.icon;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/15 hover:border-amber-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-bold mb-4 shadow-lg">
                      <IconComp size={24} />
                    </div>
                    <span className="text-xs font-bold text-amber-300 tracking-wider uppercase">
                      {gift.badge} · {gift.time}
                    </span>
                    <h3 className="font-bold text-xl text-white mt-2 mb-3">
                      {gift.title}
                    </h3>
                    <p className="text-xs text-amber-100/80 leading-relaxed mb-6">
                      {gift.desc}
                    </p>
                  </div>

                  {gift.linkUrl.startsWith("#") ? (
                    <a
                      href={gift.linkUrl}
                      className="w-full py-3 px-4 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider text-center hover:bg-amber-300 transition"
                    >
                      {gift.linkText}
                    </a>
                  ) : (
                    <Link
                      to={gift.linkUrl}
                      className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-bold text-xs uppercase tracking-wider text-center hover:bg-amber-300 transition"
                    >
                      {gift.linkText}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Email Register Box for Free Ebook */}
          <div id="dang-ky-qua" className="mt-12 bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/20 max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-serif font-bold text-white">
              Đăng ký nhận trọn bộ quà tặng qua Email / Zalo
            </h3>
            <p className="text-xs text-amber-100/80 mt-1 mb-6">
              Chúng tôi sẽ gửi ngay Ebook 28 Ngày Lòng Biết Ơn & Audio Thiền vào
              hòm thư của bạn.
            </p>

            {giftSubmitted ? (
              <div className="p-4 bg-emerald-500/30 border border-emerald-400 rounded-xl text-emerald-200 text-sm font-medium">
                🎉 Cảm ơn bạn! Món quà đã được gửi tới email của bạn. Chúc bạn
                một ngày tràn đầy năng lượng an lành!
              </div>
            ) : (
              <form onSubmit={handleGiftSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email của bạn..."
                  value={giftEmail}
                  onChange={(e) => setGiftEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-sm rounded-xl transition shadow-lg flex-shrink-0"
                >
                  Nhận Quà Ngay
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 12. FAQ - NHỮNG CÂU HỎI TỪ TRÁI TIM */}
      <section id="faq" className="nmt-section bg-white">
        <div className="nmt-container max-w-4xl">
          <div className="text-center mb-12">
            <div className="nmt-tag-eyebrow mx-auto">
              <span>09 / GIẢI ĐÁP BĂN KHOĂN</span>
            </div>
            <h2 className="nmt-section-h2 mt-3">
              Những câu hỏi chân thành từ học viên
            </h2>
            <p className="nmt-section-intro mx-auto">
              Nếu bạn còn bất kỳ ngần ngại nào, hãy để chúng tôi giải tỏa giúp bạn:
            </p>
          </div>

          <div className="space-y-4">
            {faqList.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-[#FFFDF9]"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 font-bold text-base md:text-lg text-gray-900 hover:text-amber-800 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`transform transition-transform duration-300 text-amber-600 flex-shrink-0 ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openFaq === idx && (
                  <div className="px-5 pb-6 md:px-6 md:pb-6 text-sm md:text-base text-gray-700 leading-relaxed border-t border-amber-100 pt-4 bg-amber-50/30">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. LỜI NHẮN GỬI TRUYỀN LỬA & KÊU GỌI HÀNH ĐỘNG TỪ TRÁI TIM */}
      <section className="nmt-section bg-gradient-to-br from-[#FEF8EC] via-[#FFF5DE] to-[#FDEED0] relative overflow-hidden text-center">
        <div className="nmt-sun-glow-1" aria-hidden="true" />
        <div className="nmt-container max-w-3xl relative z-10">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20 mb-6">
            <Flame size={32} />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
            LỜI NHẮN GỬI CUỐI CÙNG TỪ THẦY NGUYỄN MONG THÀNH
          </span>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-950 mt-4 leading-tight">
            Bạn sinh ra trên đời này để{" "}
            <span className="text-amber-600">Tỏa Sáng</span>,
            <br />
            không phải để co cụm trong nỗi sợ!
          </h2>

          <p className="text-base md:text-lg text-gray-700 mt-6 leading-relaxed max-w-2xl mx-auto">
            Đừng để bất kỳ ai — kể cả tiếng nói phán xét trong đầu bạn — nói rằng
            bạn không xứng đáng có một cuộc đời hạnh phúc, tự do và thịnh vượng.
            Mọi thứ bạn cần đã có sẵn bên trong bạn. Chỉ cần bạn dám tin, dám
            bước đi bằng lòng biết ơn, phép màu sẽ tự khắc mở ra.
          </p>

          <blockquote className="my-8 font-serif italic text-xl md:text-2xl text-[#8B2E2E] font-medium">
            “Hôm nay, bạn lựa chọn tiếp tục lo sợ,<br />
            hay dũng cảm bước ra ánh sáng để làm chủ cuộc đời mình?”
          </blockquote>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Link
              to="/dao-tao/khoi-thong-dong-tien"
              className="px-8 py-4 bg-gradient-to-r from-[#8B2E2E] to-[#A33636] text-white font-bold rounded-xl text-base shadow-xl shadow-red-900/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>Tôi Sẵn Sàng Bứt Phá Ngay Hôm Nay</span>
              <ArrowRight size={20} />
            </Link>

            <a
              href="#qua-tang"
              className="px-6 py-4 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl text-base hover:bg-amber-50 transition flex items-center gap-2"
            >
              <Gift size={18} className="text-amber-600" />
              <span>Nhận Quà Tri Ân Miễn Phí</span>
            </a>
          </div>

          {/* Handwritten Style Signature */}
          <div className="mt-12 pt-8 border-t border-amber-200/80 inline-block text-center">
            <p className="font-serif italic text-3xl font-bold text-gray-900">
              Nguyễn Mong Thành
            </p>
            <span className="text-xs uppercase tracking-widest text-amber-800 font-bold mt-1 block">
              FOUNDER MONG COACHING · NGƯỜI ĐỒNG HÀNH CÙNG BẠN
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
