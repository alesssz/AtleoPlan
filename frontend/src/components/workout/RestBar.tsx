/*
 * The rest timer, docked at the bottom of workout mode. When the rest leads to
 * another exercise it names it: the rest is when the next machine gets ready,
 * and this bar is always in sight, unlike the Up next card.
 */
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clock } from './clock'
import { WORKOUT_COLUMN } from './layout'

interface RestBarProps {
  left: number
  /** How long the rest was meant to last, for the bar. */
  total: number
  /** Adds (positive) or removes (negative) seconds. */
  onAdjust: (seconds: number) => void
  onSkip: () => void
  /** The exercise the rest leads to, by name; null or missing when the sets on screen go on. */
  next?: string | null
  /** The workout is paused: the time stands still, greyed and pulsing. */
  paused?: boolean
}

export function RestBar({ left, total, onAdjust, onSkip, next = null, paused = false }: RestBarProps) {
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
            <span role="timer" className={cn('font-heading text-2xl font-extrabold tabular-nums', paused && 'animate-pulse text-muted-foreground')}>{clock(left)}</span>
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
