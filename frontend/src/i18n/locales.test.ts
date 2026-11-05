/*
 * Checks that the four translation files agree: every language has exactly
 * the English keys, no text is empty, and every {{placeholder}} of the
 * English text is kept in the translation. A key forgotten in one language
 * would show English to that user (the fallback); this catches it first.
 * docs/04-frontend.md 4.7 (translations) and 4.10 (tests).
 *
 * Vitest in brief: describe() groups tests, it() is one test, and
 * expect(actual).toEqual(expected) fails the test when the two differ
 * (toEqual compares contents, so two separate arrays with the same items
 * are equal).
 */
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from './languages'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import itLocale from './locales/it.json'

/**
 * A translation file: nested objects whose leaves are strings. The type
 * refers to itself (a value is a string or another Messages), and
 * `{ [key: string]: … }` means "any key name".
 */
type Messages = { [key: string]: string | Messages }

/** Every file, by language code (`it` is also Vitest's function name, hence itLocale). */
const LOCALES: Record<string, Messages> = { it: itLocale, en, es, de }

/**
 * Flattens a translation file into { 'nav.home': 'Home', … }, the same
 * dotted keys that t() takes. Calls itself for each nested object (recursion).
 * @param messages the (part of the) file to flatten
 * @param prefix the dotted path above it; '' at the top
 * @returns the texts by dotted key
 */
function flatten(messages: Messages, prefix = ''): Record<string, string> {
  // The flat result, filled while walking the tree
  const flat: Record<string, string> = {}
  // Object.entries() gives [key, value] pairs; `const [key, value]`
  // destructures each pair into two variables
  for (const [key, value] of Object.entries(messages)) {
    // The dotted path of this entry (a template literal: `${…}` inserts values)
    const path = prefix ? `${prefix}.${key}` : key
    // typeof checks the kind of value at runtime; TypeScript then knows
    // `value` is a string in the first branch and a Messages in the second
    if (typeof value === 'string') flat[path] = value
    else Object.assign(flat, flatten(value, path))
  }
  return flat
}

/**
 * The {{names}} used in a text, sorted, e.g. ['section'] for "… {{section}} …".
 * `[...iterable]` (spread) turns the regular-expression matches into an
 * array; match[1] is the captured name, `?? ''` covers the (impossible)
 * missing case that TypeScript's strict indexing asks about.
 * @param text one translated text
 * @returns its placeholder names
 */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(match => match[1] ?? '').sort()
}

/** The reference: the English keys and texts. */
const english = flatten(en)

describe('translation files', () => {
  it('exist for every supported language', () => {
    // [...SUPPORTED_LANGUAGES] copies the read-only list, so sort() can reorder it
    expect(Object.keys(LOCALES).sort()).toEqual([...SUPPORTED_LANGUAGES].sort())
  })

  // describe.each(list)(name, fn): one group of tests per language other
  // than English; %s in the name shows the language
  describe.each(SUPPORTED_LANGUAGES.filter(language => language !== 'en'))('%s', (language) => {
    // This language's texts, flattened like the English ones
    const messages = flatten(LOCALES[language] ?? {})

    it('has exactly the English keys', () => {
      expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort())
    })

    it('has no empty text', () => {
      // The keys whose text is blank. `([, text])` destructures a pair and
      // skips its first item (the comma with nothing before it)
      const empty = Object.entries(messages).filter(([, text]) => text.trim() === '').map(([key]) => key)
      expect(empty).toEqual([])
    })

    it('keeps the English placeholders', () => {
      for (const [key, text] of Object.entries(english)) {
        // The second argument of expect() names the key in the failure message
        expect(placeholders(messages[key] ?? ''), key).toEqual(placeholders(text))
      }
    })
  })
})
