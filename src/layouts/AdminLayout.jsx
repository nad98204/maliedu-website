import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  BookOpen,
  Folder,
  GraduationCap,
  Layout,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Home,
  FileText,
  Library,
  Video,
  CreditCard,
  Briefcase,
  MessageSquare,
  Globe,
  Database,
} from "lucide-react";

import { auth, db } from "../firebase";
import { hasModuleAccess, isSuperAdminEmail } from "../utils/adminAccess";
import { MALI_LOGO_URL } from "../constants/brandAssets.js";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowedModules, setAllowedModules] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAllowedModules([]);
        setIsSuperAdmin(false);
        return;
      }

      if (isSuperAdminEmail(currentUser.email)) {
        setAllowedModules([]);
        setIsSuperAdmin(true);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        setAllowedModules(userDoc.exists() ? userDoc.data().allowedModules || [] : []);
        setIsSuperAdmin(false);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setAllowedModules([]);
        setIsSuperAdmin(false);
      }
    });

    return unsubscribe;
  }, []);

  const hasAccess = (moduleKey) =>
    hasModuleAccess({
      allowedModules,
      isSuperAdmin,
      moduleKey,
    });

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  const getNavClasses = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-xl py-3 text-sm font-bold transition-all w-full",
      isCollapsed ? "justify-center px-0" : "px-4",
      isActive
        ? "bg-secret-wax text-white shadow-lg shadow-secret-wax/20 border border-secret-wax/10 scale-[1.02]"
        : "text-slate-500 hover:bg-slate-50 hover:text-secret-wax",
    ].join(" ");

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row relative font-sans transition-all duration-300">
      {/* MOBILE TOP NAVIGATION BAR (Admin Toolbar) */}
      <div className="lg:hidden w-full bg-white border-b border-slate-200 px-5 py-2 flex flex-row items-center justify-between shadow-sm relative z-40">
        <div className="flex items-center gap-3">
          <img
            src={MALI_LOGO_URL}
            alt="Mali Edu Logo"
            className="h-12 w-auto origin-left"
          />
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200 active:scale-95 transition-all outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99990] animate-in fade-in duration-300"
        />
      )}

      {/* SIDEBAR DRAWER (Desktop & Mobile) */}
      <aside
        className={`fixed lg:relative z-[99999] lg:z-10 h-[100dvh] lg:h-screen bg-white text-slate-600 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[20px_0_40px_rgba(0,0,0,0.1)] lg:shadow-none border-r border-slate-200 top-0 left-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${isCollapsed ? "lg:w-[84px]" : "w-[85vw] max-w-[320px] lg:w-72"}`}
      >
        {/* Sidebar Header (Mobile Only) */}
        <div className={`px-6 py-6 border-b border-slate-100 flex lg:hidden items-center justify-between bg-slate-50/30 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
            <img
              src={MALI_LOGO_URL}
              alt="Mali Edu Logo"
              className="h-12 w-auto origin-left"
            />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-secret-wax hover:bg-slate-50 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Collapse Toggle (Desktop Only) */}
        <div className={`hidden lg:flex items-center border-b border-slate-50 transition-all duration-300 ${isCollapsed ? 'justify-center py-6' : 'justify-between px-6 py-5'}`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-secret-wax/80">Quản trị</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Mali Education</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-secret-wax hover:border-secret-wax/30 hover:shadow-sm transition-all active:scale-95 ${isCollapsed ? '' : ''}`}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 py-6 lg:pt-8 space-y-1.5 overflow-y-auto w-full custom-scrollbar transition-all ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {hasAccess("dashboard") && (
            <NavLink to="/admin/dashboard" className={getNavClasses} title={isCollapsed ? "Dashboard" : ""}>
              <PieChart className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Dashboard</span>}
            </NavLink>
          )}
          {hasAccess("banners") && (
            <NavLink to="/admin/banners" className={getNavClasses} title={isCollapsed ? "Quản lý Trang chủ" : ""}>
              <Home className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Quản lý Trang chủ</span>}
            </NavLink>
          )}
          {hasAccess("posts") && (
            <NavLink to="/admin/posts" className={getNavClasses} title={isCollapsed ? "Tin tức & Bài viết" : ""}>
              <FileText className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Tin tức & Bài viết</span>}
            </NavLink>
          )}
          {hasAccess("knowledge") && (
            <NavLink to="/admin/knowledge" className={getNavClasses} title={isCollapsed ? "Kho Kiến Thức" : ""}>
              <Library className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Kho Kiến Thức</span>}
            </NavLink>
          )}
          {hasAccess("courses") && (
            <NavLink to="/admin/courses" className={getNavClasses} title={isCollapsed ? "Khóa học Online" : ""}>
              <Video className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Khóa học Online</span>}
            </NavLink>
          )}
          {hasAccess("orders") && (
            <NavLink to="/admin/orders" className={getNavClasses} title={isCollapsed ? "Quản lý Đơn hàng" : ""}>
              <CreditCard className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Quản lý Đơn hàng</span>}
            </NavLink>
          )}
          {hasAccess("students") && (
            <NavLink to="/admin/students" className={getNavClasses} title={isCollapsed ? "Quản lý Học viên" : ""}>
              <Users className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Quản lý Học viên</span>}
            </NavLink>
          )}
          {hasAccess("recruitment") && (
            <NavLink to="/admin/recruitment" className={getNavClasses} title={isCollapsed ? "Tuyển dụng" : ""}>
              <Briefcase className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Tuyển dụng</span>}
            </NavLink>
          )}
          {hasAccess("testimonials") && (
            <NavLink to="/admin/testimonials" className={getNavClasses} title={isCollapsed ? "Cảm nhận học viên" : ""}>
              <MessageSquare className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Cảm nhận học viên</span>}
            </NavLink>
          )}
          {hasAccess("landings") && (
            <NavLink to="/admin/landings" className={getNavClasses} title={isCollapsed ? "Quản lý Landing Page" : ""}>
              <Globe className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Quản lý Landing Page</span>}
            </NavLink>
          )}
          {hasAccess("landing-builder") && (
            <NavLink to="/admin/landing-builder" className={getNavClasses} title={isCollapsed ? "Tạo Landing Page" : ""}>
              <Sparkles className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Tạo Landing Page</span>}
            </NavLink>
          )}
          {hasAccess("storage") && (
            <NavLink to="/admin/storage" className={getNavClasses} title={isCollapsed ? "Kho Lưu Trữ" : ""}>
              <Database className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Kho Lưu Trữ</span>}
            </NavLink>
          )}
          {hasAccess("settings") && (
            <NavLink to="/admin/settings" className={getNavClasses} title={isCollapsed ? "Cấu hình hệ thống" : ""}>
              <Settings className="h-4 w-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">Cấu hình hệ thống</span>}
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-5 border-t border-slate-100 bg-slate-50/30">
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Đăng xuất" : ""}
            className={`w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-bold text-rose-500 transition-all hover:bg-rose-500 hover:text-white hover:border-rose-500 group ${isCollapsed ? 'px-0' : 'px-4'}`}
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              <LogOut className="w-4 h-4" />
            </span>
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-slate-50/50 relative h-[100dvh] lg:h-screen overflow-hidden flex flex-col min-w-0 w-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative pb-24 lg:pb-0">
          <div className="min-h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
