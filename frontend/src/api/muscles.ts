/*
 * GET /api/muscles: the muscle groups, for the library's filter and the
 * exercise editor. The list changes only with a backend release, so it stays
 * fresh for an hour.
 */
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

export interface Muscle {
  id: number
  /** Stable English key, such as "lower-back": what the filter sends. */
  slug: string
  /** In the request's language. */
  name: string
}

export const muscleKeys = {
  /** The language is in the key, so switching it fetches the names again. */
  all: (language: string) => ['muscles', language] as const,
}

const FIXED_LIST_STALE_TIME_MS = 60 * 60 * 1000

export async function fetchMuscles(signal?: AbortSignal): Promise<Muscle[]> {
  const answer = await request<{ data: Muscle[] }>('/api/muscles', { signal })
  return answer.data
}

export function useMuscles(language: string) {
  return useQuery({
    queryKey: muscleKeys.all(language),
    queryFn: ({ signal }) => fetchMuscles(signal),
    staleTime: FIXED_LIST_STALE_TIME_MS,
  })
}
