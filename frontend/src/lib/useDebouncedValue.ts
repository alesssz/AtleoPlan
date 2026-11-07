/*
 * useDebouncedValue(): a value that follows another one, but only once it has
 * stopped changing for a moment. The library's search uses it, so that typing
 * "panca" sends one request, not five (src/pages/ExercisesPage.tsx).
 * docs/concepts/C1-frontend.md C1.14.
 *
 * A hook of our own (what a hook is: src/theme/useTheme.ts): it keeps its own
 * state and an effect, like a small component without anything to draw.
 */
import { useEffect, useState } from 'react'

/**
 * The value, late by `delayMs` milliseconds after its last change.
 *
 * Each change of `value` starts a timer; the cleanup of the effect cancels
 * the previous one, so only the last timer of a burst of changes fires, and
 * sets the state. `<T>` makes it generic: it works for any type of value, and
 * returns the same type it receives.
 *
 * @param value the value that changes, such as the text of a search box
 * @param delayMs how long it must stay the same, in milliseconds
 * @returns the value as it was when it last stayed still for `delayMs`
 * @example const search = useDebouncedValue(text, 300)
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  // The value given out; it starts as the first one, with no delay
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    // Setting state inside the timer's callback, not in the effect's body,
    // is what effects are for: reacting to the outside world, here time
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
