/*
 * The stopwatch of a timed set, docked where the rest bar goes so the sets
 * stay in sight. It opens on a countdown ("Get ready 5, 4, 3…") with a tick
 * for the last three seconds and a tone at the start; Start now skips it.
 * A hold with a target ("30 s dead hang") counts down the time left and stops
 * itself at the target, with the end-of-rest signal; a hold with no target
 * counts up until Stop. A race ("50 push-ups, as fast as possible") counts up,
 * shows the time to beat, turns red past it and never signals. Stop writes
 * the seconds into the set and ticks it, which starts the rest as ✓ does.
 */
import { Pause, Play, Square } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { countdownStep, restOver } from '@/lib/alarm'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { clock } from './clock'
import { WORKOUT_COLUMN } from './layout'
import { countdownLeft, stopwatchSeconds, stopwatchTargetAt, type Stopwatch } from './workout-session'

/** The countdown's last seconds that tick ("3, 2, 1"); 0 is the start. */
const TICKS = [3, 2, 1, 0]

interface StopwatchPanelProps {
  stopwatch: Stopwatch
  exerciseName: string
  setName: string
  /** A race: the reps to do (null when none typed); null for a hold. */
  race: { reps: number | null } | null
  /** Last time's time for this set, as text ("1:31"); null when none. */
  lastText: string | null
  /** Whether the countdown and the target are signalled with a sound and a vibration (Profile). */
  alarm: { sound: boolean, vibration: boolean }
  /** Stop, by hand or at a hold's target: the time goes into the set. */
  onStop: () => void
  /** Start now: the countdown is skipped. */
  onStartNow: () => void
  /** Pause (true) or Resume (false). */
  onPause: (paused: boolean) => void
  /** Cancel: the time is thrown away. */
  onCancel: () => void
}

