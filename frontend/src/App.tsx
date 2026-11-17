import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from '@/lib/query-client'
import { persistOptions } from '@/lib/query-persistence'
import { router } from '@/router'
import { ThemeProvider } from '@/theme/ThemeProvider'

// One persister for the app's lifetime, not a new one at each render
const cachePersistence = persistOptions()

export function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={cachePersistence}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
      {/* Top-right, clear of the phone's tab bar; left out of production builds */}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="top-right" />}
    </PersistQueryClientProvider>
  )
}
