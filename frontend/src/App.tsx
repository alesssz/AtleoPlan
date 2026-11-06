/*
 * The root component: the one src/main.tsx draws, which contains all the
 * others. It wraps the app in its "providers", components that make a
 * shared service available to everything drawn inside them. Order, from
 * the outside in:
 *   1. QueryClientProvider: the server-data cache (src/lib/query-client.ts);
 *   2. ThemeProvider: the dark / light theme (src/theme/);
 *   3. RouterProvider: draws the screen of the current address (src/router.tsx).
 * Translations need no provider: i18next is set up globally in src/i18n/.
 * Start-up sequence: docs/concepts/C1-frontend.md C1.3; providers are React "context",
 * explained in C1.4.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router/dom'
// '@/…' is an alias for 'src/…' (set in vite.config.ts and tsconfig.app.json)
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'
import { ThemeProvider } from '@/theme/ThemeProvider'

/**
 * The whole app. A React component is a plain function whose name starts
 * with a capital letter and that returns JSX, the description of what to
 * draw (docs/concepts/C1-frontend.md C1.4). `export` makes it importable from other
 * files: here as a *named* export, imported with `import { App } from …`.
 */
export function App() {
  return (
    // Components nest like HTML elements: what sits between a component's
    // opening and closing tag is passed to it as its `children`.
    // `client={queryClient}` is a prop (an input of the component); the
    // braces hold any JavaScript expression, here a variable.
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
      {/* A panel to inspect the cache (the round button, top-right, clear
          of the phone's tab bar). Only in development: the production
          build leaves it out. `a && <X />` draws X only when `a` is true;
          import.meta.env.DEV is Vite's "running `npm run dev`" flag. */}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="top-right" />}
    </QueryClientProvider>
  )
}
