/*
 * The workout in progress (workout-session.ts), without React: starting from
 * a plan's day with last time's values, ticking sets, the rest timer, the
 * supersets, the clock with its pauses, and the body sent at the end.
 */
import { describe, expect, it } from 'vitest'
import type { LastSets } from '@/api/sessions'
import { testPlan } from '@/test/plan-helpers'
import { clock } from './clock'
import { testExercise } from '@/test/exercise-helpers'
import { allSetsDone, canComplete, countSets, elapsedSeconds, exerciseFrom, restLeft, setNumbers, startFreeSession, startSession, toSessionInput, workoutReducer, type ActiveSession, type WorkoutAction } from './workout-session'

/** The moment the workout starts: 18:00 UTC. */
const START = new Date('2026-11-09T18:00:00Z')

/**
 * A moment some seconds after the start, as ISO 8601 text.
 * @param seconds the seconds after START
 */
function at(seconds: number): string {
  return new Date(START.getTime() + seconds * 1000).toISOString()
}

/** Last time's bench press: a warm-up of 40 × 10, then 82.5 × 8. */
const lastBench: LastSets = {
  exercise_id: 12,
  session_id: 'session-old',
  started_at: '2026-11-02T18:00:00Z',
  sets: [
    { id: 'old-1', set_type: 'warm_up', weight_kg: '40.000', reps: 10, duration_seconds: null, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' },
    { id: 'old-2', set_type: 'normal', weight_kg: '82.500', reps: 8, duration_seconds: null, distance_meters: null, completed_at: '2026-11-02T18:08:00Z' },
  ],
}

/** Day A of the test plan, started at START, with last time's bench press. */
function dayA(): ActiveSession {
  const plan = testPlan()
  return startSession(plan, plan.days[0]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [lastBench], language: 'en', now: START })
}

/**
 * Runs actions in turn, as the screen does one at a time.
 * @param start the first state
 * @param actions the actions
 */
function run(start: ActiveSession, ...actions: WorkoutAction[]): ActiveSession {
  return actions.reduce(workoutReducer, start)
}

describe('startSession', () => {
  it('makes a set to do for each planned set, filled with last time\'s values, else the target', () => {
    const session = dayA()
    const bench = session.exercises[0]!

    expect(session.day_name).toBe('Day A – Push')
    expect(session.exercises.map(item => item.exercise.name)).toEqual(['Barbell Bench Press', 'Bent Over Barbell Row', 'Pullups'])
    expect(bench.rest_seconds).toBe(90)
    // Sets 1 and 2 from last time (40 × 10, 82.5 × 8); the others from the
    // plan's target, 80 kg and the lower end of 8–10
    expect(bench.sets.map(set => [set.set_type, set.weight, set.reps])).toEqual([
      ['warm_up', '40', '10'],
      ['warm_up', '82.5', '8'],
      ['normal', '80', '8'],
      ['normal', '80', '8'],
      ['normal', '80', '8'],
      ['normal', '80', '8'],
    ])
    expect(bench.sets[1]?.last?.reps).toBe(8)
    // The rows have no rest of their own: the user's default
    expect(session.exercises[1]?.rest_seconds).toBe(90)
  })

  it('writes the weights in the user\'s unit and language', () => {
    const plan = testPlan()
    const session = startSession(plan, plan.days[0]!, { unit: 'lb', defaultRestSeconds: 90, lastSets: [], language: 'it', now: START })

    expect(session.exercises[0]?.sets[2]?.weight).toBe('176,37')
  })
})

describe('startFreeSession and exerciseFrom', () => {
  it('starts a workout with no plan and no exercises, its clock running', () => {
    const session = startFreeSession(START)

    expect(session).toMatchObject({ plan_id: null, plan_day_id: null, day_name: null, exercises: [], started_at: START.toISOString(), running_since: START.toISOString() })
  })

  it('adds exercises from the library: last time\'s sets when there were some, one empty set otherwise', () => {
    const options = { unit: 'kg' as const, defaultRestSeconds: 120, language: 'it' }
    const bench = exerciseFrom(testExercise({ id: 12 }), [lastBench], options)
    const squat = exerciseFrom(testExercise({ id: 40, name: 'Barbell Squat' }), [lastBench], options)

    // Last time's two sets, the warm-up kept, in Italian
    expect(bench.sets.map(set => [set.set_type, set.weight, set.reps])).toEqual([['warm_up', '40', '10'], ['normal', '82,5', '8']])
    expect(bench).toMatchObject({ plan_item: null, superset_group: null, rest_seconds: 120 })
    expect(squat.sets.map(set => [set.set_type, set.weight, set.reps])).toEqual([['normal', '', '']])

    // Added at the end of the workout, and the first of them opened
    const session = run(startFreeSession(START), { type: 'addExercises', exercises: [bench, squat] })
    expect(session.exercises.map(item => item.exercise.name)).toEqual(['Barbell Bench Press', 'Barbell Squat'])
    expect(session.current).toBe(0)
    const more = run(dayA(), { type: 'addExercises', exercises: [squat] })
    expect(more.current).toBe(3)
  })
})

