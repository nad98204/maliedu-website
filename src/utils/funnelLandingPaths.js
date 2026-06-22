/**
 * Route landing phễu: không cần Firebase (giỏ hàng / tra cứu pixel Firestore) ngay khi load.
 * Đồng bộ logic ẩn chrome trong App.jsx (hideChromePaths + khoi-thong-leader).
 */
export function isFunnelLandingPath(pathname) {
  if (!pathname) return false;
  const p =
    pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  if (p === "/cam-on-khoi-thong") return true;
  if (p.startsWith("/dao-tao/khoi-thong-dong-tien")) return true;
  if (p.startsWith("/dao-tao/luat-hap-dan")) return true;
  if (p.startsWith("/dao-tao/vut-toc-muc-tieu")) return true;
  if (p.startsWith("/dao-tao/chinh-phuc-muc-tieu")) return true;
  if (p.startsWith("/landing")) return true;

  return false;
}
