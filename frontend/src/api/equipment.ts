/*
 * GET /api/equipment: the kinds of equipment, for the library's filter and
 * the exercise editor. Cached like the muscles (src/api/muscles.ts).
 */
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

export interface Equipment {
  id: number
  /** Stable English key, such as "barbell": what the filter sends. */
  slug: string
  /** In the request's language. */
  name: string
}

export const equipmentKeys = {
  all: (language: string) => ['equipment', language] as const,
}

const FIXED_LIST_STALE_TIME_MS = 60 * 60 * 1000

export async function fetchEquipment(signal?: AbortSignal): Promise<Equipment[]> {
  const answer = await request<{ data: Equipment[] }>('/api/equipment', { signal })
  return answer.data
}

export function useEquipment(language: string) {
  return useQuery({
    queryKey: equipmentKeys.all(language),
    queryFn: ({ signal }) => fetchEquipment(signal),
    staleTime: FIXED_LIST_STALE_TIME_MS,
  })
}
