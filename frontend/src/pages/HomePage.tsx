/*
 * Home (route `/`), docs/01-ui-design.md 1.4.2. Until plans and workouts
 * exist (FEAT-2, FEAT-3) it shows what it can truthfully show:
 * - a greeting with today's date;
 * - the "no active plan" empty state, whose buttons lead to Plans and
 *   Exercises;
 * - this week's days, with today highlighted.
 * When a plan is active, its card (with the suggested day and Start) takes
 * the empty state's place.
 *
 * A page is an ordinary component that the route table (src/router.tsx)
 * draws inside AppLayout. Adding a page: docs/04-frontend.md 4.9.
 */
import { ClipboardList, Dumbbell, Plus } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { WeekStats } from '@/components/home/WeekStats'
import { WeekStrip } from '@/components/home/WeekStrip'
import { Button } from '@/components/ui/button'
import { formatLongDate } from '@/lib/format'

/** The Home screen (route `/`). */
export function HomePage() {
  // `const { t, i18n } = …` destructures: takes the translate function t
  // and the i18next instance (for the current language) out of the object
  // useTranslation() returns
  const { t, i18n } = useTranslation()

  return (
    // A Fragment (<>…</>): groups elements without adding a <div> to the
    // page (a component must return a single root)
    <>
      {/* Greeting. The eyebrow is today's date in the user's language
          ("giovedì 5 novembre"), in lime capitals */}
      <header className="mb-8 sm:mb-10">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {formatLongDate(new Date(), i18n.language)}
        </p>
        {/* The big title, with one word painted in the lime gradient.
            <Trans> is react-i18next's component for translations that
            contain markup: the text is "Ready to <hl>train</hl>?", and the
            `components` prop says what <hl> becomes, here a <span> with the
            gradient (text-gradient-primary, src/index.css). Each language
            decides which word is highlighted. */}
        <h1 className="font-heading text-4xl leading-[1.05] font-black tracking-tight text-balance sm:text-6xl">
          <Trans i18nKey="home.hero" components={{ hl: <span className="text-gradient-primary" /> }} />
        </h1>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">{t('home.tagline')}</p>
      </header>

      {/* Two blocks: stacked on phones and tablets; from 1024 px side by
          side on a 5-column grid, the plan taking 3 columns and the week 2 */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* No active plan yet: the empty state, with real links.
            Button asChild + Link: a link that looks like a button
            (docs/04-frontend.md 4.8) */}
        <EmptyState
          className="lg:col-span-3"
          icon={ClipboardList}
          title={t('home.noPlanTitle')}
          description={t('home.noPlanText')}
          actions={(
            // A Fragment holding the two buttons, passed as one prop
            <>
              <Button asChild size="xl">
                <Link to="/plans">
                  <Plus aria-hidden="true" />
                  {t('home.createPlan')}
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/exercises">
                  <Dumbbell aria-hidden="true" />
                  {t('home.browseExercises')}
                </Link>
              </Button>
            </>
          )}
        />

        {/* This week: a card with the gradient border (border-glow), its
            title, the seven days, and a line of encouragement under them.
            aria-labelledby names the section after its own heading */}
        <section aria-labelledby="week-title" className="border-glow flex flex-col rounded-3xl p-6 lg:col-span-2">
          <h2 id="week-title" className="mb-6 font-heading text-lg font-extrabold tracking-tight">{t('home.weekTitle')}</h2>
          <WeekStrip />
          {/* The week's totals; mt-auto pushes them to the bottom of the
              card when it is taller than its content (next to the plan
              card), lg:pt-8 keeps a gap above them */}
          <div className="mt-8 lg:mt-auto lg:pt-8">
            <WeekStats />
            <p className="mt-4 text-sm text-muted-foreground">{t('home.weekEmpty')}</p>
          </div>
        </section>
      </div>
    </>
  )
}
