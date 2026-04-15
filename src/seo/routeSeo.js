import { MALI_LOGO_URL } from "../constants/brandAssets.js";

export const SITE_NAME = "Mali Edu";
export const SITE_URL = "https://luathapdan.vn";
export const DEFAULT_IMAGE = MALI_LOGO_URL;

export const DEFAULT_SEO = {
  title: `${SITE_NAME} - Đánh thức tiềm năng thịnh vượng`,
  description:
    "Mali Edu đồng hành cùng bạn trên hành trình khai mở tiềm thức, chữa lành nội tâm và kiến tạo cuộc sống thịnh vượng.",
  image: DEFAULT_IMAGE,
  url: "/",
  type: "website",
};

export const ROUTE_SEO = {
  "/dao-tao/khoi-thong-dong-tien": {
    title: "Khơi Thông Dòng Tiền",
    description:
      "Khám phá bí mật thu hút tài chính và giải phóng tắc nghẽn năng lượng tiền bạc cùng Mali Edu.",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682614/Kh%C6%A1i_Th%C3%B4ng_D%C3%B2ng_Ti%E1%BB%81n_M%C3%A0u_Xanh_sjajsx.jpg",
    url: "/dao-tao/khoi-thong-dong-tien",
  },
  "/dao-tao/luat-hap-dan": {
    title: "Luật Hấp Dẫn",
    description:
      "Tiếp cận Luật Hấp Dẫn như một hệ thống làm việc với tiềm thức, cảm xúc và niềm tin gốc rễ để thay đổi cuộc sống từ bên trong.",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682596/LU%E1%BA%ACT_H%E1%BA%A4P_D%E1%BA%AAN_dnrvn0.jpg",
    url: "/dao-tao/luat-hap-dan",
  },
  "/dao-tao/vut-toc-muc-tieu": {
    title: "Vút Tốc Mục Tiêu",
    description:
      "Kết nối mục tiêu với tiềm thức và hành động thực tế để tăng tốc kết quả trong công việc và cuộc sống.",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767682425/V%C3%BAt_T%E1%BB%91c_M%E1%BB%A5c_Ti%C3%AAu_2024_b%E1%BA%A3n_2_d6mhn3.jpg",
    url: "/dao-tao/vut-toc-muc-tieu",
  },
  "/landing/dong-tien-thinh-vuong-tu-ban-the": {
    title: "Dòng Tiền Thịnh Vượng Từ Bản Thể",
    description:
      "Khai mở tư duy, hoá giải nghẽn tắc và thiết lập sự thông tuệ tài chính từ gốc rễ nội lực, mang lại sự thịnh vượng bền vững.",
    image:
      "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1773736864490-976832550-D-ng-Ti-n-Th-nh-V--ng-T--B-n-Th-.png",
    url: "/landing/dong-tien-thinh-vuong-tu-ban-the",
  },
  "/landing/thien-giao-thua": {
    title: "Thiền Giao Thừa",
    description:
      "Tham gia hành trình chuyển hóa tâm thức và thu hút tài lộc để kiến tạo năm mới rực rỡ cùng Mali Edu.",
    image:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1770190950/Gemini_Generated_Image_6h5i7y6h5i7y6h5i_w1qnrr.png",
    url: "/landing/thien-giao-thua",
  },
};

export const normalizeRoutePath = (path = "/") => {
  if (!path) {
    return "/";
  }

  if (/^https?:\/\//i.test(path)) {
    const { pathname } = new URL(path);
    return pathname.replace(/\/+$/, "") || "/";
  }

  const cleanPath = path.split("?")[0].split("#")[0];
  return cleanPath.replace(/\/+$/, "") || "/";
};

export const toAbsoluteUrl = (path = "/") => {
  if (!path) {
    return SITE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = normalizeRoutePath(path);
  return normalizedPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${normalizedPath}`;
};

const withSiteName = (title) => {
  if (!title) {
    return DEFAULT_SEO.title;
  }

  return title.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? title
    : `${title} - ${SITE_NAME}`;
};

export const getResolvedSeo = (input = {}) => {
  const baseSeo =
    typeof input === "string"
      ? { ...DEFAULT_SEO, ...(ROUTE_SEO[normalizeRoutePath(input)] || {}), url: input }
      : { ...DEFAULT_SEO, ...input };

  const normalizedUrl = baseSeo.url || baseSeo.path || "/";

  return {
    title: withSiteName(baseSeo.title),
    description: baseSeo.description || DEFAULT_SEO.description,
    image: toAbsoluteUrl(baseSeo.image || DEFAULT_SEO.image),
    url: toAbsoluteUrl(normalizedUrl),
    type: baseSeo.type || DEFAULT_SEO.type,
  };
};

export const getRouteSeo = (path) => getResolvedSeo(path);
