/*
 * Profile (route `/profile`). The first working screen: language and theme
 * preferences, and the connection to the server. The account part comes
 * with sign-in (backlog FEAT-1). docs/01-ui-design.md 1.4.14.
 *
 * Built only from other components: two shadcn/ui Cards (src/components/ui/
 * card.tsx) holding the pickers and the server status.
 */
import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '@/components/LanguageSelect'
import { PageHeader } from '@/components/PageHeader'
import { ServerStatus } from '@/components/ServerStatus'
import { ThemeSelect } from '@/components/ThemeSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatWeight } from '@/lib/format'

/** The weight shown as an example of the language's number format. */
const EXAMPLE_WEIGHT = 82.5

/** The Profile screen (route `/profile`). */
export function ProfilePage() {
  // t translates; i18n.language is the current language, for formatWeight()
  const { t, i18n } = useTranslation()

  return (
    // A Fragment (<>…</>): siblings without a wrapping element
    <>
      <PageHeader title={t('pages.profile.title')} description={t('pages.profile.description')} />

      {/* The two cards: stacked on phones and tablets, side by side from
          1024 px (a CSS grid that gets two columns at `lg:`), 24 px apart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preferences: language and theme */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.title')}</CardTitle>
          </CardHeader>
          {/* The card's body: a column, 24 px between the controls */}
          <CardContent className="flex flex-col gap-6">
            <LanguageSelect />
            {/* Changes with the language: "82,5 kg" ↔ "82.5 kg". Interpolation:
                the translation's {{weight}} receives the formatted value.
                tabular-nums gives every digit the same width (1.5) */}
            <p className="text-sm text-muted-foreground tabular-nums">
              {t('preferences.numberExample', { weight: formatWeight(EXAMPLE_WEIGHT, i18n.language) })}
            </p>
            <ThemeSelect />
          </CardContent>
        </Card>

        {/* The backend's state, from GET /api/health */}
        <Card>
          <CardHeader>
            <CardTitle>{t('server.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerStatus />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
