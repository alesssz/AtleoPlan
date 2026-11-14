/*
 * Checks that the four translation files agree: every language has exactly
 * the English keys, no text is empty, and every {{placeholder}} of the
 * English text is kept in the translation. A key forgotten in one language
 * would show English to that user (the fallback); this catches it first.
 */
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from './languages'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import itLocale from './locales/it.json'

type Messages = { [key: string]: string | Messages }

/** `it` is also Vitest's function, hence itLocale. */
const LOCALES: Record<string, Messages> = { it: itLocale, en, es, de }

/**
 * { 'nav.home': 'Home', … }: the dotted keys t() takes.
 */
function flatten(messages: Messages, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {}
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') flat[path] = value
    else Object.assign(flat, flatten(value, path))
  }
  return flat
}

/** The {{names}} used in a text, sorted. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(match => match[1] ?? '').sort()
}

const english = flatten(en)

describe('translation files', () => {
  it('exist for every supported language', () => {
    expect(Object.keys(LOCALES).sort()).toEqual([...SUPPORTED_LANGUAGES].sort())
  })

  describe.each(SUPPORTED_LANGUAGES.filter(language => language !== 'en'))('%s', (language) => {
    const messages = flatten(LOCALES[language] ?? {})

    it('has exactly the English keys', () => {
      expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort())
    })

    it('has no empty text', () => {
      const empty = Object.entries(messages).filter(([, text]) => text.trim() === '').map(([key]) => key)
      expect(empty).toEqual([])
    })

    it('keeps the English placeholders', () => {
      for (const [key, text] of Object.entries(english)) {
        expect(placeholders(messages[key] ?? ''), key).toEqual(placeholders(text))
      }
    })
  })
})
