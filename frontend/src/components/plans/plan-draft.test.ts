/*
 * The plan editor's draft (plan-draft.ts), without React: reading what the
 * user types, the conversions to and from the API, the rules, the supersets,
 * and what each action of the reducer does.
 */
import { describe, expect, it } from 'vitest'
import { testExercise } from '@/test/exercise-helpers'
import { testPlan } from '@/test/plan-helpers'
import { draftField, draftFromPlan, draftReducer, emptyDraft, newId, newItem, parseDecimal, parseReps, randomUuid, toPlanInput, validateDraft, type DraftAction, type PlanDraft } from './plan-draft'

/** The test plan as a draft, for an English reader in kilograms. */
function draft(): PlanDraft {
  return draftFromPlan(testPlan(), 'kg', 'en')
}

/**
 * Runs several actions in a row, as the editor does one at a time.
 * @param start the first draft
 * @param actions the actions, in order
 */
function run(start: PlanDraft, ...actions: DraftAction[]): PlanDraft {
  return actions.reduce(draftReducer, start)
}

describe('reading what is typed', () => {
  it('reads reps as one number or a range', () => {
    expect(parseReps('8')).toEqual({ min: 8, max: 8 })
    expect(parseReps('8-10')).toEqual({ min: 8, max: 10 })
    expect(parseReps(' 8 – 10 ')).toEqual({ min: 8, max: 10 })
    expect(parseReps('')).toBeNull()
    expect(parseReps('eight')).toBe('invalid')
  })

  it('reads decimals with a dot or a comma', () => {
    expect(parseDecimal('82,5')).toBe(82.5)
    expect(parseDecimal('82.5')).toBe(82.5)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('1e3')).toBeNaN()
  })
})

describe('from the API and back', () => {
  it('turns a saved plan into a draft and back into the same body', () => {
    const input = toPlanInput(draft(), 'kg')

    expect(input.version).toBe(3)
    expect(input.days.map(day => day.id)).toEqual(['day-a', 'day-b'])
    expect(input.days[0]?.items.map(item => [item.id, item.superset_group])).toEqual([['item-bench', null], ['item-row', 1], ['item-pullup', 1]])
    expect(input.days[0]?.items[0]?.sets[2]).toEqual({
      set_type: 'normal',
      target_reps_min: 8,
      target_reps_max: 10,
      target_weight_kg: 80,
      target_rpe: null,
      target_duration_seconds: null,
      target_distance_meters: null,
    })
    // The pull-ups are logged by reps: a weight would not be sent
    expect(input.days[0]?.items[2]?.sets[0]?.target_weight_kg).toBeNull()
  })

  it('keeps "as fast as possible", and sends it only for an exercise counted in reps', () => {
    // The bench press done for time, then flagged on a timed exercise too
    const plan = testPlan()
    const [dayA] = plan.days
    const withRace = testPlan({ days: [{ ...dayA!, items: [{ ...dayA!.items[0]!, for_time: true }, ...dayA!.items.slice(1)] }, ...plan.days.slice(1)] })
    const raced = draftFromPlan(withRace, 'kg', 'en')
    const hold = { ...newItem(testExercise({ id: 90, name: 'Dead Hang', logging_type: 'time' })), for_time: true }
    raced.days[0]!.items.push(hold)

    const input = toPlanInput(raced, 'kg')
    expect(raced.days[0]?.items[0]?.for_time).toBe(true)
    expect(input.days[0]?.items.map(item => item.for_time)).toEqual([true, false, false, false])
  })

  it('shows weights in the user\'s unit and language, and sends kilograms', () => {
    const inPounds = draftFromPlan(testPlan(), 'lb', 'it')
    const bench = inPounds.days[0]?.items[0]

    expect(bench?.sets[2]?.weight).toBe('176,37')
    // 176,37 lb back to kilograms, three decimals: what the user sees is what is kept
    expect(toPlanInput(inPounds, 'lb').days[0]?.items[0]?.sets[2]?.target_weight_kg).toBe(80)
  })

  it('starts a new plan with one empty day and no version', () => {
    const fresh = emptyDraft('Day A')
    const input = toPlanInput(fresh, 'kg')

    expect(input).not.toHaveProperty('version')
    expect(input.days).toEqual([{ id: fresh.days[0]?.id, name: 'Day A', items: [] }])
  })

  it('names the draft\'s field for a field named by the server', () => {
    expect(draftField('days.0.items.1.sets.2.target_reps_max')).toBe('days.0.items.1.sets.2.reps')
    expect(draftField('days.1.items.0.rest_seconds')).toBe('days.1.items.0.rest')
    expect(draftField('name')).toBe('name')
  })
})

describe('validateDraft', () => {
  it('finds nothing wrong in a saved plan', () => {
    expect(validateDraft(draft(), 'kg')).toEqual({})
  })

  it('names each wrong field, with the key of its message', () => {
    const wrong = run(
      draft(),
      { type: 'setPlanField', field: 'name', value: ' ' },
      { type: 'renameDay', day: 1, name: '' },
      { type: 'setSetField', day: 0, item: 0, set: 2, field: 'reps', value: '10-8' },
      { type: 'setSetField', day: 0, item: 0, set: 3, field: 'rpe', value: '8.25' },
      { type: 'setItemField', day: 0, item: 0, field: 'rest', value: '1 min' },
    )

    expect(validateDraft(wrong, 'kg')).toEqual({
      'name': 'plans.editor.errors.nameRequired',
      'days.1.name': 'plans.editor.errors.dayNameRequired',
      'days.0.items.0.sets.2.reps': 'plans.editor.errors.reps',
      'days.0.items.0.sets.3.rpe': 'plans.editor.errors.rpe',
      'days.0.items.0.rest': 'plans.editor.errors.rest',
    })
  })
})

