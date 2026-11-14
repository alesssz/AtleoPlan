/*
 * useNow: the current moment, updated every `intervalMs`, for what shows a
 * running time: workout mode's clock and rest timer
 * (docs/design/D1-ui.md D1.4.9).
 *
 * A custom hook: useState holds the moment,
 * an effect starts a timer that replaces it, and the effect's clean-up stops
 * the timer when the component leaves the page, or the interval changes.
 * Each new moment draws the component again.
 */
import { useEffect, useState } from 'react'

/**
 * The current moment, refreshed every `intervalMs` milliseconds.
 * @param intervalMs how often; 1000 for a clock in seconds
 * @returns a Date, new at every tick
 */
export function useNow(intervalMs = 1000): Date {
  // The function form: new Date() runs once, for the first value
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // setInterval(fn, ms): runs fn every ms milliseconds, until cleared
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    // The clean-up: React calls it when the component goes, or before the
    // effect runs again with another interval
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
