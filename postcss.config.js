export default {
  plugins: {
    // Tailwind v3 JIT đã chỉ emit class có trong `content` — không chạy PurgeCSS sau Tailwind
    // (tránh xóa nhầm utility / @layer). Giảm CSS “dư” trên từng URL: tách route/CSS hoặc lazy scope.
    tailwindcss: {},
    autoprefixer: {},
  },
}