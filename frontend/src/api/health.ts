/*
 * GET /api/health: is the Laravel backend reachable? The first API call of
 * the app, and the model for the next ones: every resource of the API gets
 * a file like this in src/api/ with its types, its query keys and its hooks.
 * Server data with TanStack Query: docs/04-frontend.md 4.6.
 *
 * The whole chain it proves: browser → Vite (or Caddy) → Laravel → JSON back.
 */
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

/**
 * What GET /api/health answers (backend/routes/api.php). An interface
 * describes an object's shape; it exists only for TypeScript's checks and
 * vanishes from the JavaScript the browser runs.
 */
export interface Health {
  /** Always 'ok' when Laravel answers at all (the type allows only that string). */
  status: 'ok'
}

/**
 * The cache keys of this resource. A key identifies one piece of data in
 * TanStack Query's cache; keeping them in one object avoids typos and lets
 * code refresh them later: queryClient.invalidateQueries({ queryKey: healthKeys.all }).
 */
export const healthKeys = {
  /**
   * Every health query. `as const` makes the array read-only and keeps its
   * exact value as the type (readonly ['health'] rather than string[]).
   */
  all: ['health'] as const,
}

/**
 * Calls the endpoint; `signal` lets TanStack Query cancel it.
 * @param signal optional cancel signal, passed on to fetch()
 * @returns a Promise of the answer, typed as Health
 */
export function fetchHealth(signal?: AbortSignal): Promise<Health> {
  return request<Health>('/api/health', { signal })
}

/**
 * Hook: the backend's health, for components. A hook is a function whose
 * name starts with `use` and that calls other hooks (here TanStack Query's
 * useQuery), so it follows the same rules: call it only at the top level of
 * a component (docs/04-frontend.md 4.4).
 *
 * Returns TanStack Query's result, whose fields re-render the component as
 * they change: `data` (the answer, once there), `isPending` (no data yet),
 * `isError` / `error`, `isSuccess`, `isFetching` (a request is running,
 * even a background one), and `refetch()` to ask again.
 *
 * @example const health = useHealth(); if (health.isError) …
 */
export function useHealth() {
  return useQuery({
    // Where the answer lives in the cache
    queryKey: healthKeys.all,
    // How to get it. `({ signal }) => …` destructures the object TanStack
    // Query passes in: it takes out its `signal` field as a variable
    queryFn: ({ signal }) => fetchHealth(signal),
    // A quick check: one try, so "unreachable" shows without waiting for retries
    retry: false,
  })
}
