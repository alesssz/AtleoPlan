/*
 * Home's "This week" (week-summary.ts): only this week's workouts count,
 * by the device's clock, and a day with two workouts is marked once.
 */
import { describe, expect, it } from 'vitest'
import type { WorkoutSession } from '@/api/sessions'
import { weekSummary } from './week-summary'

/**
 * A finished workout with its totals, as GET /api/home sends it.
 * @param started when it started
 * @param sets the sets done, warm-ups excluded
 * @param volume the volume in kg, as exact text
 */
function workout(started: Date, sets: number, volume: string): WorkoutSession {
  return { id: `w-${started.getTime()}`, plan_id: null, day_name: null, started_at: started.toISOString(), finished_at: started.toISOString(), sets_done: sets, volume_kg: volume }
}

describe('weekSummary', () => {
  it('adds up this week\'s workouts and marks each day trained once', () => {
    // Thursday 5 November 2026; the week runs from Monday 2
    const today = new Date(2026, 10, 5, 18, 0)
    const summary = weekSummary([
      workout(new Date(2026, 10, 5, 7, 0), 10, '3200.000'),
      workout(new Date(2026, 10, 3, 19, 0), 12, '4100.500'),
      workout(new Date(2026, 10, 3, 8, 0), 4, '0.000'),
      // Last Sunday: within the backend's 8 days, not in this week
      workout(new Date(2026, 10, 1, 10, 0), 15, '5000.000'),
    ], today)

    expect(summary.workouts).toBe(3)
    expect(summary.sets).toBe(26)
    expect(summary.volumeKg).toBeCloseTo(7300.5)
    // Thursday and Tuesday, Tuesday once
    expect(summary.trainedDays.map(day => day.getDate())).toEqual([5, 3])
  })

  it('gives zeros for an empty week', () => {
    expect(weekSummary([], new Date())).toEqual({ workouts: 0, sets: 0, volumeKg: 0, trainedDays: [] })
  })
})
