/*
 * Progress (route `/progress`). In the MVP it holds history: the three latest
 * workouts and a link to all of them (`/progress/history`). Charts and records
 * come in phase 2: a card says so, with the "Coming soon" badge.
 *
 * Before the first workout, an empty state ("Your progress starts with the
 * first workout"), whose button leads to Home, where workouts start.
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

const LATEST = 3

export function ProgressPage() {
  const { t } = useTranslation()
  // History's first page: the same key, so "All workouts" opens from the cache
  const list = useSessions()
  const latest = list.data?.pages[0]?.data.slice(0, LATEST) ?? []

  return (
    <>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('pages.progress.title')} description={t('pages.progress.description')} />

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

        {/* Charts and records: phase 2 */}
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
