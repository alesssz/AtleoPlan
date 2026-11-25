/*
 * Profile's Sign out. With workouts not yet sent, or one in progress, it asks
 * first: they stay on this phone for their owner (deviceOwner()), and nobody
 * else signed in here sees them, so they are sent or resumed only after
 * signing in here again, not on another device.
 */
import { LogOut } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useSignOut } from '@/api/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { loadActiveSession, pendingSnapshot, subscribeToPending } from '@/components/workout/session-storage'

export function SignOutButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  // RequireAuth then goes to /login by itself
  const signOut = useSignOut()
  // Followed: the queue empties while Profile is open when the network returns
  const waiting = Object.keys(useSyncExternalStore(subscribeToPending, pendingSnapshot)).length
  // Profile cannot start or end a workout
  const [inProgress] = useState(() => loadActiveSession() !== null)

  const label = (
    <>
      <LogOut aria-hidden="true" />
      {t('profile.signOut')}
    </>
  )

  if (waiting === 0 && !inProgress) {
    // Wrapped: onClick would pass mutate() the click event
    return <Button variant="outline" size="xl" className={className} pending={signOut.isPending} onClick={() => signOut.mutate()}>{label}</Button>
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="xl" className={className} pending={signOut.isPending}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('profile.signOutTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {[waiting > 0 && t('profile.signOutWaiting', { count: waiting }), inProgress && t('profile.signOutInProgress')].filter(Boolean).join(' ')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('profile.signOutStay')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => signOut.mutate()}>{t('profile.signOut')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
