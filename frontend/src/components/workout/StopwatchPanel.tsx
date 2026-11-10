/*
 * The stopwatch of a timed set, full screen (docs/design/D1-ui.md D1.4.9):
 * opened by ▶ on a set of an exercise logged by time (SetRow.tsx), for a
 * hold ("30 s dead hang") and for a race against the clock ("50 push-ups,
 * as fast as possible") alike.
 *
 * - **The time** counts up, large, in the middle of a ring.
 * - **The ring** fills up to the target: the seconds that were in the set's
 *   field at the start, the plan's or last time's. Reaching it plays the
 *   end-of-rest signal (src/lib/alarm.ts, with the user's sound and
 *   vibration) and says "Target reached". With no target, the ring goes
 *   round once a minute, as a stopwatch's hand.
 * - **Last time**, under it, to beat.
 * - **A race** (`race`: an exercise counted in reps, done as fast as
 *   possible, C1.17.9): the reps to do under the set's name, "50 reps";
 *   the target is a time to beat, "To beat 1:12", then "0:05 over" once
 *   past it, with no signal: reaching it is not the goal there.
 * - **Stop** writes the time into the set and ticks it, which starts the
 *   rest as ✓ does; **Cancel** throws the time away.
 *
 * The time is worked out from the moment of the start, kept in the workout
 * (`session.stopwatch`, workout-session.ts): with the screen off, or the app
 * closed and opened again, it is still right. How it works:
 * docs/concepts/C1-frontend.md C1.17.8.
 */
import { Square } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { restOver } from '@/lib/alarm'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { clock } from './clock'
import { stopwatchSeconds, type Stopwatch } from './workout-session'

/** The ring's radius and the width of its line, in the SVG's units. */
const RADIUS = 110
const STROKE = 12
/** The ring's length: 2πr. The filled part is a dash of this line. */
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Props of StopwatchPanel. */
interface StopwatchPanelProps {
  /** The stopwatch running. */
  stopwatch: Stopwatch
  /** The exercise's name, the panel's title. */
  exerciseName: string
  /** The set's name: "Set 1". */
  setName: string
  /** A race: the reps to do (null when none typed); null for a hold. */
  race: { reps: number | null } | null
  /** Last time's time for this set, as text ("1:31"); null when none. */
  lastText: string | null
  /** Whether the target is signalled with a sound and a vibration (Profile). */
  alarm: { sound: boolean, vibration: boolean }
  /** Stop: the time goes into the set. */
  onStop: () => void
  /** Cancel: the time is thrown away. */
  onCancel: () => void
}

/** The full-screen stopwatch. */
export function StopwatchPanel({ stopwatch, exerciseName, setName, race, lastText, alarm, onStop, onCancel }: StopwatchPanelProps) {
  const { t } = useTranslation()
  // The current moment, four times a second: the seconds change on time,
  // not up to a second late as with the workout's clock
  const now = useNow(250)
  // The seconds so far
  const seconds = stopwatchSeconds(stopwatch, now)
  const { target } = stopwatch
  // Whether the target is reached: in a race, the time to beat is gone
  const reached = target !== null && seconds >= target
  // The line under the time: the target, then reached; in a race, the
  // time to beat, then how far past it
  const targetText = target === null
    ? null
    : race
      ? (reached ? t('workout.stopwatch.over', { time: clock(seconds - target) }) : t('workout.stopwatch.toBeat', { time: clock(target) }))
      : (reached ? t('workout.stopwatch.reached') : t('workout.stopwatch.target', { time: clock(target) }))
  // How much of the ring is filled, 0 to 1: the share of the target, or
  // the seconds of the current minute when there is none
  const share = target !== null ? Math.min(1, seconds / target) : (seconds % 60) / 60

  // The signal at the target: a timer set for that moment, as the rest's
  // end is (WorkoutScreen). Not when the moment is already past, as when the
  // app is opened again after it: the signal would come late, and twice.
  // Not in a race either: there the target is a time not to reach
  const { sound, vibration } = alarm
  const isRace = race !== null
  useEffect(() => {
    if (stopwatch.target === null || isRace) return
    const delay = Date.parse(stopwatch.started_at) + stopwatch.target * 1000 - Date.now()
    if (delay < 0) return
    const timer = setTimeout(() => restOver({ sound, vibration }), delay)
    return () => clearTimeout(timer)
  }, [stopwatch, sound, vibration, isRace])

  return (
    // Always open while it exists: WorkoutScreen draws it only with a
    // stopwatch running. Escape and a tap outside do nothing
    // (preventDefault): a time is ended by Stop or Cancel only, never lost
    // by a stray touch
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={event => event.preventDefault()}
        onInteractOutside={event => event.preventDefault()}
        // Full screen: the dialog's box stretched to the whole viewport
        className="flex h-dvh max-h-none w-full max-w-none flex-col items-center justify-between gap-6 rounded-none p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-0 sm:max-w-none"
      >
        {/* The exercise and the set */}
        <div className="flex flex-col items-center gap-1 text-center">
          <DialogTitle className="font-heading text-xl font-extrabold">{exerciseName}</DialogTitle>
          <DialogDescription className="text-base">
            {setName}
            {race?.reps ? ` · ${t('workout.stopwatch.goal', { count: race.reps })}` : ''}
          </DialogDescription>
        </div>

        {/* The ring and the time. The SVG is a picture (aria-hidden); the
            time is a timer, which screen readers do not read every second */}
        <div className="relative grid size-64 place-items-center sm:size-72">
          <svg aria-hidden="true" viewBox="0 0 256 256" className="absolute inset-0 size-full -rotate-90">
            {/* The track, then the part filled: a dash as long as the
                share, the rest of the circle a gap (stroke-dasharray) */}
            <circle cx="128" cy="128" r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-muted" />
            <circle
              cx="128"
              cy="128"
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - share)}
              // Lime; red once a race's time to beat is gone, as the line under the time
              className={cn('transition-[stroke-dashoffset] duration-200 ease-linear', race && reached ? 'stroke-destructive' : 'stroke-primary')}
            />
          </svg>
          <div className="flex flex-col items-center gap-1">
            <span role="timer" className="font-heading text-6xl font-extrabold tabular-nums">{clock(seconds)}</span>
            {targetText !== null && (
              <span className={cn('text-base font-semibold', !reached ? 'text-muted-foreground' : race ? 'text-destructive' : 'text-primary')}>
                {targetText}
              </span>
            )}
          </div>
        </div>
        {/* Read out once, when the target of a hold is reached */}
        <p aria-live="polite" className="sr-only">{reached && !race ? t('workout.stopwatch.reached') : ''}</p>

        {/* Last time, then the two buttons, as wide as the phone */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          {lastText !== null && <p className="text-center text-muted-foreground">{t('workout.stopwatch.last', { time: lastText })}</p>}
          <Button size="xl" className="h-16 w-full text-lg" onClick={onStop}>
            <Square aria-hidden="true" className="fill-current" />
            {t('workout.stopwatch.stop')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">{t('workout.stopwatch.stopHint')}</p>
          <Button variant="outline" size="xl" className="w-full" onClick={onCancel}>{t('workout.stopwatch.cancel')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
