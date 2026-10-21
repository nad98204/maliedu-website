import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { loadRegistrationForm } from "./registrationContext";
import "./registrationDialog.css";

const FormDangKy = lazy(loadRegistrationForm);

export default function RegistrationDialog({ isOpen, hasOpened, onClose }) {
  const dialogRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const scrollY = window.scrollY;
    const body = document.body;
    const savedStyles = Object.fromEntries(
      ["position", "top", "width", "overflow", "paddingRight"].map((key) => [key, body.style[key]]),
    );
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPadding = parseFloat(getComputedStyle(body).paddingRight) || 0;

    Object.assign(body.style, {
      position: "fixed", top: `-${scrollY}px`, width: "100%", overflow: "hidden",
      paddingRight: `${bodyPadding + scrollbarWidth}px`,
    });
    dialog.showModal();
    const viewport = window.visualViewport;
    const fitViewport = () => {
      dialog.style.height = `${viewport?.height ?? window.innerHeight}px`;
      dialog.style.top = `${viewport?.offsetTop ?? 0}px`;
    };
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);

    return () => {
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      dialog.close();
      Object.assign(body.style, savedStyles);
      const root = document.documentElement;
      const scrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      root.style.scrollBehavior = scrollBehavior;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      id="leader-registration-dialog"
      aria-labelledby="leader-registration-title"
      aria-describedby="leader-registration-description"
      aria-modal="true"
      className="leader-registration-dialog"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const focusable = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')]
          .filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="flex h-full w-full items-end justify-center sm:items-center sm:p-5"
        onClick={(event) => {
          if (event.target === event.currentTarget && !isSubmitting) onClose();
        }}
      >
        <div className="leader-registration-panel relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl border border-[#D4B572]/60 bg-[#52110C] text-white shadow-2xl sm:rounded-3xl">
          <div className="relative shrink-0 border-b border-[#D4B572]/20 bg-gradient-to-br from-[#7D2015] to-[#52110C] px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
            <div className="mb-2 flex items-center gap-2 pr-12 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FFE388]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Khơi thông dòng tiền
            </div>
            <h2 id="leader-registration-title" className="pr-10 text-xl font-black leading-tight sm:text-2xl">
              Đăng ký 4 buổi học <span className="text-[#FFE065]">miễn phí</span>
            </h2>
            <p id="leader-registration-description" className="mt-2 pr-6 text-sm leading-relaxed text-white/75">
              Điền thông tin để nhận lịch học và link tham gia qua Zoom.
            </p>
            <button
              type="button"
              aria-label="Đóng form đăng ký"
              disabled={isSubmitting}
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFE065] disabled:opacity-40 sm:right-4 sm:top-4"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="leader-registration-body min-h-0 overflow-y-auto overscroll-contain">
            {hasOpened && (
              <Suspense fallback={<div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#FFE388]"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#FFE388]/30 border-t-[#FFE388]" />Đang mở form đăng ký…</div>}>
                <FormDangKy compact targetFunnel="leader" source_key="1768973783248" onSubmittingChange={setIsSubmitting} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
