export const SUPER_ADMIN_EMAILS = ["mongcoaching@gmail.com"];

export const ADMIN_MODULES = [
  { key: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
  { key: "banners", label: "Trang chủ", path: "/admin/banners" },
  { key: "posts", label: "Tin tức & bài viết", path: "/admin/posts" },
  { key: "knowledge", label: "Kho kiến thức", path: "/admin/knowledge" },
  { key: "courses", label: "Khóa học online", path: "/admin/courses" },
  { key: "categories", label: "Danh mục", path: "/admin/categories" },
  { key: "orders", label: "Đơn hàng", path: "/admin/orders" },
  { key: "reviews", label: "Đánh giá", path: "/admin/reviews" },
  { key: "students", label: "Học viên", path: "/admin/students" },
  { key: "instructors", label: "Giảng viên", path: "/admin/instructors" },
  { key: "recruitment", label: "Tuyển dụng", path: "/admin/recruitment" },
  { key: "testimonials", label: "Cảm nhận học viên", path: "/admin/testimonials" },
  { key: "landings", label: "Landing page", path: "/admin/landings" },
  { key: "landing-builder", label: "Tạo landing page", path: "/admin/landing-builder" },
  { key: "settings", label: "Cấu hình", path: "/admin/settings" },
  { key: "coupons", label: "Mã giảm giá", path: "/admin/coupons" },
  { key: "storage", label: "Kho lưu trữ", path: "/admin/storage" },
];

export const COURSE_ACCOUNT_MANAGER_MODULES = ["dashboard", "students"];

export const isSuperAdminEmail = (email = "") =>
  SUPER_ADMIN_EMAILS.includes(String(email || "").toLowerCase());

export const isAdminUser = ({ email = "", role = "" } = {}) =>
  isSuperAdminEmail(email) || role === "admin";

export const hasModuleAccess = ({
  allowedModules = [],
  moduleKey,
  isSuperAdmin = false,
} = {}) => {
  if (!moduleKey || isSuperAdmin) {
    return true;
  }

  if (!Array.isArray(allowedModules) || allowedModules.length === 0) {
    return true;
  }

  return allowedModules.includes(moduleKey);
};

export const getAdminModuleByPathname = (pathname = "") => {
  const matchedModule = [...ADMIN_MODULES]
    .sort((left, right) => right.path.length - left.path.length)
    .find((module) => pathname.startsWith(module.path));

  return matchedModule?.key ?? null;
};

export const getFirstAllowedAdminPath = ({
  allowedModules = [],
  isSuperAdmin = false,
} = {}) => {
  if (isSuperAdmin || !Array.isArray(allowedModules) || allowedModules.length === 0) {
    return "/admin/dashboard";
  }

  const firstModule = ADMIN_MODULES.find((module) =>
    allowedModules.includes(module.key)
  );

  return firstModule?.path ?? "/admin/dashboard";
};

export const getAdminModuleLabel = (moduleKey) =>
  ADMIN_MODULES.find((module) => module.key === moduleKey)?.label || moduleKey;
