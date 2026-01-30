import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Calendar, ArrowLeft } from 'lucide-react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';

const CATEGORY_DATA = {
    "luat-nhan-qua-hap-dan": {
        title: "Luật Nhân Quả & Luật Hấp Dẫn",
        desc: "Cốt lõi hệ thống: cơ chế vận hành, hiểu đúng để không 'mê tín hoá'. Nhân – quả trong lời nói / hành động / tư duy. Hấp dẫn là 'luật đi sau' của phước – nghiệp – nhận thức."
    },
    "tiem-thuc-niem-tin": {
        title: "Tiềm Thức & Tái Lập Trình Niềm Tin",
        desc: "Mục tiêu: thay 'hệ điều hành' bên trong để đổi hành vi ngoài đời. Ám thị, niềm tin, cơ chế tự động. Quy trình đặt hàng tiềm thức và kỷ luật nội tâm."
    },
    "chua-lanh-noi-tam": {
        title: "Chữa Lành Nội Tâm & Đứa Trẻ Bên Trong",
        desc: "Mục tiêu: xử lý gốc rễ lặp lại (tình yêu – gia đình – tiền bạc). Nhận diện vết thương, cơ chế phòng vệ. Chuyển hoá cảm xúc: xấu hổ, tội lỗi, giận, buồn."
    },
    "thien-thuc-hanh": {
        title: "Thiền Dẫn & Thực Hành Năng Lượng",
        desc: "Đặc sản để web thể hiện chiều sâu trải nghiệm. Thiền kết nối tiềm thức, thiền tha thứ, thiền biết ơn. Thả lỏng hệ thần kinh, cân bằng cảm xúc."
    },
    "nang-luong-tien": {
        title: "Năng Lượng Tiền & Thịnh Vượng",
        desc: "Mục tiêu: chữa 'vết thương tài chính' + nâng chuẩn nhận. Gốc rễ nghèo/thiếu: sợ mất, sợ không đủ. Rung động – hành vi – kết quả tiền bạc."
    },
    "muc-tieu-hieu-suat": {
        title: "Mục Tiêu – Kỷ Luật – Hiệu Suất",
        desc: "Quan điểm mạnh: Hấp dẫn không thay thế hành động, nó nâng chất lượng hành động. Chống trì hoãn, xây thói quen. Sống trong 'bức tranh mục tiêu'."
    },
    "kinh-doanh-tinh-thuc": {
        title: "Kinh Doanh Bằng Bản Thể & Gieo Giá Trị",
        desc: "Định vị Mong Coaching: 'vừa thực tế vừa có đạo lý.' Thương hiệu cá nhân, uy tín, năng lực lõi. Thu hút khách hàng bằng giá trị, không bằng chiêu trò."
    },
    "video-podcast": {
        title: "Video Podcast Đồng Hành Chuyển Hóa",
        desc: "Những video chia sẻ sâu sắc, đồng hành cùng bạn trên hành trình chuyển hóa tâm thức mỗi ngày."
    }
};

