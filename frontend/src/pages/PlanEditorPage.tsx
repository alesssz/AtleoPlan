/*
 * The plan editor's page (routes `/plans/new` and `/plans/:id/edit`,
 * docs/design/D1-ui.md D1.4.8): one page for both, like ExerciseEditorPage.
 * A new plan starts with one empty day; a saved one is read first, then
 * turned into a draft (plan-draft.ts). The editor itself is PlanEditor
 * (src/components/plans/editor/). How it was built:
 * docs/how-to/H3-frontend.md H3.14.
 *
 * After a save the app opens the plan's page, replacing the editor in the
 * history, and tells that page when the plan had been changed elsewhere,
 * through the navigation's `state` (D3.5.7).
 */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useCreatePlan, usePlan, useUpdatePlan, type Plan, type PlanSaved } from '@/api/plans'
import { PageHeader } from '@/components/PageHeader'
import { draftKey } from '@/components/plans/draft-storage'
import { PlanEditor } from '@/components/plans/editor/PlanEditor'
import { draftFromPlan, emptyDraft } from '@/components/plans/plan-draft'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/http'

/** The editor page: new when the address has no id, edit otherwise. */
export function PlanEditorPage() {
  // The :id of /plans/:id/edit; undefined on /plans/new
  const { id } = useParams()
  return id === undefined ? <NewPlan /> : <EditPlan id={id} />
}

/**
 * What the plan's page receives through the navigation's `state`, after a
 * save (PlanDetailPage reads it).
 */
export interface PlanSavedState {
  /** True when the plan had been saved elsewhere since the editor opened it. */
  changedElsewhere: boolean
}

/** Opens a saved plan's page, replacing the editor in the history. */
function useGoToPlan() {
  const navigate = useNavigate()
  // `replace: true`: Back from the plan does not return to the editor
  return (saved: PlanSaved) => void navigate(`/plans/${saved.plan.id}`, {
    replace: true,
    state: { changedElsewhere: saved.changedElsewhere } satisfies PlanSavedState,
  })
}

/** `/plans/new`: a plan with one empty day, "Day A". */
function NewPlan() {
  const { t } = useTranslation()
  const create = useCreatePlan()
  const goToPlan = useGoToPlan()
  // The empty plan, made once: its ids are random, and a new one at every
  // render would make the editor think the draft keeps changing
  const [initial] = useState(() => emptyDraft(t('plans.editor.defaultDayName', { letter: 'A' })))

  return (
    <>
      <PageHeader eyebrow={t('pages.plans.eyebrow')} title={t('plans.editor.newTitle')} />
      <PlanEditor
        initial={initial}
        storageKey={draftKey(undefined)}
        // mutateAsync(): like mutate(), but returns a Promise of the answer,
        // which the editor awaits (and catches, for a 422)
        save={create.mutateAsync}
        onSaved={goToPlan}
        submitLabel={t('plans.editor.create')}
        cancelTo="/plans"
      />
    </>
  )
}

/** Props of EditPlan. */
interface EditPlanProps {
  /** The plan's UUID, from the address. */
  id: string
}

/** `/plans/:id/edit`: reads the plan, then draws the editor with it. */
function EditPlan({ id }: EditPlanProps) {
  const { t, i18n } = useTranslation()
  const plan = usePlan(id, i18n.language)
  // The user, for the weight unit the draft shows. Already in the cache:
  // RequireAuth asked for it
  const { data: user } = useCurrentUser()

  if (plan.isPending || user === undefined) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <span className="sr-only">{t('plans.detail.loading')}</span>
      </div>
    )
  }

  if (plan.isError) {
    // As on the plan's page: someone else's (403) and missing (404) read the same
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

  // `key`: a different plan, or a new version of it, starts a fresh editor
  return <EditPlanForm key={`${plan.data.id}-${plan.data.version}`} plan={plan.data} unit={user?.weight_unit ?? 'kg'} />
}

/** Props of EditPlanForm. */
interface EditPlanFormProps {
  /** The plan, loaded. */
  plan: Plan
  /** The user's weight unit. */
  unit: 'kg' | 'lb'
}

/** The editor of a saved plan, once it has arrived. */
function EditPlanForm({ plan, unit }: EditPlanFormProps) {
  const { t, i18n } = useTranslation()
  const update = useUpdatePlan(plan.id)
  const goToPlan = useGoToPlan()
  // The plan as a draft, worked out once: useMemo keeps the result until
  // one of the listed values changes
  const initial = useMemo(() => draftFromPlan(plan, unit, i18n.language), [plan, unit, i18n.language])

  return (
    <>
      <PageHeader eyebrow={t('plans.editor.editTitle')} title={plan.name} />
      <PlanEditor
        initial={initial}
        storageKey={draftKey(plan.id)}
        save={update.mutateAsync}
        onSaved={goToPlan}
        submitLabel={t('plans.editor.save')}
        cancelTo={`/plans/${plan.id}`}
      />
    </>
  )
}