describe('setNumbers', () => {
  it('counts warm-ups apart, so the sets that count start from 1', () => {
    const bench = dayA().exercises[0]!

    expect(setNumbers(bench.sets)).toEqual([
      { warmUp: true, number: 1 },
      { warmUp: true, number: 2 },
      { warmUp: false, number: 1 },
      { warmUp: false, number: 2 },
      { warmUp: false, number: 3 },
      { warmUp: false, number: 4 },
    ])
    // A set turned into a warm-up: the numbers after it move up
    const changed = run(dayA(), { type: 'cycleSetType', exercise: 0, set: 2 }).exercises[0]!
    expect(setNumbers(changed.sets).map(entry => entry.number)).toEqual([1, 2, 3, 1, 2, 3])
  })
})

describe('workoutReducer', () => {
  it('ticks a set, which starts the rest; unticking leaves the rest alone', () => {
    const ticked = run(dayA(), { type: 'toggleSet', exercise: 0, set: 0, now: at(60) })

    expect(ticked.exercises[0]?.sets[0]?.done).toBe(true)
    expect(ticked.exercises[0]?.sets[0]?.completed_at).toBe(at(60))
    expect(ticked.rest).toEqual({ ends_at: at(150), total: 90 })
    expect(restLeft(ticked, new Date(at(100)))).toBe(50)
    // A `now` older than the tap never shows more than the rest itself
    expect(restLeft(ticked, new Date(at(59)))).toBe(90)

    const unticked = run(ticked, { type: 'toggleSet', exercise: 0, set: 0, now: at(70) })
    expect(unticked.exercises[0]?.sets[0]?.done).toBe(false)
    expect(unticked.rest).not.toBeNull()
  })

  it('does not tick a set whose values do not read', () => {
    const session = run(dayA(), { type: 'setField', exercise: 0, set: 2, field: 'reps', value: 'eight' }, { type: 'toggleSet', exercise: 0, set: 2, now: at(60) })

    expect(session.exercises[0]?.sets[2]?.done).toBe(false)
    expect(canComplete(session.exercises[0]!.sets[2]!, 'weight_reps')).toBe(false)
    // A weight typed must read too
    const typo = { ...session.exercises[0]!.sets[3]!, weight: '8o' }
    expect(canComplete(typo, 'weight_reps')).toBe(false)
  })

  it('ticks a set with no weight: the body alone, or no added weight', () => {
    const bench = dayA().exercises[0]!.sets[2]!
    const pullup = dayA().exercises[2]!.sets[0]!

    expect(canComplete({ ...bench, weight: '' }, 'weight_reps')).toBe(true)
    expect(canComplete({ ...pullup, reps: '10' }, 'reps')).toBe(true)
    expect(canComplete({ ...pullup, reps: '10', weight: '10' }, 'reps')).toBe(true)
  })

  it('moves through a superset with no rest, then rests and goes back to its first exercise', () => {
    // The rows (1) and the pull-ups (2) are superset 1. The pull-ups' set
    // has no reps planned: one is typed in
    const afterRows = run(dayA(), { type: 'goTo', exercise: 1 }, { type: 'toggleSet', exercise: 1, set: 0, now: at(60) })
    expect(afterRows.current).toBe(2)
    expect(afterRows.rest).toBeNull()

    const afterPullups = run(afterRows, { type: 'setField', exercise: 2, set: 0, field: 'reps', value: '10' }, { type: 'toggleSet', exercise: 2, set: 0, now: at(90) })
    expect(afterPullups.current).toBe(1)
    expect(afterPullups.rest?.total).toBe(90)
  })

  it('moves the rest by ±15 seconds, and ends it', () => {
    const resting = run(dayA(), { type: 'toggleSet', exercise: 0, set: 0, now: at(0) }, { type: 'adjustRest', seconds: 15 })
    expect(restLeft(resting, START)).toBe(105)

    expect(run(resting, { type: 'endRest' }).rest).toBeNull()
  })

  it('adds a set copying the last one\'s values', () => {
    const session = run(dayA(), { type: 'setField', exercise: 0, set: 5, field: 'weight', value: '85' }, { type: 'addSet', exercise: 0 })

    expect(session.exercises[0]?.sets).toHaveLength(7)
    expect(session.exercises[0]?.sets[6]).toMatchObject({ weight: '85', reps: '8', done: false, last: null })
  })

  it('cycles a set\'s type', () => {
    const session = run(dayA(), { type: 'cycleSetType', exercise: 0, set: 2 }, { type: 'cycleSetType', exercise: 0, set: 2 })

    expect(session.exercises[0]?.sets[2]?.set_type).toBe('drop')
  })

  it('counts the time trained without the pauses', () => {
    const session = run(dayA(), { type: 'pause', now: at(600) }, { type: 'resume', now: at(3600) })

    // 10 minutes before the pause, then 2 minutes after it
    expect(elapsedSeconds(session, new Date(at(3720)))).toBe(720)
    expect(clock(elapsedSeconds(session, new Date(at(3720))))).toBe('12:00')
  })
})

