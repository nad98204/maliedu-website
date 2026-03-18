import { Helmet } from "react-helmet-async";
import { getResolvedSeo, SITE_NAME } from "../seo/routeSeo";

const SEO = ({ title, description, image, url, type = "website" }) => {
  const seo = getResolvedSeo({ title, description, image, url, type });

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={seo.url} />

      <meta property="og:type" content={seo.type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seo.url} />
      <meta property="twitter:title" content={seo.title} />
      <meta property="twitter:description" content={seo.description} />
      <meta property="twitter:image" content={seo.image} />
    </Helmet>
  );
};

export default SEO;
