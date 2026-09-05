# Khơi Thông Dòng Tiền — kiểm chứng hiệu suất Mobile ngày 05/09/2026

Bản tối ưu trên **preview** đạt FCP < 2 giây và LCP < 2,5 giây trong cả 3 lần PageSpeed Mobile. Chưa triển khai lên `luathapdan.vn`; lần kiểm tra lại cuối phiên xác nhận domain chính vẫn dùng bundle cũ `index-BaRhoUod.js`, chưa có HTML hydration và ảnh hero AVIF mới.

## Kết quả trước/sau

| Phép đo | Giờ GMT+7 | Performance | FCP (s) | LCP (s) | TBT (ms) | CLS | Speed Index (s) | TTI (s) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline người dùng cung cấp | — | 72 | 3,400 | 5,000 | — | — | — | — |
| Đo lại production trước sửa | 10:40:56 | 82 | 3,384 | 3,772 | 65 | 0 | 3,384 | 5,540 |
| Preview cuối — lần 1 | 11:18:39 | 98 | 0,937 | 1,501 | 174 | 0,001 | 1,362 | 4,541 |
| Preview cuối — lần 2 | 11:19:54 | 96 | 1,651 | 1,951 | 177 | 0 | 1,651 | 4,524 |
| Preview cuối — lần 3 | 11:21:10 | 96 | 1,651 | 1,951 | 196 | 0,001 | 1,651 | 4,557 |
| Trung vị 3 lần preview | — | 96 | 1,651 | 1,951 | 177 | 0,001 | 1,651 | 4,541 |

Trung vị FCP giảm 51,2% và LCP giảm 48,3% so với lần đo lại production. TBT tăng từ 65 lên trung vị 177 ms; không phải tất cả chỉ số đều cải thiện. So với baseline người dùng cung cấp, trung vị FCP giảm 51,4%, LCP giảm 61,0%.

Các báo cáo gốc:

