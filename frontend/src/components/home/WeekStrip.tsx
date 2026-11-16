/* "This week" on Home: Monday to Sunday, today and the days trained marked. */
import { useTranslation } from 'react-i18next'
import { formatDayParts } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getWeekDays, isBeforeDay, isSameDay } from '@/lib/week'

interface WeekStripProps {
  /** Injectable so tests can fix a date. */
  today?: Date
  trainedDays?: Date[]
}

export function WeekStrip({ today = new Date(), trainedDays = [] }: WeekStripProps) {
  const { t, i18n } = useTranslation()
  const days = getWeekDays(today)

  return (
    <ol className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const isToday = isSameDay(day, today)
        const isPast = isBeforeDay(day, today)
        const trained = trainedDays.some(done => isSameDay(done, day))
        const { weekday, day: dayNumber } = formatDayParts(day, i18n.language)

        return (
          <li key={day.toISOString()} aria-current={isToday ? 'date' : undefined} className="flex flex-col items-center gap-2">
            <span className={cn('text-[11px] font-bold tracking-wider uppercase', isToday ? 'text-primary' : 'text-muted-foreground')}>
              {weekday}
            </span>
            <span
              className={cn(
                'grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm font-bold tabular-nums',
                isToday && 'bg-primary text-primary-foreground glow-primary',
                !isToday && trained && 'bg-primary/20 text-foreground ring-1 ring-primary/60',
                !isToday && !trained && isPast && 'bg-muted text-muted-foreground',
                !isToday && !isPast && 'border border-dashed border-border text-muted-foreground',
              )}
            >
              {dayNumber}
            </span>
            {/* An empty space under the others keeps the columns even */}
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', trained ? 'bg-primary' : 'bg-transparent')} />
            {/* Colour alone must never carry meaning */}
            {isToday && <span className="sr-only">{t('home.today')}</span>}
            {trained && <span className="sr-only">{t('home.trained')}</span>}
          </li>
        )
      })}
    </ol>
  )
}
