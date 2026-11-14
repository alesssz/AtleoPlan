/*
 * A value that follows another once it has stopped changing for a moment:
 * typing "panca" sends one search, not five.
 *
 * While the two differ the change has not gone through yet: the search boxes
 * compare them to show their spinner from the first key, not only once the
 * request starts.
 */
import { useEffect, useState } from 'react'

/**
 * @example const search = useDebouncedValue(text, 300)
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
