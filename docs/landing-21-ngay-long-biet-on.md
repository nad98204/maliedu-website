# Thử thách 21 ngày đánh thức phép màu lòng biết ơn

- Landing: `/dao-tao/21-ngay-long-biet-on`.
- Bản mẫu: `/landing/danh-thuc-long-biet-on`.
- Quản trị danh sách: `/admin/community-registrations`, mục **Đăng ký 21 ngày**.
- Chương trình: `21-ngay-long-biet-on`, miễn phí, bắt đầu 29/10/2026, 05:00 giờ Việt Nam, 21 ngày đến 18/11/2026.
- Nhóm Zalo: https://zalo.me/g/oycqyorw5kgzftwyyyvl.

## Nội dung và hình ảnh

Nội dung chính, lịch và giới hạn nhóm lấy từ yêu cầu người dùng ngày 02/11/2026. Không đưa thông tin nhóm Facebook lên landing theo yêu cầu bổ sung. Giới thiệu Nguyễn Mong Thành dựa trên nội dung người dùng; Mong Coaching dựa trên trang giới thiệu và landing Luật Hấp Dẫn hiện có. Người dùng đã duyệt cả ba phần bổ sung: dành cho ai, điều có thể vun đắp trong 21 ngày, lời hẹn với chính mình. Đã thêm ba phần này và bỏ cụm MALI EDU cùng khẩu hiệu ở góc trái header theo ảnh người dùng chỉ định; header dùng các liên kết đến nội dung và nút đăng ký.

Ba ảnh do người dùng cung cấp được sao chép vào `public/assets/landing/21-ngay-long-biet-on/`. Banner giữ nguyên nội dung; hai ảnh PNG được giảm kích thước để tải nhanh hơn. Banner gốc chứa dòng “link đăng ký trong phần bình luận”; landing có nút đăng ký riêng ngay cạnh banner.

## Lưu dữ liệu tại website

`POST /api/community-registrations` gọi Firebase Functions qua cơ chế proxy hiện có trên production. Dữ liệu nằm trong Firestore của **maliedu-web**, tại `community_courses/21-ngay-long-biet-on/registrations/{sha256(courseId:phone)}`. Cùng một giao dịch tạo bản ghi `leads/community_{hash}` để hiển thị ở **Khách hàng giới thiệu**. Không gửi sang CRM ngoài. Tài liệu cấu hình khóa đã được khởi tạo ngày 02/11/2026; không tạo khách thử trong dữ liệu thật.

Khóa có trong bộ lọc khách hàng và danh sách link nhân viên của `/admin/referral-customers`. Dùng các mã nhân viên hiện có, link riêng theo khóa: `/dao-tao/21-ngay-long-biet-on?ref={ma-nhan-vien}`. Form đọc mã ngay từ URL, không lấy mã từ lịch sử Affiliate của khóa khác. Vào trực tiếp ghi nhận `cong-ty`. Gửi lại số đã đăng ký không thay đổi nhân viên giới thiệu ban đầu. Mã mới vẫn tạo bằng form **Tạo mã cho nhân viên**; không tạo thêm mã trùng cho tài khoản đã có mã.

Trang giới thiệu tải riêng dữ liệu Firestore, nguồn Chinh Phục Mục Tiêu và đăng ký 21 ngày; nguồn lỗi được nêu rõ, không xóa dữ liệu các nguồn thành công. Khi bản ghi đăng ký và bản ghi `leads` cùng tồn tại, chỉ hiện một dòng, giữ nguyên ghi chú/trạng thái quản trị đã sửa.

Vite local dùng `scripts/community-dev-api.mjs` với Application Default Credentials đã có trên máy để thực hiện API mới trên cùng Firestore website. SDK và thông tin xác thực chỉ chạy ở máy chủ; không vào trình duyệt. API đọc vẫn kiểm tra Firebase ID token và module quản trị. Nguồn Chinh Phục Mục Tiêu cũ chỉ được proxy **GET** về `https://luathapdan.vn/api/admin/referral-leads`, nơi tiếp tục kiểm tra token. Không tạo binding ghi D1 production và không có fallback gửi trực tiếp CRM. Chạy local hiện có thể lưu đăng ký thật; mọi kiểm thử tự động thay database/API bằng mô phỏng.

