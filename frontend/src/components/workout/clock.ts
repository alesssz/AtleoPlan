/*
 * Times as a clock shows them, for workout mode: "4:05", "32:15", "1:02:03".
 */

/**
 * A number of seconds as minutes and seconds, with the hours when there
 * are some: 245 → "4:05", 3723 → "1:02:03".
 * @param totalSeconds the seconds, 0 or more
 */
export function clock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const two = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds % 60)}` : `${minutes}:${two(seconds % 60)}`
}
