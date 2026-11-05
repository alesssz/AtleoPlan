/*
 * "This week" on Home (docs/01-ui-design.md 1.4.2): the seven days, Monday
 * to Sunday, with today highlighted. Days trained will be marked when
 * workouts exist (FEAT-3); for now none is, which is also the truth.
 * Day names and numbers come from Intl in the user's language
 * (src/lib/format.ts); the week itself from src/lib/week.ts.
 */
import { useTranslation } from 'react-i18next'
import { formatDayParts } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getWeekDays, isBeforeDay, isSameDay } from '@/lib/week'

/** Props of WeekStrip. */
interface WeekStripProps {
  /** "Today", passed in so tests can fix a date; the real now by default. */
  today?: Date
}

export function WeekStrip({ today = new Date() }: WeekStripProps) {
  // i18n.language: the current language, for the day names
  const { t, i18n } = useTranslation()
  // The seven dates of this week
  const days = getWeekDays(today)

  return (
    // An ordered list of seven equal columns, 8 px apart. A list, so screen
    // readers announce "list, 7 items"
    <ol className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        // Today, a past day, or a day still to come: each looks different
        const isToday = isSameDay(day, today)
        const isPast = isBeforeDay(day, today)
        // "gio" and "5" in Italian, "Thu" and "5" in English
        const { weekday, day: dayNumber } = formatDayParts(day, i18n.language)

        return (
          // toISOString() gives a unique text per day, a good `key`.
          // aria-current="date" tells screen readers which item is today
          <li key={day.toISOString()} aria-current={isToday ? 'date' : undefined} className="flex flex-col items-center gap-2">
            {/* The weekday's short name, small capitals, muted (lime for today) */}
            <span className={cn('text-[11px] font-bold tracking-wider uppercase', isToday ? 'text-primary' : 'text-muted-foreground')}>
              {weekday}
            </span>
            {/* The day number in a circle: today filled with lime and
                glowing, past days on a faint surface, future days with a
                dashed outline (still to come). tabular-nums: same-width digits */}
            <span
              className={cn(
                'grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm font-bold tabular-nums',
                isToday && 'bg-primary text-primary-foreground glow-primary',
                !isToday && isPast && 'bg-muted text-muted-foreground',
                !isToday && !isPast && 'border border-dashed border-border text-muted-foreground',
              )}
            >
              {dayNumber}
            </span>
            {/* Spoken only: "today", since colour alone must never carry meaning (1.7) */}
            {isToday && <span className="sr-only">{t('home.today')}</span>}
          </li>
        )
      })}
    </ol>
  )
}
