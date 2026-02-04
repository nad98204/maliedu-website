# 📊 CẤU TRÚC THƯ MỤC LANDING PAGE SYSTEM

## 🎯 Tổng quan

Hệ thống được tổ chức thành 2 phần chính:

1. **Admin Module** - Quản lý templates
2. **Templates** - Các landing pages thực tế

---

## 📂 Cấu trúc chi tiết

```
MaliEdu-Website/
│
├── src/
│   │
│   ├── pages/admin/
│   │   ├── landing-builder/              ← MODULE QUẢN LÝ
│   │   │   ├── AdminLandingBuilder.jsx   (Trang chính - Hiển thị grid templates)
│   │   │   ├── index.js                  (Export module)
│   │   │   ├── README.md                 (Hướng dẫn module)
│   │   │   │
│   │   │   ├── components/
│   │   │   │   └── TemplateCard.jsx      (Card hiển thị từng template)
│   │   │   │
│   │   │   └── utils/
│   │   │       └── templateHelpers.js    (Helper functions)
│   │   │
│   │   └── AdminLandings.jsx             (Quản lý Landing CRM - TAB KHÁC)
│   │
│   └── landing-templates/                ← TEMPLATES THỰC TẾ
│       ├── README.md                     (📖 HƯỚNG DẪN CHÍNH - ĐỌC ĐẦU TIÊN)
│       ├── index.js                      (Export tất cả templates)
│       │
│       └── example-template/             (Template mẫu)
│           ├── ExampleTemplate.jsx       (Component React)
│           ├── config.json               (Metadata)
│           └── preview.png               (Optional thumbnail)
│
└── App.jsx                               (Routing)
```

---

## 🔄 Quy trình làm việc

### Khi THÊM landing page mới:

1. **Tạo folder mới** trong `src/landing-templates/`

   ```bash
   mkdir src/landing-templates/ten-landing-moi
   ```

2. **Tạo 3 files**:
   - `TenLandingMoi.jsx` - Component React
   - `config.json` - Metadata (tên, mô tả, category...)
   - `preview.png` - (Optional) Ảnh xem trước

3. **Export** trong `src/landing-templates/index.js`

   ```js
   export { default as TenLandingMoi } from "./ten-landing-moi/TenLandingMoi";
   ```

4. **Update** `AdminLandingBuilder.jsx` để load template mới
   - Template sẽ tự động hiển thị trong admin grid

---

## 📋 Quy tắc đặt tên

| Thành phần | Format     | Ví dụ                        |
| ---------- | ---------- | ---------------------------- |
| Folder     | kebab-case | `khoi-thong-dong-tien-ads`   |
| Component  | PascalCase | `KhoiThongDongTienAds.jsx`   |
| Config ID  | kebab-case | `"khoi-thong-dong-tien-ads"` |

---

## 🏷️ Categories được hỗ trợ

- `ads` - Landing cho quảng cáo
- `organic` - Traffic tự nhiên
- `event` - Sự kiện
- `course` - Giới thiệu khóa học
- `webinar` - Đăng ký webinar
- `promo` - Khuyến mãi
- `example` - Template mẫu

---

## 🎨 Template Structure chuẩn

```json
{
  "id": "ten-template",
  "name": "Tên hiển thị",
  "description": "Mô tả ngắn gọn",
  "category": "ads",
  "thumbnail": "./preview.png",
  "slug": "/url-path",
  "createdAt": "2026-02-04",
  "status": "active",
  "features": ["Responsive", "SEO optimized", "Form integration"]
}
```

---

## 📞 Liên hệ Dev

Khi cần code landing mới, cung cấp:

- ✅ Tên landing page
- ✅ Mục đích (ads/organic/event...)
- ✅ Sections cần có (hero/form/pricing...)
- ✅ Reference design (nếu có)

---

## 🔗 Files quan trọng

| File                                                      | Mô tả               |
| --------------------------------------------------------- | ------------------- |
| `src/landing-templates/README.md`                         | **HƯỚNG DẪN CHÍNH** |
| `src/landing-templates/index.js`                          | Export templates    |
| `src/pages/admin/landing-builder/AdminLandingBuilder.jsx` | Giao diện admin     |
| `App.jsx`                                                 | Routing config      |

---

**📌 LƯU Ý**:

- `AdminLandings.jsx` = Quản lý CRM (tab khác)
- `AdminLandingBuilder.jsx` = Tạo landing pages (tab này)
- 2 tabs hoàn toàn độc lập!
