import { Bot, GraduationCap, Users } from "lucide-react";

const SERVICES = [
  {
    title: "Đào Tạo Trading",
    description:
      "Khóa học từ cơ bản đến nâng cao. Tư duy Trading thực chiến và quản lý vốn.",
    Icon: GraduationCap,
  },
  {
    title: "Bot Auto Trading",
    description:
      "Hệ thống Bot tự động giao dịch 24/7. Tối ưu hóa lợi nhuận, giảm thiểu rủi ro.",
    Icon: Bot,
  },
  {
    title: "Coaching 1:1",
    description:
      "Đồng hành trực tiếp cùng chuyên gia. Xây dựng lộ trình tài chính cá nhân hóa.",
    Icon: Users,
  },
];

const Services = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            GIẢI PHÁP TOÀN DIỆN
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Hệ Sinh Thái MALI EDU
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:border-orange-200 hover:shadow-xl"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
              <div className="mt-6 h-1 w-12 bg-orange-500/0 transition group-hover:bg-orange-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
