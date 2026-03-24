import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../firebase";
import { HERO_SLIDES } from "../data/heroData";
import { readHomeBannerCache, writeHomeBannerCache } from "../utils/homeBannerCache";

const MOBILE_MEDIA_QUERY = "(max-width: 768px)";
const DEFAULT_DESKTOP_ASPECT_RATIO = 16 / 9;
const DEFAULT_MOBILE_ASPECT_RATIO = 4 / 5;

const normalizeCloudinaryImage = (url, transform) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url ?? "";
  }

  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) {
    return url;
  }

  const prefix = url.slice(0, markerIndex + marker.length);
  const rest = url.slice(markerIndex + marker.length);

  if (rest.startsWith("f_") || rest.startsWith("q_") || rest.startsWith("c_") || rest.startsWith("w_") || rest.startsWith("h_") || rest.startsWith("g_")) {
    return `${prefix}${transform}/${rest}`;
  }

  return `${prefix}${transform}/${rest}`;
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getAspectRatioFromDimensions = (width, height) => {
  const safeWidth = toPositiveNumber(width);
  const safeHeight = toPositiveNumber(height);

  if (!safeWidth || !safeHeight) {
    return null;
  }

  return safeWidth / safeHeight;
};

const normalizeSlide = (slide, index) => ({
  id: slide.id ?? `fallback-slide-${index}`,
  image: normalizeCloudinaryImage(
    slide.imageUrl ?? slide.image ?? "",
    "f_auto,q_auto,c_limit,w_1920"
  ),
  mobileImage: normalizeCloudinaryImage(
    slide.mobileImageUrl ?? slide.mobileImage ?? "",
    "f_auto,q_auto,c_limit,w_900"
  ),
  title: slide.title ?? "",
  subtitle: slide.subtitle ?? "",
  ctaText: slide.ctaText ?? "",
  ctaLink: slide.ctaLink ?? "#",
  imageWidth: toPositiveNumber(slide.imageWidth),
  imageHeight: toPositiveNumber(slide.imageHeight),
  mobileImageWidth: toPositiveNumber(slide.mobileImageWidth),
  mobileImageHeight: toPositiveNumber(slide.mobileImageHeight),
});

const buildSlides = (items) =>
  items
    .filter((slide) => (slide.active ?? true) && (slide.imageUrl ?? slide.image ?? slide.mobileImageUrl ?? slide.mobileImage))
    .map((slide, index) => normalizeSlide(slide, index));

const FALLBACK_SLIDES = buildSlides(HERO_SLIDES);

const getSlides = () => {
  const cachedSlides = buildSlides(readHomeBannerCache());
  return cachedSlides.length > 0 ? cachedSlides : FALLBACK_SLIDES;
};

