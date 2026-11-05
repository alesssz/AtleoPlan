/*
 * Exercises (route `/exercises`): the exercise library with search and
 * filters, docs/01-ui-design.md 1.4.3. Until the library exists (BE-1,
 * DATA-1, UI-1) it shows an empty state announcing it, its action disabled
 * and marked "Coming soon". Same shape as PlansPage, which is commented in
 * more detail.
 */
import { Dumbbell, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

/** The Exercises screen (route `/exercises`). */
export function ExercisesPage() {
  // The translate function, from react-i18next's hook
  const { t } = useTranslation()

  return (
    <>
      <PageHeader eyebrow={t('pages.exercises.eyebrow')} title={t('pages.exercises.title')} description={t('pages.exercises.description')} />
      {/* The library is on its way: empty state with a disabled action */}
      <EmptyState
        icon={Dumbbell}
        title={t('exercises.emptyTitle')}
        description={t('exercises.emptyText')}
        comingSoon
        actions={(
          <Button size="xl" disabled>
            <Plus aria-hidden="true" />
            {t('exercises.new')}
          </Button>
        )}
      />
    </>
  )
}
