import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import SEO from "../../components/SEO";
import { getRouteSeo } from "../../seo/routeSeo";
import BannerChinh from "./sections/BannerChinh";
import LazyWhenVisible from "./LazyWhenVisible";
import { SectionFallback } from "./sectionFallback";
import { KHOI_THONG_HERO_BANNER_URL } from "./landingConfig";
import { HERO_TITLE_SRCSET, HERO_TITLE_SIZES } from "./heroAssets";
import RegistrationCta from "./RegistrationCta";
import RegistrationDialog from "./RegistrationDialog";
import { loadRegistrationForm, RegistrationContext } from "./registrationContext";

const PhanNoiDau = lazy(() => import("./sections/PhanNoiDau"));
const DoiTuongPhuHop = lazy(() => import("./sections/DoiTuongPhuHop"));
const LichTrinhHoc = lazy(() => import("./sections/LichTrinhHoc"));
const KetQuaHocVien = lazy(() => import("./sections/KetQuaHocVien"));
const CauChuyenNguoiSangLap = lazy(() => import("./sections/CauChuyenNguoiSangLap"));
const VideoHocVien = lazy(() => import("./sections/VideoHocVien"));
const Footer = lazy(() => import("../../components/Footer"));

const KhoiThongDongTienLeader = () => {
  const seo = getRouteSeo("/dao-tao/khoi-thong-dong-tien-leader");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [hasOpenedRegistration, setHasOpenedRegistration] = useState(false);
  const [showStickyRegistration, setShowStickyRegistration] = useState(false);
  const heroRef = useRef(null);
  const openRegistration = useCallback(() => {
    setHasOpenedRegistration(true);
    setIsRegistrationOpen(true);
  }, []);
  const closeRegistration = useCallback(() => setIsRegistrationOpen(false), []);
  const registration = useMemo(() => ({
    open: openRegistration,
    preload: () => { loadRegistrationForm().catch(() => {}); },
  }), [openRegistration]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyRegistration(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(heroRef.current);
    const preload = () => { loadRegistrationForm().catch(() => {}); };
    const idleId = window.requestIdleCallback?.(preload, { timeout: 2500 });
    const timeoutId = idleId === undefined ? window.setTimeout(preload, 1500) : undefined;
    return () => {
      observer.disconnect();
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    // Keep existing shared links ending in #dang-ky useful on the popup landing.
    const openFromHash = () => {
      if (window.location.hash === "#dang-ky") openRegistration();
    };
    window.addEventListener("hashchange", openFromHash);
    if (window.location.hash === "#dang-ky") {
      const frame = requestAnimationFrame(openFromHash);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("hashchange", openFromHash);
      };
    }
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [openRegistration]);

  return (
    <RegistrationContext.Provider value={registration}>
    <div
      className="relative font-sans min-h-screen pb-24 lg:pb-0"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FDF7EC 15%, #F5EDD8 50%, #EAD9B8 100%)",
      }}
    >
      <SEO
        {...seo}
        title="Trang Đăng Ký - Phễu Leader - Khơi Thông Dòng Tiền"
        preloadLcpImage={KHOI_THONG_HERO_BANNER_URL}
        preloadLcpImageSrcSet={HERO_TITLE_SRCSET}
        preloadLcpImageSizes={HERO_TITLE_SIZES}
      />
      <div ref={heroRef}><BannerChinh /></div>

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

        <section className="relative overflow-hidden rounded-3xl border border-[#D4B572]/60 bg-gradient-to-br from-[#7D2015] to-[#350A07] px-5 py-8 text-center text-white shadow-xl sm:px-8 sm:py-10">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-[#FFE065]" aria-hidden="true" />
          <h2 className="text-2xl font-black leading-tight sm:text-3xl">Bắt đầu hành trình <span className="text-[#FFE065]">khơi thông dòng tiền</span></h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">Đăng ký 4 buổi học online miễn phí để nhận lịch học và hướng dẫn tham gia qua Zoom.</p>
          <RegistrationCta source="LeaderClosing" className="mx-auto mt-6 flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full border border-[#FFE065]/40 bg-gradient-to-b from-[#ED3B41] to-[#A30D13] px-4 py-4 text-sm font-black text-[#FFE065] shadow-lg transition hover:-translate-y-0.5">
            ĐĂNG KÝ MIỄN PHÍ – NHẬN LINK HỌC <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </RegistrationCta>
        </section>
      </div>

      <LazyWhenVisible minHeight="14rem" className="mt-4">
        <Suspense fallback={<SectionFallback className="h-40" />}>
          <Footer />
        </Suspense>
      </LazyWhenVisible>

      {showStickyRegistration && (
        <div hidden={isRegistrationOpen} className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4B572]/40 bg-[#FFF9EC]/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(73,15,9,0.12)] backdrop-blur-md lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#7A2113]">4 buổi học miễn phí</p>
              <p className="mt-0.5 text-[11px] text-[#6A4A2A]">Khơi thông dòng tiền</p>
            </div>
            <RegistrationCta source="LeaderSticky" className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#E8393F] to-[#9C0C12] px-5 py-3 text-xs font-black text-[#FFE566] shadow-md">
              ĐĂNG KÝ NGAY <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </RegistrationCta>
          </div>
        </div>
      )}
      <RegistrationDialog isOpen={isRegistrationOpen} hasOpened={hasOpenedRegistration} onClose={closeRegistration} />
    </div>
    </RegistrationContext.Provider>
  );
};

export default KhoiThongDongTienLeader;
