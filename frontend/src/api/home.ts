/*
 * GET /api/home: everything Home shows in one request rather than four, since
 * Home opens every visit and one answer arrives faster on a phone's network.
 */
import { useQuery } from '@tanstack/react-query'
import type { PlanSummary } from '@/api/plans'
import type { WorkoutSession } from '@/api/sessions'
import { request } from '@/lib/http'

export interface HomeDay {
  id: string
  name: string
  exercises: number
  /** sets × (40 s + rest); 0 for an empty day. */
  estimated_minutes: number
}

/** "Last time you did Day A". */
export interface HomeLastDay {
  id: string
  /** The day's name at the time of that workout. */
  name: string | null
  finished_at: string | null
}

export interface HomeData {
  /** Without its days. */
  active_plan: PlanSummary | null
  days: HomeDay[]
  /** The day after the last one done, back to the first after the last. */
  suggested_day_id: string | null
  last_day: HomeLastDay | null
  /** A workout the server has but that was never finished. */
  open_session: WorkoutSession | null
  /** Finished in the last 8 days, newest first, with totals: enough for this week in any time zone. */
  recent_sessions: WorkoutSession[]
}

export const homeKeys = {
  /** No language in the key: nothing in the answer is translated. */
  all: ['home'] as const,
}

/**
 * Invalidated when a workout is sent and when a plan changes, since the
 * active plan and the suggested day depend on both.
 */
export function useHome() {
  return useQuery({
    queryKey: homeKeys.all,
    queryFn: ({ signal }) => request<{ data: HomeData }>('/api/home', { signal }).then(answer => answer.data),
  })
}
