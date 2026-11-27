/*
 * What waits to reach the server (D1.6): nothing when everything is there;
 * Offline or Server offline, with how many changes wait; the changes
 * waiting; or what the server refused. The changes are the finished workouts
 * and, as one, the preferences changed on this phone. With changes waiting a
 * tap lists them, with what can be tried (send now, ask the server again); a
 * tap on a refusal shows which and why. Beside the logo on phones, under the
 * navigation from 640 px.
 */
import { CircleAlert, CloudOff, CloudUpload, ServerOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchHealth } from '@/api/health'
import type { SessionInput } from '@/api/sessions'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { loadPending } from '@/components/workout/session-storage'
import { formatClockTime, formatDuration, formatLongDate } from '@/lib/format'
import { isServerReachable } from '@/lib/http'
import { preferencesWaiting } from '@/lib/pending-preferences'
import type { RefusedWorkout } from '@/lib/sync-state'
import { QUEUE_RETRY_INTERVAL_MS, useSendPending } from '@/lib/usePendingSessions'
import { SERVER_CHECK_INTERVAL_MS } from '@/lib/useServerWatch'
import { useSyncState } from '@/lib/useSyncState'
import { cn } from '@/lib/utils'

interface SyncIndicatorProps {
  /** In the sidebar the text shows from 1024 px, as the navigation's labels. */
  place?: 'bar' | 'sidebar'
  className?: string
}

/** Amber for what waits, red for what needs a person: never the colour alone, each has an icon and a text. */
const TONES = {
  waiting: 'border-warning/40 bg-warning/15 text-warning hover:bg-warning/25 hover:text-warning',
  refused: 'border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25 hover:text-destructive',
}

