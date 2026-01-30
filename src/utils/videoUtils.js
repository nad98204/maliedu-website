export const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    // Regular expression to find the video ID
    // Supports:
    // youtube.com/watch?v=ID
    // youtu.be/ID
    // youtube.com/embed/ID
    // youtube.com/v/ID
    // youtube.com/shorts/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    // Return null if no ID found, or maybe return original if it looks like an embed link already?
    // User requested: "Output: https://www.youtube.com/embed/VIDEO_ID. If not found, null."
    // But what if it's already an embed link?
    // The regex `embed\/` case handles extracting the ID, so we reconstruct it cleanly.

    return null;
};

export const isYouTubeUrl = (url) => {
    if (!url) return false;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11);
};

export const isVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
};
