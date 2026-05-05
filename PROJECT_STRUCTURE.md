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

## 🛠️ Công nghệ sử dụng

- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion (Animation).
- **Backend**: Node.js (Firebase Functions).
- **Database**: Firebase Firestore.
- **Tracking**: Meta Pixel (Browser) & Meta Conversion API (Server).
- **Deployment**: Firebase Hosting.

---
*Cập nhật lần cuối: 05/05/2026*
