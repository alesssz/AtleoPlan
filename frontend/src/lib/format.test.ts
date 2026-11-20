import { describe, expect, it } from 'vitest'
import { formatClockTime, formatDayParts, formatDaysAgo, formatDuration, formatLongDate, formatNumber, formatTimeRange, formatWeight, formatWorkoutWhen } from './format'

describe('formatWeight', () => {
  // [language, what 82.5 kg must look like]
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
  // Thursday 5 November 2026
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
    // Sunday 8 November 2026, 08:00
    const today = new Date(2026, 10, 8, 8, 0)

    expect(formatDaysAgo(new Date(2026, 10, 8, 6, 0), today, 'en')).toBe('today')
    // 23:00 the evening before: 9 hours, but yesterday
    expect(formatDaysAgo(new Date(2026, 10, 7, 23, 0), today, 'en')).toBe('yesterday')
    expect(formatDaysAgo(new Date(2026, 10, 5, 18, 0), today, 'en')).toBe('3 days ago')
    expect(formatDaysAgo(new Date(2026, 10, 7, 18, 0), today, 'it')).toBe('ieri')
    expect(formatDaysAgo(new Date(2026, 10, 5, 18, 0), today, 'it')).toBe('3 giorni fa')
  })
})

describe('formatClockTime', () => {
  it('gives the time of day with seconds, in the language\'s way', () => {
    const at = new Date(2026, 10, 19, 10, 42, 15)
    expect(formatClockTime(at, 'it')).toBe('10:42:15')
    expect(formatClockTime(at, 'en')).toBe('10:42:15 AM')
  })
})

describe('formatTimeRange', () => {
  // Built from local hours, so the text is the same in every time zone.
  // Intl writes thin and narrow spaces in English; compared as plain ones
  const plain = (text: string) => text.replace(/\s/g, ' ')
  const start = new Date(2026, 10, 19, 18, 5)

  it('writes a workout of one evening as a range of times', () => {
    expect(formatTimeRange(start, new Date(2026, 10, 19, 19, 12), 'it')).toBe('18:05–19:12')
    expect(plain(formatTimeRange(start, new Date(2026, 10, 19, 19, 12), 'en'))).toBe('6:05 – 7:12 PM')
  })

  it('adds the date of an end on another day', () => {
    const late = new Date(2026, 10, 19, 23, 30)
    expect(formatTimeRange(late, new Date(2026, 10, 20, 8, 10), 'it')).toBe('23:30 – 20 nov, 8:10')
    expect(plain(formatTimeRange(late, new Date(2026, 10, 20, 8, 10), 'en'))).toBe('11:30 PM – Nov 20, 8:10 AM')
  })

  it('writes the start alone when there is no end', () => {
    expect(formatTimeRange(start, null, 'it')).toBe('18:05')
  })
})

describe('formatWorkoutWhen', () => {
  it('writes the date, then the times', () => {
    expect(formatWorkoutWhen(new Date(2026, 10, 19, 11, 1), new Date(2026, 10, 19, 12, 7), 'it')).toBe('giovedì 19 novembre 2026 · 11:01–12:07')
  })
})
