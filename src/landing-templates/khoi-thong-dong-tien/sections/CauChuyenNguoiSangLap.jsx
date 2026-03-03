import { ArrowRight, CheckCircle2 } from "lucide-react";

const IMG_PORTRAIT = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108333/H%C3%8CNH_%E1%BA%A2NH_C%C3%81_NH%C3%82N_g2q2ot.png";
const IMG_GIEO_GAT = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108333/2_d4b64h.png";
const IMG_TANSO = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108334/3_nrgxop.png";
const IMG_AM_THI = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108334/4_oh13fm.png";
const IMG_DAY_HOC = "https://res.cloudinary.com/dstukyjzd/image/upload/v1768108353/5_gcx5pn.jpg";

const CTA = ({ className = "" }) => (
  <a
    href="#dang-ky"
    className={`inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold uppercase tracking-[0.1em] text-[#FFE566] text-sm sm:text-base transition hover:-translate-y-[2px] ${className}`}
    style={{
      background: "linear-gradient(180deg, #E8393F 0%, #9C0C12 100%)",
      boxShadow: "0 10px 28px rgba(156,12,18,0.4)",
    }}
  >
    BẤM ĐỂ NHẬN VÉ THAM DỰ
    <ArrowRight className="w-5 h-5 text-[#FFE566]" />
  </a>
);

