import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Facebook, Youtube } from 'lucide-react';

import { getYouTubeEmbedUrl } from '../utils/videoUtils';

const TestimonialCard = ({ article }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if there is full content available or if the excerpt is long
    const hasContent = article.content && article.content !== '<p><br></p>' && article.content.trim().length > 0;
    const isLongText = hasContent || article.excerpt.length > 150;

    const embedUrl = getYouTubeEmbedUrl(article.videoUrl);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-secret-gold/10 hover:shadow-xl transition-all duration-300 flex flex-col h-full font-sans"
        >
            <div className="mb-4 text-secret-wax">
                <Quote className="w-8 h-8 opacity-20" />
            </div>

            {/* Media Section: Video or Image */}
            <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-black/5 relative">
                {embedUrl ? (
                    <iframe
                        src={embedUrl}
                        title={article.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        frameBorder="0"
                    ></iframe>
                ) : article.thumbnailUrl ? (
                    <img src={article.thumbnailUrl} alt="Feedback" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        No Media
                    </div>
                )}
            </div>

            <h3 className="font-sans font-bold text-gray-900 text-lg md:text-xl tracking-tight leading-snug mb-3">{article.title}</h3>

            {/* Content Display Logic */}
            {!isExpanded ? (
                // Collapsed State: Show Excerpt with Line Clamp
                <div className="font-sans text-[15px] text-gray-600 leading-[1.75] mb-4 line-clamp-4 min-h-[6rem] space-y-4">
                    "{article.excerpt}"
                </div>
            ) : (
                // Expanded State: Show Full Content (HTML) or Fallback to Excerpt
                <div className="font-sans text-[15px] text-gray-600 leading-[1.75] mb-4 space-y-4">
                    {hasContent ? (
                        <div dangerouslySetInnerHTML={{ __html: article.content }} className="prose prose-sm max-w-none text-gray-600 font-sans leading-[1.75]" />
                    ) : (
                        <div className="whitespace-pre-line">"{article.excerpt}"</div>
                    )}
                </div>
            )}

            {isLongText && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-secret-gold text-xs font-bold uppercase tracking-wide hover:underline mb-6 self-start text-left"
                >
                    {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </button>
            )}

            {!isLongText && <div className="mb-6"></div>}

            <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secret-paper flex items-center justify-center text-secret-gold font-bold text-lg shrink-0">
                        {article.title.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-secret-ink text-sm">Học viên MaliEdu</div>
                        <div className="text-xs text-gray-500">{article.createdAt}</div>
                    </div>
                </div>

                {article.facebookLink ? (
                    <div className="mt-3 pl-[52px]">
                        <a
                            href={article.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors group"
                        >
                            <Facebook className="w-4 h-4 fill-current opacity-80 group-hover:opacity-100" />
                            <span className="text-xs font-bold hover:underline">Xem đầy đủ bài viết chia sẻ</span>
                        </a>
                    </div>
                ) : article.videoUrl ? (
                    <div className="mt-3 pl-[52px]">
                        <a
                            href={article.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 transition-colors group"
                        >
                            <Youtube className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                            <span className="text-xs font-bold hover:underline">Xem đầy đủ video chia sẻ</span>
                        </a>
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
};

export default TestimonialCard;
