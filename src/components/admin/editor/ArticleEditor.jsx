import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import Delimiter from '@editorjs/delimiter';
import Marker from '@editorjs/marker';
import Warning from '@editorjs/warning';
import ScrollyBlock from './tools/ScrollyBlock';
import Spacer from './tools/Spacer';
import { uploadToCloudinary } from '../../../utils/uploadService';

const ArticleEditor = React.forwardRef(({ onSave, initialData }, ref) => {
    const editorInstance = useRef(null);
    const editorContainerRef = useRef(null);

    // Expose save method to parent
    React.useImperativeHandle(ref, () => ({
        save: async () => {
            if (editorInstance.current) {
                try {
                    const savedData = await editorInstance.current.save();
                    return savedData;
                } catch (error) {
                    console.error('Editor save failed:', error);
                    throw error;
                }
            }
            return null;
        }
    }));

    useEffect(() => {
        if (!editorInstance.current) {
            initEditor();
        }

        return () => {
            if (editorInstance.current && editorInstance.current.destroy) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, []);

    const initEditor = () => {
        const editor = new EditorJS({
            holder: editorContainerRef.current,
            data: initialData || {},
            placeholder: 'Viết câu chuyện của bạn tại đây...',
            tools: {
                header: {
                    class: Header,
                    inlineToolbar: true,
                    config: {
                        placeholder: 'Nhập tiêu đề...',
                        levels: [2, 3, 4],
                        defaultLevel: 2
                    }
                },
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true,
                },
                list: {
                    class: List,
                    inlineToolbar: true,
                    config: {
                        defaultStyle: 'unordered'
                    }
                },
                image: {
                    class: ImageTool,
                    config: {
                        uploader: {
                            uploadByFile(file) {
                                return uploadToCloudinary(file).then((result) => {
                                    return {
                                        success: 1,
                                        file: {
                                            url: result.secureUrl,
                                        }
                                    };
                                });
                            },
                            uploadByUrl(url) {
                                return new Promise((resolve) => {
                                    resolve({
                                        success: 1,
                                        file: {
                                            url: url,
                                        }
                                    })
                                })
                            }
                        }
                    }
                },
                quote: {
                    class: Quote,
                    inlineToolbar: true,
                    config: {
                        quotePlaceholder: 'Nhập trích dẫn...',
                        captionPlaceholder: 'Tác giả',
                    },
                },
                embed: {
                    class: Embed,
                    config: {
                        services: {
                            youtube: true,
                            coub: true,
                            facebook: true,
                            instagram: true,
                            twitter: true,
                            tiktok: true,
                        }
                    }
                },
                table: {
                    class: Table,
                    inlineToolbar: true,
                    config: {
                        rows: 2,
                        cols: 3,
                    },
                },
                delimiter: Delimiter,
                marker: {
                    class: Marker,
                    shortcut: 'CMD+SHIFT+M',
                },
                warning: {
                    class: Warning,
                    inlineToolbar: true,
                    shortcut: 'CMD+SHIFT+W',
                    config: {
                        titlePlaceholder: 'Lưu ý',
                        messagePlaceholder: 'Nội dung lưu ý',
                    },
                },
                scrolly: {
                    class: ScrollyBlock,
                    inlineToolbar: true,
                },
                spacer: {
                    class: Spacer,
                }
            },
            onReady: () => {
                // console.log('Editor.js is ready to work!');
            },
            onChange: async () => {
                // Optional: auto-save if needed
            }
        });

        editorInstance.current = editor;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-700">Nội dung bài viết (Block Editor)</h3>
                {/* Save handled by parent */}
            </div>

            {/* Editor Main Area */}
            <div className="p-6 min-h-[70vh] max-h-[70vh] overflow-y-auto">
                {/* Editor Styles Override for Professional Look */}
                <style>{`
          .ce-block__content { max-width: 800px; margin: 0 auto; }
          .ce-toolbar__content { max-width: 800px; margin: 0 auto; }
          .codex-editor__redactor { padding-bottom: 200px !important; }
          
          /* Typography */
          .ce-paragraph { font-size: 1.125rem; line-height: 1.75; color: #374151; }
          .ce-header { font-family: 'Playfair Display', serif; font-weight: 700; margin-bottom: 0.5em; }
          h2.ce-header { font-size: 2rem; }
          h3.ce-header { font-size: 1.5rem; }

          /* Quote */
          .cdx-quote { background: #F9FAFB; border-left: 4px solid #8B2E2E; padding: 1rem 1.5rem; font-style: italic; }
          .cdx-quote__caption { font-style: normal; font-weight: 600; color: #8B2E2E; }

          /* Image */
          .image-tool__image-picture { border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .image-tool__caption { font-style: italic; color: #6B7280; }

           /* Warning */
           .cdx-warning { background: #FEF3C7; border: 1px solid #FCD34D; color: #92400E; }
           .cdx-warning::before { background-color: #D97706; }
        `}</style>
                <div ref={editorContainerRef} id="editorjs"></div>
            </div>
        </div>
    );
});

ArticleEditor.displayName = 'ArticleEditor';

export default ArticleEditor;
