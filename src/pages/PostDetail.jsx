import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, User, ArrowLeft, Play } from 'lucide-react';
import SEO from '../components/SEO';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import PostSidebar from '../components/PostSidebar';

import { getYouTubeEmbedUrl } from '../utils/videoUtils';

const PostDetail = () => {
    const [notFound, setNotFound] = useState(false);
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch post by slug and related posts
    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Fetch post by slug
                const postQuery = query(
                    collection(db, 'posts'),
                    where('slug', '==', slug),
                    where('isPublished', '==', true),
                    limit(1)
                );
                const postSnapshot = await getDocs(postQuery);

                if (postSnapshot.empty) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const data = postSnapshot.docs[0].data();
                const postData = {
                    id: postSnapshot.docs[0].id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('vi-VN') : data.createdAt
                };
                setPost(postData);
            } catch (error) {
                console.error('Error fetching post. NOTE: Check Firestore Composite Index if needed.', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
        window.scrollTo(0, 0);
    }, [slug]);

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="bg-white min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin mb-4"></div>
                <p className="font-sans text-lg text-gray-500 animate-pulse">Đang tải bài viết...</p>
            </div>
        );
    }

    // Redirect if not found
    if (notFound || !post) {
        return <Navigate to="/tin-tuc" replace />;
    }

    return (
        <div className="bg-white font-sans overflow-hidden">
            <SEO
                title={post ? post.title : 'Đang tải...'}
                description={post?.excerpt || 'Chi tiết bài viết tại MaliEdu'}
                image={post?.thumbnailUrl}
                url={`/tin-tuc/${slug}`}
                type="article"
            />

            {/* HERO HEADER */}
            <header className="bg-secret-paper pt-28 pb-12">
                <div className="container max-w-4xl mx-auto px-4">
                    {/* Breadcrumbs */}
                    <motion.nav
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
                    >
                        <Link to="/" className="hover:text-secret-wax transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link to="/tin-tuc" className="hover:text-secret-wax transition-colors">
                            Tin tức
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-secret-ink font-medium line-clamp-1">{post.title}</span>
                    </motion.nav>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="font-serif text-4xl md:text-5xl text-secret-ink font-bold mb-6 text-center leading-tight"
                    >
                        {post.title}
                    </motion.h1>

                    {/* Meta Info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <time>{post.createdAt}</time>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{post.author}</span>
                        </div>
                        <div className="px-3 py-1 bg-secret-wax/10 rounded-full text-secret-wax font-semibold">
                            {post.category}
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="bg-white">
                <div className="container mx-auto px-4 py-12 max-w-7xl grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* CỘT TRÁI: NỘI DUNG CHÍNH (Chiếm 4 phần = 80%) */}
                    <div className="lg:col-span-4 lg:pr-12">
                        <article>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                            >
                                {/* Video Content (if type is video) */}
                                {post.type === 'video' && post.videoUrl && (
                                    <motion.div variants={fadeInUp} className="mb-8">
                                        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
                                            <iframe
                                                src={getYouTubeEmbedUrl(post.videoUrl)}
                                                title={post.title}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Featured Image (if not video) */}
                                {post.type !== 'video' && (
                                    <motion.div variants={fadeInUp} className="mb-8">
                                        <img
                                            src={post.thumbnailUrl || "https://placehold.co/600x400?text=Mali+Edu"}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/600x400?text=Mali+Edu";
                                            }}
                                            alt={post.title}
                                            className="w-full max-w-2xl h-[250px] md:h-[400px] object-cover rounded-2xl shadow-sm mb-6"
                                        />
                                    </motion.div>
                                )}

                                {/* Article Body */}
                                <motion.div
                                    variants={fadeInUp}
                                    className="prose prose-lg max-w-2xl w-full font-sans text-gray-700 prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl prose-img:shadow-lg break-words overflow-hidden"
                                    style={{
                                        fontSize: '1.125rem',
                                        lineHeight: '1.8'
                                    }}
                                >
                                    <div
                                        className="content-display"
                                        dangerouslySetInnerHTML={{ __html: post.content }}
                                    />
                                </motion.div>
                            </motion.div>
                        </article>

                        {/* CTA Section */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="mt-16"
                        >
                            <div className="bg-gradient-to-br from-secret-wax to-secret-ink rounded-3xl p-8 md:p-10 text-center text-white shadow-2xl">
                                <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
                                    Bạn muốn có kết quả tương tự?
                                </h2>
                                <p className="text-base mb-6 text-white/90 max-w-xl mx-auto">
                                    Hãy để chúng tôi đồng hành cùng bạn trên hành trình chuyển hóa tài chính và tâm linh.
                                </p>
                                <Link
                                    to="/lien-he"
                                    className="inline-block bg-white text-secret-wax font-sans font-bold px-6 py-3 rounded-full hover:bg-secret-paper transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                    Đăng ký tư vấn ngay
                                </Link>
                            </div>
                        </motion.div>

                        {/* Back to News Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mt-12 pt-8 border-t border-gray-100"
                        >
                            <Link
                                to="/tin-tuc"
                                className="inline-flex items-center gap-2 font-sans font-semibold text-secret-wax hover:text-secret-ink transition-colors group"
                            >
                                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                <span>Quay lại trang tin tức</span>
                            </Link>
                        </motion.div>
                    </div>

                    {/* CỘT PHẢI: SIDEBAR (Chiếm 1 phần = 20%) */}
                    <aside className="lg:col-span-1 hidden lg:block">
                        <div className="sticky top-24">
                            <PostSidebar
                                currentCategory={post.category}
                                currentPostId={post.id}
                            />
                        </div>
                    </aside>
                </div>
            </main>

            {/* Custom Styles for Article Content */}
            <style jsx="true">{`
                .article-content h2 {
                    font-family: 'Playfair Display', serif;
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                    line-height: 1.3;
                }

                .article-content p {
                    margin-bottom: 1.5rem;
                }

                .article-content blockquote {
                    font-family: 'Playfair Display', serif;
                    font-size: 1.5rem;
                    font-style: italic;
                    color: #8B2E2E;
                    border-left: 4px solid #D4AF37;
                    padding-left: 1.5rem;
                    margin: 2.5rem 0;
                    line-height: 1.6;
                }

                .article-content ul, .article-content ol {
                    margin: 1.5rem 0;
                    padding-left: 1.5rem;
                }

                .article-content li {
                    margin-bottom: 0.75rem;
                    line-height: 1.8;
                }

                .article-content strong {
                    font-weight: 700;
                    color: #1a1a1a;
                }
            `}</style>
        </div>
    );
};

// Related Post Card Component
const RelatedPostCard = ({ post, delay }) => {
    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
        >
            <Link to={`/tin-tuc/${post.slug}`}>
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={post.thumbnailUrl || "https://placehold.co/600x400?text=Mali+Edu"}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/600x400?text=Mali+Edu";
                        }}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    {post.type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                <Play className="w-5 h-5 text-secret-wax ml-1" fill="currentColor" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    <div className="text-xs font-sans font-semibold text-secret-wax uppercase tracking-wide mb-2">
                        {post.category}
                    </div>
                    <h3 className="font-sans font-bold text-lg text-secret-ink mb-2 line-clamp-2 leading-tight">
                        {post.title}
                    </h3>
                    <p className="font-sans text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                    </p>
                </div>
            </Link>
        </motion.article>
    );
};

export default PostDetail;
