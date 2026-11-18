import { QueryClient } from '@tanstack/react-query'
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client'
import { describe, expect, it, vi } from 'vitest'
import { testUser } from '@/test/auth-helpers'
import { indexedDbStorage, persistOptions, type CacheStorage } from './query-persistence'

/** Storage in memory, in place of IndexedDB, which jsdom does not have. */
function memoryStorage(): CacheStorage & { items: Map<string, string> } {
  const items = new Map<string, string>()
  return {
    items,
    getItem: async key => items.get(key) ?? null,
    setItem: async (key, value) => void items.set(key, value),
    removeItem: async key => void items.delete(key),
  }
}

/** Saves the client's cache, and waits for the (throttled) write. */
async function save(queryClient: QueryClient, storage: ReturnType<typeof memoryStorage>, buster?: string) {
  const options = persistOptions(storage)
  await persistQueryClientSave({ queryClient, ...options, ...(buster ? { buster } : {}) })
  await vi.waitFor(() => expect(storage.items.size).toBe(1))
}

/** A new client, as at the next start, filled from the storage. */
async function restore(storage: CacheStorage): Promise<QueryClient> {
  const queryClient = new QueryClient()
  await persistQueryClientRestore({ queryClient, ...persistOptions(storage) })
  return queryClient
}

describe('the cache kept on the phone', () => {
  it('brings back the answers of the last session', async () => {
    const before = new QueryClient()
    before.setQueryData(['user'], testUser)
    before.setQueryData(['plans', 'list', false], [{ id: 'plan-ppl' }])
    const storage = memoryStorage()

    await save(before, storage)
    const after = await restore(storage)

    expect(after.getQueryData(['user'])).toEqual(testUser)
    expect(after.getQueryData(['plans', 'list', false])).toEqual([{ id: 'plan-ppl' }])
  })

  it('keeps the library\'s lists, but not its searches nor failed requests', async () => {
    const before = new QueryClient()
    before.setQueryData(['exercises', 'list', 'en', { source: 'all' }], { pages: [] })
    before.setQueryData(['exercises', 'list', 'en', { search: 'panca' }], { pages: [] })
    await before.fetchQuery({ queryKey: ['home'], queryFn: () => Promise.reject(new Error('down')), retry: false }).catch(() => {})
    const storage = memoryStorage()

    await save(before, storage)
    const after = await restore(storage)

    expect(after.getQueryData(['exercises', 'list', 'en', { source: 'all' }])).toEqual({ pages: [] })
    expect(after.getQueryState(['exercises', 'list', 'en', { search: 'panca' }])).toBeUndefined()
    expect(after.getQueryState(['home'])).toBeUndefined()
  })

  it('drops a copy saved by a build that read the answers differently', async () => {
    const before = new QueryClient()
    before.setQueryData(['user'], testUser)
    const storage = memoryStorage()

    await save(before, storage, 'an older version')
    const after = await restore(storage)

    expect(after.getQueryData(['user'])).toBeUndefined()
  })

  it('reads nothing and writes nothing when IndexedDB is missing, without failing', async () => {
    // jsdom has no IndexedDB, as some private windows
    const storage = indexedDbStorage()

    await expect(storage.setItem('key', 'value')).resolves.toBeUndefined()
    await expect(storage.getItem('key')).resolves.toBeNull()
    await expect(storage.removeItem('key')).resolves.toBeUndefined()
  })
})
