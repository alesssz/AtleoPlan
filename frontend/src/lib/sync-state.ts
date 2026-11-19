/*
 * What SyncIndicator shows (D1.6): nothing, offline, the server unreachable,
 * changes waiting, or workouts the server refused. Today the changes are the finished workouts'
 * queue (pending-sessions.ts).
 */
import type { SessionInput } from '@/api/sessions'
import type { SendProgress } from './pending-sessions'

/** A workout waiting in the queue, for the list behind the indicator. */
export interface QueuedWorkout {
  id: string
  input: SessionInput
}

export interface RefusedWorkout {
  id: string
  /** The HTTP status of the refusal. */
  status: number
  /** Its body, for its name and date. */
  input: SessionInput
}

export type SyncState
  = | { kind: 'synced' }
    | { kind: 'offline', waiting: number, queued: QueuedWorkout[] }
    | { kind: 'unreachable', waiting: number, queued: QueuedWorkout[] }
    | { kind: 'pending', waiting: number, queued: QueuedWorkout[], sending: boolean }
    | { kind: 'refused', workouts: RefusedWorkout[], sending: boolean }

/**
 * Offline first, then a server that does not answer, since nothing can be
 * done about the rest until it does; then refusals, which need a person; then
 * what is waiting.
 * @param reachable whether the last request had Laravel's answer (http.ts)
 */
export function syncState(online: boolean, reachable: boolean, pending: Record<string, SessionInput>, progress: Pick<SendProgress, 'sending' | 'refused'>): SyncState {
  // Oldest first, as they were done
  const queued = Object.entries(pending)
    .map(([id, input]) => ({ id, input }))
    .sort((a, b) => a.input.started_at.localeCompare(b.input.started_at))
  const waiting = queued.length
  if (!online) return { kind: 'offline', waiting, queued }
  if (!reachable) return { kind: 'unreachable', waiting, queued }
  // A refusal whose workout left the queue since (deleted from its summary) is over
  const workouts = progress.refused.flatMap(({ id, status }) => {
    const input = pending[id]
    return input ? [{ id, status, input }] : []
  })
  if (workouts.length > 0) return { kind: 'refused', workouts, sending: progress.sending }
  if (waiting > 0) return { kind: 'pending', waiting, queued, sending: progress.sending }
  return { kind: 'synced' }
}
