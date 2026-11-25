import { describe, expect, it, vi } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { addPending, loadPending } from '@/components/workout/session-storage'
import { setDeviceOwner } from '@/lib/device-owner'
import { fakeApi, testUser } from '@/test/auth-helpers'
import { sendPendingSessions, sendProgress } from './pending-sessions'

/** A body to queue; its content does not matter to the queue. */
const body = { exercises: [] } as unknown as SessionInput

describe('sendPendingSessions', () => {
  it('takes off the queue what the backend has or will never take, and keeps the rest', async () => {
    for (const id of ['saved', 'gone', 'offline', 'down', 'limited', 'refused']) addPending(id, body)
    fakeApi({
      'PUT /api/sessions/saved': { status: 201, body: { data: { id: 'saved' } } },
      'PUT /api/sessions/gone': { status: 410, body: { message: 'This workout was deleted.' } },
      'PUT /api/sessions/offline': 'network',
      'PUT /api/sessions/down': { status: 503 },
      'PUT /api/sessions/limited': { status: 429, body: { message: 'Too Many Attempts.' } },
      'PUT /api/sessions/refused': { status: 422, body: { message: 'Invalid.', errors: {} } },
    })

    const report = await sendPendingSessions()

    expect(report.sent).toEqual(['saved', 'gone'])
    // The rate limit says "not now": tried again, never shown as refused
    expect(report.waiting).toEqual(['offline', 'down', 'limited'])
    expect(report.refused).toEqual([{ id: 'refused', status: 422 }])
    // Nothing is lost: what was not taken stays, refused included
    expect(Object.keys(loadPending())).toEqual(['offline', 'down', 'limited', 'refused'])
  })

  it('gives up on a request that hangs, keeps the workout, and ends the round', async () => {
    addPending('w-1', body)
    // A request that never answers, until it is cancelled: the CSRF cookie's
    // and the workout's alike
    vi.stubGlobal('fetch', vi.fn((_path: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    })))

    const report = await sendPendingSessions({ timeoutMs: 10 })

    expect(report.waiting).toEqual(['w-1'])
    expect(Object.keys(loadPending())).toEqual(['w-1'])
    expect(sendProgress().sending).toBe(false)
  })

  it('sends only the queue of the user signed in', async () => {
    addPending('ann-1', body)
    setDeviceOwner(2)
    const fake = fakeApi({})

    const report = await sendPendingSessions()

    expect(report.sent).toEqual([])
    expect(fake).not.toHaveBeenCalled()
    setDeviceOwner(testUser.id)
    expect(Object.keys(loadPending())).toEqual(['ann-1'])
  })

  it('stops when someone else signs in during the round, and keeps the rest for its owner', async () => {
    addPending('ann-1', body)
    addPending('ann-2', body)
    const fake = fakeApi({
      'PUT /api/sessions/ann-1': () => {
        // Ann signed out and Bea in while the first was on its way
        setDeviceOwner(2)
        return { status: 201, body: { data: { id: 'ann-1' } } }
      },
    })

    await sendPendingSessions()

    expect(fake.mock.calls.map(([path]) => path).filter(path => path.startsWith('/api/sessions/'))).toEqual(['/api/sessions/ann-1'])
    expect(loadPending()).toEqual({})
    setDeviceOwner(testUser.id)
    expect(Object.keys(loadPending())).toContain('ann-2')
  })

  it('runs one round at a time, so two at once send each workout once', async () => {
    addPending('w-1', body)
    const fake = fakeApi({ 'PUT /api/sessions/w-1': { status: 200, body: { data: { id: 'w-1' } } } })

    await Promise.all([sendPendingSessions(), sendPendingSessions()])

    expect(fake.mock.calls.filter(([path]) => path === '/api/sessions/w-1')).toHaveLength(1)
    expect(sendProgress().sending).toBe(false)
  })

  it('reports the result of the rounds to announce, not of the others', async () => {
    addPending('w-1', body)
    fakeApi({ 'PUT /api/sessions/w-1': { status: 200, body: { data: { id: 'w-1' } } } })
    const before = sendProgress().announced?.round ?? 0

    await sendPendingSessions()
    expect(sendProgress().announced?.round ?? 0).toBe(before)

    addPending('w-1', body)
    await sendPendingSessions({ announce: true })
    expect(sendProgress().announced).toEqual({ round: before + 1, sent: 1 })
  })
})
