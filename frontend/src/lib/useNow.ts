import { useEffect, useState } from 'react'

/**
 * The current moment, refreshed every `intervalMs`. A change of `key`
 * refreshes it at once: a moment just set by a tap (Start now on the
 * stopwatch) would otherwise be ahead of it until the next tick.
 */
export function useNow(intervalMs = 1000, key?: unknown): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [intervalMs, key])

  return now
}
