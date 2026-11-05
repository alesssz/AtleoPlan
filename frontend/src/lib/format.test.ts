/*
 * Tests of src/lib/format.ts: the number formats of each language
 * (docs/02-decisions.md 2.4), the decimal comma in Italian, Spanish and
 * German, the point in English. Run with `npm test` (Vitest); how tests
 * are organised: docs/04-frontend.md 4.10.
 *
 * The three Vitest functions used everywhere:
 * - describe('name', fn): a group of related tests, shown together in the report;
 * - it('does something', fn): one test; it fails if anything inside throws;
 * - expect(actual).toBe(expected): a check ("matcher") that throws when
 *   the two differ. toBe compares with ===, toEqual compares contents.
 */
import { describe, expect, it } from 'vitest'
import { formatDayParts, formatLongDate, formatNumber, formatWeight } from './format'

describe('formatWeight', () => {
  // it.each([...rows])(name, fn): the same test once per row; each row's
  // values become fn's parameters, and %s in the name shows the first one.
  // Row: [language, what 82.5 kg must look like]
  it.each([
    ['it', '82,5 kg'],
    ['es', '82,5 kg'],
    ['de', '82,5 kg'],
    ['en', '82.5 kg'],
  ])('writes 82.5 kg as %s expects', (language, expected) => {
    expect(formatWeight(82.5, language)).toBe(expected)
  })

  it('drops the decimals of a whole weight', () => {
    expect(formatWeight(80, 'it')).toBe('80 kg')
  })

  it('keeps two decimals at most', () => {
    // (not 1.255: as a binary float it is 1.25499…, which rounds down)
    expect(formatWeight(1.256, 'en')).toBe('1.26 kg')
  })

  it('writes pounds as lb', () => {
    expect(formatWeight(180, 'en', 'lb')).toBe('180 lb')
  })
})

describe('formatNumber', () => {
  it('groups thousands the language’s way', () => {
    expect(formatNumber(12345.5, 'de')).toBe('12.345,5')
    expect(formatNumber(12345.5, 'en')).toBe('12,345.5')
  })
})

describe('formatLongDate and formatDayParts', () => {
  // Thursday 5 November 2026 (months count from 0: 10 = November)
  const date = new Date(2026, 10, 5)

  it('writes the full date in each language’s words and order', () => {
    expect(formatLongDate(date, 'it')).toBe('giovedì 5 novembre')
    expect(formatLongDate(date, 'en')).toBe('Thursday, November 5')
    expect(formatLongDate(date, 'de')).toBe('Donnerstag, 5. November')
  })

  it('gives the short weekday and the day number', () => {
    expect(formatDayParts(date, 'it')).toEqual({ weekday: 'gio', day: '5' })
    expect(formatDayParts(date, 'en')).toEqual({ weekday: 'Thu', day: '5' })
  })
})
