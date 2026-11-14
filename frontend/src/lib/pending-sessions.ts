/*
 * The queue of finished workouts waiting for the network. Each is sent with the
 * idempotent PUT /api/sessions/{id} until the backend has it. The full offline
 * work (PWA, IndexedDB, background sync) comes later; this is what a workout
 * needs not to be lost.
 *
 * - 2xx: saved; it leaves the queue.
 * - 410: deleted elsewhere meanwhile; it leaves the queue for good.
 * - No answer or 5xx: it stays, to try again.
 * - Any other 4xx: it stays, so nothing is lost, but retrying will not help;
 *   it is reported for a person to look at.
 */
import { sendSession } from '@/api/sessions'
import { loadPending, removePending } from '@/components/workout/session-storage'
import { ApiError } from '@/lib/http'

export interface SendReport {
  sent: string[]
  waiting: string[]
  refused: { id: string, status: number }[]
}

/** One after the other. */
export async function sendPendingSessions(): Promise<SendReport> {
  const report: SendReport = { sent: [], waiting: [], refused: [] }
  for (const [id, input] of Object.entries(loadPending())) {
    try {
      await sendSession(id, input)
      removePending(id)
      report.sent.push(id)
    }
    catch (error) {
      // Not the API's error (a bug): kept, as waiting
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
