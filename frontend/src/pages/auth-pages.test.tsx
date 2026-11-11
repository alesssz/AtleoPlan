/*
 * The sign-in screens, used the way a person would: typing, pressing the button,
 * reading what appears. They run with the real guards and router, and a fake API
 * (src/test/auth-helpers.tsx). docs/concepts/C1-frontend.md C1.10 and C1.13.
 *
 * userEvent simulates real typing and clicks, as Testing Library recommends;
 * its calls are asynchronous, hence the `await`s.
 */
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet } from 'react-router'
import { describe, expect, it, onTestFinished } from 'vitest'
import i18n from '@/i18n'
import { fakeApi, renderRoutes, sentBody, signedInAs, visitor, type FakeAnswer } from '@/test/auth-helpers'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireGuest } from '@/routes/RequireGuest'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { ResetPasswordPage } from './ResetPasswordPage'

/** The same shape as src/router.tsx, with plain text for the signed-in pages. */
const routes = [
  {
    element: <RequireGuest />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
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

/**
 * A fake GET /api/user that answers "nobody" until `signIn` is called: what the
 * server does, as the session starts between two calls.
 */
function fakeSession() {
  // Who the server would say is signed in
  let current: FakeAnswer = visitor
  return {
    answer: () => current,
    signIn: () => {
      current = signedInAs()
    },
  }
}

describe('LoginPage', () => {
  it('signs in and goes where the user was headed', async () => {
    const session = fakeSession()
    const fake = fakeApi({
      'GET /api/user': session.answer,
      // The fake server starts the session when it receives the form
      'POST /api/auth/login': () => {
        session.signIn()
        return { status: 200, body: { two_factor: false } }
      },
    })
    // A visitor opening /plans is sent to /login first
    const { router } = renderRoutes(routes, '/plans')

    await userEvent.type(await screen.findByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    // Back on the page first asked for
    expect(await screen.findByText('the plans')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plans')
    // `remember` is always on: a phone at the gym stays signed in
    expect(sentBody(fake, '/api/auth/login')).toEqual({ email: 'ann@example.com', password: 'secret-password', remember: true })
  })

  it('checks the fields before sending anything', async () => {
    const fake = fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('This field is required.')).toBeInTheDocument()
    // The field is marked for screen readers too
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    // Nothing went to the server
    expect(fake.mock.calls.some(([path]) => path === '/api/auth/login')).toBe(false)
  })

  it('shows the server\'s message under the field', async () => {
    fakeApi({
      'GET /api/user': visitor,
      'POST /api/auth/login': { status: 422, body: { message: 'Invalid', errors: { email: ['These credentials do not match our records.'] } } },
    })
    renderRoutes(routes, '/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('These credentials do not match our records.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('says so when there is no connection', async () => {
    fakeApi({ 'GET /api/user': visitor, 'POST /api/auth/login': 'network' })
    renderRoutes(routes, '/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'a-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No connection to the server')
  })

  it('says so after too many attempts', async () => {
    fakeApi({ 'GET /api/user': visitor, 'POST /api/auth/login': { status: 429, body: { message: 'Too Many Attempts.' } } })
    renderRoutes(routes, '/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'a-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
  })

  it('speaks the user\'s language', async () => {
    await i18n.changeLanguage('it')
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/login')

    expect(await screen.findByRole('button', { name: 'Accedi' })).toBeInTheDocument()
  })
})

describe('RegisterPage', () => {
  /**
   * Fills the form in.
   * @param confirmation what to type in "Repeat the password"
   */
  async function fillIn(confirmation: string) {
    await userEvent.type(await screen.findByLabelText('Name'), 'Ann')
    await userEvent.type(screen.getByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'long-enough-password')
    await userEvent.type(screen.getByLabelText('Repeat the password'), confirmation)
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
  }

  it('creates the account in the current language and enters the app', async () => {
    await i18n.changeLanguage('es')
    const session = fakeSession()
    const fake = fakeApi({
      'GET /api/user': session.answer,
      'POST /api/auth/register': () => {
        session.signIn()
        return { status: 201, body: {} }
      },
    })
    renderRoutes(routes, '/register')

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Ann')
    await userEvent.type(screen.getByLabelText('Correo'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'long-enough-password')
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'long-enough-password')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('home')).toBeInTheDocument()
    expect(sentBody(fake, '/api/auth/register')).toMatchObject({ name: 'Ann', email: 'ann@example.com', locale: 'es' })
  })

  it('catches two different passwords before sending', async () => {
    const fake = fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/register')

    await fillIn('something-else')

    expect(await screen.findByText('The two passwords don\'t match.')).toBeInTheDocument()
    expect(fake.mock.calls.some(([path]) => path === '/api/auth/register')).toBe(false)
  })

  it('shows an email already in use under the field', async () => {
    fakeApi({
      'GET /api/user': visitor,
      'POST /api/auth/register': { status: 422, body: { message: 'Invalid', errors: { email: ['Already in use.'] } } },
    })
    renderRoutes(routes, '/register')

    await fillIn('long-enough-password')

    expect(await screen.findByText('Already in use.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('Continue with Google', () => {
  it('links to Laravel with the language and the page the user was going to', async () => {
    await i18n.changeLanguage('it')
    fakeApi({ 'GET /api/user': visitor })
    // A visitor opening /plans is sent to /login, which remembers /plans
    renderRoutes(routes, '/plans')

    // A link, not a button: the browser itself goes to Google
    const link = await screen.findByRole('link', { name: 'Continua con Google' })
    expect(link).toHaveAttribute('href', '/auth/google/redirect?locale=it&from=%2Fplans')
  })

  it('is on the sign-up page too, without a page to come back to', async () => {
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/register')

    expect(await screen.findByRole('link', { name: 'Continue with Google' }))
      .toHaveAttribute('href', '/auth/google/redirect?locale=en')
  })

  it('shows that it is on its way, and is ready again after Back', async () => {
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/login')
    // jsdom cannot leave the page: stop the link's navigation, which would
    // only print "Not implemented: navigation". React's onClick still runs
    /** Cancels the browser's default action of a click. */
    const stayHere = (event: MouseEvent) => event.preventDefault()
    document.addEventListener('click', stayHere)
    // Removed when the test ends, even if it fails half-way: left behind, it
    // would cancel the clicks of every later test
    onTestFinished(() => document.removeEventListener('click', stayHere))

    const link = await screen.findByRole('link', { name: 'Continue with Google' })
    await userEvent.click(link)
    expect(link).toHaveAttribute('aria-busy', 'true')

    // The browser shows the page again from its back-forward cache
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    await waitFor(() => expect(link).not.toHaveAttribute('aria-busy'))
  })

  it('says why Google sign-in did not work, in the user\'s language', async () => {
    await i18n.changeLanguage('de')
    fakeApi({ 'GET /api/user': visitor })
    // Where Laravel sends the browser back to
    renderRoutes(routes, '/login?error=unverified')

    expect(await screen.findByRole('alert')).toHaveTextContent('Google hat diese E-Mail-Adresse nicht bestätigt')
  })

  it('shows the general message for a code it does not know', async () => {
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/login?error=something-new')

    expect(await screen.findByRole('alert')).toHaveTextContent('Signing in with Google didn\'t work')
  })

  it('shows nothing when there is no error', async () => {
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/login')

    await screen.findByRole('link', { name: 'Continue with Google' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ForgotPasswordPage', () => {
  it('confirms that the email was sent', async () => {
    const fake = fakeApi({ 'GET /api/user': visitor, 'POST /api/auth/forgot-password': { status: 200, body: { message: 'Sent' } } })
    renderRoutes(routes, '/forgot-password')

    await userEvent.type(await screen.findByLabelText('Email'), 'ann@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send the link' }))

    expect(await screen.findByRole('status')).toHaveTextContent('check your inbox')
    expect(sentBody(fake, '/api/auth/forgot-password')).toEqual({ email: 'ann@example.com' })
  })

  it('shows an unknown email under the field', async () => {
    fakeApi({
      'GET /api/user': visitor,
      'POST /api/auth/forgot-password': { status: 422, body: { message: 'Invalid', errors: { email: ['Not found.'] } } },
    })
    renderRoutes(routes, '/forgot-password')

    await userEvent.type(await screen.findByLabelText('Email'), 'nobody@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send the link' }))

    expect(await screen.findByText('Not found.')).toBeInTheDocument()
  })
})

describe('ResetPasswordPage', () => {
  /** The address the email's link opens. */
  const link = '/reset-password?token=the-token&email=ann%2Bgym%40example.com'

  /** Types the new password twice and submits. */
  async function chooseNewPassword() {
    await userEvent.type(await screen.findByLabelText('New password'), 'a-brand-new-password')
    await userEvent.type(screen.getByLabelText('Repeat the password'), 'a-brand-new-password')
    await userEvent.click(screen.getByRole('button', { name: 'Save the password' }))
  }

  it('sends the token and the email of the link, then goes to sign in', async () => {
    const fake = fakeApi({ 'GET /api/user': visitor, 'POST /api/auth/reset-password': { status: 200, body: { message: 'Done' } } })
    const { router } = renderRoutes(routes, link)

    await chooseNewPassword()

    expect(await screen.findByRole('status')).toHaveTextContent('Password changed')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(sentBody(fake, '/api/auth/reset-password')).toEqual({
      token: 'the-token',
      // The + came through the link intact
      email: 'ann+gym@example.com',
      password: 'a-brand-new-password',
      password_confirmation: 'a-brand-new-password',
    })
  })

  it('shows an expired link at the top, since the email is not a field here', async () => {
    fakeApi({
      'GET /api/user': visitor,
      'POST /api/auth/reset-password': { status: 422, body: { message: 'Invalid', errors: { email: ['This token is invalid.'] } } },
    })
    renderRoutes(routes, link)

    await chooseNewPassword()

    expect(await screen.findByRole('alert')).toHaveTextContent('This token is invalid.')
  })

  it('says so when the link has been cut short', async () => {
    fakeApi({ 'GET /api/user': visitor })
    renderRoutes(routes, '/reset-password?email=ann%40example.com')

    expect(await screen.findByRole('heading', { name: 'This link doesn\'t work' })).toBeInTheDocument()
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
  })
})
