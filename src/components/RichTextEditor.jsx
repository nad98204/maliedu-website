import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    AlignCenter, AlignLeft, AlignRight,
    Bold, Bot, Check,
    FileText,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List, ListOrdered,
    Maximize2, Minimize2,
    Underline as UnderlineIcon,
    X,
} from 'lucide-react';
import { uploadFileToS3 } from '../utils/s3UploadService';
import { marked } from 'marked';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
    const [markdownInput, setMarkdownInput] = useState('');
    const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
    const [linkInputValue, setLinkInputValue] = useState('');
    const [charCount, setCharCount] = useState(0);
    const linkInputRef = useRef(null);

    // Mirrors the HTML currently inside the editor.
    // Prevents setContent being called after the user's own keystrokes (avoids focus loss).
    const editorHtmlRef = useRef(value || '');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
            Image.configure({ inline: false, allowBase64: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({
                placeholder: placeholder || 'Bắt đầu viết nội dung bài viết tại đây…',
            }),
        ],
        content: value || '',
        onUpdate: ({ editor: ed }) => {
            const html = ed.getHTML();
            editorHtmlRef.current = html;
            onChange(html);
            setCharCount(ed.storage.characterCount?.characters?.() ?? ed.getText().length);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base max-w-none min-h-[280px] px-6 py-5 focus:outline-none',
            },
        },
    });

    /* Sync only when value truly comes from OUTSIDE (e.g. load post, reset form) */
    useEffect(() => {
        if (!editor) return;
        const next = value || '';
        if (next === editorHtmlRef.current) return;
        editorHtmlRef.current = next;
        editor.commands.setContent(next, { emitUpdate: false });
    }, [editor, value]);

    /* Lock body scroll in fullscreen */
    useEffect(() => {
        if (!isFullScreen) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isFullScreen]);

    /* Close link popover on Escape */
    useEffect(() => {
        if (!isLinkInputOpen) return undefined;
        const handler = (event) => { if (event.key === 'Escape') cancelLink(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isLinkInputOpen]);

    /* ── Markdown ──────────────────────────────────── */
    const handleMarkdownConvert = async () => {
        if (!editor || !markdownInput.trim()) return;
        try {
            const html = await marked.parse(markdownInput);
            editor.chain().focus().insertContent(html).run();
            setIsMarkdownModalOpen(false);
            setMarkdownInput('');
        } catch (err) {
            console.error('Markdown error:', err);
        }
    };

    /* ── Link ──────────────────────────────────────── */
    const openLinkInput = () => {
        if (!editor) return;
        setLinkInputValue(editor.getAttributes('link').href || '');
        setIsLinkInputOpen(true);
        setTimeout(() => linkInputRef.current?.focus(), 30);
    };
    const confirmLink = () => {
        if (!editor) return;
        const url = linkInputValue.trim();
        if (!url) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            const href = url.startsWith('http') ? url : `https://${url}`;
            editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        }
        setIsLinkInputOpen(false);
        setLinkInputValue('');
    };
    const cancelLink = () => { setIsLinkInputOpen(false); setLinkInputValue(''); };

    /* ── Image ─────────────────────────────────────── */
    const handleImageUpload = () => {
        if (!editor) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.click();
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const url = await uploadFileToS3(file, null, { folder: 'posts/content' });
                editor.chain().focus().setImage({ src: url, alt: file.name || 'image' }).run();
            } catch (err) {
                console.error('Image upload error:', err);
            }
        };
    };

    /* ── Helpers ────────────────────────────────────── */
    const btn = (active) =>
        `inline-flex h-8 w-8 items-center justify-center rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secret-wax/60 ${
            active
                ? 'bg-secret-wax/10 text-secret-wax'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;
    const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />;

    /* ── Toolbar JSX (used as variable, NOT as <Component />) ── */
    const toolbarJsx = (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={btn(editor?.isActive('bold'))} aria-label="In đậm" title="In đậm">
                <Bold className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={btn(editor?.isActive('italic'))} aria-label="In nghiêng" title="In nghiêng">
                <Italic className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={btn(editor?.isActive('underline'))} aria-label="Gạch chân" title="Gạch chân">
                <UnderlineIcon className="h-4 w-4" />
            </button>
            <Sep />
            {[1, 2, 3].map((level) => (
                <button key={level} type="button" onClick={() => editor?.chain().focus().toggleHeading({ level }).run()} className={btn(editor?.isActive('heading', { level }))} aria-label={`Heading ${level}`} title={`Heading ${level}`}>
                    <span className="text-[11px] font-bold">H{level}</span>
                </button>
            ))}
            <Sep />
            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={btn(editor?.isActive('bulletList'))} aria-label="Danh sách chấm" title="Danh sách chấm">
                <List className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={btn(editor?.isActive('orderedList'))} aria-label="Danh sách số" title="Danh sách số">
                <ListOrdered className="h-4 w-4" />
            </button>
            <Sep />
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={btn(editor?.isActive({ textAlign: 'left' }))} aria-label="Canh trái" title="Canh trái">
                <AlignLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={btn(editor?.isActive({ textAlign: 'center' }))} aria-label="Canh giữa" title="Canh giữa">
                <AlignCenter className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={btn(editor?.isActive({ textAlign: 'right' }))} aria-label="Canh phải" title="Canh phải">
                <AlignRight className="h-4 w-4" />
            </button>
            <Sep />
            {/* Link popover */}
            <div className="relative">
                <button type="button" onClick={openLinkInput} className={btn(editor?.isActive('link'))} aria-label="Thêm liên kết" title="Thêm liên kết">
                    <LinkIcon className="h-4 w-4" />
                </button>
                {isLinkInputOpen && (
                    <div className="absolute left-0 top-full z-30 mt-1.5 flex min-w-[300px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-xl">
                        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <input
                            ref={linkInputRef}
                            type="url"
                            value={linkInputValue}
                            onChange={(e) => setLinkInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmLink(); } }}
                            placeholder="https://maliedu.vn/..."
                            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <button type="button" onClick={confirmLink} aria-label="Xác nhận" className="rounded p-1 text-green-600 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50">
                            <Check className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={cancelLink} aria-label="Hủy" className="rounded p-1 text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
            {/* Image */}
            <button type="button" onClick={handleImageUpload} className={btn(false)} aria-label="Chèn ảnh" title="Chèn ảnh">
                <ImageIcon className="h-4 w-4" />
            </button>
            <Sep />
            <button
                type="button"
                onClick={() => setIsMarkdownModalOpen(true)}
                title="Nhập từ AI / Markdown"
                className="inline-flex h-8 items-center gap-1.5 rounded bg-indigo-50 px-2.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                AI / MD
            </button>
            <div className="flex-1" />
            <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                title={isFullScreen ? 'Thu nhỏ' : 'Phóng to'}
                className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            >
                {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {isFullScreen ? 'Thu nhỏ' : 'Phóng to'}
            </button>
        </div>
    );

    /* ── Editor area JSX ───────────────────────────── */
    const editorAreaJsx = (overflow) => (
        <div className={`bg-white ${overflow ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : ''}`}>
            <EditorContent editor={editor} />
        </div>
    );

    /* ── Status bar JSX ────────────────────────────── */
    const statusBarJsx = (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-1.5">
            <span className="text-[11px] text-slate-400">
                {charCount > 0 ? `${charCount.toLocaleString('vi-VN')} ký tự` : 'Bắt đầu soạn thảo…'}
            </span>
            <span className="text-[11px] text-slate-400">Enter: xuống dòng · Shift+Enter: ngắt đoạn</span>
        </div>
    );

    return (
        <>
            {/* ── Inline view ─────────────────────── */}
            {!isFullScreen && (
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    {toolbarJsx}
                    {editorAreaJsx(false)}
                    {statusBarJsx}
                </div>
            )}

            {/* ── Fullscreen view (Portal) ─────────── */}
            {isFullScreen && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-100 overscroll-none">
                    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FileText className="h-4 w-4 text-secret-wax" aria-hidden="true" />
                            Trình soạn thảo toàn màn hình
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFullScreen(false)}
                            aria-label="Thoát toàn màn hình"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                        >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Đóng
                        </button>
                    </header>
                    <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
                        {toolbarJsx}
                    </div>
                    <div className="flex min-h-0 flex-1 justify-center overflow-y-auto overscroll-contain bg-slate-100 px-4 py-6">
                        <div className="w-full max-w-4xl rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                            {editorAreaJsx(false)}
                        </div>
                    </div>
                    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4">
                        <span className="text-[11px] text-slate-400">
                            {charCount > 0 ? `${charCount.toLocaleString('vi-VN')} ký tự` : 'Bắt đầu soạn thảo…'}
                        </span>
                        <span className="text-[11px] text-slate-400">Esc để thoát toàn màn hình</span>
                    </footer>
                </div>,
                document.body
            )}

            {/* ── Markdown modal ───────────────────── */}
            {isMarkdownModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
                    <div
                        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="md-modal-title"
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 id="md-modal-title" className="flex items-center gap-2 text-base font-bold text-slate-900">
                                <Bot className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                                Nhập nội dung từ AI / Markdown
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsMarkdownModalOpen(false)}
                                aria-label="Đóng"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <p className="mb-3 text-sm text-slate-500">
                                Dán nội dung Markdown từ ChatGPT / Gemini vào bên dưới. Hệ thống tự chuyển thành tiêu đề, in đậm, danh sách…
                            </p>
                            <textarea
                                value={markdownInput}
                                onChange={(e) => setMarkdownInput(e.target.value)}
                                rows={12}
                                className="w-full resize-none rounded-lg border border-slate-200 p-4 font-mono text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                                placeholder={'# Tiêu đề bài viết\n\nNội dung...\n\n- Ý chính 1\n- Ý chính 2'}
                            />
                        </div>
                        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => setIsMarkdownModalOpen(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleMarkdownConvert}
                                disabled={!markdownInput.trim()}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                            >
                                <Bot className="h-4 w-4" aria-hidden="true" />
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
