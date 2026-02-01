import { ArrowRight, BriefcaseBusiness, Building2, Clock, Users } from "lucide-react";

const TargetAudience = () => {
  const cards = [
    {
      title: "Người đang bế tắc tài chính",
      highlight: false,
      Icon: Users,
      desc: "Bạn đang muốn tìm ra một hướng đi rõ ràng, thoát khỏi sự mông lung và tạo ra nguồn thu nhập bền vững cho bản thân.",
    },
    {
      title: "Người kinh doanh",
      highlight: true,
      Icon: BriefcaseBusiness,
      desc: "Bán hàng mãi không ra đơn, càng cố gắng càng nản chí, năng lượng tụt dốc mỗi ngày vì kết quả không như ý.",
    },
    {
      title: "Chủ doanh nghiệp",
      highlight: false,
      Icon: Building2,
      desc: "Đang chịu áp lực tài chính đè nặng, sống trong lo âu, mệt mỏi với trách nhiệm chồng chất lên vai.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAF7F0] py-16 sm:py-20">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#E8D9B2_1px,transparent_1px)] bg-[length:32px_32px]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl pt-serif-bold uppercase tracking-[0.06em] text-[#1F4D3A]">
            KHÓA HỌC NÀY{" "}
            <span className="relative inline-block">
              PHÙ HỢP VỚI
              <span className="absolute bottom-0 left-0 w-full h-2 opacity-35 -mb-1 rounded-full bg-[#C7A44A]" />
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-[#4B5563] roboto">
            Nếu bạn thấy mình trong những mô tả dưới đây, thì chương trình này được thiết kế chính xác dành cho bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.map(({ title, desc, Icon, highlight }) => (
            <div
              key={title}
              className={`relative flex flex-col items-center text-center p-7 rounded-2xl border bg-[#FDFBF6] shadow-[0_4px_20px_-2px_rgba(31,77,58,0.08),0_10px_30px_-5px_rgba(199,164,74,0.1)] transition duration-300 ${
                highlight ? "md:-translate-y-1" : ""
              } hover:-translate-y-2 hover:border-[#C7A44A] hover:shadow-[0_20px_40px_-5px_rgba(31,77,58,0.12),0_12px_24px_-6px_rgba(199,164,74,0.14)]`}
              style={{ borderColor: "#E8D9B2" }}
            >
              {highlight && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C7A44A] to-transparent opacity-60" />
              )}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-sm transition-transform duration-300"
                style={{ backgroundColor: "#F6F2EA", border: "1px solid #E8D9B2" }}
              >
                <Icon className="w-8 h-8 text-[#1F4D3A]" strokeWidth={1.6} />
              </div>
              <h3 className="text-xl pt-serif-bold mb-3 uppercase tracking-wide text-[#1F4D3A] leading-snug">
                {title}
              </h3>
              <div className="w-12 h-1 mb-5 rounded-full bg-[#E8D9B2]" />
              <p className="text-base leading-relaxed text-[#4B5563] roboto">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <a
            href="#dang-ky"
            className="group relative inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white rounded-full shadow-lg hover:-translate-y-1 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F4D3A]"
            style={{ backgroundColor: "#1F4D3A" }}
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
            <span className="relative flex items-center gap-3">
              BẤM ĐỂ NHẬN VÉ THAM DỰ
              <ArrowRight className="w-5 h-5 text-[#C7A44A] transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </a>
          <div className="flex items-center gap-2 text-sm italic text-[#C7A44A] roboto">
            <Clock className="w-4 h-4" />
            <span>Ưu đãi có giới hạn thời gian</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TargetAudience;
