/*
 * The query cache kept on the phone, in IndexedDB, so that the screens already
 * opened open again with no network: the signed-in user, plans, exercises,
 * Home, history. Restored when the app starts, written again after each change.
 */
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { Query } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { createStore, del, get, set } from 'idb-keyval'
import { shownData } from './shown-data'

/**
 * Raised by hand when a cached answer changes shape so that the screens can
 * no longer read the old one (a field added and read without a default): the
 * cache saved by an older build is then dropped instead of restored. Not the
 * build's hash, which would drop it at every update, maybe at the first
 * opening offline at the gym.
 */
export const CACHE_VERSION = '1'

/**
 * How long an answer is kept without being read again. A week covers the time
 * between two workouts; older data would be more misleading than none.
 */
export const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const STORAGE_KEY = 'atleoplan.queryCache'

/** Async storage over IndexedDB; the browser's storage errors are never the app's. */
export interface CacheStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/**
 * IndexedDB through idb-keyval, in a database of its own. Blocked or broken
 * storage (some private windows, a full disk) reads as empty and writes
 * nothing: the app then works as without the cache, online only.
 */
export function indexedDbStorage(): CacheStorage {
  let store: ReturnType<typeof createStore> | undefined
  const open = () => (store ??= createStore('atleoplan', 'query-cache'))
  return {
    getItem: async (key) => {
      try {
        return (await get<string>(key, open())) ?? null
      }
      catch {
        return null
      }
    },
    setItem: async (key, value) => {
      try {
        await set(key, value, open())
      }
      catch {
        // Nothing kept: the next start reads from the server
      }
    },
    removeItem: async (key) => {
      try {
        await del(key, open())
      }
      catch {
        // Already unreadable
      }
    },
  }
}

/**
 * Which answers are worth keeping: those a screen would show (shownData), so
 * also one whose last refresh found no server, which is when the copy is
 * needed; and not the library's searches, a new key for each word typed, that
 * would fill the cache with lists nobody opens again.
 */
export function shouldPersistQuery(query: Query): boolean {
  if (shownData(query.state) === undefined) return false
  const [resource, kind, , filters] = query.queryKey
  const isSearch = resource === 'exercises' && kind === 'list'
    && typeof filters === 'object' && filters !== null
    && 'search' in filters && Boolean(filters.search)
  return !isSearch
}

/** For PersistQueryClientProvider; `storage` is replaced in tests. */
export function persistOptions(storage: CacheStorage = indexedDbStorage()): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister: createAsyncStoragePersister({ storage, key: STORAGE_KEY }),
    maxAge: CACHE_MAX_AGE_MS,
    buster: CACHE_VERSION,
    dehydrateOptions: {
      shouldDehydrateQuery: shouldPersistQuery,
      // Changes made offline have their own queue
      shouldDehydrateMutation: () => false,
    },
  }
}
