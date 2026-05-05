# 📂 TỔNG QUAN CẤU TRÚC DỰ ÁN (PROJECT STRUCTURE)

Dự án **MaliEdu-Website** là một ứng dụng Web Fullstack được xây dựng trên nền tảng **React (Vite)** cho Frontend và **Firebase** cho Backend (Hosting, Functions, Firestore).

---

## 🏗️ Sơ đồ cấu trúc chính

```text
MaliEdu-Website/
├── functions/              # Backend (Firebase Cloud Functions)
│   ├── index.js            # Entry point của các Cloud Functions
│   └── capi_helper.js      # Xử lý Meta Conversion API (CAPI)
│
├── public/                 # Static Assets (Ảnh, favicon, robots.txt)
│
├── src/                    # Source Code chính (Frontend)
│   ├── assets/             # Hình ảnh, font, icons nội bộ
│   ├── components/         # Các UI Components tái sử dụng
│   │   ├── admin/          # Components riêng cho trang quản trị
│   │   ├── Header.jsx      # Thanh điều hướng chính
│   │   ├── Footer.jsx      # Chân trang
│   │   └── SEO.jsx         # Quản lý Meta Tags
│   │
│   ├── context/            # Quản lý trạng thái toàn cục (Auth, Cart)
│   ├── data/               # Dữ liệu tĩnh hoặc cấu hình local
│   ├── firebase.js         # Cấu hình kết nối Firebase Client
│   ├── landing-templates/  # Các mẫu Landing Page (Hệ thống template linh hoạt)
│   ├── layouts/            # Các khung bố cục (AdminLayout, MainLayout)
│   ├── pages/              # Các trang chính của Website
│   │   ├── admin/          # Các trang quản lý (Dashboard, CRM, Builder)
│   │   ├── CourseList.jsx  # Danh sách khóa học
│   │   └── Home.jsx        # Trang chủ
│   │
│   ├── services/           # Xử lý API, CRM Integration, logic nghiệp vụ
│   ├── styles/             # Cấu hình CSS toàn cục
│   ├── utils/              # Các hàm bổ trợ (Format, Meta Pixel helpers)
│   ├── App.jsx             # Định nghĩa Routes và luồng ứng dụng
│   └── main.jsx            # Entry point của React
│
├── .env                    # Biến môi trường (API Keys, Secret IDs)
├── firebase.json           # Cấu hình Firebase Hosting & Functions
├── tailwind.config.js      # Cấu hình giao diện Tailwind CSS
├── vite.config.js          # Cấu hình công cụ Build Vite
└── package.json            # Quản lý thư viện và scripts dự án
```

---

## 📑 Các File Tài Liệu Quan Trọng

- `README.md`: Hướng dẫn chung về dự án.
- `LANDING_STRUCTURE.md`: Tài liệu chi tiết về hệ thống Landing Page và cách thêm template mới.
- `CRM_INTEGRATION_GUIDE.md`: Hướng dẫn về luồng tích hợp dữ liệu với CRM.

---

## 🌐 Domain & Firebase Hosting

- **Domain chính thức**: `https://luathapdan.vn` (Cấu hình trong `src/seo/routeSeo.js`).
- **Firebase Project ID**: `maliedu-web`.
- **Hosting Config (`firebase.json`)**:
  - Thư mục build: `dist`.
  - API Rewrites: `/api/**` -> Cloud Function `uploadApi` (vùng `asia-southeast1`).
  - SPA Rewrites: Mọi path khác trỏ về `index.html`.

---

## 🛣️ Hệ thống Routing (`App.jsx`)

Dự án sử dụng `react-router-dom` với cơ chế **Lazy Loading** cho tất cả các trang để tối ưu hiệu suất.

### 1. Nhóm Landing Pages (Funnel)
Các trang này thường được cấu hình ẩn Header/Footer (thông qua logic `hideChrome` trong `App.jsx`):
- `/dao-tao/khoi-thong-dong-tien`: Landing chính (Ads).
- `/dao-tao/luat-hap-dan`: Landing Luật Hấp Dẫn.
- `/dao-tao/vut-toc-muc-tieu`: Landing Vút Tốc Mục Tiêu.
- `/landing/:templateId`: Viewer động cho các template trong `src/landing-templates/`.
- `/cam-on-khoi-thong`: Trang cảm ơn sau khi đăng ký.

### 2. Nhóm Trang Chính (Standard)
- `/`: Trang chủ.
- `/khoa-hoc`: Danh sách khóa học.
- `/khoa-hoc/:slug`: Chi tiết khóa học.
- `/bai-giang/:courseId`: Trình phát video bài giảng (Player).
- `/thanh-toan/:courseId`: Trang thanh toán (Checkout).

### 3. Nhóm Quản Trị (Admin)
Tất cả các route bắt đầu bằng `/admin/*` đều được bảo vệ bởi component `AdminRoute`:
- `/admin/dashboard`: Tổng quan.
- `/admin/orders`: Quản lý đơn hàng.
- `/admin/landings`: Quản lý Landing Pages CRM.
- `/admin/landing-builder`: Công cụ xây dựng Landing Page.

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, React-hot-toast.
- **Backend**: Node.js (Firebase Functions).
- **Database**: Firebase Firestore.
- **Tracking**: Meta Pixel & Meta Conversion API (CAPI).
- **Deployment**: Firebase Hosting.

---
*Cập nhật lần cuối: 05/05/2026*
