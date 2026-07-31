export const SITE_NAME = "Mali Edu";
export const SITE_URL = "https://luathapdan.vn";
export const DEFAULT_IMAGE =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776223771769-356869318-FULL-SIZE.png";

export const INDEX_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
export const NOINDEX_ROBOTS = "noindex,nofollow";

export const DEFAULT_SEO = {
  title: `${SITE_NAME} - Đánh thức tiềm năng thịnh vượng`,
  description:
    "Mali Edu đồng hành cùng bạn trên hành trình khai mở tiềm thức, chữa lành nội tâm và kiến tạo cuộc sống thịnh vượng.",
  image: DEFAULT_IMAGE,
  url: "/",
  type: "website",
  robots: INDEX_ROBOTS,
  sitemap: {
    priority: "1.0",
    changefreq: "daily",
  },
};

const indexable = (seo, priority = "0.7", changefreq = "monthly") => ({
  ...seo,
  robots: INDEX_ROBOTS,
  sitemap: { priority, changefreq },
});

const noindex = (seo) => ({
  ...seo,
  robots: NOINDEX_ROBOTS,
  sitemap: false,
});

export const ROUTE_SEO = {
  "/": DEFAULT_SEO,
  "/gioi-thieu": indexable(
    {
      title: "Giới thiệu Mali Edu",
      description:
        "Tìm hiểu sứ mệnh, giá trị cốt lõi và hệ sinh thái đào tạo giúp học viên phát triển nội tâm, tư duy và năng lực kiến tạo cuộc sống.",
      url: "/gioi-thieu",
    },
    "0.8",
  ),
  "/gioi-thieu/mong-coaching": indexable({
    title: "Mong Coaching - Người sáng lập Mali Edu",
    description:
      "Tìm hiểu hành trình, triết lý đào tạo và phương pháp đồng hành chuyển hóa của Mong Coaching tại Mali Edu.",
    url: "/gioi-thieu/mong-coaching",
  }),
  "/dao-tao": indexable(
    {
      title: "Chương trình đào tạo",
      description:
        "Khám phá các chương trình đào tạo của Mali Edu về Luật Hấp Dẫn, tiềm thức, mục tiêu, chữa lành và tài chính thịnh vượng.",
      url: "/dao-tao",
    },
    "0.9",
    "weekly",
  ),
  "/dao-tao/khoi-thong-dong-tien": indexable(
    {
      title: "Khơi Thông Dòng Tiền",
      description:
        "Khám phá bí mật thu hút tài chính và giải phóng tắc nghẽn năng lượng tiền bạc cùng Mali Edu.",
      image:
        "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1777910467237-372116712-banner-optimized.jpg",
      url: "/dao-tao/khoi-thong-dong-tien",
    },
    "0.8",
  ),
  "/dao-tao/luat-hap-dan": indexable(
    {
      title: "Luật Hấp Dẫn",
      description:
        "Tiếp cận Luật Hấp Dẫn như một hệ thống làm việc với tiềm thức, cảm xúc và niềm tin gốc rễ để thay đổi cuộc sống từ bên trong.",
      image:
        "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682596/LU%E1%BA%ACT_H%E1%BA%A4P_D%E1%BA%AAN_dnrvn0.jpg",
      url: "/dao-tao/luat-hap-dan",
    },
    "0.8",
  ),
  "/dao-tao/vut-toc-muc-tieu": indexable(
    {
      title: "Vút Tốc Mục Tiêu",
      description:
        "Kết nối mục tiêu với tiềm thức và hành động thực tế để tăng tốc kết quả trong công việc và cuộc sống.",
      image:
        "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682425/V%C3%BAt_T%E1%BB%91c_M%E1%BB%A5c_Ti%C3%AAu_2024_b%E1%BA%A3n_2_d6mhn3.jpg",
      url: "/dao-tao/vut-toc-muc-tieu",
    },
    "0.8",
  ),
  "/dao-tao/chinh-phuc-muc-tieu": indexable(
    {
      title: "Chinh Phục Mục Tiêu - Khóa Học 3 Buổi Miễn Phí",
      description:
        "Đăng ký miễn phí khóa học 3 buổi Chinh Phục Mục Tiêu tại Mali Edu để biến mục tiêu thành kế hoạch rõ ràng và hành động thực tế.",
      image:
        "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682425/V%C3%BAt_T%E1%BB%91c_M%E1%BB%A5c_Ti%C3%AAu_2024_b%E1%BA%A3n_2_d6mhn3.jpg",
      url: "/dao-tao/chinh-phuc-muc-tieu",
    },
    "0.8",
  ),
  "/dao-tao/khoi-thong-dong-tien-leader": {
    title: "Khơi Thông Dòng Tiền - Đồng hành cùng Leader",
    description:
      "Chương trình Khơi Thông Dòng Tiền dành cho cộng đồng đồng hành cùng Mali Edu.",
    image:
      "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1777910467237-372116712-banner-optimized.jpg",
    url: "/dao-tao/khoi-thong-dong-tien-leader",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },
  "/dao-tao/khoi-thong-dong-tien-thuonghieu": {
    title: "Khơi Thông Dòng Tiền - Thương hiệu",
    description:
      "Chương trình Khơi Thông Dòng Tiền dành cho cộng đồng đối tác thương hiệu Mali Edu.",
    image:
      "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1777910467237-372116712-banner-optimized.jpg",
    url: "/dao-tao/khoi-thong-dong-tien-thuonghieu",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },
  "/tin-tuc": indexable(
    {
      title: "Tin tức & Sự kiện",
      description:
        "Cập nhật những tin tức mới nhất, kiến thức chuyển hóa và câu chuyện thành công tại Mali Edu.",
      url: "/tin-tuc",
    },
    "0.8",
    "daily",
  ),
  "/khoa-hoc": indexable(
    {
      title: "Danh sách khóa học",
      description:
        "Khám phá các khóa học về Luật Hấp Dẫn, phát triển bản thân và khai phá tiềm thức tại Mali Edu.",
      url: "/khoa-hoc",
    },
    "0.9",
    "weekly",
  ),
  "/cam-nhan": indexable({
    title: "Cảm nhận học viên",
    description:
      "Lắng nghe những chia sẻ và kết quả chuyển hóa thực tế của học viên sau khi đồng hành cùng Mali Edu.",
    url: "/cam-nhan",
  }),
  "/cam-nhan/vut-toc-muc-tieu": indexable(
    {
      title: "Cảm Nhận Khóa Vút Tốc Mục Tiêu",
      description:
        "Câu chuyện thành công và kết quả thực tế từ học viên chương trình Vút Tốc Mục Tiêu.",
      url: "/cam-nhan/vut-toc-muc-tieu",
    },
    "0.7",
    "monthly",
  ),
  "/cam-nhan/luat-hap-dan": indexable(
    {
      title: "Cảm Nhận Khóa Luật Hấp Dẫn",
      description:
        "Câu chuyện chuyển hóa và kết quả thực tế từ học viên chương trình Luật Hấp Dẫn.",
      url: "/cam-nhan/luat-hap-dan",
    },
    "0.7",
    "monthly",
  ),
  "/tuyen-dung": indexable(
    {
      title: "Cơ hội nghề nghiệp - Tuyển dụng Mali Edu",
      description:
        "Khám phá các vị trí tuyển dụng tại Mali Edu và cùng lan tỏa giá trị chuyển hóa nội tâm, tiềm thức và cuộc sống thịnh vượng.",
      url: "/tuyen-dung",
    },
    "0.7",
    "weekly",
  ),
  "/lien-he": indexable(
    {
      title: "Liên hệ Mali Edu",
      description:
        "Liên hệ Mali Edu để được tư vấn về chương trình đào tạo, khóa học và hành trình phát triển bản thân phù hợp.",
      url: "/lien-he",
    },
    "0.6",
  ),
  "/chinh-sach-bao-mat": indexable(
    {
      title: "Chính sách bảo mật",
      description:
        "Chính sách bảo mật thông tin cá nhân của CÔNG TY TNHH TƯ VẤN MAGIC LIFE trên website luathapdan.vn.",
      url: "/chinh-sach-bao-mat",
    },
    "0.5",
    "yearly",
  ),
  "/kien-thuc/luat-nhan-qua-hap-dan": indexable({
    title: "Luật Nhân Quả & Luật Hấp Dẫn",
    description:
      "Kiến thức nền tảng về Luật Nhân Quả, Luật Hấp Dẫn và cách ứng dụng vào hành trình chuyển hóa bản thân.",
    url: "/kien-thuc/luat-nhan-qua-hap-dan",
  }),
  "/kien-thuc/tiem-thuc-niem-tin": indexable({
    title: "Tiềm Thức & Tái Lập Trình Niềm Tin",
    description:
      "Hiểu cơ chế vận hành của tiềm thức và thực hành tái lập trình những niềm tin đang giới hạn cuộc sống.",
    url: "/kien-thuc/tiem-thuc-niem-tin",
  }),
  "/kien-thuc/chua-lanh-noi-tam": indexable({
    title: "Chữa Lành Nội Tâm",
    description:
      "Kiến thức và thực hành giúp nhận diện tổn thương, chữa lành nội tâm và xây dựng mối quan hệ lành mạnh với chính mình.",
    url: "/kien-thuc/chua-lanh-noi-tam",
  }),
  "/kien-thuc/thien-thuc-hanh": indexable({
    title: "Thiền Dẫn & Thực Hành Năng Lượng",
    description:
      "Các bài viết và hướng dẫn thiền, thực hành năng lượng giúp nuôi dưỡng sự bình an và tỉnh thức.",
    url: "/kien-thuc/thien-thuc-hanh",
  }),
  "/kien-thuc/nang-luong-tien": indexable({
    title: "Năng Lượng Tiền & Thịnh Vượng",
    description:
      "Khám phá mối quan hệ với tiền, tháo gỡ niềm tin giới hạn và xây dựng tư duy thịnh vượng bền vững.",
    url: "/kien-thuc/nang-luong-tien",
  }),
  "/kien-thuc/muc-tieu-hieu-suat": indexable({
    title: "Mục Tiêu, Kỷ Luật & Hiệu Suất",
    description:
      "Phương pháp thiết lập mục tiêu, duy trì kỷ luật và nâng cao hiệu suất bằng sự kết hợp giữa nội lực và hành động.",
    url: "/kien-thuc/muc-tieu-hieu-suat",
  }),
  "/kien-thuc/kinh-doanh-tinh-thuc": indexable({
    title: "Kinh Doanh Bằng Bản Thể & Gieo Giá Trị",
    description:
      "Góc nhìn về kinh doanh tỉnh thức, xây dựng giá trị thật và phát triển bền vững từ bản thể.",
    url: "/kien-thuc/kinh-doanh-tinh-thuc",
  }),
  "/kien-thuc/video-podcast": indexable(
    {
      title: "Video & Podcast Chuyển Hóa",
      description:
        "Tổng hợp video và podcast đồng hành cùng hành trình phát triển bản thân, chữa lành và kiến tạo thịnh vượng.",
      url: "/kien-thuc/video-podcast",
    },
    "0.7",
    "weekly",
  ),

  // Public campaign pages keep self-canonicals but stay out of the main sitemap.
  "/landing/dong-tien-thinh-vuong-tu-ban-the": {
    title: "Dòng Tiền Thịnh Vượng Từ Bản Thể",
    description:
      "Khai mở tư duy, hoá giải nghẽn tắc và thiết lập sự thông tuệ tài chính từ gốc rễ nội lực.",
    image:
      "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1773736864490-976832550-D-ng-Ti-n-Th-nh-V--ng-T--B-n-Th-.png",
    url: "/landing/dong-tien-thinh-vuong-tu-ban-the",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },
  "/landing/thien-giao-thua": {
    title: "Thiền Giao Thừa",
    description:
      "Tham gia hành trình chuyển hóa tâm thức và thu hút tài lộc để kiến tạo năm mới rực rỡ cùng Mali Edu.",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1770190950/Gemini_Generated_Image_6h5i7y6h5i7y6h5i_w1qnrr.png",
    url: "/landing/thien-giao-thua",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },

  // Registry aliases are valid URLs, but duplicate funnels canonicalize to their
  // primary /dao-tao paths and stay out of the sitemap.
  "/landing/khoi-thong-dong-tien": {
    title: "Khơi Thông Dòng Tiền",
    description:
      "Chương trình chuyển hóa tư duy và khai thông dòng tiền từ gốc rễ nội lực.",
    url: "/dao-tao/khoi-thong-dong-tien",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },
  "/landing/khoi-thong-dong-tien-leader": {
    title: "Khơi Thông Dòng Tiền Dành Cho Leader",
    description:
      "Chương trình Khơi Thông Dòng Tiền dành cho lãnh đạo và người dẫn dắt đội ngũ.",
    url: "/dao-tao/khoi-thong-dong-tien-leader",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },
  "/landing/khoi-thong-dong-tien-thuong-hieu": {
    title: "Khơi Thông Dòng Tiền Thương Hiệu",
    description:
      "Chương trình xây dựng thương hiệu và khai thông dòng tiền bền vững từ nội lực.",
    url: "/dao-tao/khoi-thong-dong-tien-thuonghieu",
    robots: INDEX_ROBOTS,
    sitemap: false,
  },
  "/landing/example-template": noindex({
    title: "Mẫu Landing Page",
    description: "Trang mẫu nội bộ dùng để kiểm tra giao diện landing page.",
    url: "/landing/example-template",
  }),

  // Account, checkout and administration surfaces must never enter search results.
  "/cam-on-khoi-thong": noindex({
    title: "Đăng ký thành công",
    description: "Xác nhận đăng ký chương trình tại Mali Edu.",
    url: "/cam-on-khoi-thong",
  }),
  "/mongcoaching": noindex({
    title: "Mong Coaching",
    description: "Các kênh kết nối chính thức của Mong Coaching.",
    url: "/mongcoaching",
  }),
  "/dang-ky": noindex({
    title: "Đăng ký tài khoản",
    description: "Đăng ký tài khoản học viên Mali Edu.",
    url: "/dang-ky",
  }),
  "/gio-hang": noindex({
    title: "Giỏ hàng",
    description: "Giỏ hàng khóa học Mali Edu.",
    url: "/gio-hang",
  }),
  "/cart": noindex({
    title: "Giỏ hàng",
    description: "Đường dẫn chuyển tiếp tới giỏ hàng Mali Edu.",
    url: "/cart",
  }),
  "/lich-su-don-hang": noindex({
    title: "Lịch sử đơn hàng",
    description: "Lịch sử đơn hàng của học viên Mali Edu.",
    url: "/lich-su-don-hang",
  }),
  "/orders": noindex({
    title: "Lịch sử đơn hàng",
    description: "Đường dẫn chuyển tiếp tới lịch sử đơn hàng Mali Edu.",
    url: "/orders",
  }),
  "/ca-nhan": noindex({
    title: "Tài khoản cá nhân",
    description: "Trang quản lý tài khoản học viên Mali Edu.",
    url: "/ca-nhan",
  }),
  "/reset-password": noindex({
    title: "Đặt lại mật khẩu",
    description: "Đặt lại mật khẩu tài khoản Mali Edu.",
    url: "/reset-password",
  }),
  "/khoa-hoc-cua-toi": noindex({
    title: "Khóa học của tôi",
    description: "Danh sách khóa học của học viên Mali Edu.",
    url: "/khoa-hoc-cua-toi",
  }),
  "/admin/login": noindex({
    title: "Đăng nhập quản trị",
    description: "Đăng nhập khu vực quản trị Mali Edu.",
    url: "/admin/login",
  }),
  "/admin": noindex({
    title: "Quản trị Mali Edu",
    description: "Khu vực quản trị nội bộ Mali Edu.",
    url: "/admin",
  }),
};

export const DYNAMIC_CONTENT_ROUTES = [
  { prefix: "/tin-tuc/", collection: "posts", requirePublished: true },
  { prefix: "/bai-viet/", collection: "posts", requirePublished: true },
  { prefix: "/khoa-hoc/", collection: "courses", requirePublished: true },
  { prefix: "/tuyen-dung/", collection: "jobs", requirePublished: false },
  { prefix: "/giang-vien/", collection: "instructors", requirePublished: false },
];

export const PRIVATE_SPA_PREFIXES = [
  "/admin/",
  "/thanh-toan/",
  "/xem/",
  "/bai-giang/",
  "/tai-lieu/",
  "/ghi-chep/",
  "/dat-hang-thanh-cong/",
];

export const PUBLIC_SPA_PREFIXES = [];
