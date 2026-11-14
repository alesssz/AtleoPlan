/*
 * Home's "This week" (week-summary.ts): only this week's workouts count,
 * by the device's clock, and a day with two workouts is marked once.
 */
import { describe, expect, it } from 'vitest'
import type { WorkoutSession } from '@/api/sessions'
import { weekSummary } from './week-summary'

/**
 * A finished workout with its totals, as GET /api/home sends it.
 * @param sets the sets done, warm-ups excluded
 */
function workout(started: Date, sets: number, seconds: number): WorkoutSession {
  return { id: `w-${started.getTime()}`, plan_id: null, day_name: null, started_at: started.toISOString(), finished_at: started.toISOString(), sets_done: sets, duration_seconds: seconds }
}

describe('weekSummary', () => {
  it('adds up this week\'s workouts and marks each day trained once', () => {
    // Thursday 5 November 2026; the week runs from Monday 2
    const today = new Date(2026, 10, 5, 18, 0)
    const summary = weekSummary([
      workout(new Date(2026, 10, 5, 7, 0), 10, 2700),
      workout(new Date(2026, 10, 3, 19, 0), 12, 3330),
      workout(new Date(2026, 10, 3, 8, 0), 4, 900),
      // Last Sunday: within the backend's 8 days, not in this week
      workout(new Date(2026, 10, 1, 10, 0), 15, 3600),
    ], today)

    expect(summary.workouts).toBe(3)
    expect(summary.sets).toBe(26)
    // 45 + 55.5 + 15 minutes, rounded once
    expect(summary.minutes).toBe(116)
    // Thursday and Tuesday, Tuesday once
    expect(summary.trainedDays.map(day => day.getDate())).toEqual([5, 3])
  })

  it('gives zeros for an empty week', () => {
    expect(weekSummary([], new Date())).toEqual({ workouts: 0, sets: 0, minutes: 0, trainedDays: [] })
  })
})
