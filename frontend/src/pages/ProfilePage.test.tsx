/*
 * Profile: shows the account, and signs out. The guards around it are the real
 * ones, so signing out really ends on the sign-in form (docs/concepts/C1-frontend.md C1.13).
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes, signedInAs, visitor } from '@/test/auth-helpers'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireGuest } from '@/routes/RequireGuest'
import { ProfilePage } from './ProfilePage'

/** The same shape as src/router.tsx, with plain text for the sign-in form. */
const routes = [
  { element: <RequireGuest />, children: [{ path: 'login', element: <p>the sign-in form</p> }] },
  { element: <RequireAuth />, children: [{ path: 'profile', element: <ProfilePage /> }] },
]

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
})
