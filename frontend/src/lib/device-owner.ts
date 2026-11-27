/*
 * Whose entries the phone's localStorage is read and written for. A phone
 * can be shared: each user's workouts and drafts live under keys of their own
 * ("atleoplan.activeSession.12"), so whoever signs in next neither sees nor
 * sends them, and they are still there when their owner signs in again.
 *
 * RequireAuth sets it as it renders, before the pages below read the storage
 * in their first render. Nobody known (signed out, or still loading): every
 * read finds nothing and every write is dropped.
 */

let owner: number | null = null

/** The signed-in user's id, or null. */
export function deviceOwner(): number | null {
  return owner
}

/** Called by RequireAuth, and by tests that store before rendering. */
export function setDeviceOwner(id: number | null): void {
  owner = id
}

/**
 * The key of an entry for the user signed in now: "atleoplan.activeSession.12".
 * @param base the key without its owner, such as "atleoplan.activeSession"
 * @param id another user's, for a user just read and not yet the owner
 * @returns null when nobody is signed in
 */
export function ownedKey(base: string, id: number | null = owner): string | null {
  return id === null ? null : `${base}.${id}`
}
