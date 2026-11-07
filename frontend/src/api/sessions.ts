/*
 * The workouts' API (backend docs/concepts/C2-backend.md C2.5.7): sending a
 * whole workout, and the sets of last time for workout mode's "Last" column.
 * Like every file in src/api/: the types, the keys and the functions
 * (docs/concepts/C1-frontend.md C1.6, C1.17).
 *
 * Sending is a plain function, not a mutation hook: it is called by the
 * workout screen when the user taps Done, and again later by the queue of
 * workouts waiting for the network (src/lib/pending-sessions.ts), which runs
 * outside any page.
 */
import { useQuery } from '@tanstack/react-query'
import type { SetType } from '@/api/plans'
import { request } from '@/lib/http'

/** One completed set, as the backend's LoggedSetResource sends it. */
export interface LoggedSet {
  /** A UUID made on the phone. */
  id: string
  /** What was really done. */
  set_type: SetType
  /** Kilograms, as exact text: "80.000"; null for an exercise without a weight. */
  weight_kg: string | null
  /** Reps; null for a timed or distance exercise. */
  reps: number | null
  /** Seconds, for a timed exercise. */
  duration_seconds: number | null
  /** Meters, for a distance exercise. */
  distance_meters: number | null
  /** The moment of the tap, as ISO 8601 text in UTC. */
  completed_at: string
}

/** One set as the phone sends it; weights in kilograms, as numbers. */
export interface LoggedSetInput {
  /** A UUID made on the phone. */
  id: string
  /** Its type. */
  set_type: SetType
  /** Kilograms; null when the exercise has no weight. */
  weight_kg: number | null
  /** Reps; null when the exercise has none. */
  reps: number | null
  /** Seconds; for a timed exercise. */
  duration_seconds: number | null
  /** Meters; for a distance exercise. */
  distance_meters: number | null
  /** The moment of the tap, as ISO 8601 text with the device's offset. */
  completed_at: string
}

/** One exercise of a workout, as the phone sends it. */
export interface SessionExerciseInput {
  /** A UUID made on the phone. */
  id: string
  /** The exercise done. */
  exercise_id: number
  /** The plan's slot it filled; null for one added on the fly. */
  plan_item_id: string | null
  /** Copied from the plan. */
  superset_group: number | null
  /** The user's notes; null for none. */
  notes: string | null
  /** The completed sets, in order; empty for an exercise skipped. */
  sets: LoggedSetInput[]
}

/** A whole workout, as PUT /api/sessions/{id} expects it. */
export interface SessionInput {
  /** The plan followed; null for a free workout. */
  plan_id: string | null
  /** The day followed. */
  plan_day_id: string | null
  /** Copies of the names at the start. */
  plan_name: string | null
  /** Copy of the day's name at the start. */
  day_name: string | null
  /** ISO 8601 with the device's offset. */
  started_at: string
  /** Null while in progress. */
  finished_at: string | null
  /** The time actually trained, pauses left out. */
  duration_seconds: number | null
  /** The summary's 1–5 (FEAT-4); null here. */
  feeling: number | null
  /** Free notes; null here. */
  notes: string | null
  /** The exercises, in order. */
  exercises: SessionExerciseInput[]
}

/** A workout as the backend sends it back (WorkoutSessionResource), with its totals. */
export interface WorkoutSession {
  /** Its UUID. */
  id: string
  /** The plan followed, if it still exists. */
  plan_id: string | null
  /** The day's name at the time. */
  day_name: string | null
  /** When it started. */
  started_at: string
  /** When it was finished; null while in progress. */
  finished_at: string | null
  /** Sets done, warm-ups excluded. */
  sets_done?: number
  /** Weight × reps, warm-ups excluded, in kilograms, as exact text. */
  volume_kg?: string
}

/** The sets of last time for one exercise (GET /api/sessions/last-sets). */
export interface LastSets {
  /** The exercise. */
  exercise_id: number
  /** The workout they come from. */
  session_id: string
  /** When that workout started. */
  started_at: string
  /** Its sets, in order. */
  sets: LoggedSet[]
}

/** The cache keys of the workouts. */
export const sessionKeys = {
  /** Everything about workouts. */
  all: ['sessions'] as const,
  /**
   * Last time, for these exercises.
   * @param exerciseIds the exercises, in the order asked
   */
  lastSets: (exerciseIds: number[]) => ['sessions', 'last-sets', exerciseIds] as const,
}

/**
 * Reads the sets of last time for some exercises.
 * @param exerciseIds the exercises' ids; at most 50
 * @param signal optional cancel signal
 * @returns one entry per exercise done before; the others are left out
 */
export function fetchLastSets(exerciseIds: number[], signal?: AbortSignal): Promise<LastSets[]> {
  return request<{ data: LastSets[] }>(`/api/sessions/last-sets?exercises=${exerciseIds.join(',')}`, { signal })
    .then(answer => answer.data)
}

/**
 * Hook: the sets of last time for some exercises; nothing is asked for an
 * empty list (`enabled`).
 * @param exerciseIds the exercises' ids
 */
export function useLastSets(exerciseIds: number[]) {
  return useQuery({
    queryKey: sessionKeys.lastSets(exerciseIds),
    queryFn: ({ signal }) => fetchLastSets(exerciseIds, signal),
    enabled: exerciseIds.length > 0,
  })
}

/**
 * Sends a whole workout (PUT /api/sessions/{id}). The backend creates it the
 * first time and replaces it afterwards, so sending it again is safe.
 * @param id the workout's UUID
 * @param input the whole workout
 * @returns the workout as saved, with its totals
 * @throws ApiError: status 0 offline, 410 when it was deleted elsewhere
 */
export function sendSession(id: string, input: SessionInput): Promise<WorkoutSession> {
  return request<{ data: WorkoutSession }>(`/api/sessions/${id}`, { method: 'PUT', body: input }).then(answer => answer.data)
}
