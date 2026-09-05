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
      { label: "Chinh Phục Mục Tiêu", path: "/dao-tao/chinh-phuc-muc-tieu" },
    ],
  },
  {
    label: "Khóa Học Online",
    path: "/khoa-hoc",
  },

  {
    label: "Thôi miên",
    path: "/thoi-mien",
  },
  {
    label: "Cảm nhận học viên",
    path: "/cam-nhan",
    children: [
      { label: "Vút tốc mục tiêu", path: "/cam-nhan/vut-toc-muc-tieu" },
      { label: "Luật hấp dẫn", path: "/cam-nhan/luat-hap-dan" },
    ],
  },
];

export const HOTLINE = "0355 067 656";

export const SOCIALS = {
  facebook: "https://www.facebook.com/mong.coaching",
  tiktok: "https://www.tiktok.com/@nguyenuocmong53",
  youtube: "https://www.youtube.com/@nguyenuocmong53",
};
