/*
 * Home (route `/`): the active plan with the suggested day, the session in
 * progress, this week. Described in docs/01-ui-design.md 1.4.2; for now a
 * placeholder, built with the workout features (backlog FEAT-3).
 *
 * A page is an ordinary component that the route table (src/router.tsx)
 * draws inside AppLayout. Adding a page: docs/04-frontend.md 4.9.
 */
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { PagePlaceholder } from '@/components/PagePlaceholder'

/** The Home screen (route `/`). */
export function HomePage() {
  // `const { t } = …` destructures: takes the translate function t out of
  // the object useTranslation() returns
  const { t } = useTranslation()

  return (
    <>
      {/* <>…</> is a Fragment: groups elements without adding a <div> to
          the page (a component must return a single root) */}
      {/* Props are passed like HTML attributes; {…} holds JavaScript, here
          t('key'), which returns the text in the current language */}
      <PageHeader title={t('pages.home.title')} description={t('pages.home.description')} />
      <PagePlaceholder section="1.4.2" />
    </>
  )
}
