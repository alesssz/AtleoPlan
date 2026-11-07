/*
 * usePendingSessions: sends the finished workouts still waiting for the
 * network (src/lib/pending-sessions.ts) when the app opens, and every time
 * the browser says the network is back (the `online` event). Mounted once,
 * in the signed-in frame (RequireAuth), so it runs on every page.
 *
 * After a round that sent something, the cached lists that show workouts are
 * read again (Home, history).
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { sessionKeys } from '@/api/sessions'
import { sendPendingSessions } from './pending-sessions'

/**
 * Sends the waiting workouts now, and whenever the network comes back.
 * @param enabled false until the user is known: a visitor would only get 401s
 */
export function usePendingSessions(enabled: boolean): void {
  // TanStack Query's cache, to have workouts and Home read again
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    /** One round; a round that sent something refreshes the caches. */
    const send = () => {
      void sendPendingSessions().then((report) => {
        if (report.sent.length > 0) {
          void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
          void queryClient.invalidateQueries({ queryKey: ['home'] })
        }
      })
    }

    send()
    // `online`: the browser's event when the connection comes back
    window.addEventListener('online', send)
    return () => window.removeEventListener('online', send)
  }, [enabled, queryClient])
}
