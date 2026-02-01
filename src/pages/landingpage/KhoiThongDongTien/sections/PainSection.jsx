import { ArrowRight } from "lucide-react";

const PainPoints = () => {
  const pains = [
    "Nỗ lực kiếm tiền nhưng vẫn không thấy kết quả, càng làm càng bế tắc.",
    "Muốn thay đổi tài chính mà không biết bắt đầu từ đâu.",
    "Áp lực vì tiền khiến năng lượng tụt, kinh doanh thì bế tắc, đơn hàng bị từ chối.",
    "Cuộc sống rối loạn: tinh thần, công việc, gia đình đều đi xuống.",
    "Nợ tăng mỗi ngày, làm mãi không đủ trả, càng xoay càng rối.",
  ];

  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-5 max-w-4xl mx-auto sm:grid-cols-2">
      {pains.map((item, idx) => (
        <div
          key={item}
          className={`rounded-2xl bg-white/80 border border-[#E7DBC0] shadow-[0_10px_26px_rgba(31,77,58,0.06)] px-5 ${
            idx < 2 ? "py-6 sm:py-7" : "py-5 sm:py-6"
          } ${idx === pains.length - 1 ? "sm:col-span-2 justify-self-center max-w-[540px] w-full" : ""}`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1F4D3A]/10 text-[#1F4D3A] text-sm font-semibold">
              {idx + 1}
            </span>
            <p className="whitespace-pre-line roboto text-[#2A3A3F] leading-relaxed text-[15px]">{item}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransformBlock = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto text-center">
      <div className="relative rounded-[28px] bg-[#FFFCF7] border border-[#C7A44A] px-6 sm:px-10 py-10 sm:py-12 shadow-[0_18px_42px_rgba(31,77,58,0.06)]">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C7A44A]/60 rounded-t-[24px]" />
        <div className="space-y-3">
          <p className="roboto text-[17px] sm:text-[18px] font-bold text-[#1E2A2F]">
            ĐỪNG LO, mọi vấn đề sẽ <span className="text-[#C7A44A] font-extrabold">THÁO GỠ NGAY LẬP TỨC</span>
          </p>
          <p className="roboto text-base sm:text-lg text-[#4B5563]">Khi bạn thực sự thấu hiểu cách</p>
          <p className="pt-serif-bold text-3xl sm:text-[34px] text-[#1F4D3A] uppercase tracking-[0.04em]">
            NĂNG LƯỢNG TIỀN BẠC VẬN HÀNH
          </p>
        </div>
        <div className="mt-6">
          <a
            href="#dang-ky"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1F4D3A] via-[#184533] to-[#0f3527] px-10 sm:px-12 py-3.5 text-sm sm:text-base font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_rgba(31,77,58,0.25)] hover:-translate-y-[2px] transition"
          >
            BẤM ĐỂ NHẬN VÉ THAM DỰ
            <ArrowRight className="w-5 h-5 text-[#C7A44A]" />
          </a>
        </div>
        <p className="roboto text-[12px] text-[#4B5563] italic mt-3">Số lượng vé có hạn - Đăng ký ngay hôm nay</p>
      </div>
    </div>
  );
};

const PainSection = () => {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#F8F3E8] border border-[#E8D9B2] px-6 sm:px-10 lg:px-12 py-14 sm:py-18 space-y-8 shadow-[0_30px_80px_rgba(31,77,58,0.05)]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_20%,rgba(199,164,74,0.14),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(31,77,58,0.12),transparent_40%)]" />
      <div className="relative max-w-4xl mx-auto space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-[12px] tracking-[0.22em] uppercase text-[#1F4D3A] font-semibold">Bạn đang gặp gì?</p>
          <div className="space-y-1">
            <h2 className="pt-serif-bold text-[2.5rem] sm:text-[2.9rem] leading-[1.16] text-[#2A3A3F] tracking-[0.04em]">
              ĐIỀU GÌ ĐANG CẢN TRỞ
            </h2>
            <h2 className="pt-serif-bold text-[2.8rem] sm:text-[3.2rem] leading-[1.05] text-[#1F4D3A] tracking-[0.08em]">
              DÒNG CHẢY TIỀN BẠC
            </h2>
            <h2 className="pt-serif-bold text-[2.5rem] sm:text-[2.9rem] leading-[1.16] text-[#2A3A3F] tracking-[0.04em]">
              CỦA BẠN?
            </h2>
          </div>
        </div>

        <PainPoints />
        <TransformBlock />
      </div>
    </section>
  );
};

export default PainSection;
