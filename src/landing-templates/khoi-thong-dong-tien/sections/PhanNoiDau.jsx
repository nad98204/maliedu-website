import { ArrowRight } from "lucide-react";

/* ─── Design Tokens (cùng palette BannerChinh) ─────────────────
   Primary:   #7A2113  (đỏ nâu)
   Gold:      #C9961A  (vàng gold)
   Cream bg:  #F5EDD8
   Text dark: #3A2208
   Border:    #D4B572
──────────────────────────────────────────────────────────────── */

const PainPoints = () => {
  const pains = [
    "Nỗ lực kiếm tiền nhưng vẫn không thấy kết quả, càng làm càng bế tắc.",
    "Muốn thay đổi tài chính mà không biết bắt đầu từ đâu.",
    "Áp lực vì tiền khiến năng lượng tụt, kinh doanh thì bế tắc, đơn hàng bị từ chối.",
    "Cuộc sống rối loạn: tinh thần, công việc, gia đình đều đi xuống.",
    "Nợ tăng mỗi ngày, làm mãi không đủ trả, càng xoay càng rối.",
  ];

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
      {pains.map((item, idx) => (
        <div
          key={item}
          className={`rounded-2xl bg-white/70 border border-[#D4B572]/40 px-5 py-5 shadow-sm ${
            idx === pains.length - 1 ? "sm:col-span-2 justify-self-center max-w-[540px] w-full" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-[#7A2113]/10 text-[#7A2113] text-sm font-bold flex items-center justify-center">
              {idx + 1}
            </span>
            <p className="text-[#3A2208] leading-relaxed text-[15px]">{item}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransformBlock = () => (
  <div className="relative rounded-2xl bg-white/70 border border-[#D4B572]/50 px-6 sm:px-10 py-8 sm:py-10 text-center"
       style={{ boxShadow: "0 8px 32px rgba(122,33,19,0.08)" }}>
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C9961A] to-transparent rounded-t-2xl" />
    <p className="text-[17px] sm:text-lg font-bold text-[#3A2208] mb-1">
      ĐỪNG LO, mọi vấn đề sẽ <span className="text-[#C9961A] font-extrabold">THÁO GỠ NGAY LẬP TỨC</span>
    </p>
    <p className="text-[#5C3A1A] text-base mb-2">Khi bạn thực sự thấu hiểu cách</p>
    <p className="text-2xl sm:text-3xl font-extrabold text-[#7A2113] uppercase tracking-[0.04em] mb-6">
      NĂNG LƯỢNG TIỀN BẠC VẬN HÀNH
    </p>
    <a
      href="#dang-ky"
      className="inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold uppercase tracking-[0.1em] text-[#FFE566] text-sm sm:text-base transition hover:-translate-y-[2px]"
      style={{ background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)", boxShadow: "0 10px 28px rgba(156,12,18,0.4)" }}
    >
      BẤM ĐỂ NHẬN VÉ THAM DỰ
      <ArrowRight className="w-5 h-5 text-[#FFE566]" />
    </a>
  </div>
);

const PhanNoiDau = () => (
  <section
    className="relative overflow-hidden rounded-3xl px-6 sm:px-10 py-14 sm:py-16 space-y-8"
    style={{ background: "linear-gradient(135deg, #FDF5E4 0%, #F7EBCC 100%)", border: "1px solid #D4B572", boxShadow: "0 20px 50px rgba(122,33,19,0.06)" }}
  >
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(201,150,26,0.12),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(122,33,19,0.1),transparent_38%)]" />
    <div className="relative max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col items-center space-y-3 text-center mb-6 lg:mb-8">
        <div>
          <span className="inline-block py-1.5 px-5 rounded-full text-[11px] font-bold tracking-[0.25em] uppercase border border-[#C9961A] bg-white/70 text-[#7A2113] backdrop-blur-sm">
            Bạn đang gặp gì?
          </span>
        </div>
        <div className="flex flex-col items-center w-full">
          <h2
            className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3A2208] to-[#7A2113] py-2"
            style={{ fontSize: "clamp(2.8rem, 11vw, 5rem)", letterSpacing: "0.15em", lineHeight: 1.3 }}
          >
            ĐIỀU GÌ?
          </h2>
          <h2
            className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7A2113] via-[#C9961A] to-[#7A2113] tracking-wide -mt-3 sm:-mt-5 lg:-mt-7 py-2"
            style={{ fontSize: "clamp(1.1rem, 4.5vw, 3.2rem)", lineHeight: 1.4 }}
          >
            ĐANG CẢN TRỞ DÒNG CHẢY
          </h2>
          <h2
            className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#C9961A] to-[#7A2113] tracking-wide -mt-3 sm:-mt-4 lg:-mt-6 py-2"
            style={{ fontSize: "clamp(1.4rem, 7vw, 3.5rem)", lineHeight: 1.4 }}
          >
            TIỀN BẠC CỦA BẠN
          </h2>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
        <div className="w-full lg:w-[60%] flex flex-col justify-center">
          <PainPoints />
        </div>
        <div className="w-full lg:w-[40%] flex flex-col justify-center">
          <TransformBlock />
        </div>
      </div>
    </div>
  </section>
);

export default PhanNoiDau;
