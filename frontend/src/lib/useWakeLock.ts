/*
 * useWakeLock: keeps the screen on while a component is on the page and
 * `active` is true, for workout mode: the phone lies on a bench, and it must
 * not lock between two sets (docs/design/D1-ui.md D1.4.9).
 *
 * The browser's Screen Wake Lock API: navigator.wakeLock.request('screen')
 * returns a "sentinel"; releasing it lets the screen sleep again. The browser
 * drops the lock by itself when the page is hidden (another app, the phone
 * locked by hand), so it is asked for again when the page shows again
 * (`visibilitychange`). Browsers without the API, and tests, simply get no
 * lock: the screen sleeps as usual, and nothing breaks.
 */
import { useEffect } from 'react'

/**
 * Keeps the screen on while `active` is true.
 * @param active whether to hold the lock
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    // `'wakeLock' in navigator`: whether the browser has the API at all
    if (!active || !('wakeLock' in navigator)) return
    // The lock held now; null when none
    let sentinel: WakeLockSentinel | null = null

    /** Asks for the lock; a refusal (low battery, say) is not an error worth showing. */
    const request = () => {
      navigator.wakeLock.request('screen')
        .then((lock) => {
          sentinel = lock
        })
        .catch(() => {
          sentinel = null
        })
    }
    /** The page shows again: the lock was dropped, ask again. */
    const onVisible = () => {
      if (document.visibilityState === 'visible') request()
    }

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [active])
}
