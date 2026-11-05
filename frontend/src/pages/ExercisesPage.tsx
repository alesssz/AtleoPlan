/*
 * Exercises (route `/exercises`): the exercise library with search and
 * filters. Described in docs/01-ui-design.md 1.4.3; for now a placeholder
 * (backlog UI-1). Same shape as HomePage, which explains it line by line.
 */
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { PagePlaceholder } from '@/components/PagePlaceholder'

/** The Exercises screen (route `/exercises`). */
export function ExercisesPage() {
  // The translate function, from react-i18next's hook
  const { t } = useTranslation()

  return (
    // A Fragment (<>…</>): two siblings without a wrapping element
    <>
      {/* Title and description, translated */}
      <PageHeader title={t('pages.exercises.title')} description={t('pages.exercises.description')} />
      {/* "Coming soon", pointing to the design section */}
      <PagePlaceholder section="1.4.3" />
    </>
  )
}
