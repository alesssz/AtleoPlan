/*
 * History (`/progress/history`): finished workouts by month, newest first.
 * Under /progress so the Progress tab stays active.
 *
 * `?from=2026-11-01&to=2026-11-19` lists those days only, either end open, each
 * day the device's, from its midnight to the next: set with the date filter,
 * or by a day tapped on Home's calendar, which opens the same address with
 * that day twice.
 */
import { ArrowLeft, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useSessions, type WorkoutSession } from '@/api/sessions'
import { EmptyState } from '@/components/EmptyState'
import { DateRangeFilter } from '@/components/history/DateRangeFilter'
import { SessionRow } from '@/components/history/SessionRow'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { dayKey, nextDay, parseDayKey } from '@/lib/calendar'
import { shownData } from '@/lib/shown-data'

interface MonthGroup {
  title: string
  sessions: WorkoutSession[]
}

/**
 * Groups workouts by the month they started in, by the device's clock.
 * @param sessions newest first
 */
function byMonth(sessions: WorkoutSession[], language: string): MonthGroup[] {
  const format = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' })
  const groups: MonthGroup[] = []
  for (const session of sessions) {
    const title = format.format(new Date(session.started_at))
    // Sorted, so a new month always starts a new group
    const last = groups.at(-1)
    if (last?.title === title) last.sessions.push(session)
    else groups.push({ title, sessions: [session] })
  }
  return groups
}

export function HistoryPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  // An end that does not read as a day is open; ends typed backwards swap
  const [from, to] = [parseDayKey(searchParams.get('from')), parseDayKey(searchParams.get('to'))]
    .sort((a, b) => (a && b ? a.getTime() - b.getTime() : 0))
  const filtering = from !== null || to !== null
  // The last day is included: the span ends at the next midnight
  const list = useSessions({ from: from ?? null, to: to ? nextDay(to) : null })
  const pages = shownData(list)
  const sessions = pages?.pages.flatMap(page => page.data) ?? []
  // Nothing to filter in a history still empty
  const noWorkouts = !filtering && pages !== undefined && sessions.length === 0

  /**
   * `replace`: Back leaves history, rather than stepping through the dates
   * tried.
   */
  function filter(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams()
    if (parseDayKey(nextFrom)) params.set('from', nextFrom)
    if (parseDayKey(nextTo)) params.set('to', nextTo)
    setSearchParams(params, { replace: true })
  }

  return (
    <>
      <Link to="/progress" className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('history.backToProgress')}
      </Link>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('history.title')} description={t('history.description')} />

      {!noWorkouts && (
        <div className="mb-6 flex flex-col gap-2">
          <DateRangeFilter from={from ? dayKey(from) : ''} to={to ? dayKey(to) : ''} onChange={filter} />
          {filtering && pages !== undefined && (
            <p aria-live="polite" className="px-1 text-sm text-muted-foreground">{t('history.filter.results', { count: pages.pages[0]?.meta.total ?? 0 })}</p>
          )}
        </div>
      )}

      {list.isPending && (
        <div role="status" className="flex flex-col gap-3">
          {[0, 1, 2].map(row => <Skeleton key={row} className="h-24 w-full rounded-2xl" />)}
          <span className="sr-only">{t('history.loading')}</span>
        </div>
      )}

      {!list.isPending && pages === undefined && (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p>{t('history.loadError')}</p>
          <Button variant="outline" size="xl" onClick={() => void list.refetch()}>{t('server.retry')}</Button>
        </div>
      )}

      {noWorkouts && (
        <EmptyState
          icon={History}
          title={t('history.emptyTitle')}
          description={t('history.emptyText')}
          actions={<Button asChild size="xl"><Link to="/">{t('history.emptyAction')}</Link></Button>}
        />
      )}

      {sessions.length > 0 && (
        <div className="flex flex-col gap-8">
          {byMonth(sessions, i18n.language).map(month => (
            <section key={month.title} aria-label={month.title}>
              {/* Some languages write months in lower case: "novembre 2026" */}
              <h2 className="mb-3 font-heading text-lg font-extrabold tracking-tight first-letter:uppercase">{month.title}</h2>
              <ul className="flex flex-col gap-3">
                {month.sessions.map(session => (
                  <li key={session.id}><SessionRow session={session} /></li>
                ))}
              </ul>
            </section>
          ))}
          {list.hasNextPage && (
            <Button variant="outline" size="xl" className="self-center" pending={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
              {t('exercises.showMore')}
            </Button>
          )}
        </div>
      )}
    </>
  )
}
