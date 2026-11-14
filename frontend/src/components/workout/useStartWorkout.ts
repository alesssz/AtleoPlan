/*
 * useStartWorkout: the one way a workout starts, shared by the plan's page
 * (Start this day) and Home (Start, and Free workout). It builds the workout on
 * the phone (workout-session.ts), keeps it there (session-storage.ts) and opens
 * workout mode at /session/:id.
 *
 * Starting a plan's day:
 * 1. the whole plan, which Home does not have (its answer lists the days
 *    without their exercises): read from TanStack Query's cache when it is
 *    there, from the API otherwise (queryClient.fetchQuery);
 * 2. last time's sets of the day's exercises; offline, an empty list, and
 *    the workout starts with the plan's targets alone;
 * 3. startSession(), stored, opened.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { fetchPlan, planKeys, type Plan, type PlanDay } from '@/api/plans'
import { fetchLastSets } from '@/api/sessions'
import { storeActiveSession } from './session-storage'
import { startFreeSession, startSession, type ActiveSession } from './workout-session'

/**
 * The user's rest when an exercise sets none and the user is not loaded
 * yet: the backend's own default (users.default_rest_seconds).
 */
export const FALLBACK_REST_SECONDS = 90

export interface StartWorkout {
  /** True from the tap until workout mode opens. */
  starting: boolean
  /** True when the plan could not be read (offline, never opened before). */
  failed: boolean
  /**
   * Starts a day of a plan already loaded (the plan's page).
   */
  startDay: (plan: Plan, day: PlanDay) => Promise<void>
  /**
   * Starts a day of a plan known by its id only (Home): reads the plan first.
   */
  startPlanDay: (planId: string, dayId: string) => Promise<void>
  /** Starts a workout with no plan and no exercises yet (Home's Free workout). */
  startFree: () => void
}

/** The steps that start a workout, and whether they are running. */
export function useStartWorkout(): StartWorkout {
  // i18n.language: the language of the exercises' names and of the numbers
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  // TanStack Query's cache, for the plan Home does not have
  const queryClient = useQueryClient()
  // Already cached: RequireAuth asked before any page opened
  const { data: user } = useCurrentUser()
  const [starting, setStarting] = useState(false)
  const [failed, setFailed] = useState(false)
  const unit = user?.weight_unit ?? 'kg'
  const defaultRestSeconds = user?.default_rest_seconds ?? FALLBACK_REST_SECONDS

  /**
   * Keeps the new workout on the phone and opens it.
   */
  function open(session: ActiveSession) {
    storeActiveSession(session)
    void navigate(`/session/${session.id}`)
  }

  async function startDay(plan: Plan, day: PlanDay) {
    setStarting(true)
    // Last time's sets; an empty list when they cannot be read (offline)
    const lastSets = await fetchLastSets(day.items.map(item => item.exercise_id)).catch(() => [])
    open(startSession(plan, day, { unit, defaultRestSeconds, lastSets, language: i18n.language, now: new Date() }))
  }

  async function startPlanDay(planId: string, dayId: string) {
    setStarting(true)
    setFailed(false)
    try {
      // The cached plan when fresh, else a request whose answer the plan's
      // page reuses: same key and function as usePlan()
      const plan = await queryClient.fetchQuery({
        queryKey: planKeys.detail(planId, i18n.language),
        queryFn: ({ signal }) => fetchPlan(planId, signal),
      })
      // The day, found in the plan; it may have been deleted on another device
      const day = plan.days.find(candidate => candidate.id === dayId)
      if (!day) throw new Error('day not found')
      await startDay(plan, day)
    }
    catch {
      // No plan, no workout: say so, and let the user try again
      setStarting(false)
      setFailed(true)
    }
  }

  function startFree() {
    open(startFreeSession(new Date()))
  }

  return { starting, failed, startDay, startPlanDay, startFree }
}
