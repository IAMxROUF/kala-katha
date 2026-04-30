import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // In local dev (npm run dev), proxy /api/* calls to Vercel CLI
    // which runs on port 3000 by default via `vercel dev`.
    // If you just run `npm run dev` without Vercel CLI the proxy
    // will 502 gracefully and the app falls back to heuristic data.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
