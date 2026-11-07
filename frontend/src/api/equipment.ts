/*
 * GET /api/equipment: the 12 kinds of equipment, for the library's filter and
 * the exercise editor. The same shape as src/api/muscles.ts, which explains
 * each piece.
 */
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

/** A kind of equipment, as the backend's EquipmentResource sends it. */
export interface Equipment {
  /** The row's number, sent back when saving an exercise. */
  id: number
  /** A stable English key, such as "barbell": what the list's filter sends. */
  slug: string
  /** What the user reads, such as "Bilanciere". */
  name: string
}

/** The cache keys of the equipment. */
export const equipmentKeys = {
  /**
   * Every kind of equipment, in one language.
   * @param language the interface's language, such as 'it'
   */
  all: (language: string) => ['equipment', language] as const,
}

/** An hour: the list changes only with a new release of the backend. */
const FIXED_LIST_STALE_TIME_MS = 60 * 60 * 1000

/**
 * Calls the endpoint and unwraps Laravel's `data`.
 * @param signal optional cancel signal
 * @returns a Promise of the equipment, sorted by name
 */
export async function fetchEquipment(signal?: AbortSignal): Promise<Equipment[]> {
  const answer = await request<{ data: Equipment[] }>('/api/equipment', { signal })
  return answer.data
}

/**
 * Hook: every kind of equipment, in the current language.
 * @param language the interface's language, part of the cache key
 */
export function useEquipment(language: string) {
  return useQuery({
    queryKey: equipmentKeys.all(language),
    queryFn: ({ signal }) => fetchEquipment(signal),
    staleTime: FIXED_LIST_STALE_TIME_MS,
  })
}
