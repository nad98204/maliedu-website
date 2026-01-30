import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from 'react-hot-toast';

import AdminRoute from "./components/AdminRoute";
import Footer from "./components/Footer";
import Header from "./components/Header";
import FloatingContact from "./components/FloatingContact";
import AdminLayout from "./layouts/AdminLayout";
import Home from "./pages/Home";
import KhoiThongDongTien from "./pages/landing/KhoiThongDongTien";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminRecruitment from "./pages/admin/AdminRecruitment";
import AdminLandings from "./pages/admin/AdminLandings";
import AdminSettings from "./pages/admin/AdminSettings";

import RecruitmentDetail from "./pages/RecruitmentDetail";
import AdminKnowledge from "./pages/admin/AdminKnowledge";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminLogin from "./pages/admin/Login";
import GioiThieu from "./pages/GioiThieu";
import MongCoaching from "./pages/about/MongCoaching";
import DaoTao from "./pages/DaoTao";
import Contact from "./pages/Contact";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import PostDetail from "./pages/PostDetail";
import Testimonials from "./pages/Testimonials";
import PostList from "./pages/PostList";
import Recruitment from "./pages/Recruitment";
import AdminCourses from "./pages/admin/AdminCourses";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import CoursePlayer from "./pages/CoursePlayer";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import Profile from "./pages/Profile";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminInstructors from "./pages/admin/AdminInstructors";
import InstructorProfile from "./pages/InstructorProfile";
import ResetPassword from "./pages/ResetPassword"; // New Import


import AdminDashboard from "./pages/admin/AdminDashboard";
import { CartProvider } from "./context/CartContext";
import Cart from "./pages/Cart";
import OrderHistory from "./pages/OrderHistory";
import ScrollToTop from "./components/ScrollToTop";
import BottomNav from "./components/BottomNav";

const AppShell = () => {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith(
    "/dao-tao/khoi-thong-dong-tien"
  );

  return hideChrome ? (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <Routes>
          <Route
            path="/dao-tao/khoi-thong-dong-tien"
            element={<KhoiThongDongTien />}
          />
          <Route path="/thanh-toan/:courseId" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route
            path="*"
            element={<Navigate to="/dao-tao/khoi-thong-dong-tien" replace />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  ) : (
    <div className="min-h-screen flex flex-col bg-white">
      {!location.pathname.startsWith('/bai-giang/') && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gioi-thieu" element={<GioiThieu />} />
          <Route path="/dao-tao" element={<DaoTao />} />
          <Route
            path="/dao-tao/khoi-thong-dong-tien"
            element={<KhoiThongDongTien />}
          />
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
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/lien-he" element={<Contact />} />
          <Route path="/thanh-toan/:courseId" element={<Checkout />} />
          <Route path="/gio-hang" element={<Cart />} />
          <Route path="/lich-su-don-hang" element={<OrderHistory />} />
          <Route path="/dat-hang-thanh-cong/:orderId" element={<OrderSuccess />} />
          <Route path="/ca-nhan" element={<Profile />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="settings" element={<AdminSettings />} />
            <Route path="coupons" element={<AdminCoupons />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <FloatingContact />
      <BottomNav />
      {!location.pathname.startsWith('/bai-giang/') && !location.pathname.startsWith('/admin') && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <AppShell />
        <Toaster position="top-center" />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
