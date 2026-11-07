/*
 * The workout in progress (docs/design/D1-ui.md D1.4.9): its shape, how it
 * starts from a day of a plan, everything that happens to it (a set ticked,
 * the rest timer, a pause), and the body sent to the backend at the end.
 * Plain functions with no React, tested on their own (workout-session.test.ts),
 * like the plan editor's draft (src/components/plans/plan-draft.ts).
 *
 * The screen holds the session with useReducer and workoutReducer below,
 * and keeps it in the browser after every change
 * (session-storage.ts; docs/concepts/C1-frontend.md C1.17).
 *
 * Every moment is ISO 8601 text, which survives JSON in localStorage, and
 * is compared through Date.parse(). The functions that need "now" take it as
 * a parameter, so the tests can choose it.
 */
import type { Exercise, LoggingType } from '@/api/exercises'
import type { Plan, PlanDay, PlanItem, PlanSet, SetType } from '@/api/plans'
import type { LastSets, LoggedSet, SessionInput } from '@/api/sessions'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { newId, parseDecimal, parseWhole, toKilograms } from '@/components/plans/plan-draft'
import { weightIn } from '@/components/plans/plan-format'

/** The order a tap on a set's number goes through, as in the plan editor (D1.4.8). */
const SET_TYPES: readonly SetType[] = ['normal', 'warm_up', 'drop', 'failure']

/** One set of the workout: planned, or added; done or not yet. */
export interface WorkoutSet {
  /** A UUID made here; the backend keeps it. */
  id: string
  /** Its type; a tap on its number changes it. */
  set_type: SetType
  /** The weight as typed, in the user's unit, "82,5" or "82.5". */
  weight: string
  /** The reps as typed. */
  reps: string
  /** The seconds, for a timed exercise. */
  seconds: string
  /** The meters, for a distance exercise. */
  meters: string
  /** Whether it was ticked ✓. Only ticked sets are sent. */
  done: boolean
  /** The moment of the tick; null while not done. */
  completed_at: string | null
  /** What the set in the same place did last time; null when there was none. */
  last: LoggedSet | null
}

/** One exercise of the workout. */
export interface WorkoutExercise {
  /** A UUID made here. */
  id: string
  /** The exercise, as the library sends it: its name, photo and logging type. */
  exercise: Exercise
  /** The plan's item it comes from, kept to show what was planned. */
  plan_item: PlanItem | null
  /** Copied from the plan: items with the same number are done in turn. */
  superset_group: number | null
  /** The rest after a set, in seconds: the item's, or the user's default. */
  rest_seconds: number
  /** Its sets, in order. */
  sets: WorkoutSet[]
}

/** The rest timer, while it runs. */
export interface Rest {
  /** When it ends, as ISO 8601 text. */
  ends_at: string
  /** How long it was meant to last, in seconds, for the bar. */
  total: number
}

/** The whole workout in progress. */
export interface ActiveSession {
  /** A UUID made here when Start was tapped; the backend keeps it. */
  id: string
  /** The plan followed. */
  plan_id: string | null
  /** The day followed. */
  plan_day_id: string | null
  /** The plan's name at the start, kept by history whatever happens to the plan. */
  plan_name: string | null
  /** The day's name at the start. */
  day_name: string | null
  /** When Start was tapped. */
  started_at: string
  /** Seconds trained before the last pause. */
  accumulated_seconds: number
  /** Since when it has been running; null while paused. */
  running_since: string | null
  /** When Done was tapped; null until then. */
  finished_at: string | null
  /** The index of the exercise on screen. */
  current: number
  /** The rest timer; null when not resting. */
  rest: Rest | null
  /** The exercises, in order. */
  exercises: WorkoutExercise[]
}

// --- Starting -------------------------------------------------------------------

/** What starting a workout needs besides the day. */
export interface StartOptions {
  /** The user's weight unit, for the values filled in. */
  unit: WeightUnit
  /** The user's rest when an item sets none, in seconds. */
  defaultRestSeconds: number
  /** The sets of last time, from GET /api/sessions/last-sets; empty when offline. */
  lastSets: LastSets[]
  /** The interface's language, for the decimal separator. */
  language: string
  /** The moment of the start. */
  now: Date
}

/**
 * A number for a field, in the user's language, without thousands
 * separators: 82.5 → "82,5" in Italian.
 * @param value the number
 * @param language a language code
 */
function field(value: number, language: string): string {
  return formatNumber(value, language, { useGrouping: false, maximumFractionDigits: 2 })
}

/**
 * A set of the workout, from a planned set and what was done in its place
 * last time. The fields are filled with last time's values when there are
 * some, the plan's targets otherwise (D1.4.9), so that a set done as last
 * time is one tap.
 * @param planned the planned set; null for a set added with no plan
 * @param last last time's set in the same place, or null
 * @param options the unit and the language
 */
