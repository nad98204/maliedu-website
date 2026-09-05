export const isKhoiThongStylePath = (pathname) => [
  "/dao-tao/khoi-thong-dong-tien",
  "/dao-tao/khoi-thong-dong-tien-leader",
  "/dao-tao/khoi-thong-dong-tien-thuonghieu",
  "/cam-on-khoi-thong",
].includes(pathname.replace(/\/+$/, ""));
