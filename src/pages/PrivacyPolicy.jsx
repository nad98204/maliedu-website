import React from "react";
import { Mail, Phone, ShieldCheck, UserCheck } from "lucide-react";
import SEO from "../components/SEO";

const policySections = [
  {
    title: "1. Giới thiệu - mục đích thu thập dữ liệu",
    body:
      "Chính sách bảo mật này giải thích cách CÔNG TY TNHH TƯ VẤN MAGIC LIFE thu thập, sử dụng và bảo vệ thông tin cá nhân của người dùng khi truy cập website luathapdan.vn, đăng ký nhận tư vấn hoặc liên hệ về các khóa học.",
  },
  {
    title: "2. Thông tin thu thập",
    body:
      "Chúng tôi có thể thu thập các thông tin như họ tên, email, số điện thoại và Facebook ID khi khách hàng chủ động nhắn tin qua Facebook hoặc các kênh liên hệ được tích hợp trên website.",
  },
  {
    title: "3. Mục đích sử dụng",
    body:
      "Thông tin được sử dụng để tư vấn khóa học, phản hồi yêu cầu của khách hàng, gửi thông tin liên quan đến chương trình đào tạo và hỗ trợ người học trong quá trình tìm hiểu dịch vụ.",
  },
  {
    title: "4. Bảo mật thông tin",
    body:
      "Chúng tôi cam kết bảo mật thông tin cá nhân của người dùng và không chia sẻ, mua bán hoặc chuyển giao dữ liệu cho bên thứ 3, trừ trường hợp có yêu cầu hợp pháp từ cơ quan có thẩm quyền.",
  },
  {
    title: "5. Quyền của người dùng",
    body:
      "Người dùng có quyền yêu cầu kiểm tra, cập nhật hoặc xóa dữ liệu cá nhân đã cung cấp. Yêu cầu sẽ được tiếp nhận qua email hoặc số điện thoại liên hệ của công ty.",
  },
  {
    title: "6. Liên hệ",
    body:
      "Mọi câu hỏi liên quan đến chính sách bảo mật hoặc yêu cầu xử lý dữ liệu cá nhân vui lòng liên hệ CÔNG TY TNHH TƯ VẤN MAGIC LIFE qua email mongnguyen9813@gmail.com hoặc số điện thoại 0968789486.",
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#FAF9F6] text-secret-ink font-sans">
      <SEO
        title="Chính sách bảo mật"
        description="Chính sách bảo mật thông tin cá nhân của CÔNG TY TNHH TƯ VẤN MAGIC LIFE trên website luathapdan.vn."
        url="/chinh-sach-bao-mat"
      />

      <section className="relative overflow-hidden bg-secret-paper bg-paper-texture">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secret-wax via-secret-gold to-secret-wax" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-secret-wax/20 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-secret-wax">
              <ShieldCheck className="h-4 w-4" />
              Bảo mật thông tin
            </div>
            <h1 className="mt-6 font-playfair text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-secret-ink">
              Chính sách bảo mật
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-secret-ink/75">
              CÔNG TY TNHH TƯ VẤN MAGIC LIFE tôn trọng quyền riêng tư của người dùng và cam kết xử lý thông tin cá nhân minh bạch, đúng mục đích.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start rounded-2xl border border-secret-wax/15 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(26,26,26,0.45)]">
              <div className="flex items-center gap-3 border-b border-secret-wax/10 pb-5">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-secret-wax/10 text-secret-wax">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-secret-wax font-bold">
                    Đơn vị quản lý
                  </p>
                  <p className="mt-1 text-sm font-semibold text-secret-ink">
                    CÔNG TY TNHH TƯ VẤN MAGIC LIFE
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-secret-ink/75">
                <div>
                  <p className="text-xs uppercase tracking-widest text-secret-ink/45">
                    Website
                  </p>
                  <a
                    href="https://luathapdan.vn"
                    className="mt-1 inline-block font-semibold text-secret-wax hover:text-secret-gold"
                  >
                    luathapdan.vn
                  </a>
                </div>
                <a
                  href="mailto:mongnguyen9813@gmail.com"
                  className="flex items-center gap-3 rounded-xl bg-secret-paper/50 px-4 py-3 font-medium hover:bg-secret-paper"
                >
                  <Mail className="h-4 w-4 text-secret-wax" />
                  <span className="break-all">mongnguyen9813@gmail.com</span>
                </a>
                <a
                  href="tel:0968789486"
                  className="flex items-center gap-3 rounded-xl bg-secret-paper/50 px-4 py-3 font-medium hover:bg-secret-paper"
                >
                  <Phone className="h-4 w-4 text-secret-wax" />
                  <span>0968789486</span>
                </a>
              </div>
            </aside>

            <div className="space-y-5">
              {policySections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-2xl border border-secret-wax/10 bg-white p-6 md:p-8 shadow-[0_18px_45px_-32px_rgba(26,26,26,0.4)]"
                >
                  <h2 className="font-playfair text-2xl font-bold text-secret-wax">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-secret-ink/75">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
