/*
 * The summary's "How did it feel?": the five values and their words, also used
 * by history. Apart from FeelingPicker.tsx, which may then export only
 * components (Fast Refresh).
 */
import type { TFunction } from 'i18next'

export const FEELINGS = [1, 2, 3, 4, 5] as const

/** Literal keys, so TypeScript checks them against the translation files. */
const FEELING_KEYS = { 1: 'summary.feeling1', 2: 'summary.feeling2', 3: 'summary.feeling3', 4: 'summary.feeling4', 5: 'summary.feeling5' } as const

/**
 * The word for a feeling, in the user's language: 4 → "Good".
 * @param value 1 to 5
 */
export function feelingName(value: number, t: TFunction): string {
  // A value outside 1–5, never sent by the backend, reads as the middle one
  return t(FEELING_KEYS[value as keyof typeof FEELING_KEYS] ?? FEELING_KEYS[3])
}
