/*
 * Times as a clock shows them, for workout mode: "4:05", "32:15", "1:02:03".
 * A plain function, tested in workout-session.test.ts.
 */

/**
 * A number of seconds as minutes and seconds, with the hours when there
 * are some: 245 → "4:05", 3723 → "1:02:03".
 * @param totalSeconds the seconds, 0 or more
 */
export function clock(totalSeconds: number): string {
  // Whole seconds, never below 0
  const seconds = Math.max(0, Math.floor(totalSeconds))
  // The full hours, then the full minutes left over (% is the remainder)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  // padStart(2, '0'): "5" becomes "05"
  const two = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds % 60)}` : `${minutes}:${two(seconds % 60)}`
}