describe('toSessionInput', () => {
  it('sends every exercise, the ticked sets only, in kilograms, with the time trained', () => {
    const session = run(
      dayA(),
      { type: 'toggleSet', exercise: 0, set: 0, now: at(60) },
      { type: 'setField', exercise: 0, set: 2, field: 'weight', value: '82,5' },
      { type: 'toggleSet', exercise: 0, set: 2, now: at(200) },
      { type: 'finish', now: at(1800) },
    )

    const input = toSessionInput(session, 'kg', new Date(at(1800)))

    expect(input).toMatchObject({ plan_id: 'plan-ppl', plan_day_id: 'day-a', day_name: 'Day A – Push', finished_at: at(1800), duration_seconds: 1800 })
    expect(input.exercises.map(item => [item.plan_item_id, item.sets.length])).toEqual([['item-bench', 2], ['item-row', 0], ['item-pullup', 0]])
    expect(input.exercises[0]?.sets[1]).toEqual({
      id: session.exercises[0]?.sets[2]?.id,
      set_type: 'normal',
      weight_kg: 82.5,
      reps: 8,
      duration_seconds: null,
      distance_meters: null,
      completed_at: at(200),
    })
    // Two sets ticked, but the warm-up does not count for the Finish dialog:
    // 1 of 7: 4 for the bench, 2 for the rows, 1 for the pull-ups
    expect(countSets(session)).toEqual({ done: 1, total: 7 })
    expect(allSetsDone(session)).toBe(false)
  })

  it('sends an empty weight as none, and the added weight of a pull-up', () => {
    const session = run(
      dayA(),
      { type: 'setField', exercise: 0, set: 2, field: 'weight', value: '' },
      { type: 'toggleSet', exercise: 0, set: 2, now: at(60) },
      { type: 'setField', exercise: 2, set: 0, field: 'reps', value: '6' },
      { type: 'setField', exercise: 2, set: 0, field: 'weight', value: '10' },
      { type: 'toggleSet', exercise: 2, set: 0, now: at(120) },
    )

    const input = toSessionInput(session, 'kg', new Date(at(120)))

    expect(input.exercises[0]?.sets[0]).toMatchObject({ weight_kg: null, reps: 8 })
    expect(input.exercises[2]?.sets[0]).toMatchObject({ weight_kg: 10, reps: 6 })
  })

  it('sends pounds as kilograms', () => {
    const plan = testPlan()
    const session = run(
      startSession(plan, plan.days[1]!, { unit: 'lb', defaultRestSeconds: 90, lastSets: [], language: 'en', now: START }),
      { type: 'setField', exercise: 0, set: 0, field: 'weight', value: '135' },
      { type: 'toggleSet', exercise: 0, set: 0, now: at(60) },
    )

    expect(toSessionInput(session, 'lb', new Date(at(60))).exercises[0]?.sets[0]?.weight_kg).toBe(61.235)
  })
})
