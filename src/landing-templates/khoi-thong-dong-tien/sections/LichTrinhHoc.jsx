const TREE_IMG = "/assets/landing/khoi-thong-dong-tien/money-tree.webp";

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
    color: "#C9961A",
    pos: { top: "3%", left: "1%", width: "27%" },
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
    color: "#B5851A",
    pos: { top: "3%", right: "1%", width: "27%" },
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
    color: "#A07020",
    pos: { top: "53%", left: "1%", width: "27%" },
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
    color: "#7A2113",
    pos: { top: "53%", right: "1%", width: "27%" },
  },
];

const LichTrinhHoc = () => (
  <section
    className="relative rounded-3xl overflow-hidden"
    style={{
      background: "linear-gradient(160deg, #EDF6E2 0%, #FDF5E4 45%, #F7EBCC 100%)",
      border: "1px solid #D4B572",
      boxShadow: "0 20px 50px rgba(122,33,19,0.06)",
      marginTop: "1.5rem",
      paddingTop: "3rem",
      paddingBottom: "3rem",
    }}
  >
    {/* Background orbs */}
    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full opacity-[0.07] blur-3xl bg-[#C9961A] pointer-events-none" />
    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full opacity-[0.06] blur-3xl bg-[#4A8A1A] pointer-events-none" />

    <style>{`
      @keyframes treePing {
        0%   { transform: scale(1);   opacity: 0.75; }
        70%  { transform: scale(2.2); opacity: 0; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `}</style>

    <div className="relative max-w-7xl mx-auto px-6 sm:px-10">

      {/* ── HEADER ── */}
      <div
        className="relative z-10 mb-8 min-h-[17rem] overflow-hidden rounded-[1.7rem] border border-[#D4B572]/70 bg-white/55 px-5 py-6 text-left shadow-[0_16px_40px_rgba(91,49,14,0.08)] backdrop-blur-sm md:hidden"
      >
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#DDBB55]/15 blur-2xl" />
        <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full border border-[#D4B572]/30 bg-[#FFF7DA]/65" />

        <span className="relative inline-flex items-center gap-2 rounded-full border border-[#C9961A]/70 bg-white/80 px-3.5 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-[#7A2113]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9961A]" />
          Lộ trình chuyển hóa
        </span>

        <h2 className="relative mt-5 font-black uppercase">
          <span className="flex items-center gap-2.5 text-[0.92rem] tracking-[0.06em] text-[#3A2208]">
            Lịch trình
            <span className="rounded-full bg-[#C9961A] px-2.5 py-1 text-[0.62rem] tracking-[0.12em] text-white shadow-[0_5px_12px_rgba(201,150,26,0.25)]">
              4 buổi
            </span>
          </span>
          <span className="mt-2.5 block text-[1.75rem] leading-[1.02] tracking-[-0.035em] text-[#7A2113]">
            Khơi thông
          </span>
          <span className="block text-[1.75rem] leading-[1.08] tracking-[-0.035em] text-[#7A2113]">
            dòng tiền
          </span>
        </h2>

        <p className="relative mt-5 border-l-2 border-[#C9961A]/60 pl-3 pr-[6.25rem] text-[0.74rem] leading-[1.6] text-[#5C3A1A]/75">
          Đi từ nhận diện điểm nghẽn đến xây dựng kế hoạch hành động rõ ràng.
        </p>

        <img
          src={TREE_IMG}
          alt="Cây tài chính phát triển qua 4 buổi học"
          className="absolute bottom-2 right-1 w-[6.5rem] object-contain drop-shadow-[0_12px_16px_rgba(91,49,14,0.2)]"
          loading="lazy"
          decoding="async"
          style={{ mixBlendMode: "multiply", filter: "brightness(1.02) saturate(1.08)" }}
        />
      </div>

      <div className="relative z-10 mb-20 hidden space-y-3 text-center md:block">
        <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C9961A]/80 bg-white/80 px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#7A2113] shadow-[0_6px_20px_rgba(122,33,19,0.06)] backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9961A]" />
          Lộ trình chuyển hóa
        </span>
        <h2 className="font-black uppercase leading-[1.08] tracking-[-0.035em]">
          <span className="block whitespace-nowrap text-6xl text-[#3A2208] lg:text-7xl">LỊCH TRÌNH 4 BUỔI</span>
          <span className="mt-2 block text-5xl text-[#7A2113] lg:text-6xl">KHƠI THÔNG DÒNG TIỀN</span>
        </h2>
        <p className="mx-auto max-w-xl pt-1 text-base leading-[1.65] text-[#5C3A1A]/75">
          Đi từ nhận diện điểm nghẽn đến xây dựng kế hoạch hành động rõ ràng.
        </p>
      </div>

      {/* ── DESKTOP: tree + overlaid cards ── */}
      <div className="hidden md:block relative" style={{ height: "980px" }}>

        {/* Tree image — centered in the container */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <img
            src={TREE_IMG}
            alt="Cây tri thức"
            loading="lazy"
            decoding="async"
            style={{
              width: "55%",
              maxWidth: "650px",
              objectFit: "contain",
              mixBlendMode: "multiply",
              filter: "brightness(1.0) saturate(1.1) contrast(1.05)",
            }}
          />
        </div>

        {/* Cards — absolutely positioned on tree branches */}
        {sessions.map((session) => (
          <div
            key={session.title}
            className="absolute"
            style={{ ...session.pos, zIndex: 1 }}
          >
            {/* Connector dot with pulse animation */}
            <div
              className="absolute"
              style={{
                ...(session.pos.left !== undefined
                  ? { right: "-14px", top: "50%", transform: "translateY(-50%)" }
                  : { left: "-14px", top: "50%", transform: "translateY(-50%)" }),
                zIndex: 2,
                width: "16px",
                height: "16px",
              }}
            >
              {/* Ping ring */}
              <span
                className="absolute inline-flex rounded-full opacity-75"
                style={{
                  inset: 0,
                  background: session.color,
                  animation: "treePing 1.4s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
              {/* Static dot */}
              <span
                className="relative inline-flex rounded-full w-full h-full"
                style={{
                  background: session.color,
                  border: "3px solid white",
                  boxShadow: `0 0 0 3px ${session.color}55, 0 2px 8px rgba(0,0,0,0.2)`,
                }}
              />
            </div>

            <div
              className="relative bg-white rounded-2xl p-6 transition-transform duration-300 hover:scale-[1.015] hover:-translate-y-1"
              style={{
                border: session.highlight ? "2px solid #7A2113" : `1px solid ${session.color}99`,
                boxShadow: session.highlight
                  ? "0 16px 48px rgba(122,33,19,0.28), 0 4px 16px rgba(0,0,0,0.12)"
                  : `0 10px 36px rgba(60,30,0,0.16), 0 3px 12px rgba(0,0,0,0.10)`,
              }}
            >
              {/* Top bar */}
              <div
                className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl"
                style={{
                  background: session.highlight
                    ? "linear-gradient(90deg, #7A2113, #C9961A, #7A2113)"
                    : `linear-gradient(90deg, transparent, ${session.color}, transparent)`,
                }}
              />
              {session.highlight && (
                <div
                  className="absolute -top-3.5 right-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow"
                  style={{ background: "linear-gradient(135deg, #7A2113, #C9961A)" }}
                >
                  ★ Tổng kết
                </div>
              )}
              <span className="text-[13px] font-extrabold uppercase tracking-wider mb-2 block" style={{ color: session.color }}>
                {session.badge}
              </span>
              <h3 className="text-[16px] font-extrabold mb-3 leading-snug text-[#7A2113]">
                {session.title}
              </h3>
              <ul className="space-y-2 text-[#5C3A1A]" style={{ fontSize: "13.5px" }}>
                {session.points.map((point) => (
                  <li key={point} className="flex gap-1.5 items-start">
                    <span className="mt-[2px] font-bold flex-shrink-0" style={{ color: session.color }}>•</span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        {/* Timeline */}
        <div>
          <div className="space-y-5">
            {sessions.map((session) => (
              <div key={session.title}>
                {/* Card */}
                <article
                  className="relative overflow-hidden rounded-[1.35rem] bg-white/95"
                  style={{
                    border: session.highlight ? "1.5px solid #7A2113" : `1px solid ${session.color}66`,
                    boxShadow: session.highlight
                      ? "0 14px 34px rgba(122,33,19,0.16), 0 3px 10px rgba(91,49,14,0.06)"
                      : "0 10px 28px rgba(91,49,14,0.08), 0 2px 8px rgba(91,49,14,0.04)",
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{
                      background: session.highlight
                        ? "linear-gradient(90deg, #7A2113, #C9961A, #7A2113)"
                        : `linear-gradient(90deg, transparent, ${session.color}, transparent)`,
                    }}
                  />

                  <div className="px-4 pb-4 pt-4">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em]"
                        style={{
                          color: session.highlight ? "#FFFFFF" : session.color,
                          background: session.highlight ? "#7A2113" : `${session.color}14`,
                          border: session.highlight ? "none" : `1px solid ${session.color}35`,
                        }}
                      >
                        {session.badge}
                      </span>
                      {session.highlight && (
                        <span className="text-[0.6rem] font-black uppercase tracking-[0.12em] text-[#9A6610]">
                          ★ Tổng kết
                        </span>
                      )}
                    </div>

                    <h3 className="mb-3 text-[0.83rem] font-black uppercase leading-[1.4] tracking-[-0.01em] text-[#7A2113]">
                      {session.title}
                    </h3>

                    <div
                      className="mb-3 h-px w-full"
                      style={{ background: `linear-gradient(90deg, ${session.color}55, transparent)` }}
                    />

                    <ul className="space-y-2.5">
                      {session.points.map((point) => (
                        <li key={point} className="grid grid-cols-[17px_1fr] items-start gap-2">
                          <span
                            className="mt-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full text-[0.58rem] font-black"
                            style={{ color: session.color, background: `${session.color}12` }}
                          >
                            ✓
                          </span>
                          <span className="text-[0.76rem] leading-[1.5] text-[#5C3A1A]">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  </section>
);

export default LichTrinhHoc;
