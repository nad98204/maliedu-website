import React, { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

import AdminRoute from "./components/AdminRoute";
import Footer from "./components/Footer";
import Header from "./components/Header";
import FloatingContact from "./components/FloatingContact";
import AdminLayout from "./layouts/AdminLayout";
import ScrollToTop from "./components/ScrollToTop";
import BottomNav from "./components/BottomNav";
import { CartProvider } from "./context/CartContext";

// Lazy Loaded Pages
const Home = lazy(() => import("./pages/Home"));
const GioiThieu = lazy(() => import("./pages/GioiThieu"));
const DaoTao = lazy(() => import("./pages/DaoTao"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const PostList = lazy(() => import("./pages/PostList"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Recruitment = lazy(() => import("./pages/Recruitment"));
const RecruitmentDetail = lazy(() => import("./pages/RecruitmentDetail"));
const CourseList = lazy(() => import("./pages/CourseList"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const MyCourses = lazy(() => import("./pages/MyCourses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const CourseTaiLieu = lazy(() => import("./pages/CourseTaiLieu"));
const CourseGhiChep = lazy(() => import("./pages/CourseGhiChep"));
const Register = lazy(() => import("./pages/Register"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Cart = lazy(() => import("./pages/Cart"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPageViewer = lazy(() => import("./pages/LandingPageViewer"));

// Landing Templates
const KhoiThongDongTien = lazy(() => import("./landing-templates").then(m => ({ default: m.KhoiThongDongTien })));
const CamOnKhoiThong = lazy(() => import("./landing-templates/khoi-thong-dong-tien/CamOnKhoiThong"));
const LuatHapDan = lazy(() => import("./pages/landingpage/LuatHapDan"));
const VutTocMucTieu = lazy(() => import("./pages/landingpage/VutTocMucTieu"));
const MongCoaching = lazy(() => import("./pages/about/MongCoaching"));

// Admin Pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminInstructors = lazy(() => import("./pages/admin/AdminInstructors"));
const AdminRecruitment = lazy(() => import("./pages/admin/AdminRecruitment"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminKnowledge = lazy(() => import("./pages/admin/AdminKnowledge"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminLandings = lazy(() => import("./pages/admin/AdminLandings"));
const AdminLandingBuilder = lazy(() => import("./pages/admin/landing-builder/AdminLandingBuilder"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminStorage = lazy(() => import("./pages/admin/AdminStorage"));

const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-red-700 border-t-transparent" />
    </div>
  </div>
);

const AppShell = () => {
  const location = useLocation();
  const isPlayerRoute = location.pathname.startsWith('/bai-giang/');
  const hideChromePaths = [
    "/dao-tao/khoi-thong-dong-tien",
    "/dao-tao/luat-hap-dan",
    "/dao-tao/vut-toc-muc-tieu",
    "/landing",
    "/cam-on-khoi-thong",
  ];
  const hideChrome = hideChromePaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className={hideChrome ? "" : "min-h-screen flex flex-col bg-white"}>
      {!hideChrome && !isPlayerRoute && (
        location.pathname.startsWith('/admin') ? (
          <div className="hidden lg:block">
            <Header />
          </div>
        ) : (
          <Header />
        )
      )}
      <main className={hideChrome ? "" : "flex-1"}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing / Checkout Simple Routes */}
            <Route path="/dao-tao/khoi-thong-dong-tien" element={<KhoiThongDongTien />} />
            <Route path="/cam-on-khoi-thong" element={<CamOnKhoiThong />} />
            <Route path="/dao-tao/luat-hap-dan" element={<LuatHapDan />} />
            <Route path="/dao-tao/vut-toc-muc-tieu" element={<VutTocMucTieu />} />
            <Route path="/landing/:templateId" element={<LandingPageViewer />} />
            <Route path="/thanh-toan/:courseId" element={<Checkout />} />
            
            {/* Standard Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/gioi-thieu" element={<GioiThieu />} />
            <Route path="/dao-tao" element={<DaoTao />} />
            <Route path="/gioi-thieu/mong-coaching" element={<MongCoaching />} />
            <Route path="/tin-tuc" element={<News />} />
            <Route path="/tin-tuc/:slug" element={<NewsDetail />} />
            <Route path="/bai-viet/:slug" element={<PostDetail />} />
            <Route path="/kien-thuc/:slug" element={<PostList />} />
            <Route path="/cam-nhan/:category?" element={<Testimonials />} />
            <Route path="/tuyen-dung" element={<Recruitment />} />
            <Route path="/tuyen-dung/:id" element={<RecruitmentDetail />} />
            <Route path="/khoa-hoc" element={<CourseList />} />
            <Route path="/khoa-hoc/:slug" element={<CourseDetail />} />
            <Route path="/giang-vien/:id" element={<InstructorProfile />} />
            <Route path="/khoa-hoc-cua-toi" element={<MyCourses />} />
            <Route path="/bai-giang/:courseId" element={<CoursePlayer />} />
            <Route path="/tai-lieu/:courseId" element={<CourseTaiLieu />} />
            <Route path="/ghi-chep/:courseId" element={<CourseGhiChep />} />
            <Route path="/dang-ky" element={<Register />} />
            <Route path="/lien-he" element={<Contact />} />
            <Route path="/gio-hang" element={<Cart />} />
            <Route path="/cart" element={<Navigate to="/gio-hang" replace />} />
            <Route path="/lich-su-don-hang" element={<OrderHistory />} />
            <Route path="/orders" element={<Navigate to="/lich-su-don-hang" replace />} />
            <Route path="/dat-hang-thanh-cong/:orderId" element={<OrderSuccess />} />
            <Route path="/ca-nhan" element={<Profile />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="instructors" element={<AdminInstructors />} />
              <Route path="recruitment" element={<AdminRecruitment />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="knowledge" element={<AdminKnowledge />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="landings" element={<AdminLandings />} />
              <Route path="landing-builder" element={<AdminLandingBuilder />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="storage" element={<AdminStorage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!hideChrome && (
        <>
          <div className={isPlayerRoute ? 'hidden md:block' : ''}>
            <FloatingContact />
          </div>
          {!isPlayerRoute && <BottomNav />}
          {!isPlayerRoute && !location.pathname.startsWith('/admin') && <Footer />}
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <HelmetProvider>
          <ScrollToTop />
          <AppShell />
          <Toaster position="top-center" />
        </HelmetProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
