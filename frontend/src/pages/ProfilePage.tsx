/*
 * Profile (route `/profile`):
 * - an account header: name, email and the button to sign out;
 * - the preferences, language and theme, as rows of a settings list;
 * - the workout's preferences: unit, default rest, weight step, the rest
 *   timer's sound and vibration (WorkoutPreferences);
 * - for an admin only, the link to the admin panel;
 * - the connection to the server.
 */
import { ExternalLink, Languages, LogOut, Palette, Server, ShieldCheck, UserRound } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser, useSignOut } from '@/api/auth'
import { LanguageSelect } from '@/components/LanguageSelect'
import { PageHeader } from '@/components/PageHeader'
import { ServerStatus } from '@/components/ServerStatus'
import { SettingRow } from '@/components/SettingRow'
import { ThemeSelect } from '@/components/ThemeSelect'
import { WorkoutPreferences } from '@/components/WorkoutPreferences'
import { Button } from '@/components/ui/button'
import { formatWeight } from '@/lib/format'

/** The weight shown as an example of the language's number format. */
const EXAMPLE_WEIGHT = 82.5

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const languageId = useId()
  const themeId = useId()
  // RequireAuth has waited for it; `?.` below only reassures TypeScript
  const { data: user } = useCurrentUser()
  // RequireAuth then goes to /login by itself
  const signOut = useSignOut()

  return (
    <>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('pages.profile.title')} description={t('pages.profile.description')} />

      <div className="flex flex-col gap-6">
        {/* The decorative glow is cut at the card's edges */}
        <section className="border-glow relative flex flex-col gap-5 overflow-hidden rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
          <div aria-hidden="true" className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/15 blur-3xl" />
          {/* The outer circle's gradient shows as a ring around the inner one */}
          <div aria-hidden="true" className="relative grid size-16 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-timer p-0.5 sm:size-20">
            <div className="grid size-full place-items-center rounded-full bg-card">
              <UserRound className="size-8 text-primary sm:size-9" strokeWidth={1.75} />
            </div>
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="truncate font-heading text-xl font-extrabold tracking-tight sm:text-2xl">{user?.name}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {/* Wrapped: onClick would pass mutate() the click event */}
          <Button variant="outline" size="xl" className="relative" onClick={() => signOut.mutate()} pending={signOut.isPending}>
            <LogOut aria-hidden="true" />
            {t('profile.signOut')}
          </Button>
        </section>

        <section aria-labelledby="prefs-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
          <h2 id="prefs-title" className="font-heading text-lg font-extrabold tracking-tight">{t('preferences.title')}</h2>
          <div className="divide-y divide-border">
            {/* The description shows the language's number format, "82,5 kg" */}
            <SettingRow
              icon={Languages}
              label={t('preferences.language')}
              description={t('preferences.languageHint', { weight: formatWeight(EXAMPLE_WEIGHT, i18n.language) })}
              controlId={languageId}
            >
              <LanguageSelect id={languageId} />
            </SettingRow>
            <SettingRow icon={Palette} label={t('preferences.theme')} description={t('preferences.themeHint')} controlId={themeId}>
              <ThemeSelect id={themeId} />
            </SettingRow>
          </div>
        </section>

        <WorkoutPreferences />

        {/* Admins only. The panel is Laravel's, not a route of the app: a
            plain <a>, in a new tab, so the app stays where it was */}
        {user?.admin_url && (
          <section aria-labelledby="admin-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
            <h2 id="admin-title" className="font-heading text-lg font-extrabold tracking-tight">{t('profile.adminTitle')}</h2>
            <SettingRow icon={ShieldCheck} label={t('profile.adminPanel')} description={t('profile.adminHint')}>
              <Button asChild variant="outline">
                <a href={user.admin_url} target="_blank" rel="noopener">
                  {t('profile.adminOpen')}
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </SettingRow>
          </section>
        )}

        <section aria-labelledby="about-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
          <h2 id="about-title" className="font-heading text-lg font-extrabold tracking-tight">{t('profile.about')}</h2>
          <SettingRow icon={Server} label={t('server.title')} description={t('server.hint')}>
            <ServerStatus />
          </SettingRow>
        </section>
      </div>
    </>
  )
}
