# Bảo mật trang thôi miên

## Thay đổi

- `hypnosis_audios` giữ nguyên dữ liệu hiện có nhưng trở thành collection riêng tư. Chỉ admin có module `hypnosis` được đọc trực tiếp; mọi thao tác lưu, xóa và cấu hình hoa hồng đi qua backend.
- `GET /api/hypnosis/catalog` chỉ trả các trường mô tả được cho phép. Không trả `audioUrl`, `videoId`, provider, hướng dẫn chuyên sâu hoặc các trường lạ. Không lấy mẫu cục bộ để thay thế khi API lỗi.
- `user_audios` không cho trình duyệt tạo/sửa/xóa, kể cả admin. Nhận miễn phí qua `/api/hypnosis/claim`; quyền trả phí do SePay hoặc trigger `onOrderCompleted` cấp.
- `/api/hypnosis/library`, `/playback` và `/guide` kiểm tra UID, trạng thái quyền, thời hạn và đối chiếu đơn `completed` đúng người, đúng sản phẩm. Bản ghi tự tạo theo rule cũ không đủ để mở bài trả phí. Quyền miễn phí cũ không có `status` vẫn được nhận diện nếu bài hiện tại thực sự miễn phí.
- Link Bunny được backend ký, hết hạn sau 15 phút. Client chỉ gửi ID bài; backend tự chọn video từ dữ liệu riêng tư. Không cho dùng link MP3/M4A công khai làm nguồn trả phí.
- `autoPlay` chờ xác minh quyền; không dùng cache sở hữu trong localStorage. Đổi tài khoản/đăng xuất gỡ nguồn phát và hướng dẫn, bỏ qua phản hồi cũ đang chờ.
- Admin không thể tự sửa `role`/`allowedModules`. Chỉ super admin đã xác minh email được đổi các trường phân quyền. Duyệt đơn cần module `orders`; cấu hình hoa hồng cần `affiliates`; tải Bunny cần `courses` hoặc `hypnosis` đúng với yêu cầu tải.
- Các bản mẫu trả phí không còn chứa audio trong bundle và được tạo ở trạng thái nháp. Backend không tạo đơn từ ID mẫu không tồn tại hoặc nguồn phát chưa sẵn sàng.

## Điều kiện phải hoàn tất trước khi mở bán

Đây là thay đổi code; không tự xác nhận cấu hình hay triển khai trên hệ thống thật.

1. Trong đúng Bunny Stream library, bật bảo vệ **Embed View Token Authentication** và bảo vệ token cho CDN/media; tắt **Direct Play**, các đường phát MP4/original công khai không được bảo vệ. Kiểm tra cả embed và playlist/segment/MP4 gốc: bỏ token không được truy cập, link có token hợp lệ phải phát được. Chỉ giới hạn domain/referrer không thay thế xác thực token.
2. Thiết lập đúng `BUNNY_STREAM_LIBRARY_ID` và secret `BUNNY_STREAM_TOKEN_KEY` của library. Sau khi kiểm tra ở bước 1, thêm `HYPNOSIS_BUNNY_SECURITY_CONFIRMED=true` vào cấu hình môi trường Cloud Functions. Giá trị mặc định là đóng: nếu chưa xác nhận hoặc chưa có khóa ký, bài Bunny không được phát/mở bán. Cờ này là xác nhận vận hành, **không phải API tự kiểm tra cấu hình Bunny**.
3. Với bài trả phí đang dùng link công khai, tải lại lên nguồn Bunny đã bảo vệ. Nếu link cũ đã lộ, phải thu hồi/chặn nguồn cũ và xóa cache CDN liên quan; chỉ đổi code không thu hồi được file đã tải xuống. Các link phát đã ký còn hiệu lực tối đa đến lúc hết hạn; đây là kiểm soát truy cập, không phải chống ghi âm/DRM.
4. Triển khai backend mới (`uploadApi` và `onOrderCompleted`), Firestore rules và frontend/proxy trong cùng đợt bảo trì. Không chỉ deploy frontend: hiện Vite/Cloudflare `/api/*` chuyển tiếp về Firebase Hosting, nên API mới phải có ở backend được chuyển tiếp.

Ví dụ lệnh Firebase (sau khi cấu hình và xác nhận môi trường đích):

```powershell
firebase deploy --only "functions:uploadApi,functions:onOrderCompleted,firestore:rules"
npm run build
# Nếu frontend dùng Firebase Hosting:
firebase deploy --only hosting
# Nếu frontend dùng Cloudflare Pages: triển khai dist và functions/api theo quy trình Pages hiện có.
```

Không cần di chuyển collection. Không tự xóa hoặc công nhận hàng loạt các quyền cũ. Nếu một quyền trả phí bị từ chối, kiểm tra `orderId`, `orders.userId`, trạng thái đơn, `items[].id/productType` và `user_audios.status`; không mở lại rule ghi phía client để chữa lỗi.

Nguồn cấu hình Bunny: [Bunny Stream Security](https://support.bunny.net/hc/en-us/articles/4414548058258-Understanding-Bunny-Stream-Security-options), [thuộc tính cấu hình Video Library](https://docs.bunny.net/reference/videolibrarypublic_update).

## Kiểm thử

Kết quả tại workspace ngày 2026-09-06: 15 kiểm thử backend thôi miên, 6 kiểm thử Firestore rules, 6 tình huống trình duyệt và 26 kiểm thử affiliate đều qua. Lint các module sửa đổi, production build, SSR và kiểm tra SEO (40 route HTML, 17 sitemap URL) đều qua.

```powershell
npm run test:hypnosis
npm run test:hypnosis:rules
npm run test:hypnosis:browser
npm run build
```

- Backend: xác thực, giả quyền, đơn của người khác, sai sản phẩm, đơn hủy, quyền hết hạn/thu hồi, nhận miễn phí, link ký, hướng dẫn riêng tư, phân quyền admin/affiliate và fulfillment lặp lại.
- Firestore Emulator: dùng **demo-maliedu-hypnosis**, port **8189**, không truy cập dữ liệu thật. Cần Firebase CLI và Java 21+.
- Trình duyệt: Chrome headless (có thể đổi channel qua `PUPPETEER_CHANNEL`), Vite riêng ở port **5192**, dùng component và service thật nhưng giả lập auth/HTTP. Kiểm tra cache giả + autoPlay, người chưa mua, người đã mua, đăng xuất, phản hồi cũ sau đổi tài khoản, hướng dẫn riêng tư và nhận miễn phí. Chặn mọi request ra dịch vụ thật.
- Build kiểm tra thêm SSR và SEO của dự án. Kiểm thử tự động không xác minh trạng thái triển khai Firebase/Bunny thật hoặc khả năng nghe nền của từng thiết bị.

## Ngoài phạm vi bản vá này

Lần kiểm tra dependency ngày 2026-09-05 ghi nhận hai advisory mức moderate trong dependency production hiện có: DOMPurify (`GHSA-55q2-fjhq-7xh7`) và Tiptap core (`GHSA-cp6q-959q-f8rh`). Chưa đánh giá đường khai thác và chưa nâng các thư viện editor trong bản vá quyền nghe này. Không dùng kết quả kiểm thử thôi miên để kết luận toàn bộ website đã hết lỗ hổng.
