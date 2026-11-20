import { describe, expect, it } from 'vitest'
import type { LastSets } from '@/api/sessions'
import { testPlan } from '@/test/plan-helpers'
import { clock } from './clock'
import { testExercise } from '@/test/exercise-helpers'
import { loggedSetText } from './set-text'
import { allSetsDone, canComplete, canRemoveExercise, canRemoveSet, countdownLeft, countSets, elapsedSeconds, nextInRound, stations, exerciseFrom, hasWorkLeft, isForTime, restLeft, setNumbers, startFreeSession, startSession, stopwatchSeconds, stopwatchTargetAt, supersetNext, swappedExercise, toSessionInput, upNext, workoutReducer, type ActiveSession, type WorkoutAction } from './workout-session'

/** The moment the workout starts: 18:00 UTC. */
const START = new Date('2026-11-09T18:00:00Z')

/** A moment `seconds` after START, as ISO 8601. */
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

/** Runs actions in turn, as the screen dispatches them. */
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
    const changed = run(dayA(), { type: 'setSetType', exercise: 0, set: 2, setType: 'warm_up' }).exercises[0]!
    expect(setNumbers(changed.sets).map(entry => entry.number)).toEqual([1, 2, 3, 1, 2, 3])
  })
})

/**
 * A free workout with one timed exercise, a hold of two sets, the first
 * aiming at 30 seconds, the second empty; a rest of 60 seconds.
 */
