import React from 'react';
import ReactPlayer from 'react-player';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
    onMarkComplete
}) => {
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

            {!isNotesMode && <div className="mt-3 md:hidden">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-bold leading-snug text-slate-900">
                        {title || 'Đang cập nhật bài học'}
                    </h2>
                </div>
            </div>}

            <div
                className="mt-4 flex flex-col gap-3 md:flex md:flex-row md:items-center md:justify-between md:gap-4"
            >
                <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto md:flex-wrap md:items-center">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className={`order-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all md:order-none md:justify-start md:rounded-lg md:px-4 md:py-2.5 ${
                            hasPrev
                                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="md:hidden">Trước</span>
                        <span className="hidden md:inline">Bài trước</span>
                    </button>

                    <button
                        onClick={onMarkComplete}
                        className={`order-3 col-span-2 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all md:order-none md:col-span-1 md:w-auto md:rounded-lg md:px-4 md:py-2.5 ${
                            isCompleted
                                ? 'border-green-200 bg-green-100 text-green-700 hover:bg-green-200'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                    >
                        {isCompleted ? (
                            <div className="rounded-full bg-green-600 p-0.5 text-white">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                        ) : (
                            <CheckCircle className="h-5 w-5" />
                        )}
                        <span className="hidden md:inline">
                            {isCompleted ? 'Đã học xong' : 'Đánh dấu hoàn thành'}
                        </span>
                        <span className="md:hidden">
                            {isCompleted ? 'Đã học xong' : 'Đánh dấu hoàn thành'}
                        </span>
                    </button>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className={`order-2 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all md:order-none md:flex-none md:rounded-lg md:py-2.5 ${
                            hasNext
                                ? 'bg-[#B91C1C] text-white shadow-md hover:bg-red-800 hover:shadow-lg'
                                : 'cursor-not-allowed bg-slate-200 text-slate-400'
                        }`}
                    >
                        <span className="hidden md:inline">Bài tiếp theo</span>
                        <span className="md:hidden">Tiếp theo</span>
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

            </div>

            <div className="mt-5 border-b border-slate-200 md:mt-6"></div>
        </div>
    );
};

export default VideoWrapper;
