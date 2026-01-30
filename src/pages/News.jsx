import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';

const News = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch published posts from Firebase
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('isPublished', '==', true),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(postsQuery);
                const postsData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('vi-VN') : data.createdAt
                    };
                });
                setPosts(postsData);
            } catch (error) {
                console.error('Error fetching posts. NOTE: If this is a "failed-precondition" error, you need to create a Firestore Composite Index.', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // Filter tabs configuration
    const filterTabs = [
        { id: 'all', label: 'Tất cả bài viết', icon: '📋' },
        { id: 'video', label: 'Video Đào Tạo', icon: '🎥' },
        { id: 'case-study', label: 'Kết Quả Học Viên', icon: '🏆' },
        { id: 'article', label: 'Kiến thức chuyên sâu', icon: '📖' }
    ];

    // Filter logic
    const getFilteredPosts = () => {
        let filtered = posts;

        // Apply type filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(post => post.type === activeFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                post.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const filteredPosts = getFilteredPosts();

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
        <div className="bg-white font-sans overflow-hidden">
            <Helmet>
                <title>Tin tức & Sự kiện - Mali Edu</title>
            </Helmet>
            {/* HERO HEADER */}
            <header className="bg-secret-paper pt-28 pb-16">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="container max-w-6xl mx-auto px-4 text-center"
                >
                    <motion.h1
                        variants={fadeInUp}
                        className="font-serif text-5xl md:text-6xl text-secret-ink font-bold mb-4"
                    >
                        Góc Nhìn & Chuyển Hóa
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="font-sans text-lg text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed"
                    >
                        Thư viện kiến thức về Tài chính, Tâm linh và những câu chuyện người thật việc thật.
                    </motion.p>

                    {/* Search Box */}
                    <motion.div
                        variants={fadeInUp}
                        className="max-w-xl mx-auto relative"
                    >
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm bài viết, video, câu chuyện..."
                                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-secret-gold/30 rounded-full font-sans text-secret-ink placeholder-gray-400 focus:outline-none focus:border-secret-wax transition-all duration-300 shadow-md focus:shadow-lg"
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </header>

            {/* SMART FILTER TABS */}
            <section className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="container max-w-6xl mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-3 py-6">
                        {filterTabs.map((tab) => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    px-6 py-3 rounded-full font-sans font-semibold text-sm
                                    transition-all duration-300 shadow-md hover:shadow-lg
                                    ${activeFilter === tab.id
                                        ? 'bg-secret-wax text-white'
                                        : 'bg-white text-secret-ink border-2 border-gray-200 hover:border-secret-wax'
                                    }
                                `}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEWS GRID */}
            <main className="py-16 bg-gradient-to-b from-white to-secret-paper/20">
                <div className="container max-w-7xl mx-auto px-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin mb-4"></div>
                            <p className="font-sans text-lg text-gray-500 animate-pulse">Đang tải bài viết...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <p className="font-sans text-xl text-gray-500">
                                Không tìm thấy bài viết phù hợp. Hãy thử từ khóa khác!
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <AnimatePresence mode="wait">
                                {filteredPosts.map((post) => (
                                    <NewsCard key={post.id} post={post} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

// NEWS CARD COMPONENT with type-specific rendering
const NewsCard = ({ post }) => {
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    // Determine card styling based on type
    const getCardStyles = () => {
        switch (post.type) {
            case 'case-study':
                return 'border-2 border-secret-gold';
            default:
                return 'border border-gray-200';
        }
    };

    const getBadge = () => {
        switch (post.type) {
            case 'video':
                return { icon: '🎥', text: 'VIDEO', color: 'bg-secret-wax' };
            case 'case-study':
                return { icon: '🏆', text: 'SUCCESS STORY', color: 'bg-secret-gold' };
            case 'article':
                return null; // Don't show badge for standard articles
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
                bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl
                transition-all duration-300 flex flex-col
                ${getCardStyles()}
            `}
        >
            {/* Thumbnail with type-specific overlay */}
            <div className="relative h-56 overflow-hidden group">
                <img
                    src={post.thumbnailUrl || "https://placehold.co/600x400?text=Mali+Edu"}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400?text=Mali+Edu";
                    }}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Video overlay with Play button */}
                {post.type === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:bg-white transition-colors cursor-pointer"
                        >
                            <Play className="w-7 h-7 text-secret-wax ml-1" fill="currentColor" />
                        </motion.div>
                    </div>
                )}

                {/* Corner Badge */}
                {badge && (
                    <div className={`absolute top-4 left-4 ${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md`}>
                        <span>{badge.icon}</span>
                        <span>{badge.text}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                {/* Category & Date */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-sans font-semibold text-secret-wax uppercase tracking-wide">
                        {post.category}
                    </span>
                    <time className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {post.createdAt}
                    </time>
                </div>

                {/* Title */}
                <h3 className={`
                    mb-3 text-secret-ink leading-tight
                    ${post.type === 'case-study' ? 'font-serif font-bold text-2xl' : 'font-sans font-bold text-xl'}
                `}>
                    {post.title}
                </h3>

                {/* Excerpt */}
                <p className="font-sans text-gray-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                    {post.excerpt}
                </p>

                {/* Read More Button */}
                <Link
                    to={`/tin-tuc/${post.slug}`}
                    className="inline-flex items-center gap-2 font-sans font-semibold text-secret-wax hover:text-secret-ink transition-colors group"
                >
                    <span>Xem chi tiết</span>
                    <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </motion.article>
    );
};

export default News;
