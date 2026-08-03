/** Khớp với `id` trên wrapper form trong KhoiThongDongTien / Leader */
export const DANG_KY_ANCHOR_ID = "dang-ky";

/** Cột nội dung chứa lazy section — dùng MutationObserver để bù scroll khi DOM nở */
export const KHOI_THONG_MAIN_ID = "khoi-thong-main";

/** Yêu cầu các section lazy mount trước khi bắt đầu cuộn tới form. */
export const REVEAL_LAZY_SECTIONS_EVENT = "khoi-thong:reveal-lazy-sections";

let cancelActiveScroll = null;

function getScrollPaddingTopPx() {
  const raw = getComputedStyle(document.documentElement).scrollPaddingTop;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Vị trí đầu form sau khi trừ scroll-padding (sticky header). */
function getRegistrationScrollTop(el) {
  const pad = getScrollPaddingTopPx();
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - pad);
}

/**
 * Cuộn tới khối đăng ký bằng một chuyển động liên tục. Đích được tính lại mỗi
 * frame nên vẫn bám đúng form khi các section lazy phía trên đang nở chiều cao.
 */
export function scrollToRegistrationForm() {
  const el = document.getElementById(DANG_KY_ANCHOR_ID);
  if (!el) return;

  window.dispatchEvent(new CustomEvent(REVEAL_LAZY_SECTIONS_EVENT));

  try {
    window.history.replaceState(null, "", `#${DANG_KY_ANCHOR_ID}`);
  } catch {
    /* ignore */
  }

  cancelActiveScroll?.();

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const previousInlineScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const restoreScrollBehavior = () => {
    if (previousInlineScrollBehavior) {
      root.style.scrollBehavior = previousInlineScrollBehavior;
    } else {
      root.style.removeProperty("scroll-behavior");
    }
  };

  if (prefersReducedMotion) {
    const align = () => window.scrollTo({ top: getRegistrationScrollTop(el), left: 0, behavior: "auto" });
    requestAnimationFrame(() => requestAnimationFrame(align));
    window.setTimeout(align, 500);
    window.setTimeout(align, 1400);
    window.setTimeout(restoreScrollBehavior, 1450);
    return;
  }

  const startedAt = performance.now();
  let previousFrameAt = startedAt;
  let previousTarget = getRegistrationScrollTop(el);
  let targetStableSince = startedAt;
  let rafId = 0;
  let cancelled = false;

  const stopEvents = ["wheel", "touchstart", "pointerdown"];
  const cleanup = () => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    stopEvents.forEach((eventName) => window.removeEventListener(eventName, cleanup));
    restoreScrollBehavior();
    if (cancelActiveScroll === cleanup) cancelActiveScroll = null;
  };

  stopEvents.forEach((eventName) => window.addEventListener(eventName, cleanup, { passive: true }));
  cancelActiveScroll = cleanup;

  const animate = (now) => {
    if (cancelled) return;

    const target = getRegistrationScrollTop(el);
    if (Math.abs(target - previousTarget) > 1) targetStableSince = now;
    previousTarget = target;

    const frameDuration = Math.min(50, Math.max(1, now - previousFrameAt));
    const easing = 1 - Math.exp(-frameDuration / 320);
    const current = window.scrollY;
    const next = current + (target - current) * easing;
    window.scrollTo({ top: next, left: 0, behavior: "auto" });

    previousFrameAt = now;
    const remaining = Math.abs(target - next);
    const targetIsStable = now - targetStableSince >= 180;
    const reachedTarget = targetIsStable && remaining <= 1.5;
    const timedOut = now - startedAt >= 3000;

    if (reachedTarget || timedOut) {
      window.scrollTo({ top: target, left: 0, behavior: "auto" });
      cleanup();
      return;
    }

    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);
}
