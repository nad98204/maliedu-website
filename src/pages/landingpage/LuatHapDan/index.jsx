import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Eye,
  HeartHandshake,
  Lightbulb,
  Loader2,
  LockKeyhole,
  MessageCircleMore,
  Phone,
  PlayCircle,
  Quote,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "react-hot-toast";

import SEO from "../../../components/SEO";
import { MALI_LOGO_URL } from "../../../constants/brandAssets";
import { submitToCRM } from "../../../services/crmService";
import { getRouteSeo } from "../../../seo/routeSeo";
import { normalizeLeadPhoneDigits } from "../../../utils/leadSearch";
import "./luat-hap-dan.css";

const HERO_IMAGE = "/assets/landing/luat-hap-dan/luat-hap-dan-k47.jpg";
const STAGE_ONE_IMAGE = "/assets/landing/luat-hap-dan/lo-trinh-giai-doan-1.jpg";
const STAGE_TWO_IMAGE = "/assets/landing/luat-hap-dan/lo-trinh-giai-doan-2.jpg";
const HOTLINE = "0355067656";

const painPoints = [
  "Bạn đã rất nỗ lực nhưng kết quả trong công việc và tài chính vẫn chưa tương xứng.",
  "Bạn dễ rơi vào lo lắng, bất an hoặc bị những tiếng nói tiêu cực bên trong kéo lùi.",
  "Bạn muốn chữa lành các mối quan hệ nhưng chưa biết bắt đầu từ cảm xúc gốc nào.",
  "Bạn có mục tiêu, nhưng thường trì hoãn, mất động lực hoặc chưa nhìn thấy một lộ trình rõ ràng.",
];

const outcomes = [
  {
    icon: HeartHandshake,
    title: "Cân bằng cảm xúc",
    text: "Nhìn rõ cảm xúc gốc, thực hành lòng biết ơn và xây nền tảng bình an từ bên trong.",
  },
  {
    icon: Sparkles,
    title: "Làm việc với tiềm thức",
    text: "Nhận diện ám thị, niềm tin giới hạn và tiếng nói nhỏ đang chi phối lựa chọn hằng ngày.",
  },
  {
    icon: Target,
    title: "Thiết lập mục tiêu",
    text: "Biến mong muốn mơ hồ thành bức tranh mục tiêu rõ ràng, có cảm xúc và có hướng hành động.",
  },
  {
    icon: BookOpenCheck,
    title: "Ứng dụng thực tế",
    text: "Đưa nguyên lý vào công việc, kinh doanh, tài chính và các mối quan hệ thay vì chỉ học lý thuyết.",
  },
];

const commonMistakes = [
  {
    number: "01",
    title: "Chỉ cố nghĩ tích cực",
    text: "Miệng nói điều mình muốn nhưng bên trong vẫn lo sợ, thiếu thốn hoặc không tin mình có thể làm được. Hai tín hiệu trái chiều khiến bạn nhanh mệt và bỏ cuộc.",
  },
  {
    number: "02",
    title: "Dùng lòng biết ơn như một cuộc trao đổi",
    text: "Thực hành chỉ để mong một người hay một hoàn cảnh phải thay đổi. Khi động cơ vẫn là chống lại hiện tại, cảm xúc gốc chưa thực sự được nhìn thấy.",
  },
  {
    number: "03",
    title: "Có mong muốn nhưng thiếu mục tiêu",
    text: "Hình dung rất nhiều nhưng chưa xác định kết quả, nguồn lực và bước hành động cụ thể. Năng lượng bị phân tán vì không biết điều gì cần ưu tiên trước.",
  },
  {
    number: "04",
    title: "Học xong nhưng không luyện tập đều",
    text: "Kiến thức chỉ ở tầng hiểu. Khi gặp tình huống thật, thói quen cũ và tiếng nói nhỏ vẫn tự động dẫn dắt cách phản ứng của bạn.",
  },
];

const transformationLayers = [
  {
    icon: HeartHandshake,
    step: "Tầng 1",
    title: "Trạng thái cảm xúc",
    question: "Tôi đang phát ra điều gì từ bên trong?",
    description:
      "Quan sát bất an, thiếu thốn, giận dữ hoặc tổn thương; xây lại khả năng cảm nhận điều đang có qua lòng biết ơn và sự công nhận.",
    practices: ["Nhật ký và thiền biết ơn", "Quan sát cảm xúc trước khi phản ứng", "Thực hành tha thứ và kết nối"],
  },
  {
    icon: Brain,
    step: "Tầng 2",
    title: "Niềm tin & tiềm thức",
    question: "Điều gì đang âm thầm điều khiển lựa chọn của tôi?",
    description:
      "Nhận diện ám thị, dấu ấn cũ và tiếng nói nhỏ; học cách đối thoại thay vì đè nén để tạo một cách nhìn và cách phản ứng mới.",
    practices: ["Nhận diện ngôn ngữ nội tâm", "Quy trình xử lý nỗi sợ", "Gỡ dấu ấn về tiền, quan hệ, bản thân"],
  },
  {
    icon: Target,
    step: "Tầng 3",
    title: "Mục tiêu & hành động",
    question: "Tôi muốn đi đâu và bước tiếp theo là gì?",
    description:
      "Làm rõ bức tranh mục tiêu, kết nối nguồn lực và đưa trạng thái bên trong vào những hành động thực tế trong đời sống, công việc, kinh doanh.",
    practices: ["Thiết kế bảng tầm nhìn", "Đặt hàng tiềm thức", "Sống trong mục tiêu và lập kế hoạch"],
  },
];

