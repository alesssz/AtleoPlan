/*
 * Home's data (backend `GET /api/home`, docs/concepts/C2-backend.md C2.5.7):
 * everything Home shows, in one request. Like every file in src/api/: the
 * types, the keys and the hook (docs/concepts/C1-frontend.md C1.6).
 *
 * One request rather than four (the active plan, its days, the suggested
 * day, the recent workouts): Home is the first screen of every visit, and
 * one answer arrives faster than four on a phone's network. The backend
 * builds it in HomeSummary.
 */
import { useQuery } from '@tanstack/react-query'
import type { PlanSummary } from '@/api/plans'
import type { WorkoutSession } from '@/api/sessions'
import { request } from '@/lib/http'

/** One day of the active plan, as Home lists it: no exercises, just counts. */
export interface HomeDay {
  /** The day's UUID. */
  id: string
  /** "Day A – Push". */
  name: string
  /** How many exercises it has. */
  exercises: number
  /** About how long it takes, in minutes: sets × (40 s + rest). 0 for an empty day. */
  estimated_minutes: number
}

/** The day done last time in the active plan: "last time you did Day A". */
export interface HomeLastDay {
  /** The day's UUID. */
  id: string
  /** Its name at the time of that workout; null when the workout has none. */
  name: string | null
  /** When that workout was finished, as ISO 8601 text. */
  finished_at: string | null
}

/** The whole answer of GET /api/home, inside `data`. */
export interface HomeData {
  /** The active plan, without its days; null when no plan is active. */
  active_plan: PlanSummary | null
  /** The active plan's days, in order; empty without an active plan. */
  days: HomeDay[]
  /** The day to suggest (D2.8); null without an active plan or days. */
  suggested_day_id: string | null
  /** The day done last; null when none was done yet. */
  last_day: HomeLastDay | null
  /** A workout the server has but that was never finished; null for none. */
  open_session: WorkoutSession | null
  /** The workouts finished in the last 8 days, newest first, with their totals. */
  recent_sessions: WorkoutSession[]
}

/** The cache keys of Home. */
export const homeKeys = {
  /**
   * Home's one answer. The language is not in the key: nothing in it is
   * translated (the days' names are the user's own text).
   */
  all: ['home'] as const,
}

/**
 * Hook: Home's data. Read again when a workout is sent (WorkoutScreen,
 * usePendingSessions) and when a plan changes (src/api/plans.ts), since the
 * active plan and the suggested day come from both.
 * @example const home = useHome()
 */
export function useHome() {
  return useQuery({
    queryKey: homeKeys.all,
    // Laravel wraps the answer in `data`; `.then()` takes it out
    queryFn: ({ signal }) => request<{ data: HomeData }>('/api/home', { signal }).then(answer => answer.data),
  })
}