const HeroCarousel = () => {
  const [slides, setSlides] = useState(() => {
    const cached = buildSlides(readHomeBannerCache());
    return cached.length > 0 ? cached : FALLBACK_SLIDES;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }

    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });
  const [slideAspectRatios, setSlideAspectRatios] = useState({});

  const filteredSlides = useMemo(() => {
    const list = slides.filter((slide) =>
      isMobileViewport ? slide.mobileImage : slide.image
    );
    // Nếu vô tình bị trống trơn do lọc, trả lại mảng ban đầu để không blank web
    return list.length > 0 ? list : slides;
  }, [slides, isMobileViewport]);

  const slideCount = filteredSlides.length;
  const activeSlide = useMemo(
    () => (slideCount > 0 ? filteredSlides[currentIndex] : null),
    [currentIndex, slideCount, filteredSlides]
  );

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const q = query(
          collection(db, "banners"),
          where("active", "==", true)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs
          .map(docItem => ({
            id: docItem.id,
            ...docItem.data()
          }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (items.length > 0) {
          const newSlides = buildSlides(items);
          setSlides(newSlides);
          writeHomeBannerCache(items);
        }
      } catch (err) {
        console.error("HeroCarousel: Error fetching banners from Firestore:", err);
      }
    };

    fetchBanners();

    const syncSlides = () => {
      const cached = buildSlides(readHomeBannerCache());
      if (cached.length > 0) setSlides(cached);
    };

    window.addEventListener("storage", syncSlides);
    return () => window.removeEventListener("storage", syncSlides);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const syncViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  const goToSlide = (index) => {
    if (slideCount === 0) return;
    const nextIndex = (index + slideCount) % slideCount;
    setCurrentIndex(nextIndex);
  };

  const handleNext = () => goToSlide(currentIndex + 1);
  const handlePrev = () => goToSlide(currentIndex - 1);

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

  const setSlideAspectRatio = (slideId, type, width, height) => {
    const ratio = getAspectRatioFromDimensions(width, height);
    if (!slideId || !type || !ratio) {
      return;
    }

    setSlideAspectRatios((prev) => {
      if (prev[slideId]?.[type] === ratio) {
        return prev;
      }

      return {
        ...prev,
        [slideId]: {
          ...prev[slideId],
          [type]: ratio,
        },
      };
    });
  };

  const getDesktopAspectRatio = (slide) =>
    getAspectRatioFromDimensions(slide?.imageWidth, slide?.imageHeight) ??
    slideAspectRatios[slide?.id]?.desktop ??
    DEFAULT_DESKTOP_ASPECT_RATIO;

  const getMobileAspectRatio = (slide) =>
    getAspectRatioFromDimensions(slide?.mobileImageWidth, slide?.mobileImageHeight) ??
    slideAspectRatios[slide?.id]?.mobile ??
    getDesktopAspectRatio(slide) ??
    DEFAULT_MOBILE_ASPECT_RATIO;

  if (!activeSlide) {
    return null;
  }

  const activeAspectRatio = isMobileViewport
    ? getMobileAspectRatio(activeSlide)
    : getDesktopAspectRatio(activeSlide);

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#0d0a08] text-white select-none"
      style={{
        aspectRatio: activeAspectRatio,
        maxHeight: isMobileViewport ? "none" : "min(78vh, 600px)",
      }}
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
      {filteredSlides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-[1400ms] ease-out ${isActive
              ? "opacity-100 z-10 scale-100"
              : "opacity-0 z-0 scale-[1.04] pointer-events-none"
              }`}
          >
            {slide.image && (
              <img
                src={slide.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center scale-105 blur-xl opacity-25"
                loading={isActive ? "eager" : "lazy"}
                fetchPriority={isActive ? "high" : "auto"}
                draggable={false}
                onLoad={(event) => {
                  setSlideAspectRatio(
                    slide.id,
                    "desktop",
                    event.currentTarget.naturalWidth,
                    event.currentTarget.naturalHeight
                  );
                }}
              />
            )}
            <picture className="absolute inset-0 block h-full w-full">
              {slide.mobileImage && (
                <source media="(max-width: 768px)" srcSet={slide.mobileImage} />
              )}
              <img
                src={slide.image || ""}
                alt={slide.title || "Banner"}
                className="h-full w-full object-cover object-center"
                loading={isActive ? "eager" : "lazy"}
                fetchPriority={isActive ? "high" : "auto"}
                draggable={false}
                onLoad={(event) => {
                  const isMobileImage = event.currentTarget.currentSrc === (slide.mobileImage || slide.image);
                  setSlideAspectRatio(
                    slide.id,
                    isMobileImage ? "mobile" : "desktop",
                    event.currentTarget.naturalWidth,
                    event.currentTarget.naturalHeight
                  );
                }}
              />
            </picture>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
            <div
              className={`absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 sm:bottom-4 md:bottom-5 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <a
                href={slide.ctaLink || "#"}
                className="pointer-events-auto inline-flex items-center justify-center px-6 py-3 sm:px-7 sm:py-2.5 md:px-8 rounded-full bg-gradient-to-r from-[#c4472f] via-[#b32a1f] to-[#8b1f2e] text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.12em] shadow-[0_16px_40px_rgba(139,46,46,0.45)] transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {slide.ctaText || "Dang ky ngay"}
              </a>
            </div>
          </div>
        );
      })}

      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 rounded-full border border-white/20 bg-white/5 p-3 text-white shadow-lg backdrop-blur-md transition hover:border-white/50 hover:bg-white/15 sm:left-4 md:left-5"
            aria-label="Slide truoc"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 rounded-full border border-white/20 bg-white/5 p-3 text-white shadow-lg backdrop-blur-md transition hover:border-white/50 hover:bg-white/15 sm:right-4 md:right-5"
            aria-label="Slide tiep"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:bottom-3.5 md:bottom-4">
            {filteredSlides.map((slide, index) => {
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
