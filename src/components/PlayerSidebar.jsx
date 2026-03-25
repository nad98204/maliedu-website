import React, { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    Lock,
    PlayCircle,
    Search,
    Video,
    X
} from 'lucide-react';

const getViewerUrl = (url = '') => {
    const lower = url.toLowerCase().split('?')[0];
    if (/\.(pdf)$/.test(lower)) return url;
    if (/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/.test(lower)) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`;
    }
    return url;
};

const buildResourcePreview = (resourceList = [], limit = 2) => {
    const names = [...new Set(resourceList.map((resource) => resource.name).filter(Boolean))];

    if (names.length === 0) {
        return '';
    }

    const preview = names.slice(0, limit).join(' • ');

    return names.length > limit ? `${preview} +${names.length - limit}` : preview;
};

const PlayerSidebar = ({
    sections = [],
    resources = [],
    resourceGroups = [],
    lessonResourceMap = {},
    sectionResourceMap = {},
    currentContextResources = [],
    hasResourceAccess = true,
    currentLessonId,
    progress = {},
    onLessonSelect,
    onResourceSelect,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState('curriculum');
    const [lessonSearchTerm, setLessonSearchTerm] = useState('');
    const [resourceSearchTerm, setResourceSearchTerm] = useState('');
    const [openSections, setOpenSections] = useState({});
    const [openResourceGroups, setOpenResourceGroups] = useState({});
    const availableTabs = hasResourceAccess ? ['curriculum', 'resources'] : ['curriculum'];

    const totalLessons = useMemo(
        () => sections.reduce((total, section) => total + (section.lessons?.length || 0), 0),
        [sections]
    );
    const completedLessons = useMemo(
        () => Object.values(progress).filter(Boolean).length,
        [progress]
    );

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

    const currentLessonMeta = useMemo(() => {
        if (!currentLessonId) return null;

        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
            const section = sections[sectionIndex];
            const lessonIndex = (section.lessons || []).findIndex(
                (lesson) => (lesson.id || lesson.videoId) === currentLessonId
            );

            if (lessonIndex >= 0) {
                return {
                    lesson: section.lessons[lessonIndex],
                    sectionTitle: section.title,
                    lessonNumber:
                        sections
                            .slice(0, sectionIndex)
                            .reduce(
                                (total, currentSection) =>
                                    total + (currentSection.lessons?.length || 0),
                                0
                            ) +
                        lessonIndex +
                        1
                };
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

    useEffect(() => {
        if (!availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0]);
        }
    }, [activeTab, availableTabs]);

    const searchValue = activeTab === 'curriculum' ? lessonSearchTerm : resourceSearchTerm;
    const setSearchValue =
        activeTab === 'curriculum' ? setLessonSearchTerm : setResourceSearchTerm;

    return (
        <div className="flex h-full flex-col border-l border-slate-200 bg-white">
            <div className="sticky top-0 z-10 space-y-4 border-b border-slate-200 bg-white/95 p-4 backdrop-blur md:static md:bg-white md:backdrop-blur-0">
                <div className="md:hidden">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-500">
                                Chương học, bài tập
                            </p>
                            <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-900">
                                {currentLessonMeta?.lesson?.title || 'Tiếp tục học'}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-600 ring-1 ring-red-100">
                                    {completedLessons}/{totalLessons} hoàn thành
                                </span>
                                {currentLessonMeta?.lessonNumber ? (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                                        Bài {currentLessonMeta.lessonNumber}
                                    </span>
                                ) : null}
                            </div>
                            {currentLessonMeta?.sectionTitle ? (
                                <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-500">
                                    {currentLessonMeta.sectionTitle}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={() => onClose?.()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                            aria-label="Đóng chương học và bài tập"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('curriculum')}
                        className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                            activeTab === 'curriculum'
                                ? 'bg-white text-[#B91C1C] shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <span className="md:hidden">Chương học</span>
                        <span className="hidden md:inline">Nội dung khóa học</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('resources')}
                        className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                            activeTab === 'resources'
                                ? 'bg-white text-[#B91C1C] shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <span className="md:hidden">Bài tập</span>
                        <span className="hidden md:inline">Tài liệu</span>
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'curriculum'
                                ? 'Tìm chương hoặc bài học...'
                                : 'Tìm bài tập, tài liệu...'
                        }
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="w-full rounded-lg border border-transparent bg-slate-100 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-secret-wax focus:bg-white"
                    />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                        {activeTab === 'curriculum'
                            ? 'Chương và bài học'
                            : 'Bài tập và tài liệu'}
                    </span>
                    <span>
                        {activeTab === 'curriculum'
                            ? `${totalLessons} bài học`
                            : `${resources.length} tài liệu`}
                    </span>
                </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto">
                {activeTab === 'curriculum' ? (
                    filteredSections.length > 0 ? (
                        (() => {
                            let titledSectionCount = 0;
                            let globalLessonIndex = 0;
                            return filteredSections.map((section, sIdx) => {
                                const sectionId = section.id || `section-${section.sectionIndex}`;
                                const sectionResources = sectionResourceMap[sectionId] || [];
                                const sectionLevelResources = sectionResources.filter(
                                    (resource) => !resource.lessonId
                                );
                                const isSectionOpen =
                                    openSections[section.sectionIndex] ??
                                    sectionId === currentSectionId;

                                if (section.title) titledSectionCount++;
                                const displaySectionNumber = section.title ? titledSectionCount : null;

                                return (
                                    <div
                                        key={`${sectionId}-${section.title}`}
                                        className={`border-b border-slate-100 last:border-0 ${section.title ? 'mb-3 last:mb-0' : 'mb-6 last:mb-0'} ${!section.title && sIdx > 0 ? 'mt-4' : ''}`}
                                    >
                                        <div className={`bg-white overflow-hidden ${section.title ? 'rounded-lg border border-slate-100 mx-2 shadow-sm' : 'border border-slate-100 shadow-sm sm:mx-2 sm:rounded-lg'}`}>
                                            {section.title ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleSection(
                                                            section.sectionIndex,
                                                            sectionId === currentSectionId
                                                        )
                                                    }
                                                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 transition-all ${
                                                        isSectionOpen 
                                                            ? 'bg-slate-50/80 border-b border-slate-100' 
                                                            : 'bg-white hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                Phần {displaySectionNumber}
                                                            </span>
                                                            {isSectionOpen && (
                                                                <span className="h-1 w-1 rounded-full bg-red-400"></span>
                                                            )}
                                                        </div>
                                                        <h4 className={`line-clamp-1 text-sm font-bold ${isSectionOpen ? 'text-[#B91C1C]' : 'text-slate-800'}`}>
                                                            {section.title}
                                                        </h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                            <span>{section.lessons.length} bài học</span>
                                                            {sectionLevelResources.length > 0 && (
                                                                <span className="flex items-center gap-1 text-red-500">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                                                    {sectionLevelResources.length} tài liệu
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isSectionOpen ? 'bg-red-50 text-[#B91C1C]' : 'bg-slate-50 text-slate-400'}`}>
                                                    {isSectionOpen ? (
                                                        <ChevronUp className="h-4 w-4 shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                            ) : (
                                                <div className="bg-slate-100/50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em]">Kiến thức bổ sung</span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-400">{section.lessons.length} bài học</span>
                                                </div>
                                            )}

                                        {sectionLevelResources.length > 0 && (
                                            <div className="px-4 pb-3">
                                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-red-500">
                                                    Tài liệu theo phần
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sectionLevelResources
                                                        .slice(0, 2)
                                                        .map((resource) => (
                                                            <button
                                                                key={resource.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    onResourceSelect?.(resource)
                                                                }
                                                                className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 ring-1 ring-red-100 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#B91C1C]"
                                                            >
                                                                {resource.name}
                                                            </button>
                                                        ))}
                                                    {sectionLevelResources.length > 2 && (
                                                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500 ring-1 ring-red-100">
                                                            +{sectionLevelResources.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${
                                            !section.title || isSectionOpen ? 'max-h-[2000px]' : 'max-h-0'
                                        }`}
                                    >
                                            {section.lessons.map((lesson, lessonIndex) => {
                                                globalLessonIndex++;
                                                const lessonKey = lesson.id || lesson.videoId;
                                                const isCurrent =
                                                    currentLessonId === lessonKey ||
                                                    (currentLessonId === undefined &&
                                                        section.sectionIndex === 0 &&
                                                        lessonIndex === 0);
                                                const isCompleted = !!progress[lessonKey];
                                                const isLocked = false;
                                                const lessonResources =
                                                    lessonResourceMap[lessonKey] || [];
                                                const visibleResources = lessonResources;
                                                const sectionOnlyCount = isCurrent
                                                    ? currentContextResources.filter(
                                                          (resource) =>
                                                              !resource.lessonId &&
                                                              resource.sectionId === sectionId
                                                      ).length
                                                    : 0;

                                                // Detect "extra" lesson (lẻ)
                                                const prevLesson = section.lessons[lessonIndex - 1];
                                                const isNumbered = (title) => /^[0-9\.]+|Nguyên lý [0-9]/.test(title);
                                                const showExtraDivider = prevLesson && isNumbered(prevLesson.title) && !isNumbered(lesson.title);

                                                return (
                                                    <React.Fragment key={lessonKey || `${section.sectionIndex}-${lessonIndex}`}>
                                                        {showExtraDivider && (
                                                            <div className="bg-slate-50/50 px-4 py-2 border-y border-slate-100/50">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiến thức bổ sung</span>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`border-l-4 transition-all ${
                                                                isCurrent
                                                                    ? 'border-[#B91C1C] bg-red-50'
                                                                    : 'border-transparent bg-white hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => onLessonSelect?.(lesson)}
                                                                className="flex w-full items-start gap-3 px-3 pt-3 text-left"
                                                            >
                                                                <div className="mt-0.5 shrink-0">
                                                                    {isCurrent ? (
                                                                        <PlayCircle className="h-4 w-4 animate-pulse text-[#B91C1C]" />
                                                                    ) : isCompleted ? (
                                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    ) : isLocked ? (
                                                                        <Lock className="h-4 w-4 text-slate-300" />
                                                                    ) : (
                                                                        <div className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                            {globalLessonIndex}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p
                                                                        className={`line-clamp-2 text-sm font-medium ${
                                                                            isCurrent
                                                                                ? 'text-[#B91C1C]'
                                                                                : 'text-slate-700'
                                                                        }`}
                                                                    >
                                                                        {lesson.title}
                                                                    </p>
                                                                    {visibleResources.length > 0 && (
                                                                        <span
                                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                                                                isCurrent
                                                                                    ? 'bg-[#B91C1C] text-white'
                                                                                    : 'bg-red-100 text-[#B91C1C]'
                                                                            }`}
                                                                        >
                                                                            {visibleResources.length}{' '}
                                                                            tài liệu
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                        <Video className="h-3 w-3" />
                                                                        {lesson.duration || '00:00'}
                                                                    </span>
                                                                    {lessonResources.length > 0 && (
                                                                        <span className="text-[11px] font-semibold text-red-500">
                                                                            Có tài liệu riêng
                                                                        </span>
                                                                    )}
                                                                    {sectionOnlyCount > 0 && (
                                                                        <span className="text-[11px] font-semibold text-red-500">
                                                                            + {sectionOnlyCount} tài
                                                                            liệu phần
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {visibleResources.length > 0 && (
                                                            <div className="px-3 pb-3">
                                                                <div
                                                                    className={`rounded-xl border px-2.5 py-2 ${
                                                                        isCurrent
                                                                            ? 'border-red-200 bg-white'
                                                                            : 'border-red-100 bg-red-50/70'
                                                                    }`}
                                                                >
                                                                    <p className="text-[11px] font-bold uppercase tracking-wide text-red-500">
                                                                        {isCurrent
                                                                            ? 'Tài liệu hiện có'
                                                                            : 'Tài liệu'}
                                                                    </p>
                                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                                        {visibleResources
                                                                            .slice(0, 2)
                                                                            .map((resource) => (
                                                                                <button
                                                                                    key={resource.id}
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        onResourceSelect?.(
                                                                                            resource
                                                                                        )
                                                                                    }
                                                                                    className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-red-100 transition-all hover:-translate-y-0.5 hover:text-[#B91C1C]"
                                                                                >
                                                                                    {resource.name}
                                                                                </button>
                                                                            ))}
                                                                        {visibleResources.length > 2 && (
                                                                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-red-500 ring-1 ring-red-100">
                                                                                +
                                                                                {visibleResources.length -
                                                                                    2}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        });
                    })()
                ) : (
                        <div className="px-4 py-10 text-center text-sm text-slate-400">
                            Không tìm thấy bài học phù hợp.
                        </div>
                    )
                ) : filteredResourceGroups.length > 0 ? (
                    filteredResourceGroups.map((group) => {
                        const isGroupOpen =
                            openResourceGroups[group.key] ??
                            (group.isCurrentSection || group.isGeneral);

                        return (
                            <div
                                key={group.key}
                                className="border-b border-slate-100 last:border-0"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleResourceGroup(
                                            group.key,
                                            group.isCurrentSection || group.isGeneral
                                        )
                                    }
                                    className="flex w-full items-start justify-between gap-3 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="min-w-0 flex-1 text-left">
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
                                        <p className="mt-2 line-clamp-2 text-[11px] font-medium text-red-500">
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
                                        isGroupOpen ? 'max-h-[2000px]' : 'max-h-0'
                                    }`}
                                >
                                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-3">
                                        {group.resources.map((resource) => {
                                            const isCurrentResource =
                                                resource.isCurrentContext ||
                                                currentLessonId === resource.lessonId;

                                            return (
                                                <div
                                                    key={resource.id}
                                                    className={`rounded-xl border p-3 ${
                                                        isCurrentResource
                                                            ? 'border-red-200 bg-red-50'
                                                            : 'border-slate-200 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                                isCurrentResource
                                                                    ? 'bg-red-100 text-[#B91C1C]'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            <FileText className="h-5 w-5" />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-start gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onResourceSelect?.(resource)
                                                                    }
                                                                    className="line-clamp-2 flex-1 text-left text-sm font-semibold text-slate-800 transition-colors hover:text-[#B91C1C]"
                                                                >
                                                                    {resource.name}
                                                                </button>
                                                                {isCurrentResource && (
                                                                    <span className="rounded-full bg-[#B91C1C] px-2 py-0.5 text-[11px] font-bold text-white">
                                                                        Đang dùng
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {resource.lessonId && resource.lesson ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onLessonSelect?.(
                                                                            resource.lesson
                                                                        )
                                                                    }
                                                                    className="mt-1 line-clamp-1 text-left text-xs font-medium text-slate-500 transition-colors hover:text-[#B91C1C]"
                                                                >
                                                                    {resource.lessonTitle ||
                                                                        'Bài học gắn tài liệu'}
                                                                </button>
                                                            ) : (
                                                                <p className="mt-1 text-xs font-medium text-slate-500">
                                                                    {resource.isGeneral
                                                                        ? 'Tài liệu chung của khóa học'
                                                                        : 'Tài liệu theo phần này'}
                                                                </p>
                                                            )}

                                                            {!group.isGeneral && (
                                                                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                                                    {group.title}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                                            <a
                                                                href={getViewerUrl(resource.url)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                                                                title="Đọc tài liệu"
                                                            >
                                                                Đọc
                                                            </a>
                                                            <a
                                                                href={resource.url}
                                                                download
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                                                title="Tải xuống"
                                                            >
                                                                Tải
                                                            </a>
                                                        </div>
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
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                        Chưa có tài liệu đính kèm.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerSidebar;
