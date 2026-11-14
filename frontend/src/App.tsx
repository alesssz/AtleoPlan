/*
 * The providers, outside in: the server-data cache, the theme, the router.
 * i18next is set up globally and needs none.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'
import { ThemeProvider } from '@/theme/ThemeProvider'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
      {/* Top-right, clear of the phone's tab bar; left out of production builds */}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="top-right" />}
    </QueryClientProvider>
  )
}
