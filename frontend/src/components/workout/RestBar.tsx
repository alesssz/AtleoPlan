/*
 * The rest timer, a bar fixed at the bottom of workout mode: the seconds left,
 * a bar that empties, and −15 s, +15 s, Skip. The time left is worked out by
 * the screen from the session's `rest.ends_at` and the current moment, so the
 * timer survives a reload: it is a moment, not a counter.
 *
 * When the rest leads to another exercise (the one on screen has no set
 * left), a line under the time names it, "Up next: Lateral Raise": the rest is
 * when the next machine is got ready, and this bar is always in sight,
 * unlike the "Up next" card at the end of a long table (UpNextCard.tsx).
 */
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { clock } from './clock'
import { WORKOUT_COLUMN } from './layout'

interface RestBarProps {
  /** Seconds left. */
  left: number
  /** How long the rest was meant to last, for the bar. */
  total: number
  /** Adds (positive) or removes (negative) seconds. */
  onAdjust: (seconds: number) => void
  /** Ends the rest now. */
  onSkip: () => void
  /** The exercise the rest leads to, by name; null or missing when the sets on screen go on. */
  next?: string | null
}

export function RestBar({ left, total, onAdjust, onSkip, next = null }: RestBarProps) {
  const { t } = useTranslation()
  const share = total > 0 ? Math.min(1, left / total) : 0

  return (
    <section aria-label={t('workout.restTitle')} className="border-t bg-card py-4">
      <div className={WORKOUT_COLUMN}>
        <div aria-hidden="true" className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${share * 100}%` }} />
        </div>
        <div className="flex items-center gap-2">
          <p className="flex-1">
            <span className="mr-2 text-sm text-muted-foreground">{t('workout.restTitle')}</span>
            {/* role="timer": screen readers do not read it every second */}
            <span role="timer" className="font-heading text-2xl font-extrabold tabular-nums">{clock(left)}</span>
          </p>
          <Button variant="outline" size="xl" className="px-3" aria-label={t('workout.restMinus')} onClick={() => onAdjust(-15)}>−15</Button>
          <Button variant="outline" size="xl" className="px-3" aria-label={t('workout.restPlus')} onClick={() => onAdjust(15)}>+15</Button>
          <Button variant="outline" size="xl" className="px-3" onClick={onSkip}>{t('workout.restSkip')}</Button>
        </div>
        {next && <p className="mt-2 truncate text-sm text-muted-foreground">{t('workout.upNextName', { name: next })}</p>}
      </div>
    </section>
  )
}
