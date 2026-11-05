/*
 * Tests of src/lib/week.ts: the Monday-to-Sunday week used by Home's
 * "This week" strip. Vitest basics (describe, it, expect): see
 * src/lib/format.test.ts and docs/04-frontend.md 4.10.
 */
import { describe, expect, it } from 'vitest'
import { getWeekDays, isBeforeDay, isSameDay } from './week'

/**
 * A date as 'YYYY-MM-DD', readable in test failures. getMonth() counts from
 * 0, hence + 1; padStart(2, '0') turns 5 into '05'.
 */
function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

describe('getWeekDays', () => {
  it('starts on Monday and ends on Sunday', () => {
    // Thursday 5 November 2026, mid-afternoon (months count from 0: 10 = November)
    const days = getWeekDays(new Date(2026, 10, 5, 15, 30))
    expect(days.map(ymd)).toEqual([
      '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
    ])
  })

  it('puts a Sunday at the end of its week, not at the start of the next', () => {
    // Sunday 8 November 2026
    expect(ymd(getWeekDays(new Date(2026, 10, 8))[0]!)).toBe('2026-11-02')
  })

  it('crosses the end of a month and of a year', () => {
    // Thursday 31 December 2026: the week runs into January 2027
    expect(getWeekDays(new Date(2026, 11, 31)).map(ymd)).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ])
  })
})

describe('isSameDay and isBeforeDay', () => {
  // A morning and an evening of the same day, and the day before
  const morning = new Date(2026, 10, 5, 8)
  const evening = new Date(2026, 10, 5, 22)
  const yesterday = new Date(2026, 10, 4, 23)

  it('ignores the time of day', () => {
    expect(isSameDay(morning, evening)).toBe(true)
    expect(isSameDay(morning, yesterday)).toBe(false)
  })

  it('tells days before today apart from today', () => {
    expect(isBeforeDay(yesterday, evening)).toBe(true)
    expect(isBeforeDay(new Date(2026, 10, 5), evening)).toBe(false)
  })
})
