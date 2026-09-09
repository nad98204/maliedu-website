# Landing Luật Hấp Dẫn để Khơi Thông Dòng Tiền

Đường dẫn: `/dao-tao/bi-mat-luat-hap-dan`. Bản mẫu: `/landing/bi-mat-luat-hap-dan`.

Nội dung phần mở đầu, sáu vướng mắc và ba nhóm người học lấy từ file **4 BUỔI HỌC ONLINE MIỄN PHÍ.docx** do người dùng cung cấp. Lộ trình bốn buổi dùng chung với landing Khơi Thông Dòng Tiền hiện có. Đây là một landing quảng cáo của cùng khóa học.

## Cấu hình CRM đã tạo ngày 08/09/2026

| Trường | Giá trị lúc tích hợp |
| --- | --- |
| Tên trong quản lý phễu | Luật Hấp Dẫn - Khơi Thông Dòng Tiền |
| Document landing | `landing_pages/luat-hap-dan-khoi-thong-dong-tien` |
| Mã nguồn riêng | `1768973703248_ads_2_k55` |
| Khóa học đích | `1768973703248` — Khơi Thông Dòng Tiền - Phễu |
| Khóa K | K55 |
| Phễu | ADS |
| Phân phối khách | CRM tự chia Sale (Round Robin) |
| Lịch học chung | 11–14/09/2026, bắt đầu lúc 20h |
| Nhóm Zalo chung | https://zalo.me/g/bue9mnjoxcapgzzk0bna |

Các giá trị trên là bản ghi lúc tích hợp, không được hardcode trong form. Cấu hình landing và `source_configs` đã được tạo cùng nhau bằng Trung tâm quản lý phễu. ID cấu hình CRM do trang quản trị tạo theo tên; form tra theo slug để dùng đúng document.

## Luồng đăng ký

1. Đọc `landing_pages` theo slug và lịch chung `public_settings/khoi_thong_dong_tien_schedule`.
2. Kiểm tra họ tên và số di động; hỗ trợ số bắt đầu bằng `0`, `84` hoặc `+84`.
3. Khi gửi, đọc lại cấu hình mới nhất. Chặn gửi nếu thiếu mã nguồn, thiếu khóa K hoặc đang bảo trì.
4. Dùng `submitToCRM` → `POST /api/crm-leads` → `funnels/ads`. Giữ nguyên mã nguồn, khóa K, ID landing, URL và 5 trường UTM.
5. CRM hiện tại giải mã source mapping, đưa về cùng khóa học và tự phân phối Sale. Không cần sửa mã nguồn dự án CRM.
6. Chỉ hiển thị đăng ký thành công khi API xác nhận đã lưu khách. Nút vào Zalo ưu tiên link trong lịch chung. Lưu biên nhận trong session tối đa 30 phút để tránh gửi lại khi tải lại trang.
7. Pixel đọc từ cấu hình landing; sự kiện Lead và CompleteRegistration dùng event ID chung với CAPI. Giá trị doanh thu luôn bằng 0 cho lớp miễn phí. Lỗi tracking không làm đăng ký đã lưu bị báo lỗi.

Lịch học và Zalo chỉnh ở khối **Lịch học chung Khơi Thông Dòng Tiền**. Khóa K, phễu, Pixel và bảo trì chỉnh ở dòng landing tương ứng. Chức năng sửa nhanh toàn bộ khóa K cũng bao gồm landing mới.

## Kiểm tra

- `npm run build`: build ứng dụng, prerender phần mở đầu và form cho hai đường dẫn, kiểm tra SEO.
- `npm run test:secret-landing`: xác thực liên hệ, UTM, source mapping, khóa K động, bảo trì, API lỗi và hợp đồng payload CRM.
- Đối chiếu read-only cấu hình thực tế bằng `assignLeadFromSource` trong dự án CRM tại `D:/WEB ĐÃ XONG/he-thong-ads-mong`.
- Các bài test thay thế API bằng phản hồi giả; không tạo khách thử trong CRM thật.

## Giao diện và triển khai

Dùng bố cục và các thành phần của landing Khơi Thông Dòng Tiền với màu đỏ–vàng. Phần đầu chỉ gồm nội dung người dùng cung cấp, tiêu đề chữ, một video, ngày học chung, giờ 20:00–22:00, nút đăng ký và đếm ngược. Các phần lịch trình, kết quả học viên, người sáng lập, video cảm nhận và footer dùng chung. Sáu vướng mắc và ba nhóm người học được truyền vào các thành phần dùng chung. Form giữ nguyên hợp đồng CRM, dùng giao diện đỏ–vàng và ảnh đăng ký có sẵn.

Cả hai landing dùng cùng CSS tối ưu và phông Inter. HTML có sẵn banner và form trước khi JavaScript tải; các phần bên dưới tải khi gần xuất hiện để giảm dung lượng ban đầu.

Tên miền chính `luathapdan.vn` chạy qua Cloudflare Pages, dự án `maliedu-website`, kết nối nhánh `main` của `nad98204/maliedu-website`. Firebase Hosting ở `maliedu-web.web.app` là địa chỉ triển khai riêng.