Mọi nút đăng ký mở form dạng hộp thoại ngay tại vị trí đang xem. Form chỉ gồm họ tên và số điện thoại, kèm thông báo sử dụng thông tin ngay trước nút gửi; không yêu cầu email hay ô tích. Đồng ý được ghi nhận bằng hành động gửi form sau thông báo (v2). Có thể đóng bằng nút X, Escape hoặc bấm nền ngoài; nhập liệu được giữ khi đóng/mở lại. Máy chủ kiểm tra lại dữ liệu, chuẩn hóa số Việt Nam, giới hạn lượt gửi và dùng giao dịch để mỗi số chỉ lưu một lần. Gửi lại không thay đổi thông tin đã có. Chỉ báo thành công sau khi máy chủ xác nhận đã lưu. Không dùng bộ nhớ trình duyệt làm nơi lưu đăng ký. Đăng ký không tự thêm người dùng vào Zalo; nút tham gia hiện sau khi lưu thành công. Giới hạn 1.000 người là giới hạn nhóm theo thông tin người dùng, không phải số chỗ còn lại trên website.

`GET /api/admin/community-registrations` yêu cầu xác thực quản trị và quyền module `community-registrations` hoặc `referral-customers`. Danh sách hỗ trợ tìm tên/điện thoại/email, phân trang, xuất CSV có bảo vệ công thức. Firestore giữ mặc định chặn truy cập trực tiếp vào đăng ký gốc; không cần mở quyền ghi công khai.

## Kiểm tra và triển khai

- `node --test functions/_lib/communityRegistrations.test.js`: dữ liệu hợp lệ/sai, chống trùng, quyền xem và phân trang bằng database giả, không tạo khách thật.
- `node --test scripts/test-referral-course-runs.mjs`: tách dữ liệu khóa 21 ngày và các đợt Chinh Phục Mục Tiêu cũ.
- `node scripts/test-gratitude-referrals.mjs`: bộ lọc khóa, link nhân viên/công ty, tạo mã mới, giữ ghi chú và dữ liệu khi một nguồn ngoại tuyến; tất cả dùng dữ liệu giả.
- `npm run build`: biên dịch, HTML dựng trước, SEO và bản mẫu.
- `node scripts/test-gratitude-landing.mjs`: kiểm tra trang thật ở 1440, 390, 320px, API giả cho lỗi/thành công; cần Chrome có sẵn và preview ở cổng 5174 (đổi bằng `GRATITUDE_TEST_ORIGIN`).
- Bản xem cục bộ: `npm run dev -- --port 5173`.
- Khi đưa lên thật cần triển khai cả Firebase Functions `uploadApi`, `uploadApiFallback` và frontend/Pages qua luồng hiện có. Chỉ deploy frontend thì endpoint đăng ký mới chưa tồn tại trên backend đang chạy.

Phát hành theo yêu cầu người dùng ngày 02/11/2026: triển khai backend trước frontend. Tên miền chính là `https://luathapdan.vn`, Cloudflare Pages `maliedu-website`, nhánh production `main`. Theo yêu cầu bổ sung, mobile ẩn toàn bộ thanh điều hướng phía trên; vẫn có nút đăng ký ở nội dung và cố định cuối màn hình. Máy tính giữ thanh điều hướng với nhãn ngắn. Nội dung chương trình là giải đáp câu hỏi trong các buổi học; không quảng bá coaching trực tiếp.

Môi trường local hiện không có `.env` public S3. Khi kiểm tra build, truyền tạm `VITE_S3_ENDPOINT=https://s3-hn1-api.longvan.vn` và `VITE_S3_BUCKET=video-khoa-hoc` từ đường dẫn media đang có trong mã nguồn; không tạo hay thay đổi thông tin bí mật.
