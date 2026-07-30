import React, { useEffect, useMemo, useState } from 'react';
import '../styles/article-rich-text.css';
import { useParams, Link, Navigate, useSearchParams } from 'react-router';
import { Calendar, User, Clock, ArrowRight, Facebook, Twitter, Link as LinkIcon, Eye, MessageCircle, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { auth, crmFirestore, db } from '../firebase';
import { getYouTubeEmbedUrl } from '../utils/videoUtils';
import BlockContentRenderer from '../components/BlockContentRenderer';
import { MALI_LOGO_URL } from '../constants/brandAssets.js';
import { firestoreValueToDate, formatArticleDate, getReadingTime, isPostPubliclyVisible, prepareArticleContent } from '../utils/articleContent';
import { isAdminUser, isSuperAdminEmail } from '../utils/adminAccess';

const getAdminPreviewAccess = () => new Promise((resolve) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        unsubscribe();
        if (!currentUser) {
            resolve(false);
            return;
        }
        if (isSuperAdminEmail(currentUser.email)) {
            resolve(true);
            return;
        }
        try {
            const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
            resolve(isAdminUser({ email: currentUser.email, role: userSnapshot.data()?.role }));
        } catch (error) {
            console.error('Error checking preview access:', error);
            resolve(false);
        }
    });
});

