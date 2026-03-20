import React, { useMemo, useState } from 'react';
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    Lock,
    PlayCircle,
    Search,
    Video
} from 'lucide-react';

const PlayerSidebar = ({
    sections = [],
    resources = [],
    currentLessonId,
    progress = {},
    onLessonSelect
}) => {
    const [activeTab, setActiveTab] = useState('curriculum');
    const [lessonSearchTerm, setLessonSearchTerm] = useState('');
    const [resourceSearchTerm, setResourceSearchTerm] = useState('');
    const [openSections, setOpenSections] = useState({});


    const totalLessons = useMemo(
        () => sections.reduce((total, section) => total + (section.lessons?.length || 0), 0),
        [sections]
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

    const filteredResources = useMemo(() => {
        const keyword = resourceSearchTerm.trim().toLowerCase();

        return resources.filter((resource) => {
            if (!keyword) return true;

            return [
                resource.name,
                resource.lessonTitle,
                resource.sectionTitle,
                resource.sourceLabel
            ].some((value) => value?.toLowerCase().includes(keyword));
        });
    }, [resourceSearchTerm, resources]);

    const toggleSection = (sectionIndex) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionIndex]: !(prev[sectionIndex] ?? true)
        }));
    };
    const searchValue = activeTab === 'curriculum' ? lessonSearchTerm : resourceSearchTerm;
    const setSearchValue =
        activeTab === 'curriculum' ? setLessonSearchTerm : setResourceSearchTerm;

    return (
        <div className="flex h-full flex-col border-l border-slate-200 bg-white">
            <div className="space-y-4 border-b border-slate-200 p-4">
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
                        Nội dung khóa học
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
                        Tài liệu
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'curriculum'
                                ? 'Tìm kiếm bài học...'
                                : 'Tìm kiếm tài liệu...'
                        }
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="w-full rounded-lg border border-transparent bg-slate-100 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-secret-wax focus:bg-white"
                    />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                        {activeTab === 'curriculum'
                            ? 'Nội dung khóa học'
                            : 'Tài liệu đính kèm'}
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
                        filteredSections.map((section) => (
                            <div
                                key={`${section.sectionIndex}-${section.title}`}
                                className="border-b border-slate-100 last:border-0"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.sectionIndex)}
                                    className="flex w-full items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="text-left">
                                        <h4 className="line-clamp-1 text-sm font-bold text-slate-800">
                                            {section.title}
                                        </h4>
                                        <span className="text-xs text-slate-500">
                                            {section.lessons.length} bài học
                                        </span>
                                    </div>
                                    {(openSections[section.sectionIndex] ?? true) ? (
                                        <ChevronUp className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    )}
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        (openSections[section.sectionIndex] ?? true) ? 'max-h-[1000px]' : 'max-h-0'
                                    }`}
                                >
                                    {section.lessons.map((lesson, lessonIndex) => {
                                        const lessonKey = lesson.id || lesson.videoId;
                                        const isCurrent =
                                            currentLessonId === lessonKey ||
                                            (currentLessonId === undefined &&
                                                section.sectionIndex === 0 &&
                                                lessonIndex === 0);
                                        const isCompleted = !!progress[lessonKey];
                                        const isLocked = false;

                                        return (
                                            <button
                                                key={lessonKey || `${section.sectionIndex}-${lessonIndex}`}
                                                type="button"
                                                onClick={() => onLessonSelect?.(lesson)}
                                                className={`flex w-full items-start gap-3 border-l-4 p-3 text-left transition-all ${
                                                    isCurrent
                                                        ? 'border-[#B91C1C] bg-red-50'
                                                        : 'border-transparent bg-white hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {isCurrent ? (
                                                        <PlayCircle className="h-4 w-4 animate-pulse text-[#B91C1C]" />
                                                    ) : isCompleted ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : isLocked ? (
                                                        <Lock className="h-4 w-4 text-slate-300" />
                                                    ) : (
                                                        <div className="h-4 w-4 rounded-full border border-slate-300"></div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`line-clamp-2 text-sm font-medium ${
                                                            isCurrent ? 'text-[#B91C1C]' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        {lesson.title}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                                            <Video className="h-3 w-3" />
                                                            {lesson.duration || '00:00'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-slate-400">
                            Không tìm thấy bài học phù hợp.
                        </div>
                    )
                ) : filteredResources.length > 0 ? (
                    filteredResources.map((resource) => {
                        const isCurrentLesson = currentLessonId === resource.lessonId;

                        return (
                            <div
                                key={resource.id}
                                className={`border-b border-slate-100 p-4 last:border-0 ${
                                    isCurrentLesson ? 'bg-red-50/60' : 'bg-white'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            isCurrentLesson
                                                ? 'bg-red-100 text-[#B91C1C]'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <FileText className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                                            {resource.name}
                                        </p>

                                        {resource.lessonTitle && resource.lesson ? (
                                            <button
                                                type="button"
                                                onClick={() => onLessonSelect?.(resource.lesson)}
                                                className="mt-1 line-clamp-1 text-left text-xs font-medium text-slate-500 transition-colors hover:text-[#B91C1C]"
                                            >
                                                {resource.sourceLabel || `Buoi: ${resource.lessonTitle}`}
                                            </button>
                                        ) : (
                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                {resource.sourceLabel || "Tai lieu chung cua khoa hoc"}
                                            </p>
                                        )}

                                        {resource.sectionTitle && (
                                            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                                {resource.sectionTitle}
                                            </p>
                                        )}
                                    </div>

                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-[#B91C1C]"
                                        title="Mở tài liệu"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
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
