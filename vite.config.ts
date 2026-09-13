import { defineConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  root: './client',
  publicDir: '../public',
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
}) satisfies UserConfig