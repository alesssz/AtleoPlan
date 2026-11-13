/*
 * How a plan's exercises are summed up on its page (docs/design/D1-ui.md
 * D1.4.7): one line per exercise, such as "4 × 8–10 · 80 kg · 90 s", with
 * the warm-up sets counted apart ("+ 2 warm-up"), and the supersets as runs
 * of neighbouring exercises.
 *
 * Plain functions, no React: they take data and give text, so they are
 * tested on their own (plan-format.test.ts) and the components stay short.
 * Numbers and units are written by the browser's Intl API in the user's
 * language, through src/lib/format.ts: "82,5 kg" in Italian, "90 Sek." in
 * German (docs/concepts/C1-frontend.md C1.7). A time past a minute that is
 * not whole minutes is written as a clock, "14:30" (durationText), as
 * workout mode's stopwatch writes it.
 */
import type { TFunction } from 'i18next'
import type { LoggingType } from '@/api/exercises'
import type { PlanItem, PlanSet, SetType } from '@/api/plans'
import { clock } from '@/components/workout/clock'
import { formatNumber, formatWeight, type WeightUnit } from '@/lib/format'

/** How many kilograms make a pound, exactly (docs/design/D3-data-model.md D3.2.3). */
export const KG_PER_LB = 0.45359237

/**
 * A weight stored in kilograms, in the user's unit.
 * @param kg the weight in kilograms
 * @param unit the user's unit
 * @returns the same weight in that unit: 80 kg → 176.37 lb
 */
