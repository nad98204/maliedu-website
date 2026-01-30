import { ArrowRight } from "lucide-react";

const IMG_PORTRAIT = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108333/H%C3%8CNH_%E1%BA%A2NH_C%C3%81_NH%C3%82N_g2q2ot.png";
const IMG_GIEO_GAT = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108333/2_d4b64h.png";
const IMG_TANSO = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108334/3_nrgxop.png";
const IMG_AM_THI = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108334/4_oh13fm.png";
const IMG_DAY_HOC = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108353/5_gcx5pn.jpg";

const FounderStorySection = () => {
  return (
    <section className="relative bg-[#FAF7F0] py-16 sm:py-20 rounded-[32px] border border-[#E8D9B2] shadow-[0_26px_70px_rgba(31,77,58,0.06)] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/3 right-[-140px] w-[380px] h-[380px] rounded-full bg-[#C7A44A] blur-[120px] opacity-20" />
        <div className="absolute bottom-[-180px] left-[-120px] w-[420px] h-[420px] rounded-full bg-[#1F4D3A] blur-[130px] opacity-14" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
        {/* Intro two-column */}
        <div className="grid md:grid-cols-[0.95fr_1.05fr] gap-8 items-center rounded-[28px] bg-white/70 border border-[#E8D9B2] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="flex justify-center">
            <div className="rounded-[24px] bg-white overflow-hidden border-[4px] border-white shadow-[0_20px_48px_rgba(0,0,0,0.12)] max-w-[340px] w-full">
              <img src={IMG_PORTRAIT} alt="Chân dung thời khó khăn" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-3 text-left">
            <p className="pt-serif-bold text-[12px] tracking-[0.26em] uppercase text-[#1F4D3A]">Chào bạn, tôi là</p>
            <h2 className="roboto text-3xl sm:text-4xl font-extrabold text-[#1E2A2F] leading-[1.15]">MONG COACHING</h2>
            <p className="roboto text-[15px] sm:text-[16px] leading-[1.7] text-[#333]">
              Hơn chục năm trước, tôi đam mê đầu tư, muốn giàu nhanh và bị lừa mất hết. Tiền tích lũy tiêu tan, còn vướng nợ, bị đuổi việc và thất nghiệp.
            </p>
            <div className="roboto italic text-[15px] text-[#1F4D3A] border-l-4 border-[#C7A44A] pl-4">
              “Mọi thứ bắt đầu thay đổi khi tôi hiểu đúng về Luật Hấp Dẫn và Nhân Quả.”
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-white/75 border border-[#E8D9B2] p-6 sm:p-8 shadow-[0_18px_46px_rgba(0,0,0,0.06)] mb-10">
          <p className="pt-serif-bold text-[#B23A3A] text-sm uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <span role="img" aria-label="thought">💭</span>
            <span style={{ letterSpacing: "0.5px" }}>Tôi luôn trách móc cuộc đời:</span>
          </p>
          <div className="roboto text-base leading-[1.7] text-[#333] space-y-2">
            <p>Tôi là người tốt mà, tại sao cứ gặp toàn điều xui xẻo?</p>
            <p>Tôi đâu hại ai, sao mọi thứ cứ chống lại mình?</p>
            <p>Suốt nhiều tháng tôi sống trong tiêu cực, cố gắng kiếm tiền trả nợ, làm lại… mà mọi thứ vẫn cứ như vậy.</p>
          </div>
        </div>

        {/* Turning point */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="pt-serif-bold text-xl text-[#1F4D3A] uppercase tracking-[0.14em]">Rồi mọi thứ bắt đầu thay đổi</p>
            <p className="roboto text-[16px] sm:text-lg text-[#2A3A3F]">
              Khi tôi thực sự hiểu đúng về <span className="pt-serif-bold">Luật Hấp Dẫn</span> và <span className="pt-serif-bold">Luật Nhân Quả</span>.
            </p>
          </div>
          <div
            className="rounded-3xl bg-white shadow-[0_18px_46px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E8D9B2] mx-auto"
            style={{ width: "70%", maxWidth: "640px" }}
          >
            <img
              src={IMG_GIEO_GAT}
              alt="Nguyên tắc gieo gặt"
              className="w-full h-full object-cover"
              style={{ borderRadius: "22px", boxShadow: "0 10px 28px rgba(0,0,0,0.1)" }}
            />
          </div>
        </div>

        {/* Three lessons */}
        <div className="space-y-8">
          <div className="bg-[#B23A3A] text-white rounded-2xl px-6 py-4 inline-block shadow-[0_12px_32px_rgba(178,58,58,0.25)]">
            <span className="pt-serif-bold text-base sm:text-lg">Tôi nhận ra, có 3 điều khiến mình rơi vào khủng hoảng</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {/* Lesson 1 */}
            <div className="rounded-3xl bg-white border border-[#E8D9B2] shadow-[0_12px_36px_rgba(0,0,0,0.06)] p-5 space-y-4 flex flex-col transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)]">
              <p className="pt-serif-bold text-lg text-[#1F4D3A]">1. Tần số rung động quá thấp</p>
              <p className="roboto text-sm sm:text-base leading-[1.7] text-[#2A3A3F]">
                Tôi luôn lo lắng, sợ hãi, thiếu thốn, đi đầu tư và bán hàng chỉ sợ không kiếm được, lúc nào cũng sợ thua lỗ và mất,
                muốn nhanh có tiền – và nó khiến tôi ngược thu hút về: nợ nần, rắc rối, bế tắc.
              </p>
              <p className="roboto text-sm sm:text-base leading-[1.7] text-[#2A3A3F]">
                Lúc đó tôi không hiểu gì về “năng lượng” hay “tần số” đâu. Nhưng khi học rồi, tôi mới thấy nó quá quan trọng.
              </p>
              <div className="rounded-2xl overflow-hidden border border-[#E8D9B2] mt-auto">
                <img src={IMG_TANSO} alt="Bảng tần số rung động" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Lesson 2 */}
            <div className="rounded-3xl bg-white border border-[#E8D9B2] shadow-[0_12px_36px_rgba(0,0,0,0.06)] p-5 space-y-4 flex flex-col transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)]">
              <p className="pt-serif-bold text-lg text-[#1F4D3A]">2. Niềm tin tài chính sai lệch</p>
              <p className="roboto text-sm sm:text-base leading-[1.7] text-[#2A3A3F]">
                Tôi từng mang trong mình những ám thị sai lệch về tiền bạc: “Muốn có tiền phải cực khổ”, “Mình không đủ giỏi để giàu”,
                “Tiền không dành cho người như mình”…
              </p>
              <p className="roboto text-sm sm:text-base leading-[1.7] text-[#2A3A3F]">
                Chỉ khi tôi bắt đầu quay vào bên trong, nhìn lại những ám thị đó và chuyển hóa chúng, mọi thứ mới thay đổi. Tôi hành động
                từ sự đủ đầy, từ niềm tin rằng mình xứng đáng. Tiền bắt đầu đến – nhẹ nhàng, tự nhiên – như một phản hồi cho năng lượng mới.
              </p>
              <div className="rounded-2xl overflow-hidden border border-[#E8D9B2] mt-auto">
                <img src={IMG_AM_THI} alt="Ám thị niềm tin giới hạn" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Lesson 3 */}
            <div className="rounded-3xl bg-white border border-[#E8D9B2] shadow-[0_12px_36px_rgba(0,0,0,0.06)] p-5 space-y-4 flex flex-col transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)]">
              <p className="pt-serif-bold text-lg text-[#1F4D3A]">3. Hiểu sai về Nhân Quả</p>
              <p className="roboto text-sm sm:text-base leading-[1.7] text-[#2A3A3F]">
                Tôi từng nghĩ nhân quả là chuyện kiếp trước. Nhưng rồi tôi nhận ra: mỗi suy nghĩ, cảm xúc, lời nói hôm nay… đều là hạt giống
                gieo xuống Tiềm Thức. Khi chọn hành động từ lòng tin, sự đủ đầy, Phước Đức mới đổi khác.
              </p>
              <p className="roboto text-sm sm:text-base leading-[1.7] text-[#2A3A3F]">
                Vận may cuộc đời tôi bắt đầu khác khi tôi tỉnh thức, quan sát phản ứng, lựa chọn suy nghĩ và hành động từ năng lượng tích cực.
              </p>
              <div className="rounded-2xl overflow-hidden border border-[#E8D9B2] mt-auto">
                <img src={IMG_DAY_HOC} alt="Không gian giảng dạy" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Closing */}
        <div className="space-y-3 text-center max-w-[750px] mx-auto text-highlight">
          <p className="roboto text-[16px] sm:text-lg leading-[1.8] text-[#333]">
            Từ một người trắng tay, hôm nay tôi đã có một cuộc sống khác: tài chính vững vàng, năng lượng tích cực, công việc trọn vẹn.
          </p>
          <p className="roboto text-[16px] sm:text-lg leading-[1.8] text-[#333]">
            Và tôi muốn chia sẻ lại chính <span className="pt-serif-bold text-[#0a4733]">Lộ trình 3 bước Khơi Thông Dòng Tiền</span> này cho bạn –
            để bạn không cần phải mất cả chục năm mới thoát ra như tôi.
          </p>
          <p className="roboto text-[16px] sm:text-lg leading-[1.8] text-[#b5372f] italic font-semibold">
            🌟 Bạn hoàn toàn có thể thay đổi – nếu hiểu và vận hành đúng.
          </p>
        </div>

        <div className="flex justify-center">
          <a
            href="#dang-ky"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#1F4D3A] via-[#184533] to-[#0f3527] px-10 sm:px-12 py-3.5 text-sm sm:text-base font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_rgba(31,77,58,0.25)] hover:-translate-y-[2px] transition"
          >
            BẤM ĐỂ NHẬN VÉ THAM DỰ
            <ArrowRight className="w-5 h-5 text-[#C7A44A]" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default FounderStorySection;
