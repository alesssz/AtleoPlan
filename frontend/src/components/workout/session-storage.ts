/*
 * Where workouts live on the phone (docs/design/D2-decisions.md D2.7):
 *
 * - **the workout in progress**, one at a time, written after every tap, so
 *   that closing the app, a reload or a flat battery loses nothing, and ✕
 *   only pauses it (docs/design/D1-ui.md D1.4.9);
 * - **the workouts waiting to be sent**, by id: a finished workout goes
 *   there first, and leaves only when the backend has it
 *   (src/lib/pending-sessions.ts).
 *
 * Both in localStorage, like the plan editor's draft (draft-storage.ts,
 * docs/concepts/C1-frontend.md C1.16.4): a workout is a few kilobytes. Every
 * access is in try/catch, since a private window or full storage throws.
 * IndexedDB comes with the offline work of FEAT-3.
 */
import type { SessionInput } from '@/api/sessions'
import type { ActiveSession } from './workout-session'

/** The key of the workout in progress. */
const ACTIVE_KEY = 'atleoplan.activeSession'

/** The key of the workouts waiting to be sent: an object, id → body. */
const PENDING_KEY = 'atleoplan.pendingSessions'

/**
 * Reads a JSON value kept under a key.
 * @param key the key
 * @returns the value, or null when there is none or it cannot be read
 */
function read<T>(key: string): T | null {
  try {
    const text = localStorage.getItem(key)
    return text === null ? null : (JSON.parse(text) as T)
  }
  catch {
    return null
  }
}

/**
 * Keeps a JSON value under a key; null removes it.
 * @param key the key
 * @param value the value, or null
 */
function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // Storage blocked or full: the workout lives only on screen
  }
}

/** The workout in progress on this phone, or null. */
export function loadActiveSession(): ActiveSession | null {
  return read<ActiveSession>(ACTIVE_KEY)
}

/**
 * Keeps the workout in progress, replacing the one before; null forgets it.
 * @param session the workout, or null
 */
export function storeActiveSession(session: ActiveSession | null): void {
  write(ACTIVE_KEY, session)
}

/** The workouts waiting to be sent, by id. */
export function loadPending(): Record<string, SessionInput> {
  return read<Record<string, SessionInput>>(PENDING_KEY) ?? {}
}

/**
 * Puts a finished workout among those waiting to be sent.
 * @param id the workout's UUID
 * @param input its body
 */
export function addPending(id: string, input: SessionInput): void {
  write(PENDING_KEY, { ...loadPending(), [id]: input })
}

/**
 * Takes a workout off the waiting list: the backend has it, or will never
 * take it (410: deleted elsewhere).
 * @param id the workout's UUID
 */
export function removePending(id: string): void {
  // Every entry but `id`: Object.entries() gives the pairs, filter() drops
  // one, Object.fromEntries() makes an object again
  const others = Object.fromEntries(Object.entries(loadPending()).filter(([key]) => key !== id))
  write(PENDING_KEY, Object.keys(others).length === 0 ? null : others)
}
