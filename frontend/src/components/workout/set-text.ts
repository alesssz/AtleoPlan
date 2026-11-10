/*
 * A logged set written as a gym writes it: "80×8", "+10×6" (added weight on
 * a bodyweight exercise), "12" (reps with the body alone), "1 min", "400 m",
 * and "50 in 1:12" for reps done as fast as possible.
 * Shared by workout mode's "Last" column (SetRow.tsx) and by history's sets
 * (docs/concepts/C1-frontend.md C1.17, C1.19), so both write a set the same
 * way. Plain functions, no React.
 */
import type { LoggingType } from '@/api/exercises'
import type { LoggedSet } from '@/api/sessions'
import { formatDistance, formatSeconds, weightIn } from '@/components/plans/plan-format'
import i18n from '@/i18n'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { clock } from './clock'

/** The values of a set that its text needs: from the API (weight as text) or from the phone (a number). */
export type SetTextValues = Pick<LoggedSet, 'reps' | 'duration_seconds' | 'distance_meters'> & { weight_kg: string | number | null }

/**
 * A weight, as a field and the Last column write it: 82.5 → "82,5" in Italian.
 * @param kilograms the weight in kilograms, as the API sends it ("82.500") or as a number
 * @param unit the user's unit
 * @param language the interface's language
 */
export function weightText(kilograms: string | number, unit: WeightUnit, language: string): string {
  return formatNumber(weightIn(Number(kilograms), unit), language, { maximumFractionDigits: 2 })
}

/**
 * One logged set as short text, in the user's unit and language.
 * @param set the set, as the API sends it, or its values from the phone
 * @param loggingType how its exercise is logged: decides what is written
 * @param unit the user's unit
 * @param language the interface's language
 * @returns "80×8", "+10×6", "12", "1 min", "400 m" or "50 in 1:12"
 */
export function loggedSetText(set: SetTextValues, loggingType: LoggingType, unit: WeightUnit, language: string): string {
  if (loggingType === 'time') return formatSeconds(set.duration_seconds ?? 0, language)
  if (loggingType === 'distance') return formatDistance(set.distance_meters ?? 0, language)
  // By reps: the weight first when there is one, with "+" when it is added
  // to the body (an exercise logged as reps), then "×"
  const weight = set.weight_kg === null ? '' : `${loggingType === 'reps' ? '+' : ''}${weightText(set.weight_kg, unit, language)}×`
  const reps = `${weight}${set.reps ?? '–'}`
  // Done as fast as possible: the time too, as a clock shows it. A plain
  // function has no useTranslation(); i18n.t() is the same translation,
  // with the language given (lng)
  if (set.duration_seconds !== null) return i18n.t('workout.repsInTime', { lng: language, reps, time: clock(set.duration_seconds) })
  return reps
}
