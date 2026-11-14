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

// From vitest/config, so `test` is typed too
export default defineConfig({
  plugins: [
    react(),
    // Configured in src/index.css, with no config file
    tailwindcss(),
  ],

  resolve: {
    // The same alias as tsconfig.app.json
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // Standard + 500. Strict: another port would not be recognised by Sanctum
    port: 5673,
    strictPort: true,
    // On Windows `localhost` resolves to ::1 only, where `adb reverse` to a
    // phone finds nothing. Still only this computer, not the Wi-Fi
    host: '127.0.0.1',

    // No changeOrigin: Laravel must see the browser's host, so Sanctum
    // treats it as its own app
    proxy: {
      '/api': backendUrl,
      '/sanctum': backendUrl,
      '/storage': backendUrl,
      // Sign in with Google; the callback's address is registered with Google.
      // The final slash keeps a page such as /authors in the React app
      '/auth/': backendUrl,
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
