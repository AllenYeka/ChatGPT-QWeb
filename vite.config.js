import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 2000
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5380,
    proxy: {
      "/api/v1/chat/completions": { target: 'https://api.openai-hk.com/', secure: false, changeOrigin: true, rewrite: (path) => path.replace('/api', '') },
    },
  },
})
