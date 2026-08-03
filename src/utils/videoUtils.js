const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_VIDEO_ID_PATTERN = /^\d{10,25}$/;

const parseHttpsUrl = (value) => {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url : null;
    } catch {
        return null;
    }
};

const isHostOrSubdomain = (hostname, domain) => (
    hostname === domain || hostname.endsWith(`.${domain}`)
);

export const getYouTubeVideoId = (value) => {
    const url = parseHttpsUrl(value);
    if (!url) return '';

    const hostname = url.hostname.toLowerCase();
    let candidate = '';

    if (hostname === 'youtu.be') {
        candidate = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (
        isHostOrSubdomain(hostname, 'youtube.com')
        || isHostOrSubdomain(hostname, 'youtube-nocookie.com')
    ) {
        candidate = url.searchParams.get('v') || '';
        if (!candidate) {
            const pathMatch = /^\/(?:embed|live|shorts|v)\/([^/?#]+)/i.exec(url.pathname);
            candidate = pathMatch?.[1] || '';
        }
    }

    return YOUTUBE_VIDEO_ID_PATTERN.test(candidate) ? candidate : '';
};

export const isYouTubeShortUrl = (value) => {
    const url = parseHttpsUrl(value);
    return Boolean(
        url
        && isHostOrSubdomain(url.hostname.toLowerCase(), 'youtube.com')
        && /^\/shorts\//i.test(url.pathname)
        && getYouTubeVideoId(value)
    );
};

export const getYouTubeEmbedUrl = (value) => {
    const videoId = getYouTubeVideoId(value);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export const isYouTubeUrl = (value) => Boolean(getYouTubeVideoId(value));

export const getYouTubeThumbnailUrl = (value) => {
    const videoId = getYouTubeVideoId(value);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
};

export const isTikTokUrl = (value) => {
    const url = parseHttpsUrl(value);
    return Boolean(url && isHostOrSubdomain(url.hostname.toLowerCase(), 'tiktok.com'));
};

export const getTikTokVideoId = (value) => {
    const url = parseHttpsUrl(value);
    if (!url || !isTikTokUrl(value)) return '';

    const pathMatch = /\/(?:video|v|player\/v1|embed\/v2)\/(\d{10,25})(?:\/|$)/i.exec(url.pathname);
    const candidate = pathMatch?.[1] || '';
    return TIKTOK_VIDEO_ID_PATTERN.test(candidate) ? candidate : '';
};

export const getTikTokEmbedUrl = (value) => {
    const videoId = getTikTokVideoId(value);
    return videoId ? `https://www.tiktok.com/player/v1/${videoId}` : null;
};

export const getVideoEmbedData = (value) => {
    const youtubeEmbedUrl = getYouTubeEmbedUrl(value);
    if (youtubeEmbedUrl) {
        return {
            provider: 'youtube',
            embedUrl: youtubeEmbedUrl,
            externalUrl: String(value).trim(),
            isVertical: isYouTubeShortUrl(value),
            isExternalOnly: false,
        };
    }

    if (isTikTokUrl(value)) {
        const embedUrl = getTikTokEmbedUrl(value);
        return {
            provider: 'tiktok',
            embedUrl,
            externalUrl: String(value).trim(),
            isVertical: true,
            isExternalOnly: !embedUrl,
        };
    }

    return null;
};

export const isSupportedVideoUrl = (value) => Boolean(getVideoEmbedData(value));

export const isVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
};
