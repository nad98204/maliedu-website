import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Lock, Play, Settings } from 'lucide-react';

const VideoWrapper = ({
    videoUrl,
    title,
    onEnded,
    onDuration,
    onProgress,
    playing,
    setPlaying,
    onNext,
    onPrev,
    hasPrev,
    hasNext,
    isCompleted,
    onMarkComplete,
    sections = [],
    currentLessonId,
    onLessonSelect,
    isPreviewMode = false,
    previewableLessonKeys = [],
    children
}) => {
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [isQualityOpen, setIsQualityOpen] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState('720p');

    const parseVideoUrl = (url) => {
        if (!url) return { default: null, qualities: {} };
        
        // Handle JSON format: {"720p": "url1", "1080p": "url2"}
        if (url.trim().startsWith('{')) {
            try {
                const qualities = JSON.parse(url);
                const keys = Object.keys(qualities);
                return { 
                    default: qualities[selectedQuality] || qualities[keys[0]], 
                    qualities 
                };
            } catch (e) {
                console.error('Error parsing video qualities JSON:', e);
            }
        }

        // Handle Comma format: 720p:url1,1080p:url2
        if (url.includes(':http') && url.includes(',')) {
            const parts = url.split(',');
            const qualities = {};
            parts.forEach(p => {
                const [label, ...srcParts] = p.split(':');
                if (label && srcParts.length > 0) {
                    qualities[label.trim()] = srcParts.join(':').trim();
                }
            });
            const keys = Object.keys(qualities);
            return { 
                default: qualities[selectedQuality] || qualities[keys[0]], 
                qualities 
            };
        }

        return { default: url.trim(), qualities: {} };
    };

    const videoData = parseVideoUrl(videoUrl);
    const currentUrl = videoData.qualities[selectedQuality] || videoData.default;

    const getPlayableUrl = (url) => {
        if (!url) return null;
        const cleanUrl = url.trim();
        if (cleanUrl.startsWith('<iframe') && cleanUrl.includes('src="')) {
            const match = cleanUrl.match(/src="([^"]+)"/);
            if (match?.[1]) return match[1];
        }
        const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;
        if (ytIdRegex.test(cleanUrl)) {
            return `https://www.youtube.com/watch?v=${cleanUrl}`;
        }
        if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('//') && cleanUrl.includes('.') && !cleanUrl.includes(' ')) {
            return `https://${cleanUrl}`;
        }
        return cleanUrl;
    };

    const isVideoFile = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);
    const isHLS = (url) => url.includes('.m3u8');
    const playableUrl = getPlayableUrl(currentUrl);
    const isFile = playableUrl && isVideoFile(playableUrl);
    const useHLS = playableUrl && isHLS(playableUrl);
    const activeSections = sections.filter(
        (section) => (section.lessons || []).length > 0
    );
    const previewableLessonKeySet = new Set(previewableLessonKeys);

    return (
        <div className="mx-auto w-full max-w-6xl" onContextMenu={(e) => e.preventDefault()}>
            {/* 
                Video Sticky Container:
                Dùng flex-shrink-0 để đảm bảo container này KHÔNG BAO GIỜ bị ép nhỏ chiều cao 
                khi keyboard hiện lên và làm layout viewport thay đổi.
            */}
            <div 
                className="sticky top-0 z-20 -mx-3 shrink-0 bg-slate-100/90 px-3 pb-2 pt-3 backdrop-blur-md md:static md:m-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
                style={{ transform: 'translateZ(0)' }}
            >
                <div className="rounded-[24px] border border-slate-200/60 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:rounded-3xl md:p-3">
                    {/* 
                        Khóa cứng aspectRatio và min-height để trình duyệt 
                        không thể render Video mỏng/xẹp (biến dạng).
                    */}
                    <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-sm" style={{ aspectRatio: '16/9', minHeight: '180px' }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {(isFile && !useHLS) ? (
                                <video
                                    key={playableUrl} // Force re-render on URL change
                                    src={playableUrl}
                                    className="h-full w-full object-contain"
                                    controls
                                    playsInline
                                    autoPlay={playing}
                                    preload="auto"
                                    controlsList="nodownload"
                                    onContextMenu={(e) => e.preventDefault()}
                                    onEnded={onEnded}
                                    onTimeUpdate={(e) => onProgress?.({ playedSeconds: e.target.currentTime })}
                                    onLoadedMetadata={(e) => onDuration?.(e.target.duration)}
                                    onPlay={() => setPlaying(true)}
                                    onPause={() => setPlaying(false)}
                                    onError={(e) => console.error('Native Video Error:', e)}
                                />
                            ) : (
                                <ReactPlayer
                                    url={playableUrl}
                                    width="100%"
                                    height="100%"
                                    playing={playing}
                                    controls
                                    playsinline
                                    pip
                                    stopOnUnmount={false}
                                    onError={(error) => console.error('ReactPlayer Error:', error)}
                                    onEnded={onEnded}
                                    onDuration={onDuration}
                                    onProgress={onProgress}
                                    onPlay={() => setPlaying(true)}
                                    onPause={() => setPlaying(false)}
                                    config={{ 
                                        youtube: { playerVars: { showinfo: 1, rel: 0 } },
                                        file: { 
                                            forceHLS: useHLS,
                                            attributes: {
                                                preload: 'auto',
                                                controlsList: 'nodownload',
                                                style: { width: '100%', height: '100%', objectFit: 'contain' }
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Quality Selector (if multiple qualities exist) */}
                {Object.keys(videoData.qualities).length > 0 && (
                    <div className="mt-2 flex justify-end px-2">
                        <div className="relative">
                            <button
                                onClick={() => setIsQualityOpen(!isQualityOpen)}
                                className="flex items-center gap-1.5 rounded-full bg-slate-800/10 px-3 py-1.5 text-xs font-bold text-slate-700 backdrop-blur-sm transition-all hover:bg-slate-800/20"
                            >
                                <Settings className={`h-3.5 w-3.5 ${isQualityOpen ? 'rotate-90' : ''} transition-transform`} />
                                <span>{selectedQuality}</span>
                            </button>
                            
                            {isQualityOpen && (
                                <div className="absolute right-0 bottom-full mb-2 z-50 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 mb-1">
                                        Chất lượng
                                    </div>
                                    {Object.keys(videoData.qualities).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                setSelectedQuality(q);
                                                setIsQualityOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                                                selectedQuality === q ? 'bg-red-50 text-[#B91C1C]' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {q}
                                            {selectedQuality === q && <CheckCircle className="h-3.5 w-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 md:px-0">
                <div className="mt-2 md:hidden">
                    <button
                        onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                            className="w-full rounded-3xl border border-slate-100 bg-white px-4 py-3.5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:bg-slate-50 active:scale-[0.98]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <span className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#B91C1C]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#B91C1C] animate-pulse"></span>
                                        Đang phát bài giảng
                                    </span>
                                    <h2 className="text-sm font-bold leading-relaxed text-slate-800">
                                        {title || 'Đang cập nhật bài học'}
                                    </h2>
                                </div>
                                <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div className={`mt-2 overflow-hidden transition-all duration-300 ${isSwitcherOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 invisible'}`}>
                            <div className="max-h-[400px] overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                                {activeSections.map((section, sIdx) => {
                                    const hasSectionTitle = Boolean(section.title?.trim());

                                    return (
                                    <div key={sIdx} className="border-b border-slate-50 py-1 last:border-0">
                                        <div className="flex items-center justify-between border-b border-slate-100/50 bg-slate-50/80 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <span>{hasSectionTitle ? section.title : 'Bài học lẻ'}</span>
                                            {!hasSectionTitle && (
                                                <span className="text-[10px] font-medium normal-case tracking-normal text-slate-400">
                                                    {(section.lessons || []).length} bài học
                                                </span>
                                            )}
                                        </div>
                                        <div className="py-1">
                                            {(section.lessons || []).map((lesson, lIdx) => {
                                                const lessonKey = lesson.id || lesson.videoId;
                                                const isActive = lessonKey === currentLessonId;
                                                const isLocked =
                                                    isPreviewMode &&
                                                    !previewableLessonKeySet.has(lessonKey);
                                                return (
                                                    <button
                                                        key={lIdx}
                                                        onClick={() => { onLessonSelect?.(lesson); setIsSwitcherOpen(false); }}
                                                        className={`mx-2 my-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-4 py-3 text-left normal-case tracking-normal transition-all ${isActive ? 'border-l-4 border-[#B91C1C] bg-red-50/60 text-[#B91C1C] font-extrabold' : isLocked ? 'bg-slate-50/80 text-slate-500 hover:bg-amber-50 hover:text-amber-700' : 'text-slate-600 font-medium hover:bg-slate-50/80 hover:text-slate-900'}`}
                                                    >
                                                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-[#B91C1C] text-white shadow-md shadow-red-500/20' : 'bg-slate-50 text-slate-400'}`}>
                                                            {isActive ? (
                                                                <Play className="h-3 w-3 fill-current" />
                                                            ) : isLocked ? (
                                                                <Lock className="h-3 w-3" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold">{lIdx + 1}</span>
                                                            )}
                                                        </div>
                                                        <span className="min-w-0 flex-1 text-sm">{lesson.title}</span>
                                                        {isLocked && (
                                                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-700">
                                                                Đăng ký
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:hidden">
                    <div className="flex flex-col w-full gap-3 md:flex-row md:items-center md:gap-4">
                        <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                            <button
                                onClick={onPrev}
                                disabled={!hasPrev}
                                className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[13px] font-extrabold active:scale-95 ${hasPrev ? 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>{hasPrev ? 'Bài trước' : 'Trước'}</span>
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!hasNext}
                                className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-extrabold shadow-md active:scale-95 ${hasNext ? 'bg-[#B91C1C] text-white shadow-red-500/10 hover:bg-red-800' : 'bg-slate-100 text-slate-300 shadow-none'}`}
                            >
                                <span>Tiếp theo</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <button
                            onClick={onMarkComplete}
                            className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border px-6 py-3.5 text-[13px] font-extrabold active:scale-[0.98] ${isCompleted ? 'border-emerald-100 bg-emerald-50/60 text-emerald-700 shadow-sm shadow-emerald-100/50 hover:bg-emerald-100/80' : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50'}`}
                        >
                            <CheckCircle className={`h-4.5 w-4.5 ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span>{isCompleted ? 'Đã học xong bài này' : 'Tôi đã học xong bài này'}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-5 border-b border-slate-200 md:mt-6" />
                {children}
            </div>
        </div>
    );
};

export default VideoWrapper;
