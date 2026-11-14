/*
 * The current moment, refreshed on an interval: workout mode's clock and rest
 * timer.
 */
import { useEffect, useState } from 'react'

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
