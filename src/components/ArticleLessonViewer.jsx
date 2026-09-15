import React, { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    X,
} from 'lucide-react';
import { sanitizeRichHtml } from '../utils/sanitizeHtml';
import {
    getLessonContentTypeLabel,
    getLessonImages,
    lessonHasArticle,
    lessonHasImages,
} from '../utils/lessonContent';

const renderArticleHtml = (content = '') => {
    const source = String(content || '').trim();
    if (!source) return '';

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(source);
    const html = looksLikeHtml ? source : marked.parse(source);
    return sanitizeRichHtml(html);
};

const ArticleLessonViewer = ({
    lesson,
    onNext,
    onPrev,
    hasNext = false,
    hasPrev = false,
    isCompleted = false,
    onMarkComplete,
}) => {
    const [activeImage, setActiveImage] = useState(null);
    const images = useMemo(() => getLessonImages(lesson), [lesson]);
    const articleHtml = useMemo(
        () => renderArticleHtml(lesson?.articleContent),
        [lesson?.articleContent],
    );
    const showArticle = lessonHasArticle(lesson);
    const showImages = lessonHasImages(lesson);

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
                <header className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-red-50/50 px-5 py-5 md:px-10 md:py-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8B2E2E]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 ring-1 ring-red-100">
                            {showImages && !showArticle ? (
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
                </header>

                <div className="px-5 py-6 md:px-10 md:py-9">
                    {showArticle && articleHtml ? (
                        <div
                            className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-a:text-[#8B2E2E] prose-img:rounded-2xl prose-img:shadow-sm"
                            dangerouslySetInnerHTML={{ __html: articleHtml }}
                        />
                    ) : showArticle ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                            Nội dung bài viết đang được cập nhật.
                        </div>
                    ) : null}

                    {showImages && images.length > 0 && (
                        <div className={`${showArticle ? 'mt-8 border-t border-slate-100 pt-8' : ''}`}>
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

                    {showImages && images.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                            Hình ảnh của bài học đang được cập nhật.
                        </div>
                    )}
                </div>
            </article>

            <div className="mt-4 flex flex-col gap-3 px-1 md:hidden">
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
            </div>

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
