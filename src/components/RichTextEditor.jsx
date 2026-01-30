import React, { useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Maximize2, Minimize2, Bot, X } from 'lucide-react';
import { uploadToCloudinary } from '../utils/uploadService';
import { marked } from 'marked';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const quillRef = useRef(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Markdown Import State
    const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
    const [markdownInput, setMarkdownInput] = useState('');

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const handleMarkdownConvert = async () => {
        if (!markdownInput.trim()) return;

        try {
            // Parse markdown to HTML
            const htmlContent = await marked.parse(markdownInput);

            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true) || { index: quill.getLength() };

            // Insert the converted HTML at the cursor position
            quill.clipboard.dangerouslyPasteHTML(range.index, htmlContent);

            // Close modal and clear input
            setIsMarkdownModalOpen(false);
            setMarkdownInput('');
        } catch (error) {
            console.error('Error parsing markdown:', error);
            alert('Lỗi chuyển đổi Markdown: ' + error.message);
        }
    };

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                try {
                    // Show some loading indication if possible, or just wait
                    const result = await uploadToCloudinary(file);
                    const url = result.secureUrl;

                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);

                    // Insert the image
                    quill.insertEmbed(range.index, 'image', url);

                    // Move cursor to next position
                    quill.setSelection(range.index + 1);
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Lỗi upload ảnh: ' + error.message);
                }
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['link', 'image'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        },
        clipboard: {
            matchVisual: false,
        }
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'align',
        'link', 'image',
        'color', 'background'
    ];

    return (
        <>
            <div className={`rich-text-editor transition-all duration-300 ${isFullScreen
                ? 'fixed inset-0 z-[9999] bg-white p-8 overflow-y-auto flex flex-col'
                : '[&_.ql-editor]:min-h-[300px] [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg'
                }`}>
                <div className="flex justify-end mb-2 gap-2">

                    <button
                        type="button"
                        onClick={toggleFullScreen}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                        {isFullScreen ? (
                            <>
                                <Minimize2 className="w-4 h-4" /> Thu nhỏ
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4" /> Phóng to
                            </>
                        )}
                    </button>
                </div>

                <div className={isFullScreen ? 'flex-1 border rounded-lg shadow-sm bg-white' : ''}>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={value}
                        onChange={onChange}
                        modules={modules}
                        formats={formats}
                        placeholder={placeholder}
                        className={isFullScreen ? 'h-full [&_.ql-container]:h-[calc(100%-42px)] [&_.ql-container]:border-0' : ''}
                    />
                </div>
            </div>

            {/* Markdown Import Modal */}
            {isMarkdownModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Bot className="w-5 h-5 text-indigo-600" />
                                Dán nội dung Markdown từ AI
                            </h3>
                            <button
                                onClick={() => setIsMarkdownModalOpen(false)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-2">
                                Copy nội dung từ ChatGPT/Gemini (dạng Markdown) và dán vào bên dưới. Hệ thống sẽ tự động định dạng Heading, Bold, List...
                            </p>
                            <textarea
                                value={markdownInput}
                                onChange={(e) => setMarkdownInput(e.target.value)}
                                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                placeholder="# Tiêu đề bài viết&#10;&#10;Nội dung bài viết...&#10;&#10;- Ý chính 1&#10;- Ý chính 2"
                            />
                        </div>

                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setIsMarkdownModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleMarkdownConvert}
                                disabled={!markdownInput.trim()}
                                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                            >
                                <Bot className="w-4 h-4" />
                                Chuyển đổi & Chèn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RichTextEditor;
