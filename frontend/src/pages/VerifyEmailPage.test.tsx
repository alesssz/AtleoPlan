/*
 * "Confirm your email", in place of every page until the address is
 * confirmed, with the real guard and a fake API.
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireGuest } from '@/routes/RequireGuest'
import { fakeApi, renderRoutes, signedInAs, testUser, visitor, type FakeAnswer } from '@/test/auth-helpers'

/** The shape of src/router.tsx, with placeholder pages. */
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

const unverified = signedInAs({ ...testUser, email_verified: false })

describe('VerifyEmailPage', () => {
  it('stands in for every page until the address is confirmed', async () => {
    fakeApi({ 'GET /api/user': unverified })
    const { router } = renderRoutes(routes, '/plans')

    expect(await screen.findByRole('heading', { name: 'Confirm your email' })).toBeInTheDocument()
    expect(screen.getByText(/We sent a link to ann@example.com/)).toBeInTheDocument()
    expect(screen.queryByText('the plans')).not.toBeInTheDocument()
    // The address stays, so the page opens once confirmed
    expect(router.state.location.pathname).toBe('/plans')
  })

  it('opens the page once the server says it is confirmed', async () => {
    let answer: FakeAnswer = unverified
    fakeApi({ 'GET /api/user': () => answer })
    renderRoutes(routes, '/plans')

    await userEvent.click(await screen.findByRole('button', { name: 'I\'ve confirmed it' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Not confirmed yet')

    // The link opened in another browser
    answer = signedInAs()
    await userEvent.click(screen.getByRole('button', { name: 'I\'ve confirmed it' }))

    expect(await screen.findByText('the plans')).toBeInTheDocument()
  })

  it('sends the link again, and says when that is too often', async () => {
    let sendAnswer: FakeAnswer = { status: 204 }
    const fake = fakeApi({ 'GET /api/user': unverified, 'POST /api/user/verification-email': () => sendAnswer })
    renderRoutes(routes, '/')

    await userEvent.click(await screen.findByRole('button', { name: 'Send the link again' }))

    expect(await screen.findByText('Sent: check your inbox, and the spam folder too.')).toBeInTheDocument()
    expect(fake.mock.calls.some(([path, init]) => path === '/api/user/verification-email' && init?.method === 'POST')).toBe(true)

    sendAnswer = { status: 429, body: { message: 'Too Many Attempts.' } }
    await userEvent.click(screen.getByRole('button', { name: 'Send the link again' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
  })

  it('signs out, for an account made with the wrong address', async () => {
    let userAnswer: FakeAnswer = unverified
    fakeApi({
      'GET /api/user': () => userAnswer,
      'POST /api/auth/logout': () => {
        userAnswer = visitor
        return { status: 204 }
      },
    })
    const { router } = renderRoutes(routes, '/')

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('the sign-in form')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('speaks the account\'s language', async () => {
    fakeApi({ 'GET /api/user': signedInAs({ ...testUser, email_verified: false, locale: 'it' }) })
    renderRoutes(routes, '/')

    expect(await screen.findByRole('heading', { name: 'Conferma la tua email' })).toBeInTheDocument()
  })

  it('does not stop a user kept from before the field existed', async () => {
    const earlier = Object.fromEntries(Object.entries(testUser).filter(([key]) => key !== 'email_verified'))
    fakeApi({ 'GET /api/user': { status: 200, body: { data: earlier } } })
    renderRoutes(routes, '/plans')

    expect(await screen.findByText('the plans')).toBeInTheDocument()
  })
})
