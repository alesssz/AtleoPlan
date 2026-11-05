/*
 * The account's hooks, on their own. The one worth testing apart is
 * useUpdatePreferences: two changes close together once made the language jump
 * back, because the server's answer to the second carried the old value of the
 * first. docs/04-frontend.md 4.13.
 *
 * renderHook runs a hook without drawing any screen. Its `wrapper` is what would
 * surround the hook in the app; here, the provider of the cache.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fakeApi, signedInAs, testUser, visitor } from '@/test/auth-helpers'
import { authKeys, fetchCurrentUser, useUpdatePreferences, type User } from './auth'

/**
 * A cache already holding the signed-in user, and the wrapper that provides it.
 * @param user what the cache starts with
 */
function setUp(user: User) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(authKeys.user, user)
  // The function a React provider needs: it draws its children inside the provider
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('fetchCurrentUser', () => {
  it('answers null for a visitor', async () => {
    fakeApi({ 'GET /api/user': visitor })

    await expect(fetchCurrentUser()).resolves.toBeNull()
  })

  it('answers the user when signed in', async () => {
    fakeApi({ 'GET /api/user': signedInAs() })

    await expect(fetchCurrentUser()).resolves.toEqual(testUser)
  })

  it('does not take a server error for being signed out', async () => {
    fakeApi({ 'GET /api/user': { status: 500, body: {} } })

    await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 500 })
  })

  it('does not take no connection for being signed out', async () => {
    fakeApi({ 'GET /api/user': 'network' })

    await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 0 })
  })
})

describe('useUpdatePreferences', () => {
  it('shows the change at once, before the server answers', async () => {
    // The answer never arrives during this test: a Promise nobody resolves
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    document.cookie = 'XSRF-TOKEN=token'
    const { queryClient, wrapper } = setUp(testUser)
    const { result } = renderHook(() => useUpdatePreferences(), { wrapper })

    act(() => result.current.mutate({ theme: 'light' }))

    await waitFor(() => expect(queryClient.getQueryData<User>(authKeys.user)?.theme).toBe('light'))
  })

  it('keeps both of two changes close together, whatever the answers say', async () => {
    // What the server has saved, updated as requests arrive. The first request
    // is held until the test lets it go, as a slow network would
    const saved = { ...testUser }
    // Set below: lets the held request finish
    let finishFirst = () => {}
    // The first parameter is the path, not needed here: `_` says so on purpose
    const fake = vi.fn(async (_path: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        const change = JSON.parse(String(init.body)) as Partial<User>
        if ('locale' in change) {
          await new Promise<void>((resolve) => {
            finishFirst = resolve
          })
        }
        Object.assign(saved, change)
        return new Response(null, { status: 204 })
      }
      return new Response(JSON.stringify({ data: saved }), { status: 200 })
    })
    vi.stubGlobal('fetch', fake)
    document.cookie = 'XSRF-TOKEN=token'
    const { queryClient, wrapper } = setUp(testUser)
    // Two uses of the hook, as the two pickers in Profile
    const language = renderHook(() => useUpdatePreferences(), { wrapper })
    const theme = renderHook(() => useUpdatePreferences(), { wrapper })

    act(() => language.result.current.mutate({ locale: 'it' }))
    act(() => theme.result.current.mutate({ theme: 'light' }))

    // The theme's request finishes first, while the language is not saved yet:
    // the screen must keep showing both choices
    await waitFor(() => expect(theme.result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData<User>(authKeys.user)).toMatchObject({ locale: 'it', theme: 'light' })

    // The language's request finishes too, and the last one reads from the server
    await act(async () => finishFirst())
    await waitFor(() => expect(language.result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData<User>(authKeys.user)).toMatchObject({ locale: 'it', theme: 'light' })
    // The server agrees
    expect(saved).toMatchObject({ locale: 'it', theme: 'light' })
  })
})
