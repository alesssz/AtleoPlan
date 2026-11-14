/*
 * The four numbers of a finished workout: time trained, exercises done, sets
 * and reps, warm-up sets excluded from the last two.
 *
 * Reps, not volume (weight × reps): a workout's volume adds up unlike
 * exercises and counts nothing done with the body alone, so it is not a
 * workout's number any more; the comparison exercise by exercise is in
 * compare.ts. Reps count every set that counts, the body alone included.
 *
 * Two sources, one shape:
 * - **the summary** works them out from the body the phone sent
 *   (`inputTotals`): it needs no request, so it works offline, right after
 *   Finish;
 * - **history** reads them from the backend, which sums them in the
 *   database (`sessionTotals`; backend WorkoutSession::withTotals()).
 * Both count the same way, so a workout shows the same numbers in both.
 */
import type { SessionInput, WorkoutSession } from '@/api/sessions'

export interface Totals {
  /** The time trained, pauses left out, in seconds; null when unknown. */
  durationSeconds: number | null
  exercises: number
  sets: number
  /** Their reps; a timed or distance set adds 0. */
  reps: number
}

/**
 * The numbers of a workout from the body sent at Finish.
 * @param input the body of PUT /api/sessions/{id}: only ticked sets
 */
export function inputTotals(input: SessionInput): Totals {
  const counted = input.exercises.flatMap(exercise => exercise.sets).filter(set => set.set_type !== 'warm_up')
  return {
    durationSeconds: input.duration_seconds,
    exercises: input.exercises.filter(exercise => exercise.sets.length > 0).length,
    sets: counted.length,
    reps: counted.reduce((sum, set) => sum + (set.reps ?? 0), 0),
  }
}

/**
 * The numbers of a workout as the backend sends them, with its totals.
 * @param session a workout of GET /api/sessions or /api/sessions/{id}
 */
export function sessionTotals(session: WorkoutSession): Totals {
  return {
    durationSeconds: session.duration_seconds ?? null,
    exercises: session.exercises_done ?? 0,
    sets: session.sets_done ?? 0,
    reps: session.reps_done ?? 0,
  }
}
