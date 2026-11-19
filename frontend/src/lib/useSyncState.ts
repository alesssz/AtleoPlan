import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { pendingSnapshot, subscribeToPending } from '@/components/workout/session-storage'
import { isServerReachable, subscribeToServer } from './http'
import { sendProgress, subscribeToSendProgress } from './pending-sessions'
import { syncState, type SyncState } from './sync-state'

const subscribeToOnline = onlineManager.subscribe.bind(onlineManager)

/** The network, the server, the queue and the sending, each followed as it changes. */
export function useSyncState(): SyncState {
  const online = useSyncExternalStore(subscribeToOnline, () => onlineManager.isOnline())
  const reachable = useSyncExternalStore(subscribeToServer, isServerReachable)
  const pending = useSyncExternalStore(subscribeToPending, pendingSnapshot)
  const progress = useSyncExternalStore(subscribeToSendProgress, sendProgress)
  return syncState(online, reachable, pending, progress)
}