function holdWorkout(): ActiveSession {
  const hold = exerciseFrom(testExercise({ id: 90, name: 'Dead Hang', logging_type: 'time' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 60 })
  return run(
    startFreeSession(START),
    { type: 'addExercises', exercises: [hold] },
    { type: 'addSet', exercise: 0 },
    { type: 'setField', exercise: 0, set: 0, field: 'seconds', value: '30' },
  )
}

describe('the stopwatch', () => {
  it('starts on a set with its seconds as the target, after a countdown, and ends the rest', () => {
    const resting = { ...holdWorkout(), rest: { ends_at: at(100), total: 60 } }
    const session = run(resting, { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 })

    // ▶ at 10 s: the count starts 5 s later
    expect(session.stopwatch).toEqual({ set_id: session.exercises[0]?.sets[0]?.id, started_at: at(15), target: 30 })
    expect(session.rest).toBeNull()
    expect(countdownLeft(session.stopwatch!, new Date(at(10)))).toBe(5)
    expect(countdownLeft(session.stopwatch!, new Date(at(13.2)))).toBe(2)
    expect(stopwatchSeconds(session.stopwatch!, new Date(at(13.2)))).toBe(0)
    // Counted from the end of the countdown, in whole seconds
    expect(countdownLeft(session.stopwatch!, new Date(at(15)))).toBe(0)
    expect(stopwatchSeconds(session.stopwatch!, new Date(at(42.7)))).toBe(27)
  })

  it('starts at once with no countdown in Profile', () => {
    const session = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 0 })

    expect(session.stopwatch?.started_at).toBe(at(10))
    expect(countdownLeft(session.stopwatch!, new Date(at(10)))).toBe(0)
  })

  it('starts counting at once with Start now', () => {
    const started = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'skipCountdown', now: at(12) })
    expect(started.stopwatch?.started_at).toBe(at(12))
    // Once counting, Start now changes nothing
    expect(run(started, { type: 'skipCountdown', now: at(20) }).stopwatch?.started_at).toBe(at(12))
  })

  it('stops: the time goes into the set, which is ticked, and the rest starts', () => {
    const session = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'stopStopwatch', now: at(35.4) })
    const set = session.exercises[0]?.sets[0]

    expect(session.stopwatch).toBeNull()
    expect(set).toMatchObject({ seconds: '20', done: true, completed_at: at(35.4) })
    expect(session.rest).toEqual({ ends_at: at(95.4), total: 60 })
  })

  it('writes the target of a hold, however late it is stopped', () => {
    // Aiming at 30 s, stopped 2 minutes after the start (the screen was off)
    const session = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'stopStopwatch', now: at(135) })

    expect(session.exercises[0]?.sets[0]).toMatchObject({ seconds: '30', done: true })
  })

  it('stopped during the countdown, measures nothing: the set is ticked with its own time', () => {
    const session = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'stopStopwatch', now: at(12) })

    expect(session.stopwatch).toBeNull()
    expect(session.exercises[0]?.sets[0]).toMatchObject({ seconds: '30', done: true })
  })

  it('stops when its set is ticked, with the time measured rather than the one pre-filled', () => {
    // The set holds 30 seconds; the stopwatch counted 12, from 15 s
    const session = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'toggleSet', exercise: 0, set: 0, now: at(27.4) })

    expect(session.stopwatch).toBeNull()
    expect(session.exercises[0]?.sets[0]).toMatchObject({ seconds: '12', done: true, completed_at: at(27.4) })
    expect(session.rest).toEqual({ ends_at: at(87.4), total: 60 })
  })

  it('has no target on an empty set, and records at least a second', () => {
    const started = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 1, now: at(10), countdown: 5 })
    const stopped = run(started, { type: 'stopStopwatch', now: at(15.2) })

    expect(started.stopwatch?.target).toBeNull()
    expect(stopped.exercises[0]?.sets[1]?.seconds).toBe('1')
  })

  it('cancels, leaving the set as it was', () => {
    const before = holdWorkout()
    const session = run(before, { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'cancelStopwatch' })

    expect(session.stopwatch).toBeNull()
    expect(session.exercises[0]?.sets[0]).toEqual(before.exercises[0]?.sets[0])
  })

  it('does not start on a set already done', () => {
    const done = run(holdWorkout(), { type: 'toggleSet', exercise: 0, set: 0, now: at(10) })

    expect(run(done, { type: 'startStopwatch', exercise: 0, set: 0, now: at(20), countdown: 5 }).stopwatch ?? null).toBeNull()
  })

  it('pauses: the time stands still, and the pause is not counted', () => {
    // ▶ at 10 s, counting from 15 s, paused at 30 s: 15 seconds, at 30 as at 60
    const started = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 })
    // Not during the countdown, which counts nothing
    expect(run(started, { type: 'pauseStopwatch', now: at(12) }).stopwatch?.paused_at ?? null).toBeNull()
    const paused = run(started, { type: 'pauseStopwatch', now: at(30) })
    expect(paused.stopwatch?.paused_at).toBe(at(30))
    expect(stopwatchSeconds(paused.stopwatch!, new Date(at(60)))).toBe(15)
    // While paused, the target is not reached: no signal is set
    expect(stopwatchTargetAt(paused.stopwatch!)).toBeNull()
    // A second Pause changes nothing: the seconds between the two would be lost
    expect(run(paused, { type: 'pauseStopwatch', now: at(40) }).stopwatch?.paused_at).toBe(at(30))

    // Resumed at 45 s, after 15 s of pause: the count goes on from 15, and
    // the target, 30 s, moves 15 s later, to 15 + 15 + 30 = 60 s
    const resumed = run(paused, { type: 'resumeStopwatch', now: at(45) })
    expect(resumed.stopwatch).toMatchObject({ paused_at: null, paused_ms: 15_000 })
    expect(stopwatchSeconds(resumed.stopwatch!, new Date(at(50)))).toBe(20)
    expect(stopwatchTargetAt(resumed.stopwatch!)).toBe(Date.parse(at(60)))

    // Stopped at 55 s: 40 seconds since the count began, minus 15 of pause
    const stopped = run(resumed, { type: 'stopStopwatch', now: at(55) })
    expect(stopped.exercises[0]?.sets[0]).toMatchObject({ seconds: '25', done: true })
  })

  it('stops while paused, with the time of the pause', () => {
    const session = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'pauseStopwatch', now: at(27) }, { type: 'stopStopwatch', now: at(90) })

    expect(session.exercises[0]?.sets[0]?.seconds).toBe('12')
  })

  it('reads a stopwatch kept before Pause existed as never paused', () => {
    const old = { set_id: 'set-1', started_at: at(10), target: 30 }

    expect(stopwatchSeconds(old, new Date(at(42)))).toBe(32)
    expect(stopwatchTargetAt(old)).toBe(Date.parse(at(40)))
  })
})

