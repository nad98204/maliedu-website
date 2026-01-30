import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { BookOpen, GraduationCap, Users, ShoppingCart, Tag, Layout, Settings } from "lucide-react";

import { auth } from "../firebase";

const AdminLayout = () => {
  const navigate = useNavigate();

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
          <div className="text-lg font-semibold tracking-wide">
            Mali Edu Admin
          </div>
          <p className="mt-1 text-xs text-slate-400">Dashboard quan tri</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/admin/dashboard" className={getNavClasses}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/banners" className={getNavClasses}>
            Quản lý Trang chủ
          </NavLink>
          <NavLink to="/admin/posts" className={getNavClasses}>
            Tin Tức & Bài Viết
          </NavLink>
          <NavLink to="/admin/knowledge" className={getNavClasses}>
            <BookOpen className="h-4 w-4" />
            Kho Kiến Thức
          </NavLink>
          <NavLink to="/admin/courses" className={getNavClasses}>
            <GraduationCap className="h-4 w-4" />
            Khóa học Online
          </NavLink>
          <NavLink to="/admin/orders" className={getNavClasses}>
            <ShoppingCart className="h-4 w-4" />
            Quản lý Đơn hàng
          </NavLink>
          <NavLink to="/admin/students" className={getNavClasses}>
            <Users className="h-4 w-4" />
            Học viên
          </NavLink>
          <NavLink to="/admin/recruitment" className={getNavClasses}>
            Tuyển dụng
          </NavLink>
          <NavLink to="/admin/testimonials" className={getNavClasses}>
            Cảm nhận học viên
          </NavLink>
          <NavLink to="/admin/landings" className={getNavClasses}>
            <Layout className="h-4 w-4" />
            Quản lý Landing Page
          </NavLink>
          <NavLink to="/admin/settings" className={getNavClasses}>
            <Settings className="h-4 w-4" />
            Cấu hình hệ thống
          </NavLink>

        </nav>
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Dang xuat
          </button>
        </div>
      </aside>

      <div className="flex-1 bg-slate-50">
        <div className="px-6 py-6">
          <Outlet />
        </div>
      </div>
    </div >
  );
};

export default AdminLayout;
