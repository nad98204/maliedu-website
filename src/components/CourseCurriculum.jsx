import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, Lock, ChevronDown, ChevronUp, Clock, Eye } from 'lucide-react';

const CourseCurriculum = ({ curriculum, isFreeCourse, courseId, onPreviewClick }) => {
    const [openSections, setOpenSections] = useState({ 0: true }); // Default open first section only

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

    // Check if all are open
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
        <div className="mb-10" id="curriculum">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold font-sans text-slate-900">Nội dung khóa học</h3>
                    <button
                        onClick={toggleAll}
                        className="text-sm font-bold text-slate-900 hover:text-secret-wax transition-colors flex items-center gap-1"
                    >
                        <span className="text-[10px]">{areAllOpen ? '▲' : '▼'}</span>
                        <span className="whitespace-nowrap underline underline-offset-4 decoration-2">
                            {areAllOpen ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                        </span>
                    </button>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                    <span className="font-bold text-slate-900">{sections.length}</span> chương •
                    <span className="font-bold text-slate-900"> {totalLessons}</span> bài học •
                    <span className="font-bold text-slate-900"> {formatDuration(Math.round(totalDuration))}</span>
                </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                {sections.map((section, idx) => (
                    <div key={idx} className="border-b border-slate-200 last:border-0">
                        {/* Header */}
                        <button
                            onClick={() => toggleSection(idx)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {openSections[idx] ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                <span className="font-bold text-slate-800">{section.title}</span>
                            </div>
                            <span className="text-xs text-slate-500">{section.lessons.length} bài học</span>
                        </button>

                        {/* Lessons List */}
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections[idx] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white">
                                {section.lessons.map((lesson, lIdx) => {
                                    // Determine availability:
                                    // 1. Course is Free -> All open
                                    // 2. Lesson has isFreePreview flag -> Open
                                    const isAccessible = isFreeCourse || lesson.isFreePreview;

                                    return (
                                        <div key={lIdx} className="flex items-center justify-between p-3 pl-10 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {lesson.type === 'file' ? (
                                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                ) : (
                                                    <PlayCircle className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-secret-wax transition-colors" />
                                                )}
                                                <span className="text-sm text-slate-700 truncate font-medium group-hover:text-secret-ink transition-colors">
                                                    {lesson.title}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {String(lesson.duration).includes(':') ? lesson.duration : `${lesson.duration || 0}:00`}
                                                </span>

                                                {isAccessible ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onPreviewClick) {
                                                                onPreviewClick();
                                                            } else {
                                                                navigate(`/bai-giang/${courseId}`);
                                                            }
                                                        }}
                                                        className="text-xs font-bold text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded cursor-pointer hover:bg-green-100"
                                                    >
                                                        Học thử
                                                    </button>
                                                ) : (
                                                    <Lock className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseCurriculum;
