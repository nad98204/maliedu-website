import BannerChinh from "./sections/BannerChinh";
import PhanNoiDau from "./sections/PhanNoiDau";
import DoiTuongPhuHop from "./sections/DoiTuongPhuHop";
import LichTrinhHoc from "./sections/LichTrinhHoc";
import KetQuaHocVien from "./sections/KetQuaHocVien";
import CauChuyenNguoiSangLap from "./sections/CauChuyenNguoiSangLap";
import VideoHocVien from "./sections/VideoHocVien";
import FormDangKy from "./sections/FormDangKy";
import Footer from "../../components/Footer";
import React, { useEffect, useState } from "react";
import { crmFirestore } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";/* ─── Main Page ──────────────────────────────────────────────── */
const KhoiThongDongTien = () => {
  const [pixelId, setPixelId] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const normalizePath = (p) => {
          if (!p) return "/";
          let path = p.split("?")[0].split("#")[0];
          return path.replace(/\/+$/, "") || "/";
        };
        const currentPath = normalizePath(window.location.pathname);
        const querySnap = await getDocs(collection(crmFirestore, "landing_pages"));
        const matchDoc = querySnap.docs.find(d => 
          normalizePath(d.data().slug || "") === currentPath || 
          d.id === "khoi-thong-dong-tien" || 
          currentPath.includes("khoi-thong-dong-tien")
        );
        if (matchDoc && matchDoc.data().fbPixel) {
          setPixelId(matchDoc.data().fbPixel);
        }
      } catch (e) {
        console.error("Lỗi lấy config:", e);
      }
    };
    fetchConfig();
  }, []);

  // Kích hoạt FB Pixel khi có pixelId
  useEffect(() => {
    if (pixelId) {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }, [pixelId]);

  return (
    <div
      className="relative font-sans"
      style={{ background: "linear-gradient(180deg, #F5EDD8 0%, #EAD9B8 30%, #F2E6CC 60%, #EAD9B8 100%)" }}
    >
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
