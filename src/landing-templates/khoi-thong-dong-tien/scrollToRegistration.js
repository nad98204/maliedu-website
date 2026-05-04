/** Khớp với `id` trên wrapper form trong KhoiThongDongTien / Leader */
export const DANG_KY_ANCHOR_ID = "dang-ky";

/** Cột nội dung chứa lazy section — dùng MutationObserver để bù scroll khi DOM nở */
export const KHOI_THONG_MAIN_ID = "khoi-thong-main";

function getScrollPaddingTopPx() {
  const raw = getComputedStyle(document.documentElement).scrollPaddingTop;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Cuộn tới đầu #dang-ky, trừ scroll-padding (sticky header). Ưu tiên ổn định hơn scrollIntoView một số WebView. */
function alignRegistrationToViewport(el, behavior = "auto") {
  const pad = getScrollPaddingTopPx();
  const top = el.getBoundingClientRect().top + window.scrollY - pad;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior });
}

/**
 * Cuộn tới khối đăng ký. Section lazy phía trên mount trễ → đẩy #dang-ky xuống dần;
 * dùng window.scrollTo + scroll-padding và chỉnh lặp khi DOM/resize đổi.
 *
 * Chỉ dùng behavior "auto" (không smooth) để tránh layout shift giữa chừng trong animation.
 */
export function scrollToRegistrationForm() {
  const el = document.getElementById(DANG_KY_ANCHOR_ID);
  if (!el) return;

  try {
    window.history.replaceState(null, "", `#${DANG_KY_ANCHOR_ID}`);
  } catch {
    /* ignore */
  }

  const run = () => alignRegistrationToViewport(el, "auto");

  run();

  const delayed = [
    50, 120, 220, 350, 500, 700, 900, 1200, 1550, 1950, 2400, 3000, 3700, 4500,
  ];
  delayed.forEach((ms) => window.setTimeout(run, ms));
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });

  let roRaf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(roRaf);
    roRaf = requestAnimationFrame(run);
  });
  ro.observe(el);
  const main = document.getElementById(KHOI_THONG_MAIN_ID);
  if (main) ro.observe(main);

  window.setTimeout(() => ro.disconnect(), 5000);

  let moTimer = 0;
  if (main) {
    const mo = new MutationObserver(() => {
      clearTimeout(moTimer);
      moTimer = window.setTimeout(() => requestAnimationFrame(run), 48);
    });
    mo.observe(main, { childList: true, subtree: true });
    window.setTimeout(() => mo.disconnect(), 5000);
  }
}
