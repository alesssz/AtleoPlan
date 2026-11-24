import { describe, expect, it } from 'vitest'
import { spanOf } from '@/lib/calendar'
import { periodSummary } from './period-summary'

/** A finished workout as the calendar knows it. */
function workout(id: string, started: Date, seconds: number) {
  return { id, started_at: started.toISOString(), duration_seconds: seconds }
}

describe('periodSummary', () => {
  it('adds up the span\'s workouts and counts them by day', () => {
    // The week of Thursday 5 November 2026, from Monday 2
    const week = spanOf('week', new Date(2026, 10, 5, 18, 0))
    const summary = periodSummary([
      workout('a', new Date(2026, 10, 5, 7, 0), 2700),
      workout('b', new Date(2026, 10, 3, 19, 0), 3330),
      workout('c', new Date(2026, 10, 3, 8, 0), 900),
      // Last Sunday: in Home's 32 days, not in this week
      workout('d', new Date(2026, 10, 1, 10, 0), 3600),
      // In both answers
      workout('a', new Date(2026, 10, 5, 7, 0), 2700),
    ], week)

    // 45 + 55.5 + 15 minutes
    expect(summary).toMatchObject({ workouts: 3, seconds: 6930 })
    expect([...summary.days]).toEqual([['2026-11-05', 1], ['2026-11-03', 2]])
  })

  it('gives zeros for a span with no workouts', () => {
    expect(periodSummary([], spanOf('year', new Date()))).toEqual({ workouts: 0, seconds: 0, days: new Map() })
  })
})
