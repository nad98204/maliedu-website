const sessions = [
  {
    badge: "BUỔI 1",
    title: "THỨC TỈNH NĂNG LƯỢNG TIỀN & LUẬT HẤP DẪN",
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
      "Vì sao một mục tiêu rõ ràng lại là từ trường mạnh mẽ nhất để hút tiền về.",
      "Cách đặt mục tiêu tài chính chuẩn năng lượng – chạm tầng rung động vũ trụ 540.",
      "Chuyển đổi từ đặt mục tiêu để mong cầu sang niềm tin sở hữu.",
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

const LichTrinhHoc = () => (
  <section
    className="relative rounded-3xl py-14 sm:py-16 overflow-hidden"
    style={{
      background: "linear-gradient(135deg, #FDF5E4 0%, #F7EBCC 100%)",
      border: "1px solid #D4B572",
      boxShadow: "0 20px 50px rgba(122,33,19,0.06)",
    }}
  >
    {/* Orb decorations – valid opacity values */}
    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full opacity-[0.12] blur-3xl bg-[#C9961A] pointer-events-none" />
    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full opacity-[0.10] blur-3xl bg-[#7A2113] pointer-events-none" />

    <div className="relative max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-10">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block py-1 px-4 rounded-full text-xs font-bold tracking-[0.22em] uppercase mb-3 border border-[#C9961A] bg-white/60 text-[#7A2113]">
          Lộ trình chuyển hóa
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3A2208] leading-tight mb-1">
          LỊCH TRÌNH 4 BUỔI
        </h2>
        <h3 className="text-2xl sm:text-3xl font-extrabold italic text-[#C9961A]">
          KHƠI THÔNG DÒNG TIỀN
        </h3>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line – desktop center */}
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-b from-transparent via-[#C9961A] to-transparent pointer-events-none" />
        {/* Vertical line – mobile left side, aligned with dot center (dot=32px, center=16px) */}
        <div className="md:hidden absolute top-4 bottom-4 left-4 w-[2px] bg-gradient-to-b from-[#C9961A] via-[#C9961A] to-transparent pointer-events-none" />

        <div className="space-y-6 md:space-y-0">
          {sessions.map((session, idx) => {
            const isLeft = idx % 2 === 0;

            const dot = (
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-8">
                <div
                  className={`flex items-center justify-center rounded-full border-4 border-[#F5EDD8] shadow-lg ${
                    session.highlight ? "w-10 h-10 bg-[#7A2113]" : "w-8 h-8 bg-[#C9961A]"
                  }`}
                >
                  {session.highlight ? (
                    <svg className="w-4 h-4 text-[#FFE566]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            );

            const card = (
              <div
                className="relative bg-white/75 rounded-2xl p-5 md:p-6 transition hover:scale-[1.01] flex-1"
                style={{
                  border: session.highlight ? "2px solid #7A2113" : "1px solid #D4B572",
                  boxShadow: session.highlight
                    ? "0 16px 40px rgba(122,33,19,0.18)"
                    : "0 6px 20px rgba(122,33,19,0.05)",
                }}
              >
                {session.highlight && (
                  <div
                    className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl"
                    style={{ background: "linear-gradient(90deg, #7A2113, #C9961A, #7A2113)" }}
                  />
                )}
                {session.highlight && (
                  <div
                    className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: "linear-gradient(135deg, #7A2113, #C9961A)" }}
                  >
                    ★ Tổng kết
                  </div>
                )}
                <span className="text-xs font-extrabold uppercase tracking-wider mb-2 block text-[#C9961A]">
                  {session.badge}
                </span>
                <h3 className="text-[15px] font-extrabold mb-3 leading-snug text-[#7A2113]">
                  {session.title}
                </h3>
                <ul className="space-y-2 text-[#5C3A1A] text-sm">
                  {session.points.map((point) => (
                    <li key={point} className="flex gap-2 items-start">
                      <span className="mt-[3px] text-[#C9961A] font-bold flex-shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

            return (
              <div key={session.title}>
                {/* ── MOBILE: flex row (dot | card) ── */}
                <div className={`flex gap-4 items-start md:hidden ${idx > 0 ? "pt-2" : ""}`}>
                  {dot}
                  {card}
                </div>

                {/* ── DESKTOP: alternating grid ── */}
                <div
                  className={`hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6 ${
                    idx === 0 ? "md:pt-4" : "md:-mt-20"
                  }`}
                >
                  {isLeft ? (
                    <>
                      <div className="md:col-start-1 md:pr-4">{card}</div>
                      <div className="md:col-start-2 flex justify-center">{dot}</div>
                      <div className="md:col-start-3" />
                    </>
                  ) : (
                    <>
                      <div className="md:col-start-1" />
                      <div className="md:col-start-2 flex justify-center">{dot}</div>
                      <div className="md:col-start-3 md:pl-4">{card}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

  </section>
);

export default LichTrinhHoc;
