# 📁 Hướng dẫn Tổ chức Landing Templates

## 🎯 Mục đích

Thư mục này chứa tất cả các templates landing page có thể tạo và quản lý qua Admin Panel.

## 📂 Cấu trúc Thư mục

```
landing-templates/
├── README.md                 (File này - Hướng dẫn)
├── index.js                 (Export tất cả templates)
├── example-template/        (Ví dụ mẫu - XÓA khi không cần)
│   ├── ExampleTemplate.jsx (Component chính)
│   ├── config.json         (Cấu hình metadata)
│   └── preview.png         (Ảnh preview - optional)
│
└── [tên-landing-page]/     (Mỗi landing page một folder)
    ├── [TênComponent].jsx  (Component React)
    ├── config.json         (Metadata: tên, mô tả, thumbnail...)
    └── preview.png         (Ảnh xem trước - optional)
```

## 🚀 Cách thêm Landing Page mới

### Bước 1: Tạo folder mới

```bash
mkdir src/landing-templates/ten-landing-page-moi
```

### Bước 2: Tạo file Component (VD: `src/landing-templates/ten-landing-page-moi/TenLanding.jsx`)

```jsx
import React from "react";

const TenLanding = () => {
  return (
    <div className="min-h-screen">
      {/* Nội dung landing page ở đây */}
      <h1>Landing Page Mới</h1>
    </div>
  );
};

export default TenLanding;
```

### Bước 3: Tạo file Config (`config.json`)

```json
{
  "id": "ten-landing-page-moi",
  "name": "Tên Landing Page Hiển Thị",
  "description": "Mô tả ngắn gọn về landing page này",
  "category": "ads", // ads, organic, event, course...
  "thumbnail": "./preview.png",
  "createdAt": "2026-02-04",
  "features": ["Responsive design", "SEO optimized", "Form đăng ký tích hợp"]
}
```

### Bước 4: Export trong `index.js`

Thêm vào file `src/landing-templates/index.js`:

```js
export { default as TenLanding } from "./ten-landing-page-moi/TenLanding";
```

## 📋 Quy tắc Đặt tên

1. **Folder**: `kebab-case` (chữ thường, dấu gạch ngang)
   - ✅ `khoi-thong-dong-tien-ads`
   - ❌ `KhoiThongDongTien_ADS`

2. **Component**: `PascalCase` (chữ hoa đầu)
   - ✅ `KhoiThongDongTienAds.jsx`
   - ❌ `khoiThongDongTienAds.jsx`

3. **Config ID**: khớp với tên folder
   - Folder: `khoi-thong-dong-tien-ads`
   - ID trong config: `"khoi-thong-dong-tien-ads"`

## 🏷️ Categories Gợi ý

- `ads` - Landing cho chạy quảng cáo
- `organic` - Landing cho traffic tự nhiên
- `event` - Landing cho sự kiện
- `course` - Landing giới thiệu khóa học
- `webinar` - Landing đăng ký webinar
- `promo` - Landing chương trình khuyến mãi

## 💡 Best Practices

1. **Mỗi landing một folder riêng** - Dễ quản lý, tìm kiếm
2. **Luôn có file config.json** - Metadata chuẩn
3. **Component độc lập** - Không phụ thuộc layout chung
4. **Responsive từ đầu** - Mobile-first approach
5. **SEO-friendly** - Meta tags, semantic HTML

## 🔧 Tích hợp với Admin

Landing templates sẽ tự động xuất hiện trong Admin Panel tại:
`/admin/landing-builder`

Admin có thể:

- ✅ Xem danh sách templates
- ✅ Preview landing page
- ✅ Copy URL để sử dụng
- ✅ Quản lý metadata

## 📞 Liên hệ

Khi cần code landing page mới, cung cấp:

1. Tên landing page
2. Mục đích sử dụng (ads, organic...)
3. Các section cần có (hero, form, testimonials...)
4. Reference design (nếu có)
