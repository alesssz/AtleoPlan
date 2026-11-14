/*
 * Where workouts live on the phone:
 *
 * - **the workout in progress**, one at a time, written after every tap, so
 *   that closing the app, a reload or a flat battery loses nothing, and ✕ only
 *   pauses it;
 * - **the workouts waiting to be sent**, by id: a finished workout goes
 *   there first, and leaves only when the backend has it
 *   (src/lib/pending-sessions.ts);
 * - **the workout just finished**, for its summary (FinishedWorkout below):
 *   the summary is drawn from it, with no request, so it works offline too.
 *
 * Both in localStorage, like the plan editor's draft (draft-storage.ts): a
 * workout is a few kilobytes. Every access is in try/catch, since a private
 * window or full storage throws. IndexedDB comes with the offline work.
 */
import type { SessionInput } from '@/api/sessions'
import type { ActiveSession } from './workout-session'

/**
 * What happened to a finished workout when it was sent: on the server,
 * waiting for the network, or refused (and kept on the phone).
 */
export type WorkoutOutcome = 'saved' | 'queued' | 'refused'

/** The workout just finished, kept for its summary until Save or Delete. */
export interface FinishedWorkout {
  /** The workout's UUID, as in the summary's address. */
  id: string
  /**
   * The workout itself, as it was at Finish: the exercises' names and
   * logging types, and last time's sets (`previous`), which the body sent
   * does not carry. The summary's list and comparison come from it.
   */
  session: ActiveSession
  /** Its body, as sent: the summary's numbers come from it, and Save sends it again with the feeling and the notes. */
  input: SessionInput
  /** What happened when it was sent at Finish: saved, waiting for the network, refused. */
  outcome: WorkoutOutcome
}

/** The key of the workout just finished. */
const FINISHED_KEY = 'atleoplan.finishedSession'

/** The key of the workout in progress. */
const ACTIVE_KEY = 'atleoplan.activeSession'

/** The key of the workouts waiting to be sent: an object, id → body. */
const PENDING_KEY = 'atleoplan.pendingSessions'

/**
 * Reads a JSON value kept under a key.
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
 */
export function addPending(id: string, input: SessionInput): void {
  write(PENDING_KEY, { ...loadPending(), [id]: input })
}

/**
 * Takes a workout off the waiting list: the backend has it, or will never
 * take it (410: deleted elsewhere).
 */
export function removePending(id: string): void {
  const others = Object.fromEntries(Object.entries(loadPending()).filter(([key]) => key !== id))
  write(PENDING_KEY, Object.keys(others).length === 0 ? null : others)
}

/** The workout just finished, waiting for its summary's Save or Delete, or null. */
export function loadFinished(): FinishedWorkout | null {
  return read<FinishedWorkout>(FINISHED_KEY)
}

/**
 * Keeps the workout just finished, replacing the one before; null forgets it.
 * @param finished the workout, its body and what happened to it, or null
 */
export function storeFinished(finished: FinishedWorkout | null): void {
  write(FINISHED_KEY, finished)
}
