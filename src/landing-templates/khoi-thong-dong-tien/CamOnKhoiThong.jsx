import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { crmFirestore } from "../../firebase";
import {
  initMetaPixel,
  trackMetaEvent,
  trackMetaEventOnce,
} from "../../utils/metaPixel";
import { KHOI_THONG_DONG_TIEN_CONFIG } from "./landingConfig";

const DEFAULT_ZALO_LINK = KHOI_THONG_DONG_TIEN_CONFIG.zaloLink;
const DEFAULT_PIXEL_ID = "1526874981588150";
const DEFAULT_TRACK_CONFIG = {
  fbCurrency: "VND",
  fbEventValue: 0,
};

const resolveMetaEventData = (config) => {
  const numericValue = Number(config?.fbEventValue ?? config?.eventValue ?? 0);

  return {
    value: Number.isFinite(numericValue) ? numericValue : 0,
    currency: String(config?.fbCurrency || config?.currency || "VND").toUpperCase(),
  };
};

const CamOnKhoiThong = () => {
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [zaloLink, setZaloLink] = useState(DEFAULT_ZALO_LINK);
  const [pixelId, setPixelId] = useState("");
  const [trackConfig, setTrackConfig] = useState(DEFAULT_TRACK_CONFIG);
  const [isConfigReady, setIsConfigReady] = useState(false);
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";

  useEffect(() => {
    let isCancelled = false;

    const fetchConfig = async () => {
      try {
        const querySnap = await getDocs(collection(crmFirestore, "landing_pages"));
        const matchDoc = querySnap.docs.find(
          (item) =>
            item.id === "khoi-thong-dong-tien" ||
            item.data().slug?.includes("khoi-thong-dong-tien")
        );

        if (isCancelled) return;

        if (matchDoc) {
          const data = matchDoc.data();
          setZaloLink(DEFAULT_ZALO_LINK);
          setPixelId(data.fbPixel || DEFAULT_PIXEL_ID);
          setTrackConfig((prev) => ({ ...prev, ...data }));
        } else {
          setZaloLink(DEFAULT_ZALO_LINK);
          setPixelId(DEFAULT_PIXEL_ID);
        }
        setIsConfigReady(true);
      } catch (error) {
        console.error("Loi lay config thank you:", error);
        if (!isCancelled) {
          setZaloLink(DEFAULT_ZALO_LINK);
          setPixelId(DEFAULT_PIXEL_ID);
          setIsConfigReady(true);
        }
      }
    };

    fetchConfig();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isConfigReady || !pixelId) return;

    initMetaPixel(pixelId);
    trackMetaEvent("PageView");

    if (!eventId) return;

    const storageKey = `khoi-thong-dong-tien:complete-registration:${eventId}`;
    trackMetaEventOnce({
      storageKey,
      eventName: "CompleteRegistration",
      params: resolveMetaEventData(trackConfig),
      options: { eventID: eventId },
    });
  }, [eventId, isConfigReady, pixelId, trackConfig]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className="min-h-screen font-sans relative flex items-center justify-center py-10 px-4 scroll-smooth"
      style={{ background: "linear-gradient(180deg, #F5EDD8 0%, #EAD9B8 30%, #F2E6CC 60%, #EAD9B8 100%)" }}
    >
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#7A2113] rounded-full blur-[120px] opacity-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#C9961A] rounded-full blur-[150px] opacity-15" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(122,33,19,0.08)] border border-[#D4B572]/40 overflow-hidden flex flex-col items-center p-8 sm:p-10 text-center">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[#C9961A]/20 rounded-full animate-ping opacity-50"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute inset-2 bg-[#C9961A]/30 rounded-full animate-ping opacity-70"
            style={{ animationDuration: "2s" }}
          />
          <div className="relative w-full h-full bg-gradient-to-b from-[#C9961A] to-[#A07840] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-[28px] font-black text-[#7A2113] uppercase tracking-wide leading-tight mb-2">
          ĐĂNG KÝ
          <br />
          THÀNH CÔNG!
        </h1>

        <div className="w-16 h-1 bg-[#D4B572] rounded-full mb-6 opacity-50" />

        <div className="w-full bg-[#FDF8EE] border border-[#D4B572]/50 rounded-2xl p-5 mb-8 relative shadow-inner">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gradient-to-r from-[#E8393F] to-[#9C0C12] text-[#FFE566] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_5px_15px_rgba(156,12,18,0.3)] whitespace-nowrap">
            <ShieldAlert className="w-3.5 h-3.5" />
            BƯỚC CHUẨN BỊ CUỐI CÙNG
          </div>

          <h2 className="text-[#3A2208] text-[15px] sm:text-[17px] font-bold leading-snug mt-3">
            Vào Nhóm Zalo để nhận Tài Liệu Thực Hành và Hướng Dẫn Kèm Cặp
          </h2>

          <div className="w-full h-px bg-[#D4B572]/30 my-3" />

          <p className="text-[#7A2113] text-xs sm:text-[13px] font-medium leading-relaxed italic">
            *Chúng tôi không thể gửi thông tin lớp học nếu bạn chưa có mặt trong nhóm.
          </p>
        </div>

        <div className="flex flex-col items-center mb-8 w-full">
          <p className="text-[#5C3A1A] text-xs font-bold uppercase tracking-widest opacity-80 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#7A2113]" />
            Nhóm sẽ khóa duyệt sau:
          </p>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center w-[72px] h-[72px] justify-center bg-gradient-to-b from-[#4A1F08] to-[#2E1202] rounded-2xl shadow-[0_10px_20px_rgba(58,34,8,0.3)] text-white border border-[#D4B572]/20 relative overflow-hidden">
              <div className="absolute top-0 w-full h-1/2 bg-white/5" />
              <span className="text-4xl font-black leading-none drop-shadow-md z-10">
                {String(minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#D4B572] mt-1 z-10">Phút</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#7A2113] animate-pulse">:</span>
            </div>
            <div className="flex flex-col items-center w-[72px] h-[72px] justify-center bg-gradient-to-b from-[#4A1F08] to-[#2E1202] rounded-2xl shadow-[0_10px_20px_rgba(58,34,8,0.3)] text-white border border-[#D4B572]/20 relative overflow-hidden">
              <div className="absolute top-0 w-full h-1/2 bg-white/5" />
              <span className="text-4xl font-black leading-none drop-shadow-md z-10">
                {String(seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#D4B572] mt-1 z-10">Giây</span>
            </div>
          </div>
        </div>

        <div className="w-full relative group">
          <div className="absolute -inset-1 bg-[#0068FF] rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500 group-hover:duration-200" />
          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackMetaEvent("Contact", { content_name: "Bam vao nhom Zalo" });
            }}
            className="relative w-full flex flex-col items-center justify-center gap-1 rounded-full py-3.5 px-6 text-white overflow-hidden transition-all duration-300 transform group-hover:scale-[1.02] shadow-[0_10px_25px_rgba(0,104,255,0.4)]"
            style={{ background: "linear-gradient(180deg, #1877F2 0%, #0056D2 100%)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 font-black text-[16px] sm:text-[18px]">
              <span className="text-[#FFE566] text-xl">👉</span>
              BẤM ĐÂY VÀO NHÓM NGAY
              <ArrowRight className="w-5 h-5 ml-1" />
            </div>
          </a>
        </div>

        <p className="text-[#5C3A1A] text-[11px] mt-4 opacity-60 italic">
          (Vui lòng kiên nhẫn bấm lại vài lần nếu Zalo chưa mở)
        </p>
      </div>
    </div>
  );
};

export default CamOnKhoiThong;