function setFrom(planned: PlanSet | null, last: LoggedSet | null, options: Pick<StartOptions, 'unit' | 'language'>): WorkoutSet {
  // The two options this function uses, taken out of the object
  const { unit, language } = options
  // The first value that exists, as text; '' when none
  const text = (...values: (number | null | undefined)[]) => {
    const value = values.find(candidate => candidate !== null && candidate !== undefined)
    return value === undefined || value === null ? '' : field(value, language)
  }
  // Last time's weight and the planned one, in the user's unit; null when none
  const lastWeight = last?.weight_kg === null || last?.weight_kg === undefined ? null : weightIn(Number(last.weight_kg), unit)
  const plannedWeight = planned?.target_weight_kg ? weightIn(Number(planned.target_weight_kg), unit) : null
  return {
    id: newId(),
    set_type: planned?.set_type ?? 'normal',
    weight: text(lastWeight, plannedWeight),
    reps: text(last?.reps, planned?.target_reps_min),
    seconds: text(last?.duration_seconds, planned?.target_duration_seconds),
    meters: text(last?.distance_meters, planned?.target_distance_meters),
    done: false,
    completed_at: null,
    last,
  }
}

/**
 * Starts a workout of a plan's day: every item becomes an exercise of the
 * workout, every planned set a set to do, and the clock starts.
 * @param plan the plan, as GET /api/plans/{id} sends it
 * @param day the day chosen
 * @param options unit, default rest, last time, language, now
 */
export function startSession(plan: Plan, day: PlanDay, options: StartOptions): ActiveSession {
  // The start, as ISO 8601 text: the clock runs from here
  const now = options.now.toISOString()
  return {
    id: newId(),
    plan_id: plan.id,
    plan_day_id: day.id,
    plan_name: plan.name,
    day_name: day.name,
    started_at: now,
    accumulated_seconds: 0,
    running_since: now,
    finished_at: null,
    current: 0,
    rest: null,
    exercises: day.items.map((item) => {
      // Last time's sets of this exercise, if it was done before
      const last = options.lastSets.find(entry => entry.exercise_id === item.exercise_id)?.sets ?? []
      // A planned item without sets still gets one row to tick
      const planned: (PlanSet | null)[] = item.sets.length > 0 ? item.sets : [null]
      return {
        id: newId(),
        exercise: item.exercise,
        plan_item: item,
        superset_group: item.superset_group,
        rest_seconds: item.rest_seconds ?? options.defaultRestSeconds,
        sets: planned.map((set, index) => setFrom(set, last[index] ?? null, options)),
      }
    }),
  }
}

// --- Reading it -----------------------------------------------------------------

/**
 * The seconds trained so far: those before the last pause, plus those since
 * it started running again.
 * @param session the workout
 * @param now the current moment
 */
export function elapsedSeconds(session: ActiveSession, now: Date): number {
  // Milliseconds since the clock last started; 0 while paused
  const running = session.running_since === null ? 0 : Math.max(0, now.getTime() - Date.parse(session.running_since))
  // Math.floor: whole seconds, rounded down
  return session.accumulated_seconds + Math.floor(running / 1000)
}

/**
 * The seconds of rest left, 0 when it is over or not running, and never more
 * than the rest's length: the screen's `now` is refreshed once a second, so
 * just after ✓ it is a moment older than the tap, and would show 1:31 for a
 * rest of 1:30 (docs/how-to/H3-frontend.md H3.15.5).
 * @param session the workout
 * @param now the current moment
 */
export function restLeft(session: ActiveSession, now: Date): number {
  if (session.rest === null) return 0
  // Seconds to the end, rounded up: 0.2 s left still shows 0:01
  const left = Math.ceil((Date.parse(session.rest.ends_at) - now.getTime()) / 1000)
  return Math.min(session.rest.total, Math.max(0, left))
}

/**
 * Whether a set can be ticked: the values the exercise is logged with are
 * there and read as numbers (the backend refuses anything else, C2.5.7).
 * The weight may be left empty: on a weighted exercise, a set done with the
 * body alone; on a bodyweight one (pull-ups), no added weight. When typed,
 * it must read.
 * @param set the set
 * @param loggingType how its exercise is logged
 */
export function canComplete(set: WorkoutSet, loggingType: LoggingType): boolean {
  // A value that reads as a number, not empty
  const isNumber = (value: number | null) => value !== null && !Number.isNaN(value)
  // The weight: empty, or a number
  const weightOk = set.weight.trim() === '' || isNumber(parseDecimal(set.weight))
  switch (loggingType) {
    case 'weight_reps':
    case 'reps': return weightOk && isNumber(parseWhole(set.reps))
    case 'time': return isNumber(parseWhole(set.seconds))
    case 'distance': return isNumber(parseWhole(set.meters))
  }
}