const learningMethod = [
  {
    icon: Video,
    number: "01",
    title: "Học trực tiếp",
    text: "Tiếp nhận nguyên lý và ví dụ thực tế trong buổi Zoom cùng nhà huấn luyện.",
  },
  {
    icon: Eye,
    number: "02",
    title: "Quan sát chính mình",
    text: "Đối chiếu kiến thức với tình huống thật đang diễn ra trong cảm xúc, gia đình hoặc công việc.",
  },
  {
    icon: RefreshCw,
    number: "03",
    title: "Thực hành giữa các buổi",
    text: "Lặp lại bài tập đủ đều để nhận ra phản ứng cũ và hình thành cách lựa chọn mới.",
  },
  {
    icon: Users,
    number: "04",
    title: "Rà soát & coaching",
    text: "Mang câu hỏi quay lại lớp hoặc buổi coaching để làm rõ điểm vướng và bước tiếp theo.",
  },
];

const curriculum = [
  {
    number: "01",
    phase: "Nền tảng",
    title: "Luật Hấp Dẫn khởi nguồn dẫn lối tới sự thịnh vượng",
    detail: "Hiểu đúng cơ chế vận hành và cách ứng dụng để chinh phục mục tiêu.",
    topics: [
      "Luật Hấp Dẫn là gì và đang hiện diện trong đời sống như thế nào",
      "Mối liên hệ giữa suy nghĩ, cảm xúc, lựa chọn, hành động và kết quả",
      "Ứng dụng nguyên lý vào một mục tiêu cụ thể thay vì chỉ mong cầu chung chung",
    ],
  },
  {
    number: "02",
    phase: "Cảm xúc",
    title: "Sức mạnh của lòng biết ơn",
    detail: "Nuôi dưỡng nguồn năng lượng tích cực cho may mắn, hạnh phúc và thành công.",
    topics: [
      "Hiểu lòng biết ơn như một nền trạng thái, không phải công cụ trao đổi",
      "Thực hành biết ơn theo từng khía cạnh: bản thân, gia đình, công việc và tiền bạc",
      "Tạo thói quen công nhận những điều tốt và những tiến bộ đang có",
    ],
  },
  {
    number: "03",
    phase: "Tiềm thức",
    title: "Ám thị",
    detail: "Nhận diện niềm tin đang chi phối công việc, gia đình và thực hành tha thứ.",
    topics: [
      "Ám thị và niềm tin được hình thành qua ngôn ngữ, trải nghiệm như thế nào",
      "Quan sát những câu nói nội tâm đang giới hạn cách nhìn và hành động",
      "Quy trình thiền chồng, thiền vợ và tha thứ để kết nối lại mối quan hệ",
    ],
  },
  {
    number: "04",
    phase: "Chữa lành",
    title: "Chữa lành và kết nối tiềm thức",
    detail: "Làm rõ dấu ấn tuổi thơ và những nút thắt về tiền bạc, quan hệ, bản thân.",
    topics: [
      "Nhìn lại nguồn gốc của dấu ấn và phản ứng cảm xúc lặp lại",
      "Nhận diện nút thắt gắn với tiền, kinh doanh, vợ chồng và bản thân",
      "Thực hành kết nối, gọi tên và chuyển hóa cảm xúc thay vì né tránh",
    ],
  },
  {
    number: "05",
    phase: "Chuyển hóa",
    title: "5 bước xử lý nỗi sợ và tiếng nói nhỏ",
    detail: "Gỡ bỏ mô thức tiêu cực, xây lại tư duy tích cực và tâm thức thịnh vượng.",
    topics: [
      "Phân biệt cảnh báo hữu ích với tiếng nói nhỏ tiêu cực từ mô thức cũ",
      "Đi qua từng bước đối thoại và xử lý cảm xúc thay vì cố gạt bỏ",
      "Cài đặt lại cách nhìn tích cực, rõ ràng và phù hợp với mục tiêu",
    ],
  },
  {
    number: "06",
    phase: "Coaching",
    title: "Coaching cân bằng giai đoạn 1",
    detail: "Rà soát vấn đề, củng cố nền tảng trước khi đi vào ứng dụng kinh doanh.",
    topics: [
      "Chọn một vấn đề thực tế cần được nhìn sâu và cân bằng",
      "Rà soát điểm vướng trong cảm xúc, niềm tin và cách phản ứng",
      "Hoàn thiện kế hoạch thực hành cá nhân trước khi bước sang giai đoạn 2",
    ],
  },
  {
    number: "07",
    phase: "Kinh doanh",
    title: "4 đối tác tâm linh",
    detail: "Cân bằng bốn góc trong kinh doanh qua trí tuệ và triết lý cổ xưa.",
    topics: [
      "Hiểu khung 4 đối tác và vai trò của từng mối quan hệ trong kinh doanh",
      "Quan sát nơi đang mất cân bằng giữa nhận, cho đi, hợp tác và phụng sự",
      "Thực hành kết nối với các nhóm đối tác bằng lòng biết ơn và giải pháp",
    ],
  },
  {
    number: "08",
    phase: "Kinh doanh",
    title: "Thiền khách hàng – Thiền hàng hóa",
    detail: "Chuyển hóa mối quan hệ với khách hàng và cảm xúc gắn với sản phẩm.",
    topics: [
      "Chữa lành cảm xúc tiêu cực và định kiến đang có với khách hàng",
      "Nhìn lại năng lượng sợ bán hàng, sợ bị từ chối hoặc thiếu tin vào sản phẩm",
      "Kết nối lại với giá trị hàng hóa và tinh thần phục vụ khách hàng",
    ],
  },
  {
    number: "09",
    phase: "Mục tiêu",
    title: "Thiết lập mục tiêu",
    detail: "Nắm nguyên lý mục tiêu không áp lực và thiết kế bảng tầm nhìn.",
    topics: [
      "Thiết lập mục tiêu từ sự rõ ràng thay vì áp lực và so sánh",
      "Chọn thời điểm, cảm xúc và tiêu chí phù hợp cho mục tiêu",
      "Thực hành 5 bước thiết kế bảng tầm nhìn có tính định hướng",
    ],
  },
  {
    number: "10",
    phase: "Coaching",
    title: "Coaching mục tiêu mẫu",
    detail: "Thực hành làm rõ bức tranh mục tiêu và những bước cần ưu tiên.",
    topics: [
      "Quan sát một ca coaching mục tiêu từ mong muốn đến bức tranh rõ ràng",
      "Nhận diện mâu thuẫn giữa mục tiêu ý thức và niềm tin bên trong",
      "Chốt thứ tự ưu tiên và hành động gần nhất có thể bắt đầu",
    ],
  },
  {
    number: "11",
    phase: "Nguồn lực",
    title: "Đặt hàng tiềm thức",
    detail: "Kết nối nguồn lực phù hợp: đối tác, nhân sự, công việc, ý tưởng và kế hoạch.",
    topics: [
      "Đặt hàng tiềm thức là gì và khác với mong cầu mơ hồ ra sao",
      "Quy trình ba bước để mô tả đúng đích đến và vấn đề cần giải quyết",
      "Ứng dụng với đối tác, nhân sự, công việc, ý tưởng và kỹ năng cần phát triển",
    ],
  },
  {
    number: "12",
    phase: "Thu hút",
    title: "Thiền thu hút mục tiêu – Thiền thu hút tiền bạc",
    detail: "Kết hợp nguyên lý, thiền và kế hoạch hành động để theo đuổi mục tiêu.",
    topics: [
      "Thực hành sống trong mục tiêu để duy trì sự tập trung và cảm hứng",
      "Nguyên lý cho đi đúng và cách giữ mối quan hệ lành mạnh với tiền bạc",
      "Liên kết mục tiêu với kế hoạch, nguồn lực và hành động từng bước",
    ],
  },
];

