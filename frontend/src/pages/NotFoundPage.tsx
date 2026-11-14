/*
 * Shown for any address that matches no route (the `*` route in
 * src/router.tsx), inside the normal frame so the navigation stays.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('errors.notFoundTitle')} description={t('errors.notFoundText')} />
      <Button asChild size="lg">
        <Link to="/">{t('errors.backHome')}</Link>
      </Button>
    </>
  )
}
