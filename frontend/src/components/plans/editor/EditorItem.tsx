/*
 * One exercise of a day in the plan editor (docs/design/D1-ui.md D1.4.8): a
 * row with a drag handle, its cover, its name and the line that sums up its
 * sets; a tap opens it, to change its sets, rest and notes, move it to
 * another day, take it out of its superset or remove it.
 *
 * The row is sortable (dnd-kit's useSortable): only the handle starts a
 * drag, so the rest of the row can be tapped and scrolled
 * (docs/concepts/C1-frontend.md C1.16.3).
 */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Dumbbell, GripVertical, Plus, Trash2, Unlink } from 'lucide-react'
import { useId, useState, type Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import type { WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { LIMITS, draftItemAsPlanItem, type DraftAction, type DraftDay, type DraftItem } from '../plan-draft'
import { formatSeconds, itemSummary, warmUpCount } from '../plan-format'
import { EditorSet } from './EditorSet'

/** Props of EditorItem. */
interface EditorItemProps {
  /** The exercise of the day. */
  item: DraftItem
  /** Where it is: its day's index and its own. */
  at: { day: number, item: number }
  /** Every day of the plan, for "Move to another day". */
  days: DraftDay[]
  /** Sends an action to the editor's reducer. */
  dispatch: Dispatch<DraftAction>
  /** The translated error of a field, by its path; undefined when none. */
  errorOf: (path: string) => string | undefined
  /** The user's weight unit. */
  unit: WeightUnit
  /** Whether the user wants the RPE field (Profile, `show_rpe`). */
  showRpe: boolean
  /** The user's default rest, in seconds. */
  defaultRestSeconds: number
  /** The interface's language. */
  language: string
  /** Whether it is open, its sets showing. */
  open: boolean
  /** Opens or closes it. */
  onToggle: () => void
  /** Whether the day is choosing exercises for a superset: shows a tick box. */
  selecting: boolean
  /** Whether it is ticked. */
  chosen: boolean
  /** Called with true when ticked, false when unticked. */
  onChoose: (chosen: boolean) => void
}

/** A sortable exercise of a day, with its sets when open. */
export function EditorItem(props: EditorItemProps) {
  const { item, at, days, dispatch, errorOf, unit, showRpe, defaultRestSeconds, language, open, onToggle, selecting, chosen, onChoose } = props
  const { t } = useTranslation()
  // The panel's id, for aria-controls on the button that opens it
  const panelId = useId()
  // The start of the paths of this exercise's fields
  const path = `days.${at.day}.items.${at.item}`
  // Whether any of its fields has an error: the row is outlined in red
  const hasError = ['rest', 'notes'].some(field => errorOf(`${path}.${field}`))
    || item.sets.some((_, set) => ['reps', 'weight', 'rpe', 'seconds', 'meters'].some(field => errorOf(`${path}.sets.${set}.${field}`)))
  // Whether a set had an RPE when the exercise was first drawn (a plan
  // saved before the preference, or written by someone who uses it). Read
  // once, with useState(() => …): worked out at every draw, the field would
  // vanish under the finger the moment its last RPE was erased
  const [hadRpe] = useState(() => item.sets.some(set => set.rpe !== ''))
  // The RPE field shows when the user wants it, or when there is one to see
  const withRpe = showRpe || hadRpe

  // useSortable: what dnd-kit needs from this row. setNodeRef marks the
  // element that moves; attributes and listeners go on the handle;
  // transform and transition move the row while it is dragged
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  // CSS.Transform.toString turns dnd-kit's offset into a CSS transform
  const style = { transform: CSS.Transform.toString(transform), transition }

  // The cover, and the line that sums up the sets, as on the plan's page
  const cover = item.exercise.photos[0]
  const summary = itemSummary(draftItemAsPlanItem(item, unit), { language, weightUnit: unit, defaultRestSeconds, t })
  const warmUps = warmUpCount(item.sets)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-2xl border bg-card',
        // An exercise in a superset: the lime bar on its left, as on the plan's page
        item.superset_group !== null && 'border-l-4 border-l-primary',
        hasError && 'border-destructive',
        // While dragged: above the others, with a shadow
        isDragging && 'relative z-10 shadow-lg',
      )}
    >
      <div className="flex items-center gap-1 p-1">
        {/* The handle. touch-none: on a phone a drag here moves the row
            instead of scrolling the page. It is a button, so the keyboard
            reaches it: space or enter picks the row up */}
        <button
          type="button"
          aria-label={t('plans.editor.dragHandle', { name: item.exercise.name })}
          className="grid size-12 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-5" />
        </button>

        {/* The tick box of the superset choice, only while choosing */}
        {selecting && (
          <div className="grid size-12 shrink-0 place-items-center">
            <Checkbox
              aria-label={t('plans.editor.selectItem', { name: item.exercise.name })}
              checked={chosen}
              onCheckedChange={value => onChoose(value === true)}
              className="size-6"
            />
          </div>
        )}

        {/* The rest of the row opens and closes the exercise.
            aria-expanded tells screen readers whether it is open */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {cover
            ? <img src={cover.url} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg bg-muted object-cover" />
            : (
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <Dumbbell className="size-4 text-muted-foreground" />
                </span>
              )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{item.exercise.name}</span>
            <span className="block truncate text-sm text-muted-foreground tabular-nums">
              {summary}
              {warmUps > 0 && ` · ${t('plans.detail.warmUps', { count: warmUps })}`}
            </span>
            {item.superset_group !== null && (
              <span className="text-xs font-bold tracking-wider text-primary uppercase">{t('plans.editor.supersetTag', { number: item.superset_group })}</span>
            )}
          </span>
          {/* The chevron turns when open */}
          <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div id={panelId} className="flex flex-col gap-5 border-t p-4">
          {/* The sets, in order */}
          <ol className="flex flex-col gap-2">
            {item.sets.map((set, index) => (
              <EditorSet
                key={index}
                set={set}
                at={{ ...at, set: index }}
                loggingType={item.exercise.logging_type}
                dispatch={dispatch}
                errorOf={errorOf}
                unit={unit}
                showRpe={withRpe}
              />
            ))}
          </ol>
          <Button variant="outline" size="xl" className="self-start" disabled={item.sets.length >= LIMITS.sets} onClick={() => dispatch({ type: 'addSet', ...at })}>
            <Plus aria-hidden="true" />
            {t('plans.editor.addSet')}
          </Button>

          {/* The rest, empty for the user's default, which the hint names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <FormField
                label={t('plans.editor.rest')}
                inputMode="numeric"
                placeholder={String(defaultRestSeconds)}
                value={item.rest}
                onChange={event => dispatch({ type: 'setItemField', ...at, field: 'rest', value: event.target.value })}
                error={errorOf(`${path}.rest`)}
              />
              <p className="text-sm text-muted-foreground">{t('plans.editor.restHint', { time: formatSeconds(defaultRestSeconds, language) })}</p>
            </div>

            {/* Move to another day: only when there is one */}
            {days.length > 1 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${panelId}-day`}>{t('plans.editor.moveToDay')}</Label>
                <NativeSelect
                  id={`${panelId}-day`}
                  value=""
                  onChange={event => dispatch({ type: 'moveItemToDay', ...at, toDay: Number(event.target.value) })}
                  className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base"
                >
                  <NativeSelectOption value="" disabled>{t('plans.editor.moveToDayChoose')}</NativeSelectOption>
                  {days.map((day, index) => index !== at.day && (
                    <NativeSelectOption key={day.id} value={String(index)}>{day.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${panelId}-notes`}>{t('plans.editor.itemNotes')}</Label>
            <Textarea
              id={`${panelId}-notes`}
              value={item.notes}
              onChange={event => dispatch({ type: 'setItemField', ...at, field: 'notes', value: event.target.value })}
              maxLength={500}
              className="min-h-16 rounded-xl md:text-base"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {item.superset_group !== null && (
              <Button variant="outline" size="xl" onClick={() => dispatch({ type: 'leaveSuperset', ...at })}>
                <Unlink aria-hidden="true" />
                {t('plans.editor.leaveSuperset')}
              </Button>
            )}
            <Button variant="outline" size="xl" className="text-destructive" onClick={() => dispatch({ type: 'removeItem', ...at })}>
              <Trash2 aria-hidden="true" />
              {t('plans.editor.removeItem')}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
