import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, ArrowRight, Facebook, Twitter, Link as LinkIcon } from 'lucide-react';
import SEO from '../components/SEO';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { getYouTubeEmbedUrl } from '../utils/videoUtils';
import BlockContentRenderer from '../components/BlockContentRenderer';

const NewsDetail = () => {
    const [notFound, setNotFound] = useState(false);
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentPosts, setRecentPosts] = useState([]);

    // Fetch post by slug and recent posts
    useEffect(() => {
        const fetchPostAndRecents = async () => {
            try {
                // 1. Fetch Main Post
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

                // Helper function to format date
                const formatDate = (timestamp) => {
                    if (!timestamp) return new Date().toLocaleDateString('vi-VN');
                    // If it's a Firestore Timestamp object
                    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString('vi-VN');
                    // If it's a number (milliseconds)
                    if (typeof timestamp === 'number') return new Date(timestamp).toLocaleDateString('vi-VN');
                    // If it's already a string
                    if (typeof timestamp === 'string') return timestamp;
                    return new Date().toLocaleDateString('vi-VN');
                };

                const postData = {
                    id: postSnapshot.docs[0].id,
                    ...data,
                    createdAt: formatDate(data.createdAt)
                };
                setPost(postData);

                // 2. Fetch Recent Posts (Tin nổi bật) for Sidebar
                const recentQuery = query(
                    collection(db, 'posts'),
                    where('isPublished', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(15) // Fetch more for both sidebar and bottom section
                );
                const recentSnapshot = await getDocs(recentQuery);
                const recentData = recentSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: formatDate(doc.data().createdAt)
                    }))
                    .filter(p => p.id !== postSnapshot.docs[0].id)
                    .slice(0, 10); // Keep top 10 relevant posts
                setRecentPosts(recentData);

            } catch (error) {
                console.error('Error fetching data:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPostAndRecents();
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) {
        return (
            <div className="bg-white min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin mb-4"></div>
                <p className="font-sans text-lg text-gray-500 animate-pulse">Đang tải bài viết...</p>
            </div>
        );
    }

    if (notFound || !post) {
        return <Navigate to="/tin-tuc" replace />;
    }

    return (
        <div className="bg-white font-sans text-gray-900">
            <SEO
                title={post.title}
                description={post.excerpt}
                image={post.thumbnailUrl}
                url={`/tin-tuc/${slug}`}
                type="article"
            />

            {/* Breadcrumb */}
            <div className="border-b border-gray-100">
                <div className="container max-w-7xl mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Link to="/" className="hover:text-secret-wax transition-colors">Trang chủ</Link>
                        <span>/</span>
                        <Link to="/tin-tuc" className="hover:text-secret-wax transition-colors">Tin tức</Link>
                        <span>/</span>
                        <span className="text-gray-900 truncate max-w-[200px] md:max-w-md">{post.title}</span>
                    </nav>
                </div>
            </div>

            <div className="container max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-12 gap-8 lg:gap-12">
                    {/* LEFT: MAIN CONTENT (8 Cols) */}
                    <div className="col-span-12 lg:col-span-8">
                        <article>
                            {/* Header - Magazine Style */}
                            <header className="mb-10">
                                {/* Category Label */}
                                <Link to="/tin-tuc" className="inline-block mb-4">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                                        {post.category || 'Tin tức'}
                                    </span>
                                </Link>

                                {/* Title */}
                                <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight uppercase">
                                    {post.title}
                                </h1>

                                {/* Excerpt - Italic */}
                                {post.excerpt && (
                                    <p className="text-gray-600 text-lg md:text-xl italic mb-8 leading-relaxed">
                                        {post.excerpt}
                                    </p>
                                )}

                                {/* Meta Line: Author + Date | Share */}
                                <div className="flex flex-wrap items-center justify-between border-t border-b border-gray-200 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="font-medium">Người viết bài:</span>
                                        <span className="font-semibold text-gray-900">{post.author || 'Mong Coaching'}</span>
                                        <span className="text-gray-400 mx-2">•</span>
                                        <span>{post.createdAt}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span>chia sẻ</span>
                                        <button
                                            onClick={() => {
                                                const width = 600; const height = 600;
                                                const left = (window.innerWidth - width) / 2; const top = (window.innerHeight - height) / 2;
                                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, 'fb', `width=${width},height=${height},top=${top},left=${left}`);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 transition-colors"
                                            title="Chia sẻ lên Facebook"
                                        >
                                            <Facebook size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const width = 600; const height = 400;
                                                const left = (window.innerWidth - width) / 2; const top = (window.innerHeight - height) / 2;
                                                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, 'tw', `width=${width},height=${height},top=${top},left=${left}`);
                                            }}
                                            className="text-sky-500 hover:text-sky-600 transition-colors"
                                            title="Chia sẻ lên Twitter"
                                        >
                                            <Twitter size={18} />
                                        </button>
                                    </div>
                                </div>
                            </header>

                            {/* Featured Image / Video */}
                            <div className="mb-10 rounded-xl overflow-hidden shadow-sm">
                                {post.type === 'video' && post.videoUrl ? (
                                    <div className="aspect-video w-full">
                                        <iframe
                                            src={getYouTubeEmbedUrl(post.videoUrl)}
                                            title={post.title}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <img
                                        src={post.thumbnailUrl || "https://placehold.co/800x500?text=Mali+Edu"}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://placehold.co/800x500?text=Mali+Edu";
                                        }}
                                        alt={post.title}
                                        className="w-full h-auto object-cover"
                                    />
                                )}
                                {post.excerpt && (
                                    <p className="mt-3 text-sm text-gray-500 italic text-center px-4">
                                        {post.excerpt}
                                    </p>
                                )}
                            </div>

                            {/* Main Body - Harper's Bazaar Typography */}
                            <div className="bazaar-typography">
                                {post.isBlockMode && post.content ? (
                                    // Block-based content from Editor.js
                                    (() => {
                                        try {
                                            const parsedContent = JSON.parse(post.content);
                                            // Add dropcap class to first paragraph block
                                            if (parsedContent.blocks && parsedContent.blocks.length > 0) {
                                                const firstParagraphIndex = parsedContent.blocks.findIndex(b => b.type === 'paragraph');
                                                if (firstParagraphIndex !== -1) {
                                                    parsedContent.blocks[firstParagraphIndex].data.className = 'dropcap';
                                                }
                                            }
                                            return <BlockContentRenderer data={parsedContent} />;
                                        } catch (e) {
                                            console.error('Failed to parse block content:', e);
                                            return <p className="text-red-500">Không thể hiển thị nội dung</p>;
                                        }
                                    })()
                                ) : (
                                    // HTML content from rich text editor
                                    <div
                                        className="bazaar-content"
                                        dangerouslySetInnerHTML={{
                                            __html: post.content
                                                // Add dropcap class to first <p> tag
                                                .replace(/<p>/, '<p class="dropcap">')
                                        }}
                                    />
                                )}
                            </div>

                            {/* Post Footer */}
                            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {['Tư duy', 'Tài chính', 'Hạnh phúc'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 cursor-pointer transition-colors">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button
                                        onClick={() => {
                                            const width = 600;
                                            const height = 600;
                                            const left = (window.innerWidth - width) / 2;
                                            const top = (window.innerHeight - height) / 2;
                                            window.open(
                                                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                                                'facebook-share',
                                                `width=${width},height=${height},top=${top},left=${left}`
                                            );
                                        }}
                                        className="text-blue-600 hover:text-blue-700 transition-colors p-1"
                                        title="Chia sẻ lên Facebook"
                                    >
                                        <Facebook size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const width = 600;
                                            const height = 400;
                                            const left = (window.innerWidth - width) / 2;
                                            const top = (window.innerHeight - height) / 2;
                                            window.open(
                                                `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`,
                                                'twitter-share',
                                                `width=${width},height=${height},top=${top},left=${left}`
                                            );
                                        }}
                                        className="text-sky-500 hover:text-sky-600 transition-colors p-1"
                                        title="Chia sẻ lên Twitter"
                                    >
                                        <Twitter size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Đã sao chép liên kết!');
                                        }}
                                        className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                                        title="Sao chép liên kết"
                                    >
                                        <LinkIcon size={20} />
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* RIGHT: SIDEBAR (4 Cols) */}
                    <div className="col-span-12 lg:col-span-4 pl-0 lg:pl-10 relative hidden lg:block">
                        <div className="sticky top-28 space-y-12">
                            {/* 1. Tin Nổi Bật */}
                            <div>
                                <h3 className="flex items-center gap-4 text-xl font-serif font-bold text-gray-900 mb-8">
                                    <span className="w-8 h-[2px] bg-red-600"></span>
                                    Tin Nổi Bật
                                </h3>
                                <div className="space-y-6">
                                    {recentPosts.slice(0, 5).map(p => (
                                        <Link key={p.id} to={`/tin-tuc/${p.slug}`} className="group flex gap-4 items-start">
                                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                                <img
                                                    src={p.thumbnailUrl}
                                                    alt={p.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                    <Clock size={12} />
                                                    {p.createdAt}
                                                </div>
                                                <h4 className="font-medium text-gray-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                                                    {p.title}
                                                </h4>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Banner Quang Cao */}
                            <div className="rounded-xl overflow-hidden shadow-lg relative group cursor-pointer">
                                <img
                                    src="https://res.cloudinary.com/dstukyjzd/image/upload/v1/mali-edu/banner-ads-vertical-placeholder"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/400x600/8B2E2E/FFF?text=KHOA+HOC+MALI+EDU&font=playfair";
                                    }}
                                    alt="Quảng cáo khóa học"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">Khóa học Online</span>
                                    <h3 className="text-white font-serif text-2xl font-bold mb-4">Làm Chủ Tư Duy Tài Chính</h3>
                                    <button className="bg-white text-secret-wax font-bold py-2 px-4 rounded-full w-full hover:bg-secret-paper transition-colors">
                                        Đăng ký ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetail;
