/* A week on Home's calendar: Monday to Sunday, today and the days trained marked. */
import { useTranslation } from 'react-i18next'
import { dayKey } from '@/lib/calendar'
import { formatDayParts } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getWeekDays, isSameDay } from '@/lib/week'
import { CalendarDay } from './CalendarDay'

interface WeekStripProps {
  /** Injectable so tests can fix a date. */
  today?: Date
  /** Any day of the week shown; today's week when missing. */
  week?: Date
  /** Workouts per day, by dayKey(). */
  days?: ReadonlyMap<string, number>
}

export function WeekStrip({ today = new Date(), week = today, days = new Map() }: WeekStripProps) {
  const { i18n } = useTranslation()

  return (
    <ol className="grid grid-cols-7 gap-2">
      {getWeekDays(week).map((day) => {
        const isToday = isSameDay(day, today)
        const count = days.get(dayKey(day)) ?? 0
        const { weekday } = formatDayParts(day, i18n.language)

        return (
          <li key={day.toISOString()} className="flex flex-col items-center gap-2">
            <span className={cn('text-[11px] font-bold tracking-wider uppercase', isToday ? 'text-primary' : 'text-muted-foreground')}>
              {weekday}
            </span>
            <CalendarDay day={day} today={today} count={count} className="max-w-11" />
            {/* An empty space under the others keeps the columns even */}
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', count > 0 ? 'bg-primary' : 'bg-transparent')} />
          </li>
        )
      })}
    </ol>
  )
}
