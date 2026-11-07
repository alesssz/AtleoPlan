/*
 * The workout plans' API (backend docs/concepts/C2-backend.md C2.5.5): the
 * list, one whole plan, and the actions on a plan (make it active, archive
 * it, bring it back, delete it). Like every file in src/api/: the types, the
 * cache keys, the functions that call the API and the hooks components use
 * (docs/concepts/C1-frontend.md C1.6, C1.15).
 *
 * Saving is always the whole plan, in one request: POST to create, PUT to
 * save again (C2.5.5). The plan editor builds the body
 * (src/components/plans/plan-draft.ts).
 *
 * Which keys carry the language: a plan's own texts (its name, its days'
 * names) are the user's, never translated, so the list's key has no
 * language. A whole plan holds its exercises, whose names arrive in the
 * user's language, so its key has one, as the library's keys do.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Exercise } from '@/api/exercises'
import { request } from '@/lib/http'

/**
 * The type of a planned set (backend app/Enums/SetType.php): a working set,
 * a warm-up ("W"), a drop set ("D"), a set to failure ("F").
 */
export type SetType = 'normal' | 'warm_up' | 'drop' | 'failure'

/** One planned set, as the backend's PlanSetResource sends it. */
export interface PlanSet {
  /** Its type. */
  set_type: SetType
  /** The fewest reps asked for; with the most, "8–10". null: no target. */
  target_reps_min: number | null
  /** The most reps asked for; the same as the fewest for "8". */
  target_reps_max: number | null
  /** The weight, in kilograms, as exact text: "80.000". null: no target. */
  target_weight_kg: string | null
  /** How hard it should feel, from 1 to 10, as text: "8.5". */
  target_rpe: string | null
  /** For an exercise logged by time, in seconds. */
  target_duration_seconds: number | null
  /** For an exercise logged by distance, in meters. */
  target_distance_meters: number | null
}

/** One exercise in a day of a plan, with its sets (PlanItemResource). */
export interface PlanItem {
  /** A UUID, the same across saves. */
  id: string
  /** The exercise's number, what the editor sends back. */
  exercise_id: number
  /** Items of a day with the same number form a superset; null: none. */
  superset_group: number | null
  /** The rest after each set, in seconds; null: the user's default. */
  rest_seconds: number | null
  /** The user's notes, such as "Shoulder blades back"; null for none. */
  notes: string | null
  /** The exercise, as the library sends it; there also when it was deleted since. */
  exercise: Exercise
  /** Its sets, in order, warm-ups included. */
  sets: PlanSet[]
}

/** One day of a plan (PlanDayResource). */
export interface PlanDay {
  /** A UUID, the same across saves. */
  id: string
  /** "Day A – Push". */
  name: string
  /** Its exercises, in order. */
  items: PlanItem[]
}

/** The fields every plan has, in the list and as a whole (PlanResource). */
interface PlanFields {
  /** A UUID, part of the address /plans/:id. */
  id: string
  /** "Push Pull Legs". */
  name: string
  /** "Hypertrophy"; null for none. */
  goal: string | null
  /** The user's notes; null for none. */
  notes: string | null
  /** Grows by 1 on every save; what the editor sends back (C2.5.5). */
  version: number
  /** Whether it is the user's active plan: the Active badge. */
  is_active: boolean
  /** When it was archived, as ISO 8601 text; null when it is in use. */
  archived_at: string | null
  /** When it last changed, as ISO 8601 text. */
  updated_at: string
}

/**
 * A plan in the list: its fields and how many days it has, not the days.
 * `extends`: every field of PlanFields, plus these.
 */
export interface PlanSummary extends PlanFields {
  /** How many days it has. */
  days_count: number
}

/** A whole plan, with its days, exercises and sets. */
export interface Plan extends PlanFields {
  /** Its days, in order. */
  days: PlanDay[]
}

/**
 * The cache keys of the plans, from general to specific. Refreshing
 * `planKeys.all` refreshes every list and every plan.
 */
export const planKeys = {
  /** Everything about plans. */
  all: ['plans'] as const,
  /**
   * One list: the plans in use, or the archived ones.
   * @param archived true for the archived ones
   */
  list: (archived: boolean) => ['plans', 'list', archived] as const,
  /**
   * One whole plan, with its exercises in this language.
   * @param id the plan's UUID
   * @param language the interface's language
   */
  detail: (id: string, language: string) => ['plans', 'detail', id, language] as const,
}

/**
 * Hook: the user's plans, the active one first. The list is short (a user
 * has a handful of plans), so it comes in one answer, with no pages.
 * @param archived true for the archived plans, false for those in use
 * @example const plans = usePlans(false)
 */
export function usePlans(archived: boolean) {
  return useQuery({
    queryKey: planKeys.list(archived),
    // `?archived=1` only when asked: the plain list is plain /api/plans.
    // Laravel wraps the list in `data`; `.then()` takes it out
    queryFn: ({ signal }) =>
      request<{ data: PlanSummary[] }>(archived ? '/api/plans?archived=1' : '/api/plans', { signal }).then(answer => answer.data),
  })
}

