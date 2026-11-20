/*
 * Home's calendar: spans of a week, a month or a year in the device's time
 * zone, the days of a month as a grid, and a day written in an address. Days
 * are built from the calendar date, never by adding 24 hours, which daylight
 * saving changes would break.
 */
import { getWeekDays } from './week'

export type CalendarView = 'week' | 'month' | 'year'

/** A span of time: from its first moment, included, to the next span's, excluded. */
export interface Span {
  from: Date
  to: Date
}

/** A span either of whose ends may be open (null). */
export interface DateFilter {
  from: Date | null
  to: Date | null
}

/**
 * The week (Monday to Monday), month or year containing `date`, from local
 * midnight to local midnight.
 */
export function spanOf(view: CalendarView, date: Date): Span {
  if (view === 'week') {
    const monday = getWeekDays(date)[0]!
    return { from: monday, to: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7) }
  }
  if (view === 'month') {
    return { from: new Date(date.getFullYear(), date.getMonth(), 1), to: new Date(date.getFullYear(), date.getMonth() + 1, 1) }
  }
  return { from: new Date(date.getFullYear(), 0, 1), to: new Date(date.getFullYear() + 1, 0, 1) }
}

/**
 * The first day of the span `steps` weeks, months or years away: -1 is the
 * previous one. From the span's start, so 31 January moved by a month is
 * February, not 3 March.
 */
export function shiftSpan(view: CalendarView, date: Date, steps: number): Date {
  const { from } = spanOf(view, date)
  if (view === 'week') return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7 * steps)
  if (view === 'month') return new Date(from.getFullYear(), from.getMonth() + steps, 1)
  return new Date(from.getFullYear() + steps, 0, 1)
}

/** Whether a moment falls in the span. */
export function inSpan(moment: Date, span: Span): boolean {
  return moment.getTime() >= span.from.getTime() && moment.getTime() < span.to.getTime()
}

/**
 * The weeks of a month, Monday first, as rows of seven: the days before the
 * 1st and after the last are null, so each column stays a weekday.
 */
export function monthGrid(month: Date): (Date | null)[][] {
  const year = month.getFullYear()
  const index = month.getMonth()
  const days = new Date(year, index + 1, 0).getDate()
  // Monday → 0 … Sunday → 6
  const lead = (new Date(year, index, 1).getDay() + 6) % 7
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(year, index, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7))
}

/** A local day as `2026-11-19`, for an address: the day the user saw, not a UTC one. */
export function dayKey(date: Date): string {
  const two = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
}

/**
 * The local midnight of a `2026-11-19` from an address; null for anything
 * else, a day that does not exist (`2026-02-30`) included, since anyone can
 * type an address.
 */
export function parseDayKey(key: string | null): Date | null {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  const date = new Date(year, month, day)
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null
}

/** The day after, at local midnight: the end of a day's span. */
export function nextDay(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
}
