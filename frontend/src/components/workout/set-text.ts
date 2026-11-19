/*
 * A logged set written as a gym writes it: "80×8", "+10×6" (added weight on a
 * bodyweight exercise), "12" (reps with the body alone), "45 s", "1 min",
 * "14:30" (a time over a minute, as the stopwatch writes it), "400 m", and "50
 * in 1:12" for reps done as fast as possible. Shared by workout mode's "Last"
 * column (SetRow.tsx), by history's sets and by a superset's closed rounds,
 * so all write a set the same way.
 */
import type { LoggingType } from '@/api/exercises'
import type { LoggedSet } from '@/api/sessions'
import { durationText, formatDistance, weightIn } from '@/components/plans/plan-format'
import i18n from '@/i18n'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { clock } from './clock'
import { fieldText } from './set-fields'
import type { WorkoutSet } from './workout-session'

/** The values of a set that its text needs: from the API (weight as text) or from the phone (a number). */
export type SetTextValues = Pick<LoggedSet, 'reps' | 'duration_seconds' | 'distance_meters'> & { weight_kg: string | number | null }

/** A weight as a field and the Last column write it: 82.5 → "82,5" in Italian. */
export function weightText(kilograms: string | number, unit: WeightUnit, language: string): string {
  return formatNumber(weightIn(Number(kilograms), unit), language, { maximumFractionDigits: 2 })
}

/**
 * One logged set as short text, in the user's unit and language.
 * @returns "80×8", "+10×6", "12", "1 min", "14:30", "400 m" or "50 in 1:12"
 */
export function loggedSetText(set: SetTextValues, loggingType: LoggingType, unit: WeightUnit, language: string): string {
  // A time over a minute as a clock, "14:30", not "870 s"
  if (loggingType === 'time') return durationText(set.duration_seconds ?? 0, language)
  if (loggingType === 'distance') return formatDistance(set.distance_meters ?? 0, language)
  // By reps: the weight first when there is one, with "+" when it is added
  // to the body (an exercise logged as reps), then "×"
  const weight = set.weight_kg === null ? '' : `${loggingType === 'reps' ? '+' : ''}${weightText(set.weight_kg, unit, language)}×`
  const reps = `${weight}${set.reps ?? '–'}`
  // Done as fast as possible: the time too
  if (set.duration_seconds !== null) return i18n.t('workout.repsInTime', { lng: language, reps, time: clock(set.duration_seconds) })
  return reps
}

/**
 * A set of the workout in progress as short text, as typed, for a superset's
 * closed round: "80×8", "+10×5", "12", "45 s", "400 m", "50 in 1:12". The
 * weight is already in the user's unit; a field still empty reads "–".
 */
export function workoutSetText(set: Pick<WorkoutSet, 'weight' | 'reps' | 'seconds' | 'meters'>, loggingType: LoggingType, language: string, forTime = false): string {
  if (loggingType === 'time' && !forTime) return set.seconds === '' ? '–' : fieldText('seconds', set.seconds, language)
  if (loggingType === 'distance') return set.meters === '' ? '–' : `${set.meters} m`
  const weight = set.weight === '' ? '' : `${loggingType === 'reps' ? '+' : ''}${set.weight}×`
  const reps = `${weight}${set.reps || '–'}`
  if (forTime && set.seconds !== '') return i18n.t('workout.repsInTime', { lng: language, reps, time: clock(Number(set.seconds)) })
  return reps
}
