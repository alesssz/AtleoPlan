/*
 * The editor's conversions and rules (exercise-form.ts), without React: from
 * the form to the API, from an exercise to the form, and the schema's messages.
 */
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { testExercise } from '@/test/exercise-helpers'
import { emptyFormValues, exerciseFormSchema, formValuesFrom, toExerciseInput } from './exercise-form'

describe('toExerciseInput', () => {
  it('turns the form into what the API expects', () => {
    const input = toExerciseInput({
      ...emptyFormValues(),
      name: '  Panca mia  ',
      // Windows line breaks, spaces and a blank line, as people type them
      instructions: 'Sdraiati.\r\n\n  Spingi.  ',
      primary_muscle: '6',
      secondary_muscles: [17, 15],
      equipment_id: '1',
      logging_type: 'reps',
    })

    expect(input).toEqual({
      name: 'Panca mia',
      description: null,
      instructions: ['Sdraiati.', 'Spingi.'],
      logging_type: 'reps',
      equipment_id: 1,
      youtube_url: null,
      muscles: [
        { id: 6, role: 'primary' },
        { id: 17, role: 'secondary' },
        { id: 15, role: 'secondary' },
      ],
    })
  })

  it('never sends the main muscle as a secondary one too', () => {
    const input = toExerciseInput({ ...emptyFormValues('Panca'), primary_muscle: '6', secondary_muscles: [6, 17] })

    expect(input.muscles).toEqual([{ id: 6, role: 'primary' }, { id: 17, role: 'secondary' }])
  })

  it('sends no muscle and no equipment when none is chosen', () => {
    const input = toExerciseInput(emptyFormValues('Plank'))

    expect(input.muscles).toEqual([])
    expect(input.equipment_id).toBeNull()
  })
})

describe('formValuesFrom', () => {
  it('fills the form from an exercise, and gives it back unchanged', () => {
    const exercise = testExercise({ is_mine: true, description: 'Grip a bit wider.' })

    const values = formValuesFrom(exercise)

    expect(values).toMatchObject({
      name: 'Barbell Bench Press',
      instructions: 'Lie on the bench.\nLower the bar to the chest.',
      primary_muscle: '6',
      secondary_muscles: [17],
      equipment_id: '1',
    })
    // The round trip: the same muscles, instructions and equipment
    expect(toExerciseInput(values)).toMatchObject({
      instructions: exercise.instructions,
      equipment_id: 1,
      muscles: [{ id: 6, role: 'primary' }, { id: 17, role: 'secondary' }],
    })
  })
})

describe('exerciseFormSchema', () => {
  // safeParse(): checks without throwing, and says what failed
  it('asks for a name, and refuses a link that is not YouTube', () => {
    const result = exerciseFormSchema(i18n.t).safeParse({ ...emptyFormValues(), youtube_url: 'https://vimeo.com/1' })

    expect(result.success).toBe(false)
    // The message of each failed field: field name → message
    const messages = Object.fromEntries((result.error?.issues ?? []).map(issue => [issue.path[0], issue.message]))
    expect(messages).toEqual({
      name: 'Write a name.',
      youtube_url: 'Paste a YouTube link (youtube.com or youtu.be).',
    })
  })

  it('accepts the YouTube addresses people paste', () => {
    for (const url of ['https://www.youtube.com/watch?v=abc', 'https://youtu.be/abc', 'https://m.youtube.com/watch?v=abc', '']) {
      expect(exerciseFormSchema(i18n.t).safeParse({ ...emptyFormValues('Panca'), youtube_url: url }).success, url).toBe(true)
    }
  })
})
