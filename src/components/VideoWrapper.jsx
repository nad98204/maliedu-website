import React from 'react';
import ReactPlayer from 'react-player';
import { ChevronLeft, ChevronRight, PlayCircle, PauseCircle, CheckCircle } from 'lucide-react';

const VideoWrapper = ({
    videoUrl,
    onEnded,
    onDuration,
    onProgress,
    playing,
    setPlaying,
    autoPlay,
    setAutoPlay,
    onNext,
    onPrev,
    hasPrev,
    hasNext,
    title,
    isCompleted,
    onMarkComplete
}) => {
    const getPlayableUrl = (url) => {
        if (!url) return null;
        let cleanUrl = url.trim();

        // 1. Iframe extraction
        if (cleanUrl.startsWith('<iframe') && cleanUrl.includes('src="')) {
            const match = cleanUrl.match(/src="([^"]+)"/);
            if (match && match[1]) return match[1];
        }

        // 2. Raw YouTube ID (11 chars, no slash, no dot)
        // Prevents matching "example.com"
        const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;
        if (ytIdRegex.test(cleanUrl)) {
            return `https://www.youtube.com/watch?v=${cleanUrl}`;
        }

        // 3. Missing protocol (e.g. "youtu.be/ID", "vimeo.com/ID")
        // If it has a dot, no spaces, and starts with alphanumeric
        if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('//') && cleanUrl.includes('.') && !cleanUrl.includes(' ')) {
            return `https://${cleanUrl}`;
        }

        return cleanUrl;
    };

    const isVideoFile = (url) => {
        return /\.(mp4|webm|ogg|mov)$/i.test(url);
    };

    const playableUrl = getPlayableUrl(videoUrl);
    const isFile = playableUrl && isVideoFile(playableUrl);

    return (
        <div className="w-full max-w-5xl mx-auto" onContextMenu={(e) => e.preventDefault()}>
            {/* Cinema Wrapper - Added white bg and padding */}
            <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
                <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden shadow-sm">
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isFile ? (
                            <video
                                src={playableUrl}
                                className="w-full h-full object-contain"
                                controls
                                controlsList="nodownload" // Prevent download button
                                onContextMenu={(e) => e.preventDefault()} // Prevent right-click save
                                autoPlay={autoPlay}
                                onEnded={onEnded}
                                onTimeUpdate={(e) => {
                                    if (onProgress) onProgress({ playedSeconds: e.target.currentTime });
                                }}
                                onLoadedMetadata={(e) => {
                                    if (onDuration) onDuration(e.target.duration);
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
                                controls={true}
                                onError={(e) => console.error("ReactPlayer Error:", e)}
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

            {/* Controls Bar */}
            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Navigation */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all border ${hasPrev
                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Bài trước</span>
                    </button>

                    {/* Mark Complete Button */}
                    <button
                        onClick={onMarkComplete}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all border ${isCompleted
                            ? 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                    >
                        {isCompleted ? (
                            <div className="bg-green-600 text-white rounded-full p-0.5">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                        ) : (
                            <CheckCircle className="w-5 h-5" />
                        )}
                        <span className="hidden md:inline">{isCompleted ? 'Đã học xong' : 'Đánh dấu hoàn thành'}</span>
                        <span className="md:hidden">{isCompleted ? 'Xong' : 'Đánh dấu'}</span>
                    </button>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex-1 md:flex-none justify-center ${hasNext
                            ? 'bg-[#B91C1C] text-white hover:bg-red-800 shadow-md hover:shadow-lg'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <span className="hidden md:inline">Bài tiếp theo</span>
                        <span className="md:hidden">Bài tiếp</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Auto Play Switch */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm font-medium text-slate-600">Tự động chuyển bài</span>
                    <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${autoPlay ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${autoPlay ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>
            </div>

            <div className="mt-6 border-b border-slate-200"></div>
        </div>
    );
};

export default VideoWrapper;
