/*
 * Finishing a workout, shared by workout mode and the resume banner. The caller
 * then opens `/session/<id>/summary`.
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
 * @returns the workout's id
 */
export async function finishWorkout(session: ActiveSession, unit: WeightUnit, queryClient: QueryClient): Promise<string> {
  // Queued before the workout in progress is forgotten, so nothing is lost
  // whatever happens to the request
  const finished = workoutReducer(session, { type: 'finish', now: new Date().toISOString() })
  const input = toSessionInput(finished, unit, new Date())
  addPending(finished.id, input)
  storeActiveSession(null)
  const report = await sendPendingSessions()
  // Home too: the week and the suggested day
  void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
  void queryClient.invalidateQueries({ queryKey: homeKeys.all })
  const outcome: WorkoutOutcome = report.sent.includes(finished.id)
    ? 'saved'
    : report.refused.some(entry => entry.id === finished.id) ? 'refused' : 'queued'
  // Kept on the device: the summary needs no request, offline too
  storeFinished({ id: finished.id, session: finished, input, outcome })
  return finished.id
}
