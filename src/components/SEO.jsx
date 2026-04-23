import { Helmet } from "react-helmet-async";
import { getResolvedSeo, SITE_NAME } from "../seo/routeSeo";

/**
 * SEO Component — Tái sử dụng cho mọi trang
 *
 * Props:
 *  - title      : Tiêu đề trang (sẽ được append "- Mali Edu" nếu chưa có)
 *  - description: Mô tả trang (tối đa 160 ký tự nên được cắt trước khi truyền vào)
 *  - image      : URL ảnh OG (tuyệt đối hoặc tương đối)
 *  - url        : Canonical URL của trang (path hoặc URL đầy đủ)
 *  - type       : OG type — 'website' | 'article' | 'product' (mặc định: 'website')
 *                 'product' và 'article' đều map sang og:type="article" (phù hợp Facebook/Zalo)
 *  - keywords   : Từ khóa SEO (string, phân tách bởi dấu phẩy)
 *  - jsonLd     : Một object hoặc mảng các object JSON-LD Schema.org để inject Rich Snippets
 *
 * Nếu prop bị rỗng (null/undefined), giá trị mặc định từ routeSeo.js sẽ được dùng,
 * liên quan đến thông điệp: "Mali Edu - Đánh thức tiềm năng, làm chủ luật hấp dẫn".
 */
const SEO = ({ title, description, image, url, type = "website", keywords, jsonLd }) => {
  // Chuẩn hoá og:type — Facebook/Zalo chỉ nhận 'article' cho nội dung cụ thể
  const ogType = type === "product" || type === "article" ? "article" : "website";

  const seo = getResolvedSeo({ title, description, image, url, type: ogType });

  // Chuẩn hoá jsonLd thành mảng để luôn dùng .map()
  const schemas = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet>
      {/* ===== Primary Tags ===== */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={seo.url} />

      {/* ===== Open Graph (Facebook / Zalo) ===== */}
      <meta property="og:type" content={seo.type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="vi_VN" />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={seo.title} />

      {/* ===== Twitter Card ===== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

      {/* ===== JSON-LD Structured Data (Rich Snippets) ===== */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
