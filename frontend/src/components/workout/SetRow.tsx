/*
 * One set in workout mode (docs/design/D1-ui.md D1.4.9): its number, which a
 * tap turns into W, D or F; what the set in the same place did last time;
 * the fields, filled with last time's values or the plan's targets; and ✓,
 * which completes it and starts the rest. SetHeader is the row of titles
 * above the sets, with the same widths, so each number sits under its name.
 *
 * ✓ is disabled while a value the exercise needs is missing or does not
 * read as a number: the backend would refuse the set (canComplete,
 * workout-session.ts). The weight may stay empty: a set with the body alone.
 * A bodyweight exercise (pull-ups, dips) shows it as "+kg", the added weight.
 */
import { Check } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { LoggingType } from '@/api/exercises'
import { SET_TYPE_SIGNS } from '@/components/plans/plan-draft'
import { formatDistance, formatSeconds, weightIn } from '@/components/plans/plan-format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { canComplete, type SetField, type SetNumber, type WorkoutSet } from './workout-session'

/** A field of a set's row: what it holds, its title, the phone keyboard it opens. */
interface FieldSpec {
  /** The set's property it edits. */
  field: SetField
  /** Its title, above the column: "kg", "+kg", "Reps". */
  label: string
  /** Its name for screen readers, after the set's: "added weight, kg". */
  spoken: string
  /** What an empty field shows: a dash where it may stay empty. */
  placeholder?: string
  /** The keyboard: digits and a separator, or digits only. */
  inputMode: 'decimal' | 'numeric'
}

/**
 * The fields of a way of logging: weight and reps, reps, seconds or meters.
 * Shared by the rows and their header, so the columns always match.
 * @param loggingType how the exercise is logged
 * @param unit the user's weight unit, the weight's title
 * @param t the translation function
 */
function fieldsFor(loggingType: LoggingType, unit: WeightUnit, t: TFunction): FieldSpec[] {
  // The reps' column, the same for the two ways of logging that count them
  const reps: FieldSpec = { field: 'reps', label: t('workout.colReps'), spoken: t('workout.colReps'), inputMode: 'numeric' }
  switch (loggingType) {
    case 'weight_reps': return [{ field: 'weight', label: unit, spoken: unit, placeholder: '–', inputMode: 'decimal' }, reps]
    // The body's own weight plus, maybe, a belt with a plate: "+kg"
    case 'reps': return [{ field: 'weight', label: `+${unit}`, spoken: t('workout.addedWeight', { unit }), placeholder: '–', inputMode: 'decimal' }, reps]
    case 'time': return [{ field: 'seconds', label: t('workout.colSeconds'), spoken: t('workout.colSeconds'), inputMode: 'numeric' }]
    case 'distance': return [{ field: 'meters', label: t('workout.colMeters'), spoken: t('workout.colMeters'), inputMode: 'numeric' }]
  }
}

/**
 * A weight, as a field and the Last column write it: 82.5 → "82,5" in Italian.
 * @param kilograms the weight in kilograms, as the API sends it
 * @param unit the user's unit
 * @param language the interface's language
 */
function weightText(kilograms: string, unit: WeightUnit, language: string): string {
  return formatNumber(weightIn(Number(kilograms), unit), language, { maximumFractionDigits: 2 })
}

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
  /** A field typed in. */
  onChange: (field: SetField, value: string) => void
  /** A tap on its number: the next type. */
  onCycleType: () => void
}

/** A row of the sets' table. */
export function SetRow({ set, number, loggingType, unit, onToggle, onChange, onCycleType }: SetRowProps) {
  const { t, i18n } = useTranslation()
  // The interface's language, for the decimal separator
  const language = i18n.language
  // The set's name for screen readers: "Set 1", "Warm-up 2"
  const name = number.warmUp ? t('workout.warmUpName', { number: number.number }) : t('workout.setName', { number: number.number })

  // Last time, as a gym writes it: "80×8", "+10×6" (added weight), "12"
  // (no weight), "1 min", "400 m"; a dash when none
  const last = set.last
  // The weight of last time's set, as text with its sign; '' when none
  const lastWeight = last?.weight_kg === null || last?.weight_kg === undefined
    ? ''
    : `${loggingType === 'reps' ? '+' : ''}${weightText(last.weight_kg, unit, language)}×`
  const lastText = last === null
    ? '–'
    : loggingType === 'weight_reps' || loggingType === 'reps'
      ? `${lastWeight}${last.reps ?? '–'}`
      : loggingType === 'time'
        ? formatSeconds(last.duration_seconds ?? 0, language)
        : formatDistance(last.distance_meters ?? 0, language)

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

      {fieldsFor(loggingType, unit, t).map(({ field, spoken, placeholder, inputMode }) => (
        <Input
          key={field}
          aria-label={`${name}, ${spoken}`}
          placeholder={placeholder}
          inputMode={inputMode}
          value={set[field]}
          onChange={event => onChange(field, event.target.value)}
          className="h-12 min-w-0 flex-1 rounded-xl text-center text-lg font-semibold tabular-nums"
        />
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
