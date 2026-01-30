const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secret-paper to-orange-100">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-paper-texture opacity-30"
      />
      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 min-h-[85vh] flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secret-wax text-secret-paper text-2xl font-serif font-bold shadow-2xl shadow-secret-wax/40">
          M
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-[0.2em] text-secret-ink">
          BÍ MẬT CỦA SỰ THỊNH VƯỢNG
        </h1>
        <p className="mt-4 text-base sm:text-lg text-secret-ink/70">
          Khai phá Luật Hấp Dẫn & Chữa lành đứa trẻ bên trong
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            className="px-8 py-3 rounded-full bg-secret-wax text-white font-semibold shadow-2xl shadow-secret-wax/40 hover:bg-secret-wax/90 transition"
          >
            Khám phá khóa học
          </button>
          <button
            type="button"
            className="px-8 py-3 rounded-full border border-secret-gold text-secret-ink font-semibold hover:border-secret-wax hover:text-secret-wax transition"
          >
            Xem Video chia sẻ
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
