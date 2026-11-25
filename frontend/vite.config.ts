/*
 * In development the browser talks only to Vite, which forwards Laravel's paths
 * to the backend container: one origin, so Sanctum's cookies work without CORS,
 * as behind Caddy in production.
 */
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

/** APP_PORT as in compose.yaml. */
const backendUrl = `http://localhost:${process.env.APP_PORT ?? '8500'}`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Production builds only: in development a service worker would serve
    // stale modules over Vite's
    VitePWA({
      // The new worker takes over in the background and the page keeps the
      // version it loaded until it is next opened: never a reload mid-workout
      registerType: 'autoUpdate',
      // Installing the app comes later (phase 2): for now it only opens offline
      manifest: false,
      workbox: {
        // The fonts too, or the first offline start draws in a fallback face
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Laravel's pages, which share the origin in production: a navigation
        // there must reach the server, not get the React app
        navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/storage\//, /^\/auth\//, /^\/admin(\/|$)/],
        // Exercise photos, once seen or read ahead (usePrepareWorkouts), for
        // workout mode offline: the library's under /storage, the user's own
        // from the API, which serves them to their owner only. Cache first: a
        // new photo has a new address. Images only: videos are read in
        // ranges, which this would break
        runtimeCaching: [{
          urlPattern: ({ url, sameOrigin }) => sameOrigin && (
            /^\/storage\/.+\.(?:webp|jpe?g|png|gif)$/i.test(url.pathname)
            || /^\/api\/exercises\/\d+\/photos\/\d+\/(?:thumb|large|original)$/.test(url.pathname)),
          handler: 'CacheFirst',
          options: {
            cacheName: 'photos',
            // The least recently used go first: the active plan's are used
            // again at each visit to Home. A conversion made again is seen
            // after a month at most
            expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true },
            cacheableResponse: { statuses: [200] },
          },
        }],
      },
    }),
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

  // The production build with its service worker. Not on the dev server's
  // port: the worker would outlive the preview there and serve the build in
  // place of `make dev`. Same proxy as the dev server (Vite's default)
  preview: {
    port: 4673,
    strictPort: true,
    host: '127.0.0.1',
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
