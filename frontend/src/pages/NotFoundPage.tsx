/*
 * Shown for any address that matches no route (the `*` route in
 * src/router.tsx), inside the normal frame so the navigation stays.
 * Routing and Link: docs/concepts/C1-frontend.md C1.5.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

/** The "page not found" screen, with a way back to Home. */
export function NotFoundPage() {
  // The translate function, from react-i18next's hook (destructured)
  const { t } = useTranslation()

  return (
    // A Fragment (<>…</>): siblings without a wrapping element
    <>
      <PageHeader title={t('errors.notFoundTitle')} description={t('errors.notFoundText')} />
      {/* asChild: the Button lends its look to its child, a router Link,
          so the result is a real link (<a>) styled as a button (shadcn/ui's
          Slot, see src/components/ui/button.tsx). Link changes the screen
          without reloading the page, unlike a plain <a href>. */}
      <Button asChild size="lg">
        <Link to="/">{t('errors.backHome')}</Link>
      </Button>
    </>
  )
}
