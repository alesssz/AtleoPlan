/*
 * Add to plan, on an exercise's page: a plan, then one of its days, opens the
 * plan's editor with the exercise at the end of that day (`?add=12&day=2`).
 * Nothing is saved here: the editor shows the result, with its own rules and
 * Save.
 */
import { ArrowLeft, ChevronRight, ListPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Exercise } from '@/api/exercises'
import { usePlan, usePlans, type PlanSummary } from '@/api/plans'
import { dayLetter, LIMITS } from '@/components/plans/plan-draft'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { shownData } from '@/lib/shown-data'

interface AddToPlanButtonProps {
  exercise: Exercise
}

/** A plan's or a day's row: the whole row is the link. */
const CHOICE = 'flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-card/60 px-4 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'

export function AddToPlanButton({ exercise }: AddToPlanButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<PlanSummary | null>(null)

  /**
   * Closing forgets the plan chosen: the next time starts from the plans.
   * @param next true when opening
   */
  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) setPlan(null)
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button size="xl">
          <ListPlus aria-hidden="true" />
          {t('exercises.addToPlan.button')}
        </Button>
      </DialogTrigger>

      <DialogContent closeLabel={t('common.close')} className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold">
            {plan ? t('exercises.addToPlan.chooseDay', { plan: plan.name }) : t('exercises.addToPlan.title')}
          </DialogTitle>
          <DialogDescription>{t('exercises.addToPlan.description', { name: exercise.name })}</DialogDescription>
        </DialogHeader>

        {/* The list scrolls, the title and Cancel stay */}
        <div className="-mx-1 min-h-0 overflow-y-auto px-1">
          {plan
            ? <DayChoice exercise={exercise} plan={plan} onBack={() => setPlan(null)} />
            : <PlanChoice exercise={exercise} onChoose={setPlan} />}
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button size="xl" variant="ghost">{t('exercises.addToPlan.cancel')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PlanChoiceProps {
  exercise: Exercise
  onChoose: (plan: PlanSummary) => void
}

/** The plans not archived, and a new plan with the exercise in its first day. */
function PlanChoice({ exercise, onChoose }: PlanChoiceProps) {
  const { t } = useTranslation()
  const plans = usePlans(false)
  const shown = shownData(plans)
  const newPlan = (
    <Link to={`/plans/new?add=${exercise.id}&day=1`} className={CHOICE}>
      <Plus aria-hidden="true" className="size-5 shrink-0 text-primary" />
      <span className="font-semibold">{t('exercises.addToPlan.newPlan')}</span>
    </Link>
  )

  if (plans.isPending) return <ChoiceSkeleton label={t('plans.loading')} />

  if (shown === undefined) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p>{t('plans.loadError')}</p>
        <Button variant="outline" size="xl" onClick={() => void plans.refetch()}>{t('server.retry')}</Button>
      </div>
    )
  }

  if (shown.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground">{t('exercises.addToPlan.noPlans')}</p>
        {newPlan}
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {shown.map(plan => (
        <li key={plan.id}>
          <button type="button" className={CHOICE} onClick={() => onChoose(plan)}>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{plan.name}</span>
              <span className="block text-sm text-muted-foreground">{t('plans.days', { count: plan.days_count })}</span>
            </span>
            {plan.is_active && <Badge>{t('plans.active')}</Badge>}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
      <li>{newPlan}</li>
    </ul>
  )
}

interface DayChoiceProps {
  exercise: Exercise
  plan: PlanSummary
  onBack: () => void
}

/**
 * The plan's days, each a link to its editor. A full day is disabled; a day
 * that already has the exercise says so, but can have it twice.
 */
function DayChoice({ exercise, plan, onBack }: DayChoiceProps) {
  const { t, i18n } = useTranslation()
  const whole = usePlan(plan.id, i18n.language)
  const shown = shownData(whole)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="ghost" className="self-start" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {t('exercises.addToPlan.otherPlans')}
      </Button>

      {whole.isPending && <ChoiceSkeleton label={t('plans.detail.loading')} />}

      {!whole.isPending && shown === undefined && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>{t('plans.detail.loadError')}</p>
          <Button variant="outline" size="xl" onClick={() => void whole.refetch()}>{t('server.retry')}</Button>
        </div>
      )}

      {shown && (
        <ul className="flex flex-col gap-2">
          {shown.days.map((day, index) => {
            const name = day.name.trim() || t('plans.editor.defaultDayName', { letter: dayLetter(index) })
            const full = day.items.length >= LIMITS.items
            const already = day.items.some(item => item.exercise_id === exercise.id)
            const details = [
              full ? t('exercises.addToPlan.full', { count: LIMITS.items }) : t('exercises.addToPlan.exercises', { count: day.items.length }),
              ...(already ? [t('exercises.addToPlan.already')] : []),
            ].join(' · ')
            const content = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{name}</span>
                  <span className="block text-sm text-muted-foreground">{details}</span>
                </span>
                {!full && <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
              </>
            )
            return (
              <li key={day.id}>
                {full
                  // A link cannot be disabled: a full day is plain text
                  ? <div aria-disabled="true" className={`${CHOICE} opacity-60 hover:bg-card/60`}>{content}</div>
                  : <Link to={`/plans/${plan.id}/edit?add=${exercise.id}&day=${index + 1}`} className={CHOICE}>{content}</Link>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Three rows while the list is read. */
function ChoiceSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-2">
      {[0, 1, 2].map(row => <Skeleton key={row} className="h-14 w-full rounded-2xl" />)}
      <span className="sr-only">{label}</span>
    </div>
  )
}
