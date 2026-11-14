/*
 * The workouts' API: sending a whole workout, last time's sets for workout
 * mode, and history.
 *
 * Sending is a plain function rather than a mutation hook: the queue of
 * workouts waiting for the network (src/lib/pending-sessions.ts) calls it
 * again later, outside any page.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Exercise } from '@/api/exercises'
import { homeKeys } from '@/api/home'
import type { SetType } from '@/api/plans'
import { request } from '@/lib/http'

/** As sent by LoggedSetResource. */
export interface LoggedSet {
  /** Made on the phone. */
  id: string
  /** What was really done. */
  set_type: SetType
  /** Kilograms, exact text: "80.000". */
  weight_kg: string | null
  reps: number | null
  duration_seconds: number | null
  distance_meters: number | null
  /** UTC. */
  completed_at: string
}

/** Weights in kilograms, as numbers. */
export interface LoggedSetInput {
  id: string
  set_type: SetType
  weight_kg: number | null
  reps: number | null
  duration_seconds: number | null
  distance_meters: number | null
  /** ISO 8601 with the device's offset, which keeps the exact moment. */
  completed_at: string
}

export interface SessionExerciseInput {
  id: string
  exercise_id: number
  /** null for an exercise added during the workout. */
  plan_item_id: string | null
  superset_group: number | null
  notes: string | null
  /** Empty for a skipped exercise. */
  sets: LoggedSetInput[]
}

/** PUT /api/sessions/{id}. */
export interface SessionInput {
  /** null for a free workout. */
  plan_id: string | null
  plan_day_id: string | null
  /** Copies of the names at the start. */
  plan_name: string | null
  day_name: string | null
  /** ISO 8601 with the device's offset. */
  started_at: string
  /** null while in progress. */
  finished_at: string | null
  /** The time actually trained, pauses left out. */
  duration_seconds: number | null
  /** The summary's 1–5. */
  feeling: number | null
  notes: string | null
  exercises: SessionExerciseInput[]
}

/** As sent by WorkoutSessionResource; the totals only when the query adds them. */
export interface WorkoutSession {
  id: string
  /** The plan followed, if it still exists. */
  plan_id: string | null
  plan_day_id?: string | null
  /** The names at the time. */
  plan_name?: string | null
  day_name: string | null
  started_at: string
  finished_at: string | null
  /** Pauses left out. */
  duration_seconds?: number | null
  feeling?: number | null
  notes?: string | null
  /** Exercises with at least one set. */
  exercises_done?: number
  /** Warm-ups excluded. */
  sets_done?: number
  /** Bodyweight sets included: the number the screens show. */
  reps_done?: number
  /**
   * Exact text in kilograms. Not shown: a workout's total adds up unlike
   * exercises (compare.ts).
   */
  volume_kg?: string
}

export interface SessionExercise {
  id: string
  exercise_id: number
  plan_item_id: string | null
  superset_group: number | null
  notes: string | null
  exercise: Exercise
  /** Empty for a skipped exercise. */
  sets: LoggedSet[]
}

export interface SessionDetail extends WorkoutSession {
  exercises: SessionExercise[]
}

export interface SessionWithLastSets {
  session: SessionDetail
  /**
   * For each exercise done before this workout, the previous time's sets;
   * the others left out (backend FindLastSets).
   */
  lastSets: LastSets[]
}

export interface SessionPage {
  /** Newest first, with totals. */
  data: WorkoutSession[]
  meta: { current_page: number, last_page: number, total: number }
}

/** The backend's default. */
export const SESSIONS_PER_PAGE = 20

/** One entry of GET /api/sessions/last-sets. */
export interface LastSets {
  exercise_id: number
  session_id: string
  started_at: string
  sets: LoggedSet[]
}

export const sessionKeys = {
  all: ['sessions'] as const,
  lastSets: (exerciseIds: number[]) => ['sessions', 'last-sets', exerciseIds] as const,
  list: ['sessions', 'list'] as const,
  /** With the exercises' names in this language. */
  detail: (id: string, language: string) => ['sessions', 'detail', id, language] as const,
}

/**
 * @param exerciseIds at most 50
 * @returns one entry per exercise done before; the others are left out
 */
export function fetchLastSets(exerciseIds: number[], signal?: AbortSignal): Promise<LastSets[]> {
  return request<{ data: LastSets[] }>(`/api/sessions/last-sets?exercises=${exerciseIds.join(',')}`, { signal })
    .then(answer => answer.data)
}

export function useLastSets(exerciseIds: number[]) {
  return useQuery({
    queryKey: sessionKeys.lastSets(exerciseIds),
    queryFn: ({ signal }) => fetchLastSets(exerciseIds, signal),
    enabled: exerciseIds.length > 0,
  })
}

/**
 * Created the first time and replaced afterwards, so sending again is safe.
 * @throws ApiError: status 0 offline, 410 when it was deleted elsewhere
 */
export function sendSession(id: string, input: SessionInput): Promise<WorkoutSession> {
  return request<{ data: WorkoutSession }>(`/api/sessions/${id}`, { method: 'PUT', body: input }).then(answer => answer.data)
}

/** History: finished workouts, newest first. No language in the key: no exercise names. */
export function useSessions() {
  return useInfiniteQuery({
    queryKey: sessionKeys.list,
    queryFn: ({ pageParam, signal }) =>
      request<SessionPage>(`/api/sessions?status=finished&page=${pageParam}&per_page=${SESSIONS_PER_PAGE}`, { signal }),
    initialPageParam: 1,
    getNextPageParam: last => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  })
}

export function fetchSession(id: string, signal?: AbortSignal): Promise<SessionWithLastSets> {
  return request<{ data: SessionDetail, meta: { last_sets: LastSets[] } }>(`/api/sessions/${id}`, { signal })
    .then(answer => ({ session: answer.data, lastSets: answer.meta.last_sets }))
}

export function useSession(id: string, language: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id, language),
    queryFn: ({ signal }) => fetchSession(id, signal),
  })
}

/**
 * A soft delete: a copy still waiting on another phone gets 410 and does not
 * bring it back.
 */
export function deleteSession(id: string): Promise<void> {
  return request<void>(`/api/sessions/${id}`, { method: 'DELETE' })
}

/** Home is read again too: the week and the suggested day depend on it. */
export function useDeleteSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteSession(id),
    onSuccess: () => {
      // A prefix of every cached copy, in any language
      queryClient.removeQueries({ queryKey: ['sessions', 'detail', id] })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
        queryClient.invalidateQueries({ queryKey: homeKeys.all }),
      ])
    },
  })
}
