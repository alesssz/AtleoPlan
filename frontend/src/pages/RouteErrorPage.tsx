/*
 * The safety net: React Router draws this instead of a screen that crashed
 * while rendering (an `errorElement` in src/router.tsx), so one broken
 * component shows a message and a way out instead of a blank page.
 * It replaces the whole frame (AppLayout included), so it draws its own
 * <main>. Routing: docs/04-frontend.md 4.5.
 */
import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

/** The "something went wrong" screen, with a reload button. */
export function RouteErrorPage() {
  // The translate function, from react-i18next's hook (destructured)
  const { t } = useTranslation()
  // The error that stopped the screen (React Router's hook); logged for the developer
  const error = useRouteError()
  console.error(error)

  return (
    // A narrow column (at most 28rem) centred horizontally (mx-auto) and
    // vertically (flex-col + justify-center over the full screen height)
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t('errors.unexpectedTitle')}</h1>
      <p className="text-muted-foreground">{t('errors.unexpectedText')}</p>
      {/* onClick gets a function to run on click (an arrow function, not a
          call: `() => …`). self-start keeps the button at its own width */}
      <Button size="lg" className="self-start" onClick={() => window.location.reload()}>
        {t('errors.reload')}
      </Button>
    </main>
  )
}