- [Production trước sửa](https://pagespeed.web.dev/analysis/https-luathapdan-vn-dao-tao-khoi-thong-dong-tien/xlj4aflrza?form_factor=mobile).
- [Preview lần 1](https://pagespeed.web.dev/analysis/https-maliedu-web--codex-lcp-audit-br59toxt-web-app-dao-tao-khoi-thong-dong-tien/inmr9l93xc?form_factor=mobile).
- [Preview lần 2](https://pagespeed.web.dev/analysis/https-maliedu-web--codex-lcp-audit-br59toxt-web-app-dao-tao-khoi-thong-dong-tien/r2uuqs8ldh?form_factor=mobile).
- [Preview lần 3](https://pagespeed.web.dev/analysis/https-maliedu-web--codex-lcp-audit-br59toxt-web-app-dao-tao-khoi-thong-dong-tien/mv2setawx7?form_factor=mobile).

Điều kiện chung: PageSpeed Insights, Mobile, Moto G Power mô phỏng, Slow 4G, lượt tải đầu tiên, Lighthouse 13.4.1, HeadlessChromium 151.0.7922.71. Không có dữ liệu CrUX. FCP/LCP/TBT/SI/TTI lấy từ liên kết máy tính điểm trong báo cáo, đến mili giây; CLS lấy từ chỉ số hiển thị vì liên kết máy tính làm tròn CLS thành 0. Giao diện PSI làm tròn thời gian nên có thể hiển thị 1,7/2,0 giây thay cho 1,651/1,951 giây.

Đây là so sánh production với preview trên hạ tầng khác nhau, chưa chứng minh kết quả sau triển khai trên domain chính. Ba lần cuối dùng cùng một build; các lần chẩn đoán trung gian không đưa vào bảng.

## Phần tử LCP chính xác

Lighthouse trước sửa chỉ ra **ảnh tiêu đề “Khơi Thông Dòng Tiền”**:

```css
div.relative > div.w-full > div.w-full > img.w-full
```

Thuộc tính nhận diện: `alt="Khơi Thông Dòng Tiền"`, `src="/assets/landing/khoi-thong-dong-tien/hero-title.webp"`, `width="820"`, `height="287"`, `fetchpriority="high"`, `loading="eager"`.

Báo cáo cuối lần 3 xác nhận vẫn cùng ảnh tiêu đề, với selector mới:

```css
div.w-full > div.w-full > picture.block > img.w-full
```

`picture` cung cấp AVIF responsive và WebP fallback. Poster video cũng ở phía trên màn hình nhưng không phải phần tử LCP được báo cáo trong hai lần kiểm tra này.

## Các thay đổi đã thực hiện

- Tạo sẵn HTML thật cho ba landing Khơi Thông Dòng Tiền, sau đó hydrate React; hero hiển thị ngay cả khi tắt JavaScript. Sửa khởi tạo countdown/viewport để tránh sai khác hydration.
- Tách CSS landing khỏi CSS toàn website, giới hạn Tailwind content và inline CSS landing. CSS toàn site trước đó khoảng 45,66 KB gzip; CSS landing cuối khoảng 12,77 KB gzip, gồm khai báo font. Đây là số đo build trong repo.
- Đưa Inter và Playfair Display về local, chỉ giữ subset Latin/Vietnamese, dùng `font-display: swap`, lưu kèm giấy phép OFL. Loại chuỗi CSS Google Fonts khỏi đường tải đầu landing.
- Thêm hero AVIF 480/820 và poster AVIF 480/960, `srcset`/`sizes`, preload đúng loại ảnh và ưu tiên tải cao. Hero 820 giảm từ 65.844 byte WebP xuống 16.817 byte AVIF; bản mobile 480 chỉ 4.800 byte. Poster giảm từ 52.338 byte xuống 20.614 byte; bản mobile 480 là 9.568 byte. Có WebP fallback và kích thước cố định.
- Poster above-the-fold tải eager; iframe video chỉ tạo sau khi bấm phát, đúng một iframe cho viewport đang dùng. Thay hai lớp blur nền lớn bằng radial background.
- Chuyển Firebase auth sang import động trong các thao tác cần xác thực của affiliate service. Ghi nhận referral thụ động không còn kéo Firebase vào lần tải landing đầu. Giữ nguyên hợp đồng form/CRM/Meta.
- Bỏ preload đồ thị JS không cần cho lần vẽ đầu, bỏ preconnect S3/Google Fonts khỏi landing, dọn Link header trùng trên Cloudflare; giữ kết nối Meta cần thiết.
- Cache dài cho JS/CSS/font/ảnh có phiên bản; HTML landing revalidate và runtime config không cache. Cấu hình cả Firebase Hosting và `public/_headers` cho Cloudflare Pages. Đã xác nhận header thực tế trên preview: ảnh phiên bản `max-age=31536000, immutable`; HTML `max-age=0, must-revalidate`; runtime config `no-cache, no-store, must-revalidate`.

Lần PSI cuối còn cảnh báo khoảng 72 KiB JavaScript chưa dùng (trước 78 KiB) và khoảng 187 KiB cơ hội cache (trước 191 KiB, chủ yếu tài nguyên Meta). Không loại bỏ Pixel để tăng điểm. Cảnh báo unused CSS trước khoảng 38 KiB không còn xuất hiện trong danh sách chẩn đoán lỗi cuối. Cache tài nguyên bên thứ ba do nhà cung cấp quyết định.

## Kiểm thử chức năng

Đã chạy thành công trên build được đưa lên preview:

- `npm run build`: tạo và kiểm chứng 65 route HTML, 43 URL sitemap.
- ESLint các file thay đổi và `git diff --check`.
- `npm run test:landing` với Chrome tại `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Hero khi tắt JS ở 412 px và 1440 px; kiểm tra ảnh chụp mobile/desktop.
- Ads mobile/desktop và landing thương hiệu mobile: hydration, CTA đến form, video chỉ tải sau click, không tải Firebase ban đầu, không tải trùng WebP khi hỗ trợ AVIF.
- CRM giả lập lỗi 503 rồi thử lại thành công: giữ dữ liệu form, đúng payload/nodePath/sourceKey/batchName, giữ UTM và fbclid, chuyển trang cảm ơn.
- Meta giả lập: PageView, InitiateCheckout, Lead, CompleteRegistration đúng số lần, eventID khớp payload CRM; landing thương hiệu giữ trạng thái Meta tắt.

CRM, affiliate, CAPI và Meta được mock/chặn trong bài test; không tạo lead thật. Kết quả xác nhận hành vi frontend và hợp đồng payload, chưa xác nhận giao nhận đến CRM/Meta thật.

Bằng chứng local: `.cache/landing-tests/results.json` và ảnh trong `.cache/landing-tests/`. Script tái chạy: `scripts/test-landing-performance.mjs`. Các báo cáo Lighthouse CLI trong `.cache/` chỉ phục vụ chẩn đoán máy local, không trộn vào kết quả PageSpeed ở trên.

## Bản đã đo và phần còn lại

[Preview đã đo](https://maliedu-web--codex-lcp-audit-br59toxt.web.app/dao-tao/khoi-thong-dong-tien), Firebase project `maliedu-web`, channel `codex-lcp-audit`, hạn dự kiến 06/09/2026 11:17 GMT+7.

- Entry bundle: `/assets/index-jInKbAIa.js`.
- SHA-256 HTML preview: `926879701d224c0922c16dba11a2bcf90f7e455155c1325500b51960438cea2f`.
- Accessibility 93 và Best Practices 100 giữ nguyên; SEO preview 69 do header noindex của preview, production trước sửa 100.
- Repo đã có các thay đổi khác sau thời điểm đo; số đo ở đây chỉ gắn với build/hash preview trên, không mặc nhiên áp dụng cho mọi build tiếp theo.

Cần xác định project/cơ chế phát hành Cloudflare đang phục vụ `luathapdan.vn`, triển khai bản được kiểm chứng và đo lại trên domain chính. Chưa xác định được project đó trong cấu hình repo nên chưa phát hành production.
