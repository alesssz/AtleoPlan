/*
 * One day of Home's calendar, in the week and in the month: a link to that
 * day's workouts in history when trained, a plain number otherwise. Today is
 * filled in lime, a day trained tinted; days still ahead are dashed.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { dayKey } from '@/lib/calendar'
import { formatLongDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { isBeforeDay, isSameDay } from '@/lib/week'

interface CalendarDayProps {
  day: Date
  today: Date
  /** Workouts started that day. */
  count: number
  className?: string
}

export function CalendarDay({ day, today, count, className }: CalendarDayProps) {
  const { t, i18n } = useTranslation()
  const isToday = isSameDay(day, today)
  const isPast = isBeforeDay(day, today)
  const trained = count > 0
  const classes = cn(
    'grid aspect-square w-full place-items-center rounded-full text-sm font-bold tabular-nums',
    isToday && 'bg-primary text-primary-foreground glow-primary',
    !isToday && trained && 'bg-primary/20 text-foreground ring-1 ring-primary/60 hover:bg-primary/30',
    !isToday && !trained && isPast && 'bg-muted text-muted-foreground',
    !isToday && !isPast && 'border border-dashed border-border text-muted-foreground',
    className,
  )
  const number = day.getDate()

  if (!trained) {
    return (
      <span aria-current={isToday ? 'date' : undefined} className={classes}>
        {number}
        {/* Colour alone must never carry meaning */}
        {isToday && <span className="sr-only">{`, ${t('home.today')}`}</span>}
      </span>
    )
  }
  return (
    <Link
      to={`/progress/history?from=${dayKey(day)}&to=${dayKey(day)}`}
      aria-label={t('home.calendar.dayWorkouts', { date: formatLongDate(day, i18n.language), count })}
      aria-current={isToday ? 'date' : undefined}
      className={cn(classes, 'outline-offset-2')}
    >
      {number}
    </Link>
  )
}
