/*
 * The sign-in screens are for visitors only. A signed-in user goes where
 * RequireAuth sent them from: this is how signing in moves on, since the forms
 * only update who is signed in.
 */
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Skeleton } from '@/components/ui/skeleton'

/** RequireAuth's `from`, or Home. */
function destinationFrom(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' ? from : '/'
}

export function RequireGuest() {
  const { t } = useTranslation()
  const currentUser = useCurrentUser()
  const location = useLocation()

  // The form's size, so a signed-in user does not see it flash on the way in
  if (currentUser.isPending) {
    return (
      <div role="status" className="grid min-h-dvh place-items-center p-5">
        <Skeleton className="h-96 w-full max-w-md rounded-3xl" />
        <span className="sr-only">{t('auth.checking')}</span>
      </div>
    )
  }

  if (currentUser.data) {
    return <Navigate to={destinationFrom(location.state)} replace />
  }

  // Also when the server does not answer: submitting then says what is wrong
  return <Outlet />
}
