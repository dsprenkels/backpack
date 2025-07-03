import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: './client',
  base: "/backpack/",
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  server: {
    proxy: {
      '/backpack/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backpack\/api/, '/api')
      }
    }
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  }
})