const practiceToolkit = [
  {
    icon: HeartHandshake,
    title: "Biết ơn có định hướng",
    text: "Không chỉ liệt kê điều tốt, mà học cách kết nối lại với từng khía cạnh đang mất cân bằng.",
  },
  {
    icon: Brain,
    title: "Đối thoại với tiềm thức",
    text: "Lắng nghe thông điệp phía sau nỗi sợ và tiếng nói nhỏ trước khi lựa chọn phản ứng mới.",
  },
  {
    icon: Compass,
    title: "Bảng tầm nhìn mục tiêu",
    text: "Làm rõ điều muốn đạt, lý do thật sự và hình ảnh giúp duy trì định hướng hằng ngày.",
  },
  {
    icon: Lightbulb,
    title: "Đặt hàng nguồn lực",
    text: "Đưa ra câu hỏi đủ rõ để tìm giải pháp, kỹ năng, con người và cơ hội phù hợp với đích đến.",
  },
  {
    icon: Route,
    title: "Sống trong mục tiêu",
    text: "Kết nối cảm xúc mong muốn với việc làm cụ thể, tránh dừng lại ở tưởng tượng thiếu hành động.",
  },
];

const coaches = [
  {
    name: "Mong Coaching",
    role: "Nhà huấn luyện Luật Hấp Dẫn & Tiềm Thức",
    image:
      "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782141836382-308577835-505393465-122137320068616236-3602726724362190836-n.jpg",
    description:
      "Đồng hành cùng học viên làm chủ cảm xúc, nhìn lại niềm tin gốc và ứng dụng Luật Hấp Dẫn theo hướng thực tế, dễ hiểu.",
  },
  {
    name: "Nguyễn Mong Thành",
    role: "Nhà huấn luyện Coaching Tâm Thức",
    image:
      "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1782141835659-987112338-488687318-3086001678220451-8119727030914301333-n.jpg",
    description:
      "Có hơn 7 năm kinh nghiệm đào tạo và coaching, tập trung vào mục tiêu, mối quan hệ và hành trình chuyển hóa từ bên trong.",
  },
];

const faqs = [
  {
    question: "Tôi chưa từng học Luật Hấp Dẫn có theo được không?",
    answer:
      "Có. Chương trình bắt đầu từ nền tảng và đi theo từng bước. Đội ngũ tư vấn sẽ tìm hiểu nhu cầu để giúp bạn xác định chương trình có phù hợp hay không.",
  },
  {
    question: "Khóa học diễn ra khi nào và học bằng hình thức gì?",
    answer:
      "K47 khai giảng ngày 22/09/2026, gồm 12 buổi học trực tuyến qua Zoom, từ 20:00–22:00 vào tối thứ Ba và thứ Sáu hằng tuần.",
  },
  {
    question: "Nếu bận một buổi, tôi có thể xem lại không?",
    answer:
      "Có. Nội dung buổi học được lưu lại để học viên có thể xem lại và hoàn thành phần thực hành theo tiến độ cá nhân.",
  },
  {
    question: "Để lại thông tin có phải thanh toán ngay không?",
    answer:
      "Không. Đây là bước đăng ký nhận tư vấn. Bạn sẽ được cung cấp lịch học, cách tham gia và thông tin chương trình trước khi đưa ra quyết định.",
  },
  {
    question: "Học Luật Hấp Dẫn có đảm bảo kết quả tài chính không?",
    answer:
      "Không có chương trình đào tạo nào có thể đảm bảo một mức kết quả giống nhau cho tất cả mọi người. Kết quả phụ thuộc vào hoàn cảnh, mức độ thực hành và hành động thực tế của từng học viên.",
  },
];

