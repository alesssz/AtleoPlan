/*
 * One plan (route `/plans/:id`, docs/design/D1-ui.md D1.4.7): its name,
 * goal and notes, its days as tabs, and in each day the exercises summed up
 * as "4 × 8–10 · 80 kg · 90 s", warm-ups apart, supersets joined by a bar.
 * The actions: Edit (the plan editor), Set as active, Archive or Restore,
 * Delete. After a save, the editor may say through the navigation's state
 * that the plan had been changed elsewhere: the page shows the warning of
 * docs/design/D3-data-model.md D3.5.7.
 *
 * Each day has **Start this day**, which starts workout mode
 * (docs/design/D1-ui.md D1.4.9; StartDayButton below). A workout in progress
 * is shown at the top with Resume. After Finish, the workout's summary
 * opens, then Home (src/pages/SummaryPage.tsx).
 *
 * Not here yet: Share and Duplicate (phase 2).
 *
 * The open day lives in the address, `?day=2` (from 1), so a reload or Back
 * from an exercise's page returns to the same day. How it was built:
 * docs/how-to/H3-frontend.md H3.13.
 */
import { Archive, ArchiveRestore, ArrowLeft, Pencil, Play, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useDeletePlan, usePlan, usePlanAction, type Plan, type PlanDay } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { PageHeader } from '@/components/PageHeader'
import { PlanDayView } from '@/components/plans/PlanDayView'
import { ResumeBanner } from '@/components/workout/ResumeBanner'
import { loadActiveSession } from '@/components/workout/session-storage'
import { FALLBACK_REST_SECONDS, useStartWorkout } from '@/components/workout/useStartWorkout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/lib/http'
import { ExportPlanButton } from '@/components/plans/ExportPlanButton'
import type { PlanImportedState } from '@/components/plans/ImportPlanButton'
import type { PlanSavedState } from '@/pages/PlanEditorPage'

/** The plan page (route `/plans/:id`). */
export function PlanDetailPage() {
  const { t, i18n } = useTranslation()
  // The :id of the address: the plan's UUID. `?? ''`: useParams() types
  // every parameter as possibly missing, though the route always has it
  const id = useParams().id ?? ''
  const plan = usePlan(id, i18n.language)

  if (plan.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <span className="sr-only">{t('plans.detail.loading')}</span>
      </div>
    )
  }

  if (plan.isError) {
    // 404 (no such plan) and 403 (someone else's): the same message, since
    // for the user both mean "not here". Any other error offers to try again
    const missing = plan.error instanceof ApiError && [403, 404].includes(plan.error.status)
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>{missing ? t('plans.detail.notFound') : t('plans.detail.loadError')}</p>
        {missing
          ? <Link to="/plans" className="font-semibold text-primary">{t('plans.detail.back')}</Link>
          : <Button variant="outline" onClick={() => void plan.refetch()}>{t('server.retry')}</Button>}
      </div>
    )
  }

  return <PlanDetail plan={plan.data} />
}

/** Props of PlanDetail. */
interface PlanDetailProps {
  /** The plan, loaded. */
  plan: Plan
}

