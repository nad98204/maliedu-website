const NoiDungBonBuoi = ({ content }) => {
  const sessions = content?.sessions || [];

  if (!sessions.length) return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[#D4B572]/65 px-4 py-7 shadow-[0_16px_44px_rgba(83,48,18,0.06)] sm:rounded-[32px] sm:px-8 sm:py-12 lg:px-10"
      style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F8EFD9 100%)" }}
      aria-labelledby="noi-dung-bon-buoi-title"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[#D4B572]/25" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-[#D4B572]/25" />

      <header className="relative mx-auto mb-6 max-w-3xl text-center sm:mb-9">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B572]/70 bg-white/90 px-3.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.17em] text-[#7A2113] sm:text-xs">
          <span className="text-[#C9961A]">✦</span>
          Nội dung 4 buổi học
          <span className="text-[#C9961A]">✦</span>
        </span>
        <h2
          id="noi-dung-bon-buoi-title"
          className="loa-section-heading mt-3 font-black uppercase leading-[1.12] tracking-[-0.035em]"
        >
          <span className="loa-section-long block text-[1.42rem] text-[#3A2208] min-[390px]:text-[1.55rem] sm:text-3xl lg:text-4xl">
            Bạn sẽ học gì trong
          </span>
          <span className="loa-section-main mt-1 block text-[1.75rem] text-[#8C0C12] min-[390px]:text-[1.95rem] sm:text-4xl lg:text-5xl">
            4 buổi miễn phí?
          </span>
        </h2>
      </header>

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.4rem] border border-[#D4B572]/60 bg-white/75 shadow-[0_10px_30px_rgba(91,49,14,0.06)] md:grid md:grid-cols-4">
        {sessions.map((session, index) => (
          <article
            key={session.title}
            className={`relative px-4 py-5 sm:px-5 sm:py-6 ${
              index < sessions.length - 1 ? "border-b border-[#D4B572]/45 md:border-b-0 md:border-r" : ""
            }`}
          >
            <div className="flex items-start gap-3 md:block">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A71017] to-[#650609] text-lg font-black text-[#FFE68B] shadow-[0_7px_16px_rgba(122,33,19,0.2)] md:mb-4">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="mb-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#A07020]">
                  Buổi {index + 1}
                </p>
                <h3 className="text-[0.94rem] font-black uppercase leading-[1.35] text-[#6F160D] sm:text-base">
                  {session.title}
                </h3>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5 md:mt-5">
              {session.points.map((point) => (
                <li key={point} className="grid grid-cols-[15px_1fr] items-start gap-2 text-[0.78rem] leading-[1.55] text-[#5C3A1A] sm:text-sm">
                  <span className="mt-[0.18rem] flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#C9961A]/15 text-[0.55rem] font-black text-[#9A6610]">
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};

export default NoiDungBonBuoi;
