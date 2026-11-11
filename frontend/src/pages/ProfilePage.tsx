/*
 * Profile (route `/profile`), docs/design/D1-ui.md D1.4.14. The first
 * working screen:
 * - an account header: name, email and the button to sign out;
 * - the preferences, language and theme, as rows of a settings list;
 * - the workout's preferences: unit, default rest, weight step, the rest
 *   timer's sound and vibration (WorkoutPreferences);
 * - the connection to the server.
 *
 * Built from small components: SettingRow for each row, LanguageSelect and
 * ThemeSelect as controls, WorkoutPreferences for the workout's card,
 * ServerStatus for the server.
 */
import { Languages, LogOut, Palette, Server, UserRound } from 'lucide-react'
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

/** The Profile screen (route `/profile`). */
export function ProfilePage() {
  // t translates; i18n.language is the current language, for formatWeight()
  const { t, i18n } = useTranslation()
  // Two unique ids (React's useId hook), one per picker, linking each row's
  // label to its control
  const languageId = useId()
  const themeId = useId()
  // Who is signed in. RequireAuth, around this page, has already waited for it,
  // so `user` is there; `?.` below only reassures TypeScript
  const { data: user } = useCurrentUser()
  // The request that signs out. RequireAuth then goes to /login by itself
  const signOut = useSignOut()

  return (
    // A Fragment (<>…</>): siblings without a wrapping element
    <>
      <PageHeader eyebrow={t('pages.profile.eyebrow')} title={t('pages.profile.title')} description={t('pages.profile.description')} />

      {/* Four blocks, 24 px apart (flex column + gap) */}
      <div className="flex flex-col gap-6">
        {/* Account header: the gradient-bordered card, avatar + name + email +
            sign out. A column on phones, a row from 640 px up.
            `relative overflow-hidden`: the decorative glow inside is
            positioned against the card and cut at its edges */}
        <section className="border-glow relative flex flex-col gap-5 overflow-hidden rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
          {/* Decoration: a large blurred lime disc in the top-right corner */}
          <div aria-hidden="true" className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/15 blur-3xl" />
          {/* The avatar: a circle with a lime-to-blue gradient ring (the
              outer circle's gradient shows as a 2 px border around the
              inner circle). bg-linear-to-br: a gradient towards the
              bottom-right, from the primary colour to the timer colour */}
          <div aria-hidden="true" className="relative grid size-16 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-timer p-0.5 sm:size-20">
            <div className="grid size-full place-items-center rounded-full bg-card">
              <UserRound className="size-8 text-primary sm:size-9" strokeWidth={1.75} />
            </div>
          </div>
          {/* flex-1: takes the free width, pushing the button to the right.
              min-w-0 + truncate: a long email is cut with "…" rather than
              overflowing the card */}
          <div className="relative min-w-0 flex-1">
            <p className="truncate font-heading text-xl font-extrabold tracking-tight sm:text-2xl">{user?.name}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {/* mutate() takes the request's data; there is none, so it is called
              through a function: onClick would otherwise pass it the click event */}
          <Button variant="outline" size="xl" className="relative" onClick={() => signOut.mutate()} pending={signOut.isPending}>
            <LogOut aria-hidden="true" />
            {t('profile.signOut')}
          </Button>
        </section>

        {/* Preferences: a card holding a list of setting rows, a line
            between each (divide-y draws a top border on every row but the
            first). aria-labelledby names the section after its heading */}
        <section aria-labelledby="prefs-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
          <h2 id="prefs-title" className="font-heading text-lg font-extrabold tracking-tight">{t('preferences.title')}</h2>
          <div className="divide-y divide-border">
            {/* Language. The description shows the number format of the
                current language, "82,5 kg" or "82.5 kg", through the
                translation's {{weight}} placeholder */}
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

        {/* The workout's preferences, in a card of the same look */}
        <WorkoutPreferences />

        {/* About: the connection to the backend, from GET /api/health */}
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
