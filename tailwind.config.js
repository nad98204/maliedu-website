/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Cấu hình để Playfair Display ưu tiên cho các class serif
        serif: ['"Playfair Display"', 'serif'],
        // Cấu hình để Inter ưu tiên cho các class sans
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Brand Colors
        'secret-paper': '#F9F1D8', // Giấy cổ
        'secret-ink': '#1a1a1a',   // Mực đen
        'secret-wax': '#8B2E2E',   // Sáp niêm phong
        'secret-gold': '#D4AF37',  // Vàng kim loại
        'secret-dark': '#1a0b00',  // Nền tối
      },
      backgroundImage: {
        'paper-texture': "url('https://www.transparenttextures.com/patterns/cream-paper.png')", // Hiệu ứng vân giấy
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
