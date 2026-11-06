/*
 * The guard of the signed-in app: a route whose element is this component opens
 * only for a signed-in user (src/router.tsx). A visitor is sent to /login, which
 * remembers where they were going. docs/concepts/C1-frontend.md C1.13.
 *
 * This is about what the user sees, not about security. The real protection is
 * on the server, where `auth:sanctum` refuses the data: code in the browser can
 * always be changed by whoever runs it.
 */
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccountPreferences } from './useAccountPreferences'

/** The signed-in app, once the server has confirmed who is asking. */
export function RequireAuth() {
  const { t } = useTranslation()
  // Who is signed in: the same cached answer for every component (src/api/auth.ts)
  const currentUser = useCurrentUser()
  // The address being opened, to come back to after signing in
  const location = useLocation()
  // The account's language and theme, applied to this device
  useAccountPreferences(currentUser.data)

  // 1. Waiting for the first answer: grey shapes, never a spinner over the page
  // (D1.6). Drawing the app or /login here would flash the wrong screen
  if (currentUser.isPending) {
    return (
      <div role="status" className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <span className="sr-only">{t('auth.checking')}</span>
      </div>
    )
  }

  // 2. A visitor: on to /login. `state` travels with the address and is read by
  // RequireGuest after signing in; `replace` keeps the protected address out of
  // the browser's history, or Back would bounce here again
  if (currentUser.data === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // 3. No answer, and no user from an earlier one: the server is unreachable.
  // Not a reason to send someone to /login: they may well be signed in. With a
  // user already known, a failed refresh changes nothing and the app stays open
  if (currentUser.data === undefined) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">{t('auth.unreachableTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.unreachableText')}</p>
        {/* refetch() returns a Promise; `void`: we do not wait for it on
            purpose, since TanStack Query updates the state by itself */}
        <Button size="xl" className="self-start" onClick={() => void currentUser.refetch()} disabled={currentUser.isFetching}>
          {t('server.retry')}
        </Button>
      </main>
    )
  }

  // 4. Signed in: the matching child route (the app's frame and its pages)
  return <Outlet />
}
