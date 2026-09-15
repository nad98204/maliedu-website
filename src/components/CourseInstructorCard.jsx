import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, Users } from "lucide-react";
import InstructorAvatar from "./InstructorAvatar";
import { getCourseInstructorBadge } from "../utils/courseInstructors";

const CourseInstructorCard = ({ instructor, stats, showPrimary = false }) => {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const canExpand = instructor.bio.length > 140 || instructor.bio.split("\n").length > 3;
  const name = <h3 className="break-words text-base font-bold leading-snug text-slate-900">{instructor.name}</h3>;
  const badge = getCourseInstructorBadge(instructor, showPrimary);

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <InstructorAvatar avatar={instructor.avatar} name={instructor.name} />
        <div className="min-w-0 flex-1">
          {badge && (
            <span className="mb-1 inline-block max-w-full break-words text-[10px] font-semibold uppercase tracking-wide text-slate-500">{badge}</span>
          )}
          {instructor.id ? (
            <Link to={`/giang-vien/${encodeURIComponent(instructor.id)}`} className="transition hover:text-secret-wax hover:underline">{name}</Link>
          ) : name}
          {instructor.title && <p className="mt-1 break-words text-xs leading-relaxed text-secret-wax">{instructor.title}</p>}
        </div>
      </div>
      {stats && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{stats.students.toLocaleString("vi-VN")} học viên</span>
          <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{stats.courses.toLocaleString("vi-VN")} khóa học</span>
        </div>
      )}
      {instructor.bio && (
        <div className="mt-3">
          <p className={`whitespace-pre-line break-words text-sm leading-relaxed text-slate-600 ${isBioExpanded || !canExpand ? "" : "line-clamp-3"}`}>{instructor.bio}</p>
          {canExpand && (
            <button type="button" onClick={() => setIsBioExpanded((value) => !value)} aria-expanded={isBioExpanded} className="mt-2 text-xs font-semibold text-secret-wax hover:underline">
              {isBioExpanded ? "Thu gọn" : "Xem tiểu sử"}
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default CourseInstructorCard;
