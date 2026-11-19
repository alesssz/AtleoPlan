/*
 * The workout in progress and its reducer, from the start (a plan's day or a
 * free workout) to the body sent at Finish. Moments are ISO 8601 strings,
 * which survive localStorage; functions that need "now" take it as a
 * parameter, so tests can choose it.
 */
import type { Exercise, LoggingType } from '@/api/exercises'
import type { Plan, PlanDay, PlanItem, PlanSet, SetType } from '@/api/plans'
import type { LastSets, LoggedSet, SessionInput } from '@/api/sessions'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { hasTimedSets } from '@/components/history/compare'
import { canBeForTime, newId, parseDecimal, parseWhole, toKilograms } from '@/components/plans/plan-draft'
import { weightIn } from '@/components/plans/plan-format'

/** One set of the workout: planned, or added; done or not yet. */
export interface WorkoutSet {
  /** A UUID made on the device; the backend keeps it. */
  id: string
  set_type: SetType
  /** The weight as typed, in the user's unit, "82,5" or "82.5". */
  weight: string
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
  /** A UUID made on the device. */
  id: string
  exercise: Exercise
  /** The plan's item it comes from, kept to show what was planned. */
  plan_item: PlanItem | null
  /** Copied from the plan: items with the same number are done in turn. */
  superset_group: number | null
  /** The rest after a set, in seconds: the item's, or the user's default. */
  rest_seconds: number
  sets: WorkoutSet[]
  /**
   * All of last time's sets of this exercise (each set's `last` holds only its
   * own place), so the summary's comparison works offline. Empty when never
   * done or offline; may be missing from a workout already stored.
   */
  previous?: LoggedSet[]
  /**
   * The user's note from the exercise's menu, sent as the exercise's `notes`.
   * May be missing from a workout already stored, which reads as no note.
   */
  notes?: string
  /**
   * Set by Skip in the exercise's menu: its unticked sets no longer count as
   * work left (Next, Finish, the count of sets). Ticking one of its sets
   * undoes the skip. Missing reads as false.
   */
  skipped?: boolean
}

/** The rest timer, while it runs. */
export interface Rest {
  /** When it ends, as ISO 8601 text. */
  ends_at: string
  /** How long it was meant to last, in seconds, for the bar. */
  total: number
}

/**
 * The stopwatch of a timed set. Like the rest, stored as moments rather than a
 * counter, so it keeps running with the screen off or the app closed. The set
 * is named by id, stable when exercises or sets are added.
 *
 * A pause stores its moment; Resume adds its length to `paused_ms`, so the
 * time is "start to now (or to the pause), minus the pauses". Both fields may
 * be missing from a stopwatch already stored, which reads as never paused.
 */
export interface Stopwatch {
  set_id: string
  started_at: string
  /** The seconds to reach, from the set's field at the start; null when empty. */
  target: number | null
  /** When it was paused, as ISO 8601 text; null or missing while it runs. */
  paused_at?: string | null
  /** The milliseconds spent paused before the current pause, if any; missing reads as 0. */
  paused_ms?: number
}

/** The whole workout in progress. */
export interface ActiveSession {
  /** A UUID made on the device when Start is tapped; the backend keeps it. */
  id: string
  plan_id: string | null
  plan_day_id: string | null
  /** The plan's name at the start, kept by history whatever happens to the plan. */
  plan_name: string | null
  /** The day's name at the start. */
  day_name: string | null
  started_at: string
  /** Seconds trained before the last pause. */
  accumulated_seconds: number
  /** Since when it has been running; null while paused. */
  running_since: string | null
  /** When the workout was finished; null until then. */
  finished_at: string | null
  /** The index of the exercise on screen. */
  current: number
  /** The rest timer; null when not resting. */
  rest: Rest | null
  /**
   * The stopwatch of a timed set; null when none runs. May be missing from a
   * workout already stored.
   */
  stopwatch?: Stopwatch | null
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
  now: Date
}

