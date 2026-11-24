/*
 * The workouts and the days trained of the span Home's calendar shows. The
 * workouts come from two answers that overlap: GET /api/home's recent ones,
 * which cover this month and this week, and GET /api/sessions/calendar for
 * any other span.
 */
import type { CalendarSession } from '@/api/sessions'
import { dayKey, inSpan, type Span } from '@/lib/calendar'

export interface PeriodSummary {
  workouts: number
  /** Time trained, pauses left out. */
  seconds: number
  /** Workouts per day trained, by dayKey(): days are the device's. */
  days: Map<string, number>
}

/**
 * @param sessions the workouts known, in any order; one in both answers counts once
 */
export function periodSummary(sessions: readonly Pick<CalendarSession, 'id' | 'started_at' | 'duration_seconds'>[], span: Span): PeriodSummary {
  const seen = new Set<string>()
  const days = new Map<string, number>()
  let seconds = 0
  for (const session of sessions) {
    const started = new Date(session.started_at)
    if (seen.has(session.id) || !inSpan(started, span)) continue
    seen.add(session.id)
    seconds += session.duration_seconds ?? 0
    const key = dayKey(started)
    days.set(key, (days.get(key) ?? 0) + 1)
  }
  return { workouts: seen.size, seconds, days }
}
