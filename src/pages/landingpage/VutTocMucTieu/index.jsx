import PlaceholderSection from "./sections/PlaceholderSection";
import SEO from "../../../components/SEO";
import { getRouteSeo } from "../../../seo/routeSeo";

const VutTocMucTieu = () => {
  const seo = getRouteSeo("/dao-tao/vut-toc-muc-tieu");

  return (
    <div className="relative bg-[#FAF7F0] text-[#1E2A2F] min-h-screen">
      <SEO {...seo} />
      <PlaceholderSection />
    </div>
  );
};

export default VutTocMucTieu;
