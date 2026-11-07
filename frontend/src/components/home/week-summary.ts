/*
 * "This week" on Home (docs/design/D1-ui.md D1.4.2), worked out from the
 * recent workouts that GET /api/home sends: which days were trained, and
 * the week's three numbers. Plain TypeScript, no React, tested on its own
 * (week-summary.test.ts).
 *
 * The backend sends the finished workouts of the last 8 days, not "this
 * week": a week starts at midnight on Monday *in the user's time zone*,
 * which only the device knows (docs/design/D3-data-model.md D3.2.5). So the
 * app picks this week's workouts here, with the device's clock.
 */
import type { WorkoutSession } from '@/api/sessions'
import { isInWeek, isSameDay } from '@/lib/week'

/** The week's workouts, summed up. */
export interface WeekSummary {
  /** Workouts finished this week. */
  workouts: number
  /** Their sets, warm-ups excluded. */
  sets: number
  /** Their volume, weight × reps, warm-ups excluded, in kilograms. */
  volumeKg: number
  /** The days with at least one workout, at most one entry per day. */
  trainedDays: Date[]
}

/**
 * Sums up this week's workouts.
 * @param sessions the recent workouts, with their totals (sets_done, volume_kg)
 * @param today the current moment, which decides the week
 */
export function weekSummary(sessions: readonly WorkoutSession[], today: Date): WeekSummary {
  // The workouts that started this week, by the device's clock
  const thisWeek = sessions.filter(session => isInWeek(new Date(session.started_at), today))
  // One date per day trained: two workouts on Tuesday mark Tuesday once
  const trainedDays: Date[] = []
  for (const session of thisWeek) {
    const day = new Date(session.started_at)
    if (!trainedDays.some(known => isSameDay(known, day))) trainedDays.push(day)
  }
  return {
    workouts: thisWeek.length,
    // reduce(): adds up, starting from 0. `?? 0`: a total the answer lacks
    sets: thisWeek.reduce((sum, session) => sum + (session.sets_done ?? 0), 0),
    // volume_kg is exact text ("640.000"); Number() reads it
    volumeKg: thisWeek.reduce((sum, session) => sum + Number(session.volume_kg ?? 0), 0),
    trainedDays,
  }
}
