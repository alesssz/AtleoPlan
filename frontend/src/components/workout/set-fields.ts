/*
 * The fields of a set in workout mode, by the way its exercise is logged:
 * weight and reps, the added weight and reps of a bodyweight exercise, seconds,
 * or meters. One list for the row (SetRow.tsx), the titles above the rows, and
 * the big stepper (SetStepper.tsx), so the three always show the same fields in
 * the same order. An exercise counted in reps and done as fast as possible has
 * the reps and the seconds: the weight, if any, stays the plan's or last
 * time's, since the row has no room for three fields beside ▶ and ✓.
 *
 * Apart from SetRow.tsx, which may then export only components (Fast Refresh).
 */
import type { TFunction } from 'i18next'
import type { LoggingType } from '@/api/exercises'
import { parseWhole } from '@/components/plans/plan-draft'
import { durationText } from '@/components/plans/plan-format'
import type { WeightUnit } from '@/lib/format'
import type { SetField } from './workout-session'

/** A field of a set's row: what it holds, its title, the phone keyboard it opens. */
export interface FieldSpec {
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
 * Shared by the rows, their header and the stepper, so they always match.
 * @param unit the user's weight unit, the weight's title
 * @param forTime whether the exercise is done as fast as possible (isForTime)
 */
export function fieldsFor(loggingType: LoggingType, unit: WeightUnit, t: TFunction, forTime = false): FieldSpec[] {
  // The reps' column, the same for the two ways of logging that count them
  const reps: FieldSpec = { field: 'reps', label: t('workout.colReps'), spoken: t('workout.colReps'), inputMode: 'numeric' }
  // The time's column, of a timed exercise or a race. Titled "Time", not
  // "Sec": past a minute the row writes it as a clock, "14:30" (fieldText);
  // its spoken name says the seconds, the unit of the value read out and
  // typed in the stepper
  const seconds: FieldSpec = { field: 'seconds', label: t('workout.colTime'), spoken: t('workout.colSeconds'), inputMode: 'numeric' }
  if (forTime) return [reps, seconds]
  switch (loggingType) {
    case 'weight_reps': return [{ field: 'weight', label: unit, spoken: unit, placeholder: '–', inputMode: 'decimal' }, reps]
    // The body's own weight plus, maybe, a belt with a plate: "+kg"
    case 'reps': return [{ field: 'weight', label: `+${unit}`, spoken: t('workout.addedWeight', { unit }), placeholder: '–', inputMode: 'decimal' }, reps]
    case 'time': return [seconds]
    case 'distance': return [{ field: 'meters', label: t('workout.colMeters'), spoken: t('workout.colMeters'), inputMode: 'numeric' }]
  }
}

/**
 * A field's value as the row shows it. The time is kept in seconds, as
 * typed and as sent ("870"), but shown as people read a time: "45 s",
 * "2 min", "14:30" (durationText). Any other field, and a time that does
 * not read as a whole number yet (typing), is shown as it is.
 * @param value its value, as kept in the set
 */
export function fieldText(field: SetField, value: string, language: string): string {
  if (field !== 'seconds') return value
  const seconds = parseWhole(value)
  return seconds === null || Number.isNaN(seconds) ? value : durationText(seconds, language)
}
