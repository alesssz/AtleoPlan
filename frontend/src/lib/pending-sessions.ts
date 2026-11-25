/*
 * The queue of finished workouts waiting for the network, the signed-in
 * user's only (deviceOwner()). Each is sent with the idempotent
 * PUT /api/sessions/{id} until the backend has it.
 *
 * - 2xx: saved; it leaves the queue.
 * - 410: deleted elsewhere meanwhile; it leaves the queue for good.
 * - No answer, 5xx or 429 (too many requests): it stays, to try again.
 * - Any other 4xx: it stays, so nothing is lost, but retrying will not help;
 *   it is reported for a person to look at.
 */
import { sendSession } from '@/api/sessions'
import { loadPending, removePending } from '@/components/workout/session-storage'
import { deviceOwner } from '@/lib/device-owner'
import { ApiError, TOO_MANY_REQUESTS } from '@/lib/http'

export interface SendReport {
  sent: string[]
  waiting: string[]
  refused: { id: string, status: number }[]
}

/**
 * Whether a round of sending is running, and what the last one saw refused,
 * for SyncIndicator. In memory only: every round goes over the whole queue,
 * so the first one after the app opens finds the refusals again.
 */
export interface SendProgress {
  sending: boolean
  refused: SendReport['refused']
  /**
   * Whether a round to announce is waiting or running, and the last one's
   * result, numbered, for ConnectionBanner's "sending" and "done".
   */
  announcing: boolean
  announced: { round: number, sent: number } | null
}

let progress: SendProgress = { sending: false, refused: [], announcing: false, announced: null }
/** Rounds asked for and not over: Finish, Save, the online event, the server's return. */
let roundsWaiting = 0
let announcedWaiting = 0
let announcedRounds = 0
/** The last round asked for: the next one starts after it. */
let lastRound: Promise<unknown> = Promise.resolve()
const progressListeners = new Set<() => void>()

function setProgress(next: SendProgress): void {
  progress = next
  progressListeners.forEach(listener => listener())
}

/** @returns the function that stops listening */
export function subscribeToSendProgress(listener: () => void): () => void {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

/** The same object until it changes, as useSyncExternalStore needs. */
export function sendProgress(): SendProgress {
  return progress
}

/**
 * How long one workout may take to send. A request can hang on a weak
 * network for minutes: the round, and the indicator's spinner, would wait as
 * long. Past it the workout counts as not answered, and waits for the next
 * round.
 */
const SEND_TIMEOUT_MS = 30_000

export interface SendOptions {
  /** Per workout; shorter in tests. */
  timeoutMs?: number
  /**
   * A round the app starts by itself (opening, network or server back) or the
   * indicator's tap: the user learns of it only from ConnectionBanner. Not
   * Finish nor the summary's Save, whose page says the outcome.
   */
  announce?: boolean
}

/**
 * One workout after the other, and one round after the other: two rounds
 * asked for at once (the server's return and the sign-in, say) would
 * otherwise send the same workouts twice. The second finds only what the
 * first left.
 */
export function sendPendingSessions({ timeoutMs = SEND_TIMEOUT_MS, announce = false }: SendOptions = {}): Promise<SendReport> {
  roundsWaiting += 1
  if (announce) announcedWaiting += 1
  setProgress({ ...progress, sending: true, announcing: announcedWaiting > 0 })

  const over = (report: SendReport | null) => {
    roundsWaiting -= 1
    let announced = progress.announced
    if (announce) {
      announcedWaiting -= 1
      announcedRounds += 1
      announced = { round: announcedRounds, sent: report?.sent.length ?? 0 }
    }
    setProgress({
      sending: roundsWaiting > 0,
      refused: report?.refused ?? progress.refused,
      announcing: announcedWaiting > 0,
      announced,
    })
  }

  const round = lastRound.then(() => sendEach(timeoutMs)).then(
    (report) => {
      over(report)
      return report
    },
    (error: unknown) => {
      over(null)
      throw error
    },
  )
  lastRound = round.catch(() => undefined)
  return round
}

async function sendEach(timeoutMs: number): Promise<SendReport> {
  const report: SendReport = { sent: [], waiting: [], refused: [] }
  const owner = deviceOwner()
  for (const [id, input] of Object.entries(loadPending())) {
    // Signed out, or someone else signed in, while the round ran: the rest
    // waits for its owner, and must not reach another account. One answered
    // meanwhile stays in its owner's queue, and the idempotent PUT takes it
    // again later
    if (deviceOwner() !== owner) break
    try {
      await sendSession(id, input, AbortSignal.timeout(timeoutMs))
      removePending(id)
      report.sent.push(id)
    }
    catch (error) {
      // Not the API's error: the time limit, the CSRF cookie's request, or a
      // bug. Kept, as waiting
      const status = error instanceof ApiError ? error.status : 0
      if (status === 410) {
        removePending(id)
        report.sent.push(id)
      }
      else if (status === 0 || status >= 500 || status === TOO_MANY_REQUESTS) {
        report.waiting.push(id)
      }
      else {
        report.refused.push({ id, status })
      }
    }
  }
  return report
}
