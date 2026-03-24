import { Home, Info, GraduationCap, PlayCircle, Newspaper, Layout } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { isAdminUser, isSuperAdminEmail, getFirstAllowedAdminPath } from "../utils/adminAccess";
import MobileActionSheet from "./MobileActionSheet";

const NAV_ITEMS = [
    { id: 'home', label: "Trang chủ", icon: Home, path: "/" },
    {
        id: 'about', label: "Giới thiệu", icon: Info, path: "/gioi-thieu",
        children: [
            { label: "Về Mali Edu", path: "/gioi-thieu" },
            { label: "Mong Coaching", path: "/gioi-thieu/mong-coaching" }
        ]
    },
    {
        id: 'training', label: "Đào tạo", icon: GraduationCap, path: "/dao-tao",
        children: [
            { label: "Luật Hấp Dẫn", path: "/dao-tao/luat-hap-dan" },
            { label: "Khơi Thông Dòng Tiền", path: "/dao-tao/khoi-thong-dong-tien" },
            { label: "Vút Tốc Mục Tiêu", path: "/dao-tao/vut-toc-muc-tieu" }
        ]
    },
    { id: 'courses', label: "Khóa học", icon: PlayCircle, path: "/khoa-hoc" },
    { id: 'news', label: "Tin tức", icon: Newspaper, path: "/tin-tuc" },
];

const BottomNav = () => {
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPath, setAdminPath] = useState("/admin/dashboard");

    useEffect(() => {
        let unsubscribeDoc = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            unsubscribeDoc();
            if (!user) {
                setIsAdmin(false);
                return;
            }

            if (isSuperAdminEmail(user.email)) {
                setIsAdmin(true);
                setAdminPath("/admin/dashboard");
                return;
            }

            unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
                const userData = snapshot.exists() ? snapshot.data() : {};
                const isUserAdmin = isAdminUser({
                    email: user.email,
                    role: userData.role
                });
                setIsAdmin(isUserAdmin);
                if (isUserAdmin) {
                    setAdminPath(getFirstAllowedAdminPath({
                        allowedModules: userData.allowedModules || [],
                        isSuperAdmin: false
                    }));
                }
            });
        });

        return () => {
            unsubscribeDoc();
            unsubscribeAuth();
        };
    }, []);

    const handleNavClick = (e, item) => {
        if (item.children) {
            e.preventDefault();
            setActiveMenu(item);
        }
    };

    const currentNavItems = [...NAV_ITEMS];
    if (isAdmin) {
        currentNavItems.push({ id: 'admin', label: "Quản trị", icon: Layout, path: adminPath });
    }

    const gridColsClass = currentNavItems.length === 6 ? "grid-cols-6" : "grid-cols-5";

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden block">
                <div className={`grid ${gridColsClass} h-16`}>
                    {currentNavItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={(e) => handleNavClick(e, item)}
                                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? "text-[#B91C1C]" : "text-gray-500 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[9px] mt-1 font-medium truncate max-w-full px-0.5">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <MobileActionSheet
                isOpen={!!activeMenu}
                onClose={() => setActiveMenu(null)}
                title={activeMenu?.label}
                items={activeMenu?.children}
            />
        </>
    );
};

export default BottomNav;
