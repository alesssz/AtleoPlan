/*
 * Progress (route `/progress`), docs/design/D1-ui.md D1.4.11 and D1.4.12.
 * In the MVP it holds history (FEAT-4): the three latest workouts and a link
 * to all of them (`/progress/history`). Charts and records come in phase 2
 * (D1.8): a card says so, with the "Coming soon" badge.
 *
 * Before the first workout, the empty state of D1.6 ("Your progress starts
 * with the first workout"), whose button leads to Home, where workouts
 * start. Same shape as PlansPage, which is commented in more detail.
 */
import { ChartLine, Play, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSessions } from '@/api/sessions'
import { ComingSoon } from '@/components/ComingSoon'
import { EmptyState } from '@/components/EmptyState'
import { SessionRow } from '@/components/history/SessionRow'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** How many of the latest workouts Progress shows. */
const LATEST = 3

/** The Progress screen (route `/progress`). */
export function ProgressPage() {
  const { t } = useTranslation()
  // The first page of history, shared with the history page: the same key,
  // so opening "All workouts" shows them at once, from the cache
  const list = useSessions()
  // The latest workouts: the start of the first page
  const latest = list.data?.pages[0]?.data.slice(0, LATEST) ?? []

  return (
    <>
      <PageHeader eyebrow={t('pages.progress.eyebrow')} title={t('pages.progress.title')} description={t('pages.progress.description')} />

      <div className="flex flex-col gap-6">
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

        {/* No workout yet: the empty state; its button opens Home */}
        {list.isSuccess && latest.length === 0 && (
          <EmptyState
            icon={TrendingUp}
            title={t('progress.emptyTitle')}
            description={t('progress.emptyText')}
            actions={(
              <Button asChild size="xl">
                <Link to="/">
                  <Play aria-hidden="true" />
                  {t('progress.start')}
                </Link>
              </Button>
            )}
          />
        )}

        {/* The latest workouts, and the way to all of them */}
        {latest.length > 0 && (
          <section aria-labelledby="latest-title" className="flex flex-col gap-3">
            <h2 id="latest-title" className="font-heading text-lg font-extrabold tracking-tight">{t('progress.latestTitle')}</h2>
            <ul className="flex flex-col gap-3">
              {latest.map(session => (
                <li key={session.id}><SessionRow session={session} /></li>
              ))}
            </ul>
            <Button asChild variant="outline" size="xl" className="self-start">
              <Link to="/progress/history">{t('progress.allWorkouts')}</Link>
            </Button>
          </section>
        )}

        {/* Charts and records: phase 2, said honestly */}
        <section aria-labelledby="charts-title" className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card/60 p-5 sm:p-6">
          <ChartLine aria-hidden="true" className="size-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 basis-60">
            <h2 id="charts-title" className="font-heading text-lg font-extrabold tracking-tight">{t('progress.chartsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('progress.chartsText')}</p>
          </div>
          <ComingSoon />
        </section>
      </div>
    </>
  )
}
