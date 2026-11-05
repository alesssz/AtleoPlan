/*
 * The TanStack Query client: the cache of every piece of server data the
 * app has loaded, shared by all components (provided in src/App.tsx).
 * docs/04-frontend.md 4.6.
 *
 * In short: a component asks for data with useQuery({ queryKey, queryFn });
 * the "query key" (an array such as ['health']) names the data in the
 * cache, and queryFn is the function that fetches it. The client returns
 * the cached copy at once if there is one, fetches it when missing or old,
 * and re-renders every component using that key when the new data arrives.
 * Components never store server data in useState. src/api/health.ts is the
 * model.
 */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/api/auth'
import { ApiError } from './http'

/**
 * How long fetched data counts as fresh: no refetch within 30 seconds.
 * (30_000 is 30000: underscores in a number only make it easier to read.)
 */
const STALE_TIME_MS = 30_000

/** How many times a failed request is tried again. */
const MAX_RETRIES = 2

/**
 * Called after any failed request. A 401 means the session has ended, such as
 * when it expired or was closed on another device: "who is signed in" becomes
 * nobody, and the guards (src/routes/RequireAuth.tsx) go to /login, wherever
 * the user was. No screen has to handle this by itself.
 * @param error what the request threw
 */
function handleSignedOut(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(authKeys.user, null)
  }
}

/**
 * The app's one query client, with the defaults of every query; a single
 * useQuery() can still override them (src/api/health.ts does).
 * The two caches hold the requests that read and those that change data; each
 * calls its onError on any failure of its kind.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleSignedOut }),
  mutationCache: new MutationCache({ onError: handleSignedOut }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      // Try again only when trying again may help: a network error or a
      // server error (5xx). A 401, 403, 404 or 422 would fail the same way.
      // An arrow function with two parameters: (a, b) => { … }. TanStack
      // Query calls it after each failure; true means "try again".
      retry: (failureCount, error) => {
        if (failureCount >= MAX_RETRIES) return false
        return !(error instanceof ApiError) || error.status === 0 || error.status >= 500
      },
    },
  },
})
