/*
 * The app's one TanStack Query client. Server data lives in its cache, never in
 * component state.
 */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { forgetAccount } from '@/api/auth'
import { ApiError } from './http'
import { CACHE_MAX_AGE_MS } from './query-persistence'

const STALE_TIME_MS = 30_000

const MAX_RETRIES = 2

/**
 * A 401 anywhere means the session has ended (expired, or closed on another
 * device): "who is signed in" becomes nobody, and RequireAuth sends the user
 * to /login, so no screen has to handle it. The account's data goes too, as
 * on signing out: the cache is kept on the phone, for whoever signs in next.
 */
function handleSignedOut(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    forgetAccount(queryClient)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleSignedOut }),
  mutationCache: new MutationCache({ onError: handleSignedOut }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      // An answer dropped from memory is dropped from the phone too: it must
      // live as long as the copy kept there
      gcTime: CACHE_MAX_AGE_MS,
      // Only when retrying may help: no answer, or a server error. A 4xx
      // would fail the same way again
      retry: (failureCount, error) => {
        if (failureCount >= MAX_RETRIES) return false
        return !(error instanceof ApiError) || error.status === 0 || error.status >= 500
      },
    },
  },
})
