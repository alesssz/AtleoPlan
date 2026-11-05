/*
 * The two guards (RequireAuth, RequireGuest) with the real router: who gets sent
 * where, and what happens when the server does not answer. docs/04-frontend.md 4.13.
 *
 * screen.findBy… waits for an element to appear, because the answers arrive
 * later; a test using it is `async`. getBy… and queryBy… look only at what is
 * there now, and queryBy… gives null rather than failing when there is nothing.
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet } from 'react-router'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { fakeApi, renderRoutes, signedInAs, testUser, visitor } from '@/test/auth-helpers'
import { RequireAuth } from './RequireAuth'
import { RequireGuest } from './RequireGuest'

/**
 * A small route table with the same shape as src/router.tsx, with plain text in
 * place of the real pages: these tests are about the guards.
 */
const routes = [
  { element: <RequireGuest />, children: [{ path: 'login', element: <p>the sign-in form</p> }] },
  {
    element: <RequireAuth />,
    children: [{
      element: <Outlet />,
      children: [
        { index: true, element: <p>home</p> },
        { path: 'plans', element: <p>the plans</p> },
      ],
    }],
  },
]

describe('RequireAuth', () => {
  it('opens the page for a signed-in user', async () => {
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, '/plans')

    expect(await screen.findByText('the plans')).toBeInTheDocument()
  })

  it('sends a visitor to /login', async () => {
    fakeApi({ 'GET /api/user': visitor })
    const { router } = renderRoutes(routes, '/plans')

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows neither page while waiting for the answer', () => {
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, '/plans')

    expect(screen.queryByText('the plans')).not.toBeInTheDocument()
    expect(screen.queryByText('the sign-in form')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not take a server that is down for being signed out', async () => {
    // A variable the fake API reads, so the answer can change during the test
    let answer: typeof visitor | 'network' = 'network'
    fakeApi({ 'GET /api/user': () => (answer === 'network' ? { status: 500, body: {} } : answer) })
    const { router } = renderRoutes(routes, '/plans')

    // Not /login: a message and a way to try again
    const retry = await screen.findByRole('button', { name: 'Try again' })
    expect(router.state.location.pathname).toBe('/plans')

    // The server comes back, and now it says who is signed in
    answer = signedInAs()
    await userEvent.click(retry)

    expect(await screen.findByText('the plans')).toBeInTheDocument()
  })

  it('applies the language and the theme of the account', async () => {
    fakeApi({ 'GET /api/user': signedInAs({ ...testUser, locale: 'de', theme: 'light' }) })
    renderRoutes(routes, '/plans')

    await screen.findByText('the plans')

    expect(i18n.resolvedLanguage).toBe('de')
    // The dark class is what the dark theme is (src/theme/theme.ts)
    expect(document.documentElement).not.toHaveClass('dark')
  })
})

describe('RequireGuest', () => {
  it('opens the sign-in form for a visitor', async () => {
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/login')

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
  })

  it('sends a signed-in user into the app', async () => {
    fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, '/login')

    expect(await screen.findByText('home')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('still opens the form when the server is down, so it can say why', async () => {
    fakeApi({ 'GET /api/user': 'network' })
    renderRoutes(routes, '/login')

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
  })
})
