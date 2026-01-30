# 📘 TÀI LIỆU TÍCH HỢP LANDING PAGE & CRM MALI EDU

Tài liệu này hướng dẫn cách gửi dữ liệu từ Landing Page về hệ thống CRM. CRM sử dụng song song Firebase Realtime Database (RTDB) để nhận khách nhanh và Firestore để lưu cấu hình.

## 1. Cổng tiếp nhận dữ liệu (Entry Point)
Mọi Lead từ Landing Page phải được đẩy vào Realtime Database tại đường dẫn (Node) sau:

**Path:** `funnels/ads/{unique_id}`  
*Ghi chú: {unique_id} được sinh tự động bởi hàm push() của Firebase.*

## 2. Cấu trúc dữ liệu yêu cầu (JSON Schema)

### A. Thông tin bắt buộc (Required)
| Trường | Kiểu dữ liệu | Ví dụ | Mô tả |
| :--- | :--- | :--- | :--- |
| `name` | String | "Nguyễn Văn A" | Họ tên khách hàng |
| `phone` | String | "0987654321" | Số điện thoại (Dùng để kiểm tra trùng) |
| `source_key` | String | `khoithong_k38` | **QUAN TRỌNG**: Mã để CRM giải mã Khóa học/K |
| `createdAt` | Number | `1706085000000` | Thời gian đăng ký (Date.now()) |

### B. Thông tin Marketing & UTM (Recommended)
| Trường | Mô tả | Map vào CRM |
| :--- | :--- | :--- |
| `utm_source` | Nguồn (facebook, tiktok...) | `cpSource` |
| `utm_medium` | Hình thức (cpc, video, bio) | `cpMedium` |
| `utm_campaign` | Tên chiến dịch | `cpCampaign` |
| `utm_term` | Từ khóa / Camp ID | `cpTerm` |
| `utm_content` | Nội dung QC / Ad ID | `cpContent` |
| `email` | Email khách hàng | `email` |

## 3. Cơ chế Giải mã (Decoding Strategy) trên CRM
Khi nhận được `source_key`, CRM sẽ xử lý theo 2 cấp độ:

1. **Chiến lược 1 (Mapping trực tiếp):** Nếu mã khớp hoàn toàn với cấu hình trong `source_configs` của Firestore CRM.
2. **Chiến lược 2 (Giải mã theo quy ước):** Tách chuỗi theo dấu gạch dưới `_`. 
   * Quy ước: `[Mã_Khóa_Học]_[Mã_K]`
   * Ví dụ: `khoithongdongtien_k38` -> Course: *Khơi Thông Dòng Tiền*, Batch: *K38*.

---
*Tài liệu này được tạo tự động bởi Antigravity Assistant.*
