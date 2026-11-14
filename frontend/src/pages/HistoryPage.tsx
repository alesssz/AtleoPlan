/*
 * History (route `/progress/history`): every finished workout, newest first,
 * grouped by month ("November 2026"), 20 at a time with **Show more**. Each row
 * opens the workout's page.
 *
 * Under Progress in the address, so the Progress tab stays lit: NavLink marks a
 * tab active for every address that starts with its own.
 *
 * Paged like the exercise library.
 */
import { ArrowLeft, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSessions, type WorkoutSession } from '@/api/sessions'
import { EmptyState } from '@/components/EmptyState'
import { SessionRow } from '@/components/history/SessionRow'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MonthGroup {
  title: string
  sessions: WorkoutSession[]
}

/**
 * Groups workouts, already newest first, by the month they started in, by
 * the device's clock.
 * @param sessions the workouts, newest first
 * @param language the interface's language, for the months' names
 */
function byMonth(sessions: WorkoutSession[], language: string): MonthGroup[] {
  const format = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' })
  const groups: MonthGroup[] = []
  for (const session of sessions) {
    const title = format.format(new Date(session.started_at))
    // Sorted, so a new month starts a new group
    const last = groups.at(-1)
    if (last?.title === title) last.sessions.push(session)
    else groups.push({ title, sessions: [session] })
  }
  return groups
}

export function HistoryPage() {
  const { t, i18n } = useTranslation()
  const list = useSessions()
  const sessions = list.data?.pages.flatMap(page => page.data) ?? []

  return (
    <>
      <Link to="/progress" className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('history.backToProgress')}
      </Link>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('history.title')} description={t('history.description')} />

      {list.isPending && (
        <div role="status" className="flex flex-col gap-3">
          {[0, 1, 2].map(row => <Skeleton key={row} className="h-24 w-full rounded-2xl" />)}
          <span className="sr-only">{t('history.loading')}</span>
        </div>
      )}

      {list.isError && (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p>{t('history.loadError')}</p>
          <Button variant="outline" size="xl" onClick={() => void list.refetch()}>{t('server.retry')}</Button>
        </div>
      )}

      {list.isSuccess && sessions.length === 0 && (
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
