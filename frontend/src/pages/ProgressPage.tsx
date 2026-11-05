/*
 * Progress (route `/progress`): charts, records and history. Described in
 * docs/01-ui-design.md 1.4.11 and 1.4.12; for now a placeholder. History
 * is in the MVP (backlog FEAT-4), charts come in phase 2 (1.8).
 * Same shape as HomePage, which explains it line by line.
 */
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { PagePlaceholder } from '@/components/PagePlaceholder'

/** The Progress screen (route `/progress`). */
export function ProgressPage() {
  // The translate function, from react-i18next's hook
  const { t } = useTranslation()

  return (
    // A Fragment (<>…</>): two siblings without a wrapping element
    <>
      {/* Title and description, translated */}
      <PageHeader title={t('pages.progress.title')} description={t('pages.progress.description')} />
      {/* "Coming soon", pointing to the design section */}
      <PagePlaceholder section="1.4.12" />
    </>
  )
}
