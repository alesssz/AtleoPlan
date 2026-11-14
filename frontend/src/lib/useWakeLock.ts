/*
 * Keeps the screen on in workout mode: the phone lies on a bench and must not
 * lock between two sets. The browser drops the lock whenever the page is
 * hidden, so it is requested again when the page shows. Without the API (some
 * browsers, tests) the screen sleeps as usual.
 */
import { useEffect } from 'react'

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null

    /** A refusal (low battery, say) is not worth showing. */
    const request = () => {
      navigator.wakeLock.request('screen')
        .then((lock) => {
          sentinel = lock
        })
        .catch(() => {
          sentinel = null
        })
    }
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
