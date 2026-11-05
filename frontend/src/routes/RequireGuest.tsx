/*
 * The opposite guard: the sign-in screens are only for visitors (src/router.tsx).
 * A signed-in user is sent into the app, to the address they were going to when
 * RequireAuth sent them here. That is also how signing in "moves on": the forms
 * do not navigate, they only update who is signed in, and this guard reacts.
 * docs/04-frontend.md 4.13.
 */
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Where a signed-in user goes from here: the address remembered in the router's
 * state by RequireAuth, or Home.
 * @param state what the router carries with the current address
 * @returns the address to go to
 */
function destinationFrom(state: unknown): string {
  // `state` can hold anything, so its type is checked before reading `from`
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' ? from : '/'
}

/** The sign-in screens, once the server has confirmed nobody is signed in. */
export function RequireGuest() {
  const { t } = useTranslation()
  // Who is signed in (src/api/auth.ts)
  const currentUser = useCurrentUser()
  // Its `state` holds where the user was going
  const location = useLocation()

  // Waiting for the first answer: a shape the size of the form, so a signed-in
  // user does not see the form flash on the way into the app
  if (currentUser.isPending) {
    return (
      <div role="status" className="grid min-h-dvh place-items-center p-5">
        <Skeleton className="h-96 w-full max-w-md rounded-3xl" />
        <span className="sr-only">{t('auth.checking')}</span>
      </div>
    )
  }

  // Signed in: into the app
  if (currentUser.data) {
    return <Navigate to={destinationFrom(location.state)} replace />
  }

  // A visitor, or a server that does not answer: the form. Submitting it then
  // says what is wrong
  return <Outlet />
}
