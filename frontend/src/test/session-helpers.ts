/*
 * Test data for the workouts' pages: past workouts as the API sends them
 * (GET /api/sessions and /api/sessions/{id}), each changeable field by
 * field, as plan-helpers.ts does for plans.
 */
import type { SessionDetail, WorkoutSession } from '@/api/sessions'
import { testExercise } from './exercise-helpers'

/**
 * A finished workout of the list, with its totals: Day A of Push Pull Legs,
 * on Monday 9 November 2026 at 18:00 UTC, 45 minutes, 7 sets, 56 reps.
 */
export function testWorkoutSession(changes: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'session-1',
    plan_id: 'plan-ppl',
    plan_day_id: 'day-a',
    plan_name: 'Push Pull Legs',
    day_name: 'Day A – Push',
    started_at: '2026-11-09T18:00:00Z',
    finished_at: '2026-11-09T18:45:00Z',
    duration_seconds: 2700,
    feeling: null,
    notes: null,
    exercises_done: 2,
    sets_done: 7,
    reps_done: 56,
    volume_kg: '4480.000',
    ...changes,
  }
}

/**
 * A whole workout, with its exercises: the bench press (a warm-up of
 * 40 × 10, then 80 × 8 twice) and pull-ups skipped.
 */
export function testSessionDetail(changes: Partial<SessionDetail> = {}): SessionDetail {
  /** A set at 18:05, the values as given. */
  const set = (id: string, type: 'warm_up' | 'normal', weight: string | null, reps: number) => ({ id, set_type: type, weight_kg: weight, reps, duration_seconds: null, distance_meters: null, completed_at: '2026-11-09T18:05:00Z' })
  return {
    ...testWorkoutSession(),
    exercises: [
      { id: 'se-1', exercise_id: 12, plan_item_id: 'item-bench', superset_group: null, notes: null, exercise: testExercise({ id: 12, photos: [] }), sets: [set('ls-1', 'warm_up', '40.000', 10), set('ls-2', 'normal', '80.000', 8), set('ls-3', 'normal', '80.000', 8)] },
      { id: 'se-2', exercise_id: 31, plan_item_id: 'item-pullup', superset_group: null, notes: null, exercise: testExercise({ id: 31, name: 'Pullups', logging_type: 'reps', photos: [] }), sets: [] },
    ],
    ...changes,
  }
}
