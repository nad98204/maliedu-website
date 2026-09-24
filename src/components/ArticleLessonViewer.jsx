import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    FileText,
    Headphones,
    Image as ImageIcon,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { sanitizeRichHtml } from '../utils/sanitizeHtml';
import {
    getLessonContentTypeLabel,
    getLessonAudios,
    getLessonImages,
    LESSON_CONTENT_TYPES,
    lessonHasAudio,
    lessonHasArticle,
    lessonHasImages,
    normalizeLessonContentType,
} from '../utils/lessonContent';

const renderArticleHtml = (content = '') => {
    const source = String(content || '').trim();
    if (!source) return '';

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(source);
    const html = looksLikeHtml ? source : marked.parse(source);
    return sanitizeRichHtml(html);
};

const formatAudioTime = (seconds) => {
    const numericSeconds = Number(seconds);
    if (!Number.isFinite(numericSeconds) || numericSeconds < 0) return '0:00';
    const minutes = Math.floor(numericSeconds / 60);
    const remainder = Math.floor(numericSeconds % 60);
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const ArticleLessonViewer = ({
    lesson,
    onNext,
    onPrev,
    hasNext = false,
    hasPrev = false,
    isCompleted = false,
    onMarkComplete,
    showNavigation = true,
    showHeader = true,
}) => {
    const [activeImage, setActiveImage] = useState(null);
    const [activeAudioIndex, setActiveAudioIndex] = useState(0);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [audioError, setAudioError] = useState('');
    const audioRef = useRef(null);
    const images = useMemo(() => getLessonImages(lesson), [lesson]);
    const audios = useMemo(() => getLessonAudios(lesson), [lesson]);
    const articleHtml = useMemo(
        () => renderArticleHtml(lesson?.articleContent),
        [lesson?.articleContent],
    );
    const showArticle = lessonHasArticle(lesson);
    const showImages = lessonHasImages(lesson);
    const showAudio = lessonHasAudio(lesson) && audios.length > 0;
    const isMixedLesson = normalizeLessonContentType(lesson) === LESSON_CONTENT_TYPES.MIXED;
    const activeAudio = audios[activeAudioIndex] || audios[0];

    useEffect(() => {
        setActiveAudioIndex(0);
        setIsAudioPlaying(false);
        setAudioCurrentTime(0);
        setAudioDuration(0);
        setAudioError('');
    }, [lesson?.id, lesson?.audioUrl]);

    useEffect(() => {
        if (activeAudioIndex < audios.length) return;
        setActiveAudioIndex(0);
    }, [activeAudioIndex, audios.length]);

    const toggleAudioPlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;
        try {
            if (audio.paused) await audio.play();
            else audio.pause();
        } catch (error) {
            console.error('Không thể phát âm thanh bài học:', error);
            setAudioError('Không thể phát tệp âm thanh này. Vui lòng thử mở lại bài học.');
        }
    };

    const seekAudioBy = (offset) => {
        const audio = audioRef.current;
        if (!audio) return;
        const maxTime = Number.isFinite(audio.duration) ? audio.duration : 0;
        audio.currentTime = Math.min(Math.max(audio.currentTime + offset, 0), maxTime);
    };

    const selectAudio = (index) => {
        audioRef.current?.pause();
        setActiveAudioIndex(index);
        setIsAudioPlaying(false);
        setAudioCurrentTime(0);
        setAudioDuration(0);
        setAudioError('');
    };

    useEffect(() => {
        if (!activeImage) return undefined;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setActiveImage(null);
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [activeImage]);

    return (
        <div className="mx-auto w-full max-w-4xl px-3 pt-3 md:px-0 md:pt-0">
            <article className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] md:rounded-[30px]">
                {showHeader && <header className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-red-50/50 px-5 py-5 md:px-10 md:py-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8B2E2E]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 ring-1 ring-red-100">
                            {showAudio ? (
                                <Headphones className="h-3.5 w-3.5" />
                            ) : showImages && !showArticle ? (
                                <ImageIcon className="h-3.5 w-3.5" />
                            ) : (
                                <FileText className="h-3.5 w-3.5" />
                            )}
                            {getLessonContentTypeLabel(lesson)}
                        </span>
                    </div>
                    <h2 className="text-xl font-black leading-tight text-slate-900 md:text-3xl">
                        {lesson?.title || 'Bài học'}
                    </h2>
                </header>}

                <div className="space-y-8 px-5 py-6 md:px-10 md:py-9">
                    {showAudio && activeAudio && (
                        <section className="overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-50/80 via-white to-amber-50/60 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-red-100/70 px-4 py-4 md:px-6">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#8B2E2E] text-white shadow-md shadow-red-200">
                                    <Headphones className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8B2E2E]">Đang nghe</p>
                                    <h3 className="truncate text-sm font-black text-slate-900 md:text-base">
                                        {activeAudio.title || `Bản âm thanh ${activeAudioIndex + 1}`}
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-4 p-4 md:p-6">
                                <audio
                                    key={activeAudio.url}
                                    ref={audioRef}
                                    src={activeAudio.url}
                                    preload="metadata"
                                    muted={isMuted}
                                    onLoadedMetadata={(event) => {
                                        event.currentTarget.playbackRate = playbackRate;
                                        setAudioDuration(event.currentTarget.duration || 0);
                                    }}
                                    onTimeUpdate={(event) => setAudioCurrentTime(event.currentTarget.currentTime || 0)}
                                    onPlay={() => setIsAudioPlaying(true)}
                                    onPause={() => setIsAudioPlaying(false)}
                                    onError={() => setAudioError('Tệp âm thanh không thể tải hoặc đường dẫn đã hết hiệu lực.')}
                                    onEnded={() => {
                                        setIsAudioPlaying(false);
                                        if (activeAudioIndex < audios.length - 1) selectAudio(activeAudioIndex + 1);
                                    }}
                                />

                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                                    <span className="w-10 text-right tabular-nums">{formatAudioTime(audioCurrentTime)}</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={audioDuration || 0}
                                        step="0.1"
                                        value={Math.min(audioCurrentTime, audioDuration || 0)}
                                        onChange={(event) => {
                                            const value = Number(event.target.value);
                                            if (audioRef.current) audioRef.current.currentTime = value;
                                            setAudioCurrentTime(value);
                                        }}
                                        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#8B2E2E]"
                                        aria-label="Vị trí phát âm thanh"
                                    />
                                    <span className="w-10 tabular-nums">{formatAudioTime(audioDuration)}</span>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <button type="button" onClick={() => seekAudioBy(-10)} className="rounded-xl bg-white p-2.5 text-slate-600 ring-1 ring-slate-200 transition hover:text-[#8B2E2E]" aria-label="Lùi 10 giây">
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={toggleAudioPlayback} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B2E2E] text-white shadow-lg shadow-red-200 transition hover:bg-[#712323]" aria-label={isAudioPlaying ? 'Tạm dừng' : 'Phát âm thanh'}>
                                        {isAudioPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                                    </button>
                                    <button type="button" onClick={() => seekAudioBy(10)} className="rounded-xl bg-white p-2.5 text-slate-600 ring-1 ring-slate-200 transition hover:text-[#8B2E2E]" aria-label="Tiến 10 giây">
                                        <RotateCw className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => setIsMuted((current) => !current)} className="rounded-xl bg-white p-2.5 text-slate-600 ring-1 ring-slate-200 transition hover:text-[#8B2E2E]" aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                    </button>
                                    <select
                                        value={playbackRate}
                                        onChange={(event) => {
                                            const rate = Number(event.target.value);
                                            setPlaybackRate(rate);
                                            if (audioRef.current) audioRef.current.playbackRate = rate;
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 outline-none focus:border-[#8B2E2E]"
                                        aria-label="Tốc độ phát"
                                    >
                                        {[0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}x</option>)}
                                    </select>
                                </div>

                                {audioError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700">{audioError}</p>}

                                {audios.length > 1 && (
                                    <div className="grid gap-2 border-t border-red-100/70 pt-4 sm:grid-cols-2">
                                        {audios.map((audio, index) => (
                                            <button key={audio.id || audio.url} type="button" onClick={() => selectAudio(index)} className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${index === activeAudioIndex ? 'bg-[#8B2E2E] text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[#8B2E2E]'}`}>
                                                <Headphones className="h-4 w-4 shrink-0" />
                                                <span className="min-w-0 flex-1 truncate">{audio.title || `Bản âm thanh ${index + 1}`}</span>
                                                {audio.duration && <span className="shrink-0 text-[10px] opacity-70">{audio.duration}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                    {showArticle && articleHtml ? (
                        <div
                            className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-a:text-[#8B2E2E] prose-img:rounded-2xl prose-img:shadow-sm"
                            dangerouslySetInnerHTML={{ __html: articleHtml }}
                        />
                    ) : showArticle && !isMixedLesson ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                            Nội dung bài viết đang được cập nhật.
                        </div>
                    ) : null}

                    {showImages && images.length > 0 && (
                        <div>
                            <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {images.map((imageUrl, index) => (
                                    <button
                                        key={`${imageUrl}-${index}`}
                                        type="button"
                                        onClick={() => setActiveImage(imageUrl)}
                                        className={`group overflow-hidden rounded-2xl bg-slate-100 text-left ring-1 ring-slate-200 transition hover:ring-[#8B2E2E]/40 ${
                                            images.length > 2 && index === 0 ? 'col-span-2' : ''
                                        }`}
                                        aria-label={`Mở ảnh ${index + 1}`}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`${lesson?.title || 'Bài học'} - ảnh ${index + 1}`}
                                            className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
                                                images.length === 1 ? 'max-h-[720px]' : 'aspect-[4/3]'
                                            }`}
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showImages && images.length === 0 && !isMixedLesson && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                            Hình ảnh của bài học đang được cập nhật.
                        </div>
                    )}
                </div>
            </article>

            {showNavigation && <div className="mt-4 flex flex-col gap-3 px-1 md:hidden">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[13px] font-extrabold ${hasPrev ? 'border-slate-200 bg-white text-slate-700 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
                    >
                        <ChevronLeft className="h-4 w-4" /> Bài trước
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!hasNext}
                        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-extrabold ${hasNext ? 'bg-[#B91C1C] text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}
                    >
                        Tiếp theo <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onMarkComplete}
                    className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border px-6 py-3.5 text-[13px] font-extrabold ${isCompleted ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 shadow-sm'}`}
                >
                    <CheckCircle className={`h-4 w-4 ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
                    {isCompleted ? 'Đã học xong bài này' : 'Tôi đã học xong bài này'}
                </button>
            </div>}

            {activeImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-sm md:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Xem ảnh bài học"
                    onClick={() => setActiveImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setActiveImage(null)}
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                        aria-label="Đóng ảnh"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={activeImage}
                        alt={lesson?.title || 'Ảnh bài học'}
                        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ArticleLessonViewer;
