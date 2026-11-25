/*
 * Workouts in localStorage: the one in progress (written after every change),
 * the finished ones waiting to be sent, and the one just finished, for its
 * summary. Each user's under keys of their own (deviceOwner()). Every access
 * is wrapped: a private window or full storage throws, and the workout must
 * still run.
 */
import type { SessionInput } from '@/api/sessions'
import { ownedKey } from '@/lib/device-owner'
import type { ActiveSession } from './workout-session'

/**
 * What happened to a finished workout when it was sent: on the server,
 * waiting for the network, or refused (and kept on the phone).
 */
export type WorkoutOutcome = 'saved' | 'queued' | 'refused'

/** The workout just finished, kept for its summary until Save or Delete. */
export interface FinishedWorkout {
  id: string
  /**
   * The workout itself, as it was at Finish: the exercises' names and
   * logging types, and last time's sets (`previous`), which the body sent
   * does not carry. The summary's list and comparison come from it.
   */
  session: ActiveSession
  /** Its body, as sent: the summary's numbers come from it, and Save sends it again with the feeling and the notes. */
  input: SessionInput
  /** What happened when it was sent at Finish. */
  outcome: WorkoutOutcome
}

const FINISHED_KEY = 'atleoplan.finishedSession'
const ACTIVE_KEY = 'atleoplan.activeSession'
/** The workouts waiting to be sent: an object, id → body. */
const PENDING_KEY = 'atleoplan.pendingSessions'

/**
 * Reads the signed-in user's JSON value; null when missing or unreadable.
 * @param base the key without its owner
 */
function read<T>(base: string): T | null {
  const key = ownedKey(base)
  if (key === null) return null
  try {
    const text = localStorage.getItem(key)
    return text === null ? null : (JSON.parse(text) as T)
  }
  catch {
    return null
  }
}

/**
 * Writes the signed-in user's JSON value; null removes the key.
 * @param base the key without its owner
 */
function write(base: string, value: unknown): void {
  const key = ownedKey(base)
  if (key === null) return
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // Storage blocked or full: the workout lives only on screen
  }
}

/** The workout in progress on this device, or null. */
export function loadActiveSession(): ActiveSession | null {
  return read<ActiveSession>(ACTIVE_KEY)
}

/** Replaces the workout in progress; null forgets it. */
export function storeActiveSession(session: ActiveSession | null): void {
  write(ACTIVE_KEY, session)
}

/** The workouts waiting to be sent, by id. */
export function loadPending(): Record<string, SessionInput> {
  return read<Record<string, SessionInput>>(PENDING_KEY) ?? {}
}

const pendingListeners = new Set<() => void>()

/**
 * Called after every change of the waiting list: here, or in another tab
 * (`storage` event, also fired when another tab clears the storage).
 * @returns the function that stops listening
 */
export function subscribeToPending(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === ownedKey(PENDING_KEY)) listener()
  }
  pendingListeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    pendingListeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

let pendingCache: { text: string | null, value: Record<string, SessionInput> } = { text: null, value: {} }

/** loadPending(), but the same object until the list changes, as useSyncExternalStore needs. */
export function pendingSnapshot(): Record<string, SessionInput> {
  let text: string | null = null
  const key = ownedKey(PENDING_KEY)
  try {
    if (key !== null) text = localStorage.getItem(key)
  }
  catch {
    // Unreadable: as empty
  }
  if (text !== pendingCache.text) pendingCache = { text, value: loadPending() }
  return pendingCache.value
}

function writePending(value: Record<string, SessionInput> | null): void {
  write(PENDING_KEY, value)
  pendingListeners.forEach(listener => listener())
}

export function addPending(id: string, input: SessionInput): void {
  writePending({ ...loadPending(), [id]: input })
}

/**
 * Takes a workout off the waiting list: the backend has it, or will never
 * take it (410: deleted elsewhere).
 */
export function removePending(id: string): void {
  const others = Object.fromEntries(Object.entries(loadPending()).filter(([key]) => key !== id))
  writePending(Object.keys(others).length === 0 ? null : others)
}

/** The workout just finished, waiting for its summary's Save or Delete, or null. */
export function loadFinished(): FinishedWorkout | null {
  return read<FinishedWorkout>(FINISHED_KEY)
}

/** Replaces the workout just finished; null forgets it. */
export function storeFinished(finished: FinishedWorkout | null): void {
  write(FINISHED_KEY, finished)
}
