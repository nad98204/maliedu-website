import React from 'react';
import { getYouTubeEmbedUrl } from '../utils/videoUtils';
import { AlertTriangle } from 'lucide-react';

const BlockContentRenderer = ({ data }) => {
    if (!data || !data.blocks) return null;

    return (
        <div className="block-content-wrapper">
            {data.blocks.map((block) => {
                const { id, type, data: blockData } = block;

                switch (type) {
                    case 'header':
                        const HeadingTag = `h${blockData.level}`;
                        return (
                            <HeadingTag key={id} className={`font-serif font-bold text-gray-900 mt-8 mb-4 ${blockData.level === 1 ? 'text-4xl' :
                                blockData.level === 2 ? 'text-3xl' :
                                    blockData.level === 3 ? 'text-2xl' : 'text-xl'
                                }`}>
                                <span dangerouslySetInnerHTML={{ __html: blockData.text }} />
                            </HeadingTag>
                        );

                    case 'paragraph':
                        // If text is empty or just a line break, render a spacer
                        // Aggressively clean text: remove html tags, nbsp, line breaks
                        const rawText = blockData.text || '';
                        const cleanText = rawText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, '').trim();

                        if (!cleanText) {
                            // Render a distinct spacer. using h-6 (24px) for moderate spacing
                            return <div key={id} className="h-6 w-full" aria-hidden="true" />;
                        }
                        return (
                            <p
                                key={id}
                                className={`font-sans text-gray-700 leading-relaxed text-lg mb-4 ${blockData.className || ''}`}
                                dangerouslySetInnerHTML={{ __html: blockData.text }}
                            />
                        );

                    case 'list':
                        const ListTag = blockData.style === 'ordered' ? 'ol' : 'ul';
                        return (
                            <ListTag key={id} className={`list-outside ml-6 mb-6 font-sans text-lg text-gray-700 ${blockData.style === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
                                {blockData.items.map((item, index) => {
                                    // Handle case where item might be an object (nested or rich text)
                                    const itemContent = typeof item === 'string' ? item : (item.content || item.text || JSON.stringify(item));
                                    return (
                                        <li key={`${id}-${index}`} className="mb-2 pl-2" dangerouslySetInnerHTML={{ __html: itemContent }} />
                                    )
                                })}
                            </ListTag>
                        );

                    case 'image':
                        return (
                            <figure key={id} className="my-8">
                                <div className={`rounded-xl overflow-hidden shadow-lg ${blockData.withBackground ? 'bg-gray-100 p-4' : ''} ${blockData.withBorder ? 'border border-gray-200' : ''}`}>
                                    <img
                                        src={blockData.file.url}
                                        alt={blockData.caption || ''}
                                        className={`w-full h-auto object-cover ${blockData.stretched ? 'w-full' : ''}`}
                                    />
                                </div>
                                {blockData.caption && (
                                    <figcaption className="text-center text-sm text-gray-500 italic mt-3">
                                        <span dangerouslySetInnerHTML={{ __html: blockData.caption }} />
                                    </figcaption>
                                )}
                            </figure>
                        );

                    case 'quote':
                        return (
                            <figure key={id} className="my-8">
                                <blockquote className={`border-l-4 border-secret-wax pl-6 py-2 bg-gray-50 italic text-xl text-gray-800 font-serif ${blockData.alignment === 'center' ? 'text-center border-l-0 border-t-4 pt-6' : ''}`}>
                                    <div dangerouslySetInnerHTML={{ __html: blockData.text }} />
                                </blockquote>
                                {blockData.caption && (
                                    <figcaption className={`mt-2 text-sm font-bold text-gray-600 ${blockData.alignment === 'center' ? 'text-center' : 'pl-6'}`}>
                                        — <span dangerouslySetInnerHTML={{ __html: blockData.caption }} />
                                    </figcaption>
                                )}
                            </figure>
                        );

                    case 'embed':
                        let embedUrl = blockData.embed;
                        if (blockData.service === 'youtube') {
                            // handled by editor.js output usually
                        }

                        return (
                            <div key={id} className="my-8 aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black">
                                <iframe
                                    src={embedUrl}
                                    title="Embedded Content"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                {blockData.caption && <div className="text-center text-sm text-gray-500 mt-2">{blockData.caption}</div>}
                            </div>
                        );

                    case 'delimiter':
                        return <div key={id} className="flex justify-center text-3xl text-gray-400 my-10">***</div>;

                    case 'warning':
                        return (
                            <div key={id} className="my-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-yellow-800 mb-1 text-lg" dangerouslySetInnerHTML={{ __html: blockData.title }} />
                                        <p className="text-yellow-700 text-base" dangerouslySetInnerHTML={{ __html: blockData.message }} />
                                    </div>
                                </div>
                            </div>
                        );

                    case 'scrolly':
                        const { backgrounds, steps } = blockData;
                        return (
                            <div key={id} className="my-12 full-width-scrolly">
                                <div className="relative">
                                    <div className="grid grid-cols-1 gap-8">
                                        {steps.map((step, idx) => {
                                            const matchedBg = backgrounds.find(bg => bg.id === step.triggerId);
                                            return (
                                                <div key={idx} className="relative rounded-2xl overflow-hidden shadow-2xl bg-black">
                                                    {matchedBg && (
                                                        <img src={matchedBg.src} alt="" className="w-full h-96 object-cover opacity-60" />
                                                    )}
                                                    <div className={`absolute inset-0 flex items-center p-8 ${step.position === 'left' ? 'justify-start' : step.position === 'right' ? 'justify-end' : 'justify-center'}`}>
                                                        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl max-w-md shadow-lg transform transition-transform hover:scale-105">
                                                            <p className="text-gray-900 font-medium whitespace-pre-line">{step.text}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        );

                    case 'table':
                        const { content, withHeadings } = blockData;
                        return (
                            <div key={id} className="my-8 overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-200">
                                    <tbody>
                                        {content.map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex === 0 && withHeadings ? "bg-gray-100 font-bold" : "bg-white"}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="border border-gray-200 p-3 text-sm" dangerouslySetInnerHTML={{ __html: cell }} />
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );

                    case 'spacer':
                        // Render a spacer div. The height comes from data, strictly using style for precise height
                        const spacerHeight = blockData.height || 32;
                        return <div key={id} style={{ height: `${spacerHeight}px` }} aria-hidden="true" />;

                    default:
                        return null;
                }
            })}
        </div>
    );
};

export default BlockContentRenderer;
