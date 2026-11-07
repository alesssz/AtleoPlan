/*
 * GET /api/muscles: the 17 muscle groups, for the library's filter and the
 * exercise editor (docs/design/D1-ui.md D1.4.3, D1.4.5). Like every file in
 * src/api/: the types, the cache keys, the function that calls the API and
 * the hook components use (the pattern: docs/concepts/C1-frontend.md C1.6;
 * src/api/health.ts is the simplest case).
 *
 * The list never changes while the app runs (it comes from the backend's
 * MuscleSeeder), so it is kept fresh for a long time: one request per visit.
 */
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

/**
 * A muscle group, as the backend's MuscleResource sends it. The name is in the
 * language of the request, which the app sends with every call (src/lib/http.ts).
 */
export interface Muscle {
  /** The row's number, sent back when saving an exercise. */
  id: number
  /** A stable English key, such as "lower-back": what the list's filter sends. */
  slug: string
  /** What the user reads, such as "Zona lombare". */
  name: string
}

/** The cache keys of the muscles (what a key is: src/api/health.ts). */
export const muscleKeys = {
  /**
   * Every muscle, in one language. The language is part of the key, so
   * switching language fetches the names again instead of showing the old ones.
   * @param language the interface's language, such as 'it'
   */
  all: (language: string) => ['muscles', language] as const,
}

/**
 * How long the list counts as fresh: an hour. It changes only with a new
 * release of the backend. 60 * 60 * 1000 milliseconds.
 */
const FIXED_LIST_STALE_TIME_MS = 60 * 60 * 1000

/**
 * Calls the endpoint. Laravel wraps lists in `data`: the function returns the
 * list itself.
 * @param signal optional cancel signal, from TanStack Query
 * @returns a Promise of the muscles, sorted by name in the request's language
 */
export async function fetchMuscles(signal?: AbortSignal): Promise<Muscle[]> {
  const answer = await request<{ data: Muscle[] }>('/api/muscles', { signal })
  return answer.data
}

/**
 * Hook: every muscle, in the current language.
 * @param language the interface's language (i18n.language), part of the cache key
 * @example const muscles = useMuscles(i18n.language); muscles.data?.map(…)
 */
export function useMuscles(language: string) {
  return useQuery({
    queryKey: muscleKeys.all(language),
    queryFn: ({ signal }) => fetchMuscles(signal),
    staleTime: FIXED_LIST_STALE_TIME_MS,
  })
}
