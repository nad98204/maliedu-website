import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    MessageCircle,
    PenTool,
    Send,
    Trash2
} from 'lucide-react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../firebase';

// Tự detect loại file: PDF mở thẳng, Office files dùng Google Docs Viewer
const getViewerUrl = (url = '') => {
    const lower = url.toLowerCase().split('?')[0];
    if (/\.(pdf)$/.test(lower)) return url;
    if (/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/.test(lower)) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`;
    }
    return url;
};

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const ENCODED_HTML_TAG_PATTERN = /&lt;\/?[a-z][\s\S]*&gt;/i;

const buildResourcePreview = (resourceList = [], limit = 3) => {
    const names = [...new Set(resourceList.map((resource) => resource.name).filter(Boolean))];

    if (names.length === 0) {
        return '';
    }

    const preview = names.slice(0, limit).join(' • ');

    return names.length > limit ? `${preview} +${names.length - limit}` : preview;
};

const decodeHtmlEntities = (value = '') => {
    if (!value || typeof document === 'undefined') {
        return value;
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
};

const escapeHtml = (value = '') =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const sanitizeHtml = (value = '') => {
    if (!value || typeof DOMParser === 'undefined') {
        return value;
    }

    const parser = new DOMParser();
    const documentNode = parser.parseFromString(value, 'text/html');

    documentNode
        .querySelectorAll('script, style, iframe, object, embed')
        .forEach((node) => node.remove());

    documentNode.querySelectorAll('*').forEach((node) => {
        Array.from(node.attributes).forEach((attribute) => {
            const attributeName = attribute.name.toLowerCase();
            const attributeValue = attribute.value.trim().toLowerCase();

            if (attributeName.startsWith('on')) {
                node.removeAttribute(attribute.name);
                return;
            }

            if (
                (attributeName === 'href' || attributeName === 'src') &&
                attributeValue.startsWith('javascript:')
            ) {
                node.removeAttribute(attribute.name);
            }
        });
    });

    return documentNode.body.innerHTML;
};

const formatDescriptionContent = (value = '') => {
    const trimmedValue = typeof value === 'string' ? value.trim() : '';

    if (!trimmedValue) {
        return '';
    }

    const decodedValue = ENCODED_HTML_TAG_PATTERN.test(trimmedValue)
        ? decodeHtmlEntities(trimmedValue)
        : trimmedValue;

    if (HTML_TAG_PATTERN.test(decodedValue)) {
        return sanitizeHtml(decodedValue).replace(/&nbsp;/g, ' ');
    }

    return escapeHtml(decodeHtmlEntities(decodedValue))
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n/g, '<br />');
};

const getLessonNoteStorageKey = (lessonId = 'default') => `maliedu-smart-note:${lessonId}`;

const buildSmartNoteStarter = (lessonTitle = 'Bài học này') =>
    `TÓM TẮT BÀI HỌC: ${lessonTitle}
- Điều quan trọng nhất:

Ý CHÍNH
1.
2.
3.

VIỆC CẦN LÀM NGAY
[ ]
[ ]

CÂU HỎI CẦN XEM LẠI
- `;

const SMART_NOTE_ACTIONS = [
    {
        id: 'summary',
        label: 'Tóm tắt',
        content: `TÓM TẮT NHANH
- `
    },
    {
        id: 'key-points',
        label: 'Ý chính',
        content: `Ý CHÍNH
1.
2.
3.
`
    },
    {
        id: 'todo',
        label: 'Việc cần làm',
        content: `VIỆC CẦN LÀM
[ ]
[ ]
`
    },
    {
        id: 'question',
        label: 'Câu hỏi',
        content: `CÂU HỎI CẦN XEM LẠI
- `
    }
];

const PlayerTabs = ({
    description,
    resources = [],
    resourceGroups = [],
    currentContextResources = [],
    resourceFocusRequest,
    lessonId,
    lessonTitle,
    currentUser,
    hasFullAccess = true,
    onLessonSelect,
    onActiveTabChange
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [note, setNote] = useState('');
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [isNoteReady, setIsNoteReady] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openResourceGroups, setOpenResourceGroups] = useState({});
    const [pendingResourceFocus, setPendingResourceFocus] = useState(null);
    const [highlightedResourceId, setHighlightedResourceId] = useState(null);
    const noteTextareaRef = useRef(null);
    const resourcesSectionRef = useRef(null);
    const resourceItemRefs = useRef({});

    useEffect(() => {
        onActiveTabChange?.(activeTab);
    }, [activeTab, onActiveTabChange]);

    useEffect(() => {
        if (!hasFullAccess || !lessonId) return;

        const commentsQuery = query(
            collection(db, 'comments'),
            where('lessonId', '==', lessonId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            commentsQuery,
            (snapshot) => {
                setComments(
                    snapshot.docs.map((commentDoc) => ({
                        id: commentDoc.id,
                        ...commentDoc.data()
                    }))
                );
            },
            (error) => {
                console.error('Error fetching comments:', error);
            }
        );

        return () => unsubscribe();
    }, [hasFullAccess, lessonId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        if (!currentUser) {
            toast.error('Vui lòng đăng nhập để bình luận');
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'comments'), {
                text: newComment.trim(),
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                userAvatar:
                    currentUser.photoURL ||
                    `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=random`,
                lessonId,
                createdAt: serverTimestamp()
            });

            setNewComment('');
            toast.success('Đã gửi bình luận');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Có lỗi xảy ra khi gửi bình luận');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

        try {
            await deleteDoc(doc(db, 'comments', commentId));
            toast.success('Đã xóa bình luận');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Không thể xóa bình luận');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Mô tả', icon: BookOpen },
        { id: 'resources', label: 'Tài liệu', icon: FileText },
        { id: 'notes', label: 'Ghi chép', icon: PenTool },
        { id: 'discussion', label: 'Thảo luận', icon: MessageCircle }
    ];

    const visibleTabs = hasFullAccess ? tabs : [tabs[0]];
    const visibleResourceGroups = useMemo(
        () => resourceGroups.filter((group) => group.resources.length > 0),
        [resourceGroups]
    );
    const formattedDescription = useMemo(
        () => formatDescriptionContent(description),
        [description]
    );
    const noteStats = useMemo(() => {
        const trimmedNote = note.trim();

        if (!trimmedNote) {
            return {
                lineCount: 0,
                wordCount: 0
            };
        }

        return {
            lineCount: trimmedNote.split('\n').filter((line) => line.trim()).length,
            wordCount: trimmedNote.split(/\s+/).filter(Boolean).length
        };
    }, [note]);
    const savedNoteLabel = useMemo(() => {
        if (!lastSavedAt) {
            return 'Đang tự động lưu';
        }

        return `Đã lưu ${new Date(lastSavedAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }, [lastSavedAt]);

    useEffect(() => {
        if (!visibleTabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [activeTab, visibleTabs]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        setIsNoteReady(false);

        const storedValue = window.localStorage.getItem(getLessonNoteStorageKey(lessonId));

        if (!storedValue) {
            setNote('');
            setLastSavedAt(null);
            setIsNoteReady(true);
            return;
        }

        try {
            const parsedValue = JSON.parse(storedValue);
            setNote(parsedValue.content || '');
            setLastSavedAt(parsedValue.savedAt || null);
        } catch (error) {
            setNote(storedValue);
            setLastSavedAt(null);
        }

        setIsNoteReady(true);
    }, [lessonId]);

    useEffect(() => {
        if (typeof window === 'undefined' || !isNoteReady) {
            return undefined;
        }

        const storageKey = getLessonNoteStorageKey(lessonId);
        const saveTimer = window.setTimeout(() => {
            if (!note.trim()) {
                window.localStorage.removeItem(storageKey);
                setLastSavedAt(null);
                return;
            }

            const savedAt = new Date().toISOString();

            window.localStorage.setItem(
                storageKey,
                JSON.stringify({
                    content: note,
                    savedAt
                })
            );
            setLastSavedAt(savedAt);
        }, 350);

        return () => window.clearTimeout(saveTimer);
    }, [isNoteReady, lessonId, note]);

    useEffect(() => {
        if (!resourceFocusRequest?.resourceId) return;

        setActiveTab('resources');

        if (resourceFocusRequest.groupKey) {
            setOpenResourceGroups((prev) => ({
                ...prev,
                [resourceFocusRequest.groupKey]: true
            }));
        }

        setPendingResourceFocus(resourceFocusRequest);
    }, [resourceFocusRequest]);

    useEffect(() => {
        if (activeTab !== 'resources' || !pendingResourceFocus?.resourceId) {
            return undefined;
        }

        let sectionTimer = null;
        let resourceTimer = null;
        let clearHighlightTimer = null;

        sectionTimer = window.setTimeout(() => {
            resourcesSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            resourceTimer = window.setTimeout(() => {
                const targetNode = resourceItemRefs.current[pendingResourceFocus.resourceId];

                if (!targetNode) {
                    return;
                }

                targetNode.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                setHighlightedResourceId(pendingResourceFocus.resourceId);
                setPendingResourceFocus(null);

                clearHighlightTimer = window.setTimeout(() => {
                    setHighlightedResourceId((currentId) =>
                        currentId === pendingResourceFocus.resourceId ? null : currentId
                    );
                }, 1800);
            }, 220);
        }, 120);

        return () => {
            window.clearTimeout(sectionTimer);
            window.clearTimeout(resourceTimer);
            window.clearTimeout(clearHighlightTimer);
        };
    }, [activeTab, pendingResourceFocus]);

    const toggleResourceGroup = (groupKey, defaultOpen = false) => {
        setOpenResourceGroups((prev) => ({
            ...prev,
            [groupKey]: !(prev[groupKey] ?? defaultOpen)
        }));
    };

    const setResourceItemRef = (resourceId, node) => {
        if (!resourceId) return;

        if (node) {
            resourceItemRefs.current[resourceId] = node;
            return;
        }

        delete resourceItemRefs.current[resourceId];
    };

    const insertIntoNote = (snippet) => {
        if (!snippet) return;

        const textarea = noteTextareaRef.current;
        const currentValue = note;

        if (!textarea) {
            setNote((previousNote) =>
                previousNote.trim() ? `${previousNote}\n\n${snippet}` : snippet
            );
            return;
        }

        const selectionStart = textarea.selectionStart ?? currentValue.length;
        const selectionEnd = textarea.selectionEnd ?? currentValue.length;
        const prefix = currentValue.slice(0, selectionStart);
        const suffix = currentValue.slice(selectionEnd);
        const needsLeadingBreak = prefix && !prefix.endsWith('\n') ? '\n\n' : '';
        const needsTrailingBreak = suffix && !suffix.startsWith('\n') ? '\n\n' : '';
        const insertedText = `${needsLeadingBreak}${snippet}${needsTrailingBreak}`;
        const nextValue = `${prefix}${insertedText}${suffix}`;
        const cursorPosition = prefix.length + insertedText.length;

        setNote(nextValue);

        window.requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        });
    };



    return (
        <div id="player-tabs" className="mx-auto mt-6 w-full max-w-5xl pb-16 md:mt-8 md:pb-20">
            <div className="mb-4 grid w-full grid-cols-4 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm md:mb-6 md:w-fit md:grid-cols-none md:flex md:flex-wrap md:gap-2 md:rounded-xl md:p-2">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-center text-[11px] font-bold leading-tight transition-all md:min-w-0 md:flex-row md:gap-2 md:rounded-lg md:px-4 md:py-2.5 md:text-sm ${
                            activeTab === tab.id
                                ? 'border border-red-100 bg-red-50 text-[#B91C1C] shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                    >
                        <tab.icon
                            className={`h-4 w-4 shrink-0 ${
                                activeTab === tab.id ? 'text-[#B91C1C]' : 'text-slate-400'
                            }`}
                        />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="min-h-[260px] rounded-3xl bg-white p-4 shadow-sm md:min-h-[300px] md:rounded-2xl md:p-6">
                {activeTab === 'overview' && (
                    <div className="prose max-w-none">
                        <h3 className="mb-3 text-lg font-bold text-slate-800 md:mb-4 md:text-xl">
                            Giới thiệu bài học
                        </h3>
                        {formattedDescription ? (
                            <div
                                className="text-sm leading-relaxed text-slate-600 md:text-base [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6"
                                dangerouslySetInnerHTML={{ __html: formattedDescription }}
                            />
                        ) : (
                            <div className="text-sm leading-relaxed text-slate-600 md:text-base">
                                Chưa có mô tả cho bài học này.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div
                        ref={resourcesSectionRef}
                        className="resource-scroll-target space-y-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-slate-800">
                                Tài liệu đính kèm
                            </h3>
                            <span className="text-sm text-slate-400">
                                {resources.length} tài liệu
                            </span>
                        </div>

                        {resources.length > 0 ? (
                            <div className="space-y-4">
                                {currentContextResources.length > 0 && (
                                    <div className="rounded-2xl border border-red-100 bg-red-50 p-3 md:p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-[#B91C1C]">
                                                    Bài học hiện tại có {currentContextResources.length}{' '}
                                                    tài liệu
                                                </p>
                                                <p className="mt-1 text-sm text-red-500">
                                                    {buildResourcePreview(
                                                        currentContextResources,
                                                        4
                                                    )}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#B91C1C] ring-1 ring-red-100">
                                                Đang học
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {visibleResourceGroups.map((group) => {
                                        const isGroupOpen =
                                            openResourceGroups[group.key] ??
                                            (group.isCurrentSection || group.isGeneral);

                                        return (
                                            <div
                                                key={group.key}
                                                className="overflow-hidden rounded-2xl border border-slate-200"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleResourceGroup(
                                                            group.key,
                                                            group.isCurrentSection ||
                                                                group.isGeneral
                                                        )
                                                    }
                                                    className="flex w-full items-start justify-between gap-3 bg-white px-3 py-3 text-left transition-colors hover:bg-slate-50 md:px-4 md:py-4"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="line-clamp-1 text-sm font-bold text-slate-800">
                                                                {group.title}
                                                            </h4>
                                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-[#B91C1C]">
                                                                {group.resources.length} tài liệu
                                                            </span>
                                                            {group.isCurrentSection && (
                                                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                                                                    Đang học
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-2 line-clamp-2 text-[12px] font-medium text-red-500">
                                                            {buildResourcePreview(group.resources)}
                                                        </p>
                                                    </div>
                                                    {isGroupOpen ? (
                                                        <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                                    )}
                                                </button>

                                                <div
                                                    className={`overflow-hidden transition-all duration-300 ${
                                                        isGroupOpen
                                                            ? 'max-h-[2000px]'
                                                            : 'max-h-0'
                                                    }`}
                                                >
                                                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-3 md:p-4">
                                                        {group.resources.map((file, index) => {
                                                            const isCurrentResource =
                                                                file.isCurrentContext ||
                                                                lessonId === file.lessonId;
                                                            const isHighlightedResource =
                                                                highlightedResourceId === file.id;

                                                            return (
                                                                <div
                                                                    key={
                                                                        file.id ||
                                                                        `${file.url}-${index}`
                                                                    }
                                                                    ref={(node) =>
                                                                        setResourceItemRef(
                                                                            file.id,
                                                                            node
                                                                        )
                                                                    }
                                                                    className={`group flex items-start justify-between gap-3 rounded-xl border p-3 transition-all duration-500 md:p-4 ${
                                                                        isHighlightedResource
                                                                            ? 'animate-resource-spotlight border-[#B91C1C] bg-[#fff7f7] shadow-[0_18px_40px_-24px_rgba(185,28,28,0.65)]'
                                                                            : isCurrentResource
                                                                              ? 'border-red-200 bg-red-50'
                                                                              : 'border-slate-200 bg-white hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div
                                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                                                isCurrentResource
                                                                                    ? 'bg-red-100 text-[#B91C1C]'
                                                                                    : 'bg-red-50 text-red-500'
                                                                            }`}
                                                                        >
                                                                            <FileText className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <p className="line-clamp-2 text-sm font-bold text-slate-700">
                                                                                    {file.name ||
                                                                                        `Tài liệu ${index + 1}`}
                                                                                </p>
                                                                                {isCurrentResource && (
                                                                                    <span className="rounded-full bg-[#B91C1C] px-2 py-0.5 text-[11px] font-bold text-white">
                                                                                        Đang dùng
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {file.lessonId &&
                                                                            file.lesson ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        onLessonSelect?.(
                                                                                            file.lesson
                                                                                        )
                                                                                    }
                                                                                    className="mt-1 line-clamp-1 text-left text-xs font-medium text-slate-500 transition-colors hover:text-[#B91C1C]"
                                                                                >
                                                                                    {file.lessonTitle ||
                                                                                        'Bài học gắn tài liệu'}
                                                                                </button>
                                                                            ) : (
                                                                                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                                                                                    {file.isGeneral
                                                                                        ? 'Tài liệu chung của khóa học'
                                                                                        : 'Tài liệu theo phần này'}
                                                                                </p>
                                                                            )}

                                                                            {!group.isGeneral && (
                                                                                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                                                                                    {group.title}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                                        <a
                                                                            href={getViewerUrl(file.url)}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                                                                            title="Đọc tài liệu"
                                                                        >
                                                                            Đọc tài liệu
                                                                        </a>
                                                                        <a
                                                                            href={file.url}
                                                                            download
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                                                            title="Tải xuống"
                                                                        >
                                                                            Tải xuống
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                                Chưa có tài liệu đính kèm.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex h-full flex-col">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                                Ghi chép bài học
                            </h3>
                        </div>
                        <div className="flex-1">
                            <textarea
                                ref={noteTextareaRef}
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                className="min-h-[400px] w-full flex-1 rounded-[24px] border border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] md:min-h-[450px]"
                                placeholder="Ghi lại những ý chính của bài học tại đây..."
                            />
                        </div>

                        <p className="mt-4 text-[13px] italic text-slate-400">
                            Mẹo: Ghi chép được tự động lưu riêng theo từng bài giảng.
                        </p>
                    </div>
                )}

                {activeTab === 'discussion' && (
                    <div>
                        <h3 className="mb-5 text-lg font-bold text-slate-800 md:mb-6">
                            Thảo luận & Hỏi đáp
                        </h3>

                        <div className="space-y-6 md:space-y-8">
                            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                                    {currentUser?.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt="User"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                                            {currentUser?.displayName?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(event) => setNewComment(event.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm transition-colors focus:border-secret-wax focus:outline-none md:rounded-xl"
                                        rows="4"
                                        placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến của bạn..."
                                        disabled={!currentUser}
                                    ></textarea>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={
                                                isSubmitting || !newComment.trim() || !currentUser
                                            }
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secret-wax px-5 py-2.5 text-sm font-bold text-white hover:bg-secret-ink disabled:opacity-50 md:w-auto md:rounded-lg md:py-2"
                                        >
                                            <Send className="h-4 w-4" />
                                            {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
                                        </button>
                                    </div>
                                    {!currentUser && (
                                        <p className="mt-2 text-xs text-red-400">
                                            * Vui lòng đăng nhập để bình luận
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="group flex gap-3 md:gap-4">
                                            <img
                                                src={
                                                    comment.userAvatar ||
                                                    'https://ui-avatars.com/api/?name=User&background=random'
                                                }
                                                alt={comment.userName}
                                                className="h-9 w-9 shrink-0 rounded-full md:h-10 md:w-10"
                                            />
                                            <div className="flex-1">
                                                <div className="relative rounded-2xl rounded-tl-none bg-slate-50 p-3 md:p-4">
                                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-800">
                                                                {comment.userName}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                {comment.createdAt?.seconds
                                                                    ? new Date(
                                                                          comment.createdAt.seconds *
                                                                              1000
                                                                      ).toLocaleDateString('vi-VN')
                                                                    : 'Vừa xong'}
                                                            </span>
                                                        </div>

                                                        {(currentUser?.uid === comment.userId ||
                                                            currentUser?.role === 'admin') && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteComment(comment.id)
                                                                }
                                                                className="text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                                                                title="Xóa bình luận"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400">
                                        Chưa có bình luận nào. Hãy là người đầu tiên!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PlayerTabs;
