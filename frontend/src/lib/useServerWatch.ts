/*
 * While the network is there but the server does not answer, asks it again
 * now and then: nothing else would notice its return, since the browser
 * fires no `online` event. Back, it sends the queue and reads the screens'
 * data again. Mounted once, in RequireAuth.
 */
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { fetchHealth } from '@/api/health'
import { isServerReachable, subscribeToServer } from './http'
import { useSendPending } from './usePendingSessions'

/** Often enough to clear the banner soon after, rarely enough to cost nothing. */
export const SERVER_CHECK_INTERVAL_MS = 10_000

const subscribeToOnline = onlineManager.subscribe.bind(onlineManager)

export function useServerWatch(): void {
  const queryClient = useQueryClient()
  const sendPending = useSendPending()
  const online = useSyncExternalStore(subscribeToOnline, () => onlineManager.isOnline())
  const reachable = useSyncExternalStore(subscribeToServer, isServerReachable)
  const wasReachable = useRef(reachable)

  useEffect(() => {
    // Offline, the browser's online event takes over
    if (reachable || !online) return
    const timer = window.setInterval(() => void fetchHealth().catch(() => {}), SERVER_CHECK_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [reachable, online])

  useEffect(() => {
    if (reachable && !wasReachable.current) {
      void sendPending()
      void queryClient.invalidateQueries()
    }
    wasReachable.current = reachable
  }, [reachable, sendPending, queryClient])
}