const PostList = () => {
    const { slug } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const categoryInfo = CATEGORY_DATA[slug];

    useEffect(() => {
        const fetchPosts = async () => {
            if (!categoryInfo) return;

            setLoading(true);
            try {
                // Query posts matching the category title
                // Query posts matching the category title
                // Note: Removing orderBy('createdAt', 'desc') to avoid "Missing Index" error
                // We will sort client-side instead.
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('isPublished', '==', true),
                    where('category', '==', categoryInfo.title)
                );

                const snapshot = await getDocs(postsQuery);
                const postsData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('vi-VN') : data.createdAt,
                        // Keep raw timestamp for sorting
                        originalCreatedAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                    };
                });

                // Sort client-side
                postsData.sort((a, b) => b.originalCreatedAt - a.originalCreatedAt);

                setPosts(postsData);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [slug, categoryInfo]);

    if (!categoryInfo) {
        return <Navigate to="/tin-tuc" replace />;
    }

    // Animation variants
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

    return (
        <div className="bg-white font-sans overflow-hidden min-h-screen">
            <Helmet>
                <title>{categoryInfo.title} - Mali Edu</title>
                <meta name="description" content={categoryInfo.desc} />
            </Helmet>

            {/* HERO HEADER */}
            <header className="bg-gradient-to-br from-secret-paper to-white pt-12 pb-16 border-b border-secret-wax/10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="container max-w-6xl mx-auto px-4 text-center"
                >


                    <motion.h1
                        variants={fadeInUp}
                        className="font-sans text-4xl md:text-5xl lg:text-6xl text-secret-ink font-bold mb-6 tracking-tight leading-tight"
                    >
                        {categoryInfo.title}
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="font-sans text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
                    >
                        {categoryInfo.desc}
                    </motion.p>
                </motion.div>
            </header>

            {/* POSTS GRID */}
            <main className="py-20 bg-white">
                <div className="container max-w-7xl mx-auto px-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin mb-4"></div>
                            <p className="font-sans text-lg text-gray-500 animate-pulse">Đang tải bài viết...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <div className="inline-block p-8 rounded-full bg-secret-wax/5 mb-6">
                                <Search className="w-16 h-16 text-secret-wax/40" />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-secret-ink mb-2">
                                Chưa có bài viết nào
                            </h3>
                            <p className="font-sans text-gray-500 max-w-md mx-auto">
                                Nội dung cho mục này đang được biên tập và sẽ sớm ra mắt. Vui lòng quay lại sau!
                            </p>
                            <div className="mt-8">
                                <Link
                                    to="/"
                                    className="inline-flex h-12 items-center justify-center rounded-full bg-secret-wax px-8 font-semibold text-white transition hover:bg-secret-ink shadow-lg shadow-secret-wax/20"
                                >
                                    Về trang chủ
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                        >
                            <AnimatePresence mode="wait">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

// PostCard Component (Reused logic from NewsCard with adjustments)
const PostCard = ({ post }) => {
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const getCardStyles = () => {
        switch (post.type) {
            case 'case-study':
                return 'border-2 border-secret-gold bg-secret-paper/10';
            default:
                return 'border border-gray-100 bg-white hover:border-secret-wax/30';
        }
    };

    const getBadge = () => {
        switch (post.type) {
            case 'video':
                return { icon: '🎥', text: 'VIDEO', color: 'bg-secret-wax' };
            case 'case-study':
                return { icon: '🏆', text: 'SUCCESS STORY', color: 'bg-secret-gold' };
            default:
                return null;
        }
    };

    const badge = getBadge();

    return (
        <motion.article
            variants={fadeInUp}
            whileHover={{ y: -8 }}
            className={`
                group rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-secret-ink/5
                transition-all duration-300 flex flex-col h-full
                ${getCardStyles()}
            `}
        >
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={post.thumbnailUrl || "https://placehold.co/600x400?text=Mali+Edu"}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400?text=Mali+Edu";
                    }}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {post.type === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                        >
                            <Play className="w-6 h-6 text-secret-wax ml-1" fill="currentColor" />
                        </motion.div>
                    </div>
                )}

                {badge && (
                    <div className={`absolute top-4 left-4 ${badge.color} text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md`}>
                        <span>{badge.icon}</span>
                        <span>{badge.text}</span>
                    </div>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-sans font-bold text-secret-wax uppercase tracking-wider bg-secret-wax/5 px-2 py-1 rounded">
                        {post.category}
                    </span>
                    <time className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        {post.createdAt}
                    </time>
                </div>

                <h3 className={`
                    mb-3 text-secret-ink leading-snug group-hover:text-secret-wax transition-colors font-sans font-bold
                    ${post.type === 'case-study' ? 'text-2xl' : 'text-xl'}
                `}>
                    {post.title}
                </h3>

                <p className="font-sans text-slate-600 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    {post.excerpt}
                </p>

                <Link
                    to={`/tin-tuc/${post.slug}`}
                    className="inline-flex items-center gap-2 font-sans font-semibold text-sm text-secret-wax/80 hover:text-secret-wax transition-colors self-start"
                >
                    <span>Đọc tiếp</span>
                    <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </motion.article>
    );
};

export default PostList;
