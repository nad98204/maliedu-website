import React, { lazy, Suspense } from "react";
import SEO from "../../components/SEO";
import { getRouteSeo } from "../../seo/routeSeo";
import BannerChinh from "./sections/BannerChinh";
import LazyWhenVisible from "./LazyWhenVisible";
import { SectionFallback } from "./sectionFallback";

const PhanNoiDau = lazy(() => import("./sections/PhanNoiDau"));
const DoiTuongPhuHop = lazy(() => import("./sections/DoiTuongPhuHop"));
const LichTrinhHoc = lazy(() => import("./sections/LichTrinhHoc"));
const KetQuaHocVien = lazy(() => import("./sections/KetQuaHocVien"));
const CauChuyenNguoiSangLap = lazy(() => import("./sections/CauChuyenNguoiSangLap"));
const VideoHocVien = lazy(() => import("./sections/VideoHocVien"));
const FormDangKy = lazy(() => import("./sections/FormDangKy"));
const Footer = lazy(() => import("../../components/Footer"));

const KhoiThongDongTienLeader = () => {
  const seo = getRouteSeo("/dao-tao/khoi-thong-dong-tien");

  return (
    <div
      className="relative font-sans min-h-screen"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FDF7EC 15%, #F5EDD8 50%, #EAD9B8 100%)",
      }}
    >
      <SEO {...seo} title="Trang Đăng Ký - Phễu Leader - Khơi Thông Dòng Tiền" />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("https://res.cloudinary.com/dstukyjzd/image/upload/v1772610554/mali-edu/uqs2zpqprj1xhrh3kubu.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          opacity: 0.1,
          filter: "grayscale(0.5) contrast(1.1)",
        }}
      />

      <BannerChinh />

      <div className="max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 lg:space-y-16 pt-5 sm:pt-7 pb-12">
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

        <LazyWhenVisible minHeight="26rem">
          <Suspense fallback={<SectionFallback className="min-h-[22rem]" />}>
            <FormDangKy targetFunnel="leader" source_key="1768973783248" />
          </Suspense>
        </LazyWhenVisible>
      </div>

      <LazyWhenVisible minHeight="14rem" className="mt-4">
        <Suspense fallback={<SectionFallback className="h-40" />}>
          <Footer />
        </Suspense>
      </LazyWhenVisible>
    </div>
  );
};

export default KhoiThongDongTienLeader;
