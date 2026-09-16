import { Download, ExternalLink, FileText, FolderDown } from "lucide-react";

const QuickLessonResources = ({ resources = [], lessonTitle = "", onOpenAllResources }) => {
  if (!Array.isArray(resources) || resources.length === 0) return null;

  return (
    <section aria-label={`Tài liệu đính kèm${lessonTitle ? ` của ${lessonTitle}` : ""}`} className="mb-2 mt-5 animate-in rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 p-4 shadow-sm fade-in slide-in-from-top-2 duration-300 md:mb-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <FolderDown className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-900">
              Tài liệu thực hành đính kèm ({resources.length})
            </h2>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-amber-800/80">
              Tài liệu dành riêng cho buổi học này, bấm vào để mở hoặc tải về máy
            </p>
          </div>
        </div>

        {onOpenAllResources && (
          <button type="button" onClick={onOpenAllResources} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B2E2E] hover:underline">
            <span>Xem toàn bộ tài liệu khóa học</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource, index) => (
          <a
            key={resource.id || `${resource.url}-${index}`}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-white p-3 shadow-sm transition-all hover:border-[#8B2E2E] hover:shadow-md active:scale-[0.99]"
            title={`Mở hoặc tải về: ${resource.name || `Tài liệu bài học ${index + 1}`}`}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#8B2E2E] transition-colors group-hover:bg-[#8B2E2E] group-hover:text-white">
                <FileText className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-bold text-slate-800 transition-colors group-hover:text-[#8B2E2E]">
                {resource.name || `Tài liệu bài học ${index + 1}`}
              </span>
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-amber-100 group-hover:text-amber-800">
              <Download className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
};

export default QuickLessonResources;
