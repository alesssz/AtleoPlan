/*
 * Numbers shown to the user, formatted the way their language writes them:
 * "82,5 kg" in Italian, Spanish and German, "82.5 kg" in English
 * (docs/02-decisions.md 2.4). The browser's Intl API knows every language's
 * rules; these helpers only fix the options AtleoPlan uses.
 *
 * Components pass the current language: `formatWeight(82.5, i18n.language)`.
 * Never build numbers with string concatenation (`${value} kg`): the
 * decimal separator would be wrong in three languages out of four.
 * Translations and formats: docs/04-frontend.md 4.7.
 *
 * Plain TypeScript, no React: a .ts file (no JSX), easy to test on its own
 * (src/lib/format.test.ts).
 */

/**
 * The weight units a user can pick (Profile, docs/01-ui-design.md 1.4.14).
 * A `type` gives a name to a type. `'kg' | 'lb'` is a union type: the value
 * must be exactly one of these strings, and anything else is a type error.
 */
export type WeightUnit = 'kg' | 'lb'

/**
 * Intl's names for our units. Record<K, V> is the type of an object whose
 * keys are K and values V; with K = WeightUnit, TypeScript also demands an
 * entry for every unit, so a new unit cannot be forgotten here.
 */
const INTL_UNITS: Record<WeightUnit, string> = {
  kg: 'kilogram',
  lb: 'pound',
}

/**
 * A plain number in the given language: 1234.5 → "1.234,5" (de), "1,234.5" (en).
 * In `value: number` the part after the colon is the parameter's type;
 * `options?` with a question mark is optional; `): string` is the return type.
 * @param value the number
 * @param language a language code such as 'it'
 * @param options Intl options, e.g. { maximumFractionDigits: 0 }
 * @returns the formatted text
 */
export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(language, options).format(value)
}

/**
 * A weight with its unit: 82.5 → "82,5 kg" (it), "82.5 kg" (en).
 * At most two decimals (plates go down to 1.25 kg), none when whole: "80 kg".
 * `unit: WeightUnit = 'kg'` is a default value, used when the caller leaves
 * the argument out.
 * @param value the weight
 * @param language a language code such as 'it'
 * @param unit 'kg' (default) or 'lb'
 * @returns the formatted weight with its unit
 */
export function formatWeight(value: number, language: string, unit: WeightUnit = 'kg'): string {
  return formatNumber(value, language, {
    style: 'unit',
    unit: INTL_UNITS[unit],
    // "kg" and "lb", not "kilograms"
    unitDisplay: 'short',
    maximumFractionDigits: 2,
  })
}

/**
 * A date written out in full, as at the top of Home: "giovedì 5 novembre"
 * (it), "Thursday, November 5" (en). Intl.DateTimeFormat knows each
 * language's day and month names and their order.
 * @param date the date
 * @param language a language code such as 'it'
 * @returns the weekday, the day and the month, without the year
 */
export function formatLongDate(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

/**
 * Parts of a date for compact displays, such as the week strip on Home:
 * the short weekday ("lun", "Mon") and the day of the month ("5").
 * @param date the date
 * @param language a language code such as 'it'
 */
export function formatDayParts(date: Date, language: string): { weekday: string, day: string } {
  return {
    weekday: new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat(language, { day: 'numeric' }).format(date),
  }
}
