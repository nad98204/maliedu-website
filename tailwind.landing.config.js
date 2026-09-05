import base from "./tailwind.config.js";

export default {
  ...base,
  content: [
    "./src/landing-templates/khoi-thong-dong-tien/**/*.{js,jsx}",
    "./src/landing-templates/khoi-thong-dong-tien-thuonghieu/**/*.{js,jsx}",
    "./src/components/Footer.jsx",
    "./src/components/ErrorBoundary.jsx",
    "./src/App.jsx",
  ],
};
