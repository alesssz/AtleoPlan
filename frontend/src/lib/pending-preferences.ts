/*
 * The preferences changed on this phone that the server does not have yet:
 * one patch per user (deviceOwner()), field → value, since only the last value
 * of each counts. A change goes here first and is sent at once
 * (useUpdatePreferences); one not answered waits for the queue's rounds
 * (useSendPending), and the user read from the server is shown with the patch
 * over it (fetchCurrentUser), so a reload before it is sent keeps the choice.
 *
 * - 2xx: the fields sent leave the patch, unless changed again meanwhile.
 * - No answer, 5xx or 429 (too many requests): they stay, for the next round.
 * - Any other 4xx: they leave too. The server refused values the app itself
 *   offers, retrying would fail the same way, and its own values come back.
 */
import type { PreferencesData } from '@/api/auth'
import { deviceOwner, ownedKey } from './device-owner'
import { ApiError, request, TOO_MANY_REQUESTS } from './http'

const KEY = 'atleoplan.pendingPreferences'

/** As long as a workout may take to send (pending-sessions.ts). */
const SEND_TIMEOUT_MS = 30_000

const listeners = new Set<() => void>()

/**
 * @param owner whose patch; the signed-in user's when not given
 * @returns the patch waiting, empty when none
 */
export function loadPendingPreferences(owner: number | null = deviceOwner()): PreferencesData {
  const key = ownedKey(KEY, owner)
  if (key === null) return {}
  try {
    const text = localStorage.getItem(key)
    return text === null ? {} : (JSON.parse(text) as PreferencesData)
  }
  catch {
    return {}
  }
}

/** An empty patch removes the key. */
function write(patch: PreferencesData, owner: number | null): void {
  const key = ownedKey(KEY, owner)
  if (key === null) return
  try {
    if (Object.keys(patch).length === 0) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(patch))
  }
  catch {
    // Storage blocked or full: the change still goes to the server now
  }
  listeners.forEach(listener => listener())
}

/** Adds a change, over the earlier values of the same fields. */
export function addPendingPreferences(data: PreferencesData): void {
  const owner = deviceOwner()
  write({ ...loadPendingPreferences(owner), ...data }, owner)
}

/**
 * Takes off the patch the fields the server now has, or will never take:
 * those still holding the value sent. One changed again during the request
 * keeps its new value, for the next send.
 */
function settle(sent: PreferencesData, owner: number | null): void {
  const patch = loadPendingPreferences(owner)
  const left = Object.fromEntries(Object.entries(patch).filter(([field, value]) => sent[field as keyof PreferencesData] !== value))
  write(left as PreferencesData, owner)
}

/**
 * Called after every change of the patch: here, or in another tab (`storage`
 * event, also fired when another tab clears the storage).
 * @returns the function that stops listening
 */
export function subscribeToPendingPreferences(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === ownedKey(KEY)) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

let cache: { text: string | null, waiting: boolean } = { text: null, waiting: false }

/** Whether a patch waits, read from the storage's text, as useSyncExternalStore needs. */
export function preferencesWaiting(): boolean {
  let text: string | null = null
  const key = ownedKey(KEY)
  try {
    if (key !== null) text = localStorage.getItem(key)
  }
  catch {
    // Unreadable: as empty
  }
  if (text !== cache.text) cache = { text, waiting: Object.keys(loadPendingPreferences()).length > 0 }
  return cache.waiting
}

export type PreferencesOutcome = 'nothing' | 'sent' | 'waiting' | 'refused'

/**
 * Sends the whole patch in one PATCH. Never throws: what failed waits, or is
 * dropped, as the file's comment says.
 * @param timeoutMs shorter in tests
 */
export async function sendPendingPreferences(timeoutMs = SEND_TIMEOUT_MS): Promise<PreferencesOutcome> {
  const owner = deviceOwner()
  const patch = loadPendingPreferences(owner)
  if (Object.keys(patch).length === 0) return 'nothing'

  try {
    await request<void>('/api/user/preferences', { method: 'PATCH', body: patch, signal: AbortSignal.timeout(timeoutMs) })
    // The owner's patch, even if someone else signed in meanwhile
    settle(patch, owner)
    return 'sent'
  }
  catch (error) {
    // Not the API's error: the time limit, the CSRF cookie's request
    const status = error instanceof ApiError ? error.status : 0
    if (status === 0 || status >= 500 || status === TOO_MANY_REQUESTS) return 'waiting'
    settle(patch, owner)
    return 'refused'
  }
}
