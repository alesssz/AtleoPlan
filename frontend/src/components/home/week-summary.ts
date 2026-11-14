/*
 * "This week" on Home, worked out from the recent workouts that GET /api/home
 * sends: which days were trained, and the week's three numbers: workouts, sets,
 * minutes.
 *
 * The backend sends the finished workouts of the last 8 days, not "this week":
 * a week starts at midnight on Monday *in the user's time zone*, which only the
 * device knows. So the app picks this week's workouts here, with the device's
 * clock.
 */
import type { WorkoutSession } from '@/api/sessions'
import { isInWeek, isSameDay } from '@/lib/week'

export interface WeekSummary {
  workouts: number
  /** Warm-ups excluded. */
  sets: number
  /** Pauses left out, in whole minutes. */
  minutes: number
  /** One entry per day trained. */
  trainedDays: Date[]
}

/**
 * Sums up this week's workouts.
 * @param sessions the recent workouts, with their totals (sets_done) and duration
 * @param today the current moment, which decides the week
 */
export function weekSummary(sessions: readonly WorkoutSession[], today: Date): WeekSummary {
  const thisWeek = sessions.filter(session => isInWeek(new Date(session.started_at), today))
  const trainedDays: Date[] = []
  for (const session of thisWeek) {
    const day = new Date(session.started_at)
    if (!trainedDays.some(known => isSameDay(known, day))) trainedDays.push(day)
  }
  return {
    workouts: thisWeek.length,
    sets: thisWeek.reduce((sum, session) => sum + (session.sets_done ?? 0), 0),
    // Rounded to the minute once, at the end
    minutes: Math.round(thisWeek.reduce((sum, session) => sum + (session.duration_seconds ?? 0), 0) / 60),
    trainedDays,
  }
}
