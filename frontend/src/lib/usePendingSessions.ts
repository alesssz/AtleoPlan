/*
 * Sends the queued workouts when the app opens, whenever the browser comes
 * back online, and every 30 seconds while they wait with a server that
 * answers. Mounted once, in RequireAuth, so it runs on every page.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useSyncState } from './useSyncState'
import { homeKeys } from '@/api/home'
import { sessionKeys } from '@/api/sessions'
import { sendPendingSessions } from './pending-sessions'

/**
 * Sends the queue now and, when something left it, marks history and Home
 * stale. For the rounds the user learns of only from ConnectionBanner: the
 * indicator's Send and Try again, the opening, the network's or the server's
 * return.
 */
export function useSendPending(): () => Promise<void> {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    const report = await sendPendingSessions({ announce: true })
    if (report.sent.length > 0) {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      void queryClient.invalidateQueries({ queryKey: homeKeys.all })
    }
  }, [queryClient])
}

/**
 * How often the queue is tried again while workouts wait with the network
 * and the server there: a round that met a server error (500) would wait
 * otherwise for the next opening. A refusal (4xx) is not retried: it would
 * fail the same way, and waits for a person.
 */
export const QUEUE_RETRY_INTERVAL_MS = 30_000

/**
 * @param owner the signed-in user's id, null until known: a visitor would
 *   only get 401s. Another user is another queue, sent at once
 */
export function usePendingSessions(owner: number | null): void {
  const enabled = owner !== null
  const sendPending = useSendPending()
  const state = useSyncState()
  const stuck = state.kind === 'pending' && !state.sending

  useEffect(() => {
    if (!enabled || !stuck) return
    const timer = window.setInterval(() => void sendPending(), QUEUE_RETRY_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [enabled, stuck, sendPending])

  useEffect(() => {
    if (!enabled) return

    const send = () => void sendPending()
    send()
    window.addEventListener('online', send)
    return () => window.removeEventListener('online', send)
  }, [enabled, owner, sendPending])
}
