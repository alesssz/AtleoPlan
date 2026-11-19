/*
 * With the real guards, so signing out really ends on the sign-in form.
 */
import { cleanup, screen, waitFor, within } from '@testing-library/react'
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

/** The server's health, which the About tab reads. */
const health = { status: 200, body: { status: 'ok' } }

/**
 * Every body sent to PATCH /api/user/preferences, in order.
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

  it('opens on the Workout tab, and keeps the tab chosen in the address', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': health })
    const { router } = renderRoutes(routes, '/profile')
    const user = userEvent.setup()

    const tabs = await screen.findByRole('tablist', { name: 'Preferences' })
    expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Workout', 'App', 'About'])
    expect(within(tabs).getByRole('tab', { name: 'Workout' })).toHaveAttribute('aria-selected', 'true')
    // In short titled groups, each a region
    const workout = screen.getByRole('tabpanel', { name: 'Workout' })
    expect(within(workout).getAllByRole('region').map(group => group.getAttribute('aria-labelledby') && document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent)).toEqual(['Weights', 'Timers', 'Sound and vibration', 'Plans'])
    expect(within(workout).getByRole('region', { name: 'Weights' })).toContainElement(screen.getByRole('combobox', { name: 'Weight step' }))
    expect(within(workout).getByRole('region', { name: 'Timers' })).toContainElement(screen.getByRole('combobox', { name: 'Countdown' }))
    expect(within(workout).getByRole('region', { name: 'Sound and vibration' })).toContainElement(screen.getByRole('switch', { name: 'Vibration' }))
    // The other tabs are not drawn until opened
    expect(screen.queryByRole('combobox', { name: 'Language' })).not.toBeInTheDocument()

    await user.click(within(tabs).getByRole('tab', { name: 'App' }))
    const display = within(screen.getByRole('tabpanel', { name: 'App' })).getByRole('region', { name: 'Display' })
    expect(display).toContainElement(screen.getByRole('combobox', { name: 'Language' }))
    expect(display).toContainElement(screen.getByRole('combobox', { name: 'Theme' }))
    expect(router.state.location.search).toBe('?tab=app')

    // Back to Workout: the address loses the tab, the default
    await user.click(within(tabs).getByRole('tab', { name: 'Workout' }))
    expect(router.state.location.search).toBe('')
  })

  it('opens the tab in the address, and Workout for an unknown one', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': health })
    renderRoutes(routes, '/profile?tab=about')

    expect(await screen.findByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tabpanel', { name: 'About' })).getByRole('region', { name: 'Server' })).toHaveTextContent('Status')
    cleanup()

    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': health })
    renderRoutes(routes, '/profile?tab=nonsense')
    expect(await screen.findByRole('tab', { name: 'Workout' })).toHaveAttribute('aria-selected', 'true')
  })

  it('links an admin to the admin panel, in a new tab', async () => {
    fakeApi({ 'GET /api/user': signedInAs({ ...testUser, is_admin: true, admin_url: 'http://localhost:8500/admin' }), 'GET /api/health': health })
    renderRoutes(routes, '/profile?tab=about')

    const card = await screen.findByRole('region', { name: 'Administration' })
    const link = within(card).getByRole('link', { name: 'Open' })
    expect(link).toHaveAttribute('href', 'http://localhost:8500/admin')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows no admin panel to anyone else', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/health': health })
    renderRoutes(routes, '/profile?tab=about')

    expect(await screen.findByRole('tabpanel', { name: 'About' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Administration' })).not.toBeInTheDocument()
  })

  it('signs out and goes to the sign-in form', async () => {
    // GET /api/user must answer 401 after logout, as the real server does:
    // the sign-in page reads the user again when it mounts, and a user still
    // signed in would send it back to Profile
    let signedOut = false
    const fake = fakeApi({
      'GET /api/user': () => (signedOut ? visitor : signedInAs()),
      'GET /api/health': health,
      'POST /api/auth/logout': () => {
        signedOut = true
        return { status: 204 }
      },
    })
    const { router } = renderRoutes(routes, '/profile')

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(fake.mock.calls.some(([path, init]) => path === '/api/auth/logout' && init?.method === 'POST')).toBe(true)
  })

  it('goes to the sign-in form even if the session had already ended', async () => {
    // Logout answers 401, and so does GET /api/user after it
    let signedOut = false
    fakeApi({
      'GET /api/user': () => (signedOut ? visitor : signedInAs()),
      'GET /api/health': health,
      'POST /api/auth/logout': () => {
        signedOut = true
        return visitor
      },
    })
    renderRoutes(routes, '/profile')

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
  })

  it('saves each workout preference at once, one field per request', async () => {
    // GET /api/user answers with every preference sent so far: the user is
    // read again after the last change, and stale values would show again
    const fake = fakeApi({
      'GET /api/user': () => signedInAs(Object.assign({ ...testUser }, ...preferencesSent(fake))),
      'GET /api/health': health,
      'PATCH /api/user/preferences': { status: 204 },
    })
    renderRoutes(routes, '/profile')
    const user = userEvent.setup()

    const card = await screen.findByRole('tabpanel', { name: 'Workout' })
    expect(within(card).getByRole('combobox', { name: 'Weight unit' })).toHaveTextContent('Kilograms (kg)')
    expect(within(card).getByRole('combobox', { name: 'Default rest' })).toHaveTextContent('90 sec')
    expect(within(card).getByRole('combobox', { name: 'Weight step' })).toHaveTextContent('2.5 kg')
    expect(within(card).getByRole('combobox', { name: 'Countdown' })).toHaveTextContent('5 sec')

    await user.click(within(card).getByRole('combobox', { name: 'Default rest' }))
    await user.click(await screen.findByRole('option', { name: '2 min' }))
    await user.click(within(card).getByRole('combobox', { name: 'Countdown' }))
    await user.click(await screen.findByRole('option', { name: '10 sec' }))
    await user.click(within(card).getByRole('combobox', { name: 'Weight step' }))
    await user.click(await screen.findByRole('option', { name: '1.25 kg' }))
    const sound = within(card).getByRole('switch', { name: 'Sound' })
    expect(sound).toHaveAttribute('aria-checked', 'true')
    await user.click(sound)
    // waitFor: the cached user changes after an `await` in the hook
    await waitFor(() => expect(sound).toHaveAttribute('aria-checked', 'false'))
    expect(within(card).getByRole('combobox', { name: 'Default rest' })).toHaveTextContent('2 min')
    const rpe = within(card).getByRole('switch', { name: 'RPE in plans' })
    expect(rpe).toHaveAttribute('aria-checked', 'false')
    await user.click(rpe)
    await waitFor(() => expect(rpe).toHaveAttribute('aria-checked', 'true'))

    expect(preferencesSent(fake)).toEqual([{ default_rest_seconds: 120 }, { countdown_seconds: 10 }, { weight_step: '1.25' }, { timer_sound: false }, { show_rpe: true }])
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
