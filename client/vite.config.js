import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor'
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux')) return 'state'
          if (id.includes('node_modules/@tanstack/react-query')) return 'query'
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/framer-motion')) return 'ui'
          if (id.includes('node_modules/socket.io-client')) return 'socket'
          if (id.includes('node_modules/gsap')) return 'gsap'
          if (id.includes('node_modules/jspdf')) return 'pdf'
          if (id.includes('node_modules/zod') || id.includes('node_modules/react-hook-form')) return 'forms'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
})
