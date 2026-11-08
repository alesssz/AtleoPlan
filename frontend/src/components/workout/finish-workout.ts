/*
 * Finishing a workout, in one place, for the two buttons that do it: Finish
 * in workout mode (WorkoutScreen) and Finish on the banner of a workout
 * left open (ResumeBanner, on Home and on the plan's page). The steps, in
 * order (docs/concepts/C1-frontend.md C1.17.5):
 *
 * 1. `finish` in the reducer: the clock stops, `finished_at` is set. A
 *    workout paused with ✕ is already stopped: the pause is not counted.
 * 2. The body goes in the queue first, then the workout in progress is
 *    forgotten: whatever happens next, the workout is on the phone.
 * 3. The queue is sent (src/lib/pending-sessions.ts).
 * 4. The lists of workouts and Home are marked stale.
 * 5. The finished workout is kept for its summary, with what happened to it.
 *
 * The caller then opens the summary, `/session/<id>/summary`.
 */
import type { QueryClient } from '@tanstack/react-query'
import { homeKeys } from '@/api/home'
import { sessionKeys } from '@/api/sessions'
import type { WeightUnit } from '@/lib/format'
import { sendPendingSessions } from '@/lib/pending-sessions'
import { addPending, storeActiveSession, storeFinished, type WorkoutOutcome } from './session-storage'
import { toSessionInput, workoutReducer, type ActiveSession } from './workout-session'

/**
 * Finishes a workout, queues it, tries to send it, keeps it for the summary.
 * @param session the workout in progress (or paused)
 * @param unit the user's weight unit, for the weights sent in kilograms
 * @param queryClient TanStack Query's cache, to mark the lists stale
 * @returns the workout's id, for the summary's address
 */
export async function finishWorkout(session: ActiveSession, unit: WeightUnit, queryClient: QueryClient): Promise<string> {
  // The finished workout and its body; queued first, so nothing is lost
  // whatever happens to the request
  const finished = workoutReducer(session, { type: 'finish', now: new Date().toISOString() })
  const input = toSessionInput(finished, unit, new Date())
  addPending(finished.id, input)
  storeActiveSession(null)
  // What happened to every queued workout, this one included
  const report = await sendPendingSessions()
  // The lists that show workouts are read again, and Home (the week, the
  // suggested day)
  void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
  void queryClient.invalidateQueries({ queryKey: homeKeys.all })
  // What happened to this workout, for the summary
  const outcome: WorkoutOutcome = report.sent.includes(finished.id)
    ? 'saved'
    : report.refused.some(entry => entry.id === finished.id) ? 'refused' : 'queued'
  // Kept on the phone for the summary, which needs no request (offline too)
  storeFinished({ id: finished.id, session: finished, input, outcome })
  return finished.id
}
