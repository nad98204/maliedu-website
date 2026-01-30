const STATS = [
  { value: "5.000+", label: "Học viên đã đào tạo" },
  { value: "05+", label: "Năm kinh nghiệm thực chiến" },
  { value: "98%", label: "Tỷ lệ hài lòng" },
  { value: "24/7", label: "Hỗ trợ trọn đời" },
];

const Stats = () => {
  return (
    <section className="bg-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div
              key={stat.value}
              className={`text-center ${
                index < STATS.length - 1
                  ? "lg:border-r lg:border-white/10"
                  : ""
              }`}
            >
              <div className="text-4xl sm:text-5xl font-extrabold text-white">
                {stat.value}
              </div>
              <div className="mt-2 text-sm uppercase tracking-wide text-white/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