const NewsDetail = () => {
    const [notFound, setNotFound] = useState(false);
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const isPreviewRequested = searchParams.get('preview') === 'true';
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentPosts, setRecentPosts] = useState([]);
    const [approvedFeedback, setApprovedFeedback] = useState([]);
    const [feedbackName, setFeedbackName] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackState, setFeedbackState] = useState({ type: '', message: '' });
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterState, setNewsletterState] = useState({ type: '', message: '' });
    const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
    const [sidebarLanding, setSidebarLanding] = useState(null);
    const preparedContent = useMemo(() => prepareArticleContent(post), [post]);

    useEffect(() => {
        let isCancelled = false;

        const fetchNewsSidebarBanners = async () => {
            try {
                const sidebarQuery = query(
                    collection(db, 'banners'),
                    where('position', '==', 'news_sidebar'),
                );
                const [sidebarSnapshot, configSnapshot] = await Promise.all([
                    getDocs(sidebarQuery),
                    getDoc(doc(crmFirestore, 'public_settings', 'sidebar_landing_config')),
                ]);
                const enabledPaths = configSnapshot.exists()
                    ? configSnapshot.data()?.enabledPaths
                    : [];
                const enabledPathSet = new Set(
                    Array.isArray(enabledPaths)
                        ? enabledPaths.map((path) => String(path || '').trim()).filter(Boolean)
                        : [],
                );
                const configuredBanners = sidebarSnapshot.docs
                    .map((bannerDoc) => {
                        const data = bannerDoc.data();
                        return {
                            id: bannerDoc.id,
                            title: data.title || 'Chương trình Mali Edu',
                            subtitle: data.subtitle || '',
                            path: data.ctaLink || '',
                            ctaText: data.ctaText || 'Đăng ký ngay',
                            image: data.imageUrl || data.mobileImageUrl || '',
                            active: data.active,
                        };
                    })
                    .filter((banner) => (
                        banner.active !== false
                        && banner.image
                        && banner.path
                        && enabledPathSet.has(banner.path)
                    ));

                if (!isCancelled) {
                    setSidebarLanding(
                        configuredBanners.length > 0
                            ? configuredBanners[Math.floor(Math.random() * configuredBanners.length)]
                            : null,
                    );
                }
            } catch (error) {
                console.error('Không thể tải banner sidebar tin tức:', error);
            }
        };

        fetchNewsSidebarBanners();
        return () => {
            isCancelled = true;
        };
    }, []);

    // Fetch post by slug and recent posts
    useEffect(() => {
        const fetchPostAndRecents = async () => {
            try {
                setLoading(true);
                setNotFound(false);
                setPost(null);

                // 1. Fetch Main Post
                const canPreviewDraft = isPreviewRequested || await getAdminPreviewAccess();
                const postConstraints = [where('slug', '==', slug)];
                if (!canPreviewDraft) postConstraints.push(where('isPublished', '==', true));
                postConstraints.push(limit(1));
                const postQuery = query(collection(db, 'posts'), ...postConstraints);
                const postSnapshot = await getDocs(postQuery);

                if (postSnapshot.empty) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const data = postSnapshot.docs[0].data();

                if (!canPreviewDraft && !isPostPubliclyVisible(data)) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                // Helper function to format date
                const formatDate = (timestamp) => {
                    return formatArticleDate(timestamp) || new Date().toLocaleDateString('vi-VN');
                };

                // Helper to get ISO string for JSON-LD
                const toISOString = (timestamp) => {
                    return firestoreValueToDate(timestamp)?.toISOString() || new Date().toISOString();
                };

                const postData = {
                    id: postSnapshot.docs[0].id,
                    ...data,
                    createdAt: formatDate(data.createdAt),
                    createdAtISO: toISOString(data.createdAt),
                    updatedAtISO: toISOString(data.updatedAt || data.createdAt),
                    readingTime: getReadingTime(data.content, data.isBlockMode),
                };

                const viewSessionKey = `viewed-news-${postSnapshot.docs[0].id}`;
                if (isPostPubliclyVisible(data) && !isPreviewRequested && !sessionStorage.getItem(viewSessionKey)) {
                    sessionStorage.setItem(viewSessionKey, '1');
                    const viewerStorageKey = 'mali-news-viewer-id';
                    let viewerId = sessionStorage.getItem(viewerStorageKey);
                    if (!viewerId) {
                        viewerId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                        sessionStorage.setItem(viewerStorageKey, viewerId);
                    }
                    fetch('/api/post-view', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ postId: postSnapshot.docs[0].id, viewerId }),
                    })
                        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`View API ${response.status}`)))
                        .then((result) => setPost((current) => current ? { ...current, views: result.views } : current))
                        .catch((error) => console.error('Error updating post views:', error));
                }
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

                try {
                    const feedbackQuery = query(
                        collection(db, 'post_feedback'),
                        where('postId', '==', postSnapshot.docs[0].id),
                        where('isApproved', '==', true),
                        orderBy('createdAt', 'desc'),
                        limit(20)
                    );
                    const feedbackSnapshot = await getDocs(feedbackQuery);
                    setApprovedFeedback(feedbackSnapshot.docs.map((feedbackDoc) => ({
                        id: feedbackDoc.id,
                        ...feedbackDoc.data(),
                        createdAtLabel: formatDate(feedbackDoc.data().createdAt),
                    })));
                } catch (feedbackError) {
                    console.error('Error fetching approved feedback:', feedbackError);
                    setApprovedFeedback([]);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPostAndRecents();
        window.scrollTo(0, 0);
    }, [isPreviewRequested, slug]);

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

    const seoTitle = post.seoTitle?.trim() || post.title;
    const seoDescription = post.seoDescription?.trim() || post.excerpt || '';
    const seoKeywords = post.seoKeywords?.trim() || '';
    const relatedPosts = recentPosts.slice(0, 3);

    const handleFeedbackSubmit = async (event) => {
        event.preventDefault();
        if (!feedbackMessage.trim() || feedbackMessage.trim().length < 20) {
            setFeedbackState({ type: 'error', message: 'Nội dung chia sẻ cần ít nhất 20 ký tự.' });
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            const response = await fetch('/api/post-feedback', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    name: feedbackName.trim() || 'Ẩn danh',
                    message: feedbackMessage.trim(),
                }),
            });
            if (!response.ok) throw new Error(`Feedback API error (${response.status})`);
            setFeedbackState({ type: 'success', message: 'Cảm ơn bạn đã chia sẻ. Nội dung sẽ hiển thị sau khi được duyệt.' });
            setFeedbackName('');
            setFeedbackMessage('');
        } catch (error) {
            console.error('Error saving feedback:', error);
            setFeedbackState({ type: 'error', message: 'Gửi chia sẻ thất bại, vui lòng thử lại.' });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleNewsletterSubmit = async (event) => {
        event.preventDefault();
        const email = newsletterEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setNewsletterState({ type: 'error', message: 'Vui lòng nhập email hợp lệ.' });
            return;
        }

        setIsSubmittingNewsletter(true);
        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, sourceSlug: slug }),
            });
            if (!response.ok) throw new Error(`Newsletter API error (${response.status})`);
            setNewsletterState({ type: 'success', message: 'Đăng ký nhận bản tin thành công.' });
            setNewsletterEmail('');
        } catch (error) {
            console.error('Error saving newsletter subscriber:', error);
            setNewsletterState({ type: 'error', message: 'Không thể đăng ký lúc này, vui lòng thử lại.' });
        } finally {
            setIsSubmittingNewsletter(false);
        }
    };

    return (
        <div className="bg-white font-sans text-gray-900">
            <SEO
                title={seoTitle}
                description={seoDescription}
                image={post.thumbnailUrl}
                url={`/tin-tuc/${slug}`}
                type="article"
                keywords={seoKeywords}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "NewsArticle",
                        "headline": seoTitle,
                        "description": seoDescription,
                        ...(seoKeywords ? { "keywords": seoKeywords } : {}),
                        "image": post.thumbnailUrl
                            ? [post.thumbnailUrl]
                            : ["https://maliedu.vn/og-default.jpg"],
                        "datePublished": post.createdAtISO || post.createdAt || new Date().toISOString(),
                        "dateModified": post.updatedAtISO || post.createdAtISO || post.createdAt || new Date().toISOString(),
                        "author": {
                            "@type": "Person",
                            "name": post.author || "Mali Edu"
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Mali Edu",
                            "logo": {
                                "@type": "ImageObject",
                                "url": MALI_LOGO_URL
                            }
                        },
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": `https://maliedu.vn/tin-tuc/${slug}`
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": "https://maliedu.vn/" },
                            { "@type": "ListItem", "position": 2, "name": "Tin tức", "item": "https://maliedu.vn/tin-tuc" },
                            { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://maliedu.vn/tin-tuc/${slug}` }
                        ]
                    }
                ]}
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

            <div className="container max-w-7xl mx-auto px-4 py-6 md:py-10">
                <div className="grid grid-cols-12 gap-8 lg:gap-12">
                    {/* LEFT: MAIN CONTENT (8 Cols) */}
                    <div className="col-span-12 lg:col-span-8">
                        <article className="mx-auto max-w-3xl">
                            {/* Header - Magazine Style */}
                            <header className="mb-6 md:mb-10">
                                {/* Category Label */}
                                <Link to="/tin-tuc" className="mb-2 inline-block md:mb-4">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                                        {post.category || 'Tin tức'}
                                    </span>
                                </Link>

                                {/* Title */}
                                <h1 className="mb-3 w-full max-w-none text-2xl font-bold leading-snug tracking-tight text-gray-900 md:mb-6 md:text-4xl md:leading-[1.4] lg:text-[42px]">
                                    {post.title}
                                </h1>

                                {/* Excerpt - Italic */}
                                {post.excerpt && (
                                    <p className="mb-4 text-base italic leading-relaxed text-gray-600 md:mb-8 md:text-xl">
                                        {post.excerpt}
                                    </p>
                                )}

                                {/* Meta Line: Author + Date | Share */}
                                <div className="flex flex-wrap items-center justify-between border-t border-b border-gray-200 py-4">
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                        <span className="font-medium">Người viết bài:</span>
                                        <span className="font-semibold text-gray-900">{post.author || 'Mong Coaching'}</span>
                                        <span className="text-gray-400 mx-2">•</span>
                                        <span>{post.createdAt}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="inline-flex items-center gap-1"><Clock size={15} />{post.readingTime} phút đọc</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="inline-flex items-center gap-1"><Eye size={15} />{Number(post.views || 0).toLocaleString('vi-VN')} lượt xem</span>
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

                            {preparedContent.toc.length > 0 && (
                                <MobileTableOfContents items={preparedContent.toc} />
                            )}

                            {/* Featured Image / Video */}
                            <div className="mb-6 overflow-hidden rounded-xl shadow-sm md:mb-10">
                                {post.videoUrl ? (
                                    <div className="aspect-video w-full bg-black">
                                        <iframe
                                            src={getYouTubeEmbedUrl(post.videoUrl)}
                                            title={`${post.title} – video bài viết`}
                                            className="w-full h-full"
                                            loading="lazy"
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
                                        alt={post.thumbnailAlt || post.title}
                                        loading="eager"
                                        width="800"
                                        height="500"
                                        className="w-full h-auto object-cover"
                                    />
                                )}
                            </div>

                            {/* Main Body - Harper's Bazaar Typography */}
                            <div className="bazaar-typography">
                                {post.isBlockMode && preparedContent.blockData ? (
                                    <BlockContentRenderer data={preparedContent.blockData} />
                                ) : (
                                    <div
                                        className="bazaar-content"
                                        dangerouslySetInnerHTML={{ __html: preparedContent.html }}
                                    />
                                )}
                            </div>

                            <section className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                                <h2 className="text-2xl font-bold text-gray-900">Chia sẻ trải nghiệm của bạn</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Bạn đã áp dụng nội dung trong bài này chưa? Để lại trải nghiệm để đội ngũ và cộng đồng cùng tham khảo.
                                </p>
                                <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-3">
                                    <input
                                        type="text"
                                        value={feedbackName}
                                        onChange={(event) => setFeedbackName(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                        placeholder="Tên của bạn (không bắt buộc)"
                                    />
                                    <textarea
                                        value={feedbackMessage}
                                        onChange={(event) => setFeedbackMessage(event.target.value)}
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                        placeholder="Viết cảm nhận của bạn tại đây..."
                                        required
                                    />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmittingFeedback}
                                            className="rounded-lg bg-secret-wax px-5 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isSubmittingFeedback ? 'Đang gửi...' : 'Gửi chia sẻ'}
                                        </button>
                                        <Link
                                            to="/lien-he"
                                            className="text-sm font-medium text-secret-wax hover:text-secret-ink"
                                        >
                                            Cần tư vấn riêng? Liên hệ đội ngũ
                                        </Link>
                                    </div>
                                    {feedbackState.message && (
                                        <p className={`text-sm ${feedbackState.type === 'success' ? 'text-green-600' : 'text-red-600'}`} aria-live="polite">
                                            {feedbackState.message}
                                        </p>
                                    )}
                                </form>
                            </section>

                            {approvedFeedback.length > 0 && (
                                <section className="mt-10" aria-labelledby="reader-feedback-heading">
                                    <div className="mb-5 flex items-center gap-3">
                                        <MessageCircle className="h-6 w-6 text-secret-wax" aria-hidden="true" />
                                        <h2 id="reader-feedback-heading" className="text-2xl font-bold text-gray-900">Chia sẻ từ độc giả</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {approvedFeedback.map((feedback) => (
                                            <article key={feedback.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="font-semibold text-gray-900">{feedback.name || 'Ẩn danh'}</p>
                                                    <time className="text-xs text-gray-500">{feedback.createdAtLabel}</time>
                                                </div>
                                                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">{feedback.message}</p>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}

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

                            <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-bold text-gray-900">Nhận bản tin mới nhất</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Đăng ký để nhận bài viết mới, tài liệu thực hành và thông báo sự kiện mỗi tuần.
                                </p>
                                <form onSubmit={handleNewsletterSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <input
                                        type="email"
                                        value={newsletterEmail}
                                        onChange={(event) => setNewsletterEmail(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                        placeholder="email@cuaban.com"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmittingNewsletter}
                                        className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmittingNewsletter ? 'Đang đăng ký...' : 'Đăng ký'}
                                    </button>
                                </form>
                                {newsletterState.message && (
                                    <p className={`mt-3 text-sm ${newsletterState.type === 'success' ? 'text-green-600' : 'text-red-600'}`} aria-live="polite">
                                        {newsletterState.message}
                                    </p>
                                )}
                            </section>

                            {relatedPosts.length > 0 && (
                                <section className="mt-10">
                                    <h2 className="mb-5 text-2xl font-bold text-gray-900">Đọc tiếp bài liên quan</h2>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {relatedPosts.map((relatedPost) => (
                                            <Link
                                                key={relatedPost.id}
                                                to={`/tin-tuc/${relatedPost.slug}`}
                                                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                            >
                                                <img
                                                    src={relatedPost.thumbnailUrl || 'https://placehold.co/600x400?text=Mali+Edu'}
                                                    alt={relatedPost.thumbnailAlt || relatedPost.title}
                                                    className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                                <div className="p-4">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        {relatedPost.category || 'Tin tức'}
                                                    </p>
                                                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-secret-wax">
                                                        {relatedPost.title}
                                                    </h3>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </article>
                    </div>

                    {/* RIGHT: SIDEBAR (4 Cols) */}
                    <div className="col-span-12 lg:col-span-4 pl-0 lg:pl-10 relative hidden lg:block">
                        <div className="sticky top-4 space-y-6">
                            {preparedContent.toc.length > 0 && <TableOfContents items={preparedContent.toc} />}

                            {/* 1. Tin Nổi Bật */}
                            <div>
                                <h3 className="flex items-center gap-4 text-xl font-serif font-bold text-gray-900 mb-8">
                                    <span className="w-8 h-[2px] bg-red-600"></span>
                                    Tin Nổi Bật
                                </h3>
                                <div className="space-y-4">
                                    {recentPosts.slice(0, 5).map(p => (
                                        <Link key={p.id} to={`/tin-tuc/${p.slug}`} className="group flex gap-4 items-start">
                                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                                                <img
                                                    src={p.thumbnailUrl}
                                                    alt={p.title}
                                                    loading="lazy"
                                                    width="96"
                                                    height="96"
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
                            {sidebarLanding && (
                                <div className="relative overflow-hidden rounded-xl bg-slate-900 shadow-lg group">
                                    <img
                                        src={sidebarLanding.image}
                                        onError={() => setSidebarLanding(null)}
                                        alt={sidebarLanding.title}
                                        loading="lazy"
                                        width="400"
                                        height="600"
                                        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/25 to-transparent p-6">
                                        <span className="mb-2 text-xs font-bold uppercase tracking-widest text-white/80">Chương trình nổi bật</span>
                                        <h3 className="mb-2 text-2xl font-bold text-white">{sidebarLanding.title}</h3>
                                        <p className="mb-4 text-sm leading-relaxed text-white/85">{sidebarLanding.subtitle}</p>
                                        <Link
                                            to={sidebarLanding.path}
                                            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-secret-wax transition-colors hover:bg-secret-paper"
                                            aria-label={`Đăng ký ${sidebarLanding.title}`}
                                        >
                                            {sidebarLanding.ctaText || 'Đăng ký ngay'}
                                            <ArrowRight size={16} aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TableOfContents = ({ items }) => (
    <nav className="rounded-2xl border border-gray-200 bg-gray-50 p-5" aria-label="Mục lục bài viết">
        <h2 className="mb-4 font-serif text-xl font-bold text-gray-900">Trong bài viết này</h2>
        <ol className="space-y-2 border-l-2 border-secret-wax/20 pl-4">
            {items.map((item) => (
                <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
                    <a href={`#${item.id}`} className="block text-sm leading-snug text-gray-600 transition hover:text-secret-wax">
                        {item.text}
                    </a>
                </li>
            ))}
        </ol>
    </nav>
);

const MobileTableOfContents = ({ items }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-5 lg:hidden">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <button
                    type="button"
                    onClick={() => setIsOpen((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    aria-expanded={isOpen}
                    aria-controls="mobile-article-toc"
                >
                    <span className="text-sm font-bold text-gray-900">Trong bài viết này</span>
                    <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </button>

                {isOpen && (
                    <nav
                        id="mobile-article-toc"
                        className="border-t border-gray-200 px-4 py-3"
                        aria-label="Mục lục bài viết trên di động"
                    >
                        <ol className="space-y-2 border-l-2 border-secret-wax/20 pl-3">
                            {items.map((item) => (
                                <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
                                    <a
                                        href={`#${item.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="block text-sm leading-snug text-gray-600 transition hover:text-secret-wax"
                                    >
                                        {item.text}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default NewsDetail;
