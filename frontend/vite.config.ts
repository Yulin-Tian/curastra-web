import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev the backend runs on 3000; the app calls relative /api paths.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
