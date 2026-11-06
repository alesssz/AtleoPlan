/*
 * The languages of the app, in one place: which ones exist, how each is
 * called in its own language (for the language picker), and which one is
 * used when a text is missing. docs/design/D2-decisions.md D2.4.
 *
 * Adding a language: add its code here, a src/i18n/locales/<code>.json with
 * every key, and import it in src/i18n/index.ts (docs/concepts/C1-frontend.md C1.7).
 */

/**
 * Every language the interface is translated into, as ISO 639-1 codes.
 * `as const` makes TypeScript keep the exact values ('it' | 'en' | …)
 * instead of widening them to `string`, so `Language` below is a precise type.
 */
export const SUPPORTED_LANGUAGES = ['it', 'en', 'es', 'de'] as const

/**
 * One of the supported language codes: 'it' | 'en' | 'es' | 'de'.
 * `typeof SUPPORTED_LANGUAGES` is the array's type; `[number]` is the type
 * of its elements. A union type derived from the list, so the two cannot
 * drift apart.
 */
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/** English fills in any text missing in the user's language (D2.4). */
export const FALLBACK_LANGUAGE: Language = 'en'

/**
 * Each language's name written in that language, as the picker shows it:
 * a German speaker looks for "Deutsch", not "Tedesco". Not translated on
 * purpose, so these never go in the locale files. Record<Language, string>
 * requires one entry per language: a new language without a name is a
 * type error.
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
}

/**
 * Type guard: tells TypeScript that `value` is a Language when it returns
 * true, so code after an `if (isLanguage(x))` can use x as one. The return
 * type `value is Language` is what makes it a guard; the body is an
 * ordinary runtime check (`as Language` only quiets includes()'s typing).
 * @param value any string, or undefined
 * @returns whether it is one of SUPPORTED_LANGUAGES
 */
export function isLanguage(value: string | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
}
