import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    Headphones, 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Sparkles, 
    Clock, 
    Flame, 
    Lock, 
    Unlock, 
    Search, 
    X, 
    LayoutGrid,
    List,
    Layers,
    Moon,
    Coins,
    HeartHandshake,
    ShieldCheck,
    Crown,
    CheckCircle2,
    RotateCcw,
    RotateCw,
    BookOpen,
    ArrowRight,
    ShoppingBag,
    Check,
    Tag,
    AlertTriangle,
    Info,
    Radio,
    Activity,
    User,
    Award,
    Zap,
    Calendar,
    BadgeCheck,
    Eye,
    HelpCircle,
    Heart,
    CreditCard,
    Share2,
    Copy
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { getHypnosisCatalog, getHypnosisLibrary, claimHypnosisTrack, getHypnosisPlayback } from '../utils/hypnosisService';
import SEO from '../components/SEO';
import AuthModal from '../components/AuthModal';
import { getAffiliateByUserId } from '../utils/affiliateService';

import { 
    HYPNOSIS_CATEGORIES as CATEGORIES, 
    DEFAULT_HYPNOSIS_EXPERTS, 
    getTrackDetails 
} from '../data/hypnosisTracksData';



const playbackExpired = (expires) => Boolean(expires && expires * 1000 <= Date.now());

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ThoiMien = ({ isPurchasedOnly = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isPurchasedView = isPurchasedOnly || location.pathname === '/thoi-mien-cua-toi' || location.search.includes('tab=purchased');

    const [tracks, setTracks] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' (2 cột) hoặc 'list' (danh sách gọn)
    const [ownedTrackIds, setOwnedTrackIds] = useState([]);
    const [libraryLoading, setLibraryLoading] = useState(true);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [playback, setPlayback] = useState(null);
    const [playbackRequest, setPlaybackRequest] = useState(0);

    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedExpert, setSelectedExpert] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [selectedPaidTrack, setSelectedPaidTrack] = useState(null);
    const [selectedDetailTrack, setSelectedDetailTrack] = useState(null);
    const [selectedGuideTrack, setSelectedGuideTrack] = useState(null);
    const [activeGuideTab, setActiveGuideTab] = useState('preparation');
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [userAffiliateProfile, setUserAffiliateProfile] = useState(null);
    const [copiedTrackId, setCopiedTrackId] = useState(null);

    const activeDetailData = useMemo(() => {
        return selectedDetailTrack ? getTrackDetails(selectedDetailTrack, tracks) : null;
    }, [selectedDetailTrack, tracks]);

    const activeGuideData = useMemo(() => {
        return selectedGuideTrack ? getTrackDetails(selectedGuideTrack, tracks) : null;
    }, [selectedGuideTrack, tracks]);

    // Lay danh sach chuyen gia duy nhat
    const availableExperts = useMemo(() => {
        const map = new Map();
        DEFAULT_HYPNOSIS_EXPERTS.forEach(exp => {
            map.set(exp.name.trim().toLowerCase(), {
                id: exp.id,
                name: exp.name,
                avatar: exp.avatar,
                title: exp.title
            });
        });
        tracks.forEach(track => {
            if (track.author) {
                const key = track.author.trim().toLowerCase();
                if (!map.has(key)) {
                    map.set(key, {
                        id: track.authorId || key,
                        name: track.author,
                        avatar: track.authorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                        title: track.authorTitle || 'Chuyen gia thoi mien'
                    });
                }
            }
        });
        return Array.from(map.values());
    }, [tracks]);

    const audioRef = useRef(null);

    const isBunnyStream = playback?.provider === 'bunny';
    const bunnyIframeUrl = useMemo(() => {
        if (!isBunnyStream || !playback?.playbackUrl || playback.userId !== user?.uid) return '';
        const url = new URL(playback.playbackUrl);
        url.searchParams.set('autoplay', 'true');
        return url.toString();
    }, [isBunnyStream, playback, user?.uid]);

    // Check user auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            audioRef.current?.pause();
            audioRef.current?.removeAttribute('src');
            setCurrentTrack(null);
            setSelectedGuideTrack(null);
            setPlayback(null);
            setIsPlaying(false);
            setOwnedTrackIds([]);
            setLibraryLoading(Boolean(currentUser));
            try { localStorage.removeItem('maliedu_owned_audio_ids'); } catch { /* old cache is never trusted */ }
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Check affiliate profile when user logs in
    useEffect(() => {
        const checkAffiliate = async () => {
            if (user?.uid) {
                try {
                    const aff = await getAffiliateByUserId(user.uid);
                    setUserAffiliateProfile(aff);
                } catch (e) {
                    console.error('Error loading affiliate profile:', e);
                }
            } else {
                setUserAffiliateProfile(null);
            }
        };
        checkAffiliate();
    }, [user]);

    const getTrackAffiliateInfo = (track) => {
        if (!track || track.isFree || track.isAffiliateEnabled === false) return null;
        const rawPrice = track.price;
        const priceNum = typeof rawPrice === 'number' ? rawPrice : (Number(String(rawPrice || 0).replace(/\D/g, '')) || 0);
        const isFixed = track.affiliateCommissionType === 'fixed' && Number(track.affiliateCommissionAmount) > 0;
        const commPercent = Number(track.affiliateCommissionPercent) || 30;
        const fixedAmount = Number(track.affiliateCommissionAmount) || 0;
        const estReward = isFixed ? fixedAmount : Math.round((priceNum * commPercent) / 100);
        const label = isFixed ? `${fixedAmount.toLocaleString('vi-VN')}đ` : `${commPercent}%`;
        const buyerDiscount = Number(track.affiliateBuyerDiscountPercent) || 0;
        return {
            isFixed,
            label,
            commPercent,
            estReward,
            buyerDiscount,
            buyerVoucherText: track.affiliateBuyerVoucherText || '',
        };
    };

    const handleGetTrackAffiliateLink = async (track) => {
        if (!user) {
            toast('Vui lòng đăng nhập để kích hoạt & lấy link tiếp thị cá nhân!', { icon: '🔐' });
            navigate('/affiliate');
            return;
        }

        let profile = userAffiliateProfile;
        if (!profile) {
            try {
                profile = await getAffiliateByUserId(user.uid);
                setUserAffiliateProfile(profile);
            } catch (err) {
                console.error(err);
            }
        }

        if (!profile || profile.status !== 'active') {
            toast('Bạn chưa kích hoạt mã CTV. Đang chuyển tới trang đối tác...', { icon: '✨' });
            navigate('/affiliate');
            return;
        }

        const origin = window.location.origin;
        const affLink = `${origin}/thanh-toan/${track.id}?ref=${profile.affiliateCode}`;

        try {
            await navigator.clipboard.writeText(affLink);
            setCopiedTrackId(track.id);
            toast.success(`Đã sao chép link tiếp thị (Mã CTV: ${profile.affiliateCode})!`);
            setTimeout(() => setCopiedTrackId(null), 3000);
        } catch {
            toast.error('Không thể tự động sao chép link.');
        }
    };

    // Only sanitized catalog metadata is public. Do not substitute sellable sample data on errors.
    useEffect(() => {
        const controller = new AbortController();
        getHypnosisCatalog(controller.signal).then(setTracks).catch(error => {
            if (!controller.signal.aborted) toast.error(error.message);
        }).finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        // Auth observer has already cleared the previous account and set loading.
        if (!user?.uid) return () => controller.abort();
        getHypnosisLibrary(user, controller.signal).then(ids => {
            if (!controller.signal.aborted) setOwnedTrackIds(Array.isArray(ids) ? ids : []);
        }).catch(error => {
            if (!controller.signal.aborted) toast.error(error.message);
        }).finally(() => { if (!controller.signal.aborted) setLibraryLoading(false); });
        return () => controller.abort();
    }, [user]);

    useEffect(() => {
        if (!isPurchasedView || authLoading || libraryLoading || catalogLoading || !user) return;
        const id = new URLSearchParams(location.search).get('autoPlay');
        if (!id) return;
        const target = tracks.find(track => track.id === id);
        if (!target || !ownedTrackIds.includes(id)) return;
        // Synchronize the requested route only after server ownership has loaded.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentTrack(target);
        setCurrentTime(0);
    }, [location.search, isPurchasedView, tracks, ownedTrackIds, user, authLoading, libraryLoading, catalogLoading]);

    // Every playback must be authorized by the server, even if client state is forged.
    useEffect(() => {
        const controller = new AbortController();
        // Stop the previous source immediately when its authorization context changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayback(null);
        setIsPlaying(false);
        audioRef.current?.pause();
        audioRef.current?.removeAttribute('src');
        if (!isPurchasedView || !user || !currentTrack || !ownedTrackIds.includes(currentTrack.id)) {
            return () => controller.abort();
        }
        getHypnosisPlayback(currentTrack.id, user, controller.signal).then(result => {
            if (!controller.signal.aborted && auth.currentUser?.uid === user.uid) {
                setPlayback({ ...result, userId: user.uid });
                if (result.provider === 'bunny') setIsPlaying(true);
            }
        }).catch(error => {
            if (!controller.signal.aborted) toast.error(error.message);
        });
        return () => controller.abort();
    }, [currentTrack, user, isPurchasedView, ownedTrackIds, playbackRequest]);

    useEffect(() => {
        const audio = audioRef.current;
        let active = true;
        if (isPurchasedView && playback?.playbackUrl && playback.userId === user?.uid) {
            if (!isBunnyStream && audio) {
                audio.src = playback.playbackUrl;
                audio.play().then(() => { if (active) setIsPlaying(true); }).catch(() => { if (active) setIsPlaying(false); });
            }
        }
        return () => { active = false; audio?.pause(); audio?.removeAttribute('src'); };
    }, [playback, isPurchasedView, isBunnyStream, user?.uid]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e) => {
        const targetTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);
        }
    };

    const handleSkip = useCallback((seconds) => {
        if (audioRef.current) {
            const nextTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || Infinity);
            audioRef.current.currentTime = nextTime;
            setCurrentTime(nextTime);
        }
    }, [duration]);

    const togglePlay = () => {
        if (!playback || !user || playback.userId !== user.uid) return;
        if (!isPlaying && playbackExpired(playback.expires)) {
            setPlaybackRequest(value => value + 1);
            return;
        }
        if (isBunnyStream) {
            setIsPlaying(!isPlaying);
            return;
        }
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    // Media Session API for Lock Screen & Background Playback controls (iOS Safari / Android Chrome)
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentTrack) return;

        try {
            // Cài đặt metadata hiển thị trên Màn hình khóa / Dynamic Island / Notification Center
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: currentTrack.title || 'Bản Thôi Miên & Thiền Định',
                artist: currentTrack.author || 'Mali Edu',
                album: 'Kho Thôi Miên & Thiền Tiềm Thức',
                artwork: currentTrack.imageUrl ? [
                    { src: currentTrack.imageUrl, sizes: '96x96', type: 'image/png' },
                    { src: currentTrack.imageUrl, sizes: '128x128', type: 'image/png' },
                    { src: currentTrack.imageUrl, sizes: '192x192', type: 'image/png' },
                    { src: currentTrack.imageUrl, sizes: '256x256', type: 'image/png' },
                    { src: currentTrack.imageUrl, sizes: '512x512', type: 'image/png' },
                ] : [
                    { src: '/logo.png', sizes: '192x192', type: 'image/png' }
                ]
            });

            // Xử lý các nút điều khiển từ Màn hình khóa / Tai nghe Bluetooth / Dynamic Island
            const actionHandlers = [
                ['play', () => {
                    if (audioRef.current && !isBunnyStream) {
                        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    } else if (isBunnyStream) {
                        setIsPlaying(true);
                    }
                }],
                ['pause', () => {
                    if (audioRef.current && !isBunnyStream) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                    } else if (isBunnyStream) {
                        setIsPlaying(false);
                    }
                }],
                ['seekbackward', (details) => {
                    const skipTime = details.seekOffset || 15;
                    handleSkip(-skipTime);
                }],
                ['seekforward', (details) => {
                    const skipTime = details.seekOffset || 15;
                    handleSkip(skipTime);
                }],
                ['seekto', (details) => {
                    if (details.seekTime !== null && details.seekTime !== undefined && audioRef.current) {
                        audioRef.current.currentTime = details.seekTime;
                        setCurrentTime(details.seekTime);
                    }
                }],
                ['stop', () => {
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                    }
                    setIsPlaying(false);
                }]
            ];

            actionHandlers.forEach(([action, handler]) => {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch {
                    // Action không được hỗ trợ bởi trình duyệt này thì bỏ qua
                }
            });
        } catch (e) {
            console.error('MediaSession setup error:', e);
        }
    }, [currentTrack, isBunnyStream, duration, handleSkip]);

    // Đồng bộ trạng thái phát (playing / paused) lên MediaSession Lock Screen
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        } catch {
            // ignore
        }
    }, [isPlaying]);

    // Đồng bộ tiến độ thời gian (timeline slider) lên Màn hình khóa
    useEffect(() => {
        if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
        if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: audioRef.current?.playbackRate || 1,
                    position: Math.min(currentTime, duration)
                });
            } catch {
                // ignore
            }
        }
    }, [currentTime, duration]);

    const handleClaimFreeTrack = async (track) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để nhận bản miễn phí.');
            setAuthModalOpen(true);
            return;
        }
        if (track.available === false) { toast.error('Bản ghi chưa sẵn sàng để nghe.'); return; }
        const uid = user.uid;
        try {
            await claimHypnosisTrack(track.id, user);
            if (auth.currentUser?.uid !== uid) return;
            setOwnedTrackIds(previous => Array.from(new Set([...previous, track.id])));
            toast.success('Đã nhận bản miễn phí.');
            navigate('/thoi-mien-cua-toi?autoPlay=' + encodeURIComponent(track.id));
        } catch (error) { toast.error(error.message); }
    };

    const handlePlayOwnedTrack = (track) => {
        if (!user || !ownedTrackIds.includes(track.id)) { toast.error('Bạn chưa có quyền nghe bản này.'); return; }
        if (currentTrack?.id === track.id) togglePlay();
        else { setCurrentTrack(track); setCurrentTime(0); }
    };

    // Lọc danh sách bài:
    const displayedSourceTracks = useMemo(() => {
        if (isPurchasedView) {
            return tracks.filter(t => ownedTrackIds.includes(t.id));
        }
        return tracks;
    }, [isPurchasedView, tracks, ownedTrackIds]);

    const filteredTracks = useMemo(() => {
        return displayedSourceTracks.filter((t) => {
            if (isPurchasedView) {
                if (!searchTerm.trim()) return true;
                return (
                    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.benefit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.author?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            const matchCategory =
                activeCategory === 'all' ||
                (activeCategory === 'free' && t.isFree) ||
                (activeCategory === 'vip' && t.category === 'vip') ||
                t.category === activeCategory;

            const matchExpert =
                selectedExpert === 'all' ||
                (t.authorId && t.authorId === selectedExpert) ||
                (t.author && t.author.trim().toLowerCase() === selectedExpert.toLowerCase());

            const matchSearch =
                !searchTerm.trim() ||
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.benefit && t.benefit.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (t.author && t.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

            return matchCategory && matchExpert && matchSearch;
        });
    }, [displayedSourceTracks, activeCategory, selectedExpert, searchTerm, isPurchasedView]);

    return (
        <div className="min-h-screen bg-[#FAF7F2] pb-36 pt-4 sm:pt-6 md:pt-24">
            <SEO
                title={isPurchasedView ? "Bản Thôi Miên Tôi Đã Mua | Mali Edu" : "Kho Thôi Miên & Thiền Tiềm Thức | Mali Edu"}
                description="Lắng nghe các bản thôi miên trị liệu, ám thị tiềm thức và thiền định cao cấp cùng Mong Coaching để khơi thông tâm trí, thu hút tài chính và ngủ sâu an lành."
                url={isPurchasedView ? "/thoi-mien-cua-toi" : "/thoi-mien"}
            />

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            {/* Hidden Audio & Bunny Stream Player (Chỉ phát ở mục Đã mua) */}
            {isPurchasedView && !isBunnyStream && (
                <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    preload="auto"
                    playsInline
                />
            )}
            {isPurchasedView && isBunnyStream && isPlaying && bunnyIframeUrl && (
                <iframe
                    key={bunnyIframeUrl}
                    src={bunnyIframeUrl}
                    title={currentTrack?.title || "Bunny Stream Player"}
                    className="w-0 h-0 opacity-0 pointer-events-none absolute"
                    allow="autoplay; encrypted-media"
                />
            )}

            {/* Hero Section */}
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2D1B1B] via-[#4A1517] to-[#1F0C0D] p-4 sm:p-6 text-white shadow-lg">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight">
                                {isPurchasedView ? (
                                    <>Thôi Miên <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">Tôi Đã Mua</span></>
                                ) : (
                                    <>Thôi Miên & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">Thiền Tiềm Thức</span></>
                                )}
                            </h1>
                        </div>

                        {/* Switcher Cửa hàng vs Đã mua */}
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 w-fit">
                            <Link
                                to="/thoi-mien"
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    !isPurchasedView 
                                        ? 'bg-[#9B2528] text-white shadow-sm' 
                                        : 'text-amber-200/80 hover:text-white'
                                }`}
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Cửa hàng</span>
                            </Link>

                            <Link
                                to="/thoi-mien-cua-toi"
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isPurchasedView 
                                        ? 'bg-[#9B2528] text-white shadow-sm' 
                                        : 'text-amber-200/80 hover:text-white'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Đã mua ({ownedTrackIds.length})</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter, Search & View Mode Controls */}
                <div className="mt-5 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={isPurchasedView ? "Tìm trong các bài đã sở hữu..." : "Tìm bản thôi miên (giấc ngủ, tài chính, chữa lành...)"}
                                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#9B2528] focus:ring-2 focus:ring-[#9B2528]/10 outline-none transition"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Right: View Mode Toggle (Lưới 2 Cột vs Danh Sách Gọn) & Count */}
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                                <span className="font-black text-slate-900">{filteredTracks.length}</span> sản phẩm
                            </span>

                            {/* View Switcher Toggle */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    title="Dạng lưới 2 cột"
                                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                        viewMode === 'grid' 
                                            ? 'bg-[#9B2528] text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span className="text-[10px] hidden sm:inline">Lưới 2 cột</span>
                                </button>

                                <button
                                    onClick={() => setViewMode('list')}
                                    title="Dạng danh sách tinh gọn"
                                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                        viewMode === 'list' 
                                            ? 'bg-[#9B2528] text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <List className="w-3.5 h-3.5" />
                                    <span className="text-[10px] hidden sm:inline">Danh sách</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Category Filter Pills (Phân khúc & Lợi ích) */}
                    {!isPurchasedView && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                            isActive
                                                ? 'bg-[#9B2528] text-white shadow-md scale-[1.02]'
                                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-[#9B2528]'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Chuyên gia Thôi Miên Filter */}
                    {!isPurchasedView && availableExperts.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                            <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
                                <User className="w-3.5 h-3.5 text-purple-600" /> Chuyên gia:
                            </span>
                            <button
                                onClick={() => setSelectedExpert('all')}
                                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                    selectedExpert === 'all'
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                            >
                                Tất cả chuyên gia
                            </button>
                            {availableExperts.map((exp) => {
                                const isExpActive = selectedExpert === exp.name || selectedExpert === exp.id;
                                return (
                                    <button
                                        key={exp.id}
                                        onClick={() => setSelectedExpert(isExpActive ? 'all' : exp.name)}
                                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                                            isExpActive
                                                ? 'bg-purple-700 text-white border-purple-700 shadow-md scale-[1.02]'
                                                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/60'
                                        }`}
                                    >
                                        <img
                                            src={exp.avatar}
                                            alt={exp.name}
                                            className="w-4 h-4 rounded-full object-cover border border-white/60 shrink-0"
                                        />
                                        <span>{exp.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ===== CHẾ ĐỘ 1: DẠNG LƯỚI 2 CỘT (MOBILE 2-COLUMN GRID) ===== */}
                {viewMode === 'grid' && (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                        {filteredTracks.map((track) => {
                            const isOwned = ownedTrackIds.includes(track.id);
                            const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                            const isThisSelected = currentTrack?.id === track.id;
                            const affInfo = getTrackAffiliateInfo(track);

                            return (
                                <div
                                    key={track.id}
                                    onClick={() => {
                                        if (isPurchasedView) {
                                            setSelectedGuideTrack(track);
                                            setActiveGuideTab('preparation');
                                        } else {
                                            setSelectedDetailTrack(track);
                                        }
                                    }}
                                    className={`group flex flex-col justify-between rounded-2xl border bg-white p-2.5 sm:p-3.5 transition-all duration-300 hover:shadow-md cursor-pointer hover:border-[#9B2528]/40 ${
                                        isThisSelected && isPurchasedView
                                            ? 'border-red-500 ring-2 ring-red-500/10 shadow-md' 
                                            : 'border-slate-200/90 hover:border-slate-300'
                                    }`}
                                >
                                    <div>
                                        {/* Cover Image 1:1 Square (Rất nhỏ gọn, không chiếm chỗ) */}
                                        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900 shadow-inner">
                                            <img
                                                src={track.coverImageSquare || track.coverImage}
                                                alt={track.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

                                            {/* Top Badge: Phân khúc giá / Sở hữu */}
                                            <div className="absolute left-2 top-2">
                                                {isPurchasedView ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600/95 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-sm">
                                                        <ShieldCheck className="w-2.5 h-2.5" /> Đã có
                                                    </span>
                                                ) : isOwned ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600/95 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-sm">
                                                        <Check className="w-2.5 h-2.5" /> Đã nhận
                                                    </span>
                                                ) : track.isFree ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/95 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-sm">
                                                        <Unlock className="w-2.5 h-2.5" /> 0đ Miễn phí
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-sm">
                                                        <Lock className="w-2.5 h-2.5" /> {track.price}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Duration Tag */}
                                            <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white/90">
                                                <Clock className="w-2.5 h-2.5 text-amber-300" />
                                                <span>{track.duration}</span>
                                            </div>

                                            {/* Play Overlay (Chỉ có ở ĐÃ MUA) */}
                                            {isPurchasedView && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayOwnedTrack(track);
                                                    }}
                                                    aria-label={isThisPlaying ? "Tạm dừng" : "Nghe ngay"}
                                                    className={`absolute inset-0 m-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all shadow-lg active:scale-95 ${
                                                        isThisPlaying
                                                            ? 'bg-[#9B2528] text-white scale-105 ring-2 ring-white animate-pulse'
                                                            : 'bg-white/90 text-slate-900 hover:bg-white hover:scale-110'
                                                    }`}
                                                >
                                                    {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                                </button>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="mt-2.5">
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-medium">
                                                <span className="text-[#9B2528] font-bold truncate">{track.segment || track.author}</span>
                                                <span className="hidden sm:inline text-slate-400 truncate">{track.brainwave ? track.brainwave.split('&')[0] : ''}</span>
                                            </div>

                                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#9B2528] transition-colors line-clamp-2 leading-tight">
                                                {track.title}
                                            </h3>

                                            {/* Benefit / Lợi ích cốt lõi */}
                                            <p className="mt-1 text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-snug">
                                                {track.benefit || track.description}
                                            </p>

                                            {/* Expert Avatar & Name */}
                                            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                                                <img
                                                    src={track.authorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'}
                                                    alt={track.author || 'Chuyên gia'}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-purple-200 shrink-0"
                                                />
                                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 truncate">
                                                    {track.author || 'Master Coach Mong'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                        {isPurchasedView ? (
                                            <div className="grid grid-cols-2 gap-1.5 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayOwnedTrack(track)}
                                                    className={`py-1.5 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                                                        isThisPlaying 
                                                            ? 'bg-red-50 text-[#9B2528] border border-red-200' 
                                                            : 'bg-slate-900 text-white hover:bg-[#9B2528]'
                                                    }`}
                                                >
                                                    {isThisPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                                                    <span>{isThisPlaying ? 'Tạm dừng' : 'Nghe ngay'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedGuideTrack(track);
                                                        setActiveGuideTab('preparation');
                                                    }}
                                                    className="py-1.5 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400 shadow-sm active:scale-95"
                                                    title="Xem cẩm nang hướng dẫn chuyên sâu"
                                                >
                                                    <BookOpen className="w-3 h-3 text-amber-700 shrink-0" />
                                                    <span>Hướng dẫn</span>
                                                </button>
                                            </div>
                                        ) : isOwned ? (
                                            <Link
                                                to={`/thoi-mien-cua-toi?autoPlay=${track.id}`}
                                                className="w-full py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-center border border-emerald-200 shadow-sm"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Đã có • Mở nghe</span>
                                            </Link>
                                        ) : track.isFree ? (
                                            <button
                                                disabled={!track.available}
                                                onClick={() => handleClaimFreeTrack(track)}
                                                className="w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 bg-[#9B2528] text-white hover:bg-[#7E1E21] shadow-sm active:scale-95"
                                            >
                                                <Unlock className="w-3 h-3" />
                                                <span>{track.available ? 'Nhận 0đ' : 'Chưa sẵn sàng'}</span>
                                            </button>
                                        ) : (
                                            <button
                                                disabled={!track.available}
                                                onClick={() => navigate(`/thanh-toan/${track.id}`)}
                                                className="w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm active:scale-95"
                                            >
                                                <Lock className="w-3 h-3" />
                                                <span>{track.available ? `Mua • ${track.price}` : 'Chưa sẵn sàng'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Affiliate Bar (Dưới mỗi bản thôi miên có tiếp thị) */}
                                    {!isPurchasedView && !isOwned && affInfo && (
                                        <div className="mt-2.5 pt-2 border-t border-dashed border-amber-200 bg-amber-50/70 -mx-2.5 sm:-mx-3.5 -mb-2.5 sm:-mb-3.5 px-2.5 py-2 rounded-b-2xl" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between gap-1 text-[10px] leading-tight mb-1.5">
                                                <span className="font-bold text-amber-950 flex items-center gap-1 truncate">
                                                    <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />
                                                    <span>Hoa hồng: <strong className="text-red-700">{affInfo.label}</strong></span>
                                                </span>
                                                {affInfo.buyerDiscount > 0 && (
                                                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0 border border-emerald-300/60">
                                                        Mã -{affInfo.buyerDiscount}%
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleGetTrackAffiliateLink(track)}
                                                className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-900 font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
                                            >
                                                {copiedTrackId === track.id ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span className="text-emerald-700">Đã chép link CTV!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Share2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                                        <span>Tiếp thị ({affInfo.isFixed ? affInfo.label : `+${affInfo.estReward.toLocaleString('vi-VN')}đ`})</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ===== CHẾ ĐỘ 2: DẠNG DANH SÁCH TINH GỌN (COMPACT TRACKLIST) ===== */}
                {viewMode === 'list' && (
                    <div className="mt-5 space-y-2">
                        {filteredTracks.map((track, index) => {
                            const isOwned = ownedTrackIds.includes(track.id);
                            const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                            const isThisSelected = currentTrack?.id === track.id;
                            const affInfo = getTrackAffiliateInfo(track);

                            return (
                                <div
                                    key={track.id}
                                    onClick={() => {
                                        if (isPurchasedView) {
                                            setSelectedGuideTrack(track);
                                            setActiveGuideTab('preparation');
                                        } else {
                                            setSelectedDetailTrack(track);
                                        }
                                    }}
                                    className={`group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border bg-white transition hover:shadow-sm cursor-pointer hover:border-[#9B2528]/40 ${
                                        isThisSelected && isPurchasedView
                                            ? 'border-red-500 ring-2 ring-red-500/10' 
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {/* Left: Thumbnail & Info */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* STT */}
                                        <span className="text-[11px] font-bold text-slate-400 w-4 text-center shrink-0 hidden sm:block">
                                            {index + 1}
                                        </span>

                                        {/* Mini Thumbnail */}
                                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-sm">
                                            <img
                                                src={track.coverImageSquare || track.coverImage}
                                                alt={track.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {isPurchasedView && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayOwnedTrack(track);
                                                    }}
                                                    className={`absolute inset-0 m-auto flex h-7 w-7 items-center justify-center rounded-full ${
                                                        isThisPlaying ? 'bg-[#9B2528] text-white' : 'bg-black/50 text-white'
                                                    }`}
                                                >
                                                    {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                                </button>
                                            )}
                                        </div>

                                        {/* Text Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-bold text-[#9B2528] bg-red-50 px-1.5 py-0.5 rounded">
                                                    {track.segment || (track.isFree ? 'Miễn phí' : 'Trả phí')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5" /> {track.duration}
                                                </span>
                                            </div>

                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#9B2528] transition-colors">
                                                {track.title}
                                            </h4>

                                            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                                                {track.benefit || track.description}
                                            </p>

                                            {/* Expert in List view */}
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <img
                                                    src={track.authorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'}
                                                    alt={track.author || 'Chuyên gia'}
                                                    className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                                />
                                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 truncate">
                                                    {track.author || 'Master Coach Mong'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Button */}
                                    <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        {isPurchasedView ? (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayOwnedTrack(track)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                                        isThisPlaying ? 'bg-red-50 text-[#9B2528]' : 'bg-slate-900 text-white hover:bg-[#9B2528]'
                                                    }`}
                                                >
                                                    {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                    <span className="hidden sm:inline">{isThisPlaying ? 'Tạm dừng' : 'Nghe ngay'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedGuideTrack(track);
                                                        setActiveGuideTab('preparation');
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-sm active:scale-95"
                                                    title="Xem cẩm nang hướng dẫn chuyên sâu"
                                                >
                                                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                                                    <span className="hidden sm:inline">Hướng dẫn</span>
                                                </button>
                                            </div>
                                        ) : isOwned ? (
                                            <Link
                                                to={`/thoi-mien-cua-toi?autoPlay=${track.id}`}
                                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Đã có • Mở nghe</span>
                                            </Link>
                                        ) : track.isFree ? (
                                            <button
                                                disabled={!track.available}
                                                onClick={() => handleClaimFreeTrack(track)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-[#9B2528] text-white hover:bg-[#7E1E21] shadow-sm active:scale-95"
                                            >
                                                <Unlock className="w-3 h-3" />
                                                <span>{track.available ? 'Nhận 0đ' : 'Chưa sẵn sàng'}</span>
                                            </button>
                                        ) : (
                                            <button
                                                disabled={!track.available}
                                                onClick={() => navigate(`/thanh-toan/${track.id}`)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 shadow-sm active:scale-95"
                                            >
                                                <Lock className="w-3 h-3" />
                                                <span>{track.available ? track.price : 'Chưa sẵn sàng'}</span>
                                            </button>
                                        )}

                                        {/* Affiliate Button in List view */}
                                        {!isPurchasedView && !isOwned && affInfo && (
                                            <button
                                                type="button"
                                                onClick={() => handleGetTrackAffiliateLink(track)}
                                                title={`Tiếp thị nhận hoa hồng ${affInfo.label}`}
                                                className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 transition shrink-0 active:scale-95"
                                            >
                                                {copiedTrackId === track.id ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span className="text-emerald-700">Đã chép</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                                                        <span className="hidden sm:inline">Tiếp thị ({affInfo.label})</span>
                                                        <span className="sm:hidden">CTV ({affInfo.label})</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {filteredTracks.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center my-8 max-w-xl mx-auto">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            {isPurchasedView ? <BookOpen className="w-7 h-7" /> : <Headphones className="w-7 h-7" />}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isPurchasedView ? 'Bạn chưa có bản thôi miên nào trong thư viện' : 'Không tìm thấy bản thôi miên phù hợp'}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                            {isPurchasedView 
                                ? 'Các bản thôi miên (kể cả bản miễn phí 0đ) cần được nhận từ cửa hàng trước khi đưa vào đây để nghe.' 
                                : 'Vui lòng thử tìm với từ khóa khác hoặc chọn phân khúc khác.'
                            }
                        </p>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            {isPurchasedView ? (
                                <Link
                                    to="/thoi-mien"
                                    className="px-5 py-2.5 rounded-xl bg-[#9B2528] text-white text-xs font-bold hover:bg-[#7E1E21] transition shadow-md flex items-center gap-1.5"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Đến cửa hàng chọn bài</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={() => { setActiveCategory('all'); setSearchTerm(''); }}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                                >
                                    Xem tất cả
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Audio Player Bar (CHỈ HIỂN THỊ TRONG MỤC ĐÃ MUA) */}
            {isPurchasedView && currentTrack && (
                <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-[55] bg-slate-950/95 backdrop-blur-xl border-t border-white/10 text-white px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transition-all">
                    <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
                        
                        {/* Track Info */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
                                <img
                                    src={currentTrack.coverImageSquare || currentTrack.coverImage}
                                    alt={currentTrack.title}
                                    className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs sm:text-sm font-bold truncate text-white">
                                        {currentTrack.title}
                                    </h4>
                                    <p className="text-[11px] text-amber-300 truncate font-medium">
                                        {currentTrack.author}
                                    </p>
                                </div>
                            </div>

                            {/* Nút Hướng dẫn & Đóng player trên mobile */}
                            <div className="flex items-center gap-1 shrink-0 sm:hidden">
                                <button
                                    onClick={() => {
                                        setSelectedGuideTrack(currentTrack);
                                        setActiveGuideTab('preparation');
                                    }}
                                    className="p-1.5 text-amber-300 hover:text-white transition rounded-lg hover:bg-white/10 flex items-center gap-1 text-[10px] font-bold border border-white/10 bg-white/5 px-2"
                                    title="Xem cẩm nang hướng dẫn chuyên sâu"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Hướng dẫn</span>
                                </button>
                                <button
                                    onClick={() => {
                                        audioRef.current?.pause();
                                        setCurrentTrack(null);
                                        setIsPlaying(false);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/10"
                                    title="Đóng trình phát"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Player Controls & Progress Bar */}
                        <div className="flex flex-col items-center gap-1.5 w-full sm:max-w-xl">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleSkip(-15)}
                                    title="Lùi 15s"
                                    className="p-1.5 text-slate-400 hover:text-white transition"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={togglePlay}
                                    className="w-10 h-10 rounded-full bg-[#9B2528] hover:bg-[#7E1E21] text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                                >
                                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                </button>

                                <button
                                    onClick={() => handleSkip(15)}
                                    title="Tua 15s"
                                    className="p-1.5 text-slate-400 hover:text-white transition"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2.5 w-full text-[10px] text-slate-400 font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#9B2528]"
                                />
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Additional controls (Desktop) */}
                        <div className="hidden sm:flex items-center gap-2.5">
                            {/* Nút xem Hướng dẫn nhanh khi đang nghe */}
                            <button
                                onClick={() => {
                                    setSelectedGuideTrack(currentTrack);
                                    setActiveGuideTab('preparation');
                                }}
                                className="px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-white/10 hover:bg-white/15 transition rounded-lg flex items-center gap-1.5 border border-white/10 shrink-0"
                                title="Xem cẩm nang hướng dẫn chuyên sâu của bài này"
                            >
                                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                <span>Hướng dẫn</span>
                            </button>

                            <button
                                onClick={toggleMute}
                                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => {
                                    audioRef.current?.pause();
                                    setCurrentTrack(null);
                                    setIsPlaying(false);
                                }}
                                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
                                title="Đóng trình phát"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Chi Tiết Bản Thôi Miên (Hướng dẫn sử dụng, Lưu ý, Tác dụng, Tác giả, Sóng não, Bài tương tự) */}
            {selectedDetailTrack && activeDetailData && (
                <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
                    <div className="relative w-full max-w-2xl sm:max-w-3xl rounded-t-[28px] sm:rounded-3xl bg-[#FAF7F2] text-slate-800 shadow-2xl h-[92vh] sm:h-[88vh] flex flex-col overflow-hidden border border-amber-900/10">
                        
                        {/* Sticky Header */}
                        <div className="shrink-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-md">
                            <div className="flex items-center gap-2 min-w-0 pr-3">
                                <span className="shrink-0 rounded-lg bg-red-50 text-[#9B2528] px-2 py-0.5 text-[11px] font-bold">
                                    {activeDetailData.segment || 'Thôi Miên Tiềm Thức'}
                                </span>
                                <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                    {activeDetailData.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedDetailTrack(null)}
                                aria-label="Đóng chi tiết"
                                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body (flex-1 min-h-0 cuộn độc lập bên trong, giữ thanh CTA luôn ghim cố định ở đáy) */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 [scrollbar-width:thin]">
                            
                            {/* 1. Hero Card: Image, Title, Audio Badges */}
                            <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-md">
                                <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
                                    <img
                                        src={activeDetailData.coverImageBanner || activeDetailData.coverImageSquare || activeDetailData.coverImage}
                                        alt={activeDetailData.title}
                                        className="h-full w-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />
                                    
                                    {/* Overlay Badges */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] sm:text-xs font-bold text-amber-300 border border-white/10">
                                            <Radio className="w-3 h-3 text-amber-400" />
                                            <span>{activeDetailData.brainwave}</span>
                                        </span>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                                                {activeDetailData.authorInfo.name}
                                            </span>
                                            <h3 className="text-sm sm:text-lg font-black text-white leading-snug drop-shadow-md">
                                                {activeDetailData.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white/90">
                                                <Clock className="w-3 h-3 text-amber-400" />
                                                <span>{activeDetailData.duration}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/90 px-2 py-1 text-[11px] font-bold text-white">
                                                <Zap className="w-3 h-3" />
                                                <span>{activeDetailData.audioQuality}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Quick Tech & Schedule Specs */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                <div className="rounded-xl bg-white border border-slate-200/80 p-2.5 sm:p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                                        <Activity className="w-3.5 h-3.5 text-[#9B2528]" />
                                        <span>Tần số âm thanh</span>
                                    </div>
                                    <div className="mt-1 text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                                        {activeDetailData.frequency}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white border border-slate-200/80 p-2.5 sm:p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Thời điểm vàng</span>
                                    </div>
                                    <div className="mt-1 text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                                        {activeDetailData.bestTime}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white border border-slate-200/80 p-2.5 sm:p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Chu kỳ khuyến nghị</span>
                                    </div>
                                    <div className="mt-1 text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                                        {activeDetailData.recommendedCycle}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white border border-slate-200/80 p-2.5 sm:p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                                        <Headphones className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Lượt đón nhận</span>
                                    </div>
                                    <div className="mt-1 text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                                        {activeDetailData.listens ? `${activeDetailData.listens.toLocaleString()} lượt nghe` : '10.000+ học viên'}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Tác Dụng & Lợi Ích Cốt Lõi (Nó có tác dụng gì) */}
                            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <div className="p-1.5 rounded-lg bg-red-50 text-[#9B2528]">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                                            Tác dụng chuyển hóa của bản thôi miên này
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Lợi ích tác động trực tiếp vào tầng tiềm thức & trường năng lượng
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-1">
                                    {activeDetailData.effects.map((effect, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                                                {effect}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {activeDetailData.targetAudience && (
                                    <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 font-medium">
                                        <span className="font-bold">🎯 Đối tượng phù hợp: </span>
                                        {activeDetailData.targetAudience}
                                    </div>
                                )}
                            </div>

                            {/* ĐẶC QUYỀN MỞ KHÓA CẨM NANG CHUYÊN SÂU KHI SỞ HỮU */}
                            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-orange-500/10 border-2 border-amber-300/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-sm shrink-0">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                                                Cẩm nang thực hành chuyên sâu độc quyền
                                            </h3>
                                            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-md">
                                                💎 Đặc quyền dành riêng cho người sở hữu
                                            </span>
                                        </div>
                                    </div>
                                    {ownedTrackIds.includes(activeDetailData.id) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedGuideTrack(activeDetailData);
                                                setSelectedDetailTrack(null);
                                                setActiveGuideTab('preparation');
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm shrink-0 flex items-center gap-1 active:scale-95"
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>Mở cẩm nang</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-amber-900/90 leading-relaxed font-normal">
                                    Học viên sau khi sở hữu sẽ được mở khóa: Kỹ thuật thở 4-7-8 kích hoạt sóng não Theta/Delta, lộ trình 21 ngày tái lập trình mạng neuron tiềm thức, giải mã các hiện tượng tâm thức thường gặp (ngủ quên, nặng trĩu cơ thể...) và bài tập neo cảm xúc NLP từ Master Coach.
                                </p>
                            </div>

                            {/* 4. Hướng Dẫn Cách Sử Dụng (Cách dùng chuẩn khoa học) */}
                            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                        <HelpCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                                            Hướng dẫn cách lắng nghe để đạt hiệu quả cao nhất
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            4 bước chuẩn bị giúp sóng não dễ dàng đón nhận ám thị
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-1">
                                    {activeDetailData.howToUse.map((stepItem, idx) => (
                                        <div key={idx} className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9B2528] text-white text-[11px] font-black shadow-sm">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                                    {stepItem.step}
                                                </h4>
                                                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed font-normal">
                                                    {stepItem.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 5. Lưu Ý An Toàn Quan Trọng (Cực kỳ cần thiết) */}
                            <div className="rounded-2xl bg-gradient-to-br from-red-50/90 via-amber-50/60 to-white border-2 border-red-200/80 p-4 sm:p-5 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-black text-red-900 uppercase tracking-wide">
                                            Lưu ý quan trọng & Quy tắc an toàn
                                        </h3>
                                        <span className="text-[11px] text-red-700 font-medium">
                                            Vui lòng đọc kỹ trước khi bắt đầu lắng nghe
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1">
                                    {activeDetailData.precautions.map((prec, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-red-950 font-medium leading-relaxed">
                                            <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                                            <span>{prec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 6. Ai Là Người Thôi Miên Bài Này? (Người dẫn truyền & Giọng đọc) */}
                            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3.5">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                                            Người dẫn truyền & Thôi miên bài này
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Giọng đọc & Năng lượng ám thị tiềm thức
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                                    <img
                                        src={activeDetailData.authorInfo.avatar}
                                        alt={activeDetailData.authorInfo.name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                                    />
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4 className="text-sm sm:text-base font-black text-slate-900">
                                                {activeDetailData.authorInfo.name}
                                            </h4>
                                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                                <Award className="w-2.5 h-2.5 text-amber-700" />
                                                Chuyên gia
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#9B2528]">
                                            {activeDetailData.authorInfo.role}
                                        </p>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {activeDetailData.authorInfo.bio}
                                        </p>
                                    </div>
                                </div>

                                {/* Credentials tags */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {activeDetailData.authorInfo.credentials.map((cred, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                            {cred}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 7. Quyền Lợi & Cam Kết Đồng Hành (Đặc quyền sở hữu) */}
                            <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-sm space-y-3">
                                <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    <span>Đặc quyền trọn đời khi sở hữu bản thôi miên này</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-medium">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Sở hữu vĩnh viễn, nghe không giới hạn số lần</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Đồng bộ tự động trên Điện thoại, Tablet, Máy tính</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Âm thanh nguyên bản, hoàn toàn KHÔNG quảng cáo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Tự động cập nhật các phiên bản âm thanh tinh chỉnh mới</span>
                                    </div>
                                </div>
                            </div>

                            {/* 8. Các Thôi Miên Tương Tự Nếu Bạn Thích (Gợi ý liên quan) */}
                            {activeDetailData.relatedTracks && activeDetailData.relatedTracks.length > 0 && (
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Bản thôi miên tương tự có thể bạn sẽ thích</span>
                                        </h3>
                                        <span className="text-[11px] text-slate-500 font-medium">Gợi ý phù hợp</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {activeDetailData.relatedTracks.map((relTrack) => (
                                            <div
                                                key={relTrack.id}
                                                onClick={() => setSelectedDetailTrack(relTrack)}
                                                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-[#9B2528] hover:shadow-md flex sm:flex-col items-center sm:items-start gap-2.5"
                                            >
                                                <img
                                                    src={relTrack.coverImageBanner || relTrack.coverImageSquare || relTrack.coverImage}
                                                    alt={relTrack.title}
                                                    className="w-12 h-12 sm:w-full sm:aspect-video rounded-lg object-cover shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[10px] font-bold text-[#9B2528] truncate block">
                                                        {relTrack.isFree ? '🎁 Miễn phí 0đ' : relTrack.price}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#9B2528] transition-colors">
                                                        {relTrack.title}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                                                        {relTrack.duration} • {relTrack.category === 'wealth' ? 'Tài chính' : relTrack.category === 'sleep' ? 'Ngủ sâu' : 'Chữa lành'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thanh CTA Mua Hàng Cố Định Ở Đáy (Luôn ghim cố định ở đáy màn hình) */}
                        <div className="shrink-0 z-30 border-t border-slate-200/90 bg-white px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                                    {ownedTrackIds.includes(activeDetailData.id) ? 'Trạng thái bản thu' : 'Chi phí sở hữu trọn đời'}
                                </span>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    {ownedTrackIds.includes(activeDetailData.id) ? (
                                        <span className="text-base sm:text-lg font-black text-emerald-600 flex items-center gap-1">
                                            <Check className="w-4 h-4" /> Đã có trong thư viện
                                        </span>
                                    ) : activeDetailData.isFree ? (
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-xl sm:text-2xl font-black text-emerald-600">
                                                0đ
                                            </span>
                                            <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                Miễn phí trọn đời
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-xl sm:text-2xl font-black text-[#9B2528]">
                                                {activeDetailData.price}
                                            </span>
                                            {activeDetailData.originalPrice && (
                                                <span className="text-xs text-slate-400 line-through font-normal">
                                                    {activeDetailData.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {Number(activeDetailData.affiliateBuyerDiscountPercent) > 0 && (
                                        <div className="text-[10px] sm:text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                                            <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                                            <span>Mã giảm {activeDetailData.affiliateBuyerDiscountPercent}% khi mua qua link CTV {activeDetailData.affiliateBuyerVoucherText ? `(${activeDetailData.affiliateBuyerVoucherText})` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                                {ownedTrackIds.includes(activeDetailData.id) ? (
                                    <button
                                        onClick={() => {
                                            setSelectedDetailTrack(null);
                                            handlePlayOwnedTrack(activeDetailData);
                                        }}
                                        className="px-6 sm:px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        <span>{currentTrack?.id === activeDetailData.id && isPlaying ? 'Tạm dừng' : 'Mở nghe ngay'}</span>
                                    </button>
                                ) : activeDetailData.isFree ? (
                                    <button
                                        onClick={() => {
                                            const target = activeDetailData;
                                            setSelectedDetailTrack(null);
                                            handleClaimFreeTrack(target);
                                        }}
                                        className="px-6 sm:px-8 py-3 rounded-xl bg-[#9B2528] hover:bg-[#7E1E21] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2"
                                    >
                                        <Unlock className="w-4 h-4" />
                                        <span>Nhận 0đ & Nghe ngay</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {!ownedTrackIds.includes(activeDetailData.id) && !activeDetailData.isFree && activeDetailData.isAffiliateEnabled !== false && (
                                            <button
                                                type="button"
                                                onClick={() => handleGetTrackAffiliateLink(activeDetailData)}
                                                className="px-3 sm:px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                                                title="Lấy link tiếp thị liên kết"
                                            >
                                                {copiedTrackId === activeDetailData.id ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-emerald-700">Đã chép link!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                                                        <span className="hidden sm:inline">Tiếp thị ({activeDetailData.affiliateCommissionType === 'fixed' && activeDetailData.affiliateCommissionAmount ? `${Number(activeDetailData.affiliateCommissionAmount).toLocaleString('vi-VN')}đ` : `${activeDetailData.affiliateCommissionPercent || 30}%`})</span>
                                                        <span className="sm:hidden">CTV</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        <a
                                            href="https://zalo.me/0355067656"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hidden sm:inline-flex px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                                        >
                                            Tư vấn Zalo
                                        </a>
                                        <button
                                            onClick={() => {
                                                if (!activeDetailData.available) { toast.error('Bản ghi chưa sẵn sàng để bán.'); return; }
                                                const targetId = activeDetailData.id;
                                                setSelectedDetailTrack(null);
                                                navigate(`/thanh-toan/${targetId}`);
                                            }}
                                            className="px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition active:scale-95 flex items-center gap-2"
                                        >
                                            <Lock className="w-4 h-4" />
                                            <span>MUA NGAY • {activeDetailData.price}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CẨM NANG HƯỚNG DẪN CHUYÊN SÂU DÀNH CHO HỌC VIÊN ĐÃ SỞ HỮU */}
            {selectedGuideTrack && activeGuideData && (
                <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
                    <div className="relative w-full max-w-2xl sm:max-w-3xl rounded-t-[28px] sm:rounded-3xl bg-[#FAF8F5] text-slate-800 shadow-2xl h-[92vh] sm:h-[88vh] flex flex-col overflow-hidden border border-amber-900/20">
                        
                        {/* Header */}
                        <div className="shrink-0 z-20 flex items-center justify-between border-b border-amber-200/70 bg-white/95 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-md">
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-sm shrink-0">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="shrink-0 rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                            Cẩm nang chuyên sâu • Học viên sở hữu
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                            {activeGuideData.segment || 'Thôi Miên Tiềm Thức'}
                                        </span>
                                    </div>
                                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {activeGuideData.title}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedGuideTrack(null)}
                                aria-label="Đóng cẩm nang"
                                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Player Bar inside Guidebook (Nghe trực tiếp trong cẩm nang) */}
                        <div className="shrink-0 bg-slate-900 text-white px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between gap-3 shadow-inner">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <img
                                    src={activeGuideData.coverImageSquare || activeGuideData.coverImage}
                                    alt={activeGuideData.title}
                                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover border border-white/10 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                        <Radio className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{activeGuideData.brainwave}</span>
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                        {activeGuideData.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 truncate block">
                                        {activeGuideData.authorInfo?.name || activeGuideData.author} • {activeGuideData.duration}
                                    </span>
                                </div>
                            </div>

                            {/* Direct Play/Pause Button */}
                            <button
                                type="button"
                                onClick={() => handlePlayOwnedTrack(activeGuideData)}
                                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0 ${
                                    currentTrack?.id === activeGuideData.id && isPlaying
                                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                        : 'bg-white text-slate-900 hover:bg-amber-50'
                                }`}
                            >
                                {currentTrack?.id === activeGuideData.id && isPlaying ? (
                                    <>
                                        <Pause className="w-3.5 h-3.5 fill-current" />
                                        <span>Tạm dừng</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                        <span>Phát bài này</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Navigation Tabs (Các kiểu hướng dẫn chuyên sâu) */}
                        <div className="shrink-0 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] py-2">
                            <button
                                type="button"
                                onClick={() => setActiveGuideTab('preparation')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    activeGuideTab === 'preparation'
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <span>🧘</span>
                                <span>Chuẩn bị & Thở</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveGuideTab('routine')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    activeGuideTab === 'routine'
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <span>📅</span>
                                <span>Lộ trình 21 ngày</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveGuideTab('phenomena')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    activeGuideTab === 'phenomena'
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <span>🌊</span>
                                <span>Hiện tượng tâm thức</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveGuideTab('bonus')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    activeGuideTab === 'bonus'
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <span>✍️</span>
                                <span>Bài tập & Lời dặn</span>
                            </button>

                            {activeGuideData.detailedGuide && (
                                <button
                                    type="button"
                                    onClick={() => setActiveGuideTab('full')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                        activeGuideTab === 'full'
                                            ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>📜</span>
                                    <span>Toàn văn cẩm nang</span>
                                </button>
                            )}
                        </div>

                        {/* Scrollable Guidebook Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 [scrollbar-width:thin]">
                            
                            {/* TAB 1: CHUẨN BỊ & KỸ THUẬT THỞ */}
                            {activeGuideTab === 'preparation' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="rounded-2xl bg-white border border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                                    Quy trình chuẩn bị & Kỹ thuật thở kích hoạt sóng não
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Hạ tần số từ nhịp Beta (căng thẳng) về trạng thái Theta/Delta để đón nhận ám thị
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                                            {activeGuideData.guidePreparation}
                                        </div>
                                    </div>

                                    {/* Technical Spec Box */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                        <div className="rounded-xl bg-white border border-slate-200 p-3">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Tần số âm thanh</span>
                                            <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 block">{activeGuideData.frequency}</span>
                                        </div>
                                        <div className="rounded-xl bg-white border border-slate-200 p-3">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Chất lượng âm thanh</span>
                                            <span className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5 block">{activeGuideData.audioQuality}</span>
                                        </div>
                                        <div className="rounded-xl bg-white border border-slate-200 p-3 col-span-2 sm:col-span-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Thời lượng bài thu</span>
                                            <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 block">{activeGuideData.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: LỘ TRÌNH 21 NGÀY & KHUNG GIỜ VÀNG */}
                            {activeGuideTab === 'routine' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="rounded-2xl bg-white border border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                                    Lộ trình 21 ngày & Khung giờ vàng đón nhận
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Khoa học tái lập trình mạng neuron tiềm thức (Neuroplasticity)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                                            {activeGuideData.guideRoutine}
                                        </div>
                                    </div>

                                    {/* 21-Day Tracker Simulation Box */}
                                    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-slate-900 uppercase">
                                                Chu kỳ 21 ngày chuyển hóa thần kinh
                                            </h4>
                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                Mỗi ngày 1 lần
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1.5 pt-1">
                                            {Array.from({ length: 21 }).map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className="h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-600 hover:border-amber-400 hover:bg-amber-50 transition"
                                                    title={`Ngày ${idx + 1}`}
                                                >
                                                    N{idx + 1}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">
                                            * Khuyến nghị: Đánh dấu vào sổ tay hoặc ghi chú mỗi ngày bạn hoàn thành buổi nghe.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: HIỆN TƯỢNG TÂM THỨC THƯỜNG GẶP */}
                            {activeGuideTab === 'phenomena' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="rounded-2xl bg-white border border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                                                <HelpCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                                    Các hiện tượng tâm thức thường gặp & Giải thích khoa học
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Giải đáp chi tiết để học viên an tâm buông lỏng và đón nhận
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                                            {activeGuideData.guidePhenomena}
                                        </div>
                                    </div>

                                    {/* Safety Box */}
                                    <div className="rounded-2xl bg-red-50/60 border border-red-200 p-3.5 space-y-2">
                                        <div className="flex items-center gap-1.5 text-red-900 text-xs font-bold">
                                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                            <span>Nhắc nhở an toàn quan trọng</span>
                                        </div>
                                        <p className="text-[11px] text-red-800 leading-relaxed">
                                            Tuyệt đối không nghe bài thôi miên này khi đang lái xe, vận hành máy móc hoặc làm những công việc đòi hỏi sự tỉnh táo cao độ.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: BÀI TẬP BỔ TRỢ & LỜI DẶN COACH */}
                            {activeGuideTab === 'bonus' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="rounded-2xl bg-white border border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                                    Bài tập thực hành bổ trợ & Lời dặn từ Chuyên gia
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Gia tăng hiệu quả chuyển hóa gấp nhiều lần qua kỹ thuật neo cảm xúc và bài tập sáng
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                            {activeGuideData.guideBonus}
                                        </div>
                                    </div>

                                    {/* Author Card inside Guide */}
                                    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
                                        <img
                                            src={activeGuideData.authorInfo?.avatar || activeGuideData.authorAvatar}
                                            alt={activeGuideData.authorInfo?.name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-200 shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                                {activeGuideData.authorInfo?.name}
                                            </h4>
                                            <p className="text-[11px] text-[#9B2528] font-semibold">
                                                {activeGuideData.authorInfo?.title}
                                            </p>
                                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                                {activeGuideData.authorInfo?.bio}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: TOÀN VĂN CẨM NANG */}
                            {activeGuideTab === 'full' && activeGuideData.detailedGuide && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="rounded-2xl bg-white border border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                                    Toàn văn cẩm nang hướng dẫn chuyên sâu
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Bản ghi chú chi tiết từ chuyên gia đồng hành
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                                            {activeGuideData.detailedGuide}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer with Listen Button (Hoàn toàn KHÔNG có giá tiền hay nút mua) */}
                        <div className="shrink-0 z-30 border-t border-slate-200/90 bg-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
                            <div className="text-xs font-semibold text-slate-500 truncate">
                                <span>💡 Hãy chuẩn bị tai nghe và không gian yên tĩnh trước khi nghe</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedGuideTrack(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handlePlayOwnedTrack(activeGuideData);
                                    }}
                                    className={`px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-md flex items-center gap-1.5 active:scale-95 ${
                                        currentTrack?.id === activeGuideData.id && isPlaying
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                            : 'bg-[#9B2528] hover:bg-[#7E1E21] text-white'
                                    }`}
                                >
                                    {currentTrack?.id === activeGuideData.id && isPlaying ? (
                                        <>
                                            <Pause className="w-4 h-4 fill-current" />
                                            <span>Tạm dừng</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            <span>Bắt đầu nghe ngay</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Mua Bản Cao Cấp */}
            {selectedPaidTrack && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
                        <button
                            onClick={() => setSelectedPaidTrack(null)}
                            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mx-auto mb-3 relative w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                            <img
                                src={selectedPaidTrack.coverImageSquare || selectedPaidTrack.coverImage}
                                alt={selectedPaidTrack.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-amber-300">
                                <Lock className="w-6 h-6 drop-shadow" />
                            </div>
                        </div>

                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                {selectedPaidTrack.segment || 'Bản Thôi Miên Cao Cấp'}
                            </span>
                            <h3 className="mt-2.5 text-base sm:text-lg font-black text-slate-900 leading-snug">
                                {selectedPaidTrack.title}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                                {selectedPaidTrack.benefit || selectedPaidTrack.description}
                            </p>
                            <div className="mt-3 text-xl sm:text-2xl font-black text-[#9B2528]">
                                {selectedPaidTrack.price || 'Liên hệ'}
                                {selectedPaidTrack.originalPrice && (
                                    <span className="ml-2 text-xs text-slate-400 line-through font-normal">
                                        {selectedPaidTrack.originalPrice}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 space-y-2">
                            <button
                                onClick={() => {
                                    if (selectedPaidTrack.available === false) {
                                        toast.error('Bản ghi chưa sẵn sàng để bán.');
                                        return;
                                    }
                                    const id = selectedPaidTrack.id;
                                    setSelectedPaidTrack(null);
                                    navigate(`/thanh-toan/${id}`);
                                }}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#9B2528] to-[#801c1f] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:brightness-110 transition shadow-md active:scale-95"
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Thanh toán ngay ({selectedPaidTrack.price})</span>
                            </button>
                            <a
                                href="https://zalo.me/0355067656"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition"
                            >
                                <span>Tư vấn thanh toán qua Zalo</span>
                            </a>
                            {selectedPaidTrack.isAffiliateEnabled !== false && (
                                <button
                                    type="button"
                                    onClick={() => handleGetTrackAffiliateLink(selectedPaidTrack)}
                                    className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                                >
                                    {copiedTrackId === selectedPaidTrack.id ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="text-emerald-700">Đã chép link tiếp thị!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                                            <span>Tiếp thị nhận hoa hồng</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThoiMien;
