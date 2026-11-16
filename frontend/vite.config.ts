/*
 * In development the browser talks only to Vite, which forwards Laravel's paths
 * to the backend container: one origin, so Sanctum's cookies work without CORS,
 * as behind Caddy in production.
 */
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/** APP_PORT as in compose.yaml. */
const backendUrl = `http://localhost:${process.env.APP_PORT ?? '8500'}`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    // Mirrors `paths` in tsconfig.app.json
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // Strict: Sanctum recognises this port only
    port: 5673,
    strictPort: true,
    // On Windows `localhost` resolves to ::1 only, where `adb reverse` to a
    // phone finds nothing. Still loopback only, not the LAN
    host: '127.0.0.1',

    // No changeOrigin: Laravel must see the browser's host, so Sanctum
    // treats it as its own app
    proxy: {
      '/api': backendUrl,
      '/sanctum': backendUrl,
      '/storage': backendUrl,
      // Google sign-in and its registered callback. The trailing slash keeps
      // a route such as /authors in the React app
      '/auth/': backendUrl,
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
