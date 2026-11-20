import { describe, expect, it } from 'vitest'
import { dayKey, inSpan, monthGrid, nextDay, parseDayKey, shiftSpan, spanOf } from './calendar'

/** A local moment, as the device sees it. */
function local(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  return new Date(year, month - 1, day, hours, minutes)
}

describe('spanOf', () => {
  it('runs a week from Monday\'s midnight to the next Monday\'s', () => {
    // Thursday 19 November 2026
    expect(spanOf('week', local(2026, 11, 19, 18))).toEqual({ from: local(2026, 11, 16), to: local(2026, 11, 23) })
    // A Sunday belongs to the week before
    expect(spanOf('week', local(2026, 11, 22, 23, 59)).from).toEqual(local(2026, 11, 16))
  })

  it('runs a month and a year from their first midnight to the next one\'s', () => {
    expect(spanOf('month', local(2026, 12, 31, 23))).toEqual({ from: local(2026, 12, 1), to: local(2027, 1, 1) })
    expect(spanOf('year', local(2028, 2, 29))).toEqual({ from: local(2028, 1, 1), to: local(2029, 1, 1) })
  })

  it('keeps midnight across a daylight saving change', () => {
    // Europe changes the clock on the last Sunday of March: 2027-03-28
    const { from, to } = spanOf('week', local(2027, 3, 24))
    expect(to.getHours()).toBe(0)
    expect(to.getDate()).toBe(from.getDate() + 7)
  })
})

describe('shiftSpan', () => {
  it('moves by whole weeks, months and years, from the span\'s start', () => {
    expect(shiftSpan('week', local(2026, 11, 19), -1)).toEqual(local(2026, 11, 9))
    // 31 January moved by a month is February, not 3 March
    expect(shiftSpan('month', local(2027, 1, 31), 1)).toEqual(local(2027, 2, 1))
    expect(shiftSpan('year', local(2026, 6, 15), -2)).toEqual(local(2024, 1, 1))
  })
})

describe('inSpan', () => {
  it('includes the start and leaves out the end', () => {
    const span = spanOf('month', local(2026, 11, 5))
    expect(inSpan(local(2026, 11, 1), span)).toBe(true)
    expect(inSpan(local(2026, 11, 30, 23, 59), span)).toBe(true)
    expect(inSpan(local(2026, 12, 1), span)).toBe(false)
  })
})

describe('monthGrid', () => {
  it('lays a month out in weeks from Monday, empty before the 1st and after the last', () => {
    // November 2026 starts on a Sunday and ends on a Monday
    const weeks = monthGrid(local(2026, 11, 19))

    expect(weeks).toHaveLength(6)
    expect(weeks[0]!.slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(weeks[0]![6]).toEqual(local(2026, 11, 1))
    expect(weeks[5]![0]).toEqual(local(2026, 11, 30))
    expect(weeks[5]!.slice(1).every(day => day === null)).toBe(true)
  })

  it('fills four rows exactly for a February from Monday to Sunday', () => {
    expect(monthGrid(local(2027, 2, 1))).toHaveLength(4)
  })
})

describe('day keys', () => {
  it('writes and reads the local day', () => {
    expect(dayKey(local(2026, 11, 19, 23, 30))).toBe('2026-11-19')
    expect(parseDayKey('2026-11-19')).toEqual(local(2026, 11, 19))
    expect(nextDay(local(2026, 11, 30))).toEqual(local(2026, 12, 1))
  })

  it('reads nothing that is not a day', () => {
    for (const key of [null, '', '2026-02-30', '2026-13-01', '19/11/2026', '2026-11-19T00:00']) {
      expect(parseDayKey(key)).toBeNull()
    }
  })
})
