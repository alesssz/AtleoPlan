/*
 * A screen that throws while rendering shows this instead of a blank page. It
 * replaces the whole frame, so it draws its own <main>.
 */
import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()
  console.error(error)

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t('errors.unexpectedTitle')}</h1>
      <p className="text-muted-foreground">{t('errors.unexpectedText')}</p>
      <Button size="lg" className="self-start" onClick={() => window.location.reload()}>
        {t('errors.reload')}
      </Button>
    </main>
  )
}
