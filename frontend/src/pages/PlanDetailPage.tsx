/*
 * One plan (route `/plans/:id`): its name, goal and notes, its days as tabs,
 * and in each day the exercises summed up as "4 × 8–10 · 80 kg · 90 s",
 * warm-ups apart, supersets joined by a bar. The actions: Edit (the plan
 * editor), Set as active, Archive or Restore, Delete. After a save, the editor
 * may say through the navigation's state that the plan had been changed
 * elsewhere: the page then warns about it.
 *
 * Each day has **Start this day**, which starts workout mode (StartDayButton
 * below). A workout in progress is shown at the top with Resume. After Finish,
 * the workout's summary opens, then Home (src/pages/SummaryPage.tsx).
 *
 * Not here yet: Share and Duplicate (phase 2).
 *
 * The open day lives in the address, `?day=2` (from 1), so a reload or Back
 * from an exercise's page returns to the same day.
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

export function PlanDetailPage() {
  const { t, i18n } = useTranslation()
  // The route always has it; useParams() types it as optional
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
    // 404 and 403 alike: for the user both mean "not here"
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

interface PlanDetailProps {
  /** The plan, loaded. */
  plan: Plan
}

function PlanDetail({ plan }: PlanDetailProps) {
  const { t } = useTranslation()
  // Already cached: RequireAuth asked before any page opened
  const { data: user } = useCurrentUser()
  const action = usePlanAction(plan.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const archived = plan.archived_at !== null
  // From the editor after a save, or from an import with the exercises it
  // created
  const state = useLocation().state as (Partial<PlanSavedState> & Partial<PlanImportedState>) | null
  // Dropped when the banner deletes it, so Start works again
  const [active, setActive] = useState(loadActiveSession)

  // A hand-typed ?day=9 opens the first
  const requested = Number(searchParams.get('day') ?? '1')
  const dayIndex = Number.isInteger(requested) && requested >= 1 && requested <= plan.days.length ? requested - 1 : 0

  /**
   * Replaces the history entry: Back leaves the plan, not the last tab.
   * @param value the tab's value, "0" for the first day
   */
  function openDay(value: string) {
    setSearchParams({ day: String(Number(value) + 1) }, { replace: true })
  }

  return (
    <>
      <Link to={archived ? '/plans?archived=1' : '/plans'} className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('plans.detail.back')}
      </Link>

      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={plan.name} description={plan.goal ?? undefined} />

      <div className="flex flex-col gap-6">
        {/* Saved over a version changed elsewhere: the last change won */}
        {state?.changedElsewhere && <FormBanner variant="error">{t('plans.detail.changedElsewhere')}</FormBanner>}

        {/* With the exercises the import created */}
        {state?.createdExercises && (
          <FormBanner variant="success">
            {state.createdExercises.length > 0
              ? `${t('plans.import.done')} ${t('plans.import.created', { count: state.createdExercises.length, names: state.createdExercises.join(', ') })}`
              : t('plans.import.done')}
          </FormBanner>
        )}

        {active && <ResumeBanner session={active} onDiscarded={() => setActive(null)} />}

        {(plan.is_active || archived) && (
          <div className="flex flex-wrap items-center gap-2">
            {plan.is_active && <Badge>{t('plans.active')}</Badge>}
            {archived && <Badge variant="secondary">{t('plans.archivedBadge')}</Badge>}
            {archived && <p className="text-sm text-muted-foreground">{t('plans.detail.archivedText')}</p>}
          </div>
        )}

        {/* An archived plan cannot be made active (PlanPolicy::activate) */}
        <div className="flex flex-wrap items-center gap-3">
          {!plan.is_active && !archived && (
            // One mutation for both: the spinner goes on the one pressed
            <Button size="xl" disabled={action.isPending} pending={action.isPending && action.variables === 'activate'} onClick={() => action.mutate('activate')}>
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
          <Button size="xl" variant="outline" disabled={action.isPending} pending={action.isPending && action.variables !== 'activate'} onClick={() => action.mutate(archived ? 'unarchive' : 'archive')}>
            {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            {archived ? t('plans.detail.unarchive') : t('plans.detail.archive')}
          </Button>
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

        {/* Controlled by the address */}
        {plan.days.length === 0
          ? <p className="text-muted-foreground">{t('plans.detail.noDays')}</p>
          : (
              <Tabs value={String(dayIndex)} onValueChange={openDay}>
                {/* Scrolls sideways when the days do not fit; 48 px tabs */}
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

interface StartDayButtonProps {
  /** The plan. */
  plan: Plan
  day: PlanDay
  /** True when a workout is already in progress on this phone. */
  busy: boolean
}

/**
 * The same steps as Home's Start (useStartWorkout). Disabled, with the
 * reason, while another workout is in progress: one at a time on a phone.
 */
function StartDayButton({ plan, day, busy }: StartDayButtonProps) {
  const { t } = useTranslation()
  const { starting, startDay } = useStartWorkout()

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Button size="xl" disabled={busy || day.items.length === 0} pending={starting} onClick={() => void startDay(plan, day)}>
        <Play aria-hidden="true" />
        {t('workout.start')}
      </Button>
      {busy && <p className="text-sm text-muted-foreground">{t('workout.busy')}</p>}
    </div>
  )
}

interface DeletePlanButtonProps {
  plan: Plan
}

/**
 * Delete, with a confirmation first: a plan deleted cannot be brought back.
 * Archive is the gentle alternative. After it, the plan list.
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
          {/* Open until the request is done; Back must not return to the
              deleted plan */}
          <AlertDialogAction
            variant="destructive"
            pending={remove.isPending}
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
