/*
 * The stopwatch of a timed set, docked where the rest bar goes so the sets
 * stay in sight. A hold ("30 s dead hang") counts up to a target and signals
 * it; a race ("50 push-ups, as fast as possible") shows the time to beat,
 * turns red past it and never signals. Stop writes the seconds into the set
 * and ticks it, which starts the rest as ✓ does.
 */
import { Pause, Play, Square } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { restOver } from '@/lib/alarm'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { clock } from './clock'
import { WORKOUT_COLUMN } from './layout'
import { stopwatchSeconds, stopwatchTargetAt, type Stopwatch } from './workout-session'

interface StopwatchPanelProps {
  stopwatch: Stopwatch
  exerciseName: string
  setName: string
  /** A race: the reps to do (null when none typed); null for a hold. */
  race: { reps: number | null } | null
  /** Last time's time for this set, as text ("1:31"); null when none. */
  lastText: string | null
  /** Whether the target is signalled with a sound and a vibration (Profile). */
  alarm: { sound: boolean, vibration: boolean }
  /** Stop: the time goes into the set. */
  onStop: () => void
  /** Pause (true) or Resume (false). */
  onPause: (paused: boolean) => void
  /** Cancel: the time is thrown away. */
  onCancel: () => void
}

export function StopwatchPanel({ stopwatch, exerciseName, setName, race, lastText, alarm, onStop, onPause, onCancel }: StopwatchPanelProps) {
  const { t } = useTranslation()
  // Four times a second: the seconds change on time, not up to a second late
  // as with the workout's clock
  const now = useNow(250)
  const seconds = stopwatchSeconds(stopwatch, now)
  const { target } = stopwatch
  const paused = Boolean(stopwatch.paused_at)
  // In a race, reaching the target means the time to beat is gone
  const reached = target !== null && seconds >= target
  const targetText = paused
    ? t('workout.stopwatch.paused')
    : target === null
      ? null
      : race
        ? (reached ? t('workout.stopwatch.over', { time: clock(seconds - target) }) : t('workout.stopwatch.toBeat', { time: clock(target) }))
        : (reached ? t('workout.stopwatch.reached') : t('workout.stopwatch.target', { time: clock(target) }))
  // The share of the target, or of the current minute when there is none
  const share = target !== null ? Math.min(1, seconds / target) : (seconds % 60) / 60
  // The focus goes to Stop: ▶, which opened the panel, is disabled meanwhile,
  // and a keyboard user would be left nowhere
  const stopButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    stopButton.current?.focus()
  }, [])

  // The signal at the target. None while paused: Resume makes a new stopwatch
  // object, so a new timer. None when the moment is already past (the app
  // reopened after it): the signal would come late. Never in a race, where
  // the target is a time not to reach
  const { sound, vibration } = alarm
  const isRace = race !== null
  useEffect(() => {
    const at = stopwatchTargetAt(stopwatch)
    if (at === null || isRace) return
    const delay = at - Date.now()
    if (delay < 0) return
    const timer = setTimeout(() => restOver({ sound, vibration }), delay)
    return () => clearTimeout(timer)
  }, [stopwatch, sound, vibration, isRace])

  return (
    // `relative` keeps the sr-only live region inside the panel
    <section aria-label={t('workout.stopwatch.title')} className="relative border-t bg-card py-4">
      <div className={WORKOUT_COLUMN}>
        {/* The bar: lime up to the target; red once a race's time to beat
            is gone, as the line under the time */}
        <div aria-hidden="true" className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-[width] duration-200 ease-linear', race && reached ? 'bg-destructive' : 'bg-primary')}
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
            <span role="timer" className={cn('block font-heading text-5xl leading-none font-extrabold tabular-nums', paused && 'animate-pulse text-muted-foreground')}>
              {clock(seconds)}
            </span>
            {targetText !== null && (
              <span className={cn('mt-1 block text-sm font-semibold', paused || !reached ? 'text-muted-foreground' : race ? 'text-destructive' : 'text-primary')}>
                {targetText}
              </span>
            )}
            {lastText !== null && <span className="block text-sm text-muted-foreground">{t('workout.stopwatch.last', { time: lastText })}</span>}
          </div>
          <Button variant="outline" size="icon-xl" className="size-14 shrink-0 rounded-2xl" aria-label={paused ? t('workout.stopwatch.resume') : t('workout.stopwatch.pause')} onClick={() => onPause(!paused)}>
            {paused ? <Play aria-hidden="true" className="fill-current" /> : <Pause aria-hidden="true" className="fill-current" />}
          </Button>
          <Button ref={stopButton} size="xl" className="h-14 shrink-0 rounded-2xl px-5 text-lg" onClick={onStop}>
            <Square aria-hidden="true" className="fill-current" />
            {t('workout.stopwatch.stop')}
          </Button>
        </div>
      </div>
      {/* Read out once, when the target of a hold is reached */}
      <p aria-live="polite" className="sr-only">{reached && !race ? t('workout.stopwatch.reached') : ''}</p>
    </section>
  )
}