/**
 * Hook: one whole plan, for its page and for the editor.
 * @param id the plan's UUID, from the address
 * @param language the interface's language, part of the key
 */
export function usePlan(id: string, language: string) {
  return useQuery({
    queryKey: planKeys.detail(id, language),
    queryFn: ({ signal }) => request<{ data: Plan }>(`/api/plans/${id}`, { signal }).then(answer => answer.data),
  })
}

/** One set, as the editor sends it (backend PlanRequest); weights in kilograms. */
export interface PlanSetInput {
  /** Its type; required. */
  set_type: SetType
  /** The fewest reps; with the most, both or neither. */
  target_reps_min: number | null
  /** The most reps, at least the fewest. */
  target_reps_max: number | null
  /** Kilograms, at most three decimals. */
  target_weight_kg: number | null
  /** From 1 to 10, at most one decimal. */
  target_rpe: number | null
  /** Seconds, for an exercise logged by time. */
  target_duration_seconds: number | null
  /** Meters, for an exercise logged by distance. */
  target_distance_meters: number | null
}

/** One exercise of a day, as the editor sends it. */
export interface PlanItemInput {
  /** Its UUID: kept from the plan, or made on the device for a new one. */
  id: string
  /** A public exercise or one of the user's own. */
  exercise_id: number
  /** The superset's number; null when not in one. */
  superset_group: number | null
  /** Seconds; null for the user's default. */
  rest_seconds: number | null
  /** Up to 500 characters; null for none. */
  notes: string | null
  /** The sets, in order; at most 20. */
  sets: PlanSetInput[]
}

/** One day, as the editor sends it. */
export interface PlanDayInput {
  /** Its UUID. */
  id: string
  /** Required, up to 50 characters. */
  name: string
  /** The exercises, in order; at most 30. */
  items: PlanItemInput[]
}

/**
 * The whole plan, as POST and PUT /api/plans expect it: the order of each
 * list is the order of the rows, and what is left out is deleted.
 */
export interface PlanInput {
  /** The plan's UUID, made on the device for a new plan. */
  id: string
  /** On a save: the version the editor started from; left out on a create. */
  version?: number
  /** Required, up to 100 characters. */
  name: string
  /** Up to 100 characters; null for none. */
  goal: string | null
  /** Up to 2000 characters; null for none. */
  notes: string | null
  /** The days, in order; at most 14. */
  days: PlanDayInput[]
}

/** What saving a plan answers: the plan as saved, and on a PUT a warning. */
export interface PlanSaved {
  /** The plan as it is now on the server. */
  plan: Plan
  /** True when someone saved it elsewhere since the editor opened it (D3.5.7). */
  changedElsewhere: boolean
}

/**
 * Hook: creates a whole plan (POST /api/plans). Sent twice with the same id,
 * the backend answers with the plan already saved, so a retry is safe.
 * Afterwards every list is read again.
 * @example const create = useCreatePlan(); await create.mutateAsync(input)
 */
export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PlanInput): Promise<PlanSaved> =>
      request<{ data: Plan }>('/api/plans', { method: 'POST', body: input })
        .then(answer => ({ plan: answer.data, changedElsewhere: false })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  })
}

/**
 * Hook: saves a whole plan again (PUT /api/plans/{id}). The answer's `meta`
 * says whether it had been saved elsewhere meanwhile: the save went through
 * anyway, and the app warns.
 * @param id the plan's UUID
 */
export function useUpdatePlan(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PlanInput): Promise<PlanSaved> =>
      request<{ data: Plan, meta: { changed_elsewhere: boolean } }>(`/api/plans/${id}`, { method: 'PUT', body: input })
        .then(answer => ({ plan: answer.data, changedElsewhere: answer.meta.changed_elsewhere })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  })
}

/**
 * The three actions that are a POST to the plan's address plus a verb
 * (backend PlanController): make it the active plan, archive it, bring it
 * back. A union type: only these three strings are accepted.
 */
export type PlanAction = 'activate' | 'archive' | 'unarchive'

/**
 * Hook: runs one of the actions on a plan. Afterwards every list and every
 * plan is read again, not only this one: making a plan active also takes the
 * Active badge away from the one before.
 *
 * One hook for three actions, since they differ only in the verb:
 * `action.mutate('archive')`. `action.variables` then tells which one is
 * running, so the page can show it on the right button.
 *
 * @param id the plan's UUID
 * @example const action = usePlanAction(plan.id); action.mutate('activate')
 */
export function usePlanAction(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: PlanAction) =>
      request<{ data: PlanSummary }>(`/api/plans/${id}/${action}`, { method: 'POST' }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  })
}

/**
 * Hook: deletes a plan, for good (DELETE /api/plans/{id}; its days,
 * exercises and sets go too). Its cached copies are removed, so nothing
 * shows it again, and the lists are read again.
 * @param id the plan's UUID
 */
export function useDeletePlan(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>(`/api/plans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Every cached copy of this plan, in any language: the key
      // ['plans', 'detail', id] is a prefix of each of them
      queryClient.removeQueries({ queryKey: ['plans', 'detail', id] })
      return queryClient.invalidateQueries({ queryKey: planKeys.all })
    },
  })
}