export function weightIn(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

/**
 * A length of time as people say it in the gym: whole minutes as minutes,
 * anything else as seconds. 60 → "1 min", 90 → "90 s" (it), "90 sec" (en),
 * "90 Sek." (de): each language's own short unit.
 * @param seconds the time, in seconds
 * @param language a language code such as 'it'
 */
export function formatSeconds(seconds: number, language: string): string {
  // `%` gives the remainder of a division: 0 for a whole number of minutes
  if (seconds >= 60 && seconds % 60 === 0) {
    return formatNumber(seconds / 60, language, { style: 'unit', unit: 'minute', unitDisplay: 'short' })
  }
  return formatNumber(seconds, language, { style: 'unit', unit: 'second', unitDisplay: 'short' })
}

/**
 * The time of a timed set, done or planned: as formatSeconds() under a
 * minute and for whole minutes ("45 s", "2 min"), as a clock otherwise
 * ("14:30", "1:12"), never as a heap of seconds ("870 s"). The clock is the
 * stopwatch's own way of writing it, so the time read on the stopwatch is
 * the time written in the set. Rests keep formatSeconds() ("90 s"): there
 * the gym counts in seconds.
 * @param seconds the time, in seconds
 * @param language a language code such as 'it'
 */
export function durationText(seconds: number, language: string): string {
  return seconds > 60 && seconds % 60 !== 0 ? clock(seconds) : formatSeconds(seconds, language)
}

/**
 * A distance: meters under a kilometer, kilometers from there. 400 → "400 m",
 * 1500 → "1.5 km" (en), "1,5 km" (it).
 * @param meters the distance, in meters
 * @param language a language code such as 'it'
 */
export function formatDistance(meters: number, language: string): string {
  return meters < 1000
    ? formatNumber(meters, language, { style: 'unit', unit: 'meter', unitDisplay: 'short' })
    : formatNumber(meters / 1000, language, { style: 'unit', unit: 'kilometer', unitDisplay: 'short', maximumFractionDigits: 2 })
}

/**
 * The sets that count: every set but the warm-ups, which count neither for
 * volume nor in the summary (docs/design/D2-decisions.md D2.8).
 *
 * Generic: `T extends { set_type: SetType }` accepts any list of objects that
 * have a set_type, the API's sets and the editor's draft sets alike, and
 * gives back a list of the same kind.
 * @param sets an exercise's sets
 */
export function workingSets<T extends { set_type: SetType }>(sets: T[]): T[] {
  return sets.filter(set => set.set_type !== 'warm_up')
}

/**
 * How many warm-up sets an exercise has, for "+ 2 warm-up".
 * @param sets an exercise's sets
 */
export function warmUpCount(sets: { set_type: SetType }[]): number {
  return sets.length - workingSets(sets).length
}

/**
 * What one set asks for, depending on how the exercise is logged: the reps
 * ("8–10", or "8" when both ends are the same), a time, or a distance.
 * @param set the set
 * @param loggingType how the exercise is logged
 * @param language a language code such as 'it'
 * @returns the target, or null when the set has none
 */
export function formatSetTarget(set: PlanSet, loggingType: LoggingType, language: string): string | null {
  if (loggingType === 'time') {
    return set.target_duration_seconds === null ? null : durationText(set.target_duration_seconds, language)
  }
  if (loggingType === 'distance') {
    return set.target_distance_meters === null ? null : formatDistance(set.target_distance_meters, language)
  }
  // Reps, with or without a weight. Either end may be missing in theory;
  // the backend asks for both or neither
  const { target_reps_min: min, target_reps_max: max } = set
  if (min === null && max === null) return null
  if (min === null || max === null || min === max) return formatNumber((min ?? max) as number, language)
  // An en dash (–), the typographic sign for a range
  return `${formatNumber(min, language)}–${formatNumber(max, language)}`
}

/** What itemSummary() needs besides the exercise. */
export interface SummaryOptions {
  /** The interface's language. */
  language: string
  /** The user's weight unit (Profile). */
  weightUnit: WeightUnit
  /** The user's rest when the exercise sets none, in seconds. */
  defaultRestSeconds: number
  /** The translate function, from useTranslation(). */
  t: TFunction
}

/**
 * The line that sums up an exercise of a plan, its parts joined by " · ":
 *
 * - the working sets and their target: "4 × 8–10". When the sets ask for
 *   different things, each one: "3 × 10/8/6". With no target at all,
 *   "3 sets". A set with no target among others reads "max";
 * - the weight, for an exercise logged with one: "80 kg", or "60–80 kg"
 *   when it changes from set to set; in the user's unit;
 * - the RPE, when every set asks for the same: "RPE 8";
 * - "as fast as possible", the words of the editor's switch, for an
 *   exercise done for time (`for_time`); first "for time", which said little;
 * - the rest, the exercise's own or the user's default: "90 s".
 *
 * @param item the exercise of the plan, with its sets
 * @param options language, unit, default rest and translate function
 * @returns such as "4 × 8–10 · 80 kg · 90 s"
 */
export function itemSummary(item: PlanItem, options: SummaryOptions): string {
  const { language, weightUnit, defaultRestSeconds, t } = options
  const working = workingSets(item.sets)
  // The pieces of the line, in order
  const parts: string[] = []

  if (working.length > 0) {
    // Each set's target, or null
    const targets = working.map(set => formatSetTarget(set, item.exercise.logging_type, language))
    if (targets.every(target => target === null)) {
      parts.push(t('plans.detail.setsCount', { count: working.length }))
    }
    else {
      // new Set(): the distinct values; one means every set asks the same
      const distinct = new Set(targets)
      const shown = distinct.size === 1 ? targets[0] : targets.map(target => target ?? t('plans.detail.max')).join('/')
      parts.push(`${formatNumber(working.length, language)} × ${shown ?? t('plans.detail.max')}`)
    }
  }

  // The weights asked for, in the user's unit; the empty ones left out.
  // Number() turns the backend's exact text "80.000" into 80
  const weights = item.exercise.logging_type === 'weight_reps'
    ? working.flatMap(set => (set.target_weight_kg === null ? [] : [weightIn(Number(set.target_weight_kg), weightUnit)]))
    : []
  if (weights.length > 0) {
    // Math.min(...list): the smallest; `...` spreads the list into arguments
    const lightest = Math.min(...weights)
    const heaviest = Math.max(...weights)
    parts.push(lightest === heaviest
      ? formatWeight(lightest, language, weightUnit)
      : `${formatNumber(lightest, language, { maximumFractionDigits: 2 })}–${formatWeight(heaviest, language, weightUnit)}`)
  }

  // The RPE, only when every working set asks for the same one
  const rpes = new Set(working.map(set => set.target_rpe))
  const [rpe] = rpes
  if (rpes.size === 1 && rpe !== null && rpe !== undefined) {
    parts.push(t('plans.detail.rpe', { value: formatNumber(Number(rpe), language) }))
  }

  // Done as fast as possible: the reps above are fixed, the time is the
  // result. `=== true`: a plan item read before the field existed has none
  if (item.for_time === true) parts.push(t('plans.detail.forTime'))

  parts.push(formatSeconds(item.rest_seconds ?? defaultRestSeconds, language))

  return parts.join(' · ')
}

/**
 * A run of neighbouring exercises of a day: a superset, or one exercise on
 * its own (group null).
 */
export interface ItemBlock {
  /** The superset's number, or null for an exercise on its own. */
  group: number | null
  /** The exercises of the run, in order. */
  items: PlanItem[]
}

/**
 * Splits a day's exercises into supersets and lone exercises, keeping the
 * order. The backend guarantees that a superset's exercises are next to each
 * other (SupersetsAreNeighbours), so a run of the same number is the whole
 * superset.
 *
 *     groups 1 1 – 2 2   →   [1: two items] [–: one item] [2: two items]
 *
 * @param items a day's exercises, in order
 */
export function groupSupersets(items: PlanItem[]): ItemBlock[] {
  const blocks: ItemBlock[] = []
  for (const item of items) {
    // The block being built, the last one; `.at(-1)` reads from the end
    const last = blocks.at(-1)
    if (item.superset_group !== null && last?.group === item.superset_group) {
      last.items.push(item)
    }
    else {
      blocks.push({ group: item.superset_group, items: [item] })
    }
  }
  return blocks
}
