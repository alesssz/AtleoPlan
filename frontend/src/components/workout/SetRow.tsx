/*
 * One set in workout mode: its number, which opens the list of set types (W, D,
 * F: SetTypeSelect.tsx); what the set in the same place did last time; the
 * fields, filled with last time's values or the plan's targets; and ✓, which
 * completes it and starts the rest. SetHeader is the row of titles above the
 * sets, with the same widths, so each number sits under its name.
 *
 * The fields are buttons, not text boxes: a tap opens the big stepper
 * (SetStepper.tsx), with − and + as large as a thumb, rather than the phone's
 * keyboard, slow with sweaty hands. The stepper still has a text box, for a
 * value far from the one shown.
 *
 * An exercise logged by time has one more button before ✓: ▶, which opens
 * the stopwatch (StopwatchPanel.tsx, docked at the bottom, under the table);
 * its Stop fills the seconds and ticks the set. While it runs, the set it
 * times has a lime ring and every ▶ is disabled. A done set keeps the place
 * empty, so the columns stay aligned. The time is kept in seconds and shown
 * as a time: "45 s", "14:30" (fieldText, set-fields.ts).
 * So has one counted in reps and done as fast as possible (`forTime`): its
 * row shows the reps and the seconds, and no Last column, for room. Last
 * time is in the seconds' field, the time to beat, in the stepper and in
 * the stopwatch.
 *
 * ✓ is disabled while a value the exercise needs is missing or does not
 * read as a number: the backend would refuse the set (canComplete,
 * workout-session.ts). The weight may stay empty: a set with the body alone.
 * A bodyweight exercise (pull-ups, dips) shows it as "+kg", the added weight.
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
  /** The user's weight unit. */
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
  /** The set. */
  set: WorkoutSet
  /** Its number, warm-ups counted apart (setNumbers, workout-session.ts). */
  number: SetNumber
  /** How its exercise is logged: decides the fields. */
  loggingType: LoggingType
  /** The user's weight unit. */
  unit: WeightUnit
  /** Done as fast as possible: reps and seconds, ▶, no Last (isForTime). */
  forTime: boolean
  /** Ticks or unticks it. */
  onToggle: () => void
  /** A tap on a field: the stepper opens on it. */
  onOpenStepper: (field: SetField) => void
  /** A type chosen in the list under its number. */
  onTypeChange: (type: SetType) => void
  /** ▶, on a timed exercise: the stopwatch starts on this set. */
  onStartStopwatch: () => void
  /**
   * The stopwatch, if one runs: 'this' when it times this set, which gets
   * a lime outline; 'other' when it times another set. Either way ▶ is
   * disabled: a second ▶ would replace the running time and lose it.
   * Optional: none runs when it is missing.
   */
  stopwatch?: 'this' | 'other' | null
}

export function SetRow({ set, number, loggingType, unit, forTime, onToggle, onOpenStepper, onTypeChange, onStartStopwatch, stopwatch = null }: SetRowProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  // The set's name for screen readers: "Set 1", "Warm-up 2"
  const name = number.warmUp ? t('workout.warmUpName', { number: number.number }) : t('workout.setName', { number: number.number })

  // Last time, as a gym writes it: "80×8", "+10×6" (added weight), "12"
  // (no weight), "1 min", "400 m" (set-text.ts, shared with history); a
  // dash when none
  const lastText = set.last === null ? '–' : loggedSetText(set.last, loggingType, unit, language)

  return (
    // The set being timed: a lime ring, so the eye finds it between the
    // stopwatch at the bottom and the table (aria-current says it to
    // screen readers)
    <li aria-current={stopwatch === 'this' ? 'true' : undefined} className={cn('flex items-center gap-2 rounded-xl p-1 sm:gap-3', set.done && 'bg-primary/10', stopwatch === 'this' && 'ring-2 ring-primary')}>
      <SetTypeSelect
        value={set.set_type}
        onChange={onTypeChange}
        number={number.number}
        label={t('workout.typeButton', { name, type: t(`plans.editor.setTypes.${set.set_type}`) })}
        variant="ghost"
      />

      {!forTime && <span className="w-16 shrink-0 text-center text-sm text-muted-foreground tabular-nums">{lastText}</span>}

      {/* Buttons that look like text boxes; the name says the value too:
          "Set 1, kg: 80" */}
      {fieldsFor(loggingType, unit, t, forTime).map(({ field, spoken, placeholder }) => (
        <button
          key={field}
          type="button"
          aria-label={t('workout.fieldButton', { name, field: spoken, value: set[field] === '' ? t('workout.fieldEmpty') : set[field] })}
          onClick={() => onOpenStepper(field)}
          className="h-12 min-w-0 flex-1 truncate rounded-xl border border-input bg-transparent px-2 text-center text-lg font-semibold tabular-nums transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          {/* The time as people read it, "14:30" for 870 seconds (fieldText) */}
          {set[field] === '' ? <span className="text-muted-foreground">{placeholder ?? ''}</span> : fieldText(field, set[field], language)}
        </button>
      ))}

      {/* ▶, on a timed exercise: the stopwatch. Lime outline, the way to
          do a timed set; gone once the set is done, its place kept */}
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
        disabled={!set.done && !canComplete(set, loggingType, forTime)}
        onClick={onToggle}
      >
        <Check aria-hidden="true" />
      </Button>
    </li>
  )
}
