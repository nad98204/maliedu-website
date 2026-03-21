# Dòng Tiền Thịnh Vượng Từ Bản Thể

Landing page khoá huấn luyện tài chính "Dòng Tiền Thịnh Vượng Từ Bản Thể" của Mong Coaching.

## Files

- `DòngTiềnThịnhVượngTừBảnThể.jsx` — Component React chính của landing page.
- `config.json` — Metadata để hiển thị trong admin landing builder.

## Route preview

- `/landing/dong-tien-thinh-vuong-tu-ban-the`

---

## Các components dùng chung (shared)

| Component | Import path | Ghi chú |
|---|---|---|
| `<Footer />` | `../../components/Footer` | Footer chính của website Mali Edu |
| `<FloatingContact />` | `../../components/FloatingContact` | Nút Gọi + Zalo nổi góc màn hình |
| `<ScrollToTop />` | `../../components/ScrollToTop` | Cuộn về đầu trang |

---

## Cấu trúc layout

```
<main>
  ├── <section> Hero         — Tiêu đề, highlights, CTA
  ├── <section> Lộ trình     — #lo-trinh-hoc
  ├── <Footer />
  ├── <FloatingContact />
  └── <ScrollToTop />
</main>
```

---

## Quy ước Mobile / Desktop

### ✅ Nguyên tắc chính
- **Nút CTA trên mobile**: Dùng `block lg:hidden` để chỉ show trên mobile/tablet. Desktop có nút riêng ở cột phải.
- **Zoom card**: Trên desktop dùng `sticky top-24`, trên mobile không dùng sticky (thêm `lg:sticky`).
- **Padding section**: Mobile `py-12`, desktop `lg:py-24`.
- **Gap giữa các week**: Mobile `gap-8`, desktop `lg:gap-12`.
- **Border radius card**: Mobile `rounded-[28px]`, desktop `lg:rounded-[40px]`.
- **Padding card sessions**: Mobile `p-5`, tablet `sm:p-8`, desktop `lg:p-12`.
- **Spacing giữa buổi học**: Mobile `space-y-8`, desktop `lg:space-y-12`.

### 📐 Breakpoints sử dụng
- `sm` = 640px (tablet nhỏ)
- `md` = 768px (tablet lớn)
- `lg` = 1024px (desktop) ← điểm chia chính giữa mobile và desktop layout
- `xl` = 1280px (màn hình lớn, hiện Week sidebar)

### 📌 Ví dụ pattern đúng

```jsx
// Nút CTA chỉ hiện trên mobile, ẩn desktop
<div className="block lg:hidden">...</div>

// Nút CTA chỉ hiện trên desktop, ẩn mobile
<div className="hidden lg:block">...</div>

// Card zoom: sticky chỉ ở desktop
<div className="lg:sticky top-24 rounded-[24px] lg:rounded-[32px] p-5 lg:p-8">

// Section padding
<section className="py-12 lg:py-24">
```

---

## Thông tin khoá học

- **16 buổi học**: 12 buổi online tối (22h30 – 23h30) + 4 buổi Coach Zoom chuyên sâu
- **4 tuần**: Thức tỉnh → Gỡ tắc nghẽn → Tăng tốc → Kỷ luật
- **Nhóm Zalo**: https://zalo.me/g/vrop9wmdy45az0zzzquk
- **Đơn vị**: Mong Coaching / Mali Edu

---

## Lịch sử thay đổi

| Ngày | Thay đổi |
|---|---|
| 2026-03-17 | Thêm `<Footer />`, `<FloatingContact />`, `<ScrollToTop />` |
| 2026-03-17 | Thêm link Zalo vào tất cả nút CTA |
| 2026-03-17 | Tối ưu mobile layout: CTA hero, padding, Zoom card, spacing |
