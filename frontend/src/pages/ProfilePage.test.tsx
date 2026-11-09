/*
 * Profile: shows the account, signs out, and saves the workout's
 * preferences. The guards around it are the real ones, so signing out really
 * ends on the sign-in form (docs/concepts/C1-frontend.md C1.13).
 */
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { storeActiveSession } from '@/components/workout/session-storage'
import { startFreeSession } from '@/components/workout/workout-session'
import { fakeApi, renderRoutes, signedInAs, testUser, visitor } from '@/test/auth-helpers'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireGuest } from '@/routes/RequireGuest'
import { ProfilePage } from './ProfilePage'

/** The same shape as src/router.tsx, with plain text for the sign-in form. */
const routes = [
  { element: <RequireGuest />, children: [{ path: 'login', element: <p>the sign-in form</p> }] },
  { element: <RequireAuth />, children: [{ path: 'profile', element: <ProfilePage /> }] },
]

/** The server's health, which Profile's last card reads. */
const health = { status: 200, body: { status: 'ok' } }

/**
 * Every body sent to PATCH /api/user/preferences, in order.
 * @param fake the fake fetch
 */
function preferencesSent(fake: ReturnType<typeof fakeApi>): unknown[] {
  return fake.mock.calls
    .filter(([path, init]) => path === '/api/user/preferences' && init?.method === 'PATCH')
    .map(([, init]) => JSON.parse(String(init?.body)) as unknown)
}

describe('ProfilePage', () => {
  it('shows who is signed in', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': { status: 200, body: { status: 'ok' } } })
    renderRoutes(routes, '/profile')

    expect(await screen.findByText('Ann')).toBeInTheDocument()
    expect(screen.getByText('ann@example.com')).toBeInTheDocument()
  })

  it('signs out and goes to the sign-in form', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': { status: 200, body: { status: 'ok' } } })
    const { router } = renderRoutes(routes, '/profile')

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(fake.mock.calls.some(([path, init]) => path === '/api/auth/logout' && init?.method === 'POST')).toBe(true)
  })

  it('goes to the sign-in form even if the session had already ended', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': { status: 200, body: { status: 'ok' } }, 'POST /api/auth/logout': visitor })
    renderRoutes(routes, '/profile')

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
  })

  it('saves each workout preference at once, one field per request', async () => {
    // A fake server that remembers: GET /api/user answers the user with
    // every preference sent so far, as the real one would. Profile reads
    // the user again after the last change (useUpdatePreferences); a fake
    // that always gave the first values would put them back on screen.
    // A function entry is called at each request, so it sees `fake` filled
    const fake = fakeApi({
      'GET /api/user': () => signedInAs(Object.assign({ ...testUser }, ...preferencesSent(fake))),
      'GET /api/health': health,
      'PATCH /api/user/preferences': { status: 204 },
    })
    renderRoutes(routes, '/profile')
    const user = userEvent.setup()

    // The card, with the account's values: kg, 90 s, 2.5 kg, sound and vibration on
    const card = await screen.findByRole('region', { name: 'Workout' })
    expect(within(card).getByRole('combobox', { name: 'Weight unit' })).toHaveTextContent('Kilograms (kg)')
    expect(within(card).getByRole('combobox', { name: 'Default rest' })).toHaveTextContent('90 sec')
    expect(within(card).getByRole('combobox', { name: 'Weight step' })).toHaveTextContent('2.5 kg')

    // A Select: a tap opens its list, a tap on an option picks it
    await user.click(within(card).getByRole('combobox', { name: 'Default rest' }))
    await user.click(await screen.findByRole('option', { name: '2 min' }))
    await user.click(within(card).getByRole('combobox', { name: 'Weight step' }))
    await user.click(await screen.findByRole('option', { name: '1.25 kg' }))
    // A switch: one tap turns it off, at once on screen
    const sound = within(card).getByRole('switch', { name: 'Sound at the end of the rest' })
    expect(sound).toHaveAttribute('aria-checked', 'true')
    await user.click(sound)
    // waitFor: the cached user changes after an `await` in the hook
    await waitFor(() => expect(sound).toHaveAttribute('aria-checked', 'false'))
    expect(within(card).getByRole('combobox', { name: 'Default rest' })).toHaveTextContent('2 min')

    expect(preferencesSent(fake)).toEqual([{ default_rest_seconds: 120 }, { weight_step: '1.25' }, { timer_sound: false }])
  })

  it('changes the unit with the step that suits it', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': health, 'PATCH /api/user/preferences': { status: 204 } })
    renderRoutes(routes, '/profile')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('combobox', { name: 'Weight unit' }))
    await user.click(await screen.findByRole('option', { name: 'Pounds (lb)' }))

    // 2.5 kg becomes 5 lb, not 2.5 lb: one request with both
    expect(preferencesSent(fake)).toEqual([{ weight_unit: 'lb', weight_step: '5.00' }])
  })

  it('does not change the unit while a workout is in progress', async () => {
    storeActiveSession(startFreeSession(new Date()))
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': health })
    renderRoutes(routes, '/profile')

    expect(await screen.findByRole('combobox', { name: 'Weight unit' })).toBeDisabled()
    expect(screen.getByText(/Finish the workout in progress first/)).toBeInTheDocument()
  })
})
