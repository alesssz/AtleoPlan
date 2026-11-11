/*
 * The exercise editor's form (docs/design/D1-ui.md D1.4.5): name,
 * description, instructions, main and secondary muscles, equipment, logging
 * type and YouTube link. Used to create an exercise and to change one
 * (src/pages/ExerciseEditorPage.tsx), and to create one without leaving the
 * plan editor, inside its exercise picker (ExercisePicker); photos and videos
 * come with BE-1's feat/exercise-media.
 *
 * The same four pieces as every form of the app (docs/concepts/C1-frontend.md
 * C1.13.3): a zod schema for the rules (exercise-form.ts), react-hook-form for
 * the fields, the request given by the page, and showRequestError for what
 * the server refuses. One piece is new: Controller, for a field that is not a
 * plain <input>, here the ticks of the secondary muscles.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useEquipment } from '@/api/equipment'
import { LOGGING_TYPES, type Exercise, type ExerciseInput } from '@/api/exercises'
import { useMuscles } from '@/api/muscles'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { FALLBACK_LANGUAGE, isLanguage, LANGUAGE_NAMES } from '@/i18n/languages'
import { showRequestError } from '@/lib/form'
import { exerciseFormSchema, toExerciseInput, type ExerciseFormValues } from './exercise-form'

/** Props of ExerciseForm. */
interface ExerciseFormProps {
  /** The values the fields start with: empty, or the exercise being changed. */
  defaultValues: ExerciseFormValues
  /**
   * Sends the data and resolves with the saved exercise; given by the page,
   * which knows whether it creates or changes (mutateAsync of its mutation).
   */
  save: (input: ExerciseInput) => Promise<Exercise>
  /** Called with the saved exercise: the page goes to it. */
  onSaved: (exercise: Exercise) => void
  /** The submit button's text: "Create exercise" or "Save". */
  submitLabel: string
  /** Where Cancel goes back to, on a page of its own. */
  cancelTo?: string
  /**
   * What Cancel does instead of going to an address: inside the plan
   * editor's exercise picker, back to the search (ExercisePicker).
   */
  onCancel?: () => void
}

/** The fields the API may refuse one by one: their messages go under them. */
const SERVER_FIELDS = ['name', 'description', 'instructions', 'logging_type', 'equipment_id', 'youtube_url'] as const

/** The classes shared by the form's selects: 48 px tall, rounded, 16 px text. */
const SELECT_CLASSES = 'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base'

