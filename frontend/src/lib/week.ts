/*
 * The days of the current week, for Home's "This week" strip
 * (docs/01-ui-design.md 1.4.2). Plain TypeScript, no React, so it can be
 * tested on its own (src/lib/week.test.ts).
 *
 * Weeks start on Monday, as in Italy, Spain and Germany (and in the ISO
 * standard), for every language: a training week is Monday to Sunday.
 */

/**
 * The seven days, Monday to Sunday, of the week that contains `date`.
 * Each is a Date at midnight (local time), so comparing days is simple.
 * @param date any moment of the week; today when left out
 * @returns seven dates, Monday first
 */
export function getWeekDays(date: Date = new Date()): Date[] {
  // The same day at midnight: `new Date(y, m, d)` builds a local date
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // getDay() numbers the days from Sunday = 0 to Saturday = 6. How many days
  // back Monday is: Monday → 0, Tuesday → 1 … Sunday → 6. The `% 7` maps
  // Sunday's (0 + 6) correctly and keeps the others in 0–6.
  const sinceMonday = (day.getDay() + 6) % 7
  // Monday of this week
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - sinceMonday)

  // Array.from({ length: 7 }, fn) builds an array of 7 items, calling fn
  // with each index (0 to 6); `_` names the item argument we do not need.
  // Each day is built from Monday's year/month/day + i: the Date
  // constructor rolls over months and years by itself (31 + 1 → the 1st),
  // and unlike adding i × 24 hours it is not fooled by daylight-saving changes.
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
}

/**
 * True when two dates fall on the same calendar day (time ignored).
 * @param a a date
 * @param b another date
 */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * True when `day` is before `today`'s calendar day.
 * @param day the day to check
 * @param today the reference day
 */
export function isBeforeDay(day: Date, today: Date): boolean {
  // Both moved to midnight of their day, then compared as numbers
  // (getTime(): milliseconds since 1970), so the time of day never matters
  return startOfDay(day).getTime() < startOfDay(today).getTime()
}

/** The same calendar day at midnight, local time. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
