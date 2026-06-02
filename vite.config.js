import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // base: '/TUGAS_BESAR-MANPROSI_PIS/',
  server: {
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:5000',
      '/uploads': process.env.VITE_API_URL || 'http://localhost:5000'
    }
  },
  plugins: [
    tailwindcss(),
    react()
  ],
})
