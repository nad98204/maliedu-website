import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Play } from 'lucide-react';

const PostSidebar = ({ currentCategory, currentPostId }) => {
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [latestPosts, setLatestPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSidebarPosts = async () => {
            setLoading(true);
            try {
                // Fetch a batch of recent posts to process client-side
                // This avoids "Missing Index" errors from complex Firestore queries
                const postsQuery = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(postsQuery);
                const allPosts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Handle both Firestore Timestamp and Number/String dates
                    createdAtFormatted: doc.data().createdAt?.toDate
                        ? doc.data().createdAt.toDate().toLocaleDateString('vi-VN')
                        : (new Date(doc.data().createdAt).toLocaleDateString('vi-VN') !== 'Invalid Date'
                            ? new Date(doc.data().createdAt).toLocaleDateString('vi-VN')
                            : 'Mới cập nhật')
                }));

                // Filter published posts
                const publishedPosts = allPosts.filter(p => p.isPublished === true || p.isPublished === 'true');

                // 1. Get Related Posts
                const related = currentCategory
                    ? publishedPosts.filter(p => p.category === currentCategory && p.id !== currentPostId).slice(0, 3)
                    : [];

                // 2. Get Latest Posts (excluding current and those in related)
                const latest = publishedPosts
                    .filter(p => p.id !== currentPostId && !related.find(r => r.id === p.id))
                    .slice(0, 3);

                setRelatedPosts(related);
                setLatestPosts(latest);
            } catch (error) {
                console.error("Error fetching sidebar posts:", error);
                // Fallback if basic query fails (e.g. missing createdAt index), try getting any posts
                try {
                    const fallbackQuery = query(collection(db, 'posts'), limit(10));
                    const fallbackSnapshot = await getDocs(fallbackQuery);
                    const fallbackPosts = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setLatestPosts(fallbackPosts.filter(p => p.id !== currentPostId).slice(0, 3));
                } catch (e) {
                    console.error("Fallback failed", e);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarPosts();
    }, [currentCategory, currentPostId]);

    if (loading) {
        return (
            <aside className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/2 mb-6"></div>
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col gap-3">
                                <div className="w-full h-32 bg-slate-200 rounded-lg"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="space-y-10">
            {/* Box 1: Latest Posts */}
            {latestPosts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="font-serif text-lg font-bold text-secret-ink mb-5 pb-2 border-b border-secret-wax/20">
                        Bài viết mới nhất
                    </h3>
                    <div className="space-y-6">
                        {latestPosts.map(post => (
                            <SidebarPostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            )}

            {/* Box 2: You may also like (Related) */}
            {relatedPosts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="font-serif text-lg font-bold text-secret-ink mb-5 pb-2 border-b border-secret-wax/20">
                        Có thể bạn quan tâm
                    </h3>
                    <div className="space-y-6">
                        {relatedPosts.map(post => (
                            <SidebarPostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};

// Mini Card Component
const SidebarPostCard = ({ post }) => (
    <Link to={`/tin-tuc/${post.slug}`} className="group flex flex-col gap-2">
        {/* Thumbnail */}
        <div className="relative w-full h-32 shrink-0 rounded-lg overflow-hidden">
            <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {post.type === 'video' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" fill="currentColor" />
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 w-full">
            <h4 className="font-sans text-sm font-bold text-slate-800 leading-snug group-hover:text-secret-wax transition-colors line-clamp-2 mb-1">
                {post.title}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {post.excerpt}
            </p>
        </div>
    </Link>
);

export default PostSidebar;
