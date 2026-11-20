/*
 * Home's calendar: when did I train, over a week, a month or a year. A day
 * trained opens that day's workouts in history; in the year a month opens
 * the month, since a day there is too small for a finger.
 *
 * This week needs no request: GET /api/home already holds the last 8 days, so
 * Home still opens with one request, offline too. Any other span asks
 * GET /api/sessions/calendar, kept on the phone like every answer.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCalendar, type CalendarSession } from '@/api/sessions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dayKey, inSpan, monthGrid, shiftSpan, spanOf, type CalendarView, type Span } from '@/lib/calendar'
import { shownData } from '@/lib/shown-data'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getWeekDays, isSameDay } from '@/lib/week'
import { CalendarDay } from './CalendarDay'
import { periodSummary } from './period-summary'
import { WeekStrip } from './WeekStrip'

const VIEWS: CalendarView[] = ['week', 'month', 'year']

interface TrainingCalendarProps {
  /** GET /api/home's finished workouts of the last 8 days. */
  recent: readonly CalendarSession[]
  /** Injectable so tests can fix a date. */
  today?: Date
}

export function TrainingCalendar({ recent, today = new Date() }: TrainingCalendarProps) {
  const { t, i18n } = useTranslation()
  const [view, setView] = useState<CalendarView>('week')
  // Any day of the span shown
  const [anchor, setAnchor] = useState(today)
  const span = spanOf(view, anchor)
  const current = inSpan(today, span)
  const thisWeek = view === 'week' && current
  const calendar = useCalendar(span, !thisWeek)
  const fetched = shownData(calendar)
  const summary = periodSummary([...recent, ...(fetched ?? [])], span)
  // Offline with nothing kept, the request waits for the network: that is
  // a failure to say, not a load to wait for
  const loading = !thisWeek && calendar.isPending && calendar.fetchStatus === 'fetching'
  const failed = !thisWeek && !loading && fetched === undefined

  /** Another view keeps today in sight when the span shown holds it. */
  function changeView(next: string) {
    setAnchor(current ? today : span.from)
    setView(next as CalendarView)
  }

  /** From the year, a month opens as a month. */
  function openMonth(month: Date) {
    setAnchor(month)
    setView('month')
  }

  return (
    <section aria-labelledby="calendar-title" className="border-glow flex flex-col rounded-3xl p-6 lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        {/* Some languages write months in lower case: "novembre 2026" */}
        <h2 id="calendar-title" className="min-w-0 flex-1 truncate font-heading text-lg font-extrabold tracking-tight first-letter:uppercase">
          {thisWeek ? t('home.weekTitle') : spanTitle(view, span, i18n.language)}
        </h2>
        <Button variant="ghost" size="icon-xl" aria-label={t(`home.calendar.previous.${view}`)} onClick={() => setAnchor(shiftSpan(view, anchor, -1))}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        {/* Nothing to see ahead of today */}
        <Button variant="ghost" size="icon-xl" aria-label={t(`home.calendar.next.${view}`)} disabled={current} onClick={() => setAnchor(shiftSpan(view, anchor, 1))}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <Tabs value={view} onValueChange={changeView} className="gap-5">
        <div className="flex items-center gap-3">
          <TabsList aria-label={t('home.calendar.views')} className="h-auto! rounded-xl p-1">
            {VIEWS.map(value => (
              <TabsTrigger key={value} value={value} className="min-h-10 rounded-lg px-4 text-sm">{t(`home.calendar.${value}`)}</TabsTrigger>
            ))}
          </TabsList>
          {!current && (
            <Button variant="link" className="ml-auto min-h-12 px-1 font-semibold" onClick={() => setAnchor(today)}>
              {t('home.calendar.backToToday')}
            </Button>
          )}
        </div>

        <TabsContent value="week">
          <WeekStrip today={today} week={anchor} days={summary.days} />
        </TabsContent>
        <TabsContent value="month">
          <MonthGrid month={span.from} today={today} days={summary.days} />
        </TabsContent>
        <TabsContent value="year">
          <YearGrid year={span.from} today={today} days={summary.days} onOpenMonth={openMonth} />
        </TabsContent>
      </Tabs>

      {/* At the bottom when the card is taller than its content, next to the
          plan's */}
      <div className="mt-6 lg:mt-auto lg:pt-6">
        {loading && (
          <div role="status">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <span className="sr-only">{t('home.calendar.loading')}</span>
          </div>
        )}
        {failed && (
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm">{t('home.calendar.loadError')}</p>
            <Button variant="outline" size="xl" onClick={() => void calendar.refetch()}>{t('server.retry')}</Button>
          </div>
        )}
        {/* How many and how long: what a calendar of training says. No
            total of sets, which adds up unlike exercises */}
        {!loading && !failed && summary.workouts === 0 && (
          <p className="text-sm text-muted-foreground">{thisWeek ? t('home.weekEmpty') : t('home.calendar.empty')}</p>
        )}
        {!loading && !failed && summary.workouts > 0 && (
          <div className="flex flex-col items-start">
            <p className="font-semibold">
              {t('home.calendar.workouts', { count: summary.workouts })}
              {summary.seconds > 0 && <span className="text-muted-foreground">{` · ${formatDuration(summary.seconds, i18n.language)}`}</span>}
            </p>
            <Link to="/progress/history" className="inline-flex min-h-12 items-center text-sm font-semibold text-primary hover:underline">
              {t('home.history')}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/** "16–22 Nov 2026", "November 2026", "2026". */
function spanTitle(view: CalendarView, span: Span, language: string): string {
  if (view === 'year') return String(span.from.getFullYear())
  if (view === 'month') return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(span.from)
  const sunday = new Date(span.to.getFullYear(), span.to.getMonth(), span.to.getDate() - 1)
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(span.from, sunday)
}

interface GridProps {
  today: Date
  /** Workouts per day, by dayKey(). */
  days: ReadonlyMap<string, number>
}

/** The weekdays' names, short and long, Monday first, in the user's language. */
function weekdayNames(language: string): { short: string, long: string }[] {
  const short = new Intl.DateTimeFormat(language, { weekday: 'short' })
  const long = new Intl.DateTimeFormat(language, { weekday: 'long' })
  return getWeekDays(new Date()).map(day => ({ short: short.format(day), long: long.format(day) }))
}

/** A month as a table: a column per weekday, a row per week. */
function MonthGrid({ month, today, days }: GridProps & { month: Date }) {
  const { i18n } = useTranslation()

  return (
    <table className="w-full table-fixed border-separate border-spacing-1">
      <thead>
        <tr>
          {weekdayNames(i18n.language).map(name => (
            <th key={name.long} scope="col" abbr={name.long} className="pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {name.short}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {monthGrid(month).map(week => (
          <tr key={dayKey(week.find(day => day !== null)!)}>
            {week.map((day, column) => (
              <td key={day ? dayKey(day) : `empty-${column}`} className="p-0">
                {/* Smaller than the week's: six rows must not outgrow the plan's card beside */}
                {day && <CalendarDay day={day} today={today} count={days.get(dayKey(day)) ?? 0} className="mx-auto max-w-9 text-xs" />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Twelve small months, each a button that opens it: a dot per day, lime when
 * trained. Months still ahead are disabled, as the arrow is.
 */
function YearGrid({ year, today, days, onOpenMonth }: GridProps & { year: Date, onOpenMonth: (month: Date) => void }) {
  const { t, i18n } = useTranslation()
  const name = new Intl.DateTimeFormat(i18n.language, { month: 'long' })
  const label = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
  const months = Array.from({ length: 12 }, (_, index) => new Date(year.getFullYear(), index, 1))

  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {months.map((month) => {
        const ahead = month.getTime() > today.getTime()
        const isCurrent = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()
        const grid = monthGrid(month)
        const count = grid.flat().reduce((sum, day) => sum + (day ? days.get(dayKey(day)) ?? 0 : 0), 0)
        return (
          <li key={month.getMonth()}>
            <button
              type="button"
              disabled={ahead}
              aria-label={t('home.calendar.monthWorkouts', { month: label.format(month), count })}
              onClick={() => onOpenMonth(month)}
              className={cn(
                'flex w-full flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40',
                isCurrent && 'border-primary/60',
              )}
            >
              <span className="truncate text-[11px] font-bold first-letter:uppercase">{name.format(month)}</span>
              <span aria-hidden="true" className="grid grid-cols-7 gap-0.5">
                {grid.flat().map((day, cell) => (
                  <span
                    key={day ? dayKey(day) : `empty-${cell}`}
                    className={cn('aspect-square rounded-[2px]', day === null ? 'bg-transparent' : (days.get(dayKey(day)) ?? 0) > 0 ? 'bg-primary' : isSameDay(day, today) ? 'bg-primary/40' : 'bg-muted')}
                  />
                ))}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
