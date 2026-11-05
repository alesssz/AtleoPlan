/*
 * Vite configuration of the React app: the plugins, and the development
 * server that puts the React app and the Laravel backend behind one address.
 *
 * In development the browser only ever talks to Vite (http://localhost:5673);
 * Vite answers with the React app and forwards Laravel's paths to the backend
 * container. One address means Sanctum's login cookies work without CORS, as
 * they will in production behind Caddy (docs/02-decisions.md 2.6).
 * Setup and ports: docs/00-setup.md 0.4 and 0.7.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Laravel on the Mac: standard port 8000 + 500, or APP_PORT as in compose.yaml. */
const backendUrl = `http://localhost:${process.env.APP_PORT ?? '8500'}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Standard port 5173 + 500 (docs/00-setup.md 0.4); strictPort makes Vite
    // stop with an error instead of silently moving to another port, which
    // Sanctum would not recognise.
    port: 5673,
    strictPort: true,

    // Laravel's paths go to the backend; everything else is the React app.
    // The Host header is left as localhost:5673 (no changeOrigin), so Laravel
    // sees the address the browser is on and Sanctum treats it as its own app.
    proxy: {
      // The JSON API
      '/api': backendUrl,
      // Sanctum's CSRF cookie, asked before logging in
      '/sanctum': backendUrl,
      // Uploaded photos and videos served by Laravel
      '/storage': backendUrl,
    },
  },
})
