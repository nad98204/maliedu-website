import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Force reload: 2026-01-16
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
});
