import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "lucide-react";

import { auth, db } from "../firebase";
import { hasModuleAccess, isSuperAdminEmail } from "../utils/adminAccess";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [allowedModules, setAllowedModules] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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
      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
      isActive
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
    ].join(" ");

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="text-lg font-semibold tracking-wide">Mali Edu Admin</div>
          <p className="mt-1 text-xs text-slate-400">Dashboard quan tri</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {hasAccess("dashboard") && (
            <NavLink to="/admin/dashboard" className={getNavClasses}>
              Dashboard
            </NavLink>
          )}
          {hasAccess("banners") && (
            <NavLink to="/admin/banners" className={getNavClasses}>
              Quản lý Trang chủ
            </NavLink>
          )}
          {hasAccess("posts") && (
            <NavLink to="/admin/posts" className={getNavClasses}>
              Tin tức & Bài viết
            </NavLink>
          )}
          {hasAccess("knowledge") && (
            <NavLink to="/admin/knowledge" className={getNavClasses}>
              <BookOpen className="h-4 w-4" />
              Kho Kiến Thức
            </NavLink>
          )}
          {hasAccess("courses") && (
            <NavLink to="/admin/courses" className={getNavClasses}>
              <GraduationCap className="h-4 w-4" />
              Khóa học Online
            </NavLink>
          )}
          {hasAccess("orders") && (
            <NavLink to="/admin/orders" className={getNavClasses}>
              <ShoppingCart className="h-4 w-4" />
              Quản lý Đơn hàng
            </NavLink>
          )}
          {hasAccess("students") && (
            <NavLink to="/admin/students" className={getNavClasses}>
              <Users className="h-4 w-4" />
              Học viên
            </NavLink>
          )}
          {hasAccess("recruitment") && (
            <NavLink to="/admin/recruitment" className={getNavClasses}>
              Tuyển dụng
            </NavLink>
          )}
          {hasAccess("testimonials") && (
            <NavLink to="/admin/testimonials" className={getNavClasses}>
              Cảm nhận học viên
            </NavLink>
          )}
          {hasAccess("landings") && (
            <NavLink to="/admin/landings" className={getNavClasses}>
              <Layout className="h-4 w-4" />
              Quản lý Landing Page
            </NavLink>
          )}
          {hasAccess("landing-builder") && (
            <NavLink to="/admin/landing-builder" className={getNavClasses}>
              <Sparkles className="h-4 w-4" />
              Tạo Landing Page
            </NavLink>
          )}
          {hasAccess("storage") && (
            <NavLink to="/admin/storage" className={getNavClasses}>
              <Folder className="h-4 w-4" />
              Kho Lưu Trữ
            </NavLink>
          )}
          {hasAccess("settings") && (
            <NavLink to="/admin/settings" className={getNavClasses}>
              <Settings className="h-4 w-4" />
              Cấu hình hệ thống
            </NavLink>
          )}
        </nav>
        <div className="px-4 pb-6 border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 bg-slate-50 relative h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="p-6 min-h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
