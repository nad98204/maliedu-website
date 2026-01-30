import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Quote, Star, Users, Heart, Award } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import Masonry from 'react-masonry-css';
import { useParams } from 'react-router-dom';
import TestimonialCard from '../components/TestimonialCard';

const CATEGORY_MAPPING = {
    'vut-toc-muc-tieu': 'Cảm nhận - Vút tốc mục tiêu',
    'luat-hap-dan': 'Cảm nhận - Luật hấp dẫn'
};

const HARDCODED_HERO_IMAGES = [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop", // Student group
    "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1974&auto=format&fit=crop", // Meeting/Class
    "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop", // Happy diverse group
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop", // Teamwork success
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2073&auto=format&fit=crop", // Group working
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop"  // Presentation
];

const Testimonials = () => {
    const { category } = useParams();
    const [heroImages, setHeroImages] = useState(HARDCODED_HERO_IMAGES);
    const [videos, setVideos] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageTitle, setPageTitle] = useState('Người thật - Việc thật - Kết quả thật');
    const [activeTab, setActiveTab] = useState('photos');

    // Fetch Data
    useEffect(() => {
        const fetchTestimonials = async () => {
            setLoading(true);
            try {
                // Determine filter based on URL param
                const targetCategory = category ? CATEGORY_MAPPING[category] : null;

                // --- NEW: Fetch Hero Images Logic ---
                try {
                    const heroSnapshot = await getDocs(query(collection(db, 'hero_images'), orderBy('createdAt', 'desc')));
                    const allHeroImages = heroSnapshot.docs.map(doc => doc.data());

                    // Priority 1: Exact category match
                    let filteredImages = [];
                    if (category) {
                        filteredImages = allHeroImages.filter(img => img.category === category);
                    }

                    // Priority 2: Default category
                    if (filteredImages.length === 0) {
                        filteredImages = allHeroImages.filter(img => img.category === 'default');
                    }

                    // Priority 3: Fallback (Hardware)
                    if (filteredImages.length > 0) {
                        setHeroImages(filteredImages.map(img => img.imageUrl));
                    } else {
                        setHeroImages(HARDCODED_HERO_IMAGES);
                    }
                } catch (err) {
                    console.error("Error fetching hero images:", err);
                    setHeroImages(HARDCODED_HERO_IMAGES);
                }
                // ------------------------------------

                // Update Page Title

                // Update Page Title
                if (targetCategory === 'Cảm nhận - Vút tốc mục tiêu') {
                    setPageTitle('Câu chuyện thành công: Vút Tốc Mục Tiêu');
                } else if (targetCategory === 'Cảm nhận - Luật hấp dẫn') {
                    setPageTitle('Câu chuyện thành công: Luật Hấp Dẫn');
                } else {
                    setPageTitle('Người thật - Việc thật - Kết quả thật');
                }

                // Fetch all published posts
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('isPublished', '==', true),
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(postsQuery);
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString('vi-VN') : doc.data().createdAt
                }));

                // Filter Logic
                const filterPost = (post) => {
                    // Always exclude non-testimonial categories if we are on the main page
                    // But if we are on a specific category page, we are strict

                    if (targetCategory) {
                        return post.category === targetCategory;
                    } else {
                        // Show all "Cảm nhận" related posts
                        return post.category.includes('Cảm nhận') || post.category.includes('Review') || post.category.includes('Học viên') || post.category.includes('Kết quả');
                    }
                };

                // Filter for Videos
                const videoData = postsData.filter(post =>
                    post.type === 'video' && filterPost(post)
                );

                // Filter for Articles (Wall of Love)
                const articleData = postsData.filter(post =>
                    post.type === 'article' && filterPost(post)
                );

                setVideos(videoData);
                setArticles(articleData);
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, [category]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const masonryBreakpoints = {
        default: 3,
        1100: 2,
        700: 1
    };

    return (
        <div className="bg-[#FAF9F6] font-sans overflow-hidden min-h-screen">
            <Helmet>
                <title>{pageTitle} | MaliEdu</title>
            </Helmet>

            {/* HERO SECTION */}
            <header className="relative h-[60vh] min-h-[500px] bg-slate-900 overflow-hidden">
                {/* Background Slider */}
// Infinite Film Roll Background (Marquee)
                <div className="absolute inset-0 overflow-hidden bg-black">
                    <motion.div
                        className="flex h-full"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            ease: "linear",
                            duration: 60, // Slower for better viewing
                            repeat: Infinity,
                        }}
                    >
                        {/* Duplicate enough times to ensure no gaps on large screens */}
                        {[...heroImages, ...heroImages, ...heroImages, ...heroImages].map((img, index) => (
                            <div key={index} className="flex-shrink-0 h-full aspect-[3/2] -ml-4 md:-ml-8">
                                <img
                                    src={img}
                                    alt="Hero Film Roll"
                                    className="w-full h-full object-cover [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/40 z-10"></div>

                {/* Content */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="relative z-20 container max-w-5xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center pb-24"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-secret-gold text-sm font-semibold mb-4 shadow-lg">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="tracking-wide uppercase">KẾT QUẢ TẠI MALI EDU</span>
                    </motion.div>

                    <motion.h2
                        variants={fadeInUp}
                        className="text-white/90 text-xl md:text-2xl font-light tracking-wide mb-6 mt-2"
                    >
                        Câu chuyện thành công học viên:
                    </motion.h2>

                    {/* Dynamic Typography Logic */}
                    {(() => {
                        const targetCategory = category ? CATEGORY_MAPPING[category] : null;

                        let titleClass = "font-sans text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-wide leading-tight drop-shadow-2xl capitalize mb-8"; // Default (Style C)

                        if (category === 'vut-toc-muc-tieu') {
                            // Style A: Powerful Energy
                            titleClass = "font-sans text-5xl md:text-6xl lg:text-7xl text-white font-black italic tracking-wider leading-tight uppercase mb-8 drop-shadow-[0_4px_4px_rgba(220,38,38,0.9)]";
                        } else if (category === 'luat-hap-dan') {
                            // Style B: Magical Serif (Cinzel) -> Converted to Sans for user request
                            // Red Gradient + White Outline + Gold Glow
                            titleClass = "font-sans text-5xl md:text-6xl lg:text-7xl font-black uppercase mb-8 text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 [text-shadow:2px_2px_0px_#FFFFFF,0_0_20px_rgba(251,191,36,0.8)] pb-2";
                        }

                        return (
                            <motion.h1
                                variants={fadeInUp}
                                className={titleClass}
                            >
                                {targetCategory ? (
                                    <span>{targetCategory.replace('Cảm nhận - ', '')}</span>
                                ) : (
                                    <span>HÀNH TRÌNH VÚT TỐC</span>
                                )}
                            </motion.h1>
                        );
                    })()}

                    <motion.p
                        variants={fadeInUp}
                        className="font-sans text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-light tracking-wide italic"
                    >
                        Những câu chuyện người thật, việc thật và kết quả thật. <br className="hidden md:block" />
                        Nơi niềm tin được khẳng định bằng sự chuyển hóa.
                    </motion.p>
                </motion.div>
            </header>

            {/* TABS & CONTENT SECTION */}
            <section className="py-12 bg-[#FAF9F6] min-h-screen" id="stories">
                <div className="container max-w-7xl mx-auto px-4">

                    {/* CURIOSITY TABS */}
                    <div className="flex justify-center mb-16">
                        <div className="bg-white p-1.5 rounded-full shadow-lg border border-slate-100 inline-flex items-center gap-2">
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'photos'
                                    ? 'bg-secret-ink text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                📸 Nhật Ký Thành Công
                            </button>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'videos'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="relative">
                                    <Play className={`w-4 h-4 ${activeTab !== 'videos' ? 'text-red-600 animate-pulse' : 'text-white'}`} />
                                    {activeTab !== 'videos' && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                    )}
                                </div>
                                🎥 Phỏng Vấn Trực Tiếp
                            </button>
                        </div>
                    </div>

                    {/* CONTENT DISPLAY */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-secret-wax border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="min-h-[400px]">
                            {/* PHOTOS TAB */}
                            {activeTab === 'photos' && (
                                <>
                                    {articles.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                                            {articles.map((article) => (
                                                <TestimonialCard key={article.id} article={article} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <p className="text-slate-400 italic">Chưa có bài viết nhật ký nào.</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* VIDEOS TAB */}
                            {activeTab === 'videos' && (
                                <>
                                    {videos.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {videos.map((video) => (
                                                <TestimonialCard key={video.id} article={video} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <p className="text-slate-400 italic">Chưa có video phỏng vấn nào.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                .my-masonry-grid {
                    display: -webkit-box; /* Not needed if autoprefixed */
                    display: -ms-flexbox; /* Not needed if autoprefixed */
                    display: flex;
                    margin-left: -30px; /* gutter size offset */
                    width: auto;
                }
                .my-masonry-grid_column {
                    padding-left: 30px; /* gutter size */
                    background-clip: padding-box;
                }
            `}</style>
        </div>
    );
};

export default Testimonials;
