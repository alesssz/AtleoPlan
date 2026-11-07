/*
 * Home (route `/`), docs/design/D1-ui.md D1.4.2: what to do today, in one
 * screen, from one request (GET /api/home, src/api/home.ts):
 * - a greeting with today's date;
 * - after a free workout, whether it was saved (the workout screen comes
 *   back here and says so through the navigation's state);
 * - the workout left in progress on this phone, with Resume;
 * - the active plan's card: the suggested day, Start, the other days
 *   (ActivePlanCard); without an active plan, the empty state, whose
 *   buttons lead to Plans and Exercises;
 * - Free workout, a workout with no plan;
 * - this week: the days trained and the week's numbers.
 *
 * Starting goes through useStartWorkout, the same steps as the plan's page.
 * How it works: docs/concepts/C1-frontend.md C1.18; how it was built:
 * docs/how-to/H3-frontend.md H3.16.
 *
 * A page is an ordinary component that the route table (src/router.tsx)
 * draws inside AppLayout. Adding a page: docs/concepts/C1-frontend.md C1.9.
 */
import { ClipboardList, Dumbbell, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useHome } from '@/api/home'
import { EmptyState } from '@/components/EmptyState'
import { FormBanner } from '@/components/FormBanner'
import { ActivePlanCard } from '@/components/home/ActivePlanCard'
import { weekSummary } from '@/components/home/week-summary'
import { WeekStats } from '@/components/home/WeekStats'
import { WeekStrip } from '@/components/home/WeekStrip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumeBanner } from '@/components/workout/ResumeBanner'
import { loadActiveSession } from '@/components/workout/session-storage'
import { useStartWorkout } from '@/components/workout/useStartWorkout'
import type { WorkoutEndState } from '@/components/workout/WorkoutScreen'
import { formatLongDate } from '@/lib/format'

/** The Home screen (route `/`). */
export function HomePage() {
  // `const { t, i18n } = …` destructures: takes the translate function t
  // and the i18next instance (for the current language) out of the object
  // useTranslation() returns
  const { t, i18n } = useTranslation()
  // Everything Home shows, in one request
  const home = useHome()
  // The signed-in user, for the unit of the week's volume
  const { data: user } = useCurrentUser()
  // The shared steps that start a workout, and their state
  const start = useStartWorkout()
  // The workout in progress on this phone, if any, read once
  const [active] = useState(loadActiveSession)
  // After Finish on a free workout: saved, queued or refused; null otherwise
  const ended = (useLocation().state as Partial<WorkoutEndState> | null)?.workout
  // This week: the days trained and the three numbers, by the device's clock.
  // `?? []`: no workouts while Home is loading or failed
  const week = weekSummary(home.data?.recent_sessions ?? [], new Date())

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

      <div className="flex flex-col gap-6">
        {/* After a free workout's Finish: saved, waiting for the network, or refused */}
        {ended === 'saved' && <FormBanner variant="success">{t('workout.saved')}</FormBanner>}
        {ended === 'queued' && <FormBanner variant="success">{t('workout.queued')}</FormBanner>}
        {ended === 'refused' && <FormBanner variant="error">{t('workout.refused')}</FormBanner>}

        {/* A workout left in progress on this phone: Resume */}
        {active && <ResumeBanner session={active} />}

        {/* Two columns: stacked on phones and tablets; from 1024 px side by
            side on a 5-column grid, the plan taking 3 columns and the week 2 */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* The plan's card, in one of four states: loading, failed,
                an active plan, none */}
            {home.isPending && (
              <div role="status" className="flex flex-col gap-4 rounded-3xl border p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-12 w-40" />
                <span className="sr-only">{t('home.loading')}</span>
              </div>
            )}
            {home.isError && (
              <div role="alert" className="flex flex-col items-start gap-4 rounded-3xl border p-6">
                <p>{t('home.loadError')}</p>
                <Button variant="outline" size="xl" onClick={() => void home.refetch()}>{t('server.retry')}</Button>
              </div>
            )}
            {home.isSuccess && home.data.active_plan && (
              <ActivePlanCard
                plan={home.data.active_plan}
                home={home.data}
                busy={active !== null}
                starting={start.starting}
                failed={start.failed}
                onStart={dayId => void start.startPlanDay(home.data.active_plan?.id ?? '', dayId)}
              />
            )}
            {/* No active plan yet: the empty state, with real links.
                Button asChild + Link: a link that looks like a button
                (docs/concepts/C1-frontend.md C1.8) */}
            {home.isSuccess && !home.data.active_plan && (
              <EmptyState
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
            )}

            {/* Free workout: no plan, the exercises added as you go.
                Outlined: Start on the plan's card is the main action.
                It needs no request, so it works offline too */}
            <section aria-labelledby="free-title" className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card/60 p-5 sm:p-6">
              <div className="min-w-0 flex-1 basis-60">
                <h2 id="free-title" className="font-heading text-lg font-extrabold tracking-tight">{t('home.freeTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('home.freeText')}</p>
              </div>
              <Button variant="outline" size="xl" disabled={active !== null || start.starting} onClick={start.startFree}>
                <Zap aria-hidden="true" />
                {t('home.freeStart')}
              </Button>
            </section>
          </div>

          {/* This week: a card with the gradient border (border-glow), its
              title, the seven days, and the week's numbers under them.
              aria-labelledby names the section after its own heading */}
          <section aria-labelledby="week-title" className="border-glow flex flex-col rounded-3xl p-6 lg:col-span-2">
            <h2 id="week-title" className="mb-6 font-heading text-lg font-extrabold tracking-tight">{t('home.weekTitle')}</h2>
            <WeekStrip trainedDays={week.trainedDays} />
            {/* The week's totals; mt-auto pushes them to the bottom of the
                card when it is taller than its content (next to the plan
                card), lg:pt-8 keeps a gap above them */}
            <div className="mt-8 lg:mt-auto lg:pt-8">
              <WeekStats workouts={week.workouts} sets={week.sets} volumeKg={week.volumeKg} unit={user?.weight_unit ?? 'kg'} />
              {/* A word of encouragement while the week is empty */}
              {week.workouts === 0 && <p className="mt-4 text-sm text-muted-foreground">{t('home.weekEmpty')}</p>}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
