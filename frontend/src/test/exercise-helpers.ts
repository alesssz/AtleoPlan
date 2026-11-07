/*
 * What the tests of the exercise library share: exercises, pages and the two
 * fixed lists, shaped as the backend sends them, to put in fakeApi's table
 * (src/test/auth-helpers.tsx). Tests and checks: docs/concepts/C1-frontend.md C1.10.
 */
import type { Equipment } from '@/api/equipment'
import type { Exercise } from '@/api/exercises'
import type { Muscle } from '@/api/muscles'
import type { FakeAnswer } from './auth-helpers'

/** Three muscles, as GET /api/muscles sends them. */
export const testMuscles: Muscle[] = [
  { id: 6, slug: 'chest', name: 'Chest' },
  { id: 15, slug: 'shoulders', name: 'Shoulders' },
  { id: 17, slug: 'triceps', name: 'Triceps' },
]

/** Two kinds of equipment, as GET /api/equipment sends them. */
export const testEquipment: Equipment[] = [
  { id: 1, slug: 'barbell', name: 'Barbell' },
  { id: 11, slug: 'body-only', name: 'Body weight' },
]

/**
 * A public exercise, with two photos; `{ ...changes }` replaces some fields.
 * @param changes the fields to change
 */
export function testExercise(changes: Partial<Exercise> = {}): Exercise {
  return {
    id: 12,
    name: 'Barbell Bench Press',
    aliases: [],
    description: null,
    instructions: ['Lie on the bench.', 'Lower the bar to the chest.'],
    logging_type: 'weight_reps',
    youtube_url: null,
    is_mine: false,
    equipment: { id: 1, slug: 'barbell', name: 'Barbell' },
    muscles: [
      { id: 6, slug: 'chest', name: 'Chest', role: 'primary' },
      { id: 17, slug: 'triceps', name: 'Triceps', role: 'secondary' },
    ],
    photos: [{ id: 1, url: '/storage/1/0.jpg' }, { id: 2, url: '/storage/2/1.jpg' }],
    ...changes,
  }
}

/**
 * One page of GET /api/exercises.
 * @param exercises the page's exercises
 * @param meta where the page sits; one page of these exercises by default
 */
export function exercisePage(exercises: Exercise[], meta: { current_page?: number, last_page?: number, total?: number } = {}): FakeAnswer {
  return {
    status: 200,
    body: {
      data: exercises,
      meta: { current_page: 1, last_page: 1, total: exercises.length, ...meta },
    },
  }
}

/** The answers of the two fixed lists, for the filters and the editor. */
export const fixedLists = {
  'GET /api/muscles': { status: 200, body: { data: testMuscles } },
  'GET /api/equipment': { status: 200, body: { data: testEquipment } },
}
