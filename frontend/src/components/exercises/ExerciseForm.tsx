/*
 * The exercise editor's form: name, description, instructions, main and
 * secondary muscles, equipment, logging type and YouTube link. Used to create
 * an exercise and to change one (src/pages/ExerciseEditorPage.tsx), and to
 * create one without leaving the plan editor, inside its exercise picker
 * (ExercisePicker). The photos are not fields of this form: the edit page shows
 * them under it (ExercisePhotoManager), each change sent at once.
 *
 * Built like every form of the app.
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

interface ExerciseFormProps {
  defaultValues: ExerciseFormValues
  /** The page knows whether it creates or changes. */
  save: (input: ExerciseInput) => Promise<Exercise>
  onSaved: (exercise: Exercise) => void
  submitLabel: string
  cancelTo?: string
  /**
   * What Cancel does instead of going to an address: inside the plan
   * editor's exercise picker, back to the search (ExercisePicker).
   */
  onCancel?: () => void
}

/** The fields the API may refuse one by one: their messages go under them. */
const SERVER_FIELDS = ['name', 'description', 'instructions', 'logging_type', 'equipment_id', 'youtube_url'] as const

const SELECT_CLASSES = 'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base'

export function ExerciseForm({ defaultValues, save, onSaved, submitLabel, cancelTo, onCancel }: ExerciseFormProps) {
  const { t, i18n } = useTranslation()
  const muscles = useMuscles(i18n.language)
  const equipment = useEquipment(i18n.language)
  // The language the exercise is written in: the app's
  const language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema(t)),
    defaultValues,
  })
  // isSubmitting covers the request: handleSubmit awaits onSubmit
  const { errors, isSubmitting } = form.formState
  // Watched, so its tick below is disabled at once
  const primaryMuscle = useWatch({ control: form.control, name: 'primary_muscle' })

  const ids = {
    description: useId(),
    instructions: useId(),
    instructionsHint: useId(),
    primary: useId(),
    secondary: useId(),
    equipment: useId(),
    logging: useId(),
  }

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
    // noValidate: the messages come from the schema, translated. The grids
    // follow the form's width, not the screen's: in the plan editor's picker it
    // sits in a narrow window
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="@container flex flex-col gap-6">
      {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}

      {/* Which language this exercise is written in */}
      <p className="text-sm text-muted-foreground">
        {t('exercises.editor.languageHint', { language: LANGUAGE_NAMES[language] })}
      </p>

      <FormField label={t('exercises.editor.name')} error={errors.name?.message} autoComplete="off" {...form.register('name')} />

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

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.instructions}>{t('exercises.editor.instructions')}</Label>
        <Textarea id={ids.instructions} rows={5} aria-describedby={ids.instructionsHint} className="rounded-xl" {...form.register('instructions')} />
        <p id={ids.instructionsHint} className="text-sm text-muted-foreground">{t('exercises.editor.instructionsHint')}</p>
        {errors.instructions && <p role="alert" className="text-sm text-destructive">{errors.instructions.message}</p>}
      </div>

      <div className="grid gap-6 @xl:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.primary}>{t('exercises.editor.primaryMuscle')}</Label>
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

      <Controller
        control={form.control}
        name="secondary_muscles"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium">{t('exercises.editor.secondaryMuscles')}</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 @xl:grid-cols-3">
              {(muscles.data ?? []).map((muscle) => {
                const id = `${ids.secondary}-${muscle.id}`
                const isPrimary = String(muscle.id) === primaryMuscle
                return (
                  <div key={muscle.id} className="flex min-h-8 items-center gap-3">
                    <Checkbox
                      id={id}
                      // The main muscle cannot be secondary as well
                      checked={!isPrimary && field.value.includes(muscle.id)}
                      disabled={isPrimary}
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

      <FormField
        label={t('exercises.editor.youtube')}
        type="url"
        inputMode="url"
        placeholder={t('exercises.editor.youtubeHint')}
        error={errors.youtube_url?.message}
        {...form.register('youtube_url')}
      />

      {/* Save first for the keyboard: the main action */}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="xl" pending={isSubmitting}>{submitLabel}</Button>
        {/* A function inside a window, a link otherwise */}
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
