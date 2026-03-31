import React from "react";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getRouteSeo } from "../../seo/routeSeo";
import BannerChinh from "./sections/BannerChinh";
import CauChuyenNguoiSangLap from "./sections/CauChuyenNguoiSangLap";
import DoiTuongPhuHop from "./sections/DoiTuongPhuHop";
import FormDangKy from "./sections/FormDangKy";
import KetQuaHocVien from "./sections/KetQuaHocVien";
import LichTrinhHoc from "./sections/LichTrinhHoc";
import PhanNoiDau from "./sections/PhanNoiDau";
import VideoHocVien from "./sections/VideoHocVien";

const KhoiThongDongTien = ({ targetFunnel }) => {
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
      <div className="max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 lg:space-y-16 pt-10 pb-12">
        <PhanNoiDau />
        <DoiTuongPhuHop />
        <LichTrinhHoc />
        <KetQuaHocVien />
        <CauChuyenNguoiSangLap />
        <VideoHocVien />
        <FormDangKy targetFunnel={targetFunnel} />
      </div>
      <Footer />
    </div>
  );
};

export default KhoiThongDongTien;
