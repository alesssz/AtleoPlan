/*
 * The queue of finished workouts waiting for the network
 * (docs/design/D2-decisions.md D2.7): each is sent with
 * PUT /api/sessions/{id}, which the backend makes safe to repeat, until the
 * answer says the backend has it. The full offline work (the PWA, a queue in
 * IndexedDB, sending in the background) comes later in FEAT-3; this is the
 * part a workout needs not to be lost (docs/concepts/C1-frontend.md C1.17.5).
 *
 * What each answer means for a workout in the queue:
 * - 2xx: saved; it leaves the queue;
 * - 410: deleted elsewhere meanwhile; it leaves the queue, never to come back;
 * - no answer (offline, status 0) or 5xx: it stays, to try again later;
 * - any other 4xx (403, 422): it stays too, so nothing is lost, but trying
 *   again will not help; it is reported, and a person must look.
 */
import { sendSession } from '@/api/sessions'
import { loadPending, removePending } from '@/components/workout/session-storage'
import { ApiError } from '@/lib/http'

/** What one round of sending did. */
export interface SendReport {
  /** The workouts the backend now has. */
  sent: string[]
  /** Those still waiting, to try again. */
  waiting: string[]
  /** Those the backend refused, with its status. */
  refused: { id: string, status: number }[]
}

/**
 * Sends every workout of the queue, one after the other, and takes off the
 * queue those that are done (see the file's header).
 * @returns what happened to each
 */
export async function sendPendingSessions(): Promise<SendReport> {
  // Filled as each queued workout is tried
  const report: SendReport = { sent: [], waiting: [], refused: [] }
  // Object.entries(): the pairs [id, body] of the queue
  for (const [id, input] of Object.entries(loadPending())) {
    try {
      await sendSession(id, input)
      removePending(id)
      report.sent.push(id)
    }
    catch (error) {
      // An error that is not the API's (a bug): leave the workout, report it waiting
      const status = error instanceof ApiError ? error.status : 0
      if (status === 410) {
        removePending(id)
        report.sent.push(id)
      }
      else if (status === 0 || status >= 500) {
        report.waiting.push(id)
      }
      else {
        report.refused.push({ id, status })
      }
    }
  }
  return report
}
