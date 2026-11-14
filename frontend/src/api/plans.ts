/*
 * The workout plans' API. Saving always sends the whole plan, built by the
 * editor (src/components/plans/plan-draft.ts).
 *
 * A plan's own texts are the user's and never translated, so the list's key
 * has no language; a whole plan holds exercises named in the user's
 * language, so its key has one.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { exerciseKeys, type Exercise } from '@/api/exercises'
import { homeKeys } from '@/api/home'
import { request } from '@/lib/http'

/** backend app/Enums/SetType.php: shown as W, D and F beside the set's number. */
export type SetType = 'normal' | 'warm_up' | 'drop' | 'failure'

/** As sent by PlanSetResource. Decimals are exact text; null means no target. */
export interface PlanSet {
  set_type: SetType
  /** "8–10" is 8 and 10, "8" is 8 and 8. */
  target_reps_min: number | null
  target_reps_max: number | null
  /** Kilograms, "80.000". */
  target_weight_kg: string | null
  /** "8.5". */
  target_rpe: string | null
  target_duration_seconds: number | null
  target_distance_meters: number | null
}

export interface PlanItem {
  /** Kept across saves. */
  id: string
  exercise_id: number
  /** Items of a day with the same number form a superset. */
  superset_group: number | null
  /** null: the user's default. */
  rest_seconds: number | null
  notes: string | null
  /**
   * As fast as possible: the reps are fixed and the time taken is the result
   * (50 push-ups in 1:12). Only on an exercise logged by reps.
   */
  for_time: boolean
  /** Present also when the exercise was deleted since. */
  exercise: Exercise
  sets: PlanSet[]
}

export interface PlanDay {
  /** Kept across saves. */
  id: string
  name: string
  items: PlanItem[]
}

interface PlanFields {
  id: string
  name: string
  goal: string | null
  notes: string | null
  /** +1 on every save; the editor sends back the one it started from. */
  version: number
  is_active: boolean
  archived_at: string | null
  updated_at: string
}

export interface PlanSummary extends PlanFields {
  days_count: number
  /** The start of its latest finished workout; sent by the list only. */
  last_used_at?: string | null
}

export interface Plan extends PlanFields {
  days: PlanDay[]
}

/** `all` covers every list and every plan. */
export const planKeys = {
  all: ['plans'] as const,
  list: (archived: boolean) => ['plans', 'list', archived] as const,
  detail: (id: string, language: string) => ['plans', 'detail', id, language] as const,
}

/** A handful of plans: one answer, no pages. */
export function usePlans(archived: boolean) {
  return useQuery({
    queryKey: planKeys.list(archived),
    queryFn: ({ signal }) =>
      request<{ data: PlanSummary[] }>(archived ? '/api/plans?archived=1' : '/api/plans', { signal }).then(answer => answer.data),
  })
}

export function usePlan(id: string, language: string) {
  return useQuery({
    queryKey: planKeys.detail(id, language),
    queryFn: ({ signal }) => fetchPlan(id, signal),
  })
}

/** Also used on its own by Home's Start, which needs the plan only when tapped. */
export function fetchPlan(id: string, signal?: AbortSignal): Promise<Plan> {
  return request<{ data: Plan }>(`/api/plans/${id}`, { signal }).then(answer => answer.data)
}

/** Home too: its card and suggested day depend on the plans. */
function refreshPlans(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: planKeys.all }),
    queryClient.invalidateQueries({ queryKey: homeKeys.all }),
  ])
}

/** backend PlanRequest; weights in kilograms, at most three decimals. */
export interface PlanSetInput {
  set_type: SetType
  /** Both or neither. */
  target_reps_min: number | null
  target_reps_max: number | null
  target_weight_kg: number | null
  target_rpe: number | null
  target_duration_seconds: number | null
  target_distance_meters: number | null
}

export interface PlanItemInput {
  /** Kept from the plan, or made on the device for a new one. */
  id: string
  exercise_id: number
  superset_group: number | null
  rest_seconds: number | null
  notes: string | null
  /** false on an exercise not logged by reps. */
  for_time: boolean
  sets: PlanSetInput[]
}

export interface PlanDayInput {
  id: string
  name: string
  items: PlanItemInput[]
}

/**
 * The whole plan: each list's order is the rows' order, and whatever is left
 * out is deleted.
 */
export interface PlanInput {
  /** Made on the device for a new plan. */
  id: string
  /** On a save: the version the editor started from. */
  version?: number
  name: string
  goal: string | null
  notes: string | null
  days: PlanDayInput[]
}

export interface PlanSaved {
  plan: Plan
  /** Saved elsewhere since the editor opened it. */
  changedElsewhere: boolean
}

/** Idempotent: sent twice with the same id, the backend returns the saved plan. */
export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PlanInput): Promise<PlanSaved> =>
      request<{ data: Plan }>('/api/plans', { method: 'POST', body: input })
        .then(answer => ({ plan: answer.data, changedElsewhere: false })),
    onSuccess: () => refreshPlans(queryClient),
  })
}

/** The save goes through even when changed elsewhere; the app warns. */
export function useUpdatePlan(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PlanInput): Promise<PlanSaved> =>
      request<{ data: Plan, meta: { changed_elsewhere: boolean } }>(`/api/plans/${id}`, { method: 'PUT', body: input })
        .then(answer => ({ plan: answer.data, changedElsewhere: answer.meta.changed_elsewhere })),
    onSuccess: () => refreshPlans(queryClient),
  })
}

/**
 * The plan as a file's content (backend ExportPlan). `unknown`: the app only
 * saves it and sends it back on import, as it is.
 */
export function fetchPlanFile(id: string): Promise<unknown> {
  return request<unknown>(`/api/plans/${id}/export`)
}

export interface PlanImported {
  plan: Plan
  /** Exercises the file had and this server did not, created as the user's own. */
  createdExercises: string[]
}

/** The file's content as read; the backend validates it (ImportPlan). */
export function useImportPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: unknown): Promise<PlanImported> =>
      request<{ data: Plan, meta: { created_exercises: string[] } }>('/api/plans/import', { method: 'POST', body: file })
        .then(answer => ({ plan: answer.data, createdExercises: answer.meta.created_exercises })),
    onSuccess: async (imported) => {
      await refreshPlans(queryClient)
      if (imported.createdExercises.length > 0) await queryClient.invalidateQueries({ queryKey: exerciseKeys.all })
    },
  })
}

export type PlanAction = 'activate' | 'archive' | 'unarchive'

/**
 * One hook for the three actions: `action.variables` tells the page which
 * one is running. Every plan is read again, since activating one takes the
 * Active badge from another.
 */
export function usePlanAction(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: PlanAction) =>
      request<{ data: PlanSummary }>(`/api/plans/${id}/${action}`, { method: 'POST' }).then(answer => answer.data),
    onSuccess: () => refreshPlans(queryClient),
  })
}

/** For good: days, items and sets go too. */
export function useDeletePlan(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>(`/api/plans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // A prefix of every cached copy, in any language
      queryClient.removeQueries({ queryKey: ['plans', 'detail', id] })
      return refreshPlans(queryClient)
    },
  })
}