describe('pausing the workout on screen', () => {
  it('stops the clock until Resume, and leaves the pause out of the time trained', () => {
    const paused = run(dayA(), { type: 'pauseWorkout', now: at(600) })

    expect(paused).toMatchObject({ paused_at: at(600), running_since: null })
    expect(elapsedSeconds(paused, new Date(at(900)))).toBe(600)
    // A second ⏸ keeps the first moment
    expect(run(paused, { type: 'pauseWorkout', now: at(700) }).paused_at).toBe(at(600))

    const resumed = run(paused, { type: 'resumeWorkout', now: at(900) })
    expect(resumed).toMatchObject({ paused_at: null, running_since: at(900) })
    expect(elapsedSeconds(resumed, new Date(at(960)))).toBe(660)
  })

  it('stays paused when the screen opens again, unlike a workout left with ✕', () => {
    const paused = run(dayA(), { type: 'pauseWorkout', now: at(600) }, { type: 'pause', now: at(610) })

    // ✕ while paused, then the screen opened again: still paused
    expect(run(paused, { type: 'resume', now: at(1200) })).toMatchObject({ paused_at: at(600), running_since: null })
    // Left with ✕ alone, the clock starts again
    expect(run(dayA(), { type: 'pause', now: at(600) }, { type: 'resume', now: at(1200) }).running_since).toBe(at(1200))
  })

  it('holds the rest, and moves its end by the pause at Resume', () => {
    // A 90 s rest from 100 s, paused at 130 s with 60 s left
    const resting = { ...dayA(), rest: { ends_at: at(190), total: 90 } }
    const paused = run(resting, { type: 'pauseWorkout', now: at(130) })

    expect(restLeft(paused, new Date(at(500)))).toBe(60)

    // Resumed at 530 s: the same 60 s left
    const resumed = run(paused, { type: 'resumeWorkout', now: at(530) })
    expect(resumed.rest?.ends_at).toBe(at(590))
    expect(restLeft(resumed, new Date(at(530)))).toBe(60)
  })

  it('holds a running stopwatch, and Resume takes it up where it was', () => {
    // Counting from 15 s, paused at 25 s with 10 s done
    const started = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 })
    const paused = run(started, { type: 'pauseWorkout', now: at(25) })

    expect(paused.stopwatch).toMatchObject({ paused_at: at(25), held: true })
    expect(stopwatchSeconds(paused.stopwatch!, new Date(at(300)))).toBe(10)
    expect(stopwatchTargetAt(paused.stopwatch!)).toBeNull()

    const resumed = run(paused, { type: 'resumeWorkout', now: at(85) })
    expect(resumed.stopwatch).toMatchObject({ paused_at: null, paused_ms: 60_000, held: false })
    expect(stopwatchSeconds(resumed.stopwatch!, new Date(at(90)))).toBe(15)
  })

  it('holds a countdown, which goes on where it was', () => {
    // ▶ at 10 s, the count to start at 15 s; paused at 12 s with 3 s to go
    const started = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 })
    const paused = run(started, { type: 'pauseWorkout', now: at(12) })

    expect(countdownLeft(paused.stopwatch!, new Date(at(100)))).toBe(3)
    expect(stopwatchSeconds(paused.stopwatch!, new Date(at(100)))).toBe(0)

    // Resumed at 100 s: the count starts 3 s later, nothing counted meanwhile
    const resumed = run(paused, { type: 'resumeWorkout', now: at(100) })
    expect(resumed.stopwatch).toMatchObject({ started_at: at(103), paused_at: null })
    expect(resumed.stopwatch?.paused_ms ?? 0).toBe(0)
  })

  it('leaves a stopwatch paused by its own button paused at Resume', () => {
    const session = run(
      holdWorkout(),
      { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 0 },
      { type: 'pauseStopwatch', now: at(20) },
      { type: 'pauseWorkout', now: at(30) },
      { type: 'resumeWorkout', now: at(40) },
    )

    expect(session.stopwatch).toMatchObject({ paused_at: at(20) })
    expect(session.running_since).toBe(at(40))
  })

  it('ends with a tick, ▶ or the stopwatch\'s own Resume, since that is training', () => {
    const paused = run(holdWorkout(), { type: 'pauseWorkout', now: at(100) })

    expect(run(paused, { type: 'toggleSet', exercise: 0, set: 0, now: at(160) })).toMatchObject({ paused_at: null, running_since: at(160) })
    expect(run(paused, { type: 'startStopwatch', exercise: 0, set: 0, now: at(160), countdown: 5 })).toMatchObject({ paused_at: null, running_since: at(160) })

    const timing = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 0 }, { type: 'pauseWorkout', now: at(20) })
    const resumed = run(timing, { type: 'resumeStopwatch', now: at(50) })
    expect(resumed).toMatchObject({ paused_at: null, running_since: at(50) })
    expect(resumed.stopwatch).toMatchObject({ paused_at: null, paused_ms: 30_000 })
  })

  it('does not end with an untick, or a tick refused', () => {
    const ticked = run(holdWorkout(), { type: 'toggleSet', exercise: 0, set: 0, now: at(50) }, { type: 'pauseWorkout', now: at(100) })

    // Set 2 has no seconds yet, so it cannot be ticked
    expect(run(ticked, { type: 'toggleSet', exercise: 0, set: 1, now: at(160) }).paused_at).toBe(at(100))
    expect(run(ticked, { type: 'toggleSet', exercise: 0, set: 0, now: at(160) }).paused_at).toBe(at(100))
  })

  it('writes the time at the pause when the timed set is stopped while paused', () => {
    const session = run(
      holdWorkout(),
      { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 0 },
      { type: 'pauseWorkout', now: at(22) },
      { type: 'stopStopwatch', now: at(200) },
    )

    expect(session.exercises[0]?.sets[0]).toMatchObject({ seconds: '12', done: true })
    // Stop ticks the set, which ends the pause
    expect(session.paused_at).toBeNull()
  })

  it('finishes from a pause with the time trained before it', () => {
    const session = run(dayA(), { type: 'pauseWorkout', now: at(600) }, { type: 'finish', now: at(900) })

    expect(session).toMatchObject({ paused_at: null, finished_at: at(900), accumulated_seconds: 600 })
  })
})

