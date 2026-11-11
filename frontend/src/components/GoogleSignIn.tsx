/*
 * "Continue with Google" (FEAT-9, docs/design/D1-ui.md D1.4.1): the button of
 * the sign-in and sign-up pages, and the message shown when Google sends the
 * person back with an error. How it works end to end:
 * docs/concepts/C1-frontend.md C1.13.7 and docs/concepts/C2-backend.md C2.7.8.
 *
 * The button is a plain link, not a request: the browser itself must go to
 * Google and come back, so React cannot do it with fetch(). The link goes to
 * Laravel (/auth/google/redirect, forwarded by Vite like /api), which sends
 * the browser on to Google; Google sends it back to Laravel, which starts the
 * session and sends it to the React app again: to the page the person wanted,
 * or to /login?error=… . The whole app loads again then, and RequireAuth
 * finds the user through GET /api/user, as after any reload.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useSearchParams } from 'react-router'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FALLBACK_LANGUAGE, isLanguage } from '@/i18n/languages'

/**
 * The codes Laravel puts in /login?error=… (backend's
 * app/Enums/SocialSignInError.php), each with its sentence. `as const` keeps
 * the exact strings as types, so t() can check the keys exist in every
 * language file; a key built with a template string could not be checked.
 */
const ERROR_MESSAGES = {
  cancelled: 'auth.google.errors.cancelled',
  failed: 'auth.google.errors.failed',
  unverified: 'auth.google.errors.unverified',
  disabled: 'auth.google.errors.disabled',
} as const

/**
 * The address the button opens: Laravel's first stop, with the app's
 * language (for a new account) and the page to come back to.
 * @param locale the language the app is showing
 * @param from the page the person was trying to open, if any
 * @returns a path such as `/auth/google/redirect?locale=it&from=%2Fplans`
 */
function redirectHref(locale: string, from: string | undefined): string {
  // URLSearchParams writes a query string and encodes each value, so a
  // `/` or `&` in `from` cannot break it
  const query = new URLSearchParams({ locale })
  if (from) query.set('from', from)
  return `/auth/google/redirect?${query.toString()}`
}

/**
 * Google's "G", in its four colours. Google's sign-in guidelines ask for this
 * mark on the button, unchanged, and Lucide has no brand logos, so it is
 * drawn here. aria-hidden: the button's text already says "Google".
 *
 * Its own width and height, 20 px, are a floor: the button resizes its icons
 * with CSS (size-5 on xl), which wins over these attributes. Without them an
 * <svg> with only a viewBox grows as wide as its container (H3.28.6).
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * "or", a line, and the "Continue with Google" button, for under a form.
 *
 * After signing in, the person lands on the page they were trying to open
 * (D1.4.1): the one RequireAuth remembered in the router's state when it
 * sent them to sign in (src/routes/RequireAuth.tsx), handed to Laravel in
 * the link, since a trip to Google loses the router's state.
 *
 * While the browser is on its way to Google, which can take a second, the
 * button shows a spinner in place of the "G" and says it is busy (C1.20).
 */
export function GoogleSignInButton() {
  const { t, i18n } = useTranslation()
  // The router's state: RequireAuth leaves `from` in it
  const location = useLocation()
  // `state` can hold anything, so its type is checked before reading `from`
  const state = (location.state as { from?: unknown } | null)?.from
  // The page to come back to, or none (Home)
  const from = typeof state === 'string' ? state : undefined
  // true from the click until the page is left
  const [leaving, setLeaving] = useState(false)
  // The language in use now, as RegisterPage sends it (D2.4)
  const locale = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  // Coming back with the browser's Back button from Google's page, the
  // browser may show this page exactly as it was left (its "back-forward
  // cache"), spinner included. `pageshow` fires then, with `persisted` true:
  // the button is made ready again. useEffect adds the listener once the
  // component is on screen; the function it returns removes it when the
  // component goes (C1.4)
  useEffect(() => {
    /** Resets the button when the page comes back from the cache. */
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setLeaving(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return (
    <div className="mt-5 flex flex-col gap-4">
      {/* "or" between two lines. The lines are decoration (aria-hidden),
          the word is read */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        {t('auth.google.or')}
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      {/* A real link (<a href>) drawn as a button: asChild hands the button's
          look to its one child (src/components/ui/button.tsx). Not React
          Router's <Link>, which would look for a React page at /auth. The
          button's `pending` is not for asChild, so the spinner and
          aria-busy are put here by hand */}
      <Button asChild variant="outline" size="xl">
        <a href={redirectHref(locale, from)} aria-busy={leaving || undefined} onClick={() => setLeaving(true)}>
          {leaving ? <Spinner /> : <GoogleMark />}
          {t('auth.google.continue')}
        </a>
      </Button>
    </div>
  )
}

/**
 * The reason Google sign-in failed, at the top of the sign-in form, read from
 * the address (`/login?error=cancelled`). Nothing when there is no error.
 * An unknown code shows the general "didn't work" sentence.
 */
export function GoogleSignInError() {
  const { t } = useTranslation()
  // The address's query string; [0] of the pair, the setter is not needed
  const [searchParams] = useSearchParams()
  // The code, or null when the address has none
  const code = searchParams.get('error')

  if (code === null) return null

  // `code in ERROR_MESSAGES` checks the object has that key; TypeScript then
  // needs to be told the code is one of them (`as keyof typeof …`)
  const key = code in ERROR_MESSAGES ? ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] : ERROR_MESSAGES.failed
  return <FormBanner variant="error">{t(key)}</FormBanner>
}