export function StopwatchPanel({ stopwatch, exerciseName, setName, race, lastText, alarm, onStop, onStartNow, onPause, onCancel }: StopwatchPanelProps) {
  const { t } = useTranslation()
  // Four times a second: the seconds change on time, not up to a second late
  // as with the workout's clock. Refreshed at once when Start now moves the
  // start to the moment of the tap
  const now = useNow(250, stopwatch.started_at)
  const countdown = countdownLeft(stopwatch, now)
  const counting = countdown === 0
  const seconds = stopwatchSeconds(stopwatch, now)
  const { target } = stopwatch
  const paused = Boolean(stopwatch.paused_at)
  // A hold with a target ends there: it shows the time left, like the rest
  const endsAtTarget = race === null && target !== null
  // In a race, reaching the target means the time to beat is gone
  const raceOver = race !== null && target !== null && seconds >= target
  const big = !counting
    ? String(countdown)
    : endsAtTarget ? clock(Math.max(0, target - seconds)) : clock(seconds)
  // Paused first: the workout's pause holds a countdown too
  const targetText = paused
    ? t('workout.stopwatch.paused')
    : !counting
        ? t('workout.stopwatch.getReady')
        : target === null
          ? null
          : race
            ? (raceOver ? t('workout.stopwatch.over', { time: clock(seconds - target) }) : t('workout.stopwatch.toBeat', { time: clock(target) }))
            : t('workout.stopwatch.target', { time: clock(target) })
  // A hold's bar shrinks to its end; otherwise it fills towards the time to
  // beat, or with the current minute when there is none
  const share = target === null
    ? (seconds % 60) / 60
    : endsAtTarget ? 1 - Math.min(1, seconds / target) : Math.min(1, seconds / target)
  // The focus goes to the main button, Start now and then Stop (one element,
  // so the focus stays): ▶, which opened the panel, is disabled meanwhile,
  // and a keyboard user would be left nowhere
  const mainButton = useRef<HTMLButtonElement>(null)
  // The latest onStop, for the timer at the target: a new function every
  // render would re-arm it four times a second
  const stopRef = useRef(onStop)

  useEffect(() => {
    stopRef.current = onStop
  })

  useEffect(() => {
    mainButton.current?.focus()
  }, [])

  // The countdown's ticks and the start's tone. Only those still ahead: the
  // app reopened mid-hold stays quiet. The start may be a moment past when
  // Start now set it to now. None while paused: Resume moves the start, so new
  // timers
  const { sound, vibration } = alarm
  const startsAt = Date.parse(stopwatch.started_at)
  useEffect(() => {
    if (paused) return
    const timers = TICKS.flatMap((tick) => {
      const delay = startsAt - tick * 1000 - Date.now()
      if (delay < (tick === 0 ? -1000 : 0)) return []
      return [setTimeout(() => countdownStep({ sound, vibration }, tick === 0), Math.max(0, delay))]
    })
    return () => timers.forEach(clearTimeout)
  }, [startsAt, paused, sound, vibration])

  // A hold stops itself at its target, with the end-of-rest signal. None
  // while paused: Resume makes a new stopwatch object, so a new timer. Past
  // the target already (the app reopened after it), it stops at once and in
  // silence: the reducer writes the target, not the time since. Never in a
  // race, where the target is a time to beat
  useEffect(() => {
    if (!endsAtTarget) return
    const at = stopwatchTargetAt(stopwatch)
    if (at === null) return
    const delay = at - Date.now()
    if (delay <= 0) {
      stopRef.current()
      return
    }
    const timer = setTimeout(() => {
      restOver({ sound, vibration })
      stopRef.current()
    }, delay)
    return () => clearTimeout(timer)
  }, [stopwatch, endsAtTarget, sound, vibration])

  return (
    // `relative` keeps the sr-only live region inside the panel
    <section aria-label={t('workout.stopwatch.title')} className="relative border-t bg-card py-4">
      <div className={WORKOUT_COLUMN}>
        {/* The bar: lime; red once a race's time to beat is gone, as the
            line under the time */}
        <div aria-hidden="true" className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-[width] duration-200 ease-linear', raceOver ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${share * 100}%` }}
          />
        </div>

        {/* The set first: a long exercise name would otherwise cut it off
            on a phone, and the exercise is on screen above anyway. Cancel
            is quiet: not what a tired hand should find first. Its visible
            word starts its spoken name, so a voice command still finds it */}
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{setName}</span>
            {race?.reps ? ` · ${t('workout.stopwatch.goal', { count: race.reps })}` : ''}
            {` · ${exerciseName}`}
          </p>
          <Button variant="ghost" size="xl" className="shrink-0 px-3 text-muted-foreground" aria-label={t('workout.stopwatch.cancel')} onClick={onCancel}>
            {t('workout.stopwatch.cancelShort')}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {/* role="timer": screen readers do not read it every second */}
            <span role="timer" className={cn('block font-heading text-5xl leading-none font-extrabold tabular-nums', paused && 'animate-pulse text-muted-foreground', !counting && 'text-primary')}>
              {big}
            </span>
            {targetText !== null && (
              <span className={cn('mt-1 block text-sm font-semibold', raceOver && !paused ? 'text-destructive' : 'text-muted-foreground')}>
                {targetText}
              </span>
            )}
            {lastText !== null && <span className="block text-sm text-muted-foreground">{t('workout.stopwatch.last', { time: lastText })}</span>}
          </div>
          {/* No pause during the countdown: it counts nothing */}
          {counting && (
            <Button variant="outline" size="icon-xl" className="size-14 shrink-0 rounded-2xl" aria-label={paused ? t('workout.stopwatch.resume') : t('workout.stopwatch.pause')} onClick={() => onPause(!paused)}>
              {paused ? <Play aria-hidden="true" className="fill-current" /> : <Pause aria-hidden="true" className="fill-current" />}
            </Button>
          )}
          <Button ref={mainButton} size="xl" className="h-14 shrink-0 rounded-2xl px-5 text-lg" onClick={counting ? onStop : onStartNow}>
            {counting ? <Square aria-hidden="true" className="fill-current" /> : <Play aria-hidden="true" className="fill-current" />}
            {counting ? t('workout.stopwatch.stop') : t('workout.stopwatch.startNow')}
          </Button>
        </div>
      </div>
      {/* Read out once, when the countdown begins */}
      <p aria-live="polite" className="sr-only">{counting || paused ? '' : t('workout.stopwatch.getReady')}</p>
    </section>
  )
}
