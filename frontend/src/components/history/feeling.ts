/*
 * The summary's "How did it feel?" (docs/design/D1-ui.md D1.4.10): the five
 * values and their words. A file of its own, not inside FeelingPicker.tsx:
 * the workout's page in history needs the words too, and a .tsx file should
 * export components only, so React's fast refresh can reload it in place
 * while developing (the lint rule react-refresh/only-export-components).
 */
import type { TFunction } from 'i18next'

/** The five values, from the worst to the best. */
export const FEELINGS = [1, 2, 3, 4, 5] as const

/**
 * The translation keys of the five words, by value. A table, rather than
 * building the key as text (`summary.feeling${value}`), so that TypeScript
 * checks every key against the translation files.
 */
const FEELING_KEYS = { 1: 'summary.feeling1', 2: 'summary.feeling2', 3: 'summary.feeling3', 4: 'summary.feeling4', 5: 'summary.feeling5' } as const

/**
 * The word for a feeling, in the user's language: 4 → "Good".
 * @param value 1 to 5
 * @param t the translate function
 */
export function feelingName(value: number, t: TFunction): string {
  // `value as keyof …`: a number is not known to be 1–5; a value outside
  // (never sent by the backend) reads as the middle one
  return t(FEELING_KEYS[value as keyof typeof FEELING_KEYS] ?? FEELING_KEYS[3])
}