/** The editor's form. */
export function ExerciseForm({ defaultValues, save, onSaved, submitLabel, cancelTo, onCancel }: ExerciseFormProps) {
  const { t, i18n } = useTranslation()
  // The fixed lists, for the selects and the ticks
  const muscles = useMuscles(i18n.language)
  const equipment = useEquipment(i18n.language)
  // The language the exercise is written in: the app's (docs/design/D2-decisions.md D2.4)
  const language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  // react-hook-form keeps the values and errors; zodResolver checks them
  // with the schema on submit
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema(t)),
    defaultValues,
  })
  // The fields' errors, and whether a submit is running (handleSubmit waits
  // for onSubmit's Promise, so isSubmitting covers the request)
  const { errors, isSubmitting } = form.formState
  // The main muscle as chosen right now. useWatch() re-renders this
  // component when the field changes, so its tick below is disabled at once
  const primaryMuscle = useWatch({ control: form.control, name: 'primary_muscle' })

  // Unique ids linking labels, hints and errors to their fields
  const ids = {
    description: useId(),
    instructions: useId(),
    instructionsHint: useId(),
    primary: useId(),
    secondary: useId(),
    equipment: useId(),
    logging: useId(),
  }

  /**
   * Runs when the values pass the schema: converts them, sends them, and goes
   * to the saved exercise. An `async` function, so the form stays "submitting"
   * until the answer arrives.
   * @param values the form's values, checked
   */
  async function onSubmit(values: ExerciseFormValues) {
    try {
      onSaved(await save(toExerciseInput(values)))
    }
    catch (error) {
      // Laravel's 422 under each field; anything else at the top
      showRequestError(error, form.setError, SERVER_FIELDS, t)
    }
  }

  return (
    // noValidate: the messages come from the schema, in the app's language.
    // @container: the form is a container, and the grids below choose their
    // columns from its width (`@xl:` = the form at least 36rem, 576 px wide),
    // not from the screen's (`sm:`): in the plan editor's picker the form
    // sits in a narrow window on a wide screen (docs/concepts/C1-frontend.md C1.16.8)
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="@container flex flex-col gap-6">
      {/* An error about the whole form: no network, an unexpected answer */}
      {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}

      {/* Which language this exercise is written in */}
      <p className="text-sm text-muted-foreground">
        {t('exercises.editor.languageHint', { language: LANGUAGE_NAMES[language] })}
      </p>

      {/* Name: the shared FormField (label, input, error) */}
      <FormField label={t('exercises.editor.name')} error={errors.name?.message} autoComplete="off" {...form.register('name')} />

      {/* Description: a label, a growing text area, its error */}
      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.description}>{t('exercises.editor.description')}</Label>
        <Textarea
          id={ids.description}
          rows={3}
          aria-invalid={errors.description ? true : undefined}
          className="rounded-xl"
          {...form.register('description')}
        />
        {errors.description && <p role="alert" className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      {/* Instructions: one step per line, said by a hint linked to the field
          (aria-describedby), so screen readers read it too */}
      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.instructions}>{t('exercises.editor.instructions')}</Label>
        <Textarea id={ids.instructions} rows={5} aria-describedby={ids.instructionsHint} className="rounded-xl" {...form.register('instructions')} />
        <p id={ids.instructionsHint} className="text-sm text-muted-foreground">{t('exercises.editor.instructionsHint')}</p>
        {errors.instructions && <p role="alert" className="text-sm text-destructive">{errors.instructions.message}</p>}
      </div>

      {/* Main muscle, equipment and logging type: three selects, one column
          when the form is narrow, three when it is 576 px wide or more */}
      <div className="grid gap-6 @xl:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.primary}>{t('exercises.editor.primaryMuscle')}</Label>
          {/* register() works on a <select> as on an input */}
          <NativeSelect id={ids.primary} className={SELECT_CLASSES} {...form.register('primary_muscle')}>
            <NativeSelectOption value="">{t('exercises.editor.noMuscle')}</NativeSelectOption>
            {(muscles.data ?? []).map(muscle => (
              <NativeSelectOption key={muscle.id} value={String(muscle.id)}>{muscle.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.equipment}>{t('exercises.editor.equipment')}</Label>
          <NativeSelect id={ids.equipment} aria-invalid={errors.equipment_id ? true : undefined} className={SELECT_CLASSES} {...form.register('equipment_id')}>
            <NativeSelectOption value="">{t('exercises.editor.noEquipment')}</NativeSelectOption>
            {(equipment.data ?? []).map(item => (
              <NativeSelectOption key={item.id} value={String(item.id)}>{item.name}</NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.equipment_id && <p role="alert" className="text-sm text-destructive">{errors.equipment_id.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.logging}>{t('exercises.editor.loggingType')}</Label>
          <NativeSelect id={ids.logging} className={SELECT_CLASSES} {...form.register('logging_type')}>
            {LOGGING_TYPES.map(type => (
              <NativeSelectOption key={type} value={type}>{t(`exercises.logging.${type}`)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Secondary muscles: a tick per muscle, in a fieldset whose legend
          names the group for screen readers. Controller connects a field
          that register() cannot: it hands `field.value` (the list of ids)
          and `field.onChange` (to give it a new list) to the render function */}
      <Controller
        control={form.control}
        name="secondary_muscles"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium">{t('exercises.editor.secondaryMuscles')}</legend>
            {/* Two columns when the form is narrow, three from 576 px */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 @xl:grid-cols-3">
              {(muscles.data ?? []).map((muscle) => {
                // This tick's id, and whether the muscle is the main one
                const id = `${ids.secondary}-${muscle.id}`
                const isPrimary = String(muscle.id) === primaryMuscle
                return (
                  // min-h-8 and the checkbox's enlarged hit area keep each
                  // row easy to tap; the label is clickable too
                  <div key={muscle.id} className="flex min-h-8 items-center gap-3">
                    <Checkbox
                      id={id}
                      // The main muscle cannot be secondary as well: shown
                      // unticked and disabled
                      checked={!isPrimary && field.value.includes(muscle.id)}
                      disabled={isPrimary}
                      // A new list: with the muscle added, or without it
                      onCheckedChange={checked => field.onChange(
                        checked ? [...field.value, muscle.id] : field.value.filter(value => value !== muscle.id),
                      )}
                    />
                    <Label htmlFor={id} className="font-normal">{muscle.name}</Label>
                  </div>
                )
              })}
            </div>
          </fieldset>
        )}
      />

      {/* YouTube link: the shared FormField, with its hint as the placeholder */}
      <FormField
        label={t('exercises.editor.youtube')}
        type="url"
        inputMode="url"
        placeholder={t('exercises.editor.youtubeHint')}
        error={errors.youtube_url?.message}
        {...form.register('youtube_url')}
      />

      {/* The actions: Save (or Create) and Cancel, side by side; Save first
          for the keyboard, since it is the main action */}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="xl" pending={isSubmitting}>{submitLabel}</Button>
        {/* Cancel: a function when given (inside a window), otherwise a link.
            type="button": inside a <form>, a plain button would submit it */}
        {onCancel
          ? <Button type="button" size="xl" variant="outline" onClick={onCancel}>{t('exercises.editor.cancel')}</Button>
          : (
              <Button asChild size="xl" variant="outline">
                <Link to={cancelTo ?? '/exercises'}>{t('exercises.editor.cancel')}</Link>
              </Button>
            )}
      </div>
    </form>
  )
}