const scrollToRegistration = () => {
  document.getElementById("dang-ky-tu-van")?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const SectionTitle = ({ eyebrow, title, description, light = false }) => (
  <div className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
    <p className={`lhd-eyebrow ${light ? "lhd-eyebrow--light" : ""}`}>{eyebrow}</p>
    <h2 className={`mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-[44px] ${light ? "text-white" : "text-[#2b180c]"}`}>
      {title}
    </h2>
    {description ? (
      <p className={`mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg ${light ? "text-[#eadbc7]" : "text-[#6c5744]"}`}>
        {description}
      </p>
    ) : null}
  </div>
);

const RegistrationForm = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", phone: "", concern: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    const nextErrors = {
      name: name.length < 2,
      phone: phone.length < 9 || phone.length > 11,
    };

    if (nextErrors.name || nextErrors.phone) {
      setErrors(nextErrors);
      return;
    }

    const referralCode = String(
      searchParams.get("ref") || searchParams.get("leader") || "cong-ty"
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");

    setIsSubmitting(true);
    try {
      await submitToCRM({
        name,
        phone,
        email: "",
        targetFunnel: "ads",
        source_key: "luat_hap_dan_k47_web",
        courseName: "Luật Hấp Dẫn Online K47",
        course_k: "K47",
        batch_id: "LHD-K47",
        note: `Đăng ký tư vấn Luật Hấp Dẫn K47${form.concern ? ` – Nhu cầu: ${form.concern}` : ""}`,
        sourceUrl: window.location.href,
        landingPageId: "luat-hap-dan-k47",
        landingPageSlug: window.location.pathname,
        referrer: referralCode,
        referrer_type: referralCode === "cong-ty" ? "company_direct" : "employee_referral",
        introducedBy: referralCode,
        leader_utm: referralCode,
        leaderUtm: referralCode,
        leaderSlug: referralCode,
        utm_owner: referralCode,
        utm_owner_slug: referralCode,
        utm_source: searchParams.get("utm_source") || "website",
        utm_medium: searchParams.get("utm_medium") || "landing",
        utm_campaign: searchParams.get("utm_campaign") || "luat_hap_dan_k47",
        utm_content: searchParams.get("utm_content") || "",
        utm_term: searchParams.get("utm_term") || "",
        userAgent: navigator.userAgent,
      });

      setForm({ name: "", phone: "", concern: "" });
      setIsSuccess(true);
      toast.success("Mali Edu đã nhận thông tin của bạn!");
    } catch (error) {
      console.error("Lỗi gửi đăng ký Luật Hấp Dẫn:", error);
      toast.error("Chưa thể gửi thông tin. Vui lòng thử lại hoặc gọi hotline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="dang-ky-tu-van" className="relative z-20 -mt-1 px-4 pb-12 sm:px-6 lg:-mt-10 lg:pb-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[#e7c77d]/40 bg-[#fffaf0] shadow-[0_24px_70px_rgba(41,20,5,0.18)]">
        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          <div className="lhd-form-intro relative overflow-hidden px-6 py-8 text-white sm:px-9 sm:py-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#f5cf78]">Đăng ký nhận tư vấn</p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-[38px]">
              Kiểm tra chương trình có phù hợp với bạn
            </h2>
            <p className="mt-4 leading-7 text-[#eadbc7]">
              Để lại thông tin, đội ngũ Mali Edu sẽ gọi và trao đổi rõ ràng trước khi bạn quyết định tham gia.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#f8e8c8]">
              <LockKeyhole className="h-5 w-5 text-[#f5cf78]" />
              Thông tin chỉ dùng để tư vấn chương trình.
            </div>
          </div>

          <div className="px-5 py-7 sm:px-9 sm:py-10">
            {isSuccess ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center text-center" role="status">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-8 w-8" strokeWidth={3} />
                </div>
                <h3 className="mt-5 font-serif text-3xl font-bold text-[#2b180c]">Đăng ký thành công</h3>
                <p className="mt-3 max-w-md leading-7 text-[#6c5744]">
                  Mali Edu đã nhận được thông tin. Đội ngũ tư vấn sẽ liên hệ với bạn trong thời gian sớm nhất.
                </p>
                <a href={`tel:${HOTLINE}`} className="mt-5 inline-flex items-center gap-2 font-bold text-[#8d3f19] hover:underline">
                  <Phone className="h-4 w-4" /> Cần hỗ trợ ngay: 0355 067 656
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lhd-name" className="mb-2 block text-sm font-bold text-[#3c2818]">Họ và tên *</label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a826c]" />
                      <input
                        id="lhd-name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange("name")}
                        aria-invalid={errors.name || undefined}
                        aria-describedby={errors.name ? "lhd-name-error" : undefined}
                        placeholder="Nguyễn Văn An"
                        className={`lhd-input lhd-input--icon ${errors.name ? "lhd-input--error" : ""}`}
                      />
                    </div>
                    {errors.name ? <p id="lhd-name-error" className="mt-1.5 text-sm font-semibold text-red-700">Vui lòng nhập họ và tên.</p> : null}
                  </div>
                  <div>
                    <label htmlFor="lhd-phone" className="mb-2 block text-sm font-bold text-[#3c2818]">Số điện thoại *</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a826c]" />
                      <input
                        id="lhd-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        aria-invalid={errors.phone || undefined}
                        aria-describedby={errors.phone ? "lhd-phone-error" : undefined}
                        placeholder="09xx xxx xxx"
                        className={`lhd-input lhd-input--icon ${errors.phone ? "lhd-input--error" : ""}`}
                      />
                    </div>
                    {errors.phone ? <p id="lhd-phone-error" className="mt-1.5 text-sm font-semibold text-red-700">Vui lòng nhập số điện thoại hợp lệ.</p> : null}
                  </div>
                </div>

                <label htmlFor="lhd-concern" className="mt-4 mb-2 block text-sm font-bold text-[#3c2818]">Bạn đang quan tâm nhất đến</label>
                <div className="relative">
                  <select id="lhd-concern" value={form.concern} onChange={handleChange("concern")} className="lhd-input lhd-input--select appearance-none">
                    <option value="">Chọn nhu cầu tư vấn</option>
                    <option value="Cân bằng cảm xúc và chữa lành">Cân bằng cảm xúc và chữa lành</option>
                    <option value="Công việc và tài chính">Công việc và tài chính</option>
                    <option value="Mối quan hệ và gia đình">Mối quan hệ và gia đình</option>
                    <option value="Mục tiêu và phát triển bản thân">Mục tiêu và phát triển bản thân</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8d6747]" />
                </div>

                <button type="submit" disabled={isSubmitting} className="lhd-primary-button mt-5 w-full">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircleMore className="h-5 w-5" />}
                  {isSubmitting ? "ĐANG GỬI THÔNG TIN..." : "NHẬN TƯ VẤN CHƯƠNG TRÌNH"}
                  {!isSubmitting ? <ArrowRight className="h-5 w-5" /> : null}
                </button>
                <p className="mt-4 text-center text-xs leading-5 text-[#806e5e]">
                  Bằng việc gửi thông tin, bạn đồng ý để Mali Edu liên hệ tư vấn theo
                  {" "}<a href="/chinh-sach-bao-mat" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">chính sách bảo mật</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const LuatHapDan = () => {
  const seo = getRouteSeo("/dao-tao/luat-hap-dan");

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Luật Hấp Dẫn Online K47",
    description: seo.description,
    provider: {
      "@type": "Organization",
      name: "Mali Edu",
      url: "https://luathapdan.vn",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      startDate: "2026-09-22",
      endDate: "2026-10-30",
      location: {
        "@type": "VirtualLocation",
        url: "https://luathapdan.vn/dao-tao/luat-hap-dan",
      },
    },
  };

  return (
    <div className="lhd-landing min-h-screen overflow-hidden bg-[#fffaf0] text-[#3f2b1c]">
      <SEO
        {...seo}
        image={HERO_IMAGE}
        preloadLcpImage={HERO_IMAGE}
        keywords="luật hấp dẫn, khóa học luật hấp dẫn, tiềm thức, cân bằng cảm xúc, Mali Edu"
        jsonLd={courseSchema}
      />

      <header className="lhd-header">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" aria-label="Mali Edu - Trang chủ" className="flex items-center">
            <img src={MALI_LOGO_URL} alt="Mali Edu" className="h-10 w-auto max-w-[155px] object-contain brightness-0 invert" />
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#cbb99f]">Hotline tư vấn</p>
              <a href={`tel:${HOTLINE}`} className="text-base font-extrabold text-white hover:text-[#f5cf78]">0355 067 656</a>
            </div>
            <button type="button" onClick={scrollToRegistration} className="rounded-full border border-[#f0ca71]/60 bg-[#f0ca71] px-4 py-2.5 text-sm font-extrabold text-[#2a1607] transition hover:bg-[#ffe6a5] sm:px-5">
              Đăng ký tư vấn
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="lhd-hero relative px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:pb-32 lg:pt-16">
          <div className="lhd-orb lhd-orb--one" aria-hidden="true" />
          <div className="lhd-orb lhd-orb--two" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8bd61]/30 bg-[#e8bd61]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#f4d180]">
                <Sparkles className="h-4 w-4" /> Online K47 · 12 buổi chuyên sâu
              </div>
              <h1 className="mt-6 font-serif text-[40px] font-bold leading-[1.08] text-white sm:text-5xl lg:text-[62px]">
                Hiểu đúng
                <span className="lhd-gold-text mt-1 block">Luật Hấp Dẫn</span>
                để thay đổi từ gốc
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#e8dbc9] lg:mx-0">
                Một lộ trình thực hành giúp bạn làm việc với cảm xúc, tiềm thức và niềm tin — rồi chuyển hóa chúng thành mục tiêu và hành động rõ ràng.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <div className="lhd-hero-chip"><CalendarDays className="h-5 w-5" /><span><b>22/09/2026</b><small>Khai giảng</small></span></div>
                <div className="lhd-hero-chip"><Clock3 className="h-5 w-5" /><span><b>20:00 – 22:00</b><small>Thứ Ba & Thứ Sáu</small></span></div>
                <div className="lhd-hero-chip"><Video className="h-5 w-5" /><span><b>Học trực tuyến</b><small>Livestream qua Zoom</small></span></div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <button type="button" onClick={scrollToRegistration} className="lhd-primary-button w-full sm:w-auto">
                  NHẬN TƯ VẤN KHÓA HỌC <ArrowRight className="h-5 w-5" />
                </button>
                <a href={`tel:${HOTLINE}`} className="inline-flex items-center gap-2.5 font-bold text-[#f1dec1] transition hover:text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10"><Phone className="h-5 w-5" /></span>
                  0355 067 656
                </a>
              </div>
            </div>

            <figure className="lhd-hero-visual">
              <div className="lhd-hero-frame">
                <img src={HERO_IMAGE} alt="Khóa học Luật Hấp Dẫn Online K47 cùng Mong Coaching và Nguyễn Mong Thành" width="1674" height="940" className="h-auto w-full" fetchPriority="high" />
              </div>
              <figcaption className="sr-only">Thông tin khóa học Luật Hấp Dẫn Online K47</figcaption>
            </figure>
          </div>
        </section>

        <RegistrationForm />

        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Có thể bạn đang ở đây"
              title="Không phải bạn thiếu cố gắng"
              description="Đôi khi điều cần thay đổi trước tiên không phải là làm nhiều hơn, mà là nhìn rõ điều đang âm thầm kéo mình về phía cũ."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {painPoints.map((item, index) => (
                <article key={item} className="group flex gap-4 rounded-2xl border border-[#ead9ba] bg-white p-5 shadow-[0_10px_35px_rgba(79,45,15,0.06)] transition hover:-translate-y-0.5 hover:border-[#c89238] sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3a1c0c] font-serif text-lg font-bold text-[#f1ca73]">{index + 1}</span>
                  <p className="pt-1 text-base font-medium leading-7 text-[#5f4a38] sm:text-lg">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f4ead7] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Điểm khác biệt cốt lõi"
              title="Vì sao thực hành mãi mà cuộc sống vẫn chưa thay đổi?"
              description="Khóa học không bắt đầu bằng việc ép mình phải tích cực. Bạn được hướng dẫn nhìn vào toàn bộ chuỗi từ trạng thái bên trong đến lựa chọn và hành động bên ngoài."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {commonMistakes.map((mistake) => (
                <article key={mistake.number} className="relative overflow-hidden rounded-[22px] border border-[#dfc8a0] bg-[#fffdf8] p-6 shadow-[0_14px_35px_rgba(76,43,15,0.06)] sm:p-7">
                  <span className="absolute right-5 top-3 font-serif text-6xl font-bold text-[#8b4b1c]/[0.07]">{mistake.number}</span>
                  <div className="relative">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#a56a2b]">Sai lầm {mistake.number}</p>
                    <h3 className="mt-3 font-serif text-2xl font-bold text-[#321d0f]">{mistake.title}</h3>
                    <p className="mt-3 leading-7 text-[#6c5744]">{mistake.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-[28px] border border-[#cfae70] bg-[#2a1308] p-6 text-white shadow-[0_20px_55px_rgba(55,27,7,0.2)] sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#efc76d]">Lộ trình thay đổi</p>
                  <h3 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">Không nhảy cóc từ mong muốn tới kết quả</h3>
                  <p className="mt-4 leading-7 text-[#d9c9b4]">
                    Chương trình đi tuần tự để bạn hiểu vấn đề, ổn định nền tảng rồi mới làm việc với mục tiêu và nguồn lực.
                  </p>
                </div>
                <ol className="grid gap-3 sm:grid-cols-5">
                  {["Nhận diện", "Cân bằng", "Gỡ mô thức", "Làm rõ mục tiêu", "Hành động"].map((item, index) => (
                    <li key={item} className="lhd-process-step">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item}</strong>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="lhd-dark-section relative px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Hành trình chuyển hóa"
              title="Học để hiểu mình, thực hành để chuyển hóa"
              description="Chương trình kết nối kiến thức nền, bài thực hành và coaching để bạn ứng dụng vào đời sống một cách có hệ thống."
              light
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {outcomes.map(({ icon: Icon, title, text }) => (
                <article key={title} className="lhd-outcome-card">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5b65a]/15 text-[#f3c96d]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-bold text-white">{title}</h3>
                  <p className="mt-3 leading-7 text-[#d7c9b6]">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button type="button" onClick={scrollToRegistration} className="lhd-primary-button">
                TÔI MUỐN ĐƯỢC TƯ VẤN <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Mô hình đào tạo"
              title="Ba tầng chuyển hóa được kết nối xuyên suốt"
              description="Mỗi tầng giải quyết một câu hỏi khác nhau. Bỏ qua một tầng thường khiến việc thực hành thiếu nền tảng hoặc khó duy trì lâu dài."
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {transformationLayers.map(({ icon: Icon, step, title, question, description, practices }) => (
                <article key={step} className="lhd-layer-card">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#34190a] text-[#efc76d]"><Icon className="h-7 w-7" /></span>
                    <span className="rounded-full bg-[#f3e5cc] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#8c4e1e]">{step}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-3xl font-bold text-[#321d0f]">{title}</h3>
                  <p className="mt-3 font-semibold italic leading-6 text-[#9a5d25]">“{question}”</p>
                  <p className="mt-4 leading-7 text-[#6c5744]">{description}</p>
                  <div className="mt-6 border-t border-[#ead9bb] pt-5">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8d5b2b]">Nội dung thực hành</p>
                    <ul className="mt-3 space-y-2.5">
                      {practices.map((practice) => (
                        <li key={practice} className="flex gap-2.5 text-sm leading-6 text-[#5e4a39]">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#a56127]" /> {practice}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8f0e1] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              eyebrow="Lộ trình 12 buổi"
              title="Hai giai đoạn, một hành trình từ bên trong ra kết quả"
              description="Giai đoạn 1 xây nền cảm xúc và tiềm thức. Giai đoạn 2 đưa nền tảng ấy vào mục tiêu, công việc và kinh doanh."
            />

            <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
              <figure className="lhd-curriculum-poster">
                <div className="p-4 sm:p-5">
                  <span className="lhd-stage-pill">Giai đoạn 1 · Buổi 1–6</span>
                  <h3 className="mt-3 font-serif text-2xl font-bold text-[#321d0f]">Cân bằng cảm xúc</h3>
                </div>
                <img src={STAGE_ONE_IMAGE} alt="Lộ trình giai đoạn 1 khóa Luật Hấp Dẫn: cân bằng cảm xúc" width="942" height="1674" loading="lazy" className="w-full" />
              </figure>
              <figure className="lhd-curriculum-poster">
                <div className="p-4 sm:p-5">
                  <span className="lhd-stage-pill">Giai đoạn 2 · Buổi 7–12</span>
                  <h3 className="mt-3 font-serif text-2xl font-bold text-[#321d0f]">Bứt phá mục tiêu & kinh doanh</h3>
                </div>
                <img src={STAGE_TWO_IMAGE} alt="Lộ trình giai đoạn 2 khóa Luật Hấp Dẫn: bứt phá kết quả kinh doanh" width="942" height="1674" loading="lazy" className="w-full" />
              </figure>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-2">
              {curriculum.map((lesson) => (
                <details key={lesson.number} className="lhd-lesson group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3b1d0b] font-serif text-lg font-bold text-[#f2ca70]">{lesson.number}</span>
                    <span className="min-w-0 flex-1">
                      <small className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#a16825]">{lesson.phase}</small>
                      <strong className="mt-1 block text-base leading-6 text-[#3b2818] sm:text-lg">{lesson.title}</strong>
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#9c7a56] transition group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-[#eadbbf] px-4 py-5 pl-20 sm:px-5 sm:pl-[84px]">
                    <p className="leading-7 text-[#6f5946]">{lesson.detail}</p>
                    <ul className="mt-3 space-y-2">
                      {lesson.topics.map((topic) => (
                        <li key={topic} className="flex gap-2.5 text-sm leading-6 text-[#584434] sm:text-[15px]">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[#a76125]" strokeWidth={3} /> {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Cách chương trình vận hành"
              title="Một vòng học: hiểu – soi chiếu – thực hành – rà soát"
              description="Khoảng cách giữa hai buổi không phải thời gian chờ. Đó là lúc bạn đưa bài học vào tình huống thật và ghi nhận điều đang diễn ra."
            />
            <div className="relative grid gap-4 md:grid-cols-4">
              {learningMethod.map(({ icon: Icon, number, title, text }, index) => (
                <article key={number} className="relative rounded-[22px] border border-[#e4d1ae] bg-white p-6 shadow-[0_12px_32px_rgba(72,39,12,0.06)]">
                  {index < learningMethod.length - 1 ? <ArrowRight className="absolute -right-4 top-9 z-10 hidden h-7 w-7 rounded-full bg-[#fffaf0] p-1 text-[#b37a32] md:block" /> : null}
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-[#9f5c24]" />
                    <span className="font-serif text-2xl font-bold text-[#d5b57f]">{number}</span>
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-bold text-[#321d0f]">{title}</h3>
                  <p className="mt-3 leading-7 text-[#6c5744]">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-[#d8bd8e] bg-[#fff7e8] p-5 sm:flex-row sm:items-center sm:p-6">
              <ShieldCheck className="h-9 w-9 shrink-0 text-[#985520]" />
              <p className="leading-7 text-[#5e4937]">
                <strong className="text-[#342013]">Nguyên tắc của lớp:</strong> không dùng bài tập để phủ nhận cảm xúc thật. Bạn quan sát, gọi tên, thực hành đều và vẫn chủ động hành động trong đời sống thực tế.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#f4ead7] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Bạn nhận được gì"
              title="Không chỉ là 12 buổi lên Zoom"
              description="Một nhịp học vừa đủ để tiếp thu, thực hành và quay lại giải quyết những câu hỏi phát sinh trong quá trình áp dụng."
            />
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: PlayCircle, title: "Video xem lại", text: "Các buổi học được lưu lại để bạn chủ động ôn tập khi bận hoặc muốn thực hành sâu hơn." },
                { icon: CheckCircle2, title: "Bài tập ứng dụng", text: "Mỗi chủ đề đi kèm nội dung thực hành để kiến thức trở thành trải nghiệm của chính bạn." },
                { icon: HeartHandshake, title: "Coaching theo giai đoạn", text: "Các buổi coaching giúp rà soát điểm vướng, cân bằng nền tảng và làm rõ mục tiêu." },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-[24px] border border-[#dfcba6] bg-[#fffdf8] p-6 shadow-[0_15px_40px_rgba(78,44,13,0.06)] sm:p-7">
                  <Icon className="h-9 w-9 text-[#a25424]" />
                  <h3 className="mt-5 font-serif text-2xl font-bold text-[#321d0f]">{title}</h3>
                  <p className="mt-3 leading-7 text-[#6c5744]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lhd-toolkit-section relative px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Bộ công cụ sau khóa học"
              title="Những thực hành bạn có thể tiếp tục sử dụng lâu dài"
              description="Mục tiêu không phải ghi nhớ mọi khái niệm, mà là biết chọn đúng công cụ khi gặp bất an, xung đột, bế tắc hoặc mất phương hướng."
              light
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {practiceToolkit.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="rounded-[22px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-[#f0c76c]" />
                    <span className="font-serif text-2xl font-bold text-white/20">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold leading-7 text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#d7c8b5]">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-9 text-center">
              <button type="button" onClick={scrollToRegistration} className="lhd-primary-button">
                NHẬN TƯ VẤN LỘ TRÌNH <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Người đồng hành"
              title="Hai nhà huấn luyện, một lộ trình xuyên suốt"
              description="Nội dung được truyền đạt bằng ngôn ngữ gần gũi, gắn với trải nghiệm thực tế và những vấn đề học viên thường gặp."
            />
            <div className="grid gap-6 md:grid-cols-2">
              {coaches.map((coach) => (
                <article key={coach.name} className="group overflow-hidden rounded-[28px] border border-[#e5d1ad] bg-white shadow-[0_18px_50px_rgba(65,36,12,0.08)] sm:grid sm:grid-cols-[0.78fr_1.22fr]">
                  <div className="relative min-h-[300px] overflow-hidden bg-[#2b180c] sm:min-h-full">
                    <img src={coach.image} alt={coach.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2b180c]/50 to-transparent" />
                  </div>
                  <div className="p-6 sm:p-7">
                    <Quote className="h-9 w-9 text-[#c28b37]" />
                    <h3 className="mt-5 font-serif text-3xl font-bold text-[#2c190d]">{coach.name}</h3>
                    <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.1em] text-[#9b5d22]">{coach.role}</p>
                    <p className="mt-5 leading-7 text-[#6a5542]">{coach.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f4ead7] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Trước khi đăng ký"
              title="Chương trình sẽ phù hợp khi bạn sẵn sàng thực hành"
              description="Sự rõ ràng ngay từ đầu giúp bạn lựa chọn đúng và bước vào lớp với kỳ vọng thực tế."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[26px] border border-[#cba86d] bg-[#fffdf8] p-6 shadow-[0_16px_40px_rgba(69,38,12,0.07)] sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></span>
                  <h3 className="font-serif text-2xl font-bold text-[#321d0f]">Phù hợp với bạn nếu...</h3>
                </div>
                <ul className="mt-6 space-y-4">
                  {[
                    "Bạn muốn hiểu sâu hơn mối liên hệ giữa cảm xúc, niềm tin và hành động.",
                    "Bạn sẵn sàng dành thời gian thực hành đều giữa các buổi học.",
                    "Bạn đang cần cân bằng một vấn đề về bản thân, gia đình, công việc hoặc tiền bạc.",
                    "Bạn muốn làm rõ mục tiêu và xây một lộ trình hành động có định hướng.",
                    "Bạn kinh doanh và muốn nhìn lại mối quan hệ với khách hàng, sản phẩm, đối tác và đội nhóm.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 leading-7 text-[#5d4937]"><Check className="mt-1 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={3} /> {item}</li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[26px] border border-[#d9c4a0] bg-[#fffaf3] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eee1cf] text-[#865b37]"><XCircle className="h-6 w-6" /></span>
                  <h3 className="font-serif text-2xl font-bold text-[#321d0f]">Chưa phù hợp nếu...</h3>
                </div>
                <ul className="mt-6 space-y-4">
                  {[
                    "Bạn đang tìm một công thức làm giàu tức thì mà không cần thay đổi cách nghĩ hay hành động.",
                    "Bạn mong khóa học cam kết một kết quả tài chính giống nhau cho mọi học viên.",
                    "Bạn chỉ muốn nghe để biết nhưng chưa sẵn sàng quan sát và thực hành với chính mình.",
                    "Bạn muốn dùng chương trình thay thế việc khám, điều trị y khoa hoặc hỗ trợ tâm lý chuyên môn.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 leading-7 text-[#655342]"><XCircle className="mt-1 h-5 w-5 shrink-0 text-[#9a6b45]" /> {item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="lhd-final-cta px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="lhd-eyebrow lhd-eyebrow--light">Luật Hấp Dẫn Online K47</p>
            <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-white sm:text-5xl">
              Bắt đầu bằng một cuộc trao đổi rõ ràng
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#eadbc7]">
              Hãy để đội ngũ Mali Edu tìm hiểu mong muốn của bạn và tư vấn lộ trình phù hợp trước khi bạn quyết định.
            </p>
            <button type="button" onClick={scrollToRegistration} className="lhd-primary-button mt-8">
              ĐỂ LẠI THÔNG TIN TƯ VẤN <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <SectionTitle eyebrow="Câu hỏi thường gặp" title="Điều bạn có thể muốn biết" />
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="lhd-faq group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 font-bold text-[#3c2818] sm:px-6 sm:py-5 sm:text-lg">
                    {faq.question}
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#9a6528] transition group-open:rotate-180" />
                  </summary>
                  <p className="border-t border-[#eadbbf] px-5 py-5 leading-7 text-[#6c5744] sm:px-6">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#1e0f07] px-4 py-9 text-[#cdbca6] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <img src={MALI_LOGO_URL} alt="Mali Edu" loading="lazy" className="mx-auto h-10 w-auto max-w-[155px] object-contain brightness-0 invert sm:mx-0" />
            <p className="mt-3 text-sm">Đánh thức tiềm năng · Kiến tạo cuộc đời</p>
          </div>
          <div className="text-sm leading-7 sm:text-right">
            <a href={`tel:${HOTLINE}`} className="font-bold text-white hover:text-[#f5cf78]">Hotline: 0355 067 656</a>
            <p>Email: support.magiclife@gmail.com</p>
            <a href="/chinh-sach-bao-mat" className="hover:text-white hover:underline">Chính sách bảo mật</a>
          </div>
        </div>
      </footer>

      <div className="lhd-mobile-bar">
        <a href={`tel:${HOTLINE}`} aria-label="Gọi tư vấn" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c78f36]/30 bg-[#f8ead0] text-[#7b3e17]">
          <Phone className="h-5 w-5" />
        </a>
        <button type="button" onClick={scrollToRegistration} className="lhd-primary-button min-h-12 flex-1 px-4 py-3 text-sm">
          ĐĂNG KÝ TƯ VẤN <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default LuatHapDan;
