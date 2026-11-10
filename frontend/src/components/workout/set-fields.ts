/*
 * The fields of a set in workout mode, by the way its exercise is logged
 * (docs/design/D1-ui.md D1.4.9): weight and reps, the added weight and
 * reps of a bodyweight exercise, seconds, or meters. One list for the row
 * (SetRow.tsx), the titles above the rows, and the big stepper
 * (SetStepper.tsx), so the three always show the same fields in the same
 * order. An exercise counted in reps and done as fast as possible has the
 * reps and the seconds: the weight, if any, stays the plan's or last time's,
 * since the row has no room for three fields beside ▶ and ✓.
 *
 * In a file of its own, not in SetRow.tsx: Vite's Fast Refresh, which
 * updates an edited component without reloading the page, works only on
 * files that export components alone (the react-refresh lint rule).
 */
import type { TFunction } from 'i18next'
import type { LoggingType } from '@/api/exercises'
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
 * @param loggingType how the exercise is logged
 * @param unit the user's weight unit, the weight's title
 * @param t the translation function
 * @param forTime whether the exercise is done as fast as possible (isForTime)
 */
export function fieldsFor(loggingType: LoggingType, unit: WeightUnit, t: TFunction, forTime = false): FieldSpec[] {
  // The reps' column, the same for the two ways of logging that count them
  const reps: FieldSpec = { field: 'reps', label: t('workout.colReps'), spoken: t('workout.colReps'), inputMode: 'numeric' }
  // The seconds' column, of a timed exercise or a race
  const seconds: FieldSpec = { field: 'seconds', label: t('workout.colSeconds'), spoken: t('workout.colSeconds'), inputMode: 'numeric' }
  if (forTime) return [reps, seconds]
  switch (loggingType) {
    case 'weight_reps': return [{ field: 'weight', label: unit, spoken: unit, placeholder: '–', inputMode: 'decimal' }, reps]
    // The body's own weight plus, maybe, a belt with a plate: "+kg"
    case 'reps': return [{ field: 'weight', label: `+${unit}`, spoken: t('workout.addedWeight', { unit }), placeholder: '–', inputMode: 'decimal' }, reps]
    case 'time': return [seconds]
    case 'distance': return [{ field: 'meters', label: t('workout.colMeters'), spoken: t('workout.colMeters'), inputMode: 'numeric' }]
  }
}
