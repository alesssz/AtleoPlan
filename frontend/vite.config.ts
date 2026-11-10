/*
 * Vite configuration of the React app: the plugins, the `@/` import alias,
 * the development server that puts the React app and the Laravel backend
 * behind one address, and the test runner (Vitest).
 *
 * Vite is the build tool: `npm run dev` starts its development server,
 * which turns our TypeScript and JSX into JavaScript the browser can run,
 * on the fly; `npm run build` makes the optimised files of production in
 * dist/ (docs/concepts/C1-frontend.md C1.1).
 *
 * In development the browser only ever talks to Vite (http://localhost:5673);
 * Vite answers with the React app and forwards Laravel's paths to the backend
 * container. One address means Sanctum's login cookies work without CORS, as
 * they will in production behind Caddy (docs/design/D2-decisions.md D2.6).
 * Setup and ports: docs/start/S1-setup.md S1.4 and S1.7. How the app is built:
 * docs/concepts/C1-frontend.md.
 */
// Named imports (in braces) take one export by name; default imports (no
// braces, e.g. `react`) take the package's main export under a name we pick.
// 'node:url' is one of Node's built-in modules: this file runs in Node,
// not in the browser
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Laravel on this computer: standard port 8000 + 500, or APP_PORT as in compose.yaml.
 * A template literal (backticks) inserts the value of ${…}; `a ?? b` is a,
 * or b when a is missing (null or undefined).
 */
const backendUrl = `http://localhost:${process.env.APP_PORT ?? '8500'}`

// https://vite.dev/config/
// `export default`: the file's main export, which Vite reads. defineConfig()
// only returns its argument, but gives it types, so the editor can check and
// autocomplete the options (imported from vitest/config so that `test` is
// known too).
export default defineConfig({
  plugins: [
    // JSX, and Fast Refresh: an edited component updates in the page
    // without losing its state
    react(),
    // Tailwind CSS v4: scans the code for class names and generates only
    // the CSS actually used (configured in src/index.css, no config file)
    tailwindcss(),
  ],

  resolve: {
    // `import { Button } from '@/components/ui/button'` instead of long
    // relative paths ('../../../components/…'); same alias in tsconfig.app.json.
    // import.meta.url is this file's own address, so './src' is resolved
    // next to it, whatever folder the command runs from
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // Standard port 5173 + 500 (docs/start/S1-setup.md S1.4); strictPort makes Vite
    // stop with an error instead of silently moving to another port, which
    // Sanctum would not recognise.
    port: 5673,
    strictPort: true,
    // Listen on 127.0.0.1, IPv4's own address for "this computer". Left to
    // itself, Vite listens on whatever `localhost` resolves to first, which on
    // Windows is ::1 (IPv6) only: a browser on the computer still finds it,
    // since it tries both, but the port forwarding to a phone over USB
    // (`make phone`, adb reverse) connects to 127.0.0.1 and found nothing
    // there (docs/how-to/H3-frontend.md H3.8.2). Still only this computer:
    // not the Wi-Fi.
    host: '127.0.0.1',

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

  // Vitest, the test runner (`npm test`): reuses this file's plugins and
  // alias. docs/concepts/C1-frontend.md C1.10
  test: {
    // A simulated browser (jsdom), so components can be rendered in tests
    environment: 'jsdom',
    // Runs before every test file: adds matchers such as toBeInTheDocument()
    setupFiles: ['./src/test/setup.ts'],
    // Tests live next to the code they test: Thing.tsx → Thing.test.tsx
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
