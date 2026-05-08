import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



const cortexUrl    = process.env.CORTEX_URL    || 'http://localhost:8000'
const cortexWsUrl  = process.env.CORTEX_WS_URL || 'ws://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    host: '0.0.0.0',   
    port: 5173,
    watch: {
      usePolling: true,   
      interval: 300,
    },
    proxy: {
      '/api': {
        target: cortexUrl,
        changeOrigin: true,
      },
      '/health': {
        target: cortexUrl,
        changeOrigin: true,
      },
      '/ws': {
        target: cortexWsUrl,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
})
