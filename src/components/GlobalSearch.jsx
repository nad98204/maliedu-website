import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Search, Loader2, BookOpen, FileText, ChevronRight, X } from 'lucide-react';
import { db } from '../firebase';

const GlobalSearch = ({ className }) => {
    const [queryText, setQueryText] = useState('');
    const [results, setResults] = useState({ courses: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Cache data to avoid too many reads
    const [allCourses, setAllCourses] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Initial Data Load (Lazy load on focus or first type could be better, but small scale is fine)
    useEffect(() => {
        const loadData = async () => {
            if (dataLoaded) return;
            try {
                // Fetch Courses
                const coursesSnap = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc'), limit(50)));
                const courses = coursesSnap.docs.map(doc => ({
                    id: doc.id,
                    type: 'course',
                    title: doc.data().name,
                    slug: doc.data().slug || doc.id,
                    image: doc.data().thumbnailUrl
                }));

                // Fetch Posts
                const postsSnap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50)));
                const posts = postsSnap.docs.map(doc => ({
                    id: doc.id,
                    type: 'post',
                    title: doc.data().title,
                    slug: doc.data().slug || doc.id,
                    image: doc.data().thumbnailUrl,
                    category: doc.data().category || 'Tin tức'
                }));

                setAllCourses(courses);
                setAllPosts(posts);
                setDataLoaded(true);
            } catch (err) {
                console.error("Search data load error:", err);
            }
        };

        if (isOpen) { // Only load when user tries to search
            loadData();
        }
    }, [isOpen, dataLoaded]);

    // Search Filtering Logic
    useEffect(() => {
        if (!queryText.trim()) {
            setResults({ courses: [], posts: [] });
            return;
        }

        const lowerQuery = queryText.toLowerCase();

        // Simple filtering
        const filteredCourses = allCourses.filter(item =>
            item.title?.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        const filteredPosts = allPosts.filter(item =>
            item.title?.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        setResults({ courses: filteredCourses, posts: filteredPosts });
    }, [queryText, allCourses, allPosts]);

    // Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        setIsOpen(false);
        setQueryText(''); // Optional: clear or keep
        if (item.type === 'course') {
            navigate(`/khoa-hoc/${item.slug}`);
        } else {
            navigate(`/tin-tuc/${item.slug}`);
        }
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secret-ink/50" />
                <input
                    type="text"
                    placeholder="Tìm kiếm khóa học, bài viết..."
                    className="w-44 rounded-full border border-secret-ink/20 bg-white/70 py-2 pl-9 pr-8 text-sm text-secret-ink placeholder:text-secret-ink/40 focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20 transition-all font-medium"
                    value={queryText}
                    onChange={(e) => {
                        setQueryText(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {queryText && (
                    <button
                        onClick={() => { setQueryText(''); setResults({ courses: [], posts: [] }); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown Suggestions */}
            {isOpen && queryText && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">

                    {!dataLoaded && (
                        <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {dataLoaded && results.courses.length === 0 && results.posts.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            Không tìm thấy kết quả cho "{queryText}"
                        </div>
                    )}

                    {(results.courses.length > 0 || results.posts.length > 0) && (
                        <div className="max-h-[70vh] overflow-y-auto">
                            {/* Courses Section */}
                            {results.courses.length > 0 && (
                                <div className="py-2">
                                    <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <BookOpen className="w-3 h-3" /> Khóa học
                                    </h3>
                                    {results.courses.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                <img src={item.image || 'https://via.placeholder.com/40'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-700 group-hover:text-secret-wax truncate">{item.title}</h4>
                                                <span className="text-xs text-slate-400">Khóa học online</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-secret-wax" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.courses.length > 0 && results.posts.length > 0 && (
                                <div className="h-px bg-slate-100 mx-4"></div>
                            )}

                            {/* Posts Section */}
                            {results.posts.length > 0 && (
                                <div className="py-2">
                                    <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Bài viết
                                    </h3>
                                    {results.posts.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                <img src={item.image || 'https://via.placeholder.com/40'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-700 group-hover:text-secret-wax truncate">{item.title}</h4>
                                                <span className="text-xs text-slate-400">{item.category}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-secret-wax" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View All footer (Optional, logic to implement search results page later if needed) */}
                    <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                        <button className="text-xs font-bold text-secret-ink hover:text-secret-wax transition-colors w-full py-1">
                            Xem tất cả kết quả
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
