import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, ListFilter, Play, Search, Star } from 'lucide-react';
import { Link } from 'react-router';
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';
import { formatArticlePublishedDate, getReadingTime, isPostPubliclyVisible } from '../utils/articleContent';
import { getVideoEmbedData } from '../utils/videoUtils';

const PAGE_SIZE = 9;
const PLACEHOLDER_IMAGE = 'https://placehold.co/1200x800?text=Mali+Edu';

const TYPE_FILTERS = [
    { id: 'all', label: 'Tất cả định dạng' },
    { id: 'article', label: 'Bài viết' },
    { id: 'video', label: 'Video' },
    { id: 'case-study', label: 'Câu chuyện thành công' },
];

const mapPost = (postDoc) => {
    const data = postDoc.data();
    return {
        id: postDoc.id,
        ...data,
        publishedAtLabel: formatArticlePublishedDate(data),
        readingTime: getReadingTime(data.content, data.isBlockMode),
    };
};

const News = () => {
    const [activeType, setActiveType] = useState('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [posts, setPosts] = useState([]);
    const [featuredPosts, setFeaturedPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [lastPostDoc, setLastPostDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState('');

    const fetchPostPage = useCallback(async ({ cursor = null, replace = false } = {}) => {
        replace ? setLoading(true) : setLoadingMore(true);
        setLoadError('');
        try {
            const constraints = [where('isPublished', '==', true)];
            if (activeType !== 'all') constraints.push(where('type', '==', activeType));
            if (activeCategory !== 'all') constraints.push(where('category', '==', activeCategory));
            constraints.push(orderBy('createdAt', 'desc'));
            if (cursor) constraints.push(startAfter(cursor));
            constraints.push(limit(PAGE_SIZE));

            const snapshot = await getDocs(query(collection(db, 'posts'), ...constraints));
            const page = snapshot.docs.map(mapPost).filter((post) => isPostPubliclyVisible(post));
            setPosts((current) => replace ? page : [...current, ...page.filter((post) => !current.some((item) => item.id === post.id))]);
            setLastPostDoc(snapshot.docs.at(-1) || null);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error('Error fetching news:', error);
            setLoadError('Không thể tải bài viết lúc này. Vui lòng thử lại sau.');
            if (replace) setPosts([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeCategory, activeType]);

    useEffect(() => {
        setPosts([]);
        setLastPostDoc(null);
        fetchPostPage({ replace: true });
    }, [fetchPostPage]);

    useEffect(() => {
        const fetchFeaturedAndCategories = async () => {
            const featuredRequest = getDocs(query(
                collection(db, 'posts'),
                where('isPublished', '==', true),
                where('isFeatured', '==', true),
                orderBy('createdAt', 'desc'),
                limit(1)
            ));
            const categoryRequest = getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
            const [featuredResult, categoryResult] = await Promise.allSettled([featuredRequest, categoryRequest]);

            if (featuredResult.status === 'fulfilled') {
                setFeaturedPosts(featuredResult.value.docs.map(mapPost).filter((post) => isPostPubliclyVisible(post)));
            } else {
                console.error('Error fetching featured posts:', featuredResult.reason);
            }

            if (categoryResult.status === 'fulfilled') {
                setCategories(categoryResult.value.docs.map((item) => item.data().name?.trim()).filter(Boolean));
            } else {
                console.error('Error fetching categories:', categoryResult.reason);
            }
        };

        fetchFeaturedAndCategories();
    }, []);

    const availableCategories = useMemo(() => (
        [...new Set([...categories, ...posts.map((post) => post.category).filter(Boolean)])]
    ), [categories, posts]);

    const visibleFeaturedPosts = useMemo(() => {
        if (activeType !== 'all' || activeCategory !== 'all' || searchQuery.trim()) return [];
            return featuredPosts.slice(0, 1);
    }, [activeCategory, activeType, featuredPosts, searchQuery]);

    const visiblePosts = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const featuredIds = new Set(visibleFeaturedPosts.map((post) => post.id));
        return posts.filter((post) => {
            if (featuredIds.has(post.id)) return false;
            if (!normalizedSearch) return true;
            return [post.title, post.excerpt, post.category, post.author]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalizedSearch));
        });
    }, [posts, searchQuery, visibleFeaturedPosts]);

    return (
        <div className="overflow-hidden bg-white font-sans">
            <SEO
                title="Tin tức & Sự kiện - Mali Edu"
                description="Cập nhật những tin tức mới nhất, kiến thức chuyển hóa và câu chuyện thành công tại Mali Edu."
                url="/tin-tuc"
            />

            <header className="bg-secret-paper py-6 md:pb-14 md:pt-28">
                <div className="container mx-auto max-w-6xl px-4 text-center">
                    <h1 className="sr-only font-serif font-bold text-secret-ink md:not-sr-only md:mb-4 md:text-6xl">Góc Nhìn & Chuyển Hóa</h1>
                    <div className="relative mx-auto max-w-md md:max-w-xl">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:left-5 md:h-5 md:w-5" aria-hidden="true" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Tìm trong các bài đã tải…"
                            className="w-full rounded-full border-2 border-secret-gold/30 bg-white py-3 pl-11 pr-4 text-sm text-secret-ink shadow-md outline-none transition focus:border-secret-wax focus:shadow-lg md:py-4 md:pl-14 md:pr-6 md:text-base"
                        />
                    </div>
                </div>
            </header>

            {visibleFeaturedPosts.length > 0 && <FeaturedSpotlight post={visibleFeaturedPosts[0]} />}

            <section className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
                <div className="container mx-auto max-w-7xl px-4 py-3">
                    <div className="grid grid-cols-2 gap-2 md:hidden">
                        <label className="relative min-w-0">
                            <span className="sr-only">Lọc theo danh mục</span>
                            <select
                                value={activeCategory}
                                onChange={(event) => setActiveCategory(event.target.value)}
                                className="h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 text-sm font-semibold text-secret-ink outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20"
                            >
                                <option value="all">Tất cả danh mục</option>
                                {availableCategories.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" aria-hidden="true">▼</span>
                        </label>

                        <label className="relative min-w-0">
                            <span className="sr-only">Lọc theo định dạng</span>
                            <select
                                value={activeType}
                                onChange={(event) => setActiveType(event.target.value)}
                                className="h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 text-sm font-semibold text-secret-ink outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20"
                            >
                                {TYPE_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" aria-hidden="true">▼</span>
                        </label>
                    </div>

                    <div className="hidden items-center justify-between gap-3 md:flex">
                        <div className="min-w-0 flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex w-max items-center gap-2 pr-2">
                                {[{ id: 'all', label: 'Tất cả danh mục' }, ...availableCategories.map((category) => ({ id: category, label: category }))].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveCategory(item.id)}
                                        aria-pressed={activeCategory === item.id}
                                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === item.id ? 'bg-secret-wax text-white' : 'border border-gray-200 bg-white text-secret-ink hover:border-secret-wax'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="relative shrink-0" aria-label="Lọc theo định dạng">
                            <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                            <select
                                value={activeType}
                                onChange={(event) => setActiveType(event.target.value)}
                                className="h-10 cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-0 pl-9 pr-8 text-sm font-semibold text-secret-ink outline-none transition hover:border-secret-wax focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20"
                            >
                                {TYPE_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" aria-hidden="true">▼</span>
                        </label>
                    </div>
                </div>
            </section>

            <main className="bg-gradient-to-b from-white to-secret-paper/20 py-14">
                <div className="container mx-auto max-w-7xl px-4">
                    {loading ? (
                        <LoadingState />
                    ) : loadError && posts.length === 0 ? (
                        <EmptyState message={loadError} />
                    ) : visiblePosts.length === 0 ? (
                        <EmptyState message="Chưa tìm thấy bài viết phù hợp trong danh sách đã tải." />
                    ) : (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {visiblePosts.map((post) => <NewsCard key={post.id} post={post} />)}
                        </div>
                    )}

                    {hasMore && (
                        <div className="mt-12 text-center">
                            <button
                                type="button"
                                onClick={() => fetchPostPage({ cursor: lastPostDoc })}
                                disabled={loadingMore}
                                className="rounded-full bg-secret-wax px-7 py-3 font-semibold text-white shadow-md transition hover:bg-secret-ink disabled:cursor-wait disabled:opacity-60"
                            >
                                {loadingMore ? 'Đang tải…' : 'Xem thêm bài viết'}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const FeaturedSpotlight = ({ post }) => (
    <section className="bg-white py-12" aria-labelledby="featured-news-heading">
        <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center gap-3">
                <Star className="h-5 w-5 fill-secret-gold text-secret-gold" aria-hidden="true" />
                <h2 id="featured-news-heading" className="font-serif text-2xl font-bold text-secret-ink">Bài viết nổi bật</h2>
            </div>
            <article className="grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg md:grid-cols-2">
                <Link to={`/tin-tuc/${post.slug}`} className="group relative min-h-[280px] overflow-hidden md:min-h-[430px]">
                    <img src={post.thumbnailUrl || PLACEHOLDER_IMAGE} alt={post.thumbnailAlt || post.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    {getVideoEmbedData(post.videoUrl)?.contentKind === 'video' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20" aria-hidden="true">
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-110">
                                <Play className="ml-1 h-7 w-7 fill-secret-wax text-secret-wax" />
                            </span>
                        </span>
                    )}
                    <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-secret-wax px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                        <Star className="h-3.5 w-3.5 fill-current" /> Bài HOT
                    </span>
                </Link>
                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secret-wax">{post.category || 'Tin tức'}</p>
                    <h3 className="font-serif text-3xl font-bold leading-tight text-secret-ink md:text-4xl lg:text-5xl">
                        <Link to={`/tin-tuc/${post.slug}`} className="transition hover:text-secret-wax">{post.title}</Link>
                    </h3>
                    {post.excerpt && <p className="mt-5 line-clamp-4 text-base leading-relaxed text-gray-600 lg:text-lg">{post.excerpt}</p>}
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>{post.publishedAtLabel}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.readingTime} phút đọc</span>
                    </div>
                    <Link to={`/tin-tuc/${post.slug}`} className="mt-8 inline-flex w-fit items-center rounded-full bg-secret-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-secret-wax">
                        Đọc bài viết →
                    </Link>
                </div>
            </article>
        </div>
    </section>
);

const NewsCard = ({ post }) => (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
        <Link to={`/tin-tuc/${post.slug}`} className="group relative h-56 overflow-hidden">
            <img src={post.thumbnailUrl || PLACEHOLDER_IMAGE} alt={post.thumbnailAlt || post.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            {getVideoEmbedData(post.videoUrl)?.contentKind === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90"><Play className="ml-1 h-6 w-6 fill-secret-wax text-secret-wax" /></span></span>
            )}
        </Link>
        <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold uppercase tracking-wide text-secret-wax">{post.category || 'Tin tức'}</span>
                <time className="flex items-center gap-1 text-gray-500"><Calendar className="h-3 w-3" />{post.publishedAtLabel}</time>
            </div>
            <h2 className="mb-3 text-xl font-bold leading-tight text-secret-ink"><Link to={`/tin-tuc/${post.slug}`} className="hover:text-secret-wax">{post.title}</Link></h2>
            <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"><Clock className="h-4 w-4" />{post.readingTime} phút đọc</span>
                <Link to={`/tin-tuc/${post.slug}`} className="text-sm font-semibold text-secret-wax hover:text-secret-ink">Xem chi tiết →</Link>
            </div>
        </div>
    </article>
);

const LoadingState = () => <div className="flex flex-col items-center justify-center py-20"><div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-secret-wax/30 border-t-secret-wax" /><p className="text-gray-500">Đang tải bài viết…</p></div>;
const EmptyState = ({ message }) => <div className="py-20 text-center text-lg text-gray-500">{message}</div>;

export default News;
