/*
 * The app's languages. A new one needs its code here, a locales/<code>.json
 * with every key, and an import in src/i18n/index.ts.
 */

export const SUPPORTED_LANGUAGES = ['it', 'en', 'es', 'de'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/** Fills in any text missing in the user's language. */
export const FALLBACK_LANGUAGE: Language = 'en'

/**
 * Each name in its own language, as the picker shows it: a German speaker
 * looks for "Deutsch". Never translated, so not in the locale files.
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
}

export function isLanguage(value: string | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
}