describe('draftReducer', () => {
  it('leaves the draft it was given as it was', () => {
    const before = draft()
    const copy = structuredClone(before)

    draftReducer(before, { type: 'setPlanField', field: 'name', value: 'Changed' })

    expect(before).toEqual(copy)
  })

  it('adds exercises with three sets each, and a set copied from the last one', () => {
    const squat = testExercise({ id: 40, name: 'Barbell Squat' })
    const next = run(
      draft(),
      { type: 'addExercises', day: 1, exercises: [squat] },
      { type: 'setSetField', day: 1, item: 1, set: 2, field: 'weight', value: '100' },
      { type: 'addSet', day: 1, item: 1 },
    )

    const added = next.days[1]?.items[1]
    expect(added?.exercise.name).toBe('Barbell Squat')
    expect(added?.sets.map(set => [set.reps, set.weight])).toEqual([['8-10', ''], ['8-10', ''], ['8-10', '100'], ['8-10', '100']])
  })

  it('turns "as fast as possible" on and off', () => {
    const on = draftReducer(draft(), { type: 'setItemForTime', day: 0, item: 2, value: true })
    const off = draftReducer(on, { type: 'setItemForTime', day: 0, item: 2, value: false })

    expect(on.days[0]?.items[2]?.for_time).toBe(true)
    expect(off.days[0]?.items[2]?.for_time).toBe(false)
    // A new exercise starts without it
    expect(newItem(testExercise()).for_time).toBe(false)
  })

  it('sets a set\'s type, leaving the other sets as they are', () => {
    const before = draft().days[1]?.items[0]?.sets.map(set => set.set_type) ?? []
    const next = draftReducer(draft(), { type: 'setSetType', day: 1, item: 0, set: 0, setType: 'failure' })

    expect(next.days[1]?.items[0]?.sets.map(set => set.set_type)).toEqual(['failure', ...before.slice(1)])
  })

  it('joins exercises into a superset, next to each other where the first was', () => {
    const start = run(draft(), { type: 'addExercises', day: 0, exercises: [testExercise({ id: 50, name: 'Dips' })] })
    // Day A: bench (0), row and pull-ups in superset 1 (1, 2), dips (3).
    // Join the bench and the dips
    const next = draftReducer(start, { type: 'joinSuperset', day: 0, items: [3, 0] })

    expect(next.days[0]?.items.map(item => [item.exercise.name, item.superset_group])).toEqual([
      ['Barbell Bench Press', 1],
      ['Dips', 1],
      ['Bent Over Barbell Row', 2],
      ['Pullups', 2],
    ])
  })

  it('takes an exercise out of its superset when it is dragged away, and ends a superset of one', () => {
    // The row (1) moved above the bench (0): the pull-ups stay alone
    const next = draftReducer(draft(), { type: 'moveItem', day: 0, from: 1, to: 0 })

    expect(next.days[0]?.items.map(item => [item.exercise.name, item.superset_group])).toEqual([
      ['Bent Over Barbell Row', null],
      ['Barbell Bench Press', null],
      ['Pullups', null],
    ])
  })

  it('moves an exercise to another day, alone, and keeps its id', () => {
    const next = draftReducer(draft(), { type: 'moveItemToDay', day: 0, item: 2, toDay: 1 })

    expect(next.days[1]?.items.map(item => [item.id, item.superset_group])).toEqual([['item-squat', null], ['item-pullup', null]])
    // The row, left alone in day A, is no superset any more
    expect(next.days[0]?.items.map(item => item.superset_group)).toEqual([null, null])
  })

  it('adds, renames, moves and removes days', () => {
    const next = run(
      draft(),
      { type: 'addDay', name: 'Day C' },
      { type: 'moveDay', from: 2, to: 0 },
      { type: 'renameDay', day: 0, name: 'Day C – Legs' },
      { type: 'removeDay', day: 2 },
    )

    expect(next.days.map(day => day.name)).toEqual(['Day C – Legs', 'Day A – Push'])
  })

  it('stops at the backend\'s limits', () => {
    let full = emptyDraft('Day A')
    for (let day = 1; day < 20; day++) full = draftReducer(full, { type: 'addDay', name: `Day ${day}` })
    const many = Array.from({ length: 40 }, (_, index) => testExercise({ id: index }))
    full = draftReducer(full, { type: 'addExercises', day: 0, exercises: many })

    expect(full.days).toHaveLength(14)
    expect(full.days[0]?.items).toHaveLength(30)
  })

  it('gives every new exercise its own id', () => {
    const exercise = testExercise()

    expect(newItem(exercise).id).not.toBe(newItem(exercise).id)
  })
})

describe('newId', () => {
  /** A version 4 UUID: 8-4-4-4-12 hexadecimal digits, a 4 at the start of the third group, 8, 9, a or b at the start of the fourth. */
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  it('builds a version 4 UUID by hand, different every time', () => {
    const ids = Array.from({ length: 50 }, () => randomUuid())

    for (const id of ids) expect(id).toMatch(UUID_V4)
    // new Set(): the distinct values; 50 ids, 50 different
    expect(new Set(ids).size).toBe(50)
  })

  it('still works where the browser gives no crypto.randomUUID (a page on plain http, not localhost)', () => {
    // Remove the function, as a phone's browser does on http://192.168.…,
    // and put it back afterwards whatever happens (finally), so the other
    // tests keep it. defineProperty: crypto's own properties cannot be
    // assigned with `=`
    const original = crypto.randomUUID
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    try {
      expect(newId()).toMatch(UUID_V4)
    }
    finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
    }
  })
})