/**
 * The indexes of the exercises of the superset an exercise is in, in order;
 * just its own index when it is not in one.
 * @param session the workout
 * @param index the exercise's index
 */
export function supersetOf(session: ActiveSession, index: number): number[] {
  // The superset's number, or null
  const group = session.exercises[index]?.superset_group ?? null
  if (group === null) return [index]
  // Neighbours with the same number: walk back to the first, then forward
  // The index of the superset's first exercise
  let first = index
  while (first > 0 && session.exercises[first - 1]?.superset_group === group) first--
  // The indexes, from the first while the number stays the same
  const indexes: number[] = []
  for (let i = first; session.exercises[i]?.superset_group === group; i++) indexes.push(i)
  return indexes
}

/** How a set is called on screen. */
export interface SetNumber {
  /** True for a warm-up, counted apart from the others. */
  warmUp: boolean
  /** Its number among the warm-ups, or among the other sets, from 1. */
  number: number
}

/**
 * The numbers of an exercise's sets, as D1.4.9 draws them: warm-ups are
 * counted apart, so the sets that count are 1, 2, 3 whatever warm-ups come
 * first ("W W 1 2 3", not "W W 3 4 5"). Drop and failure sets are numbered
 * with the normal ones: they count for volume.
 * @param sets the exercise's sets, in order
 */
export function setNumbers(sets: readonly { set_type: SetType }[]): SetNumber[] {
  // How many of each kind so far
  let warmUps = 0
  let others = 0
  return sets.map(set => set.set_type === 'warm_up'
    ? { warmUp: true, number: ++warmUps }
    : { warmUp: false, number: ++others })
}

// --- What happens to it -------------------------------------------------------------

/** A field of a set that the user types in. */
export type SetField = 'weight' | 'reps' | 'seconds' | 'meters'

/**
 * Everything the screen can do to the workout; `exercise` and `set` are
 * indexes, `now` the moment of the action as ISO 8601 text.
 */
export type WorkoutAction
  = | { type: 'toggleSet', exercise: number, set: number, now: string }
    | { type: 'setField', exercise: number, set: number, field: SetField, value: string }
    | { type: 'cycleSetType', exercise: number, set: number }
    | { type: 'addSet', exercise: number }
    | { type: 'goTo', exercise: number }
    | { type: 'adjustRest', seconds: number }
    | { type: 'endRest' }
    | { type: 'pause', now: string }
    | { type: 'resume', now: string }
    | { type: 'finish', now: string }

/**
 * Stops the clock: the time since it last started is added to the time
 * trained. Changes the session in place: the reducer calls it on its copy.
 * @param session the copy
 * @param now the moment, ISO 8601
 */
function stopClock(session: ActiveSession, now: string): void {
  if (session.running_since === null) return
  session.accumulated_seconds = elapsedSeconds(session, new Date(now))
  session.running_since = null
}

/**
 * The workout's reducer: the next workout, given the workout and an action.
 * Like the plan editor's (plan-draft.ts), it copies first with
 * structuredClone() and changes the copy, so React sees a new object.
 *
 * The one rule with some thought in it is ticking a set:
 * - **On its own**, the exercise stays on screen and the rest timer starts,
 *   with the exercise's rest;
 * - **in a superset**, the screen moves to the next exercise of the
 *   superset with no rest; after the last one, the rest starts and the
 *   screen goes back to the first, for the next round (D1.4.9).
 * A rest of 0 seconds starts no timer.
 *
 * @param session the current workout
 * @param action what happened
 * @returns the next workout
 */
