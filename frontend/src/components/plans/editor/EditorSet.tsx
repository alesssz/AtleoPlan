/*
 * One set of an exercise in the plan editor (docs/design/D1-ui.md D1.4.8):
 * its number, which opens the list of set types (warm-up W, drop set D, to
 * failure F: SetTypeSelect.tsx), the targets that fit how the exercise is
 * logged, and a button that removes it.
 *
 * The RPE field shows only when the exercise wants it: the user's
 * preference (Profile, `show_rpe`), or an RPE already in one of its sets,
 * which would otherwise be saved without being seen (EditorItem.tsx).
 *
 * The fields are text, as typed ("8-10", "82,5"); plan-draft.ts reads them
 * when saving, and validateDraft() names the ones that do not read.
 */
import { X } from 'lucide-react'
import { useId, type Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import type { LoggingType } from '@/api/exercises'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { type DraftAction, type DraftSet, type SetField } from '../plan-draft'
import { SetTypeSelect } from '../SetTypeSelect'

/** Props of EditorSet. */
interface EditorSetProps {
  /** The set. */
  set: DraftSet
  /** Where it is: its day's, its exercise's and its own index. */
  at: { day: number, item: number, set: number }
  /** How its exercise is logged: decides the fields. */
  loggingType: LoggingType
  /** Sends an action to the editor's reducer. */
  dispatch: Dispatch<DraftAction>
  /** The translated error of a field, by its path; undefined when none. */
  errorOf: (path: string) => string | undefined
  /** The user's weight unit, shown in the weight's label. */
  unit: WeightUnit
  /** Whether to show the RPE field (for an exercise with reps). */
  showRpe: boolean
}

/** A row of the sets: type, targets, remove. */
export function EditorSet({ set, at, loggingType, dispatch, errorOf, unit, showRpe }: EditorSetProps) {
  const { t } = useTranslation()
  // The set's number for people, from 1
  const number = at.set + 1
  // The start of every field's path: "days.0.items.1.sets.2"
  const path = `days.${at.day}.items.${at.item}.sets.${at.set}`
  // A unique start for the ids that link a field to its error
  const id = useId()

  // The fields this set shows: reps (and the weight when the exercise has
  // one, the RPE when wanted), or a time, or a distance
  // inputMode picks the phone's keyboard: reps need the dash, so text;
  // weights the decimal point; seconds and meters digits only
  const fields: { field: SetField, label: string, inputMode: 'text' | 'numeric' | 'decimal', placeholder: string }[] = []
  if (loggingType === 'weight_reps' || loggingType === 'reps') fields.push({ field: 'reps', label: t('plans.editor.reps'), inputMode: 'text', placeholder: '8-10' })
  if (loggingType === 'weight_reps') fields.push({ field: 'weight', label: t('plans.editor.weight', { unit }), inputMode: 'decimal', placeholder: unit })
  if (showRpe && (loggingType === 'weight_reps' || loggingType === 'reps')) fields.push({ field: 'rpe', label: t('plans.editor.rpe'), inputMode: 'decimal', placeholder: 'RPE' })
  if (loggingType === 'time') fields.push({ field: 'seconds', label: t('plans.editor.seconds'), inputMode: 'numeric', placeholder: 's' })
  if (loggingType === 'distance') fields.push({ field: 'meters', label: t('plans.editor.meters'), inputMode: 'numeric', placeholder: 'm' })

  // The errors of this set's fields, translated, in the fields' order
  const errors = fields.flatMap(({ field }) => {
    const message = errorOf(`${path}.${field}`)
    return message ? [{ field, message }] : []
  })

  return (
    <li>
      <div className="flex items-center gap-2">
        {/* The number, or the type's letter: a tap opens the list of types */}
        <SetTypeSelect
          value={set.set_type}
          onChange={setType => dispatch({ type: 'setSetType', ...at, setType })}
          number={number}
          label={t('plans.editor.setTypeButton', { number, type: t(`plans.editor.setTypes.${set.set_type}`) })}
          variant="outline"
        />

        {/* The targets. Each field's name for screen readers says which set:
            "Set 2, Reps"; on screen the placeholder hints the format */}
        {fields.map(({ field, label, inputMode, placeholder }) => (
          <Input
            key={field}
            aria-label={`${t('plans.editor.setLabel', { number })}, ${label}`}
            inputMode={inputMode}
            placeholder={placeholder}
            value={set[field]}
            onChange={event => dispatch({ type: 'setSetField', ...at, field, value: event.target.value })}
            aria-invalid={errorOf(`${path}.${field}`) ? true : undefined}
            aria-describedby={errorOf(`${path}.${field}`) ? `${id}-${field}` : undefined}
            className={cn('h-12 min-w-0 rounded-xl text-center md:text-base', field === 'reps' ? 'flex-[1.2]' : 'flex-1')}
          />
        ))}

        <Button variant="ghost" size="icon-xl" aria-label={t('plans.editor.removeSet', { number })} onClick={() => dispatch({ type: 'removeSet', ...at })}>
          <X aria-hidden="true" />
        </Button>
      </div>

      {/* The errors, under the row, each linked to its field */}
      {errors.map(({ field, message }) => (
        <p key={field} id={`${id}-${field}`} role="alert" className="mt-1 text-sm text-destructive">{message}</p>
      ))}
    </li>
  )
}
