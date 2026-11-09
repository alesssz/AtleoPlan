/*
 * The arithmetic of workout mode's big stepper (docs/design/D1-ui.md D1.4.9,
 * SetStepper.tsx): how much − and + move each field of a set, and the
 * field's next text after a tap. Plain functions with no React, tested on
 * their own (stepper.test.ts).
 *
 * The fields stay text, as typed ("82,5" in Italian): the stepper reads the
 * text, adds the step, and writes the text back in the user's language, so
 * typing and tapping can be mixed freely. How it works:
 * docs/concepts/C1-frontend.md C1.17.7.
 */
import { parseDecimal } from '@/components/plans/plan-draft'
import { formatNumber } from '@/lib/format'
import type { SetField } from './workout-session'

/**
 * The step of each field but the weight, whose step is the user's setting
 * (`weight_step`, 2.5 by default, in the user's unit): one rep, five
 * seconds, ten meters.
 */
export const FIELD_STEPS: Record<Exclude<SetField, 'weight'>, number> = {
  reps: 1,
  seconds: 5,
  meters: 10,
}

/** The weight step when the user's setting is missing or does not read. */
export const FALLBACK_WEIGHT_STEP = 2.5

/**
 * How much one tap of − or + moves a field.
 * @param field the set's field
 * @param weightStep the user's `weight_step`, as the API sends it ("2.50"),
 *   or undefined while the user is loading
 */
export function fieldStep(field: SetField, weightStep: string | undefined): number {
  if (field !== 'weight') return FIELD_STEPS[field]
  // "2.50" → 2.5; a missing, zero or unreadable step falls back to 2.5
  const step = Number(weightStep)
  return Number.isFinite(step) && step > 0 ? step : FALLBACK_WEIGHT_STEP
}

/**
 * The field's text after one tap of − (a negative step) or + (a positive
 * one), in the user's language.
 *
 * - An empty field, or one that does not read as a number, starts from 0:
 *   + on an empty weight gives one step (2.5).
 * - Reps, seconds and meters are whole numbers: "8,5" typed as reps, then
 *   +, gives 10 (the backend takes whole numbers only).
 * - The weight is written with at most two decimals, which also rounds it:
 *   in JavaScript 0.1 + 0.2 is 0.30000000000000004, written "0.3".
 * - Nothing goes below 0. A weight that reaches 0 becomes empty: no weight,
 *   the body alone (D1.4.9), which is what an empty weight already means.
 * @param text the field's text, as typed or as the last tap left it
 * @param field which field it is
 * @param delta the step, negative for −
 * @param language the interface's language, for the decimal separator
 */
export function stepValue(text: string, field: SetField, delta: number, language: string): string {
  // The number now: 0 when empty or unreadable (NaN)
  const current = parseDecimal(text)
  const start = current === null || Number.isNaN(current) ? 0 : current
  // The number after the tap; whole, but for the weight
  const sum = start + delta
  const next = field === 'weight' ? sum : Math.round(sum)
  if (next <= 0) return field === 'weight' ? '' : '0'
  // Written as the fields are filled at the start (workout-session.ts): no
  // thousands separator, at most two decimals (Intl rounds the rest away)
  return formatNumber(next, language, { useGrouping: false, maximumFractionDigits: 2 })
}
