import React, { useMemo, useRef, useState } from 'react';
import {
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    Eye,
    FileText,
    Image as ImageIcon,
    Lock,
    Play,
    PlayCircle,
    Search,
    Video,
    Clock,
    X,
    Folder,
    ExternalLink,
    Headphones,
    Sparkles
} from 'lucide-react';
import { formatPrice } from '../utils/orderService';
import {
    getLessonContentTypeLabel,
    LESSON_CONTENT_TYPES,
    lessonHasAudio,
    lessonHasArticle,
    normalizeLessonContentType,
} from '../utils/lessonContent';

const getViewerUrl = (url = '') => {
    const lower = url.toLowerCase().split('?')[0];
    if (/\.(pdf)$/.test(lower)) return url;
    if (/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/.test(lower)) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`;
    }
    return url;
};

const PlayerSidebar = ({
    sections = [],
    resources = [],
    resourceGroups = [],
    lessonResourceMap = {},
    sectionResourceMap = {},
    hasResourceAccess = true,
    isPreviewMode = false,
    previewableLessonKeys = [],
    registrationPrice = 0,
    currentLessonId,
    progress = {},
    onLessonSelect,
    onLockedLessonSelect,
    onRegisterClick,
    onResourceSelect,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState('curriculum');
    const [lessonSearchTerm, setLessonSearchTerm] = useState('');
    const [resourceSearchTerm, setResourceSearchTerm] = useState('');
    const [openSections, setOpenSections] = useState({});
    const [openResourceGroups, setOpenResourceGroups] = useState({});
    const swipeStartRef = useRef(null);

    const handleDrawerTouchStart = (event) => {
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleDrawerTouchEnd = (event) => {
        const swipeStart = swipeStartRef.current;
        swipeStartRef.current = null;
        if (!swipeStart || event.changedTouches.length !== 1) return;

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - swipeStart.x;
        const deltaY = touch.clientY - swipeStart.y;

        // Vuốt ngang theo một trong hai hướng để đóng bảng và quay lại video.
        if (Math.abs(deltaX) >= 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
            onClose?.();
        }
    };

    const availableTabs = useMemo(
        () => (hasResourceAccess ? ['curriculum', 'resources'] : ['curriculum']),
        [hasResourceAccess]
    );
    const displayedActiveTab = availableTabs.includes(activeTab)
        ? activeTab
        : availableTabs[0];

    const totalLessons = useMemo(
        () => sections.reduce((total, section) => total + (section.lessons?.length || 0), 0),
        [sections]
    );

    const completedLessons = useMemo(
        () => Object.values(progress).filter(Boolean).length,
        [progress]
    );

    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const previewableLessonKeySet = useMemo(
        () => new Set(previewableLessonKeys),
        [previewableLessonKeys]
    );
    const lockedLessonCount = Math.max(totalLessons - previewableLessonKeySet.size, 0);

    const filteredSections = useMemo(() => {
        const keyword = lessonSearchTerm.trim().toLowerCase();

        return sections
            .map((section, sectionIndex) => ({
                ...section,
                sectionIndex,
                lessons: (section.lessons || []).filter((lesson) => {
                    if (!keyword) return true;
                    return lesson.title?.toLowerCase().includes(keyword);
                })
            }))
            .filter((section) => section.lessons.length > 0);
    }, [lessonSearchTerm, sections]);

    const filteredResourceGroups = useMemo(() => {
        const keyword = resourceSearchTerm.trim().toLowerCase();

        return resourceGroups
            .map((group) => ({
                ...group,
                resources: group.resources.filter((resource) => {
                    if (!keyword) return true;

                    return [
                        resource.name,
                        resource.lessonTitle,
                        resource.sectionTitle,
                        resource.sourceLabel
                    ].some((value) => value?.toLowerCase().includes(keyword));
                })
            }))
            .filter((group) => group.resources.length > 0);
    }, [resourceGroups, resourceSearchTerm]);

    const currentSectionId = useMemo(() => {
        if (!currentLessonId) return null;

        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
            const section = sections[sectionIndex];
            const sectionId = section.id || `section-${sectionIndex}`;
            const hasCurrentLesson = (section.lessons || []).some(
                (lesson) => (lesson.id || lesson.videoId) === currentLessonId
            );

            if (hasCurrentLesson) {
                return sectionId;
            }
        }

        return null;
    }, [currentLessonId, sections]);

    const toggleSection = (sectionIndex, defaultOpen = false) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionIndex]: !(prev[sectionIndex] ?? defaultOpen)
        }));
    };

    const toggleResourceGroup = (groupKey, defaultOpen = false) => {
        setOpenResourceGroups((prev) => ({
            ...prev,
            [groupKey]: !(prev[groupKey] ?? defaultOpen)
        }));
    };

    const searchValue = displayedActiveTab === 'curriculum' ? lessonSearchTerm : resourceSearchTerm;
    const setSearchValue = displayedActiveTab === 'curriculum' ? setLessonSearchTerm : setResourceSearchTerm;

    return (
        <div
            className="flex h-full touch-pan-y flex-col overscroll-x-contain bg-white text-slate-800 select-none"
            onTouchStart={handleDrawerTouchStart}
            onTouchEnd={handleDrawerTouchEnd}
            onTouchCancel={() => {
                swipeStartRef.current = null;
            }}
        >
            {/* Header Area */}
            <div className="sticky top-0 z-10 space-y-3.5 border-b border-slate-100 bg-white/95 p-4 backdrop-blur-md">
                
                {/* Preview Banner */}
                {isPreviewMode && (
                    <div className="space-y-2.5">
                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                    Chế độ học thử ({previewableLessonKeySet.size} bài)
                                </p>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                Miễn phí
                            </span>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-[#8B2E2E] to-red-800 p-4 text-white shadow-lg shadow-red-900/15">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                                    Mở khóa trọn bộ
                                </span>
                                {registrationPrice > 0 && (
                                    <span className="text-sm font-black text-amber-300">
                                        {formatPrice(registrationPrice)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-red-100 line-clamp-1">
                                Mở khóa {lockedLessonCount} bài học & toàn bộ tài liệu
                            </p>
                            <button
                                type="button"
                                onClick={() => onRegisterClick?.()}
                                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 px-3 text-xs font-black uppercase tracking-wide text-[#8B2E2E] shadow-sm hover:bg-amber-300 hover:text-red-950 transition-all active:scale-[0.98]"
                            >
                                <span>Đăng ký ngay</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Segmented Tabs */}
                <div className="flex items-stretch gap-2">
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-2xl border border-slate-200/50 bg-slate-100/80 p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('curriculum')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[15px] font-bold transition-all md:py-2 md:text-xs ${
                            displayedActiveTab === 'curriculum'
                                ? 'bg-white text-[#8B2E2E] shadow-sm font-black'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <span>Bài học</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                            displayedActiveTab === 'curriculum' ? 'bg-red-50 text-[#8B2E2E]' : 'bg-slate-200/70 text-slate-500'
                        }`}>
                            {totalLessons}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('resources')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[15px] font-bold transition-all md:py-2 md:text-xs ${
                            displayedActiveTab === 'resources'
                                ? 'bg-white text-[#8B2E2E] shadow-sm font-black'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <span>Tài liệu</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                            displayedActiveTab === 'resources' ? 'bg-red-50 text-[#8B2E2E]' : 'bg-slate-200/70 text-slate-500'
                        }`}>
                            {resources.length}
                        </span>
                    </button>
                </div>
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="flex shrink-0 items-center justify-center gap-1 rounded-xl bg-[#8B2E2E] px-2.5 text-white shadow-md shadow-red-900/20 transition-all hover:bg-[#722525] active:scale-95 md:hidden"
                        aria-label="Đóng danh sách và quay lại video"
                    >
                        <X className="h-5 w-5" strokeWidth={2.5} />
                        <span className="text-[13px] font-black">Đóng</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={
                            displayedActiveTab === 'curriculum'
                                ? 'Tìm bài học theo tên...'
                                : 'Tìm tài liệu, bài tập...'
                        }
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-9 pr-8 text-sm font-medium outline-none transition-all placeholder-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10 md:py-2 md:pl-8 md:pr-7 md:text-xs"
                    />
                    {searchValue && (
                        <button
                            onClick={() => setSearchValue('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Compact Progress Bar */}
                {displayedActiveTab === 'curriculum' && totalLessons > 0 && (
                    <div className="pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 md:text-[11px]">
                            <span>Tiến độ: <strong className="text-slate-800">{completedLessons}/{totalLessons}</strong> bài</span>
                            <span className="text-[#8B2E2E] font-bold">{progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#8B2E2E] to-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Content Body */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-2.5">
                {displayedActiveTab === 'curriculum' ? (
                    filteredSections.length > 0 ? (
                        filteredSections.map((section, sIdx) => {
                            const sectionId = section.id || `section-${section.sectionIndex}`;
                            const sectionResources = sectionResourceMap[sectionId] || [];
                            const sectionLevelResources = sectionResources.filter(
                                (resource) => !resource.lessonId
                            );
                            const isSectionOpen =
                                openSections[section.sectionIndex] ??
                                (sectionId === currentSectionId || sIdx === 0);

                            const hasSectionTitle = Boolean(section.title?.trim());

                            return (
                                <div
                                    key={`${sectionId}-${section.title}`}
                                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all"
                                >
                                    {/* Section Header Accordion Trigger */}
                                    {hasSectionTitle ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleSection(
                                                    section.sectionIndex,
                                                    sectionId === currentSectionId || sIdx === 0
                                                )
                                            }
                                            className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-3 text-left transition-colors ${
                                                isSectionOpen
                                                    ? 'bg-slate-50/90 border-b border-slate-100'
                                                    : 'bg-white hover:bg-slate-50/60'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`line-clamp-2 text-[15px] font-bold leading-relaxed md:text-xs md:leading-snug ${
                                                    isSectionOpen ? 'text-[#8B2E2E]' : 'text-slate-800'
                                                }`}>
                                                    {section.title}
                                                </h4>
                                                <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-slate-500 md:text-[11px]">
                                                    <span>{section.lessons.length} bài học</span>
                                                    {sectionLevelResources.length > 0 && (
                                                        <span className="flex items-center gap-1 text-red-600">
                                                            <span>•</span>
                                                            <FileText className="h-3 w-3" />
                                                            {sectionLevelResources.length} tài liệu
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                                isSectionOpen ? 'bg-red-50 text-[#8B2E2E]' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {isSectionOpen ? (
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                )}
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50/80 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                                            <span className="font-bold text-slate-700">Danh sách bài học</span>
                                            <span>{section.lessons.length} bài</span>
                                        </div>
                                    )}

                                    {/* Lessons List in Section */}
                                    <div
                                        className={`transition-all duration-300 ${
                                            !hasSectionTitle || isSectionOpen ? 'block' : 'hidden'
                                        }`}
                                    >
                                        <div className="divide-y divide-slate-100">
                                            {section.lessons.map((lesson, lessonIndex) => {
                                                const lessonKey = lesson.id || lesson.videoId;
                                                const isCurrent =
                                                    currentLessonId === lessonKey ||
                                                    (currentLessonId === undefined &&
                                                        section.sectionIndex === 0 &&
                                                        lessonIndex === 0);
                                                const isCompleted = !!progress[lessonKey];
                                                const isLocked =
                                                    isPreviewMode &&
                                                    !previewableLessonKeySet.has(lessonKey);
                                                const lessonResources = lessonResourceMap[lessonKey] || [];
                                                const lessonContentType = normalizeLessonContentType(lesson);
                                                const LessonTypeIcon = lessonContentType === LESSON_CONTENT_TYPES.MIXED
                                                    ? Sparkles
                                                    : lessonContentType === LESSON_CONTENT_TYPES.AUDIO
                                                        ? Headphones
                                                        : lessonContentType === LESSON_CONTENT_TYPES.VIDEO
                                                            ? Video
                                                            : lessonHasArticle(lessonContentType)
                                                                ? FileText
                                                                : ImageIcon;

                                                return (
                                                    <button
                                                        key={lessonKey || `${section.sectionIndex}-${lessonIndex}`}
                                                        type="button"
                                                        onClick={() =>
                                                            isLocked
                                                                ? onLockedLessonSelect?.(lesson)
                                                                : onLessonSelect?.(lesson)
                                                        }
                                                        className={`relative flex w-full items-start gap-3 px-3.5 py-4 text-left transition-all md:gap-2.5 md:py-3 ${
                                                            isCurrent
                                                                ? 'bg-red-50/80 border-l-4 border-l-[#8B2E2E]'
                                                                : isLocked
                                                                    ? 'bg-slate-50/40 hover:bg-amber-50/50'
                                                                    : 'bg-white hover:bg-slate-50/80'
                                                        }`}
                                                    >
                                                        {/* Status Icon */}
                                                        <div className="mt-0.5 shrink-0">
                                                            {isCurrent ? (
                                                                <div className="h-5 w-5 rounded-full bg-[#8B2E2E] text-white flex items-center justify-center shadow-sm">
                                                                    <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
                                                                </div>
                                                            ) : isCompleted ? (
                                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                            ) : isLocked ? (
                                                                <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                                                    <Lock className="h-3 w-3" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                                                    {lessonIndex + 1}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Title & Meta info */}
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`line-clamp-3 text-[15px] leading-relaxed md:line-clamp-2 md:text-xs md:leading-snug ${
                                                                isCurrent
                                                                    ? 'font-bold text-[#8B2E2E]'
                                                                    : isLocked
                                                                        ? 'font-medium text-slate-500'
                                                                        : 'font-semibold text-slate-800'
                                                            }`}>
                                                                {lesson.title}
                                                            </p>

                                                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-400 md:text-[11px]">
                                                                <span className="flex items-center gap-1 font-semibold text-slate-500">
                                                                    <LessonTypeIcon className="h-3 w-3" />
                                                                    {getLessonContentTypeLabel(lessonContentType, true)}
                                                                </span>

                                                                {(lessonContentType === LESSON_CONTENT_TYPES.VIDEO || lessonHasAudio(lessonContentType)) && lesson.duration && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {lesson.duration}
                                                                    </span>
                                                                )}

                                                                {isPreviewMode && !isLocked && (
                                                                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                                                                        Học thử
                                                                    </span>
                                                                )}

                                                                {isLocked && (
                                                                    <span className="rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-100">
                                                                        Khóa
                                                                    </span>
                                                                )}

                                                                {lessonResources.length > 0 && (
                                                                    <span className="flex items-center gap-0.5 text-red-600 font-semibold">
                                                                        <FileText className="h-3 w-3" />
                                                                        {lessonResources.length} tài liệu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center text-xs text-slate-400">
                            Không tìm thấy bài học nào phù hợp.
                        </div>
                    )
                ) : filteredResourceGroups.length > 0 ? (
                    filteredResourceGroups.map((group) => {
                        const isGroupOpen =
                            openResourceGroups[group.key] ??
                            (group.isCurrentSection || group.isGeneral || true);

                        return (
                            <div
                                key={group.key}
                                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all"
                            >
                                {/* Group Header Accordion Trigger */}
                                <button
                                    type="button"
                                    onClick={() => toggleResourceGroup(group.key, true)}
                                    className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-3 text-left transition-colors ${
                                        isGroupOpen
                                            ? 'bg-slate-50/90 border-b border-slate-100'
                                            : 'bg-white hover:bg-slate-50/60'
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <h4 className="line-clamp-1 text-xs font-bold text-slate-800">
                                                {group.title}
                                            </h4>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-red-50 border border-red-100 px-2 py-0.2 text-[10px] font-bold text-[#8B2E2E]">
                                            {group.resources.length}
                                        </span>
                                        <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                                            isGroupOpen ? 'bg-red-50 text-[#8B2E2E]' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {isGroupOpen ? (
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {/* Resources List in Group */}
                                <div
                                    className={`transition-all duration-300 ${
                                        isGroupOpen ? 'block' : 'hidden'
                                    }`}
                                >
                                    <div className="divide-y divide-slate-100 p-2 space-y-1.5">
                                        {group.resources.map((resource) => {
                                            const isCurrentResource =
                                                resource.isCurrentContext ||
                                                currentLessonId === resource.lessonId;

                                            return (
                                                <div
                                                    key={resource.id}
                                                    className={`rounded-xl border p-2.5 transition-all flex items-start gap-2.5 ${
                                                        isCurrentResource
                                                            ? 'border-red-200 bg-red-50/60'
                                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                                    }`}
                                                >
                                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                        isCurrentResource
                                                            ? 'bg-red-100 text-[#8B2E2E]'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        <FileText className="h-4 w-4" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            onClick={() => onResourceSelect?.(resource)}
                                                            className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-[#8B2E2E] cursor-pointer transition-colors leading-snug"
                                                            title={resource.name}
                                                        >
                                                            {resource.name}
                                                        </p>

                                                        {resource.lessonTitle && (
                                                            <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                                                                Bài: {resource.lessonTitle}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                                        <a
                                                            href={getViewerUrl(resource.url)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-red-50 border border-red-100 text-[10px] font-bold text-[#8B2E2E] hover:bg-red-100 transition-colors"
                                                            title="Xem tài liệu"
                                                        >
                                                            <Eye className="h-3 w-3 mr-0.5" />
                                                            Xem
                                                        </a>
                                                        <a
                                                            href={resource.url}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center justify-center p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                        Chưa có tài liệu nào.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerSidebar;
