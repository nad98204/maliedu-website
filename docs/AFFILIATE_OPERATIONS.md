# Affiliate: vận hành và triển khai

## Chỗ chỉnh trong website

- Quản trị: `/admin/affiliates` — cài đặt chung, tỷ lệ từng khóa, CTV, yêu cầu rút và lịch sử hoa hồng.
- Cộng tác viên: `/affiliate` hoặc `/cong-tac-vien` — đăng ký, link giới thiệu, coupon, ngân hàng và rút tiền.
- Tạm khóa CTV sẽ vô hiệu hóa mã coupon và việc ghi nhận giới thiệu mới. Không xóa hồ sơ, số dư hay lịch sử cũ.

## Quy tắc hiện tại

1. API tạo đơn lấy giá/gói học từ máy chủ, xác minh coupon và lưu CTV vào đơn. Coupon của CTV được ưu tiên hơn link giới thiệu. Không ghi hoa hồng cho tự giới thiệu cùng UID/email.
2. Khi trạng thái đơn chuyển sang `completed`, trigger `onOrderCompleted` xử lý hoa hồng; áp dụng cho SePay và duyệt thủ công. API duyệt thủ công cũng gọi xử lý ngay.
3. Tỷ lệ ưu tiên: tỷ lệ riêng CTV → tỷ lệ từng khóa → mặc định. Hoa hồng tính trên tiền thực thu sau giảm giá, phân bổ theo giá từng khóa. Tỷ lệ được đọc lúc xử lý hoa hồng, không hồi tố các hoa hồng đã ghi.
4. Mỗi đơn chỉ được ghi một hoa hồng. Transaction cùng lúc tạo sổ hoa hồng, đánh dấu đơn và tăng ví CTV. Có kiểm tra sổ cũ để không cộng trùng khi thử lại.
5. Đơn cũ chưa ghi CTV vẫn có thể được nhận diện qua ref/coupon cũ khi xử lý. Đơn mới đã xác định không có CTV sẽ không bị gán lại từ coupon đổi chủ sau này.
6. Mã coupon CTV cũ chưa có document trong `coupons` vẫn được hỗ trợ. Coupon đã tắt, hết hạn, trùng mã hoặc CTV tạm khóa không được sử dụng.
7. Yêu cầu rút giữ tiền bằng cách trừ số dư khả dụng trong transaction. Admin từ chối thì hoàn lại một lần; xác nhận đã chuyển khoản thì tăng số đã trả một lần. Đây **không phải tự động chuyển tiền từ ngân hàng**. Admin cần chuyển tiền thật và đối chiếu trước khi xác nhận.
8. Click được khử trùng theo CTV + dấu vết IP/user-agent đã băm + ngày UTC. Đây là chỉ số tham khảo, không phải số người duy nhất tuyệt đối; không quyết định số dư tiền.
9. Dữ liệu tài chính Affiliate chỉ được ghi qua API xác thực/Admin SDK. Trình duyệt không được ghi trực tiếp vào các collection Affiliate.

Không chạy backfill hoặc tự cộng bù các đơn lịch sử trên production. Nếu cần đối soát đơn cũ, xuất và kiểm tra danh sách trước, rồi xử lý từng mã đơn qua API quản trị `process-order`. Không sửa trực tiếp số dư CTV.

## Kiểm thử cục bộ

```powershell
npm run test:affiliate
npx eslint functions/_lib/affiliate.js functions/_lib/affiliate.test.js functions/_lib/affiliateTestDb.js functions/index.js src/utils/affiliateService.js src/pages/AffiliatePortal.jsx src/pages/admin/AdminAffiliates.jsx src/pages/Checkout.jsx src/utils/orderService.js
npm run build
```

Test dịch vụ dùng Firestore giả lập trong bộ nhớ, với transaction tuần tự/atomic. Bao gồm phân bổ tiền, xử lý sự kiện lặp, dữ liệu cũ, tự giới thiệu, phân quyền, coupon, đăng ký đồng thời, rút vượt số dư, hoàn tiền một lần và phân trang. Không thay thế kiểm thử với Firestore thật/emulator và thanh toán end-to-end.

