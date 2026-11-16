/*
 * The fields of a set by logging type, shared by SetRow, its header and
 * SetStepper so they always match. A race (reps for time) shows reps and
 * seconds only: the row has no room for a weight too beside ▶ and ✓; the
 * weight stays the plan's or last time's. Kept out of SetRow.tsx so that file
 * exports only components (Fast Refresh).
 */
import type { TFunction } from 'i18next'
import type { LoggingType } from '@/api/exercises'
import { parseWhole } from '@/components/plans/plan-draft'
import { durationText } from '@/components/plans/plan-format'
import type { WeightUnit } from '@/lib/format'
import type { SetField } from './workout-session'

/** A field of a set's row: what it holds, its title, the phone keyboard it opens. */
export interface FieldSpec {
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

/** @param forTime whether the exercise is done as fast as possible (isForTime) */
export function fieldsFor(loggingType: LoggingType, unit: WeightUnit, t: TFunction, forTime = false): FieldSpec[] {
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
 * A field's value as the row shows it. The time is kept in seconds, as typed
 * and as sent ("870"), but shown as a time: "45 s", "2 min", "14:30". Other
 * fields, and a time that does not read as a whole number yet, show as typed.
 */
export function fieldText(field: SetField, value: string, language: string): string {
  if (field !== 'seconds') return value
  const seconds = parseWhole(value)
  return seconds === null || Number.isNaN(seconds) ? value : durationText(seconds, language)
}
