/*
 * The plan editor's page (routes `/plans/new` and `/plans/:id/edit`): one page
 * for both, like ExerciseEditorPage. A new plan starts with one empty day; a
 * saved one is read first, then turned into a draft (plan-draft.ts).
 *
 * After a save the app opens the plan's page, replacing the editor in the
 * history, and tells that page when the plan had been changed elsewhere,
 * through the navigation's `state`.
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

export function PlanEditorPage() {
  const { id } = useParams()
  return id === undefined ? <NewPlan /> : <EditPlan id={id} />
}

/** Read by PlanDetailPage after a save. */
export interface PlanSavedState {
  changedElsewhere: boolean
}

/** Opens a saved plan's page, replacing the editor in the history. */
function useGoToPlan() {
  const navigate = useNavigate()
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
  // Made once: its ids are random, and a new one at every render would make
  // the draft look changed
  const [initial] = useState(() => emptyDraft(t('plans.editor.defaultDayName', { letter: 'A' })))

  return (
    <>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('plans.editor.newTitle')} />
      <PlanEditor
        initial={initial}
        storageKey={draftKey(undefined)}
        save={create.mutateAsync}
        onSaved={goToPlan}
        submitLabel={t('plans.editor.create')}
        cancelTo="/plans"
      />
    </>
  )
}

interface EditPlanProps {
  id: string
}

/** `/plans/:id/edit`: reads the plan, then draws the editor with it. */
function EditPlan({ id }: EditPlanProps) {
  const { t, i18n } = useTranslation()
  const plan = usePlan(id, i18n.language)
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

  // A different plan, or a new version of it, starts a fresh editor
  return <EditPlanForm key={`${plan.data.id}-${plan.data.version}`} plan={plan.data} unit={user?.weight_unit ?? 'kg'} />
}

interface EditPlanFormProps {
  plan: Plan
  unit: 'kg' | 'lb'
}

function EditPlanForm({ plan, unit }: EditPlanFormProps) {
  const { t, i18n } = useTranslation()
  const update = useUpdatePlan(plan.id)
  const goToPlan = useGoToPlan()
  const initial = useMemo(() => draftFromPlan(plan, unit, i18n.language), [plan, unit, i18n.language])

  return (
    <>
      {/* Here the eyebrow says what the title does not: "Edit plan" */}
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
