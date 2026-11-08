/*
 * The workouts' API (backend docs/concepts/C2-backend.md C2.5.7): sending a
 * whole workout, the sets of last time for workout mode's "Last" column, and
 * history: the list of past workouts, one workout with last time for each of
 * its exercises, deleting (docs/concepts/C1-frontend.md C1.19).
 * Like every file in src/api/: the types, the keys and the functions
 * (docs/concepts/C1-frontend.md C1.6, C1.17).
 *
 * Sending is a plain function, not a mutation hook: it is called by the
 * workout screen when the user taps Done, and again later by the queue of
 * workouts waiting for the network (src/lib/pending-sessions.ts), which runs
 * outside any page.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Exercise } from '@/api/exercises'
import { homeKeys } from '@/api/home'
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
  /** The day followed, if it still exists; null for a free workout. */
  plan_day_id?: string | null
  /** The plan's name at the time; null for a free workout. */
  plan_name?: string | null
  /** The day's name at the time. */
  day_name: string | null
  /** When it started. */
  started_at: string
  /** When it was finished; null while in progress. */
  finished_at: string | null
  /** The time trained, pauses left out, in seconds. */
  duration_seconds?: number | null
  /** How it felt, 1 to 5, chosen in the summary; null when not said. */
  feeling?: number | null
  /** The user's notes; null for none. */
  notes?: string | null
  /** Exercises with at least one set done, when the answer has totals. */
  exercises_done?: number
  /** Sets done, warm-ups excluded. */
  sets_done?: number
  /** Their reps, the body alone included: the number the screens show. */
  reps_done?: number
  /**
   * Weight × reps, warm-ups excluded, in kilograms, as exact text. Not
   * shown: a workout's total adds up unlike exercises (compare.ts).
   */
  volume_kg?: string
}

/** One exercise of a past workout, as SessionExerciseResource sends it. */
export interface SessionExercise {
  /** Its UUID. */
  id: string
  /** The exercise done. */
  exercise_id: number
  /** The plan's slot it filled; null for one added on the way. */
  plan_item_id: string | null
  /** Its superset's number, copied from the plan. */
  superset_group: number | null
  /** Notes; null for none. */
  notes: string | null
  /** The exercise, as the library sends it: name, photos, logging type. */
  exercise: Exercise
  /** Its sets, in order; empty for an exercise skipped. */
  sets: LoggedSet[]
}

/** One whole past workout (GET /api/sessions/{id}): its fields, totals and exercises. */
export interface SessionDetail extends WorkoutSession {
  /** Its exercises, in order. */
  exercises: SessionExercise[]
}

/** What GET /api/sessions/{id} answers: the workout, and last time for each of its exercises. */
export interface SessionWithLastSets {
  /** The workout. */
  session: SessionDetail
  /**
   * For each of its exercises done before it, the sets of the last workout
   * before it with that exercise; the others left out (backend FindLastSets).
   */
  lastSets: LastSets[]
}

/** One page of GET /api/sessions, as Laravel paginates it. */
export interface SessionPage {
  /** The page's workouts, newest first, with their totals. */
  data: WorkoutSession[]
  /** Where the page sits. */
  meta: { current_page: number, last_page: number, total: number }
}

/** How many workouts a page of history holds: the backend's default. */
export const SESSIONS_PER_PAGE = 20

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
  /** The finished workouts, page after page (history). */
  list: ['sessions', 'list'] as const,
  /**
   * One whole workout, with its exercises' names in this language.
   * @param id the workout's UUID
   * @param language the interface's language
   */
  detail: (id: string, language: string) => ['sessions', 'detail', id, language] as const,
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

/**
 * Hook: the finished workouts, newest first, one page of 20 at a time, for
 * history. Same pattern as the exercise library's list (useInfiniteQuery,
 * src/api/exercises.ts): `fetchNextPage()` asks for the next page. The
 * language is not in the key: a page holds no exercise names.
 * @example const list = useSessions()
 */
export function useSessions() {
  return useInfiniteQuery({
    queryKey: sessionKeys.list,
    queryFn: ({ pageParam, signal }) =>
      request<SessionPage>(`/api/sessions?status=finished&page=${pageParam}&per_page=${SESSIONS_PER_PAGE}`, { signal }),
    initialPageParam: 1,
    // The next page's number, or undefined after the last: no more pages
    getNextPageParam: last => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  })
}

/**
 * Reads one whole workout and last time for each of its exercises.
 * @param id the workout's UUID
 * @param signal optional cancel signal
 */
export function fetchSession(id: string, signal?: AbortSignal): Promise<SessionWithLastSets> {
  return request<{ data: SessionDetail, meta: { last_sets: LastSets[] } }>(`/api/sessions/${id}`, { signal })
    .then(answer => ({ session: answer.data, lastSets: answer.meta.last_sets }))
}

/**
 * Hook: one whole workout, for its page in history. The exercises' names
 * come in the request's language, so the language is part of the key.
 * @param id the workout's UUID
 * @param language the interface's language
 */
export function useSession(id: string, language: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id, language),
    queryFn: ({ signal }) => fetchSession(id, signal),
  })
}

/**
 * Deletes a workout (DELETE /api/sessions/{id}). The backend keeps a marker
 * (a soft delete), so a copy still waiting on another phone does not bring
 * it back: that send gets 410 Gone (C2.5.7).
 * @param id the workout's UUID
 */
export function deleteSession(id: string): Promise<void> {
  return request<void>(`/api/sessions/${id}`, { method: 'DELETE' })
}

/**
 * Hook: deletes a workout from its page in history. Afterwards the lists of
 * workouts and Home (the week, the suggested day) are read again, and the
 * workout's cached copies are removed, so nothing shows it again.
 * @param id the workout's UUID
 */
export function useDeleteSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteSession(id),
    onSuccess: () => {
      // Every cached copy of this workout, in any language: the key
      // ['sessions', 'detail', id] is a prefix of each of them
      queryClient.removeQueries({ queryKey: ['sessions', 'detail', id] })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
        queryClient.invalidateQueries({ queryKey: homeKeys.all }),
      ])
    },
  })
}
