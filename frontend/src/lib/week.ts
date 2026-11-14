/*
 * The current week, for Home's "This week". Weeks start on Monday in every
 * language (ISO): a training week is Monday to Sunday.
 */

/**
 * Monday to Sunday of the week containing `date`, each at local midnight.
 */
export function getWeekDays(date: Date = new Date()): Date[] {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // Monday → 0 … Sunday → 6
  const sinceMonday = (day.getDay() + 6) % 7
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - sinceMonday)

  // Built from the calendar date rather than by adding 24 hours, which
  // daylight-saving changes would break
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
}

/** Time ignored. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Time ignored. */
export function isBeforeDay(day: Date, today: Date): boolean {
  return startOfDay(day).getTime() < startOfDay(today).getTime()
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * In the device's time zone: Home's "This week" counts the workouts with it.
 */
export function isInWeek(moment: Date, today: Date): boolean {
  const monday = getWeekDays(today)[0] ?? startOfDay(today)
  const next = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7)
  return moment.getTime() >= monday.getTime() && moment.getTime() < next.getTime()
}
