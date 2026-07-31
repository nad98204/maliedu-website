import { Link } from "react-router";
import SEO from "../components/SEO";
import { NOINDEX_ROBOTS } from "../seo/routeSeo";

const NotFound = () => (
  <main className="flex min-h-[70vh] items-center justify-center bg-secret-paper px-6 py-20">
    <SEO
      title="Không tìm thấy trang"
      description="Trang bạn đang tìm không tồn tại hoặc đã được chuyển sang địa chỉ khác."
      robots={NOINDEX_ROBOTS}
      url={typeof window !== "undefined" ? window.location.pathname : "/404"}
    />
    <section className="mx-auto max-w-xl text-center">
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-secret-wax">
        Lỗi 404
      </p>
      <h1 className="font-serif text-4xl font-bold text-secret-ink md:text-5xl">
        Không tìm thấy trang
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-gray-600">
        Đường dẫn có thể đã thay đổi hoặc nội dung không còn tồn tại. Bạn có thể
        quay về trang chủ để tiếp tục khám phá Mali Edu.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-secret-wax px-7 py-3 font-semibold text-white transition hover:bg-secret-ink"
      >
        Về trang chủ
      </Link>
    </section>
  </main>
);

export default NotFound;
