/*
 * The queue of finished workouts (pending-sessions.ts): which answers take a
 * workout off the queue, and which leave it there.
 */
import { describe, expect, it } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { addPending, loadPending } from '@/components/workout/session-storage'
import { fakeApi } from '@/test/auth-helpers'
import { sendPendingSessions } from './pending-sessions'

/** A body to queue; its content does not matter to the queue. */
const body = { exercises: [] } as unknown as SessionInput

describe('sendPendingSessions', () => {
  it('takes off the queue what the backend has or will never take, and keeps the rest', async () => {
    for (const id of ['saved', 'gone', 'offline', 'down', 'refused']) addPending(id, body)
    fakeApi({
      'PUT /api/sessions/saved': { status: 201, body: { data: { id: 'saved' } } },
      'PUT /api/sessions/gone': { status: 410, body: { message: 'This workout was deleted.' } },
      'PUT /api/sessions/offline': 'network',
      'PUT /api/sessions/down': { status: 503 },
      'PUT /api/sessions/refused': { status: 422, body: { message: 'Invalid.', errors: {} } },
    })

    const report = await sendPendingSessions()

    expect(report.sent).toEqual(['saved', 'gone'])
    expect(report.waiting).toEqual(['offline', 'down'])
    expect(report.refused).toEqual([{ id: 'refused', status: 422 }])
    // Nothing is lost: what was not taken stays, refused included
    expect(Object.keys(loadPending())).toEqual(['offline', 'down', 'refused'])
  })
})
