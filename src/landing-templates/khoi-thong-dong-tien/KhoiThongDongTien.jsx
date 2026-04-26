import React, { lazy, Suspense } from "react";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getRouteSeo } from "../../seo/routeSeo";
import BannerChinh from "./sections/BannerChinh";
import PhanNoiDau from "./sections/PhanNoiDau";

const DoiTuongPhuHop   = lazy(() => import("./sections/DoiTuongPhuHop"));
const LichTrinhHoc     = lazy(() => import("./sections/LichTrinhHoc"));
const KetQuaHocVien    = lazy(() => import("./sections/KetQuaHocVien"));
const CauChuyenNguoiSangLap = lazy(() => import("./sections/CauChuyenNguoiSangLap"));
const VideoHocVien     = lazy(() => import("./sections/VideoHocVien"));
const FormDangKy       = lazy(() => import("./sections/FormDangKy"));

const KhoiThongDongTien = ({ targetFunnel, source_key }) => {
  const seo = getRouteSeo("/dao-tao/khoi-thong-dong-tien");

  return (
    <div
      className="relative font-sans min-h-screen"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FDF7EC 15%, #F5EDD8 50%, #EAD9B8 100%)",
      }}
    >
      <SEO {...seo} />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("https://res.cloudinary.com/dstukyjzd/image/upload/f_auto,q_auto:eco,w_1280/v1772610554/mali-edu/uqs2zpqprj1xhrh3kubu.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          opacity: 0.1,
          filter: "grayscale(0.5) contrast(1.1)",
        }}
      />

      <BannerChinh />
      <div className="max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 lg:space-y-16 pt-5 sm:pt-7 pb-12">
        <PhanNoiDau />
        <Suspense fallback={<div className="h-32" />}>
          <DoiTuongPhuHop />
          <LichTrinhHoc />
          <KetQuaHocVien />
          <CauChuyenNguoiSangLap />
          <VideoHocVien />
          <FormDangKy targetFunnel={targetFunnel} source_key={source_key} />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
};

export default KhoiThongDongTien;
