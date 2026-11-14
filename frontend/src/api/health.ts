/*
 * GET /api/health: proves the whole chain answers, browser → Vite (or Caddy) →
 * Laravel.
 */
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

export interface Health {
  status: 'ok'
}

export const healthKeys = {
  all: ['health'] as const,
}

export function fetchHealth(signal?: AbortSignal): Promise<Health> {
  return request<Health>('/api/health', { signal })
}

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: ({ signal }) => fetchHealth(signal),
    // One try, so "unreachable" shows without waiting for retries
    retry: false,
  })
}
