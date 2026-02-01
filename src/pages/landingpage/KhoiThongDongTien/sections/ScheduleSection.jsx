const sessions = [
  {
    badge: "BUỔI 1",
    title: '“THỨC TỈNH” NĂNG LƯỢNG TIỀN & LUẬT HẤP DẪN',
    points: [
      "Hiểu đúng về bản chất năng lượng tiền, và cách tầng số cảm xúc ảnh hưởng đến tiền.",
      "Dòng chảy quan trọng quyết định tài chính: Đến – Giữ – Tăng trưởng.",
      "Vì sao bạn nỗ lực mà vẫn không có tiền? Những lỗi sai phổ biến cần tháo gỡ ngay.",
      "Mối liên hệ giữa tâm trí, cảm xúc và kết quả tài chính – bạn đang thu hút điều gì?",
      "Ứng dụng Luật Hấp Dẫn để khơi thông năng lượng tài chính.",
    ],
  },
  {
    badge: "BUỔI 2",
    title: "GIẢI PHÓNG TẮC NGHẼN DÒNG TIỀN, GỠ ÁM THỊ TÀI CHÍNH",
    points: [
      "Khám phá những ám thị tài chính bạn đã vô thức mang theo từ gia đình, xã hội, tuổi thơ.",
      "Hiểu cách tổn thương tiền bạc trong quá khứ đang âm thầm chi phối thực tại.",
      "Làm rõ 5 tầng cảm xúc đang kìm hãm dòng tiền – bạn đang phát sóng điều gì ra ngoài?",
      "Thực hành chuyển hóa cảm xúc, chữa lành nội tâm, giải phóng năng lượng tiêu cực.",
      "Chữa lành tổn thương quá khứ với Tiền.",
    ],
  },
  {
    badge: "BUỔI 3",
    title: "KÍCH HOẠT DÒNG TIỀN BẰNG MỤC TIÊU TRUYỀN CẢM HỨNG",
    points: [
      "Vì sao một mục tiêu rõ ràng lại là “từ trường” mạnh mẽ nhất để hút tiền về.",
      "Cách đặt mục tiêu tài chính chuẩn năng lượng – chạm tầng rung động vũ trụ 540.",
      'Chuyển đổi từ “đặt mục tiêu để mong cầu” sang “niềm tin sở hữu”.',
      "Kết nối sâu với nội tâm để xác định mục tiêu thật sự đồng điệu với năng lượng của bạn.",
      "Tạo kế hoạch tài chính khả thi, nhẹ nhàng, nhưng đủ lực để tiền chảy về tự nhiên.",
    ],
  },
  {
    badge: "BUỔI 4",
    title: "THIẾT LẬP KẾ HOẠCH – KIỂM SOÁT HÀNH ĐỘNG ĐỂ ĐẠT MỤC TIÊU",
    points: [
      "Xây dựng kế hoạch tài chính rõ ràng, đồng điệu với năng lượng và nguồn lực cá nhân.",
      "Thiết lập hành động cụ thể đúng tầng số – không lan man, không gồng ép.",
      "Theo dõi – kiểm soát – điều chỉnh hành động để tạo ra kết quả rõ ràng.",
      "Kiểm soát tiềm thức để duy trì hiệu suất và kết quả tài chính bền vững.",
    ],
    highlight: true,
  },
];

const ScheduleSection = () => {
  return (
    <section className="relative py-16 sm:py-20 bg-[#F8F3E8] overflow-hidden rounded-[32px] border border-[#E8D9B2] shadow-[0_26px_70px_rgba(31,77,58,0.06)]">
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full opacity-20 blur-3xl bg-[#C7A44A]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-24 w-80 h-80 rounded-full opacity-20 blur-3xl bg-[#1F4D3A]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-14">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-bold tracking-[0.24em] uppercase mb-4 border border-[#C7A44A] bg-[#FAF7F0] text-[#1F4D3A]">
            Lộ trình chuyển hóa
          </span>
          <h2 className="pt-serif-bold text-3xl md:text-5xl text-[#1E2A2F] leading-tight mb-2">LỊCH TRÌNH 4 BUỔI</h2>
          <h3 className="pt-serif-bold italic text-2xl md:text-4xl text-[#C7A44A]">KHƠI THÔNG DÒNG TIỀN</h3>
        </div>

        <div className="relative">
          <div className="absolute top-0 bottom-0 left-[22px] md:left-1/2 w-[2px] bg-gradient-to-b from-transparent via-[#C7A44A] to-transparent" />
          <div className="space-y-8 md:space-y-0">
            {sessions.map((session, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={session.title}
                  className={`relative md:grid md:grid-cols-[0.92fr_auto_0.92fr] md:items-center md:gap-6 ${
                    idx === 0 ? "md:pt-4" : "md:-mt-24 lg:-mt-28"
                  }`}
                >
                  <div
                    className="absolute -top-1 left-[14px] md:left-1/2 md:-translate-x-1/2 z-20 flex items-center justify-center"
                  >
                    <div
                      className={`flex items-center justify-center rounded-full ${
                        session.highlight ? "w-10 h-10 bg-[#1F4D3A]" : "w-8 h-8 bg-[#C7A44A]"
                      } shadow-xl border-4 border-[#F8F3E8]`}
                    >
                      {session.highlight ? (
                        <svg className="w-5 h-5 text-[#C7A44A]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>

                  <div className={`mt-6 md:mt-0 ${isLeft ? "md:col-start-1 md:pr-4" : "md:col-start-3 md:pl-4"}`}>
                    <div
                      className={`relative bg-[#FDFBF6] ${
                        session.highlight ? "border-2 border-[#1F4D3A]" : "border border-[#E8D9B2]"
                      } rounded-2xl card-shadow transition-colors duration-300 hover:border-[#C7A44A] p-6 md:p-8`}
                    >
                      {session.highlight && <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1F4D3A]" />}
                      <span className="text-sm font-bold uppercase tracking-wider mb-2 block text-[#C7A44A]">
                        {session.badge}
                      </span>
                      <h3 className="text-xl pt-serif-bold mb-4 leading-snug text-[#1F4D3A]">{session.title}</h3>
                      <ul className="space-y-3 text-[#4B5563] text-sm md:text-base">
                        {session.points.map((point) => (
                          <li key={point} className="flex gap-3 items-start">
                            <span className="mt-[3px] text-[#C7A44A] font-bold">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      {session.highlight && (
                        <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full opacity-10 bg-[#C7A44A]" />
                      )}
                    </div>
                  </div>

                  <div className={`${isLeft ? "md:col-start-3" : "md:col-start-1"} hidden md:block`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
