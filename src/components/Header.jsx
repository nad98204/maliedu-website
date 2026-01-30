import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Briefcase,
  ChevronDown,
  Facebook,
  LogIn,
  LogOut,
  Menu,
  Music2,
  Phone,
  Search,
  User,
  X,
  Youtube,
  BookOpen,
  ShoppingCart
} from "lucide-react";

import { auth } from "../firebase";
import { HOTLINE, MENU_ITEMS, SOCIALS } from "../menuData";
import { useCart } from "../context/CartContext";
import GlobalSearch from "./GlobalSearch";
import { logoutSession } from "../utils/sessionService";

const SOCIAL_LINKS = [
  { name: "Facebook", href: SOCIALS.facebook, Icon: Facebook },
  { name: "TikTok", href: SOCIALS.tiktok, Icon: Music2 },
  { name: "Youtube", href: SOCIALS.youtube, Icon: Youtube },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cartCount = 0 } = useCart() || {};
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (auth.currentUser) {
        await logoutSession(auth.currentUser.uid);
      }
      await signOut(auth);
      setMobileOpen(false);
      setUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Force signout anyway if session removal fails to avoid stuck user
      await signOut(auth);
      navigate("/");
    }
  };

  const toggleSubmenu = (key) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenSubmenus({});
  };

  return (
    <div className="w-full">
      <div className="bg-secret-wax text-secret-paper text-xs relative z-[60]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-3 items-center sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>Hotline: {HOTLINE}</span>
            </div>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  className="p-1 rounded-full hover:bg-white/10 transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Link
              to="/tuyen-dung"
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs rounded-full bg-secret-paper text-secret-wax font-medium shadow-sm hover:bg-white transition"
            >
              <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Tuyển dụng
            </Link>

            {currentUser && (
              <Link
                to="/gio-hang"
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs rounded-full bg-secret-paper text-secret-wax font-medium shadow-sm hover:bg-white transition mr-1"
              >
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Giỏ hàng
                {cartCount > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-3.5 px-1 text-[9px] sm:h-4 sm:text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs rounded-full border border-secret-paper/80 text-secret-paper font-medium hover:bg-white/10 transition"
                >
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {currentUser.displayName || currentUser.email?.split('@')?.[0] || 'User'}
                  <ChevronDown className="h-3 w-3" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white shadow-xl py-2 z-50 text-secret-ink">
                    {currentUser.email === "mongcoaching@gmail.com" && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Briefcase className="h-4 w-4" />
                        Dashboard Quản trị
                      </Link>
                    )}
                    <Link
                      to="/ca-nhan"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Trang cá nhân
                    </Link>
                    <Link
                      to="/lich-su-don-hang"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Briefcase className="h-4 w-4" />
                      Lịch sử đơn hàng
                    </Link>
                    <Link
                      to="/khoa-hoc-cua-toi"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BookOpen className="h-4 w-4" />
                      Khóa học của tôi
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs rounded-full border border-secret-paper/80 text-secret-paper font-medium hover:bg-white/10 transition"
              >
                <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Đăng nhập
              </Link>
            )}

          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-secret-paper/95 backdrop-blur shadow-md shadow-secret-ink/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <img
                src="https://res.cloudinary.com/dstukyjzd/image/upload/v1768455801/Logo_Mali_Ngang_M%C3%80U_CAM_u5lrng.png"
                alt="Mali Edu"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </a>

            <nav className="hidden lg:flex flex-1 items-center justify-center gap-6">
              {MENU_ITEMS.map((item) => {
                if (item.children?.length) {
                  return (
                    <div key={item.path} className="relative group">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-secret-ink hover:text-secret-wax transition cursor-pointer">
                        {item.label}
                        <ChevronDown className="h-4 w-4" />
                      </span>
                      <div className="absolute left-0 top-full -mt-2 min-w-[240px] opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-300 ease-in-out pt-6">
                        <div className="-mt-4 rounded-md border border-secret-wax/40 bg-secret-paper py-2 shadow-xl shadow-secret-ink/10 origin-top transition-all duration-200">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className="block px-4 py-2 text-sm text-secret-ink hover:bg-secret-wax/10 hover:text-secret-wax transition"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-sm font-medium text-secret-ink hover:text-secret-wax transition"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <GlobalSearch />
            </div>


            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-secret-ink hover:bg-secret-wax/10 transition"
              aria-label="Mở menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header >

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] bg-secret-ink/50 lg:hidden">
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-secret-paper text-secret-ink shadow-2xl shadow-secret-ink/20 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-secret-ink/10">
              <img
                src="https://res.cloudinary.com/dstukyjzd/image/upload/v1768455801/Logo_Mali_Ngang_M%C3%80U_CAM_u5lrng.png"
                alt="Mali Edu"
                className="h-9 sm:h-11 w-auto object-contain"
              />
              <button
                type="button"
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-secret-ink hover:bg-secret-wax/10 transition"
                aria-label="Đóng menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 py-4 flex-1 overflow-y-auto space-y-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secret-ink/50" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full rounded-full border border-secret-ink/20 bg-white/70 py-2 pl-9 pr-3 text-sm text-secret-ink placeholder:text-secret-ink/40 focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                />
              </div>

              {currentUser && (
                <Link
                  to="/gio-hang"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-2 py-2 text-secret-ink font-medium hover:text-secret-wax transition"
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  Giỏ hàng của bạn
                </Link>
              )}

              <nav className="space-y-3">
                {MENU_ITEMS.map((item) => {
                  const hasChildren = item.children?.length;
                  const isOpen = openSubmenus[item.path];

                  return (
                    <div
                      key={item.path}
                      className="border-b border-secret-ink/10 pb-3"
                    >
                      <div className="flex items-center justify-between">
                        {hasChildren ? (
                          <span
                            onClick={() => toggleSubmenu(item.path)}
                            className="text-base font-medium text-secret-ink cursor-pointer"
                          >
                            {item.label}
                          </span>
                        ) : (
                          <Link
                            to={item.path}
                            onClick={closeMobileMenu}
                            className="text-base font-medium text-secret-ink"
                          >
                            {item.label}
                          </Link>
                        )}
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => toggleSubmenu(item.path)}
                            className="p-2 text-secret-ink/70 hover:text-secret-wax transition"
                            aria-label={`Mở ${item.label}`}
                          >
                            <ChevronDown
                              className={`h-5 w-5 transition ${isOpen ? "rotate-180" : ""
                                }`}
                            />
                          </button>
                        )}
                      </div>
                      {hasChildren && isOpen && (
                        <div className="mt-2 space-y-1 pl-4 border-l border-secret-ink/20">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={closeMobileMenu}
                              className="block py-2 text-sm text-secret-ink/70 hover:text-secret-wax transition"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-2">
                <Link
                  to="/tuyen-dung"
                  onClick={closeMobileMenu}
                  className="w-full text-center px-4 py-2 rounded-full bg-secret-wax text-white text-sm font-semibold hover:bg-secret-wax/90 transition"
                >
                  Tuyển dụng
                </Link>

                {currentUser ? (
                  <div className="flex flex-col gap-2">
                    {currentUser.email === "mongcoaching@gmail.com" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={closeMobileMenu}
                        className="w-full text-center px-4 py-2 rounded-full border border-secret-ink/10 text-secret-ink text-sm font-semibold hover:bg-secret-ink/5 transition"
                      >
                        Dashboard Quản trị
                      </Link>
                    )}
                    <Link
                      to="/khoa-hoc-cua-toi"
                      onClick={closeMobileMenu}
                      className="w-full text-center px-4 py-2 rounded-full border border-secret-wax bg-secret-wax/5 text-secret-wax text-sm font-semibold hover:bg-secret-wax/10 transition"
                    >
                      <BookOpen className="inline-block h-4 w-4 mr-2" />
                      Khóa học của tôi
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-center px-4 py-2 rounded-full border border-red-500 text-red-500 text-sm font-semibold hover:bg-red-50 transition"
                    >
                      <LogOut className="inline-block h-4 w-4 mr-2" />
                      Đăng xuất ({currentUser.displayName || currentUser.email?.split('@')?.[0] || 'User'})
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/admin/login"
                    onClick={closeMobileMenu}
                    className="w-full text-center px-4 py-2 rounded-full border border-secret-wax text-secret-wax text-sm font-semibold hover:bg-secret-wax/10 transition"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-secret-ink/20">
                {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={name}
                    className="p-2 rounded-full border border-secret-wax/30 text-secret-ink/70 hover:text-secret-wax hover:border-secret-wax transition"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Header;
