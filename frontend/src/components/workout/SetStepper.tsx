/*
 * The big stepper of workout mode (docs/design/D1-ui.md D1.4.9): a tap on a
 * set's weight or reps opens a panel from the bottom of the screen, with
 * every field of that set, each between a − and a + as large as a thumb.
 * Weight ±2.5 (the user's `weight_step`, in their unit), reps ±1, seconds
 * ±5, meters ±10 (stepper.ts). Typing is still possible, in the box between
 * them, for a value far from the one shown.
 *
 * Each tap changes the set at once (the screen's `setField` action), as
 * typing in the row did: there is no Cancel, and **Done** only closes. The
 * panel is shadcn/ui's Sheet (src/components/ui/sheet.tsx), a Radix dialog
 * against the bottom edge: the page behind waits, a tap outside or Escape
 * closes it.
 *
 * How it works: docs/concepts/C1-frontend.md C1.17.7; how it was built:
 * docs/how-to/H3-frontend.md H3.20.
 */
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { LoggingType } from '@/api/exercises'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { loggedSetText } from './set-text'
import { fieldsFor } from './set-fields'
import { fieldStep, stepValue } from './stepper'
import type { SetField, WorkoutSet } from './workout-session'

/** Props of SetStepper. */
interface SetStepperProps {
  /** Whether the panel is open. */
  open: boolean
  /** Called to close it (Done, the X, a tap outside, Escape). */
  onOpenChange: (open: boolean) => void
  /** The set; undefined while none is chosen. */
  set: WorkoutSet | undefined
  /** The set's name: "Set 1", "Warm-up 2". */
  name: string
  /** The exercise's name, under the title. */
  exerciseName: string
  /** How the exercise is logged: decides the fields. */
  loggingType: LoggingType
  /** Done as fast as possible: the reps and the seconds (fieldsFor). */
  forTime: boolean
  /** The user's weight unit. */
  unit: WeightUnit
  /** The user's weight step, as the API sends it ("2.50"). */
  weightStep: string | undefined
  /** The field tapped in the row: its + gets the focus, its title the lime. */
  focus: SetField | null
  /** A field changed, by a tap or by typing. */
  onChange: (field: SetField, value: string) => void
}

/** The panel with the steppers of one set. */
export function SetStepper({ open, onOpenChange, set, name, exerciseName, loggingType, forTime, unit, weightStep, focus, onChange }: SetStepperProps) {
  const { t, i18n } = useTranslation()
  // The interface's language: decimal separator of the values and the steps
  const language = i18n.language
  // The + button of each field, to give the tapped one the focus on opening.
  // useRef keeps an object across draws without drawing again when it changes
  const plusButtons = useRef<Partial<Record<SetField, HTMLButtonElement | null>>>({})

  // Last time, as in the row's Last column: "80×8", or nothing
  const lastText = set?.last ? loggedSetText(set.last, loggingType, unit, language) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* From the bottom, rounded at the top; the bottom padding clears the
          phone's gesture bar (env(safe-area-inset-bottom)).
          onOpenAutoFocus: Radix would focus the first button, the weight's
          −; preventDefault() stops it, and the tapped field's + gets the
          focus instead: a keyboard user starts where they meant to */}
      <SheetContent
        side="bottom"
        closeLabel={t('common.close')}
        className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          if (focus) plusButtons.current[focus]?.focus()
        }}
      >
        {/* The content in a column no wider than a phone, centred: on a
            laptop the panel spans the window, the controls do not */}
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5">
          <SheetHeader className="px-0 pb-0">
            <SheetTitle className="font-heading text-xl font-extrabold">{name}</SheetTitle>
            {/* The exercise, and last time's set in this place */}
            <SheetDescription>
              {lastText ? `${exerciseName} · ${t('workout.colLast')}: ${lastText}` : exerciseName}
            </SheetDescription>
          </SheetHeader>

          {set && fieldsFor(loggingType, unit, t, forTime).map(({ field, label, spoken, placeholder, inputMode }) => {
            // How much a tap moves this field, and as the buttons write it
            const step = fieldStep(field, weightStep)
            const stepText = formatNumber(step, language, { maximumFractionDigits: 2 })
            /**
             * One tap of − or +: the field's next value, at once.
             * @param sign -1 for −, 1 for +
             */
            const tap = (sign: number) => onChange(field, stepValue(set[field], field, sign * step, language))
            return (
              // role="group" with a name: screen readers hear "kg, group"
              // before its three controls
              <div key={field} role="group" aria-label={spoken} className="flex flex-col gap-2">
                {/* The field's title; lime for the one tapped in the row */}
                <p aria-hidden="true" className={cn('text-xs font-bold tracking-wider uppercase', field === focus ? 'text-primary' : 'text-muted-foreground')}>{label}</p>
                <div className="flex items-center gap-3">
                  {/* − and +: 64 px squares, with the step written on them.
                      "−" is the minus sign (U+2212), not a hyphen */}
                  <Button variant="outline" aria-label={t('workout.stepDown', { field: spoken, step: stepText })} onClick={() => tap(-1)} className="size-16 shrink-0 rounded-2xl text-lg font-bold tabular-nums">
                    {`−${stepText}`}
                  </Button>
                  {/* The value, big, and typeable. Named as the row's field
                      was before UI-6: "Set 1, kg" */}
                  <Input
                    aria-label={`${name}, ${spoken}`}
                    placeholder={placeholder}
                    inputMode={inputMode}
                    value={set[field]}
                    onChange={event => onChange(field, event.target.value)}
                    className="h-16 min-w-0 flex-1 rounded-2xl text-center font-heading text-3xl font-extrabold tabular-nums md:text-3xl"
                  />
                  <Button
                    variant="outline"
                    // A callback ref: React calls it with the button once
                    // drawn, and it is kept under the field's name
                    ref={(button) => { plusButtons.current[field] = button }}
                    aria-label={t('workout.stepUp', { field: spoken, step: stepText })}
                    onClick={() => tap(1)}
                    className="size-16 shrink-0 rounded-2xl text-lg font-bold tabular-nums"
                  >
                    {`+${stepText}`}
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Done: the changes are already made, it only closes */}
          <Button size="xl" className="w-full" onClick={() => onOpenChange(false)}>{t('workout.stepperDone')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
