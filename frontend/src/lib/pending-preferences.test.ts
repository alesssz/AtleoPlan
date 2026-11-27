import { describe, expect, it } from 'vitest'
import { fetchCurrentUser } from '@/api/auth'
import { setDeviceOwner } from '@/lib/device-owner'
import { fakeApi, signedInAs, testUser } from '@/test/auth-helpers'
import { addPendingPreferences, loadPendingPreferences, preferencesWaiting, sendPendingPreferences } from './pending-preferences'

/** Every body sent to PATCH /api/user/preferences, in order. */
function sent(fake: ReturnType<typeof fakeApi>): unknown[] {
  return fake.mock.calls
    .filter(([path, init]) => path === '/api/user/preferences' && init?.method === 'PATCH')
    .map(([, init]) => JSON.parse(String(init?.body)) as unknown)
}

describe('the preferences waiting', () => {
  it('keeps only the last value of each field', () => {
    addPendingPreferences({ theme: 'light' })
    addPendingPreferences({ weight_unit: 'lb', weight_step: '5.00' })
    addPendingPreferences({ theme: 'dark' })

    expect(loadPendingPreferences()).toEqual({ theme: 'dark', weight_unit: 'lb', weight_step: '5.00' })
    expect(preferencesWaiting()).toBe(true)
  })

  it('sends them all at once, and forgets them once the server has them', async () => {
    addPendingPreferences({ theme: 'light' })
    addPendingPreferences({ show_rpe: true })
    const fake = fakeApi({ 'PATCH /api/user/preferences': { status: 204 } })

    expect(await sendPendingPreferences()).toBe('sent')

    expect(sent(fake)).toEqual([{ theme: 'light', show_rpe: true }])
    expect(loadPendingPreferences()).toEqual({})
    expect(preferencesWaiting()).toBe(false)
  })

  it('keeps them with no answer, a server error or too many requests', async () => {
    for (const answer of ['network', { status: 503 }, { status: 429, body: { message: 'Too Many Attempts.' } }] as const) {
      addPendingPreferences({ theme: 'light' })
      fakeApi({ 'PATCH /api/user/preferences': answer })

      expect(await sendPendingPreferences()).toBe('waiting')
      expect(loadPendingPreferences()).toEqual({ theme: 'light' })
    }
  })

  it('drops what the server refuses, as retrying would fail the same way', async () => {
    addPendingPreferences({ default_rest_seconds: 9999 })
    fakeApi({ 'PATCH /api/user/preferences': { status: 422, body: { message: 'Invalid.', errors: { default_rest_seconds: ['Too long.'] } } } })

    expect(await sendPendingPreferences()).toBe('refused')
    expect(loadPendingPreferences()).toEqual({})
  })

  it('keeps a field changed again while the first value was on its way', async () => {
    addPendingPreferences({ theme: 'light', show_rpe: true })
    fakeApi({
      'PATCH /api/user/preferences': () => {
        addPendingPreferences({ theme: 'dark' })
        return { status: 204 }
      },
    })

    await sendPendingPreferences()

    expect(loadPendingPreferences()).toEqual({ theme: 'dark' })
  })

  it('sends nothing when nothing waits', async () => {
    const fake = fakeApi({})

    expect(await sendPendingPreferences()).toBe('nothing')
    expect(fake).not.toHaveBeenCalled()
  })

  it('keeps each user\'s apart, and settles the sender\'s even if another signs in meanwhile', async () => {
    addPendingPreferences({ theme: 'light' })
    fakeApi({
      'PATCH /api/user/preferences': () => {
        setDeviceOwner(2)
        return { status: 204 }
      },
    })

    await sendPendingPreferences()

    expect(loadPendingPreferences(testUser.id)).toEqual({})
    expect(loadPendingPreferences(2)).toEqual({})
    addPendingPreferences({ locale: 'de' })
    expect(loadPendingPreferences(testUser.id)).toEqual({})
  })

  it('shows the user read from the server with the changes still waiting over it', async () => {
    // Before RequireAuth knows who owns the phone, as after a reload
    addPendingPreferences({ theme: 'light', weight_unit: 'lb' })
    setDeviceOwner(null)
    fakeApi({ 'GET /api/user': signedInAs() })

    const user = await fetchCurrentUser()

    expect(user).toEqual({ ...testUser, theme: 'light', weight_unit: 'lb' })
  })
})
