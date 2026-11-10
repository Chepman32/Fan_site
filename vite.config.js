import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/__/firebase': 'https://gta-vi-fan-site.web.app',
      '/api/account': 'https://gta-vi-fan-site.web.app',
      '/api/shop/stars': process.env.STARS_DEV_API_ORIGIN || 'https://gta-vi-fan-site.web.app',
    },
  },
})
