import { useEffect, useMemo, useRef } from 'react';

let apiPromise;
const loadYouTubeApi = () => {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
        const previousReady = window.onYouTubeIframeAPIReady;
        const timer = window.setTimeout(() => {
            apiPromise = null;
            reject(new Error('YouTube phản hồi quá lâu. Vui lòng thử tải lại video.'));
        }, 30000);
        window.onYouTubeIframeAPIReady = () => {
            window.clearTimeout(timer);
            previousReady?.();
            resolve(window.YT);
        };
        let script = document.querySelector('script[data-course-youtube-api]');
        if (!script) {
            script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.dataset.courseYoutubeApi = 'true';
            document.head.appendChild(script);
        }
        script.addEventListener('error', () => {
            window.clearTimeout(timer);
            apiPromise = null;
            script.remove();
            reject(new Error('Không kết nối được YouTube. Vui lòng kiểm tra mạng và thử lại.'));
        }, { once: true });
    });
    return apiPromise;
};

const youtubeErrorMessage = (code) => {
    if (code === 100) return 'Video YouTube đã bị xóa hoặc đang ở chế độ riêng tư.';
    if (code === 101 || code === 150) return 'Video này chưa cho phép nhúng. Quản trị viên cần bật “Cho phép nhúng” trên YouTube.';
    if (code === 153) return 'YouTube chưa xác nhận được trang phát video. Vui lòng tải lại trang học.';
    return 'Không mở được video YouTube. Vui lòng thử lại hoặc báo quản trị viên kiểm tra video.';
};

export default function YouTubeLessonPlayer({ videoId, title, playing, setPlaying, onReady, onBuffering, onError, onEnded, onDuration, onTimeUpdate }) {
    const hostRef = useRef(null);
    const playerRef = useRef(null);
    const callbacks = useRef({});
    useEffect(() => {
        callbacks.current = { setPlaying, onReady, onBuffering, onError, onEnded, onDuration, onTimeUpdate };
    }, [setPlaying, onReady, onBuffering, onError, onEnded, onDuration, onTimeUpdate]);

    const embedUrl = useMemo(() => {
        const params = new URLSearchParams({
            enablejsapi: '1', playsinline: '1', controls: '1', rel: '0',
            origin: typeof window === 'undefined' ? '' : window.location.origin,
        });
        return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    }, [videoId]);

    useEffect(() => {
        let disposed = false;
        let player;
        let clock;
        // The SDK owns this subtree, so destroying a player cannot remove a
        // React-owned node (including during StrictMode's setup/cleanup cycle).
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.title = title || 'Video bài học YouTube';
        iframe.className = 'h-full w-full border-0';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        hostRef.current.replaceChildren(iframe);
        loadYouTubeApi().then(YT => {
            if (disposed) return;
            player = new YT.Player(iframe, {
                events: {
                    onReady: event => {
                        if (disposed) return;
                        playerRef.current = event.target;
                        callbacks.current.onReady?.();
                        callbacks.current.onDuration?.(event.target.getDuration());
                    },
                    onStateChange: event => {
                        if (disposed) return;
                        if (event.data === 1) {
                            callbacks.current.onReady?.();
                            callbacks.current.setPlaying?.(true);
                        } else if (event.data === 2) {
                            callbacks.current.setPlaying?.(false);
                        } else if (event.data === 3) {
                            callbacks.current.onBuffering?.();
                        } else if (event.data === 0) {
                            callbacks.current.setPlaying?.(false);
                            callbacks.current.onEnded?.();
                        }
                    },
                    onError: event => {
                        if (!disposed) callbacks.current.onError?.(youtubeErrorMessage(event.data));
                    },
                },
            });
            clock = window.setInterval(() => {
                if (disposed || playerRef.current?.getPlayerState() !== 1) return;
                callbacks.current.onTimeUpdate?.({ currentTarget: { currentTime: playerRef.current.getCurrentTime() } });
            }, 1000);
        }).catch(error => {
            if (!disposed) callbacks.current.onError?.(error.message);
        });
        return () => {
            disposed = true;
            window.clearInterval(clock);
            playerRef.current = null;
            player?.destroy();
            iframe.remove();
        };
    }, [embedUrl, title]);

    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;
        if (playing && player.getPlayerState() !== 1) player.playVideo();
        else if (!playing && player.getPlayerState() === 1) player.pauseVideo();
    }, [playing]);

    return <div ref={hostRef} className="h-full w-full" />;
}
