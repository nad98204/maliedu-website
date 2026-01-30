import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, PlayCircle, CheckCircle, Lock, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlayerSidebar = ({
    sections = [],
    currentLessonId,
    progress = {}, // { lessonId: true/false }
    onLessonSelect
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openSections, setOpenSections] = useState({});

    // Initialize all sections as open by default
    useEffect(() => {
        if (sections.length > 0) {
            const initialOpen = {};
            sections.forEach((_, idx) => initialOpen[idx] = true);
            setOpenSections(initialOpen);
        }
    }, [sections]);

    const toggleSection = (idx) => {
        setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Filter logic
    const filteredSections = sections.map(section => ({
        ...section,
        lessons: section.lessons ? section.lessons.filter(l =>
            l.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) : []
    })).filter(section => section.lessons.length > 0);

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3">Nội dung khóa học</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài học..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-secret-wax rounded-lg text-sm pl-9 pr-4 py-2 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredSections.map((section, sIdx) => {
                    return (
                        <div key={sIdx} className="border-b border-slate-100 last:border-0">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(sIdx)}
                                className="w-full px-4 py-3 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                                <div className="text-left">
                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{section.title}</h4>
                                    <span className="text-xs text-slate-500">
                                        {section.lessons.length} bài học
                                    </span>
                                </div>
                                {openSections[sIdx] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>

                            {/* Section Lessons */}
                            <div className={`transition-all duration-300 overflow-hidden ${openSections[sIdx] ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                {section.lessons.map((lesson, lIdx) => {
                                    // Identify state
                                    const isCurrent = currentLessonId === lesson.id || (currentLessonId === undefined && sIdx === 0 && lIdx === 0);
                                    const isCompleted = progress[lesson.id];
                                    const isLocked = false;

                                    return (
                                        <button
                                            key={lIdx}
                                            onClick={() => onLessonSelect(lesson)}
                                            className={`w-full flex items-start gap-3 p-3 transition-all text-left border-l-4 ${isCurrent
                                                ? 'bg-red-50 border-[#B91C1C]'
                                                : 'bg-white hover:bg-slate-50 border-transparent'
                                                }`}
                                        >
                                            {/* Status Icon */}
                                            <div className="mt-0.5 shrink-0">
                                                {isCurrent ? (
                                                    <PlayCircle className="w-4 h-4 text-[#B91C1C] animate-pulse" />
                                                ) : isCompleted ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                ) : isLocked ? (
                                                    <Lock className="w-4 h-4 text-slate-300" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium line-clamp-2 ${isCurrent ? 'text-[#B91C1C]' : 'text-slate-700'
                                                    }`}>
                                                    {lesson.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Video className="w-3 h-3" /> {lesson.duration || "00:00"}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlayerSidebar;
