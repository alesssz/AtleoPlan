/*
 * Plans (route `/plans`): the list of the user's plans, docs/01-ui-design.md
 * 1.4.6. Until plans exist (FEAT-2) it shows the empty state the design
 * asks for (1.6, "Create your first plan"), with its action disabled and
 * marked "Coming soon". Same shape as ExercisesPage and ProgressPage.
 */
import { ClipboardList, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

/** The Plans screen (route `/plans`). */
export function PlansPage() {
  // The translate function, from react-i18next's hook
  const { t } = useTranslation()

  return (
    // A Fragment (<>…</>): two siblings without a wrapping element
    <>
      {/* Eyebrow, title and description, translated */}
      <PageHeader eyebrow={t('pages.plans.eyebrow')} title={t('pages.plans.title')} description={t('pages.plans.description')} />
      {/* No plans yet. `comingSoon` adds the badge; the button is disabled
          (it cannot be clicked, and looks so) until the editor exists */}
      <EmptyState
        icon={ClipboardList}
        title={t('plans.emptyTitle')}
        description={t('plans.emptyText')}
        comingSoon
        actions={(
          <Button size="xl" disabled>
            <Plus aria-hidden="true" />
            {t('plans.new')}
          </Button>
        )}
      />
    </>
  )
}
