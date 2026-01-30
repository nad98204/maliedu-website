import { useState, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import styles from "./SuccessStories.module.css";

// ========== CONSTANT DATA ==========
const FILTER_LINKS = [
  { label: "Tất cả", path: "/cam-nhan" },
  { label: "Luật Hấp Dẫn", path: "/cam-nhan/luat-hap-dan" },
  { label: "Khơi Thông Dòng Tiền", path: "/cam-nhan/khoi-thong-dong-tien" },
  { label: "Vút Tốc Mục Tiêu", path: "/cam-nhan/vut-toc-muc-tieu" },
];

// ========== MODAL COMPONENT ==========
const VideoModal = ({ youtubeId, onClose }) => {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    // Lock body scroll
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title="Video testimonial"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1f1f1f] hover:bg-[#c9a227] transition shadow-lg"
          aria-label="Đóng video"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
const SuccessStories = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [pageContent, setPageContent] = useState({
    label: "CÂU CHUYỆN THỰC TẾ",
    title: "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
    description: "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
    successStoriesVideo: "",
    stories: []
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-play logic
  useEffect(() => {
    let interval;
    if (!isPaused && !selectedVideo) {
      interval = setInterval(() => {
        handleNext();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPaused, selectedVideo, activeIndex]); // activeIndex dependency ensures interval resets on manual change

  // Helper to extract YouTube ID
  const getYoutubeId = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "";
  };

  // Helper to clean category name
  const cleanCategory = (cat) => {
    if (!cat) return "";
    return cat.replace("Cảm nhận - ", "");
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Content
        const contentDoc = await getDoc(doc(db, "homepage_content", "success_stories"));
        if (contentDoc.exists()) {
          const data = contentDoc.data();
          setPageContent({
            label: data.label || "CÂU CHUYỆN THỰC TẾ",
            title: data.title || "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
            description: data.description || "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
            title: data.title || "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
            description: data.description || "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
            videoUrl: data.videoUrl || "", // Still keep just in case, but unused
            stories: data.stories || []
          });

          // Set testimonials from config if available, otherwise use defaults
          if (data.stories && data.stories.length > 0) {
            setTestimonials(data.stories.map((s, i) => ({
              id: s.id || `story-${i}`,
              name: s.name,
              role: s.role,
              programTag: s.programTag,
              headline: s.headline,
              quote: s.quote,
              youtubeId: getYoutubeId(s.videoUrl),
              statsLabel: s.statsLabel
            })).filter(s => s.youtubeId));
          }
        }
      } catch (err) {
        console.error("Error fetching testimonials:", err);
      }
    };
    fetchData();
  }, []);

  // Default data fallback if no dynamic data found
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      id: "default-1",
      name: "Nguyễn Lan Anh",
      role: "Chuyên viên tài chính",
      programTag: "Luật Hấp Dẫn",
      headline: "X2 thu nhập sau 3 tháng",
      quote: "Khi nội tâm được cân bằng, tiền và cơ hội đến tự nhiên hơn.",
      youtubeId: "dQw4w9WgXcQ", // Example video
      statsLabel: "+100% thu nhập"
    },
    {
      id: "default-2",
      name: "Trần Minh Huy",
      role: "CEO Startup Công nghệ",
      programTag: "Vút Tốc Mục Tiêu",
      headline: "Gọi vốn thành công 1 triệu đô",
      quote: "Mali Edu giúp tôi xác định rõ mục tiêu và loại bỏ sự trì hoãn.",
      youtubeId: "l_dY33u9Ogw",
      statsLabel: "1M$ Raised"
    },
    {
      id: "default-3",
      name: "Phạm Thu Hà",
      role: "Mẹ bỉm sữa kinh doanh online",
      programTag: "Khơi Thông Dòng Tiền",
      headline: "Trả hết nợ và mua nhà mới",
      quote: "Tôi đã khóc khi hiểu ra lý do mình luôn túng thiếu. Giờ đây tôi hoàn toàn tự do.",
      youtubeId: "9bZkp7q19f0",
      statsLabel: "Mua nhà 3 tỷ"
    }
  ];

  // Get carousel items
  const getCarouselItems = () => {
    const totalItems = displayTestimonials.length;
    if (totalItems === 0) return [];

    const items = [];
    for (let offset = -2; offset <= 2; offset++) {
      const index = (activeIndex + offset + totalItems) % totalItems;
      const testimonial = displayTestimonials[index];
      items.push({
        testimonial,
        offset,
        realIndex: index,
      });
    }
    return items;
  };

  // Handle navigation
  const totalItems = displayTestimonials.length;

  const handlePrev = useCallback(() => {
    if (totalItems < 2) return;
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const handleNext = useCallback(() => {
    if (totalItems < 2) return;
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (totalItems < 2) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, totalItems]);

  // Handle Swipe/Drag Detection
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setIsPaused(true);
    setDragOffset(0);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    setDragOffset(diff);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;

    if (dragOffset > minSwipeDistance) {
      handlePrev();
    } else if (dragOffset < -minSwipeDistance) {
      handleNext();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setIsPaused(false);
  };

  const onMouseDown = (e) => {
    setIsDragging(true);
    setTouchStart(e.clientX);
    setIsPaused(true);
    setDragOffset(0);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - touchStart;
    setDragOffset(diff);
  };

  const onMouseUp = () => {
    if (!isDragging) return;

    if (dragOffset > minSwipeDistance) {
      handlePrev();
    } else if (dragOffset < -minSwipeDistance) {
      handleNext();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setIsPaused(false);
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      setTouchStart(null);
      setIsPaused(false);
    }
  };

  // Handle play button click
  const handlePlayClick = (youtubeId, testimonialIndex) => {
    setActiveIndex(testimonialIndex);
    setSelectedVideo(youtubeId);
  };

  // Handle click on card to focus
  const handleCardClick = (testimonialIndex) => {
    if (testimonialIndex === activeIndex) return;
    setActiveIndex(testimonialIndex);
  };

  const renderInfoPanel = (testimonial, variant) => {
    if (variant === "none") return null;

    if (variant === "mini") {
      return (
        <div className={styles.miniContent}>
          {testimonial.statsLabel && (
            <span className={styles.miniStatsPill}>
              {testimonial.statsLabel}
            </span>
          )}
          <p className={styles.miniName}>{testimonial.name}</p>
          <span className={styles.miniProgramTag}>
            {testimonial.programTag}
          </span>
          <p className={styles.miniHeadline}>{testimonial.headline}</p>
        </div>
      );
    }

    return (
      <div className={styles.cardContent}>
        {/* Stats Label */}
        {testimonial.statsLabel && (
          <div className="inline-block">
            <span className={styles.statsPill}>
              {testimonial.statsLabel}
            </span>
          </div>
        )}

        {/* Name & Role */}
        <div>
          <p className="text-lg font-bold text-[#1f1f1f]">
            {testimonial.name}
          </p>
          <p className="text-sm text-[#4a4a4a]">
            {testimonial.role}
          </p>
        </div>

        {/* Program Tag */}
        <div>
          <span className={styles.programTag}>
            {testimonial.programTag}
          </span>
        </div>

        {/* Headline */}
        <p className="font-semibold text-[#1f1f1f] text-base">
          {testimonial.headline}
        </p>

        {/* Quote */}
        <p className="text-sm text-[#4a4a4a] italic leading-relaxed">
          "{testimonial.quote}"
        </p>
      </div>
    );
  };

  const carouselItems = getCarouselItems();

  return (
    <section className="section bg-[#f5f0e8] py-10 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Header Text - Dynamic */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <p className="text-[#6b0f1a] uppercase tracking-widest font-bold text-sm mb-2 animate-fade-in-up">
            {pageContent.label}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1f1f1f] mb-3 leading-tight animate-fade-in-up delay-100">
            {pageContent.title}
          </h2>
          <p className="text-gray-600 text-lg md:text-xl font-light italic animate-fade-in-up delay-200">
            {pageContent.description}
          </p>

          {/* Intro Video Button Removed per request */}
        </div>

        {/* Filter Links - Mobile Marquee */}
        <div className="mb-6 md:hidden">
          <style>{`
                .wrapper-marquee-stories .swiper-wrapper {
                    transition-timing-function: linear !important;
                }
            `}</style>
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={12}
            slidesPerView={'auto'}
            loop={true}
            freeMode={true}
            grabCursor={true}
            speed={4000}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
            }}
            className="wrapper-marquee-stories !pb-4 px-1"
          >
            {[...FILTER_LINKS, ...FILTER_LINKS, ...FILTER_LINKS, ...FILTER_LINKS].map((link, idx) => (
              <SwiperSlide key={`${idx}-${link.path}`} className="!w-auto">
                <Link
                  to={link.path}
                  className="block whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 bg-white text-[#1f1f1f] border border-[#c9a227] hover:border-[#6b0f1a] hover:bg-[#f9f6f0] hover:text-[#6b0f1a] shadow-sm"
                >
                  {link.label}
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Filter Links - Desktop Static */}
        <div className="hidden md:flex flex-wrap justify-center gap-3 mb-8">
          {FILTER_LINKS.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 bg-white text-[#1f1f1f] border-2 border-[#c9a227] hover:border-[#6b0f1a] hover:bg-[#f9f6f0] hover:text-[#6b0f1a] hover:shadow-md"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Carousel Center-Focus */}
        {displayTestimonials.length > 0 && (
          <div className="mb-4">
            {/* Main Carousel Container */}
            <div
              className={styles.carouselShell}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
            >
              {/* Left Arrow */}
              <button
                onClick={handlePrev}
                disabled={totalItems < 2}
                className="hidden md:flex flex-shrink-0 z-20 h-12 w-12 items-center justify-center rounded-full bg-[#6b0f1a] text-white border-2 border-[#c9a227] hover:bg-[#7a1220] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous testimonial"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Carousel Window */}
              <div className={styles.carouselViewport}>
                <div className={styles.carouselStage}>
                  {carouselItems.map((item) => {
                    const isCenter = item.offset === 0;
                    const isInner = Math.abs(item.offset) === 1;
                    const isOuter = Math.abs(item.offset) === 2;
                    const tier = isCenter ? "center" : isInner ? "inner" : "outer";

                    const scaleValue =
                      item.offset === 0
                        ? 1.0
                        : item.offset === -1 || item.offset === 1
                          ? 0.88
                          : 0.78;
                    const opacityValue =
                      item.offset === 0
                        ? 1.0
                        : item.offset === -1 || item.offset === 1
                          ? 0.9
                          : 0.55;
                    const zIndexValue =
                      item.offset === 0 ? 3 : item.offset === -1 || item.offset === 1 ? 2 : 1;

                    return (
                      <div
                        key={`${item.offset}-${item.testimonial.id}`}
                        className={styles.carouselItem}
                        data-offset={item.offset}
                        data-tier={tier}
                        onClick={() => !isDragging && handleCardClick(item.realIndex)}
                        style={{
                          "--offset": item.offset,
                          "--scale": scaleValue,
                          "--opacity": opacityValue,
                          "--z": zIndexValue,
                          "--drag-offset": `${dragOffset}px`,
                          transition: isDragging ? 'none' : undefined
                        }}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                      >
                        <div className={styles.cardWrap}>
                          <div
                            className={`${styles.card} ${isCenter ? styles.cardActive : ""
                              }`}
                            data-tier={tier}
                          >
                            {/* Video Thumbnail */}
                            <div className={styles.thumbnail}>
                              <img
                                src={`https://img.youtube.com/vi/${item.testimonial.youtubeId}/hqdefault.jpg`}
                                alt={`${item.testimonial.name} video`}
                                className={styles.thumbnailImage}
                              />

                              {/* Overlay gradient */}
                              <div className={styles.thumbnailOverlay} />

                              {/* Play Button */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayClick(
                                      item.testimonial.youtubeId,
                                      item.realIndex
                                    );
                                  }}
                                  className={`${styles.playButton} ${isCenter ? "" : styles.playButtonCompact
                                    }`}
                                  aria-label={`Phát video của ${item.testimonial.name}`}
                                >
                                  <svg
                                    className="h-7 w-7 ml-1 fill-current"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {renderInfoPanel(
                              item.testimonial,
                              isCenter ? "full" : isInner ? "mini" : "none"
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                disabled={totalItems < 2}
                className="hidden md:flex flex-shrink-0 z-20 h-12 w-12 items-center justify-center rounded-full bg-[#6b0f1a] text-white border-2 border-[#c9a227] hover:bg-[#7a1220] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next testimonial"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Dots Navigation */}
            {totalItems > 1 && (
              <div className={`flex justify-center gap-2 ${styles.dots}`}>
                {displayTestimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`transition-all duration-300 rounded-full ${idx === activeIndex
                      ? "bg-[#6b0f1a] w-3 h-3 shadow-md"
                      : "bg-[#c9a227] w-2 h-2 opacity-50 hover:opacity-75"
                      }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4">
          <Link
            to="/cam-nhan"
            className="px-8 py-3 rounded-full bg-white text-[#6b0f1a] font-semibold border-2 border-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Xem thêm cảm nhận
          </Link>
          <Link
            to="/lien-he"
            className="px-8 py-3 rounded-full bg-[#6b0f1a] text-white font-semibold hover:bg-[#7a1220] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Đăng ký tư vấn
          </Link>
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal youtubeId={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </section>
  );
};

export default SuccessStories;
