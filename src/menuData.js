export const MENU_ITEMS = [
  {
    label: "Trang chủ",
    path: "/",
  },
  {
    label: "Giới thiệu",
    path: "/gioi-thieu",
    children: [
      { label: "Về Mali Edu", path: "/gioi-thieu#ve-mali-edu" },
      { label: "Mong Coaching", path: "/gioi-thieu/mong-coaching" },
    ],
  },
  {
    label: "Chương trình đào tạo",
    path: "/dao-tao",
    children: [
      { label: "Luật Hấp Dẫn", path: "/dao-tao/luat-hap-dan" },
      { label: "Khơi Thông Dòng Tiền", path: "/dao-tao/khoi-thong-dong-tien" },
      { label: "Vút Tốc Mục Tiêu", path: "/dao-tao/vut-toc-muc-tieu" },
    ],
  },
  {
    label: "Khóa Học Online",
    path: "/khoa-hoc",
  },

  {
    label: "Tin tức",
    path: "/tin-tuc",
  },
  {
    label: "Liên hệ",
    path: "/lien-he",
  },
  {
    label: "Cảm nhận học viên",
    path: "/cam-nhan",
    children: [
      { label: "Vút tốc mục tiêu", path: "/cam-nhan/vut-toc-muc-tieu" },
      { label: "Luật hấp dẫn", path: "/cam-nhan/luat-hap-dan" },
    ],
  },
  {
    label: "Kiến thức",
    path: "/kien-thuc",
    children: [
      { label: "Luật Nhân Quả & Luật Hấp Dẫn", path: "/kien-thuc/luat-nhan-qua-hap-dan" },
      { label: "Tiềm Thức & Tái Lập Trình Niềm Tin", path: "/kien-thuc/tiem-thuc-niem-tin" },
      { label: "Chữa Lành Nội Tâm & Đứa Trẻ Bên Trong", path: "/kien-thuc/chua-lanh-noi-tam" },
      { label: "Thiền Dẫn & Thực Hành Năng Lượng", path: "/kien-thuc/thien-thuc-hanh" },
      { label: "Năng Lượng Tiền & Thịnh Vượng", path: "/kien-thuc/nang-luong-tien" },
      { label: "Mục Tiêu – Kỷ Luật – Hiệu Suất", path: "/kien-thuc/muc-tieu-hieu-suat" },
      { label: "Kinh Doanh Bằng Bản Thể & Gieo Giá Trị", path: "/kien-thuc/kinh-doanh-tinh-thuc" },
      { label: "Video Podcast Đồng Hành", path: "/kien-thuc/video-podcast" },
    ],
  },
];

export const HOTLINE = "0355 067 656";

export const SOCIALS = {
  facebook: "https://www.facebook.com/mong.coaching",
  tiktok: "https://www.tiktok.com/@nguyenuocmong53",
  youtube: "https://www.youtube.com/@nguyenuocmong53",
};
