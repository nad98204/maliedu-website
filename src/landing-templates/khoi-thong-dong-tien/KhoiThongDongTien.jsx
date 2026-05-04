import React, { lazy, Suspense } from "react";
import SEO from "../../components/SEO";
import { getRouteSeo } from "../../seo/routeSeo";
import BannerChinh from "./sections/BannerChinh";
import LazyWhenVisible from "./LazyWhenVisible";
import { SectionFallback } from "./sectionFallback";
import { KHOI_THONG_HERO_BANNER_URL } from "./landingConfig";

const PhanNoiDau = lazy(() => import("./sections/PhanNoiDau"));
const DoiTuongPhuHop = lazy(() => import("./sections/DoiTuongPhuHop"));
const LichTrinhHoc = lazy(() => import("./sections/LichTrinhHoc"));
const KetQuaHocVien = lazy(() => import("./sections/KetQuaHocVien"));
const CauChuyenNguoiSangLap = lazy(() => import("./sections/CauChuyenNguoiSangLap"));
const VideoHocVien = lazy(() => import("./sections/VideoHocVien"));
const FormDangKy = lazy(() => import("./sections/FormDangKy"));
const Footer = lazy(() => import("../../components/Footer"));

const KhoiThongDongTien = ({ targetFunnel, source_key }) => {
  const seo = getRouteSeo("/dao-tao/khoi-thong-dong-tien");

  return (
    <div
      className="relative font-sans min-h-screen"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FDF7EC 15%, #F5EDD8 50%, #EAD9B8 100%)",
      }}
    >
      <SEO {...seo} preloadLcpImage={KHOI_THONG_HERO_BANNER_URL} />
      <BannerChinh />

      <div
        id="khoi-thong-main"
        className="max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 lg:space-y-16 pt-5 sm:pt-7 pb-12"
      >
        <LazyWhenVisible minHeight="22rem">
          <Suspense fallback={<SectionFallback className="h-56" />}>
            <PhanNoiDau />
          </Suspense>
        </LazyWhenVisible>

        <LazyWhenVisible minHeight="18rem">
          <Suspense fallback={<SectionFallback className="h-48" />}>
            <DoiTuongPhuHop />
          </Suspense>
        </LazyWhenVisible>

        <LazyWhenVisible minHeight="20rem">
          <Suspense fallback={<SectionFallback className="h-52" />}>
            <LichTrinhHoc />
          </Suspense>
        </LazyWhenVisible>

        <LazyWhenVisible minHeight="24rem">
          <Suspense fallback={<SectionFallback className="min-h-[18rem]" />}>
            <KetQuaHocVien />
          </Suspense>
        </LazyWhenVisible>

        <LazyWhenVisible minHeight="28rem">
          <Suspense fallback={<SectionFallback className="min-h-[20rem]" />}>
            <CauChuyenNguoiSangLap />
          </Suspense>
        </LazyWhenVisible>

        <LazyWhenVisible minHeight="16rem">
          <Suspense fallback={<SectionFallback className="h-44" />}>
            <VideoHocVien />
          </Suspense>
        </LazyWhenVisible>

        {/* id phải luôn có trong DOM để #dang-ky từ hero CTA hoạt động trước khi form lazy-mount */}
        <div id="dang-ky" className="scroll-mt-2 sm:scroll-mt-4">
          <LazyWhenVisible minHeight="26rem">
            <Suspense fallback={<SectionFallback className="min-h-[22rem]" />}>
              <FormDangKy targetFunnel={targetFunnel} source_key={source_key} />
            </Suspense>
          </LazyWhenVisible>
        </div>
      </div>

      <LazyWhenVisible minHeight="14rem" className="mt-4">
        <Suspense fallback={<SectionFallback className="h-40" />}>
          <Footer />
        </Suspense>
      </LazyWhenVisible>
    </div>
  );
};

export default KhoiThongDongTien;
