/*
 * The exercise editor's rules and conversions (docs/design/D1-ui.md D1.4.5),
 * apart from the form component (ExerciseForm.tsx) so that they can be tested
 * on their own (exercise-form.test.ts). No React here: plain TypeScript.
 *
 * The form's fields are shaped for the screen, not for the API: the
 * instructions are one text, a step per line; the main muscle is one choice
 * and the secondary ones a list of ticks. toExerciseInput() turns them into
 * what the backend expects (StoreExerciseRequest), and formValuesFrom() does
 * the opposite for an exercise being changed.
 *
 * The rules repeat the backend's few that a user can break while typing, so
 * that the message comes at once and in the user's language; the backend
 * checks everything again (docs/concepts/C1-frontend.md C1.13).
 */
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { LOGGING_TYPES, type Exercise, type ExerciseInput, type LoggingType } from '@/api/exercises'

/** The longest name the backend accepts. */
export const NAME_MAX_LENGTH = 100

/** The longest description the backend accepts. */
export const DESCRIPTION_MAX_LENGTH = 2000

/**
 * A YouTube address, as the backend's rule wants it: https, then youtube.com
 * (with www. or m.) or youtu.be. The `i` at the end ignores upper and lower case.
 */
const YOUTUBE_URL = /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i

/**
 * The form's rules, with messages in the current language.
 *
 * The names of the fields are the backend's where they match (`name`,
 * `equipment_id`, `youtube_url`…), so that its 422 answers land on the right
 * field (showRequestError, src/lib/form.ts).
 *
 * @param t the translate function
 */
export function exerciseFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim()
      .min(1, { error: t('exercises.editor.errors.required') })
      .max(NAME_MAX_LENGTH, { error: t('exercises.editor.errors.tooLong', { max: NAME_MAX_LENGTH }) }),
    description: z.string().max(DESCRIPTION_MAX_LENGTH, { error: t('exercises.editor.errors.tooLong', { max: DESCRIPTION_MAX_LENGTH }) }),
    // One text: a step per line
    instructions: z.string(),
    // z.enum(): one of these exact strings. `as [LoggingType, ...LoggingType[]]`
    // tells TypeScript the list is not empty, which z.enum() requires
    logging_type: z.enum(LOGGING_TYPES as [LoggingType, ...LoggingType[]]),
    // A <select>'s value is always text: a muscle's id, or '' for none
    primary_muscle: z.string(),
    // The ids of the ticked muscles
    secondary_muscles: z.array(z.number()),
    // An equipment's id, or '' for none
    equipment_id: z.string(),
    // Empty, or a YouTube address. refine() adds a rule of our own: a
    // function that returns true when the value is valid
    youtube_url: z.string().trim().refine(value => value === '' || YOUTUBE_URL.test(value), {
      error: t('exercises.editor.errors.youtube'),
    }),
  })
}

/** The form's values, derived from the schema, so the two cannot drift apart. */
export type ExerciseFormValues = z.infer<ReturnType<typeof exerciseFormSchema>>

/**
 * The values of an empty form.
 * @param name a name to start with, such as the search that found nothing; '' by default
 */
export function emptyFormValues(name = ''): ExerciseFormValues {
  return {
    name,
    description: '',
    instructions: '',
    logging_type: 'weight_reps',
    primary_muscle: '',
    secondary_muscles: [],
    equipment_id: '',
    youtube_url: '',
  }
}

/**
 * The form's values for an exercise being changed.
 * @param exercise the exercise, as the API sent it
 */
export function formValuesFrom(exercise: Exercise): ExerciseFormValues {
  // The first primary muscle goes in the select; any other primary one, and
  // the secondary ones, become ticks
  const primary = exercise.muscles.find(muscle => muscle.role === 'primary')

  return {
    name: exercise.name,
    description: exercise.description ?? '',
    // The steps, one per line
    instructions: exercise.instructions.join('\n'),
    logging_type: exercise.logging_type,
    // String(): a <select> holds text
    primary_muscle: primary ? String(primary.id) : '',
    secondary_muscles: exercise.muscles.filter(muscle => muscle !== primary).map(muscle => muscle.id),
    equipment_id: exercise.equipment ? String(exercise.equipment.id) : '',
    youtube_url: exercise.youtube_url ?? '',
  }
}

/**
 * What to send to the API for the form's values.
 *
 * - Empty texts become null, which empties the field on the backend.
 * - The instructions are split at line breaks; blank lines are dropped.
 * - The muscles become one list: the main one as primary, the ticked ones as
 *   secondary, without the main one if it was also ticked.
 *
 * @param values the form's values, already checked by the schema
 * @returns the body of POST or PATCH /api/exercises
 */
export function toExerciseInput(values: ExerciseFormValues): ExerciseInput {
  // The main muscle's id; null when none is chosen
  const primary = values.primary_muscle ? Number(values.primary_muscle) : null
  // The steps: split() at each line break (\n, or \r\n on Windows), trimmed, empty ones dropped
  const steps = values.instructions.split(/\r?\n/).map(step => step.trim()).filter(step => step !== '')

  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    instructions: steps,
    logging_type: values.logging_type,
    equipment_id: values.equipment_id ? Number(values.equipment_id) : null,
    youtube_url: values.youtube_url.trim() || null,
    muscles: [
      // `...(cond ? [a] : [])`: the item only when there is one
      ...(primary !== null ? [{ id: primary, role: 'primary' as const }] : []),
      ...values.secondary_muscles
        .filter(id => id !== primary)
        .map(id => ({ id, role: 'secondary' as const })),
    ],
  }
}
