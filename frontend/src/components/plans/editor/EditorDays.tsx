/*
 * The plan editor's second step (docs/design/D1-ui.md D1.4.8): the way back
 * to the first step (EditorOverview, the plan's details and days), then the
 * days as tabs, and under the open tab that day's exercises (EditorDay).
 *
 * The open tab is in the address, `?day=2`, as on the plan's page
 * (PlanDetailPage): PlanEditor reads it and passes it here, and a tap on a
 * tab asks PlanEditor to change it. How the two steps fit together:
 * docs/concepts/C1-frontend.md C1.16.7.
 */
import { ArrowLeft } from 'lucide-react'
import type { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WeightUnit } from '@/lib/format'
import { dayLetter, type DraftAction, type PlanDraft } from '../plan-draft'
import { EditorDay } from './EditorDay'

/** Props of EditorDays. */
interface EditorDaysProps {
  /** The whole draft: its days are the tabs. */
  draft: PlanDraft
  /** The open day's index, from 0. */
  openDay: number
  /** Sends an action to the editor's reducer. */
  dispatch: Dispatch<DraftAction>
  /** The translated error of a field, by its path; undefined when none. */
  errorOf: (path: string) => string | undefined
  /** Whether any error's path starts with this text, such as 'days.1.items.'. */
  hasErrors: (prefix: string) => boolean
  /** The user's weight unit. */
  unit: WeightUnit
  /** The user's default rest, in seconds. */
  defaultRestSeconds: number
  /** The interface's language. */
  language: string
  /** Opens another day's tab, by the day's index. */
  onOpenDay: (index: number) => void
  /** Goes back to the first step. */
  onBack: () => void
}

/** The editor's second step: the days as tabs, each with its exercises. */
export function EditorDays(props: EditorDaysProps) {
  const { draft, openDay, dispatch, errorOf, hasErrors, unit, defaultRestSeconds, language, onOpenDay, onBack } = props
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      {/* The way back to the first step, styled as the plan page's own
          "All plans" link; a button, since where it goes depends on how this
          step was opened (PlanEditor's backToPlan) */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-12 items-center gap-2 self-start text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('plans.editor.backToPlan')}
      </button>

      {/* The days as tabs. Tabs give their value as text: the day's index */}
      <Tabs value={String(openDay)} onValueChange={value => onOpenDay(Number(value))}>
        {/* On a phone six tabs do not fit: their row scrolls sideways */}
        <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
          <TabsList aria-label={t('plans.editor.daysLabel')} className="h-auto! rounded-xl p-1">
            {draft.days.map((day, index) => (
              <TabsTrigger key={day.id} value={String(index)} className="min-h-12 flex-none rounded-lg px-4 text-sm">
                {/* A day with no name yet still needs a tab to tap */}
                {day.name.trim() || t('plans.editor.defaultDayName', { letter: dayLetter(index) })}
                {/* A dot on a day whose exercises have an error, with its
                    meaning in words for screen readers. Only the exercises:
                    an error in the day's name shows in the first step */}
                {hasErrors(`days.${index}.items.`) && (
                  <span className="size-2 rounded-full bg-destructive">
                    <span className="sr-only">{t('plans.editor.invalid')}</span>
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Radix draws only the open tab's content */}
        {draft.days.map((day, index) => (
          <TabsContent key={day.id} value={String(index)} className="pt-4 text-base">
            <EditorDay
              day={day}
              dayIndex={index}
              days={draft.days}
              dispatch={dispatch}
              errorOf={errorOf}
              unit={unit}
              defaultRestSeconds={defaultRestSeconds}
              language={language}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
