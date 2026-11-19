/*
 * One set in workout mode, and SetHeader, the titles above the rows with the
 * same widths. The fields are buttons that open the big stepper rather than
 * the keyboard, slow with sweaty hands. ✓ stays disabled while a value the
 * exercise needs is missing: the backend would refuse the set. A race (reps
 * for time) drops the Last column for room at 360 px.
 */
import { Check, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LoggingType } from '@/api/exercises'
import type { SetType } from '@/api/plans'
import { SetTypeSelect } from '@/components/plans/SetTypeSelect'
import { Button } from '@/components/ui/button'
import type { WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { fieldsFor, fieldText } from './set-fields'
import { loggedSetText } from './set-text'
import { canComplete, type SetField, type SetNumber, type WorkoutSet } from './workout-session'

interface SetHeaderProps {
  /** How the exercise is logged: decides the columns. */
  loggingType: LoggingType
  unit: WeightUnit
  /** Done as fast as possible: reps and seconds, no Last. */
  forTime: boolean
}

/**
 * The titles above the sets, with the rows' own widths. Hidden from screen
 * readers, which hear each field's own name instead.
 */
export function SetHeader({ loggingType, unit, forTime }: SetHeaderProps) {
  const { t } = useTranslation()

  return (
    <div aria-hidden="true" className="mb-2 flex items-center gap-2 px-1 text-xs sm:gap-3 font-bold tracking-wider text-muted-foreground uppercase">
      <span className="w-12 shrink-0 text-center">{t('workout.colSet')}</span>
      {!forTime && <span className="w-16 shrink-0 text-center">{t('workout.colLast')}</span>}
      {fieldsFor(loggingType, unit, t, forTime).map(({ field, label }) => (
        <span key={field} className="min-w-0 flex-1 text-center">{label}</span>
      ))}
      {(loggingType === 'time' || forTime) && <span className="w-12 shrink-0" />}
      <span className="w-12 shrink-0" />
    </div>
  )
}

interface SetRowProps {
  set: WorkoutSet
  /** Warm-ups are counted apart. */
  number: SetNumber
  loggingType: LoggingType
  unit: WeightUnit
  /** Done as fast as possible: reps and seconds, ▶, no Last (isForTime). */
  forTime: boolean
  onToggle: () => void
  /** A tap on a field: the stepper opens on it. */
  onOpenStepper: (field: SetField) => void
  onTypeChange: (type: SetType) => void
  /** ▶, on a timed exercise: the stopwatch starts on this set. */
  onStartStopwatch: () => void
  /**
   * 'this' when the running stopwatch times this set, which gets a lime
   * outline, and whose ✓ stops it; 'other' when it times another. Either way
   * ▶ is disabled: a second ▶ would replace the running time and lose it.
   */
  stopwatch?: 'this' | 'other' | null
}

export function SetRow({ set, number, loggingType, unit, forTime, onToggle, onOpenStepper, onTypeChange, onStartStopwatch, stopwatch = null }: SetRowProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const name = number.warmUp ? t('workout.warmUpName', { number: number.number }) : t('workout.setName', { number: number.number })

  const lastText = set.last === null ? '–' : loggedSetText(set.last, loggingType, unit, language)

  return (
    // A lime ring on the set being timed, so the eye finds it between the
    // stopwatch at the bottom and the table
    <li aria-current={stopwatch === 'this' ? 'true' : undefined} className={cn('flex items-center gap-2 rounded-xl p-1 sm:gap-3', set.done && 'bg-primary/10', stopwatch === 'this' && 'ring-2 ring-primary')}>
      <SetTypeSelect
        value={set.set_type}
        onChange={onTypeChange}
        number={number.number}
        label={t('workout.typeButton', { name, type: t(`plans.editor.setTypes.${set.set_type}`) })}
        variant="ghost"
      />

      {!forTime && <span className="w-16 shrink-0 text-center text-sm text-muted-foreground tabular-nums">{lastText}</span>}

      {/* The label carries the value too: "Set 1, kg: 80" */}
      {fieldsFor(loggingType, unit, t, forTime).map(({ field, spoken, placeholder }) => (
        <button
          key={field}
          type="button"
          aria-label={t('workout.fieldButton', { name, field: spoken, value: set[field] === '' ? t('workout.fieldEmpty') : set[field] })}
          onClick={() => onOpenStepper(field)}
          className="h-12 min-w-0 flex-1 truncate rounded-xl border border-input bg-transparent px-2 text-center text-lg font-semibold tabular-nums transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          {set[field] === '' ? <span className="text-muted-foreground">{placeholder ?? ''}</span> : fieldText(field, set[field], language)}
        </button>
      ))}

      {/* Once the set is done ▶ goes, its place kept so the columns align */}
      {(loggingType === 'time' || forTime) && (set.done
        ? <span className="w-12 shrink-0" />
        : (
            <Button size="icon-xl" variant="outline" className="border-primary/70 text-primary" aria-label={t('workout.stopwatch.start', { name })} disabled={stopwatch !== null} onClick={onStartStopwatch}>
              <Play aria-hidden="true" className="fill-current" />
            </Button>
          ))}

      <Button
        size="icon-xl"
        variant={set.done ? 'default' : 'outline'}
        aria-pressed={set.done}
        aria-label={set.done ? t('workout.untick', { name }) : t('workout.tick', { name })}
        // While its stopwatch runs, ✓ stops it, which fills the seconds
        disabled={!set.done && !canComplete(stopwatch === 'this' ? { ...set, seconds: '1' } : set, loggingType, forTime)}
        onClick={onToggle}
      >
        <Check aria-hidden="true" />
      </Button>
    </li>
  )
}
