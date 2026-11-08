/*
 * Tests of src/lib/format.ts: the number formats of each language
 * (docs/design/D2-decisions.md D2.4), the decimal comma in Italian, Spanish and
 * German, the point in English. Run with `npm test` (Vitest); how tests
 * are organised: docs/concepts/C1-frontend.md C1.10.
 *
 * The three Vitest functions used everywhere:
 * - describe('name', fn): a group of related tests, shown together in the report;
 * - it('does something', fn): one test; it fails if anything inside throws;
 * - expect(actual).toBe(expected): a check ("matcher") that throws when
 *   the two differ. toBe compares with ===, toEqual compares contents.
 */
import { describe, expect, it } from 'vitest'
import { formatDayParts, formatDaysAgo, formatDuration, formatLongDate, formatNumber, formatWeight } from './format'

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

describe('formatDuration', () => {
  it('writes minutes, or hours and minutes, in each language\'s short units', () => {
    expect(formatDuration(2580, 'it')).toBe('43 min')
    expect(formatDuration(3900, 'it')).toBe('1 h 5 min')
    expect(formatDuration(3900, 'en')).toBe('1 hr 5 min')
    expect(formatDuration(7200, 'de')).toBe('2 Std.')
    // A few seconds still read as a minute; nothing as zero
    expect(formatDuration(20, 'en')).toBe('1 min')
    expect(formatDuration(0, 'en')).toBe('0 min')
  })
})

describe('formatDaysAgo', () => {
  it('counts calendar days, in each language\'s words', () => {
    // Sunday 8 November 2026, 08:00 (months count from 0: 10 is November)
    const today = new Date(2026, 10, 8, 8, 0)

    expect(formatDaysAgo(new Date(2026, 10, 8, 6, 0), today, 'en')).toBe('today')
    // 23:00 the evening before: 9 hours, but yesterday
    expect(formatDaysAgo(new Date(2026, 10, 7, 23, 0), today, 'en')).toBe('yesterday')
    expect(formatDaysAgo(new Date(2026, 10, 5, 18, 0), today, 'en')).toBe('3 days ago')
    expect(formatDaysAgo(new Date(2026, 10, 7, 18, 0), today, 'it')).toBe('ieri')
    expect(formatDaysAgo(new Date(2026, 10, 5, 18, 0), today, 'it')).toBe('3 giorni fa')
  })
})
