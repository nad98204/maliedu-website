const TREE_IMG = "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1772679328351-749384425--Pngtree-money-tree-concept-plant-growing-18245719.png";

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
      paddingTop: "4rem",
      paddingBottom: "4rem",
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
      <div className="relative z-10 text-center mb-6 sm:mb-20 space-y-3">
        <span className="inline-block py-1.5 px-5 rounded-full text-[11px] font-bold tracking-[0.25em] uppercase mb-4 border border-[#C9961A] bg-white/70 text-[#7A2113] backdrop-blur-sm">
          Lộ trình chuyển hóa
        </span>
        <h2 className="text-3xl sm:text-6xl lg:text-7xl font-black text-[#3A2208] tracking-tight leading-none whitespace-nowrap">
          LỊCH TRÌNH 4 BUỔI
        </h2>
        <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#7A2113] mt-2 leading-snug">
          KHƠI THÔNG DÒNG TIỀN
        </h3>
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
        {/* Tree image centered */}
        <div className="w-44 mx-auto mb-1">
          <img
            src={TREE_IMG}
            alt="Cây tri thức"
            className="w-full object-contain"
            style={{ mixBlendMode: "multiply", filter: "brightness(1.0) saturate(1.15)" }}
          />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line — fades at top and bottom */}
          <div
            className="absolute top-0 bottom-0 w-[3px] rounded-full"
            style={{
              left: "9px",
              background: "linear-gradient(to bottom, transparent 0%, #C9961A 12%, #7A4A18 50%, #4F8B1A 88%, transparent 100%)",
            }}
          />

          <div className="space-y-5">
            {sessions.map((session) => (
              <div key={session.title} className="relative flex gap-3 items-start">
                {/* Ping dot */}
                <div
                  className="flex-shrink-0 relative mt-1"
                  style={{ width: "20px", height: "20px" }}
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: session.color,
                      opacity: 0.6,
                      animation: "treePing 1.4s cubic-bezier(0,0,0.2,1) infinite",
                    }}
                  />
                  <span
                    className="relative flex w-full h-full rounded-full items-center justify-center"
                    style={{
                      background: session.highlight ? "#7A2113" : session.color,
                      border: "3px solid white",
                      boxShadow: `0 0 0 2px ${session.color}55`,
                    }}
                  >
                    {session.highlight && (
                      <svg className="w-2.5 h-2.5 text-[#FFE566]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </span>
                </div>

                {/* Card */}
                <div
                  className="relative bg-white rounded-2xl p-4 flex-1"
                  style={{
                    border: session.highlight ? "2px solid #7A2113" : `1px solid ${session.color}77`,
                    boxShadow: session.highlight
                      ? "0 8px 28px rgba(122,33,19,0.18)"
                      : "0 4px 18px rgba(60,30,0,0.09)",
                  }}
                >
                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                    style={{
                      background: session.highlight
                        ? "linear-gradient(90deg, #7A2113, #C9961A, #7A2113)"
                        : `linear-gradient(90deg, transparent, ${session.color}, transparent)`,
                    }}
                  />
                  {session.highlight && (
                    <div
                      className="absolute -top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow"
                      style={{ background: "linear-gradient(135deg, #7A2113, #C9961A)" }}
                    >
                      ★ Tổng kết
                    </div>
                  )}
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5 block"
                    style={{ color: session.color }}
                  >
                    {session.badge}
                  </span>
                  <h3 className="text-[13px] font-extrabold mb-2 leading-snug text-[#7A2113]">
                    {session.title}
                  </h3>
                  <ul className="space-y-1.5 text-[#5C3A1A] text-[12px]">
                    {session.points.map((point) => (
                      <li key={point} className="flex gap-1.5 items-start">
                        <span className="font-bold flex-shrink-0 mt-[1px]" style={{ color: session.color }}>•</span>
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  </section>
);

export default LichTrinhHoc;
