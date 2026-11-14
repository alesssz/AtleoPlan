/*
 * Numbers in the user's language: "82,5 kg" in Italian, Spanish and German,
 * "82.5 kg" in English. Never `${value} kg`: the separator would be wrong in
 * three languages out of four.
 */

export type WeightUnit = 'kg' | 'lb'

const INTL_UNITS: Record<WeightUnit, string> = {
  kg: 'kilogram',
  lb: 'pound',
}

/** 1234.5 → "1.234,5" (de), "1,234.5" (en). */
export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(language, options).format(value)
}

/**
 * 82.5 → "82,5 kg" (it). Two decimals at most (plates go down to 1.25 kg),
 * none when whole.
 */
export function formatWeight(value: number, language: string, unit: WeightUnit = 'kg'): string {
  return formatNumber(value, language, {
    style: 'unit',
    unit: INTL_UNITS[unit],
    // "kg" and "lb", not "kilograms"
    unitDisplay: 'short',
    maximumFractionDigits: 2,
  })
}

/** Home's heading: "giovedì 5 novembre" (it), "Thursday, November 5" (en). */
export function formatLongDate(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

/** For Home's week strip: "lun" and "5". */
export function formatDayParts(date: Date, language: string): { weekday: string, day: string } {
  return {
    weekday: new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat(language, { day: 'numeric' }).format(date),
  }
}

/**
 * A time trained: "45 min", "1 h 5 min" (it), "1 hr 5 min" (en),
 * "1 Std., 5 Min." (de). Rounded to the minute, at least "1 min" above zero.
 */
export function formatDuration(seconds: number, language: string): string {
  const total = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  const part = (value: number, unit: 'hour' | 'minute') => formatNumber(value, language, { style: 'unit', unit, unitDisplay: 'short' })
  if (hours === 0) return part(minutes, 'minute')
  // 'narrow': "1 h 5 min" in Italian, not "1 h e 5 min"
  return minutes === 0 ? part(hours, 'hour') : new Intl.ListFormat(language, { style: 'narrow', type: 'unit' }).format([part(hours, 'hour'), part(minutes, 'minute')])
}

/**
 * "today", "yesterday", "3 days ago". Calendar days in the device's time
 * zone, not 24-hour periods: a workout at 23:00 is "yesterday" at 08:00 the
 * next morning.
 */
export function formatDaysAgo(date: Date, today: Date, language: string): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Rounded: a daylight-saving change adds or removes an hour
  const days = Math.round((now.getTime() - day.getTime()) / 86_400_000)
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-days, 'day')
}
