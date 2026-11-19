/*
 * Profile: the account, always in view, then the settings in three tabs:
 * Workout (the most used, open by default), App (language, theme), About
 * (the server, and the admin panel for admins). The open tab is in the
 * address (?tab=app), so a reload or Back keeps it.
 */
import { ExternalLink, Languages, LogOut, Palette, Server, ShieldCheck, UserRound } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useCurrentUser, useSignOut } from '@/api/auth'
import { LanguageSelect } from '@/components/LanguageSelect'
import { PageHeader } from '@/components/PageHeader'
import { ServerStatus } from '@/components/ServerStatus'
import { SettingGroup } from '@/components/SettingGroup'
import { SettingRow } from '@/components/SettingRow'
import { ThemeSelect } from '@/components/ThemeSelect'
import { WorkoutPreferences } from '@/components/WorkoutPreferences'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatWeight } from '@/lib/format'

/** The weight shown as an example of the language's number format. */
const EXAMPLE_WEIGHT = 82.5

const TABS = ['workout', 'app', 'about'] as const
type ProfileTab = typeof TABS[number]

/** The tab in the address; Workout when there is none, or an unknown one. */
function tabFrom(value: string | null): ProfileTab {
  return TABS.find(tab => tab === value) ?? 'workout'
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const languageId = useId()
  const themeId = useId()
  // RequireAuth has waited for it; `?.` below only reassures TypeScript
  const { data: user } = useCurrentUser()
  // RequireAuth then goes to /login by itself
  const signOut = useSignOut()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = tabFrom(searchParams.get('tab'))
  const labels: Record<ProfileTab, string> = {
    workout: t('preferences.workoutTitle'),
    app: t('preferences.appTitle'),
    about: t('profile.about'),
  }

  /** Replaces the address rather than adding to history: Back leaves Profile. */
  function openTab(value: string) {
    const next = tabFrom(value)
    setSearchParams(next === 'workout' ? {} : { tab: next }, { replace: true })
  }

  return (
    <>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('pages.profile.title')} description={t('pages.profile.description')} />

      <div className="flex flex-col gap-6">
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

        {/* Controlled by the address. Each panel is named by its tab; in
            it, the rows sit in short titled groups, the same in every tab */}
        <Tabs value={tab} onValueChange={openTab} className="gap-4">
          <TabsList aria-label={t('preferences.title')} className="h-auto! w-full rounded-xl p-1">
            {TABS.map(value => (
              <TabsTrigger key={value} value={value} className="min-h-12 flex-1 rounded-lg px-3 text-sm">
                {labels[value]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="workout" className="text-base">
            <WorkoutPreferences />
          </TabsContent>

          <TabsContent value="app" className="text-base">
            <SettingGroup title={t('preferences.groups.display')}>
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
            </SettingGroup>
          </TabsContent>

          <TabsContent value="about" className="flex flex-col gap-6 text-base">
            <SettingGroup title={t('server.title')}>
              <SettingRow icon={Server} label={t('server.status')} description={t('server.hint')}>
                <ServerStatus />
              </SettingRow>
            </SettingGroup>
            {/* Admins only. The panel is Laravel's, not a route of the app:
                a plain <a>, in a new tab, so the app stays where it was */}
            {user?.admin_url && (
              <SettingGroup title={t('profile.adminTitle')}>
                <SettingRow icon={ShieldCheck} label={t('profile.adminPanel')} description={t('profile.adminHint')}>
                  <Button asChild variant="outline">
                    <a href={user.admin_url} target="_blank" rel="noopener">
                      {t('profile.adminOpen')}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </Button>
                </SettingRow>
              </SettingGroup>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
