/*
 * One set in workout mode (docs/design/D1-ui.md D1.4.9): its number, which a
 * tap turns into W, D or F; what the set in the same place did last time;
 * the fields, filled with last time's values or the plan's targets; and ✓,
 * which completes it and starts the rest. SetHeader is the row of titles
 * above the sets, with the same widths, so each number sits under its name.
 *
 * The fields are buttons, not text boxes: a tap opens the big stepper
 * (SetStepper.tsx), with − and + as large as a thumb, rather than the
 * phone's keyboard, slow with sweaty hands (D1.4.9). The stepper still has
 * a text box, for a value far from the one shown.
 *
 * ✓ is disabled while a value the exercise needs is missing or does not
 * read as a number: the backend would refuse the set (canComplete,
 * workout-session.ts). The weight may stay empty: a set with the body alone.
 * A bodyweight exercise (pull-ups, dips) shows it as "+kg", the added weight.
 */
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LoggingType } from '@/api/exercises'
import { SET_TYPE_SIGNS } from '@/components/plans/plan-draft'
import { Button } from '@/components/ui/button'
import type { WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { fieldsFor } from './set-fields'
import { loggedSetText } from './set-text'
import { canComplete, type SetField, type SetNumber, type WorkoutSet } from './workout-session'

/** Props of SetHeader. */
interface SetHeaderProps {
  /** How the exercise is logged: decides the columns. */
  loggingType: LoggingType
  /** The user's weight unit. */
  unit: WeightUnit
}

/**
 * The titles above the sets: Set, Last, then one per field (kg, Reps…), and
 * an empty place above ✓. The widths are the rows' own: w-12 for the
 * number's 48 px button, w-16 for Last, flex-1 for each field, w-12 for ✓.
 * Hidden from screen readers, which hear each field's own name instead.
 */
export function SetHeader({ loggingType, unit }: SetHeaderProps) {
  const { t } = useTranslation()

  return (
    <div aria-hidden="true" className="mb-2 flex items-center gap-2 px-1 text-xs sm:gap-3 font-bold tracking-wider text-muted-foreground uppercase">
      <span className="w-12 shrink-0 text-center">{t('workout.colSet')}</span>
      <span className="w-16 shrink-0 text-center">{t('workout.colLast')}</span>
      {fieldsFor(loggingType, unit, t).map(({ field, label }) => (
        <span key={field} className="min-w-0 flex-1 text-center">{label}</span>
      ))}
      <span className="w-12 shrink-0" />
    </div>
  )
}

/** Props of SetRow. */
interface SetRowProps {
  /** The set. */
  set: WorkoutSet
  /** Its number, warm-ups counted apart (setNumbers, workout-session.ts). */
  number: SetNumber
  /** How its exercise is logged: decides the fields. */
  loggingType: LoggingType
  /** The user's weight unit. */
  unit: WeightUnit
  /** Ticks or unticks it. */
  onToggle: () => void
  /** A tap on a field: the stepper opens on it. */
  onOpenStepper: (field: SetField) => void
  /** A tap on its number: the next type. */
  onCycleType: () => void
}

/** A row of the sets' table. */
export function SetRow({ set, number, loggingType, unit, onToggle, onOpenStepper, onCycleType }: SetRowProps) {
  const { t, i18n } = useTranslation()
  // The interface's language, for the decimal separator
  const language = i18n.language
  // The set's name for screen readers: "Set 1", "Warm-up 2"
  const name = number.warmUp ? t('workout.warmUpName', { number: number.number }) : t('workout.setName', { number: number.number })

  // Last time, as a gym writes it: "80×8", "+10×6" (added weight), "12"
  // (no weight), "1 min", "400 m" (set-text.ts, shared with history); a
  // dash when none
  const lastText = set.last === null ? '–' : loggedSetText(set.last, loggingType, unit, language)

  return (
    <li className={cn('flex items-center gap-2 rounded-xl p-1 sm:gap-3', set.done && 'bg-primary/10')}>
      {/* The number, or the type's letter; the name says the type in words */}
      <Button
        variant="ghost"
        size="icon-xl"
        aria-label={t('workout.typeButton', { name, type: t(`plans.editor.setTypes.${set.set_type}`) })}
        onClick={onCycleType}
        className={cn('font-heading text-base font-extrabold', set.set_type === 'warm_up' ? 'text-muted-foreground' : set.set_type !== 'normal' && 'text-primary')}
      >
        {SET_TYPE_SIGNS[set.set_type] ?? number.number}
      </Button>

      {/* Last time, in the column of the same name */}
      <span className="w-16 shrink-0 text-center text-sm text-muted-foreground tabular-nums">{lastText}</span>

      {/* Each field: a button that looks like the text box it replaced
          (the Input's border and background), showing the value, or a dash
          when empty. Its name says the value too: "Set 1, kg: 80" */}
      {fieldsFor(loggingType, unit, t).map(({ field, spoken, placeholder }) => (
        <button
          key={field}
          type="button"
          aria-label={t('workout.fieldButton', { name, field: spoken, value: set[field] === '' ? t('workout.fieldEmpty') : set[field] })}
          onClick={() => onOpenStepper(field)}
          className="h-12 min-w-0 flex-1 truncate rounded-xl border border-input bg-transparent px-2 text-center text-lg font-semibold tabular-nums transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          {set[field] === '' ? <span className="text-muted-foreground">{placeholder ?? ''}</span> : set[field]}
        </button>
      ))}

      {/* ✓. aria-pressed says whether the set is done, in words for screen
          readers; the colour says it for the eyes */}
      <Button
        size="icon-xl"
        variant={set.done ? 'default' : 'outline'}
        aria-pressed={set.done}
        aria-label={set.done ? t('workout.untick', { name }) : t('workout.tick', { name })}
        disabled={!set.done && !canComplete(set, loggingType)}
        onClick={onToggle}
      >
        <Check aria-hidden="true" />
      </Button>
    </li>
  )
}
