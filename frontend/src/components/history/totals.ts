/*
 * The four numbers of a finished workout: time, exercises, sets and reps,
 * warm-ups excluded. Reps rather than volume, which adds up unlike exercises
 * and counts nothing done with the body alone.
 *
 * Two sources, one shape: the summary computes them from the body the phone
 * sent (inputTotals), offline; history reads the backend's
 * (WorkoutSession::withTotals()). Both count the same way, so a workout shows
 * the same numbers in both.
 */
import type { SessionInput, WorkoutSession } from '@/api/sessions'

export interface Totals {
  /** The time trained, pauses left out, in seconds; null when unknown. */
  durationSeconds: number | null
  exercises: number
  sets: number
  /** A timed or distance set adds 0. */
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

/** From a workout of GET /api/sessions or /api/sessions/{id}, with its totals. */
export function sessionTotals(session: WorkoutSession): Totals {
  return {
    durationSeconds: session.duration_seconds ?? null,
    exercises: session.exercises_done ?? 0,
    sets: session.sets_done ?? 0,
    reps: session.reps_done ?? 0,
  }
}
