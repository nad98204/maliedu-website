import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { crmFirestore } from "../../firebase";
import { getRouteSeo } from "../../seo/routeSeo";
import { initMetaPixel, trackMetaEvent } from "../../utils/metaPixel";
import BannerChinh from "./sections/BannerChinh";
import CauChuyenNguoiSangLap from "./sections/CauChuyenNguoiSangLap";
import DoiTuongPhuHop from "./sections/DoiTuongPhuHop";
import FormDangKy from "./sections/FormDangKy";
import KetQuaHocVien from "./sections/KetQuaHocVien";
import LichTrinhHoc from "./sections/LichTrinhHoc";
import PhanNoiDau from "./sections/PhanNoiDau";
import VideoHocVien from "./sections/VideoHocVien";

const DEFAULT_PIXEL_ID = "1526874981588150";

const normalizePath = (path) => {
  if (!path) return "/";

  const cleanPath = path.split("?")[0].split("#")[0];
  return cleanPath.replace(/\/+$/, "") || "/";
};

const KhoiThongDongTien = () => {
  const [pixelId, setPixelId] = useState("");
  const [isPixelReady, setIsPixelReady] = useState(false);
  const seo = getRouteSeo("/dao-tao/khoi-thong-dong-tien");

  useEffect(() => {
    let isCancelled = false;

    const fetchConfig = async () => {
      try {
        const currentPath = normalizePath(window.location.pathname);
        const querySnap = await getDocs(collection(crmFirestore, "landing_pages"));
        const matchDoc = querySnap.docs.find((item) => {
          const slug = normalizePath(item.data().slug || "");
          return (
            slug === currentPath ||
            item.id === "khoi-thong-dong-tien" ||
            currentPath.includes("khoi-thong-dong-tien")
          );
        });

        if (!isCancelled) {
          setPixelId(matchDoc?.data().fbPixel || DEFAULT_PIXEL_ID);
          setIsPixelReady(true);
        }
      } catch (error) {
        console.error("Loi lay config:", error);
        if (!isCancelled) {
          setPixelId(DEFAULT_PIXEL_ID);
          setIsPixelReady(true);
        }
      }
    };

    fetchConfig();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPixelReady || !pixelId) return;

    initMetaPixel(pixelId);
    trackMetaEvent("PageView");
  }, [isPixelReady, pixelId]);

  return (
    <div
      className="relative font-sans min-h-screen"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FDF7EC 15%, #F5EDD8 50%, #EAD9B8 100%)",
      }}
    >
      <SEO {...seo} />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>

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
        <FormDangKy />
      </div>
      <Footer />
    </div>
  );
};

export default KhoiThongDongTien;
