/*
 * Progress (route `/progress`): charts, records and history,
 * docs/01-ui-design.md 1.4.11 and 1.4.12. History is in the MVP (FEAT-4),
 * charts come in phase 2 (1.8). Until there are workouts it shows the
 * empty state of 1.6 ("Finish your first workout to see your progress"),
 * its action disabled and marked "Coming soon". Same shape as PlansPage,
 * which is commented in more detail.
 */
import { Play, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

/** The Progress screen (route `/progress`). */
export function ProgressPage() {
  // The translate function, from react-i18next's hook
  const { t } = useTranslation()

  return (
    <>
      <PageHeader eyebrow={t('pages.progress.eyebrow')} title={t('pages.progress.title')} description={t('pages.progress.description')} />
      {/* No workouts yet: empty state with a disabled action */}
      <EmptyState
        icon={TrendingUp}
        title={t('progress.emptyTitle')}
        description={t('progress.emptyText')}
        comingSoon
        actions={(
          <Button size="xl" disabled>
            <Play aria-hidden="true" />
            {t('progress.start')}
          </Button>
        )}
      />
    </>
  )
}
