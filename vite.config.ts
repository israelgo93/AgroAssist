import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173, // Puerto por defecto para desarrollo
  },
  preview: {
    host: '0.0.0.0',
    port: 8080, // Puerto para Cloud Run
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          daily: ['@daily-co/daily-js', '@daily-co/daily-react'],
        },
      },
    },
  },
})
