import { describe, expect, it } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { syncState } from './sync-state'

const body: SessionInput = {
  plan_id: null, plan_day_id: null, plan_name: null, day_name: 'Day A – Push', started_at: '2026-11-16T18:00:00+01:00',
  finished_at: '2026-11-16T19:00:00+01:00', duration_seconds: 3600, feeling: null, notes: null, exercises: [],
}
const idle = { sending: false, refused: [] }

describe('syncState', () => {
  it('shows nothing online with nothing to send', () => {
    expect(syncState(true, true, {}, idle)).toEqual({ kind: 'synced' })
  })

  it('says offline, whatever waits, since nothing can be done about it', () => {
    expect(syncState(false, true, {}, idle)).toEqual({ kind: 'offline', waiting: 0, queued: [], settings: false })
    expect(syncState(false, true, { a: body }, { sending: false, refused: [{ id: 'a', status: 422 }] })).toEqual({ kind: 'offline', waiting: 1, queued: [{ id: 'a', input: body }], settings: false })
  })

  it('counts what waits online, and whether it is being sent', () => {
    expect(syncState(true, true, { a: body, b: body }, idle)).toEqual({ kind: 'pending', waiting: 2, queued: [{ id: 'a', input: body }, { id: 'b', input: body }], settings: false, sending: false })
    expect(syncState(true, true, { a: body }, { sending: true, refused: [] })).toEqual({ kind: 'pending', waiting: 1, queued: [{ id: 'a', input: body }], settings: false, sending: true })
  })

  it('puts refused workouts first, with their bodies', () => {
    const state = syncState(true, true, { a: body, b: body }, { sending: false, refused: [{ id: 'a', status: 422 }] })
    expect(state).toEqual({ kind: 'refused', workouts: [{ id: 'a', status: 422, input: body }], sending: false })
  })

  it('forgets a refusal whose workout left the queue meanwhile', () => {
    expect(syncState(true, true, {}, { sending: false, refused: [{ id: 'a', status: 422 }] })).toEqual({ kind: 'synced' })
  })

  it('treats a server that does not answer as offline, with what waits', () => {
    expect(syncState(true, false, { a: body }, idle)).toEqual({ kind: 'unreachable', waiting: 1, queued: [{ id: 'a', input: body }], settings: false })
    expect(syncState(false, false, {}, idle)).toEqual({ kind: 'offline', waiting: 0, queued: [], settings: false })
  })

  it('counts preferences changed on this phone as something waiting, with no workout', () => {
    expect(syncState(true, true, {}, idle, true)).toEqual({ kind: 'pending', waiting: 0, queued: [], settings: true, sending: false })
    expect(syncState(false, true, {}, idle, true)).toEqual({ kind: 'offline', waiting: 0, queued: [], settings: true })
    expect(syncState(true, false, { a: body }, idle, true)).toEqual({ kind: 'unreachable', waiting: 1, queued: [{ id: 'a', input: body }], settings: true })
  })
})