/**
 * A number for a field, in the user's language, without thousands
 * separators: 82.5 → "82,5" in Italian.
 */
function field(value: number, language: string): string {
  return formatNumber(value, language, { useGrouping: false, maximumFractionDigits: 2 })
}

/**
 * A set of the workout, from a planned set and what was done in its place last
 * time. The fields hold last time's values when there are some, the plan's
 * targets otherwise, so that a set done as last time is one tap.
 * @param planned null for a set added with no plan
 */
function setFrom(planned: PlanSet | null, last: LoggedSet | null, options: Pick<StartOptions, 'unit' | 'language'>): WorkoutSet {
  const { unit, language } = options
  const text = (...values: (number | null | undefined)[]) => {
    const value = values.find(candidate => candidate !== null && candidate !== undefined)
    return value === undefined || value === null ? '' : field(value, language)
  }
  const lastWeight = last?.weight_kg === null || last?.weight_kg === undefined ? null : weightIn(Number(last.weight_kg), unit)
  const plannedWeight = planned?.target_weight_kg ? weightIn(Number(planned.target_weight_kg), unit) : null
  return {
    id: newId(),
    // The plan's type; with no plan, last time's (a warm-up stays one)
    set_type: planned?.set_type ?? last?.set_type ?? 'normal',
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
 * Whether an exercise of the workout is done as fast as possible: its plan item
 * says so (`for_time`) and it counts reps. Its sets then have the reps and the
 * seconds, and ▶ the stopwatch.
 */
export function isForTime(item: Pick<WorkoutExercise, 'plan_item' | 'exercise'>): boolean {
  return item.plan_item?.for_time === true && canBeForTime(item.exercise.logging_type)
}

/**
 * Last time's sets of an exercise, of the kind it is done now: timed (logged
 * by time, or done as fast as possible) or not. The API returns the last time
 * of each kind, since 3 × 15 is no time to beat. Empty when never done that
 * way, or offline.
 */
function lastOfKind(lastSets: readonly LastSets[], exerciseId: number, timed: boolean): LoggedSet[] {
  return lastSets.find(entry => entry.exercise_id === exerciseId && hasTimedSets(entry.sets) === timed)?.sets ?? []
}

/**
 * Starts a workout of a plan's day: every item becomes an exercise, every
 * planned set a set to do, and the clock starts.
 */
export function startSession(plan: Plan, day: PlanDay, options: StartOptions): ActiveSession {
  return {
    ...emptySession(options.now),
    plan_id: plan.id,
    plan_day_id: day.id,
    plan_name: plan.name,
    day_name: day.name,
    exercises: day.items.map((item) => {
      const last = lastOfKind(options.lastSets, item.exercise_id, item.exercise.logging_type === 'time' || isForTime({ plan_item: item, exercise: item.exercise }))
      // A planned item without sets still gets one row to tick
      const planned: (PlanSet | null)[] = item.sets.length > 0 ? item.sets : [null]
      return {
        id: newId(),
        exercise: item.exercise,
        plan_item: item,
        superset_group: item.superset_group,
        rest_seconds: item.rest_seconds ?? options.defaultRestSeconds,
        sets: planned.map((set, index) => setFrom(set, last[index] ?? null, options)),
        previous: last,
      }
    }),
  }
}

/**
 * A free workout: no plan, no exercises yet, the clock running. No day name:
 * the screen and history show "Free workout" in the user's language.
 */
export function startFreeSession(now: Date): ActiveSession {
  return emptySession(now)
}

function emptySession(now: Date): ActiveSession {
  const start = now.toISOString()
  return {
    id: newId(),
    plan_id: null,
    plan_day_id: null,
    plan_name: null,
    day_name: null,
    started_at: start,
    accumulated_seconds: 0,
    running_since: start,
    finished_at: null,
    current: 0,
    rest: null,
    stopwatch: null,
    exercises: [],
  }
}

/**
 * An exercise added during the workout: its sets come from last time, one per
 * set done then, or one empty set when never done. Rest: the user's default.
 * Built outside the reducer because newId() is not pure.
 */
export function exerciseFrom(exercise: Exercise, lastSets: LastSets[], options: Pick<StartOptions, 'unit' | 'language' | 'defaultRestSeconds'>): WorkoutExercise {
  // Not for time: no plan item says so
  const last = lastOfKind(lastSets, exercise.id, exercise.logging_type === 'time')
  return {
    id: newId(),
    exercise,
    plan_item: null,
    superset_group: null,
    rest_seconds: options.defaultRestSeconds,
    sets: (last.length > 0 ? last : [null]).map(set => setFrom(null, set, options)),
    previous: last,
  }
}

/**
 * Swap, from the exercise's menu: the new exercise keeps the place, the
 * number and types of sets, the plan item, superset and rest; values and
 * "Last" come from its own last time.
 *
 * With no last time, the plan's targets fill reps, seconds and meters but not
 * the weight: 80 kg planned for one exercise mean nothing for another. The
 * reducer allows a swap only before any set is ticked: a ticked set belongs
 * to the exercise it was done with. Built outside the reducer because newId()
 * is not pure.
 */
export function swappedExercise(current: WorkoutExercise, exercise: Exercise, lastSets: LastSets[], options: Pick<StartOptions, 'unit' | 'language'>): WorkoutExercise {
  // The new exercise's sets of last time, of the kind the plan item asks
  // for; empty when never done
  const last = lastOfKind(lastSets, exercise.id, exercise.logging_type === 'time' || isForTime({ plan_item: current.plan_item, exercise }))
  return {
    ...current,
    exercise,
    // A note was about the old exercise; a skip too
    notes: undefined,
    skipped: undefined,
    sets: current.sets.map((set, index) => {
      // The plan's set in this place, without its weight
      const planned = current.plan_item?.sets[index]
      const target = planned ? { ...planned, target_weight_kg: null } : null
      // Keeps the type the set has now, which the user may have changed
      return { ...setFrom(target, last[index] ?? null, options), set_type: set.set_type }
    }),
    previous: last,
  }
}

// --- Reading it -----------------------------------------------------------------

/**
 * The seconds trained so far: those before the last pause, plus those since
 * it started running again.
 */
export function elapsedSeconds(session: ActiveSession, now: Date): number {
  const running = session.running_since === null ? 0 : Math.max(0, now.getTime() - Date.parse(session.running_since))
  return session.accumulated_seconds + Math.floor(running / 1000)
}

/**
 * The seconds of rest left, 0 when it is over or not running, and never more
 * than the rest's length: the screen's `now` is refreshed once a second, so
 * just after ✓ it is a moment older than the tap, and would show 1:31 for a
 * rest of 1:30.
 */
export function restLeft(session: ActiveSession, now: Date): number {
  if (session.rest === null) return 0
  // Rounded up: 0.2 s left still shows 0:01
  const left = Math.ceil((Date.parse(session.rest.ends_at) - now.getTime()) / 1000)
  return Math.min(session.rest.total, Math.max(0, left))
}

/**
 * The seconds a stopwatch has run, whole, never below 0, the pauses left
 * out: from the start to now, or to the pause while it is paused, minus the
 * pauses before.
 */
export function stopwatchSeconds(stopwatch: Stopwatch, now: Date): number {
  const end = stopwatch.paused_at ? Date.parse(stopwatch.paused_at) : now.getTime()
  // paused_ms may be missing from a stopwatch already stored
  return Math.max(0, Math.floor((end - Date.parse(stopwatch.started_at) - (stopwatch.paused_ms ?? 0)) / 1000))
}

/**
 * The moment a running stopwatch reaches its target, in epoch milliseconds;
 * null with no target or while paused. Used to schedule the signal.
 */
export function stopwatchTargetAt(stopwatch: Stopwatch): number | null {
  if (stopwatch.target === null || stopwatch.paused_at) return null
  return Date.parse(stopwatch.started_at) + (stopwatch.paused_ms ?? 0) + stopwatch.target * 1000
}

/**
 * Where a set is, by its id: its exercise's index and its own; null when
 * it is no longer in the workout (its exercise swapped away).
 */
export function findSet(session: ActiveSession, setId: string): { exercise: number, set: number } | null {
  for (const [exercise, item] of session.exercises.entries()) {
    const set = item.sets.findIndex(candidate => candidate.id === setId)
    if (set !== -1) return { exercise, set }
  }
  return null
}

/**
 * Whether a set can be ticked: the values the exercise is logged with are there
 * and read as numbers (the backend refuses anything else). The weight may be
 * left empty: on a weighted exercise, a set done with the body alone; on a
 * bodyweight one (pull-ups), no added weight. When typed, it must read. Done as
 * fast as possible, the seconds are needed too.
 */
export function canComplete(set: WorkoutSet, loggingType: LoggingType, forTime = false): boolean {
  const isNumber = (value: number | null) => value !== null && !Number.isNaN(value)
  const weightOk = set.weight.trim() === '' || isNumber(parseDecimal(set.weight))
  switch (loggingType) {
    case 'weight_reps':
    case 'reps': return weightOk && isNumber(parseWhole(set.reps)) && (!forTime || isNumber(parseWhole(set.seconds)))
    case 'time': return isNumber(parseWhole(set.seconds))
    case 'distance': return isNumber(parseWhole(set.meters))
  }
}

/** Whether an exercise still has work: a set not ticked, and not skipped. */
export function hasWorkLeft(item: WorkoutExercise): boolean {
  return !item.skipped && item.sets.some(set => !set.done)
}

/**
 * Only an exercise added during the workout, which has no plan item, can be
 * removed. The plan's exercises can be skipped, not removed, so the plan's
 * day stays whole. Derived from the exercise rather than a stored flag, so
 * workouts already stored work the same.
 */
export function canRemoveExercise(item: WorkoutExercise): boolean {
  return item.plan_item === null
}

/**
 * Only a set added during the workout can be removed. The plan's sets come
 * first, as many as the plan item has (startSession makes one per planned
 * set, Swap keeps the count), and Add set appends, so any set after them was
 * added. Never the only set left: an empty exercise is removed from its menu.
 */
export function canRemoveSet(item: WorkoutExercise, index: number): boolean {
  const planned = item.plan_item?.sets.length ?? 0
  return index >= planned && index < item.sets.length && item.sets.length > 1
}

/**
 * The indexes of the exercises of the superset an exercise is in, in order;
 * just its own index when it is not in one.
 */
export function supersetOf(session: ActiveSession, index: number): number[] {
  const group = session.exercises[index]?.superset_group ?? null
  if (group === null) return [index]
  // Neighbours with the same number: back to the first, then forward
  let first = index
  while (first > 0 && session.exercises[first - 1]?.superset_group === group) first--
  const indexes: number[] = []
  for (let i = first; session.exercises[i]?.superset_group === group; i++) indexes.push(i)
  return indexes
}

/**
 * Where to go from an exercise in a superset: the next exercise of the round
 * with a set to tick; at the end of a round, the superset's first exercise
 * with a set left. Null outside a superset or when nothing else in it is
 * left. Next goes there; the reducer starts the rest when the round is over.
 *
 * Only exercises with work left count: supersets often pair different
 * numbers of sets (3 leg curls, 4 calf raises), and pointing to a finished
 * exercise would show only ticked sets.
 * @param scope 'round' looks only after this exercise, in this round; 'next'
 *   also wraps to the start for the next round
 */
export function supersetNext(session: ActiveSession, index: number, scope: 'round' | 'next' = 'next'): number | null {
  const group = supersetOf(session, index)
  if (group.length < 2) return null
  const hasWork = (position: number) => {
    const item = session.exercises[position]
    return item !== undefined && hasWorkLeft(item)
  }
  // This round: the exercises after this one, the first with work
  const following = group.slice(group.indexOf(index) + 1).find(hasWork)
  if (following !== undefined || scope === 'round') return following ?? null
  // The next round: from the superset's first, any other with work
  return group.find(position => position !== index && hasWork(position)) ?? null
}

/**
 * The exercise after this one with work left, for the "Up next" card and the
 * rest bar. A superset is skipped as a whole: the bottom bar already names
 * its exercises. When nothing is left after it, the first one from the top
 * with work (an exercise jumped over with the dots). Null when nothing else
 * is left.
 */
export function upNext(session: ActiveSession, index: number): number | null {
  const group = supersetOf(session, index)
  // The positions after the superset, then the ones before it
  const after = Array.from({ length: session.exercises.length }, (_, i) => i).filter(i => i > Math.max(...group))
  const before = Array.from({ length: Math.min(...group) }, (_, i) => i)
  return [...after, ...before].find((position) => {
    const item = session.exercises[position]
    return item !== undefined && hasWorkLeft(item)
  }) ?? null
}

/** How a set is named on screen. */
export interface SetNumber {
  /** True for a warm-up, counted apart from the others. */
  warmUp: boolean
  /** Its number among the warm-ups, or among the other sets, from 1. */
  number: number
}

/**
 * The numbers of an exercise's sets: warm-ups are counted apart, so the sets
 * that count are 1, 2, 3 whatever warm-ups come first ("W W 1 2 3", not "W W 3
 * 4 5"). Drop and failure sets are numbered with the normal ones: they count
 * for volume.
 */
export function setNumbers(sets: readonly { set_type: SetType }[]): SetNumber[] {
  let warmUps = 0
  let others = 0
  return sets.map(set => set.set_type === 'warm_up'
    ? { warmUp: true, number: ++warmUps }
    : { warmUp: false, number: ++others })
}

// --- What happens to it -------------------------------------------------------------

export type SetField = 'weight' | 'reps' | 'seconds' | 'meters'

/** `exercise` and `set` are indexes; `now` is the moment of the action, ISO 8601. */
export type WorkoutAction
  = | { type: 'toggleSet', exercise: number, set: number, now: string }
    | { type: 'setField', exercise: number, set: number, field: SetField, value: string }
    | { type: 'setSetType', exercise: number, set: number, setType: SetType }
    | { type: 'addSet', exercise: number }
    | { type: 'removeSet', exercise: number, set: number }
    | { type: 'removeExercise', exercise: number }
    | { type: 'addExercises', exercises: WorkoutExercise[] }
    | { type: 'swapExercise', exercise: number, replacement: WorkoutExercise }
    | { type: 'skipExercise', exercise: number, skipped: boolean }
    | { type: 'setNote', exercise: number, notes: string }
    | { type: 'goTo', exercise: number }
    | { type: 'adjustRest', seconds: number }
    | { type: 'endRest' }
    | { type: 'startStopwatch', exercise: number, set: number, now: string }
    | { type: 'stopStopwatch', now: string }
    | { type: 'pauseStopwatch', now: string }
    | { type: 'resumeStopwatch', now: string }
    | { type: 'cancelStopwatch' }
    | { type: 'pause', now: string }
    | { type: 'resume', now: string }
    | { type: 'finish', now: string }

/** Adds the time since the clock last started to the time trained. Mutates `session`. */
function stopClock(session: ActiveSession, now: string): void {
  if (session.running_since === null) return
  session.accumulated_seconds = elapsedSeconds(session, new Date(now))
  session.running_since = null
}

/**
 * Works on a structuredClone() of the workout.
 *
 * Ticking a set never moves the screen: moving left the set just ticked out
 * of sight. What changes is the rest:
 * - on its own, the rest timer starts, with the exercise's rest;
 * - in a superset, no rest while another exercise of the round has a set
 *   left: Next points there (supersetNext); after the round's last, the rest
 *   starts.
 * A rest of 0 seconds starts no timer.
 */
export function workoutReducer(session: ActiveSession, action: WorkoutAction): ActiveSession {
  const next = structuredClone(session)
  const exercise = 'exercise' in action ? next.exercises[action.exercise] : undefined
  const set = 'set' in action ? exercise?.sets[action.set] : undefined

  switch (action.type) {
    case 'toggleSet': {
      if (!exercise || !set) break
      // ✓ on the set being timed ends it as Stop does: with the time
      // measured, not the one pre-filled, and the stopwatch gone
      if (!set.done && next.stopwatch?.set_id === set.id) return workoutReducer(next, { type: 'stopStopwatch', now: action.now })
      if (set.done) {
        // Unticking leaves the rest timer alone
        set.done = false
        set.completed_at = null
        break
      }
      if (!canComplete(set, exercise.exercise.logging_type, isForTime(exercise))) break
      set.done = true
      set.completed_at = action.now
      // Ticking a set of a skipped exercise means it is done after all
      exercise.skipped = false
      // The rest starts at the end of a round only: when no exercise after
      // this one in its superset has a set left (always, on its own)
      if (supersetNext(next, action.exercise, 'round') === null) {
        next.rest = exercise.rest_seconds > 0
          ? { ends_at: new Date(Date.parse(action.now) + exercise.rest_seconds * 1000).toISOString(), total: exercise.rest_seconds }
          : null
      }
      else {
        // The round goes on, straight to the next exercise
        next.rest = null
      }
      break
    }
    case 'setField':
      if (set) set[action.field] = action.value
      break
    case 'setSetType':
      if (set) set.set_type = action.setType
      break
    case 'addSet': {
      if (!exercise) break
      // The last set's values, to do again
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
    case 'removeSet': {
      if (!exercise || !canRemoveSet(exercise, action.set)) break
      const [removed] = exercise.sets.splice(action.set, 1)
      // A stopwatch running on it would time a set that is gone
      if (removed && next.stopwatch?.set_id === removed.id) next.stopwatch = null
      break
    }
    case 'removeExercise': {
      if (!exercise || !canRemoveExercise(exercise)) break
      next.exercises.splice(action.exercise, 1)
      // A stopwatch on one of its sets goes with it
      if (next.stopwatch && !findSet(next, next.stopwatch.set_id)) next.stopwatch = null
      // Keep the same exercise on screen; when it was the one removed, show
      // the one that took its place, or the one before when it was the last
      if (next.current > action.exercise || next.current >= next.exercises.length) next.current = Math.max(0, next.current - 1)
      break
    }
    case 'addExercises':
      // The first added opens: the user picked them to do them now
      if (action.exercises.length === 0) break
      next.current = next.exercises.length
      next.exercises.push(...structuredClone(action.exercises))
      break
    case 'swapExercise':
      // A ticked set belongs to the exercise it was done with
      if (!exercise || exercise.sets.some(candidate => candidate.done)) break
      next.exercises[action.exercise] = structuredClone(action.replacement)
      break
    case 'skipExercise':
      if (!exercise) break
      exercise.skipped = action.skipped
      // Skipping is a tap, not a tick, so it may move on to the next exercise
      if (action.skipped && action.exercise < next.exercises.length - 1) next.current = action.exercise + 1
      break
    case 'setNote':
      if (exercise) exercise.notes = action.notes
      break
    case 'goTo':
      if (action.exercise >= 0 && action.exercise < next.exercises.length) next.current = action.exercise
      break
    case 'adjustRest':
      if (next.rest) {
        // The total moves with the end. An end moved into the past reads as
        // 0 seconds left, and the screen ends the rest
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
    case 'startStopwatch': {
      if (!set || set.done) break
      // The target is the seconds in the set's field (planned or last time's)
      // when above 0
      const target = parseWhole(set.seconds)
      next.stopwatch = { set_id: set.id, started_at: action.now, target: target !== null && target > 0 ? target : null }
      // The set begins: the rest before it is over
      next.rest = null
      break
    }
    case 'stopStopwatch': {
      const timed = next.stopwatch ? findSet(next, next.stopwatch.set_id) : null
      if (!next.stopwatch || !timed) {
        next.stopwatch = null
        break
      }
      // Never 0: the backend requires at least 1 second
      const seconds = Math.max(1, stopwatchSeconds(next.stopwatch, new Date(action.now)))
      next.stopwatch = null
      const timedSet = next.exercises[timed.exercise]?.sets[timed.set]
      if (!timedSet) break
      timedSet.seconds = String(seconds)
      // Ticked as ✓ would, rest and superset included; a set ticked
      // meanwhile keeps its tick, with the new time
      if (!timedSet.done) return workoutReducer(next, { type: 'toggleSet', exercise: timed.exercise, set: timed.set, now: action.now })
      break
    }
    case 'pauseStopwatch':
      // A second Pause would move the pause's moment and lose the seconds
      // between the two
      if (next.stopwatch && !next.stopwatch.paused_at) next.stopwatch.paused_at = action.now
      break
    case 'resumeStopwatch':
      if (next.stopwatch?.paused_at) {
        next.stopwatch.paused_ms = (next.stopwatch.paused_ms ?? 0) + Date.parse(action.now) - Date.parse(next.stopwatch.paused_at)
        next.stopwatch.paused_at = null
      }
      break
    case 'cancelStopwatch':
      next.stopwatch = null
      break
    case 'finish':
      stopClock(next, action.now)
      next.finished_at = action.now
      next.rest = null
      next.stopwatch = null
      break
  }
  return next
}

// --- Sending it -----------------------------------------------------------------------

/**
 * The body of PUT /api/sessions/{id}: every exercise, ticked sets only, the
 * values that fit each exercise's logging type, weights in kilograms. The
 * weight goes with weight_reps and reps (the added weight), null when empty.
 * An exercise with no set ticked is sent with none: skipped.
 * @param now for the time trained
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
      notes: item.notes?.trim() || null,
      sets: item.sets.filter(set => set.done).map((set) => {
        const type = item.exercise.logging_type
        const byReps = type === 'weight_reps' || type === 'reps'
        const weight = parseDecimal(set.weight)
        return {
          id: set.id,
          set_type: set.set_type,
          weight_kg: byReps && weight !== null ? toKilograms(weight, unit) : null,
          reps: byReps ? parseWhole(set.reps) : null,
          // A timed exercise's seconds, or the time of reps done as fast as possible
          duration_seconds: type === 'time' || isForTime(item) ? parseWhole(set.seconds) : null,
          distance_meters: type === 'distance' ? parseWhole(set.meters) : null,
          completed_at: set.completed_at ?? session.started_at,
        }
      }),
    })),
  }
}

/** The sets of a workout that count, warm-ups excluded: done, and in all. */
export interface SetCount {
  done: number
  total: number
}

/**
 * Ticked and total sets, warm-ups excluded, for the Finish dialog: finishing
 * early says how many will not be saved. A skipped exercise counts only the
 * sets ticked before the skip: the others were given up on purpose.
 */
export function countSets(session: ActiveSession): SetCount {
  const counted = session.exercises
    .flatMap(item => (item.skipped ? item.sets.filter(set => set.done) : item.sets))
    .filter(set => set.set_type !== 'warm_up')
  return { done: counted.filter(set => set.done).length, total: counted.length }
}

/** Whether every set is ticked or its exercise skipped, warm-ups included. */
export function allSetsDone(session: ActiveSession): boolean {
  return session.exercises.every(item => !hasWorkLeft(item))
}