describe('removing what was added by hand', () => {
  it('removes a set added to a planned exercise, never one of the plan\'s', () => {
    // The bench press: six sets from the plan, and one added at the end
    const added = run(dayA(), { type: 'addSet', exercise: 0 })
    const bench = added.exercises[0]!
    expect(bench.sets).toHaveLength(7)
    expect(canRemoveSet(bench, 6)).toBe(true)
    expect(canRemoveSet(bench, 5)).toBe(false)

    // The plan's set stays; the added one goes
    expect(run(added, { type: 'removeSet', exercise: 0, set: 5 }).exercises[0]?.sets).toHaveLength(7)
    const removed = run(added, { type: 'removeSet', exercise: 0, set: 6 })
    expect(removed.exercises[0]?.sets.map(set => set.id)).toEqual(bench.sets.slice(0, 6).map(set => set.id))
  })

  it('removes the sets of an exercise added by hand, but never its last one', () => {
    const squat = exerciseFrom(testExercise({ id: 40, name: 'Barbell Squat' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })
    const session = run(startFreeSession(START), { type: 'addExercises', exercises: [squat] }, { type: 'addSet', exercise: 0 })

    expect(canRemoveSet(session.exercises[0]!, 0)).toBe(true)
    const one = run(session, { type: 'removeSet', exercise: 0, set: 0 })
    expect(one.exercises[0]?.sets).toHaveLength(1)
    // The only set left: removing the exercise is the way
    expect(canRemoveSet(one.exercises[0]!, 0)).toBe(false)
    expect(run(one, { type: 'removeSet', exercise: 0, set: 0 }).exercises[0]?.sets).toHaveLength(1)
  })

  it('stops the stopwatch running on a set removed', () => {
    const timed = run(holdWorkout(), { type: 'startStopwatch', exercise: 0, set: 1, now: at(10), countdown: 5 }, { type: 'removeSet', exercise: 0, set: 1 })

    expect(timed.stopwatch).toBeNull()
  })

  it('removes an exercise added by hand, never one of the plan\'s, and keeps the screen on a neighbour', () => {
    const squat = exerciseFrom(testExercise({ id: 40, name: 'Barbell Squat' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })
    // Day A's three exercises, the squat added at the end and opened
    const added = run(dayA(), { type: 'addExercises', exercises: [squat] })
    expect(added.current).toBe(3)
    expect(canRemoveExercise(added.exercises[0]!)).toBe(false)
    expect(canRemoveExercise(added.exercises[3]!)).toBe(true)

    // The plan's bench press stays
    expect(run(added, { type: 'removeExercise', exercise: 0 }).exercises).toHaveLength(4)
    // The squat goes; it was the last, so the one before is on screen
    const removed = run(added, { type: 'removeExercise', exercise: 3 })
    expect(removed.exercises.map(item => item.exercise.name)).toEqual(['Barbell Bench Press', 'Bent Over Barbell Row', 'Pullups'])
    expect(removed.current).toBe(2)
  })

  it('leaves a free workout empty when its only exercise is removed', () => {
    const squat = exerciseFrom(testExercise({ id: 40, name: 'Barbell Squat' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })
    const session = run(startFreeSession(START), { type: 'addExercises', exercises: [squat] }, { type: 'removeExercise', exercise: 0 })

    expect(session.exercises).toEqual([])
    expect(session.current).toBe(0)
  })
})

describe('upNext', () => {
  it('names the exercise after this one, after its whole superset', () => {
    // Day A: the bench press, then the rows and the pull-ups in a superset
    const session = dayA()

    expect(upNext(session, 0)).toBe(1)
    // From the rows, not the pull-ups, which are in their superset (Next
    // names those): after it nothing is left, so back to the bench press
    expect(upNext(session, 1)).toBe(0)
  })

  it('passes over exercises done or skipped, and is null when nothing else is left', () => {
    // The rows done, the pull-ups skipped: from the bench press, nothing
    const session = dayA()
    for (const set of session.exercises[1]!.sets) set.done = true
    session.exercises[2]!.skipped = true

    expect(upNext(session, 0)).toBeNull()
  })
})

/**
 * A plan's day with one exercise done as fast as possible: push-ups, one
 * set of 50, for time. Last time, two kinds: 3 × 15 for reps two days ago,
 * 50 in 1:12 a week ago.
 */
function raceDay(): ActiveSession {
  const pushups = testExercise({ id: 50, name: 'Pushups', logging_type: 'reps', photos: [] })
  const plan = testPlan()
  const day = { id: 'day-c', name: 'Day C', items: [{ ...plan.days[0]!.items[0]!, id: 'item-race', exercise_id: 50, exercise: pushups, for_time: true, superset_group: null, rest_seconds: 60, sets: [{ ...plan.days[0]!.items[0]!.sets[2]!, target_reps_min: 50, target_reps_max: 50, target_weight_kg: null }] }] }
  const set = (id: string, reps: number, seconds: number | null) => ({ id, set_type: 'normal' as const, weight_kg: null, reps, duration_seconds: seconds, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' })
  const lastSets: LastSets[] = [
    { exercise_id: 50, session_id: 'session-reps', started_at: '2026-11-07T18:00:00Z', sets: [set('r1', 15, null), set('r2', 15, null), set('r3', 15, null)] },
    { exercise_id: 50, session_id: 'session-race', started_at: '2026-11-02T18:00:00Z', sets: [set('t1', 50, 72)] },
  ]
  return startSession(plan, day, { unit: 'kg', defaultRestSeconds: 90, lastSets, language: 'en', now: START })
}

describe('as fast as possible', () => {
  it('starts with last time done the same way: its time is the one to beat', () => {
    const race = raceDay().exercises[0]!

    expect(isForTime(race)).toBe(true)
    // 50 in 1:12, not 3 × 15
    expect(race.previous?.map(set => set.id)).toEqual(['t1'])
    expect(race.sets[0]).toMatchObject({ reps: '50', seconds: '72' })
  })

  it('needs the seconds to tick a set, and sends them with the reps', () => {
    const start = raceDay()
    const noTime = run(start, { type: 'setField', exercise: 0, set: 0, field: 'seconds', value: '' })
    expect(canComplete(noTime.exercises[0]!.sets[0]!, 'reps', true)).toBe(false)
    expect(canComplete(noTime.exercises[0]!.sets[0]!, 'reps')).toBe(true)

    // The stopwatch, counting from 15 s to 1:35: 80 seconds, past the 72 to
    // beat and kept so (only a hold stops at its target), ticked, the rest
    // started
    const done = run(start, { type: 'startStopwatch', exercise: 0, set: 0, now: at(10), countdown: 5 }, { type: 'stopStopwatch', now: at(95) })
    expect(done.exercises[0]?.sets[0]).toMatchObject({ reps: '50', seconds: '80', done: true })
    expect(done.rest?.total).toBe(60)
    expect(toSessionInput(done, 'kg', new Date(at(120))).exercises[0]?.sets[0]).toMatchObject({ reps: 50, duration_seconds: 80, weight_kg: null })
  })

  it('writes such a set as "50 in 1:12"', () => {
    const values = { weight_kg: null, reps: 50, duration_seconds: 72, distance_meters: null }

    expect(loggedSetText(values, 'reps', 'kg', 'en')).toBe('50 in 1:12')
    expect(loggedSetText(values, 'reps', 'kg', 'es')).toBe('50 en 1:12')
  })

  it('writes a hold past a minute as a clock: "14:30", not "870 s"', () => {
    const hold = { weight_kg: null, reps: null, duration_seconds: 870, distance_meters: null }

    expect(loggedSetText(hold, 'time', 'kg', 'it')).toBe('14:30')
    expect(loggedSetText({ ...hold, duration_seconds: 45 }, 'time', 'kg', 'it')).toBe('45 s')
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

  it('shows a superset on one screen, the others one each', () => {
    // The bench press alone, then the rows (1) and the pull-ups (2) together
    expect(stations(dayA())).toEqual([[0], [1, 2]])
    expect(stations(startFreeSession(START))).toEqual([])
  })

  it('in a superset, rests only at the end of a round, and marks the next set round by round', () => {
    // The rows (1) and the pull-ups (2) are superset 1. The pull-ups' set
    // has no reps planned: one is typed in
    const start = run(dayA(), { type: 'goTo', exercise: 1 })
    expect(nextInRound(start, [1, 2])).toBe(start.exercises[1]!.sets[0]!.id)
    const afterRows = run(start, { type: 'toggleSet', exercise: 1, set: 0, now: at(60) })
    // The round goes on, with the pull-ups: no rest, the screen stays, and
    // the pull-ups' set is next
    expect(afterRows.current).toBe(1)
    expect(afterRows.rest).toBeNull()
    expect(supersetNext(afterRows, 1)).toBe(2)
    expect(nextInRound(afterRows, [1, 2])).toBe(afterRows.exercises[2]!.sets[0]!.id)

    const afterPullups = run(afterRows, { type: 'setField', exercise: 2, set: 0, field: 'reps', value: '10' }, { type: 'toggleSet', exercise: 2, set: 0, now: at(90) })
    // The round is over: rest, and round 2 opens with the rows' second set
    expect(afterPullups.current).toBe(1)
    expect(afterPullups.rest?.total).toBe(90)
    expect(supersetNext(afterPullups, 2)).toBeNull()
    expect(nextInRound(afterPullups, [1, 2])).toBe(afterPullups.exercises[1]!.sets[1]!.id)

    // Every set ticked: nothing marked; nothing outside a superset either
    const done = run(afterPullups, { type: 'toggleSet', exercise: 1, set: 1, now: at(200) })
    expect(nextInRound(done, [1, 2])).toBeNull()
    expect(nextInRound(done, [0])).toBeNull()
  })

  it('in a superset, leaves a skipped exercise out of the rounds', () => {
    const session = run(dayA(), { type: 'skipExercise', exercise: 1, skipped: true })

    expect(nextInRound(session, [1, 2])).toBe(session.exercises[2]!.sets[0]!.id)
  })

  it('in a superset, never points to an exercise with nothing left to do', () => {
    // Round 1 done, then round 2's rows: the pull-ups (one set) are done
    const round2 = run(
      dayA(),
      { type: 'toggleSet', exercise: 1, set: 0, now: at(60) },
      { type: 'setField', exercise: 2, set: 0, field: 'reps', value: '10' },
      { type: 'toggleSet', exercise: 2, set: 0, now: at(90) },
      { type: 'toggleSet', exercise: 1, set: 1, now: at(200) },
    )
    // The round ends at once, with its rest; nowhere left to go in the superset
    expect(round2.rest?.total).toBe(90)
    expect(supersetNext(round2, 1)).toBeNull()
    expect(supersetNext(round2, 2)).toBeNull()

    // One more set of pull-ups: the way on from the rows is the pull-ups,
    // and from the pull-ups nowhere, the rows being done
    const extra = run(round2, { type: 'addSet', exercise: 2 })
    expect(supersetNext(extra, 1)).toBe(2)
    expect(supersetNext(extra, 2)).toBeNull()
    // An exercise on its own has no superset to point to
    expect(supersetNext(extra, 0)).toBeNull()
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

  it('sets a set\'s type', () => {
    const session = run(dayA(), { type: 'setSetType', exercise: 0, set: 2, setType: 'drop' })

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

describe('the exercise\'s menu: swap, skip, note', () => {
  /** Last time's dumbbell press: a warm-up of 12 × 12, then 30 × 10. */
  const lastDumbbell: LastSets = {
    exercise_id: 50,
    session_id: 'session-old',
    started_at: '2026-11-02T18:00:00Z',
    sets: [
      { id: 'old-3', set_type: 'warm_up', weight_kg: '12.000', reps: 12, duration_seconds: null, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' },
      { id: 'old-4', set_type: 'normal', weight_kg: '30.000', reps: 10, duration_seconds: null, distance_meters: null, completed_at: '2026-11-02T18:08:00Z' },
    ],
  }
  /** The exercise swapped in for the bench press. */
  const dumbbell = testExercise({ id: 50, name: 'Dumbbell Bench Press' })
  const options = { unit: 'kg' as const, language: 'en' }

  it('swaps an exercise: same place, sets and types; values from its own last time', () => {
    const session = dayA()
    const bench = session.exercises[0]!
    const swapped = swappedExercise(bench, dumbbell, [lastDumbbell], options)

    expect(swapped).toMatchObject({ id: bench.id, plan_item: bench.plan_item, rest_seconds: 90, previous: lastDumbbell.sets })
    expect(swapped.exercise.name).toBe('Dumbbell Bench Press')
    // Six sets, as before, the two warm-ups kept as warm-ups; the first two
    // from last time, the others with the plan's reps but not its 80 kg,
    // which were meant for the barbell
    expect(swapped.sets.map(set => [set.set_type, set.weight, set.reps])).toEqual([
      ['warm_up', '12', '12'],
      ['warm_up', '30', '10'],
      ['normal', '', '8'],
      ['normal', '', '8'],
      ['normal', '', '8'],
      ['normal', '', '8'],
    ])
    expect(swapped.sets[1]?.last?.reps).toBe(10)

    const next = run(session, { type: 'swapExercise', exercise: 0, replacement: swapped })
    expect(next.exercises.map(item => item.exercise.name)).toEqual(['Dumbbell Bench Press', 'Bent Over Barbell Row', 'Pullups'])
  })

  it('does not swap an exercise once one of its sets is ticked', () => {
    const ticked = run(dayA(), { type: 'toggleSet', exercise: 0, set: 0, now: at(60) })
    const swapped = swappedExercise(ticked.exercises[0]!, dumbbell, [], options)

    expect(run(ticked, { type: 'swapExercise', exercise: 0, replacement: swapped }).exercises[0]?.exercise.name).toBe('Barbell Bench Press')
  })

  it('skips an exercise: the next opens, and its sets are no longer work left', () => {
    const start = dayA()
    const skipped = run(start, { type: 'skipExercise', exercise: 0, skipped: true })

    expect(skipped.current).toBe(1)
    expect(hasWorkLeft(skipped.exercises[0]!)).toBe(false)
    // The bench press's four sets that count leave the total
    expect(countSets(skipped).total).toBe(countSets(start).total - 4)
    expect(allSetsDone(skipped)).toBe(false)
    // The rows skipped: the pull-ups, on the same screen, still have a set,
    // so the screen stays
    const rowsSkipped = run(skipped, { type: 'skipExercise', exercise: 1, skipped: true })
    expect(rowsSkipped.current).toBe(1)
    // Every exercise skipped: nothing left, time to finish; the last screen
    // has no next to open
    const all = run(rowsSkipped, { type: 'skipExercise', exercise: 2, skipped: true })
    expect(allSetsDone(all)).toBe(true)
    expect(all.current).toBe(1)
  })

  it('takes a skip back when asked, or when one of its sets is ticked', () => {
    const skipped = run(dayA(), { type: 'skipExercise', exercise: 0, skipped: true })

    expect(run(skipped, { type: 'skipExercise', exercise: 0, skipped: false }).exercises[0]?.skipped).toBe(false)
    expect(run(skipped, { type: 'toggleSet', exercise: 0, set: 0, now: at(60) }).exercises[0]?.skipped).toBe(false)
  })

  it('in a superset, a skipped exercise ends the round', () => {
    // The pull-ups (2) skipped: after a set of rows (1) the round is over,
    // with its rest, and Next points nowhere in the superset
    const session = run(dayA(), { type: 'skipExercise', exercise: 2, skipped: true }, { type: 'toggleSet', exercise: 1, set: 0, now: at(60) })

    expect(session.rest?.total).toBe(90)
    expect(supersetNext(session, 1)).toBeNull()
  })

  it('sends the note without spaces around it, and an empty one as none', () => {
    const session = run(dayA(), { type: 'setNote', exercise: 0, notes: '  Seat on 4 ' }, { type: 'setNote', exercise: 1, notes: '   ' })
    const input = toSessionInput(session, 'kg', new Date(at(600)))

    expect(input.exercises.map(item => item.notes)).toEqual(['Seat on 4', null, null])
  })
})
