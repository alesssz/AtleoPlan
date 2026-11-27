/*
 * Above every signed-in page (D1.6): while there is no network or no server,
 * what happens to the workouts meanwhile; then, when the app sends them by
 * itself, that it is sending and how many it saved, since the warning above
 * disappears with no other sign. Workouts only, since they are what waits in
 * a queue; other changes made offline are not saved (C1.11).
 */
import { CircleCheck, CloudOff, ServerOff } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { sendProgress, subscribeToSendProgress } from '@/lib/pending-sessions'
import { useSyncState } from '@/lib/useSyncState'
import { cn } from '@/lib/utils'

/** Long enough to be read at a glance, short enough not to linger. */
export const DONE_VISIBLE_MS = 6_000

const TONES = {
  waiting: 'border-warning/40 bg-warning/10 text-warning',
  sending: 'border-border bg-muted/60 text-foreground',
  done: 'border-primary/40 bg-primary/10 text-primary',
}

export function ConnectionBanner({ className }: { className?: string }) {
  const { t } = useTranslation()
  const state = useSyncState()
  const progress = useSyncExternalStore(subscribeToSendProgress, sendProgress)

  // Only rounds that end while the page is open: one from before (Finish, on
  // the way to the summary) was said by its own page
  const [seenRound, setSeenRound] = useState(() => progress.announced?.round ?? 0)
  const [savedNow, setSavedNow] = useState<number | null>(null)
  const announced = progress.announced
  if (announced && announced.round !== seenRound) {
    setSeenRound(announced.round)
    setSavedNow(announced.sent > 0 ? announced.sent : null)
  }

  useEffect(() => {
    if (savedNow === null) return
    const timer = window.setTimeout(() => setSavedNow(null), DONE_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [savedNow, seenRound])

  let message: { tone: keyof typeof TONES, icon: React.ReactNode, text: string } | null = null
  if (state.kind === 'offline') {
    message = { tone: 'waiting', icon: <CloudOff aria-hidden="true" className="size-4" />, text: t('sync.offlineBanner') }
  }
  else if (state.kind === 'unreachable') {
    message = { tone: 'waiting', icon: <ServerOff aria-hidden="true" className="size-4" />, text: t('sync.unreachableBanner') }
  }
  // Workouts only: preferences go along without a word
  else if (progress.announcing && state.kind === 'pending' && state.waiting > 0) {
    message = { tone: 'sending', icon: <Spinner className="size-4" />, text: t('sync.sendingBanner', { count: state.waiting }) }
  }
  else if (savedNow !== null) {
    message = { tone: 'done', icon: <CircleCheck aria-hidden="true" className="size-4" />, text: t('sync.doneBanner', { count: savedNow }) }
  }

  return (
    // Always there, even empty, so a screen reader hears "sending" and "done"
    <div role="status" className={cn(message && className)}>
      {message && (
        <p className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium', TONES[message.tone])}>
          <span className="mt-0.5 shrink-0">{message.icon}</span>
          {message.text}
        </p>
      )}
    </div>
  )
}
