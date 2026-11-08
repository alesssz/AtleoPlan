/*
 * A workout's numbers (totals.ts): the summary's, from the body sent at
 * Finish, and history's, from the backend, counted the same way: reps, the
 * body alone included.
 */
import { describe, expect, it } from 'vitest'
import type { LoggedSetInput, SessionInput } from '@/api/sessions'
import { inputTotals, sessionTotals } from './totals'

/**
 * A set as the phone sends it.
 * @param changes the fields to change
 */
function set(changes: Partial<LoggedSetInput>): LoggedSetInput {
  return { id: 's', set_type: 'normal', weight_kg: 80, reps: 8, duration_seconds: null, distance_meters: null, completed_at: '2026-11-09T18:00:00Z', ...changes }
}

/** A body: the bench press with a warm-up and two sets, pull-ups with the body alone, and a skipped exercise. */
const body: SessionInput = {
  plan_id: null,
  plan_day_id: null,
  plan_name: null,
  day_name: null,
  started_at: '2026-11-09T18:00:00Z',
  finished_at: '2026-11-09T18:45:00Z',
  duration_seconds: 2580,
  feeling: null,
  notes: null,
  exercises: [
    { id: 'e1', exercise_id: 12, plan_item_id: null, superset_group: null, notes: null, sets: [set({ set_type: 'warm_up', weight_kg: 40, reps: 10 }), set({}), set({ reps: 6 })] },
    { id: 'e2', exercise_id: 31, plan_item_id: null, superset_group: null, notes: null, sets: [set({ weight_kg: null, reps: 10 })] },
    { id: 'e3', exercise_id: 30, plan_item_id: null, superset_group: null, notes: null, sets: [] },
  ],
}

describe('inputTotals', () => {
  it('counts the exercises done, the sets and the reps, the body alone included, warm-ups left out', () => {
    // 8 + 6 of the bench press, 10 pull-ups; the warm-up's 10 left out
    expect(inputTotals(body)).toEqual({ durationSeconds: 2580, exercises: 2, sets: 3, reps: 24 })
  })
})

describe('sessionTotals', () => {
  it('reads the backend\'s totals', () => {
    const session = { id: 'w', plan_id: null, day_name: null, started_at: '', finished_at: '', duration_seconds: 2580, exercises_done: 2, sets_done: 3, reps_done: 24, volume_kg: '1120.000' }

    expect(sessionTotals(session)).toEqual({ durationSeconds: 2580, exercises: 2, sets: 3, reps: 24 })
  })
})