export function SyncIndicator({ place = 'bar', className }: SyncIndicatorProps) {
  const { t, i18n } = useTranslation()
  const state = useSyncState()
  const sendPending = useSendPending()
  const [trying, setTrying] = useState(false)
  // When the last try by hand ended with nothing changed; forgotten when the
  // window closes
  const [failedTry, setFailedTry] = useState<Date | null>(null)
  const text = place === 'sidebar' ? 'sr-only lg:not-sr-only' : undefined
  // A pill, round where only the icon shows (the sidebar up to 1024 px)
  const pill = cn(
    'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0',
    place === 'sidebar' && 'w-9 justify-center px-0 lg:w-auto lg:px-3.5',
  )

  /**
   * Asks the server (an answer marks it reachable, and useServerWatch sends
   * the queue), or sends the queue. Success shows as the next state; a try
   * that changed nothing says so, with its time, so a second try is seen too.
   */
  async function tryNow(what: 'check' | 'send') {
    setTrying(true)
    setFailedTry(null)
    if (what === 'check') await fetchHealth().catch(() => undefined)
    else await sendPending()
    setTrying(false)
    const failed = what === 'check' ? !isServerReachable() : Object.keys(loadPending()).length > 0 || preferencesWaiting()
    if (failed) setFailedTry(new Date())
  }

  // The workouts, and the preferences as one change
  const count = state.kind === 'synced' || state.kind === 'refused' ? 0 : state.waiting + (state.settings ? 1 : 0)
  // Offline with nothing waiting: nothing to list nor to try
  const opensList = state.kind === 'unreachable' || state.kind === 'pending' || (state.kind === 'offline' && count > 0)

  return (
    // Always there, even empty, so a screen reader hears the changes
    <div role="status" className={cn('flex items-center', className)}>
      {state.kind === 'offline' && count === 0 && (
        <p title={t('sync.offlineHint')} className={cn(pill, TONES.waiting)}>
          <CloudOff aria-hidden="true" />
          <span className={text}>{t('sync.offline')}</span>
        </p>
      )}

      {/* One window for the three: it stays open while the state moves
          between them, a send that finds the server gone included */}
      {opensList && (
        <Dialog onOpenChange={(open) => { if (!open) setFailedTry(null) }}>
          <DialogTrigger asChild>
            <Button variant="ghost" title={t('sync.waitingHint')} className={cn(pill, TONES.waiting)}>
              {state.kind === 'offline' && <CloudOff aria-hidden="true" />}
              {state.kind === 'unreachable' && <ServerOff aria-hidden="true" />}
              {/* The spinner, not `pending`, which would lock the list while sending */}
              {state.kind === 'pending' && (state.sending ? <Spinner /> : <CloudUpload aria-hidden="true" />)}
              <span className={text}>
                {state.kind === 'offline' ? t('sync.offline') : state.kind === 'unreachable' ? t('sync.unreachable') : t('sync.pending', { count })}
              </span>
              {state.kind !== 'pending' && <WaitingCount count={count} className={text} />}
            </Button>
          </DialogTrigger>
          <DialogContent closeLabel={t('common.close')} className="flex flex-col gap-4 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-extrabold">{t('sync.waitingTitle')}</DialogTitle>
              <DialogDescription>
                {state.kind === 'offline' ? t('sync.waitingOffline') : state.kind === 'unreachable' ? t('sync.waitingUnreachable') : t('sync.waitingPending')}
              </DialogDescription>
            </DialogHeader>
            {count > 0
              ? (
                  <ul className="flex flex-col gap-3">
                    {state.settings && (
                      <li className="rounded-2xl border bg-muted/40 p-4">
                        <p className="font-semibold">{t('sync.settingsRow')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('sync.settingsNote')}</p>
                      </li>
                    )}
                    {state.queued.map(workout => <WorkoutRow key={workout.id} input={workout.input} />)}
                  </ul>
                )
              : <p className="text-sm text-muted-foreground">{t('sync.waitingNone')}</p>}
            {failedTry && (
              <FormBanner variant="error">
                {state.kind === 'offline'
                  ? t('sync.triedOffline', { time: formatClockTime(failedTry, i18n.language) })
                  : state.kind === 'unreachable'
                    ? t('sync.triedUnreachable', { time: formatClockTime(failedTry, i18n.language), seconds: SERVER_CHECK_INTERVAL_MS / 1000 })
                    : t('sync.triedPending', { time: formatClockTime(failedTry, i18n.language), seconds: QUEUE_RETRY_INTERVAL_MS / 1000 })}
              </FormBanner>
            )}
            <DialogFooter className="gap-3 sm:justify-start">
              {state.kind === 'unreachable' && (
                <Button size="xl" pending={trying} onClick={() => void tryNow('check')}>{t('sync.checkHint')}</Button>
              )}
              {state.kind === 'pending' && (
                <Button size="xl" pending={trying || state.sending} onClick={() => void tryNow('send')}>{t('sync.pendingHint')}</Button>
              )}
              <DialogClose asChild>
                <Button size="xl" variant="outline">{t('common.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {state.kind === 'refused' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" title={t('sync.refusedHint')} className={cn(pill, TONES.refused)}>
              <CircleAlert aria-hidden="true" />
              <span className={text}>{t('sync.refused')}</span>
            </Button>
          </DialogTrigger>
          <DialogContent closeLabel={t('common.close')} className="flex flex-col gap-4 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-extrabold">{t('sync.refusedTitle')}</DialogTitle>
              <DialogDescription>{t('sync.refusedText')}</DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-3">
              {state.workouts.map(workout => <RefusedRow key={workout.id} workout={workout} />)}
            </ul>
            <DialogFooter className="gap-3 sm:justify-start">
              <Button size="xl" pending={state.sending} onClick={() => void sendPending()}>{t('server.retry')}</Button>
              <DialogClose asChild>
                <Button size="xl" variant="outline">{t('common.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/**
 * How many changes wait, as a small number: the whole text would not fit
 * beside the logo on a phone. Read out whole.
 */
function WaitingCount({ count, className }: { count: number, className?: string }) {
  const { t } = useTranslation()
  if (count === 0) return null
  return (
    <>
      <span aria-hidden="true" className={cn('grid h-5 min-w-5 place-items-center rounded-full bg-warning px-1 text-xs font-bold text-background', className)}>
        {count}
      </span>
      <span className="sr-only">{`, ${t('sync.pending', { count })}`}</span>
    </>
  )
}

/** A refused workout: the row, and what the refusal means for the user. */
function RefusedRow({ workout }: { workout: RefusedWorkout }) {
  const { t } = useTranslation()
  const reason = workout.status === 403
    ? t('sync.reasonForbidden')
    : workout.status === 422 ? t('sync.reasonInvalid') : t('sync.reasonOther', { status: workout.status })
  return <WorkoutRow input={workout.input} note={reason} />
}

/** A workout on the phone, as history shows one: its day, its plan, when, how long. */
function WorkoutRow({ input, note }: { input: SessionInput, note?: string }) {
  const { t, i18n } = useTranslation()
  const when = formatLongDate(new Date(input.started_at), i18n.language)
  const length = input.duration_seconds === null ? null : formatDuration(input.duration_seconds, i18n.language)

  return (
    <li className="rounded-2xl border bg-muted/40 p-4">
      <p className="font-semibold">{input.day_name ?? t('workout.free')}</p>
      {input.plan_name && <p className="text-sm text-muted-foreground">{input.plan_name}</p>}
      <p className="mt-1 text-sm text-muted-foreground">{length ? `${when} · ${length}` : when}</p>
      {note && <p className="mt-1 text-sm">{note}</p>}
    </li>
  )
}
