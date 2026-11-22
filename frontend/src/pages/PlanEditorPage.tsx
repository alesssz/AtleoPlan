/*
 * One page for `/plans/new` and `/plans/:id/edit`, like ExerciseEditorPage.
 * `?add=12&day=2`, from an exercise's page, opens the editor with exercise 12
 * at the end of the second day.
 */
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { exerciseQuery, type Exercise } from '@/api/exercises'
import { useCreatePlan, usePlan, useUpdatePlan, type Plan, type PlanSaved } from '@/api/plans'
import { PageHeader } from '@/components/PageHeader'
import { draftKey } from '@/components/plans/draft-storage'
import { PlanEditor } from '@/components/plans/editor/PlanEditor'
import { draftFromPlan, emptyDraft } from '@/components/plans/plan-draft'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/http'
import { shownData } from '@/lib/shown-data'

export function PlanEditorPage() {
  const { id } = useParams()
  return id === undefined ? <NewPlan /> : <EditPlan id={id} />
}

/** Read by PlanDetailPage after a save. */
export interface PlanSavedState {
  changedElsewhere: boolean
}

/**
 * The exercise of `?add=`: undefined when there is none to add, null when it
 * cannot be read (a hand-typed id, a deleted exercise, no connection).
 * Usually already read by the exercise's page, so there is no wait.
 */
function useExerciseToAdd(): { pending: boolean, exercise: Exercise | null | undefined } {
  const { i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const id = Number(searchParams.get('add'))
  const valid = Number.isInteger(id) && id > 0
  const query = useQuery({ ...exerciseQuery(id, i18n.language), enabled: valid })

  if (!searchParams.has('add')) return { pending: false, exercise: undefined }
  if (!valid) return { pending: false, exercise: null }
  return { pending: query.isPending, exercise: query.data ?? null }
}

/** While the plan, or the exercise to add, is read. */
function EditorSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <span className="sr-only">{t('plans.detail.loading')}</span>
    </div>
  )
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
  const adding = useExerciseToAdd()

  if (adding.pending) return <EditorSkeleton />

  return (
    <>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('plans.editor.newTitle')} />
      <PlanEditor
        initial={initial}
        storageKey={draftKey(undefined)}
        adding={adding.exercise}
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
  const shown = shownData(plan)
  const { data: user } = useCurrentUser()
  const adding = useExerciseToAdd()

  if (plan.isPending || user === undefined || adding.pending) return <EditorSkeleton />

  if (shown === undefined) {
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
  return <EditPlanForm key={`${shown.id}-${shown.version}`} plan={shown} unit={user?.weight_unit ?? 'kg'} adding={adding.exercise} />
}

interface EditPlanFormProps {
  plan: Plan
  unit: 'kg' | 'lb'
  adding: Exercise | null | undefined
}

function EditPlanForm({ plan, unit, adding }: EditPlanFormProps) {
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
        adding={adding}
        save={update.mutateAsync}
        onSaved={goToPlan}
        submitLabel={t('plans.editor.save')}
        cancelTo={`/plans/${plan.id}`}
      />
    </>
  )
}
