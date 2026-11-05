/*
 * Plans (route `/plans`): the list of the user's plans. Described in
 * docs/01-ui-design.md 1.4.6; for now a placeholder (backlog FEAT-2).
 * Same shape as HomePage, which explains it line by line.
 */
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { PagePlaceholder } from '@/components/PagePlaceholder'

/** The Plans screen (route `/plans`). */
export function PlansPage() {
  // The translate function, from react-i18next's hook
  const { t } = useTranslation()

  return (
    // A Fragment (<>…</>): two siblings without a wrapping element
    <>
      {/* Title and description, translated */}
      <PageHeader title={t('pages.plans.title')} description={t('pages.plans.description')} />
      {/* "Coming soon", pointing to the design section */}
      <PagePlaceholder section="1.4.6" />
    </>
  )
}