/** The page's content, once the plan has arrived. */
function PlanDetail({ plan }: PlanDetailProps) {
  const { t } = useTranslation()
  // The signed-in user, for the weight unit and the default rest. Already
  // in the cache: RequireAuth asked for it before any page opened
  const { data: user } = useCurrentUser()
  const action = usePlanAction(plan.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const archived = plan.archived_at !== null
  // What the editor passed when it opened this page after a save; null when
  // the page was opened any other way. useLocation(): the current address,
  // with the `state` given to navigate()
  // An import (ImportPlanButton) passes the exercises it created instead.
  // Partial<T>: T with every field optional, since either may be there;
  // `&` joins the two types into one with the fields of both
  const state = useLocation().state as (Partial<PlanSavedState> & Partial<PlanImportedState>) | null
  // The workout in progress on this phone, if any, read once
  const [active] = useState(loadActiveSession)

  // The open day, from `?day=` (1 for the first). Anything that is not one
  // of the plan's days, a hand-typed ?day=9 say, opens the first
  const requested = Number(searchParams.get('day') ?? '1')
  const dayIndex = Number.isInteger(requested) && requested >= 1 && requested <= plan.days.length ? requested - 1 : 0

  /**
   * Opens another day, in the address. Tabs give their value as text: the
   * day's index. `replace: true`: Back leaves the plan, not the last tab.
   * @param value the tab's value, "0" for the first day
   */
  function openDay(value: string) {
    setSearchParams({ day: String(Number(value) + 1) }, { replace: true })
  }

  return (
    <>
      {/* Back to the list the plan belongs to */}
      <Link to={archived ? '/plans?archived=1' : '/plans'} className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('plans.detail.back')}
      </Link>

      {/* `?? undefined`: PageHeader leaves the description out when there is none */}
      <PageHeader eyebrow={t('pages.plans.eyebrow')} title={plan.name} description={plan.goal ?? undefined} />

      <div className="flex flex-col gap-6">
        {/* Saved over a version changed elsewhere: the last change won (D3.5.7) */}
        {state?.changedElsewhere && <FormBanner variant="error">{t('plans.detail.changedElsewhere')}</FormBanner>}

        {/* Just imported from a file: said, with the exercises that were
            not here and are now the user's own (C1.15.6) */}
        {state?.createdExercises && (
          <FormBanner variant="success">
            {state.createdExercises.length > 0
              ? `${t('plans.import.done')} ${t('plans.import.created', { count: state.createdExercises.length, names: state.createdExercises.join(', ') })}`
              : t('plans.import.done')}
          </FormBanner>
        )}

        {/* A workout left in progress on this phone, of any plan: Resume */}
        {active && <ResumeBanner session={active} />}

        {/* Its state, in words */}
        {(plan.is_active || archived) && (
          <div className="flex flex-wrap items-center gap-2">
            {plan.is_active && <Badge>{t('plans.active')}</Badge>}
            {archived && <Badge variant="secondary">{t('plans.archivedBadge')}</Badge>}
            {archived && <p className="text-sm text-muted-foreground">{t('plans.detail.archivedText')}</p>}
          </div>
        )}

        {/* The actions. Which ones depends on the plan's state:
            an archived plan cannot be made active (PlanPolicy::activate) */}
        <div className="flex flex-wrap items-center gap-3">
          {!plan.is_active && !archived && (
            <Button size="xl" disabled={action.isPending} onClick={() => action.mutate('activate')}>
              <Star aria-hidden="true" />
              {t('plans.detail.setActive')}
            </Button>
          )}
          <Button asChild size="xl" variant="outline">
            <Link to={`/plans/${plan.id}/edit`}>
              <Pencil aria-hidden="true" />
              {t('plans.detail.edit')}
            </Link>
          </Button>
          <Button size="xl" variant="outline" disabled={action.isPending} onClick={() => action.mutate(archived ? 'unarchive' : 'archive')}>
            {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            {archived ? t('plans.detail.unarchive') : t('plans.detail.archive')}
          </Button>
          {/* Export: the plan saved as a file (C1.15.6) */}
          <ExportPlanButton plan={plan} />
          <DeletePlanButton plan={plan} />
        </div>
        {action.isError && <FormBanner variant="error">{t('plans.detail.actionError')}</FormBanner>}

        {plan.notes && (
          <section aria-labelledby="plan-notes-title" className="rounded-3xl border bg-card/60 p-5">
            <h2 id="plan-notes-title" className="mb-1 text-sm text-muted-foreground">{t('plans.detail.notes')}</h2>
            <p className="whitespace-pre-line">{plan.notes}</p>
          </section>
        )}

        {/* The days as tabs (src/components/ui/tabs.tsx). Controlled: the
            open tab comes from the address, and a click writes it there */}
        {plan.days.length === 0
          ? <p className="text-muted-foreground">{t('plans.detail.noDays')}</p>
          : (
              <Tabs value={String(dayIndex)} onValueChange={openDay}>
                {/* The tab row scrolls sideways when the days do not fit,
                    as on a phone with six days. h-auto and the larger tabs:
                    48 px, the smallest a finger hits reliably (D1.5) */}
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <TabsList aria-label={t('plans.detail.daysLabel')} className="h-auto! rounded-xl p-1">
                    {plan.days.map((day, index) => (
                      <TabsTrigger key={day.id} value={String(index)} className="min-h-12 flex-none rounded-lg px-4 text-sm">
                        {day.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                {plan.days.map((day, index) => (
                  <TabsContent key={day.id} value={String(index)} className="text-base">
                    <StartDayButton plan={plan} day={day} busy={active !== null} />
                    <PlanDayView
                      day={day}
                      weightUnit={user?.weight_unit ?? 'kg'}
                      defaultRestSeconds={user?.default_rest_seconds ?? FALLBACK_REST_SECONDS}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
      </div>
    </>
  )
}

/** Props of StartDayButton. */
interface StartDayButtonProps {
  /** The plan. */
  plan: Plan
  /** The day to start. */
  day: PlanDay
  /** True when a workout is already in progress on this phone. */
  busy: boolean
}

/**
 * Start this day: builds the workout on the phone and opens workout mode,
 * through useStartWorkout (src/components/workout/useStartWorkout.ts), the
 * same steps as Home's Start. Last time's sets are asked first; offline, the
 * workout starts with the plan's targets alone.
 *
 * While another workout is in progress it is disabled, with the reason: one
 * workout at a time on a phone, and none is lost by starting another.
 */
function StartDayButton({ plan, day, busy }: StartDayButtonProps) {
  const { t } = useTranslation()
  // The shared steps, and whether they are running
  const { starting, startDay } = useStartWorkout()

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Button size="xl" disabled={busy || starting || day.items.length === 0} onClick={() => void startDay(plan, day)}>
        <Play aria-hidden="true" />
        {t('workout.start')}
      </Button>
      {busy && <p className="text-sm text-muted-foreground">{t('workout.busy')}</p>}
    </div>
  )
}

/** Props of DeletePlanButton. */
interface DeletePlanButtonProps {
  /** The plan to delete. */
  plan: Plan
}

/**
 * Delete, with a confirmation first: a plan deleted cannot be brought back
 * (D1.6). Archive is the gentle alternative. After it, the plan list.
 */
function DeletePlanButton({ plan }: DeletePlanButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const remove = useDeletePlan(plan.id)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="xl">
          <Trash2 aria-hidden="true" />
          {t('plans.detail.delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('plans.detail.deleteTitle', { name: plan.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('plans.detail.deleteText')}</AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && <FormBanner variant="error">{t('plans.detail.deleteError')}</FormBanner>}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('plans.detail.cancel')}</AlertDialogCancel>
          {/* preventDefault() keeps the dialog open until the request is
              done (ExerciseDetailPage explains it); `replace: true`: Back
              does not return to the deleted plan */}
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault()
              remove.mutate(undefined, { onSuccess: () => void navigate('/plans', { replace: true }) })
            }}
          >
            {t('plans.detail.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
