import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const VideoWrapper = ({
    videoUrl,
    title,
    isNotesMode = false,
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
    children
}) => {
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    
    const getPlayableUrl = (url) => {
// helper functions...
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

        if (
            !cleanUrl.startsWith('http') &&
            !cleanUrl.startsWith('//') &&
            cleanUrl.includes('.') &&
            !cleanUrl.includes(' ')
        ) {
            return `https://${cleanUrl}`;
        }

        return cleanUrl;
    };

    const isVideoFile = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);

    const playableUrl = getPlayableUrl(videoUrl);
    const isFile = playableUrl && isVideoFile(playableUrl);

    return (
        <div className="mx-auto w-full max-w-5xl" onContextMenu={(e) => e.preventDefault()}>
            {/* Thanh Video: Chỉ cố định phần Video Player ở mobile, Title và Nav bên dưới sẽ cuộn đi */}
            <div className="sticky top-0 z-20 -mx-3 bg-slate-100 px-3 pb-2 pt-3 md:static md:m-0 md:bg-transparent md:p-0">
                <div className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-lg md:rounded-2xl">
                    <div className="relative overflow-hidden rounded-xl bg-black shadow-sm">
                        <div className="pt-[56.25%]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {isFile ? (
                                <video
                                    src={playableUrl}
                                    className="h-full w-full object-contain"
                                    controls
                                    controlsList="nodownload"
                                    onContextMenu={(e) => e.preventDefault()}
                                    onEnded={onEnded}
                                    onTimeUpdate={(e) => {
                                        if (onProgress) {
                                            onProgress({ playedSeconds: e.target.currentTime });
                                        }
                                    }}
                                    onLoadedMetadata={(e) => {
                                        if (onDuration) {
                                            onDuration(e.target.duration);
                                        }
                                    }}
                                    onPlay={() => setPlaying(true)}
                                    onPause={() => setPlaying(false)}
                                />
                            ) : (
                                <ReactPlayer
                                    url={playableUrl}
                                    width="100%"
                                    height="100%"
                                    playing={playing}
                                    controls
                                    onError={(error) => console.error('ReactPlayer Error:', error)}
                                    onEnded={onEnded}
                                    onDuration={onDuration}
                                    onProgress={onProgress}
                                    onPlay={() => setPlaying(true)}
                                    onPause={() => setPlaying(false)}
                                    config={{
                                        youtube: {
                                            playerVars: { showinfo: 1 }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-0">
                {!isNotesMode && (
                    <div className="mt-2 md:hidden">
                        <button 
                            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                            className="w-full text-left rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-sm font-bold leading-relaxed text-slate-800">
                                    {title || 'Đang cập nhật bài học'}
                                </h2>
                                <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>

                        {/* Quick Lesson Switcher */}
                        <div className={`mt-2 overflow-hidden transition-all duration-300 ${isSwitcherOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 invisible'}`}>
                            <div className="rounded-2xl border border-slate-100 bg-white shadow-lg overflow-y-auto max-h-[400px] custom-scrollbar">
                                {sections.map((section, sIdx) => (
                                    <div key={sIdx} className="border-b border-slate-50 last:border-0">
                                        <div className="bg-slate-50/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            {section.title}
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {(section.lessons || []).map((lesson, lIdx) => {
                                                const lessonId = lesson.id || lesson.videoId;
                                                const isActive = lessonId === currentLessonId;
                                                return (
                                                    <button
                                                        key={lIdx}
                                                        onClick={() => {
                                                            onLessonSelect?.(lesson);
                                                            setIsSwitcherOpen(false);
                                                        }}
                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-red-50 text-[#B91C1C]' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-[#B91C1C] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {isActive ? <Play className="h-3 w-3 fill-current" /> : <span className="text-[10px] font-bold">{lIdx + 1}</span>}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isActive ? 'font-bold' : 'text-slate-600'}`}>{lesson.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 font-inter">
                    <div className="flex flex-col w-full gap-3 md:flex-row md:items-center md:gap-4">
                        {/* Hàng trên: Bài trước & Bài tiếp theo */}
                        <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                            <button
                                onClick={onPrev}
                                disabled={!hasPrev}
                                className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[13px] font-bold transition-all active:scale-95 ${
                                    hasPrev
                                        ? 'border-slate-100 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                                        : 'cursor-not-allowed border-slate-50 bg-slate-50 text-slate-300'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>{hasPrev ? 'Bài trước' : 'Trước'}</span>
                            </button>

                            <button
                                onClick={onNext}
                                disabled={!hasNext}
                                className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-bold transition-all shadow-md active:scale-95 ${
                                    hasNext
                                        ? 'bg-[#B91C1C] text-white shadow-[#B91C1C]/20 hover:bg-red-800'
                                        : 'cursor-not-allowed bg-slate-100 text-slate-300 shadow-none'
                                }`}
                            >
                                <span>Tiếp theo</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Nút chính: Đánh dấu hoàn thành */}
                        <button
                            onClick={onMarkComplete}
                            className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border px-6 py-3.5 text-[13px] font-extrabold transition-all active:scale-[0.98] ${
                                isCompleted
                                    ? 'border-green-100 bg-green-50 text-green-700 shadow-sm shadow-green-100/50 hover:bg-green-100'
                                    : 'border-slate-100 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 border-dashed'
                            }`}
                        >
                            {isCompleted ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white shadow-sm shadow-green-600/30">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                </div>
                            ) : (
                                <CheckCircle className={`h-4.5 w-4.5 transition-colors ${isCompleted ? 'text-green-600' : 'text-slate-300'}`} />
                            )}
                            <span>
                                {isCompleted ? 'Đã học xong bài này' : 'Tôi đã học xong bài này'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="mt-5 border-b border-slate-200 md:mt-6"></div>
                {children}
            </div>
        </div>
    );
};

export default VideoWrapper;