export function workoutReducer(session: ActiveSession, action: WorkoutAction): ActiveSession {
  // The copy that is changed and returned
  const next = structuredClone(session)
  // The set the action is about, when it has one
  const exercise = 'exercise' in action ? next.exercises[action.exercise] : undefined
  const set = 'set' in action ? exercise?.sets[action.set] : undefined

  switch (action.type) {
    case 'toggleSet': {
      if (!exercise || !set) break
      if (set.done) {
        // Unticking: the set is to do again; the timer is left alone
        set.done = false
        set.completed_at = null
        break
      }
      if (!canComplete(set, exercise.exercise.logging_type)) break
      set.done = true
      set.completed_at = action.now
      // The exercises of its superset (just itself when alone), and its place among them
      const group = supersetOf(next, action.exercise)
      const place = group.indexOf(action.exercise)
      if (place < group.length - 1) {
        // In a superset, not its last exercise: on to the next one
        next.current = group[place + 1] ?? action.exercise
        next.rest = null
      }
      else {
        // On its own, or the superset's last: rest, then (superset) back to its first
        next.current = group[0] ?? action.exercise
        next.rest = exercise.rest_seconds > 0
          ? { ends_at: new Date(Date.parse(action.now) + exercise.rest_seconds * 1000).toISOString(), total: exercise.rest_seconds }
          : null
      }
      break
    }
    case 'setField':
      if (set) set[action.field] = action.value
      break
    case 'cycleSetType':
      if (set) set.set_type = SET_TYPES[(SET_TYPES.indexOf(set.set_type) + 1) % SET_TYPES.length] ?? 'normal'
      break
    case 'addSet': {
      if (!exercise) break
      // A copy of the last set's values, to do again
      const last = exercise.sets.at(-1)
      exercise.sets.push({
        id: newId(),
        set_type: last?.set_type === 'warm_up' ? 'normal' : (last?.set_type ?? 'normal'),
        weight: last?.weight ?? '',
        reps: last?.reps ?? '',
        seconds: last?.seconds ?? '',
        meters: last?.meters ?? '',
        done: false,
        completed_at: null,
        last: null,
      })
      break
    }
    case 'goTo':
      if (action.exercise >= 0 && action.exercise < next.exercises.length) next.current = action.exercise
      break
    case 'adjustRest':
      if (next.rest) {
        // ±15 seconds: the end moves, and the total with it. An end moved
        // into the past simply reads as 0 seconds left, and the screen ends it
        next.rest.ends_at = new Date(Date.parse(next.rest.ends_at) + action.seconds * 1000).toISOString()
        next.rest.total = Math.max(0, next.rest.total + action.seconds)
      }
      break
    case 'endRest':
      next.rest = null
      break
    case 'pause':
      stopClock(next, action.now)
      break
    case 'resume':
      if (next.running_since === null && next.finished_at === null) next.running_since = action.now
      break
    case 'finish':
      stopClock(next, action.now)
      next.finished_at = action.now
      next.rest = null
      break
  }
  return next
}

// --- Sending it -----------------------------------------------------------------------

/**
 * The body of PUT /api/sessions/{id} (C2.5.7): every exercise, the ticked
 * sets only, the values that fit how each exercise is logged, weights in
 * kilograms. The weight goes with weight_reps and reps (the added weight),
 * null when empty. An exercise with no set ticked is sent with none: skipped.
 * @param session the workout
 * @param unit the user's weight unit
 * @param now the current moment, for the time trained
 */
export function toSessionInput(session: ActiveSession, unit: WeightUnit, now: Date): SessionInput {
  return {
    plan_id: session.plan_id,
    plan_day_id: session.plan_day_id,
    plan_name: session.plan_name,
    day_name: session.day_name,
    started_at: session.started_at,
    finished_at: session.finished_at,
    duration_seconds: elapsedSeconds(session, now),
    feeling: null,
    notes: null,
    exercises: session.exercises.map(item => ({
      id: item.id,
      exercise_id: item.exercise.id,
      plan_item_id: item.plan_item?.id ?? null,
      superset_group: item.superset_group,
      notes: null,
      sets: item.sets.filter(set => set.done).map((set) => {
        // How the exercise is logged, which decides the values sent
        const type = item.exercise.logging_type
        // Whether it counts reps, with a weight that may be empty
        const byReps = type === 'weight_reps' || type === 'reps'
        // The weight typed, as a number in the user's unit; null when empty
        const weight = parseDecimal(set.weight)
        return {
          id: set.id,
          set_type: set.set_type,
          weight_kg: byReps && weight !== null ? toKilograms(weight, unit) : null,
          reps: byReps ? parseWhole(set.reps) : null,
          duration_seconds: type === 'time' ? parseWhole(set.seconds) : null,
          distance_meters: type === 'distance' ? parseWhole(set.meters) : null,
          completed_at: set.completed_at ?? session.started_at,
        }
      }),
    })),
  }
}

/** The sets of a workout that count, warm-ups excluded: done, and in all. */
export interface SetCount {
  /** Ticked so far. */
  done: number
  /** In the whole workout. */
  total: number
}

/**
 * How many sets were ticked and how many there are, warm-ups excluded, for
 * the Finish dialog: finishing early says how many will not be saved.
 * @param session the workout
 */
export function countSets(session: ActiveSession): SetCount {
  // Every set of every exercise, warm-ups left out
  const counted = session.exercises.flatMap(item => item.sets).filter(set => set.set_type !== 'warm_up')
  return { done: counted.filter(set => set.done).length, total: counted.length }
}

/**
 * Whether every set of the workout, warm-ups included, is ticked: the
 * screen then offers to finish.
 * @param session the workout
 */
export function allSetsDone(session: ActiveSession): boolean {
  return session.exercises.every(item => item.sets.every(set => set.done))
}
