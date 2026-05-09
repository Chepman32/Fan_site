import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://gta-vi-fan-site.web.app',
      '/__/firebase': 'https://gta-vi-fan-site.web.app',
    },
  },
})
