import { act, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { addPending, loadPending } from '@/components/workout/session-storage'
import { RequireAuth } from '@/routes/RequireAuth'
import { fakeApi, renderRoutes, signedInAs, type FakeAnswer } from '@/test/auth-helpers'
import { isServerReachable } from './http'
import { QUEUE_RETRY_INTERVAL_MS } from './usePendingSessions'
import { SERVER_CHECK_INTERVAL_MS } from './useServerWatch'

const body = { exercises: [] } as unknown as SessionInput
const routes = [{ element: <RequireAuth />, children: [{ path: '/', element: <p>home</p> }] }]

afterEach(() => {
  vi.useRealTimers()
})

describe('useServerWatch', () => {
  it('asks the server again while it does not answer, and sends the queue once it is back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    addPending('w-1', body)
    let server: FakeAnswer = { status: 502 }
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/health': () => server.status === 502 ? server : { status: 200, body: { status: 'ok' } },
      'PUT /api/sessions/w-1': () => server,
    })
    renderRoutes(routes, '/')
    await screen.findByText('home')
    // The queue's first round, at start, met no server
    await vi.waitFor(() => expect(isServerReachable()).toBe(false))

    server = { status: 200, body: { data: { id: 'w-1' } } }
    await act(() => vi.advanceTimersByTimeAsync(SERVER_CHECK_INTERVAL_MS))

    await vi.waitFor(() => expect(loadPending()).toEqual({}))
    expect(fake.mock.calls.map(([path]) => path)).toContain('/api/health')
  })

  it('tries the queue again by itself while the server answers but did not take it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    addPending('w-1', body)
    // A server error, not a proxy's: the server is there
    let answer: FakeAnswer = { status: 500, body: { message: 'Server Error' } }
    fakeApi({ 'GET /api/user': signedInAs(), 'PUT /api/sessions/w-1': () => answer })
    renderRoutes(routes, '/')
    await screen.findByText('home')
    await vi.waitFor(() => expect(isServerReachable()).toBe(true))

    answer = { status: 200, body: { data: { id: 'w-1' } } }
    await act(() => vi.advanceTimersByTimeAsync(QUEUE_RETRY_INTERVAL_MS))

    await vi.waitFor(() => expect(loadPending()).toEqual({}))
  })
})
