/*
 * Home, from one request (GET /api/home). After a summary, the workout's
 * outcome (saved, queued, refused, deleted) arrives in the navigation state.
 */
import { ClipboardList, Dumbbell, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useHome } from '@/api/home'
import { EmptyState } from '@/components/EmptyState'
import { FormBanner } from '@/components/FormBanner'
import { ActivePlanCard } from '@/components/home/ActivePlanCard'
import { TrainingCalendar } from '@/components/home/TrainingCalendar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumeBanner } from '@/components/workout/ResumeBanner'
import { loadActiveSession } from '@/components/workout/session-storage'
import { usePrepareWorkouts } from '@/components/workout/usePrepareWorkouts'
import { useStartWorkout } from '@/components/workout/useStartWorkout'
import { formatLongDate } from '@/lib/format'
import { shownData } from '@/lib/shown-data'
import type { WorkoutEndState } from '@/pages/SummaryPage'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const home = useHome()
  const data = shownData(home)
  const start = useStartWorkout()
  usePrepareWorkouts(data?.active_plan?.id)
  // Dropped when the banner deletes it, so Start works again
  const [active, setActive] = useState(loadActiveSession)
  const ended = (useLocation().state as Partial<WorkoutEndState> | null)?.workout
  // This month's workouts, for the calendar
  const recent = (data?.recent_sessions ?? []).map(session => ({ ...session, duration_seconds: session.duration_seconds ?? null }))

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {formatLongDate(new Date(), i18n.language)}
        </p>
        {/* Each language decides which word is highlighted:
            "Ready to <hl>train</hl>?" */}
        <h1 className="font-heading text-4xl leading-[1.05] font-black tracking-tight text-balance sm:text-6xl">
          <Trans i18nKey="home.hero" components={{ hl: <span className="text-gradient-primary" /> }} />
        </h1>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">{t('home.tagline')}</p>
      </header>

      <div className="flex flex-col gap-6">
        {ended === 'saved' && <FormBanner variant="success">{t('workout.saved')}</FormBanner>}
        {ended === 'queued' && <FormBanner variant="success">{t('workout.queued')}</FormBanner>}
        {ended === 'refused' && <FormBanner variant="error">{t('workout.refused')}</FormBanner>}
        {ended === 'deleted' && <FormBanner variant="success">{t('workout.deleted')}</FormBanner>}

        {active && <ResumeBanner session={active} onDiscarded={() => setActive(null)} />}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            {home.isPending && (
              <div role="status" className="flex flex-col gap-4 rounded-3xl border p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-12 w-40" />
                <span className="sr-only">{t('home.loading')}</span>
              </div>
            )}
            {!home.isPending && data === undefined && (
              <div role="alert" className="flex flex-col items-start gap-4 rounded-3xl border p-6">
                <p>{t('home.loadError')}</p>
                <Button variant="outline" size="xl" onClick={() => void home.refetch()}>{t('server.retry')}</Button>
              </div>
            )}
            {data?.active_plan && (
              <ActivePlanCard
                plan={data.active_plan}
                home={data}
                busy={active !== null}
                starting={start.starting}
                failed={start.failed}
                onStart={dayId => void start.startPlanDay(data.active_plan?.id ?? '', dayId)}
              />
            )}
            {data && !data.active_plan && (
              <EmptyState
                icon={ClipboardList}
                title={t('home.noPlanTitle')}
                description={t('home.noPlanText')}
                actions={(
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

            {/* Outlined: Start on the plan's card is the main action. It
                needs no request, so it works offline too */}
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

          <TrainingCalendar recent={recent} />
        </div>
      </div>
    </>
  )
}
