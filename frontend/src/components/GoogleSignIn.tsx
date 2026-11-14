/*
 * "Continue with Google".
 *
 * A plain link, not a request: the browser itself goes to Google through
 * Laravel and comes back to the app, which then loads afresh and finds the
 * user as after any reload.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useSearchParams } from 'react-router'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FALLBACK_LANGUAGE, isLanguage } from '@/i18n/languages'

/**
 * backend app/Enums/SocialSignInError.php. Literal keys, so t() checks them;
 * a template string could not be checked.
 */
const ERROR_MESSAGES = {
  cancelled: 'auth.google.errors.cancelled',
  failed: 'auth.google.errors.failed',
  unverified: 'auth.google.errors.unverified',
  disabled: 'auth.google.errors.disabled',
} as const

/**
 * The app's language, for a new account, and the page to come back to:
 * `/auth/google/redirect?locale=it&from=%2Fplans`.
 */
function redirectHref(locale: string, from: string | undefined): string {
  const query = new URLSearchParams({ locale })
  if (from) query.set('from', from)
  return `/auth/google/redirect?${query.toString()}`
}

/**
 * Google's guidelines ask for this mark, unchanged, and Lucide has no brand
 * logos. The width and height are a floor: without them an <svg> with only a
 * viewBox grows as wide as its container.
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
 * The page RequireAuth remembered goes along in the link, since a trip to
 * Google loses the router's state. Until the browser has left, the button shows
 * it is busy.
 */
export function GoogleSignInButton() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const state = (location.state as { from?: unknown } | null)?.from
  const from = typeof state === 'string' ? state : undefined
  const [leaving, setLeaving] = useState(false)
  const locale = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  // Back from Google's page, the browser may restore this page from its
  // back-forward cache, spinner included
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setLeaving(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        {t('auth.google.or')}
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      {/* Not a router <Link>: /auth is Laravel's. `pending` does not work
          with asChild, hence the spinner and aria-busy by hand */}
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
 * From `/login?error=cancelled`; an unknown code gets the general sentence.
 */
export function GoogleSignInError() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('error')

  if (code === null) return null

  const key = code in ERROR_MESSAGES ? ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] : ERROR_MESSAGES.failed
  return <FormBanner variant="error">{t(key)}</FormBanner>
}