## Triển khai (chỉ sau khi chủ website xác nhận)

Backend mới phải được triển khai để cả localhost lẫn website dùng được các API Affiliate; proxy Vite hiện trỏ về Firebase Hosting `maliedu-web`.

Kiểm tra trước, không phát hành:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = '60'
npx firebase deploy --only functions:uploadApi,functions:onOrderCompleted,firestore --dry-run --force
```

Trên máy Windows này, nạp dependencies Functions có thể vượt giới hạn mặc định 10 giây. Biến trên tăng thời gian chờ cho tiến trình CLI. `--force` trong lệnh **dry-run** xác nhận cảnh báo retry để chạy kiểm tra đến cuối, không phát hành code.

Khi được xác nhận, kiểm tra đúng project `maliedu-web`, xem lại diff để tránh đưa thay đổi không liên quan lên web, rồi:

1. Triển khai Functions và Firestore bằng lệnh tương ứng bỏ `--dry-run`. Lưu ý `--force` chấp nhận retry; đọc toàn bộ cảnh báo triển khai trước khi dùng.
2. Chờ hai composite indexes cho `affiliate_commissions`/`affiliate_payouts` (`affiliateId ASC, createdAt DESC`) sẵn sàng.
3. Build lại và phát hành frontend bằng cơ chế hosting của dự án. Với Firebase Hosting: `npx firebase deploy --only hosting`.
4. Kiểm tra đăng nhập CTV/admin, coupon cũ/mới, đơn nhiều khóa và trạng thái CTV tạm khóa.
5. Chỉ chạy đơn thanh toán thử và yêu cầu rút thử khi có đồng ý riêng; kiểm tra chính xác số tiền, trạng thái đơn, quyền học và hoa hồng. Gửi lại sự kiện cùng đơn không được tăng ví lần hai.

Trigger bật `retry: true`. Firebase có thể thử lại sự kiện lỗi và tính phí lượt thực thi; xem [tài liệu retry chính thức](https://firebase.google.com/docs/functions/retries). Theo dõi lỗi `onOrderCompleted` sau khi phát hành, không coi build/dry-run thành công là thanh toán thật đã chạy thành công.

Các video/quyền học hiện có, cấu hình S3/Bunny và số dư CTV lịch sử không bị di chuyển hay xóa bởi bản sửa Affiliate này.

## Lần triển khai backend ngày 04/09/2026

- Chủ website đã xác nhận triển khai để sửa lỗi `API route not found` khi đăng ký Affiliate.
- Đã triển khai thành công `uploadApi`, `onOrderCompleted` và cấu hình Firestore lên project `maliedu-web`; cả hai Functions ở trạng thái `ACTIVE`.
- Hai chỉ mục `affiliate_commissions` và `affiliate_payouts` (`affiliateId ASC, createdAt DESC`) đã được xác minh ở trạng thái `READY` sau triển khai.
- Chỉ phát hành backend, không phát hành lại frontend/Hosting. Không chạy backfill, không tạo đăng ký, đơn hàng hoặc yêu cầu rút thử trên dữ liệu thật.
- Đã kiểm tra trên cả `localhost:5173` và `maliedu-web.web.app`: API cài đặt Affiliate trả `200`; xem hồ sơ, đăng ký và quản trị không có đăng nhập trả `401`; mã giảm giá rỗng bị từ chối đúng nghiệp vụ, không còn lỗi thiếu route.
- 26 kiểm thử Affiliate và ESLint cho các tệp backend liên quan đều đạt. Chưa kiểm thử đăng ký có xác thực hoặc thanh toán thật end-to-end.
- API cấu hình ngân hàng và kiểm tra cấu hình S3 vẫn trả `200` sau triển khai; không thay đổi cấu hình video hay tạo giao dịch thử.
