import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, Lock, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { getLessonKey, getPreviewableLessonKeys } from '../utils/courseAccess';

const CourseCurriculum = ({ course, courseId, onPreviewClick }) => {
    const navigate = useNavigate();
    const [openSections, setOpenSections] = useState({ 0: true }); // Default open first section only
    const curriculum = course?.curriculum;
    const previewableLessonKeys = new Set(getPreviewableLessonKeys(course));

    // Helper to format duration
    const formatDuration = (min) => {
        if (!min) return '00:00';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
    };

    // Proper Grouping Logic
    let sections = [];
    if (curriculum && curriculum.length > 0) {
        // Check if data is already in sections format (has 'lessons' array in items)
        const hasSections = curriculum[0].lessons && Array.isArray(curriculum[0].lessons);

        if (hasSections) {
            sections = curriculum;
        } else {
            // Flat list legacy fallback - wrap in single section
            sections = [{ title: "Nội dung khóa học", lessons: curriculum }];
        }
    } else {
        sections = [{ title: "Nội dung khóa học", lessons: [] }];
    }

    // Calculate stats
    let totalLessons = 0;
    let totalDuration = 0;

    sections.forEach(section => {
        totalLessons += section.lessons?.length || 0;
        section.lessons?.forEach(lesson => {
            const val = lesson.duration;
            let mins = 0;
            if (typeof val === 'number') {
                mins = val;
            } else if (typeof val === 'string' && val.includes(':')) {
                const parts = val.split(':').map(Number);
                // MM:SS -> parts[0] + parts[1]/60
                if (parts.length === 2) mins = parts[0] + (parts[1] || 0) / 60;
                // HH:MM:SS -> parts[0]*60 + parts[1]
                else if (parts.length === 3) mins = parts[0] * 60 + parts[1];
            } else {
                mins = Number(val) || 0;
            }
            totalDuration += mins;
        });
    });

    const toggleSection = (idx) => {
        setOpenSections(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const areAllOpen = sections.length > 0 && sections.every((_, idx) => openSections[idx]);

    const toggleAll = () => {
        if (areAllOpen) {
            setOpenSections({});
        } else {
            const all = {};
            sections.forEach((_, idx) => { all[idx] = true });
            setOpenSections(all);
        }
    };

    return (
        <div className="mb-12" id="curriculum">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Nội dung khóa học</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] sm:text-xs text-slate-600">
                            <span className="font-bold text-slate-900">{sections.length}</span> chương
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] sm:text-xs text-slate-600">
                            <span className="font-bold text-slate-900">{totalLessons}</span> bài học
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] sm:text-xs text-slate-600">
                            <span className="font-bold text-slate-900">{formatDuration(Math.round(totalDuration))}</span>
                        </span>
                    </div>
                </div>
                <button
                    onClick={toggleAll}
                    className="text-xs font-bold text-secret-wax hover:text-secret-ink transition-all flex items-center gap-1.5 self-start sm:self-auto bg-secret-wax/5 hover:bg-secret-wax/10 px-3 py-1.5 rounded-full"
                >
                    {areAllOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{areAllOpen ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}</span>
                </button>
            </div>

            <div className="space-y-4">
                {(() => {
                    let titledSectionCount = 0;
                    return sections.map((section, idx) => {
                        if (section.title) titledSectionCount++;
                        const displayNumber = section.title ? titledSectionCount : null;

                        return (
                            <div key={idx} className="group/section">
                                <div className={`overflow-hidden transition-all ${section.title ? 'border border-slate-200 rounded-xl bg-white shadow-sm hover:border-slate-300' : ''}`}>
                                    {/* Header */}
                                    {section.title ? (
                                        <button
                                            onClick={() => toggleSection(idx)}
                                            className={`w-full flex items-start sm:items-center justify-between p-4 transition-all duration-300 text-left ${openSections[idx] ? 'bg-slate-50/80' : 'bg-white hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-start sm:items-center gap-4 text-left w-full mr-4">
                                                <div className="flex flex-col items-center shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phần</span>
                                                    <span className="text-sm font-bold text-slate-600 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full">
                                                        {displayNumber}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-bold text-sm sm:text-base leading-snug transition-colors break-words ${openSections[idx] ? 'text-secret-ink' : 'text-slate-800'}`}>
                                                        {section.title}
                                                    </h4>
                                                    <div className="mt-1 flex items-center gap-3 text-[11px] font-medium text-slate-500">
                                                        <span>{section.lessons.length} bài học</span>
                                                        {section.lessons.some(l => previewableLessonKeys.has(getLessonKey(l))) && (
                                                            <span className="text-green-600 flex items-center gap-1">
                                                                <span className="h-1 w-1 rounded-full bg-green-500"></span>
                                                                Có bài học thử
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${openSections[idx] ? 'bg-secret-wax text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kiến thức bổ sung</span>
                                            <span className="text-[10px] font-medium text-slate-400">{section.lessons.length} bài học</span>
                                        </div>
                                    )}
    
                            {/* Lessons List */}
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections[idx] ? 'max-h-[3000px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0 invisible'}`}>
                                <div className="bg-white divide-y divide-slate-50">
                                    {section.lessons.map((lesson, lIdx) => {
                                        const lessonKey = getLessonKey(lesson);
                                        const isAccessible = lessonKey ? previewableLessonKeys.has(lessonKey) : false;
                                        
                                        // Detect "extra" lesson (lẻ) - heuristic: if title doesn't start with number after a sequence of numbered lessons
                                        const prevLesson = section.lessons[lIdx - 1];
                                        const isNumbered = (title) => /^[0-9\.]+|Nguyên lý [0-9]/.test(title);
                                        const showExtraDivider = prevLesson && isNumbered(prevLesson.title) && !isNumbered(lesson.title);
    
                                        return (
                                            <React.Fragment key={lIdx}>
                                                {showExtraDivider && (
                                                    <div className="bg-slate-50/50 px-4 py-2 border-y border-slate-50">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiến thức bổ sung</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between p-3.5 pl-4 sm:pl-12 hover:bg-slate-50/50 transition-all group">
                                                    <div className="flex items-start gap-3 overflow-hidden pr-2">
                                                        <div className="mt-0.5 shrink-0 bg-slate-100/50 p-1.5 rounded-md group-hover:bg-secret-wax/10 transition-colors">
                                                            {lesson.type === 'file' ? (
                                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                            ) : (
                                                                <PlayCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-secret-wax transition-colors" />
                                                            )}
                                                        </div>
                                                        <span className="text-[13px] sm:text-sm text-slate-600 font-medium group-hover:text-secret-ink transition-colors leading-relaxed">
                                                            {lesson.title}
                                                        </span>
                                                    </div>
    
                                                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                                                        <span className="hidden sm:flex text-xs text-slate-400 items-center gap-1 font-mono">
                                                            <Clock className="w-3 h-3" />
                                                            {String(lesson.duration).includes(':') ? lesson.duration : `${lesson.duration || 0}:00`}
                                                        </span>
    
                                                        {isAccessible ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onPreviewClick) {
                                                                        onPreviewClick(lesson);
                                                                    } else {
                                                                        const params = new URLSearchParams({ preview: '1' });
                                                                        if (lessonKey) {
                                                                            params.set('lesson', lessonKey);
                                                                        }
                                                                        navigate(`/bai-giang/${courseId}?${params.toString()}`);
                                                                    }
                                                                }}
                                                                className="text-[10px] font-bold text-white bg-green-500 hover:bg-green-600 px-2.5 py-1 rounded-full shadow-sm shadow-green-200 transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                Học thử
                                                            </button>
                                                        ) : (
                                                            <div className="p-1.5 rounded-full bg-slate-50 border border-slate-100/50">
                                                                <Lock className="w-3 h-3 text-slate-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })
        })()}
            </div>
        </div>
    );
};

export default CourseCurriculum;
