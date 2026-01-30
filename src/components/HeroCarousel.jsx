import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../firebase";

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);

  const slideCount = slides.length;
  const activeSlide = useMemo(
    () => (slideCount > 0 ? slides[currentIndex] : null),
    [slides, currentIndex, slideCount]
  );

  const goToSlide = (index) => {
    if (slideCount === 0) return;
    const nextIndex = (index + slideCount) % slideCount;
    setCurrentIndex(nextIndex);
  };

  const handleNext = () => goToSlide(currentIndex + 1);
  const handlePrev = () => goToSlide(currentIndex - 1);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const bannerQuery = query(
          collection(db, "banners"),
          where("active", "==", true)
        );
        const snapshot = await getDocs(bannerQuery);
        const items = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            image: data.imageUrl,
            mobileImage: data.mobileImageUrl,
            title: data.title,
            subtitle: data.subtitle,
            ctaText: data.ctaText,
            ctaLink: data.ctaLink,
          };
        });
        setSlides(items);
      } catch (error) {
        console.error("Khong the tai banner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (slideCount <= 1) return;
    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [slideCount]);

  useEffect(() => {
    if (currentIndex >= slideCount) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slideCount]);

  const getClientX = (event) => {
    if ("touches" in event) {
      const touch = event.touches[0] || event.changedTouches?.[0];
      return touch ? touch.clientX : null;
    }
    return event.clientX ?? null;
  };

  const handleDragStart = (event) => {
    if (slideCount <= 1) return;
    const x = getClientX(event);
    if (x === null) return;
    setDragStartX(x);
    setDragging(true);
  };

  const handleDragEnd = (event) => {
    if (!dragging || dragStartX === null) return;
    const x = getClientX(event);
    setDragging(false);
    setDragStartX(null);
    if (x === null) return;
    const delta = x - dragStartX;
    const threshold = 50;
    if (Math.abs(delta) < threshold) return;
    if (delta > 0) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const handleDragCancel = () => {
    setDragging(false);
    setDragStartX(null);
  };

  if (isLoading) {
    return (
      <section className="min-h-[70vh] md:min-h-[90vh] bg-[#0d0a08] text-white flex items-center justify-center">
        Dang tai banner...
      </section>
    );
  }

  if (!activeSlide) {
    return null;
  }

  return (
    <section
      className="relative isolate overflow-hidden bg-[#0d0a08] text-white select-none"
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragCancel}
      onTouchStart={handleDragStart}
      onTouchEnd={handleDragEnd}
      onTouchCancel={handleDragCancel}
      onMouseMove={(event) => {
        if (dragging) {
          event.preventDefault();
        }
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-[1400ms] ease-out ${isActive
              ? "opacity-100 z-10 scale-100"
              : "opacity-0 z-0 scale-[1.04] pointer-events-none"
              }`}
          >
            <picture>
              <source media="(max-width: 768px)" srcSet={slide.mobileImage || slide.image} />
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </picture>
            <div
              className={`absolute inset-0 flex items-end justify-center pb-14 sm:pb-16 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <a
                href={slide.ctaLink || "#"}
                className="pointer-events-auto inline-flex items-center justify-center px-7 sm:px-9 py-3 rounded-full bg-gradient-to-r from-[#c4472f] via-[#b32a1f] to-[#8b1f2e] text-sm sm:text-base font-semibold uppercase tracking-[0.12em] shadow-[0_16px_40px_rgba(139,46,46,0.45)] transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {slide.ctaText || "Dang ky ngay"}
              </a>
            </div>
          </div>
        );
      })}

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 min-h-[72vh] md:min-h-[82vh] flex items-center">
        <div className="grid md:grid-cols-2 items-center gap-10 lg:gap-12 w-full">
          <div className="bg-white/6 backdrop-blur-xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.4)] rounded-3xl p-8 sm:p-10 space-y-5">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#f3c272] bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              Mali Edu
              <span className="w-1.5 h-1.5 rounded-full bg-[#f3c272] animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              {activeSlide.title || "Chuong trinh noi bat"}
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed">
              {activeSlide.subtitle ||
                "Kham pha hanh trinh chuyen hoa cung huan luyen vien chu dong va nhiet huyet."}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href={activeSlide.ctaLink || "#"}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-[#c4472f] via-[#b32a1f] to-[#8b1f2e] text-sm font-semibold uppercase tracking-[0.12em] shadow-[0_16px_40px_rgba(139,46,46,0.45)] transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {activeSlide.ctaText || "Dang ky ngay"}
              </a>
              <span className="text-sm text-white/70">
                Hoc online cung chuyen gia Mali Edu
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -right-6 -bottom-10 h-1/2 rounded-3xl bg-gradient-to-r from-[#f3c272]/30 via-transparent to-[#c4472f]/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <img
                src={activeSlide.image}
                alt={activeSlide.title}
                className="w-full h-[280px] sm:h-[340px] lg:h-[380px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-white/80">
                  Truc tuyen - tu van ca nhan hoa
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white shadow-sm backdrop-blur-md">
                  Live
                  <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full border border-white/20 bg-white/5 p-3 text-white shadow-lg backdrop-blur-md transition hover:border-white/50 hover:bg-white/15"
            aria-label="Slide truoc"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full border border-white/20 bg-white/5 p-3 text-white shadow-lg backdrop-blur-md transition hover:border-white/50 hover:bg-white/15"
            aria-label="Slide tiep"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={`${slide.id}-dot`}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${isActive
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/40 hover:bg-white/70"
                    }`}
                  aria-label={`Den slide ${index + 1}`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroCarousel;
