import { ArrowRight, BriefcaseBusiness, Building2, Clock, Users } from "lucide-react";

const DoiTuongPhuHop = () => {
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
    <section
      className="relative overflow-hidden rounded-3xl py-14 sm:py-16"
      style={{ background: "linear-gradient(135deg, #FDF5E4 0%, #F7EBCC 100%)", border: "1px solid #D4B572", boxShadow: "0 20px 50px rgba(122,33,19,0.06)" }}
    >
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#D4B572_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
      <div className="relative max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-10 space-y-10 lg:space-y-14">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.06em] text-[#7A2113]">
            KHÓA HỌC NÀY{" "}
            <span className="relative inline-block">
              PHÙ HỢP VỚI
              <span className="absolute bottom-0 left-0 w-full h-2 opacity-40 -mb-1 rounded-full bg-[#C9961A]" />
            </span>
          </h2>
          <p className="text-base text-[#5C3A1A]">
            Nếu bạn thấy mình trong những mô tả dưới đây, thì chương trình này được thiết kế chính xác dành cho bạn.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {cards.map(({ title, desc, Icon, highlight }) => (
            <div
              key={title}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white/70 transition duration-300 hover:-translate-y-1"
              style={{
                border: highlight ? "2px solid #C9961A" : "1px solid #D4B572",
                boxShadow: highlight
                  ? "0 12px 32px rgba(201,150,26,0.18)"
                  : "0 6px 20px rgba(122,33,19,0.06)",
              }}
            >
              {highlight && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent rounded-t-2xl" />
              )}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#F5EDD8", border: "1px solid #D4B572" }}
              >
                <Icon className="w-7 h-7 text-[#7A2113]" strokeWidth={1.6} />
              </div>
              <h3 className="text-lg font-extrabold mb-2 uppercase tracking-wide text-[#7A2113] leading-snug">
                {title}
              </h3>
              <div className="w-10 h-0.5 mb-4 rounded-full bg-[#C9961A]" />
              <p className="text-sm leading-relaxed text-[#5C3A1A]">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <a
            href="#dang-ky"
            className="inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold uppercase tracking-[0.1em] text-[#FFE566] text-sm sm:text-base transition hover:-translate-y-[2px]"
            style={{ background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)", boxShadow: "0 10px 28px rgba(156,12,18,0.4)" }}
          >
            BẤM ĐỂ NHẬN VÉ THAM DỰ
            <ArrowRight className="w-5 h-5 text-[#FFE566]" />
          </a>
          <div className="flex items-center gap-2 text-sm italic text-[#C9961A]">
            <Clock className="w-4 h-4" />
            <span>Ưu đãi có giới hạn thời gian</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoiTuongPhuHop;
