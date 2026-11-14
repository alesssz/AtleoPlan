/*
 * Sends the finished workouts still waiting for the network
 * (src/lib/pending-sessions.ts) when the app opens and whenever the browser
 * comes back online. Mounted once, in RequireAuth, so it runs on every page.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { homeKeys } from '@/api/home'
import { sessionKeys } from '@/api/sessions'
import { sendPendingSessions } from './pending-sessions'

/**
 * @param enabled false until the user is known: a visitor would only get 401s
 */
export function usePendingSessions(enabled: boolean): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const send = () => {
      void sendPendingSessions().then((report) => {
        if (report.sent.length > 0) {
          void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
          void queryClient.invalidateQueries({ queryKey: homeKeys.all })
        }
      })
    }

    send()
    window.addEventListener('online', send)
    return () => window.removeEventListener('online', send)
  }, [enabled, queryClient])
}
