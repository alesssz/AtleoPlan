/*
 * The signed-in app's guard: a visitor goes to /login, which remembers where
 * they were going. A matter of what the user sees, not of security:
 * `auth:sanctum` on the server protects the data.
 */
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePendingSessions } from '@/lib/usePendingSessions'
import { useAccountPreferences } from './useAccountPreferences'

export function RequireAuth() {
  const { t } = useTranslation()
  const currentUser = useCurrentUser()
  const location = useLocation()
  useAccountPreferences(currentUser.data)
  usePendingSessions(Boolean(currentUser.data))

  // Skeletons, never a spinner: the app or /login here would flash the wrong
  // screen
  if (currentUser.isPending) {
    return (
      <div role="status" className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <span className="sr-only">{t('auth.checking')}</span>
      </div>
    )
  }

  // `replace`: Back must not bounce here again. RequireGuest reads `from`
  // after signing in
  if (currentUser.data === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // No answer and no earlier user: the server is unreachable, which is no
  // reason to send to /login. With a user already known, a failed refresh
  // leaves the app open
  if (currentUser.data === undefined) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">{t('auth.unreachableTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.unreachableText')}</p>
        <Button size="xl" className="self-start" onClick={() => void currentUser.refetch()} pending={currentUser.isFetching}>
          {t('server.retry')}
        </Button>
      </main>
    )
  }

  return <Outlet />
}