const CauChuyenNguoiSangLap = () => (
  <section
    className="relative rounded-3xl py-14 sm:py-16 overflow-hidden"
    style={{
      background: "linear-gradient(135deg, #FDF5E4 0%, #F7EBCC 100%)",
      border: "1px solid #D4B572",
      boxShadow: "0 20px 50px rgba(122,33,19,0.06)",
    }}
  >
    <div className="absolute inset-0 pointer-events-none opacity-25">
      <div className="absolute top-1/3 right-[-100px] w-[300px] h-[300px] rounded-full bg-[#C9961A] blur-[120px]" />
      <div className="absolute bottom-[-150px] left-[-100px] w-[320px] h-[320px] rounded-full bg-[#7A2113] blur-[130px]" />
    </div>

    <div className="relative max-w-3xl mx-auto px-6 sm:px-10 space-y-10">
      {/* Intro - Premium Card */}
      <div
        className="relative group p-[1px] rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #D4B572 0%, #7A2113 100%)" }}
      >
        <div className="bg-[#FDF8EE] rounded-[23px] p-6 sm:p-8 grid md:grid-cols-[0.8fr_1.2fr] gap-8 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#C9961A] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-2xl transition hover:scale-[1.02] duration-500">
              <img src={IMG_PORTRAIT} alt="Mong Coaching" className="w-full aspect-[4/5] object-cover" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] tracking-[0.3em] uppercase text-[#7A2113] font-bold">Người truyền cảm hứng</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3A2208] tracking-tight">MONG COACHING</h2>
            </div>
            
            <div className="h-1 w-12 bg-[#C9961A]/40 rounded-full" />

            <p className="text-[15px] sm:text-[16px] leading-[1.8] text-[#5C3A1A] font-medium">
              Hơn chục năm trước, tôi đam mê đầu tư, muốn giàu nhanh và bị lừa mất hết. Tiền tích lũy tiêu tan, còn vướng nợ, bị đuổi việc và thất nghiệp.
            </p>

            <div className="relative p-4 rounded-xl bg-[#7A2113]/5 border-l-4 border-[#7A2113]">
              <p className="text-[15px] text-[#7A2113] italic font-semibold leading-relaxed">
                "Mọi thứ bắt đầu thay đổi khi tôi hiểu đúng về Luật Hấp Dẫn và Nhân Quả."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emotional Block - Inner Monologue */}
      <div className="relative">
        <div className="absolute -top-6 -left-2 text-6xl text-[#7A2113]/10 font-serif leading-none select-none">“</div>
        <div
          className="relative rounded-2xl bg-white/50 backdrop-blur-sm border border-[#D4B572]/40 p-6 sm:p-8 space-y-5"
          style={{ boxShadow: "0 20px 40px rgba(122,33,19,0.04)" }}
        >
          <p className="text-[#7A2113] text-xs font-bold uppercase tracking-[0.25em] flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#7A2113]/10 rounded-full text-[10px]">💭</span> 
            Tôi luôn trách móc cuộc đời:
          </p>

          <div className="space-y-4">
            {[
              "Tôi là người tốt mà, tại sao cứ gặp toàn điều xui xẻo?",
              "Tôi đâu hại ai, sao mọi thứ cứ chống lại mình?",
              "Suốt nhiều tháng tôi sống trong tiêu cực, cố gắng kiếm tiền trả nợ, làm lại… mà mọi thứ vẫn cứ như vậy.",
            ].map((q, idx) => (
              <div key={idx} className="group flex gap-4 items-start">
                <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#C9961A]/40 group-hover:bg-[#C9961A] transition-colors" />
                <p className="text-[15px] sm:text-[16px] leading-relaxed italic text-[#5C3A1A] font-medium tracking-tight">
                  {q}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-10 -right-2 text-6xl text-[#7A2113]/10 font-serif leading-none select-none rotate-180">“</div>
      </div>

      {/* Turning Point - High Impact */}
      <div className="space-y-8 text-center pt-8">
        <div className="space-y-3">
          <span className="inline-block py-1 px-4 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-[#C9961A]/10 text-[#7A2113] border border-[#C9961A]/20">
            Bước ngoặt thay đổi cuộc đời
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#7A2113] uppercase leading-[1.1] tracking-tight">
            Rồi mọi thứ bắt đầu <br className="sm:hidden" /> thay đổi
          </h3>
          <div className="max-w-md mx-auto h-[1px] bg-gradient-to-r from-transparent via-[#C9961A]/30 to-transparent my-4" />
          <p className="text-base sm:text-lg text-[#5C3A1A] leading-relaxed">
            Khi tôi thực sự hiểu đúng về <span className="text-[#3A2208] font-bold underline decoration-[#C9961A]/40 decoration-wavy offset-4">Luật Hấp Dẫn</span> và <span className="text-[#3A2208] font-bold underline decoration-[#C9961A]/40 decoration-wavy offset-4">Luật Nhân Quả</span>.
          </p>
        </div>

        <div className="relative group mx-auto max-w-[560px]">
          <div className="absolute -inset-4 bg-[#7A2113]/5 blur-3xl rounded-full opacity-60 pointer-events-none" />
          <div className="relative rounded-3xl overflow-hidden border-2 border-white shadow-2xl transition hover:rotate-1 hover:scale-[1.01] duration-500">
            <img src={IMG_GIEO_GAT} alt="Nguyên tắc gieo gặt" className="w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            <span className="absolute bottom-4 right-4 text-[10px] text-white/80 font-bold uppercase tracking-widest bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              Quy luật vận hành
            </span>
          </div>
        </div>
      </div>


      {/* 3 Lessons Section */}
      <div className="space-y-8 pt-6">
        <div className="relative inline-block group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#7A2113] to-[#C9961A] rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center gap-3 bg-white border border-[#D4B572]/50 rounded-xl px-6 py-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#7A2113] flex items-center justify-center text-white shrink-0">
              <span className="font-black text-lg">!</span>
            </div>
            <p className="font-extrabold text-[#3A2208] text-[15px] sm:text-base leading-tight">
              3 rào cản khiến cuộc đời bạn luôn gặp khủng hoảng
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Tần số rung động quá thấp",
              img: IMG_TANSO,
              number: "01",
              text: "Tôi luôn lo lắng, sợ hãi, thiếu thốn và nó khiến tôi thu hút nợ nần, rắc rối, bế tắc. Năng lượng quyết định 90% kết quả.",
            },
            {
              title: "Niềm tin tài chính sai lệch",
              img: IMG_AM_THI,
              number: "02",
              text: "Những ám thị cũ: Muốn có tiền phải cực khổ, mình không đủ giỏi. Khi chuyển hóa chúng, tiền mới đến nhẹ nhàng.",
            },
            {
              title: "Hiểu sai về Nhân Quả",
              img: IMG_DAY_HOC,
              number: "03",
              text: "Mỗi ý nghĩ đều là hạt giống gieo vào Tiềm Thức. Vận may thay đổi khi tôi tỉnh thức và gieo mầm năng lượng thịnh vượng.",
            },
          ].map(({ title, img, text, number }) => (
            <div
              key={title}
              className="group relative flex flex-col bg-white border border-[#D4B572]/30 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl font-black text-[#7A2113]/10">{number}</span>
                  <div className="p-2 bg-[#7A2113]/5 rounded-xl border border-[#7A2113]/10">
                    <CheckCircle2 className="w-5 h-5 text-[#7A2113]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#7A2113] text-lg leading-tight tracking-tight">{title}</h4>
                  <p className="text-[14px] leading-relaxed text-[#5C3A1A]">{text}</p>
                </div>
              </div>
              <div className="mt-auto aspect-video overflow-hidden border-t border-[#D4B572]/20">
                <img src={img} alt={title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Message - Premium Finishing */}
      <div className="relative pt-6">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <span className="text-[12rem] font-serif text-[#7A2113]">“</span>
        </div>
        
        <div className="relative z-10 max-w-[640px] mx-auto text-center space-y-8">
          <div className="space-y-6">
            <p className="text-[15px] sm:text-[17px] leading-[1.8] text-[#5C3A1A] font-medium px-4">
              Từ một người <span className="text-[#7A2113] font-bold">trắng tay</span>, hôm nay tôi đã có một cuộc sống mới: tài chính vững vàng, năng lượng tích cực và một sứ mệnh trọn vẹn.
            </p>
            
            <div className="space-y-2 px-2">
              <p className="text-[14px] sm:text-base text-[#5C3A1A] leading-relaxed">
                Tôi khao khát được chia sẻ lại cho bạn chính:
              </p>
              <h4 className="text-[22px] sm:text-[28px] font-extrabold text-[#7A2113] leading-tight tracking-tight px-4">
                LỘ TRÌNH 3 BƯỚC <br className="sm:hidden" />
                <span className="text-[#C9961A]">KHƠI THÔNG DÒNG TIỀN</span>
              </h4>
              <p className="text-[14px] sm:text-base text-[#5C3A1A] leading-relaxed max-w-[480px] mx-auto pt-1">
                Để bạn sớm tìm thấy sự thịnh vượng mà không cần phải mất cả chục năm bế tắc như tôi đã từng.
              </p>
            </div>
          </div>

          <div className="relative inline-block py-6 px-8 sm:px-12">
            <div className="absolute inset-0 bg-[#C9961A]/10 rounded-3xl transform skew-x-[-8deg] border border-[#C9961A]/20 shadow-sm" />
            <p className="relative text-[17px] sm:text-[20px] text-[#7A2113] italic font-black tracking-tight leading-snug">
              "Bạn hoàn toàn có thể thay đổi – <br /> ngay khi bạn chọn bắt đầu hôm nay."
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
        <CTA className="scale-110" />
        <p className="text-[11px] text-[#7A2113] font-bold uppercase tracking-[0.2em] opacity-60">
          Chỉ còn vài suất đăng ký cuối cùng
        </p>
      </div>
    </div>
  </section>
);

export default CauChuyenNguoiSangLap;
