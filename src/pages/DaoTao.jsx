import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const diagramPoints = [
  { label: "Tiền bạc", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-3" },
  { label: "Gia đình", className: "top-10 right-0 translate-x-2" },
  {
    label: "Mối quan hệ",
    className: "top-1/2 right-0 -translate-y-1/2 translate-x-3",
  },
  {
    label: "Học tập – Phát triển",
    className: "bottom-10 right-1 translate-x-2",
  },
  { label: "Sức khỏe", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-3" },
  {
    label: "Thế giới nội tâm – Tâm linh",
    className: "top-1/2 left-0 -translate-y-1/2 -translate-x-3",
  },
];

const DiagramLabel = ({ label, className }) => (
  <div
    className={`absolute text-[11px] sm:text-xs font-semibold text-[#6a3f0d] bg-white/95 border border-[#e6c98c] shadow-sm rounded-full px-3 py-1 text-center leading-snug ${className}`}
  >
    {label}
  </div>
);

const FlowUnlockSection = () => {
  return (
    <section id="khoi-thong-dong-tien" className="bg-[#f7f2e9]">
      <div className="bg-[#6b3f0f] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-center py-3">
        4 BUỔI TỐI HỌC ONLINE MIỄN PHÍ
      </div>

      <div className="bg-gradient-to-r from-[#f5d18f] via-[#e9b85f] to-[#d99c3b] text-center py-10 px-4">
        <p className="text-white/85 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.26em]">
          Khóa trải nghiệm
        </p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase leading-tight text-[#fdf5df] drop-shadow-sm">
          KHƠI THÔNG DÒNG TIỀN
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        <div className="bg-white border border-[#e9d5a7] rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <div className="relative h-72 md:h-80 overflow-hidden rounded-xl border border-[#e9d5a7] bg-gradient-to-br from-white via-[#f8efd7] to-[#f1d79a] shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80"
                    alt="Coach hướng dẫn khóa Khơi Thông Dòng Tiền"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f05]/55 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/90 text-[#6b3f0f] text-xs font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full shadow-md">
                    Coach
                  </div>
                </div>
                <p className="text-[13px] text-[#6a3f0d] font-medium bg-[#f7e8c4] border border-[#e6c98c] rounded-lg px-4 py-2 shadow-sm">
                  Trải nghiệm trực tuyến cùng huấn luyện viên, tương tác trực tiếp và thực hành ngay trong buổi học.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fdf5df] via-[#f3dc9c] to-[#e3bb63] border border-[#dfc37a] shadow-[0_12px_30px_rgba(0,0,0,0.08)]" />
                  <div className="absolute inset-5 rounded-full border border-[#e1c681] bg-white/60 backdrop-blur-[2px]" />
                  <div className="absolute inset-10 rounded-full border border-[#e8d49c]" />
                  <div className="absolute inset-16 flex items-center justify-center">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white border border-[#e9d5a7] flex items-center justify-center text-center text-sm font-semibold text-[#6b3f0f] leading-snug shadow-inner">
                      Dòng tiền
                      <br />
                      mở dòng
                    </div>
                  </div>
                  {diagramPoints.map((point) => (
                    <DiagramLabel key={point.label} {...point} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center px-2">
          <p className="text-base sm:text-lg text-[#4b3b2b] leading-relaxed font-medium italic">
            “Giúp bạn giải phóng tắc nghẽn tài chính, nâng cao tần số nội tâm và xây dựng lộ trình đạt mục tiêu tài chính”
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="w-full sm:w-auto rounded-full bg-red-700 hover:bg-red-800 text-white uppercase tracking-[0.14em] text-sm font-semibold px-8 py-4 shadow-[0_14px_30px_rgba(185,28,28,0.35)] transition"
          >
            <span className="block">BẤM ĐỂ NHẬN VÉ THAM DỰ</span>
            <span className="block text-xs font-medium mt-1">20h00, 4-5-6-7/01</span>
          </button>
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-red-700 bg-white text-red-700 text-xs font-semibold uppercase tracking-[0.08em] shadow-sm">
            Đã khai giảng khóa học!
          </div>
        </div>
      </div>
    </section>
  );
};

const PlaceholderBlock = ({ id, title }) => (
  <section id={id} className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
    <div className="bg-white/90 border border-dashed border-[#e0cfa7] rounded-xl px-5 py-6 text-center shadow-sm">
      <p className="text-sm font-semibold text-[#7a4c16] uppercase tracking-[0.1em]">
        {title}
      </p>
      <p className="mt-2 text-sm text-[#5c4a35]">Nội dung landing sẽ được cập nhật.</p>
    </div>
  </section>
);

const DaoTao = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [hash]);

  return (
    <div className="bg-[#f7f2e9] text-[#1f1a14] min-h-screen pb-12">
      <FlowUnlockSection />
      <PlaceholderBlock id="luat-hap-dan" title="Luật Hấp Dẫn" />
      <PlaceholderBlock id="vut-toc-muc-tieu" title="Vút Tốc Mục Tiêu" />
    </div>
  );
};

export default DaoTao;
