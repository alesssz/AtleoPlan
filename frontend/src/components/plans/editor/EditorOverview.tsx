/*
 * The plan editor's first step: the plan's name, goal and notes, how many days
 * it has, and each day's name. "Next" leads to the second step, EditorDays: the
 * days as tabs, with their exercises.
 *
 * PlanEditor shows this step when the address has no `?day=`, and the second
 * when it has one; both work on the same draft, so moving between them loses
 * nothing.
 */
import { ArrowRight } from 'lucide-react'
import { useId, useState, type Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/FormField'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS, dayLetter, type DraftAction, type PlanDraft } from '../plan-draft'

interface EditorOverviewProps {
  /** The whole draft: this step shows the plan's fields and its days' names. */
  draft: PlanDraft
  /** Sends an action to the editor's reducer. */
  dispatch: Dispatch<DraftAction>
  /** The translated error of a field, by its path; undefined when none. */
  errorOf: (path: string) => string | undefined
  /** Goes to the second step, the days' exercises. */
  onNext: () => void
}

/** The choices of "Number of days": 1, 2… up to the backend's limit. */
const DAY_COUNTS = Array.from({ length: LIMITS.days }, (_, index) => index + 1)

export function EditorOverview({ draft, dispatch, errorOf, onNext }: EditorOverviewProps) {
  const { t } = useTranslation()
  const countId = useId()
  // Waiting for confirmation: a day it would remove has exercises
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  /**
   * Sets the number of days: new days at the end, named with the next
   * letters ("Day C", "Day D"), or the last days removed.
   */
  function applyCount(count: number) {
    for (let index = draft.days.length; index < count; index++) {
      dispatch({ type: 'addDay', name: t('plans.editor.defaultDayName', { letter: dayLetter(index) }) })
    }
    // From the last one down, so each index still names its day
    for (let index = draft.days.length - 1; index >= count; index--) {
      dispatch({ type: 'removeDay', day: index })
    }
  }

  /**
   * The select changed. Fewer days removes the last ones: when one of them
   * already has exercises, the dialog asks first.
   */
  function chooseCount(count: number) {
    const removed = draft.days.slice(count)
    if (removed.some(day => day.items.length > 0)) setPendingCount(count)
    else applyCount(count)
  }

  const pendingNames = pendingCount === null ? '' : draft.days.slice(pendingCount).map(day => day.name.trim() || '…').join(', ')

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('plans.editor.planName')}
          value={draft.name}
          onChange={event => dispatch({ type: 'setPlanField', field: 'name', value: event.target.value })}
          error={errorOf('name')}
          maxLength={100}
        />
        <FormField
          label={t('plans.editor.goal')}
          placeholder={t('plans.editor.goalPlaceholder')}
          value={draft.goal}
          onChange={event => dispatch({ type: 'setPlanField', field: 'goal', value: event.target.value })}
          error={errorOf('goal')}
          maxLength={100}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-notes">{t('plans.editor.notes')}</Label>
        <Textarea
          id="plan-notes"
          value={draft.notes}
          onChange={event => dispatch({ type: 'setPlanField', field: 'notes', value: event.target.value })}
          maxLength={2000}
          className="min-h-20 rounded-xl md:text-base"
        />
      </div>

      <section aria-labelledby="plan-days" className="flex flex-col gap-4">
        <h2 id="plan-days" className="text-lg font-bold">{t('plans.editor.daysLabel')}</h2>
        <div className="flex flex-col gap-2 sm:max-w-48">
          <Label htmlFor={countId}>{t('plans.editor.dayCount')}</Label>
          {/* Native: on a phone, the system's own wheel, easy with a thumb */}
          <NativeSelect
            id={countId}
            value={String(draft.days.length)}
            onChange={event => chooseCount(Number(event.target.value))}
            className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base"
          >
            {DAY_COUNTS.map(count => (
              <NativeSelectOption key={count} value={String(count)}>{count}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {draft.days.map((day, index) => (
            <FormField
              key={day.id}
              label={t('plans.editor.dayNameOf', { number: index + 1 })}
              value={day.name}
              onChange={event => dispatch({ type: 'renameDay', day: index, name: event.target.value })}
              error={errorOf(`days.${index}.name`)}
              maxLength={50}
            />
          ))}
        </div>
      </section>

      {/* The step's one lime button (Save is outlined here, PlanEditor) */}
      <Button size="xl" className="self-end" onClick={onNext}>
        {t('plans.editor.next')}
        <ArrowRight aria-hidden="true" />
      </Button>

      {/* Nothing is saved until Save, but losing a day's work to a mis-tap
          on the select deserves a question */}
      <AlertDialog open={pendingCount !== null} onOpenChange={open => !open && setPendingCount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('plans.editor.removeDaysTitle', { names: pendingNames })}</AlertDialogTitle>
            <AlertDialogDescription>{t('plans.editor.removeDaysText')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('plans.editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingCount !== null) applyCount(pendingCount)
                setPendingCount(null)
              }}
            >
              {t('plans.editor.removeDaysConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
