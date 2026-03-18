import React from 'react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { getRouteSeo } from '../../seo/routeSeo';

const RoadmapItem = ({ phase, date, title, items, icon }) => (
  // Mobile: Timeline Left aligned | Desktop: Horizontal/Grid hybrid or keep vertical but centered styled
  <div className="relative pl-12 sm:pl-0 sm:flex sm:gap-6 md:gap-10 group mb-8 sm:mb-0">
    {/* --- MOBILE TIMELINE LINE --- */}
    {/* Line chạy dọc bên trái, căn giữa với icon (left-[22px] vì icon w-11 h-11 => center ~22px) */}
    <div className="absolute left-[21px] top-12 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent sm:hidden"></div>

    {/* --- ICON NODE --- */}
    {/* Mobile: Absolute Left | Desktop: Static Flex Item */}
    <div className="absolute left-0 top-0 sm:static sm:w-20 md:w-24 flex-shrink-0 flex items-start justify-center z-10 transition-transform duration-500 group-hover:scale-110">
      {/* Icon Circle */}
      <div className="w-[42px] h-[42px] sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 p-[2px] shadow-[0_0_15px_rgba(251,191,36,0.4)]">
        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-lg sm:text-3xl shadow-inner">
          {icon}
        </div>
      </div>
    </div>

    {/* --- CONTENT CARD --- */}
    <div className="flex-1 pb-4 sm:pb-12 pt-1 sm:pt-0">
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 sm:p-8 border border-white/10 relative overflow-hidden group-hover:bg-slate-800/60 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">

        {/* Shine Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

        {/* Header: Phase & Title */}
        <div className="flex flex-col gap-2 mb-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-300 text-[11px] sm:text-sm font-bold rounded-lg border border-amber-500/20 tracking-wider uppercase">
              {phase}
            </span>
            {date && (
              <div className="inline-flex items-center gap-1.5 text-amber-100 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 text-xs sm:text-sm">
                <span>🗓️</span>
                <span className="font-mono font-bold text-amber-200">{date}</span>
              </div>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white shadow-black drop-shadow-md mt-1">
            {title}
          </h3>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-amber-500/30 to-transparent mb-4"></div>

        {/* List Items */}
        <ul className="space-y-3 relative z-10">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-slate-200">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 shadow-[0_0_8px_rgba(251,191,36,1)]"></div>
              <span className="text-[15px] sm:text-base leading-relaxed font-light text-slate-100">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/**
 * Landing Page: THIỀN GIAO THỪA
 * Update: Content lộ trình 3 giai đoạn
 * Design: Timeline & Mobile-First
 */
const ThienGiaoThua = () => {
  const seo = getRouteSeo('/landing/thien-giao-thua');

  const handleJoinZalo = () => {
    window.open('https://zalo.me/g/mqdxfb035', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-900 font-sans selection:bg-amber-500/30 text-white">
      <SEO {...seo} />
      {/* Keyframes Style Injection for simple entry animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dstukyjzd/image/upload/v1770190950/Gemini_Generated_Image_6h5i7y6h5i7y6h5i_w1qnrr.png)',
        }}
      >
        {/* Giảm opacity xuống 40-60% để thấy background, bỏ blur để ảnh nét hơn */}
        <div className="absolute inset-0 bg-black/50"></div>
        {/* Lớp phủ đen cực mạnh ở dưới đáy để XÓA HOÀN TOÀN chữ 'GIAO' của ảnh nền */}
        <div className="absolute inset-x-0 bottom-0 h-[80vh] bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent"></div>
      </div>

      <div className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">

        {/* HEADER SECTION */}
        <div className="flex flex-col items-center text-center mb-16 md:mb-24 animate-fade-up">

          {/* 1. MỞ MÀN: Decorative Badge */}
          <div className="flex items-center gap-3 md:gap-6 mb-10 md:mb-14 opacity-90 transition-all duration-500 hover:scale-105">
            <div className="h-[1px] w-8 md:w-24 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full"></div>
              <span className="relative z-10 px-5 py-2 rounded-full border border-amber-400/30 bg-black/60 text-amber-100 text-[11px] md:text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-lg whitespace-nowrap">
                Chương trình đặc biệt
              </span>
            </div>
            <div className="h-[1px] w-8 md:w-24 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          {/* 2. TIÊU ĐỀ CHÍNH: 3D Text Effect */}
          {/* Tăng khoảng cách mt-8 (~32px) + margin lớn của badge ở trên để tách biệt hoàn toàn */}
          <h1 className="relative font-black tracking-tight mt-8 mb-4 md:mb-8 group cursor-default">
            {/* Glow effect behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <span className="block text-8xl sm:text-8xl md:text-9xl leading-[0.85] text-amber-300 drop-shadow-[0_2px_0_rgba(180,83,9,1)] lg:drop-shadow-[0_4px_0_rgba(180,83,9,1)] pb-1 mobile-text-shadow">
              THIỀN
            </span>
            <span className="block text-5xl sm:text-6xl md:text-8xl leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] lg:drop-shadow-[0_4px_0_rgba(0,0,0,0.8)] mt-1">
              GIAO THỪA
            </span>
          </h1>

          {/* 3. LỜI DẪN: Glass Card Style */}
          <div className="relative w-full max-w-xl mx-auto mb-6 group mt-2 md:mt-4">
            {/* Viền glow chạy chạy */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent rounded-2xl blur opacity-75"></div>

            <div className="relative px-5 py-5 md:py-6 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
              <p className="text-slate-100 text-[15px] md:text-xl font-light leading-relaxed">
                Chào mừng bạn đến với hành trình <br className="hidden sm:block" />
                <strong className="text-amber-300 font-medium">chuyển hóa tâm thức</strong> &
                <strong className="text-amber-300 font-medium"> thu hút tài lộc</strong>
                <br />kiến tạo năm 2026 rực rỡ.
              </p>
            </div>
          </div>

          {/* 4. CTA BUTTON - Optimized for Mobile Thumb */}
          <div className="w-full sm:w-auto px-2">
            <button
              onClick={handleJoinZalo}
              className="group relative w-full sm:w-auto px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 active:from-blue-700 active:to-indigo-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-200 active:scale-95 transform overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine"></div>

              <div className="relative flex items-center justify-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
                  {/* Zalo Icon SVG */}
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24 0C10.745 0 0 9.958 0 22.237c0 7.125 3.657 13.475 9.373 17.661L7.5 48l9.177-4.364C18.918 44.497 21.389 45 24 45c13.255 0 24-9.958 24-22.237S37.255 0 24 0zm11.4 30.6l-3.6-4.2-6 4.2-6-4.2-3.6 4.2 9.6-10.2 9.6 10.2z" />
                  </svg>
                </div>
                <span className="text-lg sm:text-xl tracking-wide uppercase font-bold text-shadow-sm">THAM GIA NHÓM ZALO</span>
              </div>
            </button>
            <p className="mt-3 text-xs text-slate-400 italic animate-pulse">
              *Nhấn để tham gia ngay - Hoàn toàn miễn phí
            </p>
          </div>
        </div>

        {/* TIMELINE SECTION */}
        <div className="space-y-4 md:space-y-0 relative">
          {/* Vertical Line for Desktop */}
          <div className="hidden sm:block absolute left-[31px] md:left-[39px] top-8 bottom-12 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent"></div>

          {/* PHASE 1 */}
          <div className="animate-fade-up delay-100">
            <RoadmapItem
              phase="Giai Đoạn 1 • Trước Tết"
              title="Hướng Dẫn & Thiết Lập"
              date="Thứ 2, 09/02"
              icon="🧘‍♂️"
              items={[
                "Hướng dẫn reset, buông bỏ năng lượng năm cũ",
                "Thiết lập mục tiêu thịnh vượng cho năm 2026",
                "Hướng dẫn chi tiết quy trình thiền giao thừa"
              ]}
            />
          </div>

          {/* PHASE 2 */}
          <div className="animate-fade-up delay-200">
            <RoadmapItem
              phase="Giai Đoạn 2 • 27 Tết"
              title="Chuyển Hóa Nơi Ở & Tài Lộc"
              date="14/02"
              icon="🏠"
              items={[
                "Xử lý Thiên khí - Địa khí - Nhân khí nơi ở",
                "Bí mật thu hút tài lộc vào nhà dịp Tết",
                "Thanh tẩy không gian sống đón năng lượng mới"
              ]}
            />
          </div>

          {/* PHASE 3 */}
          <div className="animate-fade-up delay-300">
            <RoadmapItem
              phase="Giai Đoạn 3 • Sau Tết"
              title="Lộ Trình Chinh Phục 2026"
              date="Thông báo sau"
              icon="🚀"
              items={[
                "Định hướng Thần số học bản thân cho năm 2026",
                "Xây dựng kế hoạch chi tiết thu hút mục tiêu",
                "Ứng dụng chuyên sâu Luật Hấp Dẫn để đạt thành tựu"
              ]}
            />
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-16 sm:mt-24 text-center mb-12 animate-fade-up delay-400">
          <div className="inline-block p-[2px] rounded-2xl bg-gradient-to-r from-amber-200 via-orange-400 to-amber-200 animate-pulse">
            <div className="bg-slate-900 rounded-2xl p-6 sm:p-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Đừng bỏ lỡ khoảnh khắc chuyển giao thiêng liêng!
              </h3>
              <p className="text-slate-400 mb-6">Tham gia cộng đồng cùng hàng ngàn thành viên tinh tấn.</p>
              <button
                onClick={handleJoinZalo}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                THAM GIA NGAY LẬP TỨC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <div className="relative z-20 bg-slate-950">
        <Footer />
      </div>

    </div>
  );
};

export default ThienGiaoThua;
