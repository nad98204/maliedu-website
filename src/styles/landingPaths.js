export const isKhoiThongStylePath = (pathname) => [
  "/dao-tao/khoi-thong-dong-tien",
  "/dao-tao/khoi-thong-dong-tien-leader",
  "/dao-tao/khoi-thong-dong-tien-thuonghieu",
  "/cam-on-khoi-thong",
].includes(pathname.replace(/\/+$/, ""));

export const isSecretLandingPath = (pathname) => [
  "/dao-tao/bi-mat-luat-hap-dan",
  "/landing/bi-mat-luat-hap-dan",
].includes(pathname.replace(/\/+$/, ""));
