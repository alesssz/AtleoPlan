/*
 * The plan editor's draft: the plan as the user is changing it, before it is
 * saved:
 *
 * - the draft's shape, close to the screen: every number is the text the
 *   user typed ("8-10", "82,5"), as in a form;
 * - the conversions: from a saved plan to a draft (draftFromPlan), and from a
 *   draft to the body of POST or PUT /api/plans (toPlanInput);
 * - the rules checked before sending (validateDraft), and the translation of
 *   the server's field names into the draft's (draftField);
 * - the reducer.
 *
 * Positions are never stored: the place of a day, an exercise or a set in
 * its list is its position, as in the API.
 */
import type { Exercise, LoggingType } from '@/api/exercises'
import type { Plan, PlanInput, PlanItem, PlanSetInput, SetType } from '@/api/plans'
import { formatNumber, type WeightUnit } from '@/lib/format'
import { KG_PER_LB, weightIn } from './plan-format'

/** One set while it is being edited: the type, and each target as typed. */
export interface DraftSet {
  /** normal, warm_up, drop or failure. */
  set_type: SetType
  /** "8-10", "8", or '' for no target. */
  reps: string
  /** In the user's unit, "82,5" or "82.5"; '' for none. */
  weight: string
  /** "8" or "8.5"; '' for none. */
  rpe: string
  /** Whole seconds, for an exercise logged by time. */
  seconds: string
  /** Whole meters, for an exercise logged by distance. */
  meters: string
}

/** One exercise of a day, while it is being edited. */
export interface DraftItem {
  /** The saved UUID, or one made here for a new exercise. */
  id: string
  exercise: Exercise
  /** The superset's number, or null. */
  superset_group: number | null
  /** Seconds as typed; '' for the user's default. */
  rest: string
  /** The user's notes; '' for none. */
  notes: string
  /**
   * Done as fast as possible (canBeForTime). Optional: a draft kept in the
   * browser before this existed has none, which reads as false.
   */
  for_time?: boolean
  sets: DraftSet[]
}

/** One day, while it is being edited. */
export interface DraftDay {
  id: string
  /** "Day A – Push". */
  name: string
  items: DraftItem[]
}

/** The whole plan, while it is being edited. */
export interface PlanDraft {
  /** The plan's UUID: the saved one, or made here for a new plan. */
  id: string
  /** The version the editor started from; null for a new plan. */
  version: number | null
  /** Required. */
  name: string
  /** '' for none. */
  goal: string
  /** '' for none. */
  notes: string
  days: DraftDay[]
}

/** The limits of the backend (PlanRequest), enforced on screen too. */
export const LIMITS = { days: 14, items: 30, sets: 20 } as const

/** The set types, in the order the list of SetTypeSelect.tsx shows them. */
export const SET_TYPES: readonly SetType[] = ['normal', 'warm_up', 'drop', 'failure']

/** The short sign of each type, shown instead of the set's number: "W" for a warm-up. */
export const SET_TYPE_SIGNS: Record<SetType, string | null> = { normal: null, warm_up: 'W', drop: 'D', failure: 'F' }

/**
 * A new UUID, made in the browser: the device names its own rows, so a plan can
 * be built with no network.
 *
 * crypto.randomUUID() is the browser's own generator, but browsers give it
 * only to pages in a **secure context**: HTTPS, or localhost. The app opened
 * from a phone at http://192.168.1.20:5673 is neither, and the function is
 * simply missing: Start failed with "crypto.randomUUID is not a function".
 * So when it is missing, the same kind of UUID (version 4, random) is built
 * from crypto.getRandomValues(), which every page has (randomUuid below).
 */
export function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomUuid()
}

/**
 * A version 4 UUID built by hand, as RFC 9562 describes it: 16 random bytes,
 * of which two carry fixed bits that say "version 4" and "the standard
 * variant", written as 32 hexadecimal digits in groups of 8-4-4-4-12.
 */
export function randomUuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  // Byte 6: the version, 0100
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  // Byte 8: the variant, 10
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// --- Reading what the user typed ---------------------------------------------

/**
 * Reads reps as typed: "8", "8-10", "8–10" or "8 - 10".
 * @returns the two ends; null for an empty field; 'invalid' for anything else
 */
export function parseReps(text: string): { min: number, max: number } | null | 'invalid' {
  if (text.trim() === '') return null
  const match = /^\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*$/.exec(text)
  if (!match) return 'invalid'
  const min = Number(match[1])
  // No second number: "8" means 8 to 8
  const max = match[2] === undefined ? min : Number(match[2])
  return { min, max }
}

/**
 * Reads a decimal number as typed, with a dot or a comma: "82.5", "82,5".
 * @returns the number; null for an empty field; NaN when it is not a number
 */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  // Only digits and one separator; Number() alone would accept "1e3" or " "
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return Number.NaN
  return Number(trimmed.replace(',', '.'))
}

/**
 * Reads a whole number as typed: "90".
 * @returns the number; null for an empty field; NaN when it is not one
 */
export function parseWhole(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN
}

/**
 * A weight in the user's unit, in kilograms for the API, rounded to the three
 * decimals the database keeps: 135 lb → 61.235 kg.
 * @param unit the user's unit
 */
export function toKilograms(value: number, unit: WeightUnit): number {
  const kg = unit === 'kg' ? value : value * KG_PER_LB
  return Math.round(kg * 1000) / 1000
}

// --- From the API to a draft, and back -----------------------------------------

/**
 * A number for a field, in the user's language and without thousands
 * separators: 82.5 → "82,5" in Italian. At most two decimals.
 */
function numberField(value: number, language: string): string {
  return formatNumber(value, language, { useGrouping: false, maximumFractionDigits: 2 })
}

/**
 * A new set for an exercise, with a sensible target to start from: 8–10 reps,
 * or a minute for a timed exercise.
 */
export function newSet(loggingType: LoggingType): DraftSet {
  return {
    set_type: 'normal',
    reps: loggingType === 'weight_reps' || loggingType === 'reps' ? '8-10' : '',
    weight: '',
    rpe: '',
    seconds: loggingType === 'time' ? '60' : '',
    meters: '',
  }
}

/**
 * Whether an exercise can be done "as fast as possible": only one that counts
 * reps, so that its reps are the fixed amount and the time the result. A timed
 * or distance exercise already has one number.
 */
export function canBeForTime(loggingType: LoggingType): boolean {
  return loggingType === 'weight_reps' || loggingType === 'reps'
}

/**
 * An exercise just added to a day: three sets, the user's default rest.
 * @param exercise the exercise, from the library
 */
export function newItem(exercise: Exercise): DraftItem {
  return {
    id: newId(),
    exercise,
    superset_group: null,
    rest: '',
    notes: '',
    for_time: false,
    sets: Array.from({ length: 3 }, () => newSet(exercise.logging_type)),
  }
}

/**
 * The letter of a day by its place, for the names the editor gives days
 * ("Day A", "Day B"…) and shows for a day whose name is still empty.
 * @param index the day's index, from 0
 * @returns "A" for 0, "B" for 1…
 */
export function dayLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

/**
 * A new plan with one empty day, the editor's start for /plans/new.
 * @param dayName the first day's name, translated: "Day A"
 */
export function emptyDraft(dayName: string): PlanDraft {
  return { id: newId(), version: null, name: '', goal: '', notes: '', days: [{ id: newId(), name: dayName, items: [] }] }
}

/**
 * The draft of a saved plan, for /plans/:id/edit: the numbers become text,
 * the weights the user's unit.
 * @param plan the plan, as GET /api/plans/{id} sends it
 * @param unit the user's weight unit
 * @param language the interface's language, for the decimal separator
 */
export function draftFromPlan(plan: Plan, unit: WeightUnit, language: string): PlanDraft {
  const text = (value: number | null) => (value === null ? '' : numberField(value, language))
  return {
    id: plan.id,
    version: plan.version,
    name: plan.name,
    goal: plan.goal ?? '',
    notes: plan.notes ?? '',
    days: plan.days.map(day => ({
      id: day.id,
      name: day.name,
      items: day.items.map(item => ({
        id: item.id,
        exercise: item.exercise,
        superset_group: item.superset_group,
        rest: text(item.rest_seconds),
        notes: item.notes ?? '',
        for_time: item.for_time,
        sets: item.sets.map(set => ({
          set_type: set.set_type,
          reps: set.target_reps_min === null ? '' : set.target_reps_min === set.target_reps_max ? String(set.target_reps_min) : `${set.target_reps_min}-${set.target_reps_max}`,
          // The API's weights are exact text in kilograms: "80.000"
          weight: set.target_weight_kg === null ? '' : numberField(weightIn(Number(set.target_weight_kg), unit), language),
          rpe: set.target_rpe === null ? '' : numberField(Number(set.target_rpe), language),
          seconds: text(set.target_duration_seconds),
          meters: text(set.target_distance_meters),
        })),
      })),
    })),
  }
}

/**
 * One set for the API. Only the targets that fit how the exercise is logged
 * are sent; a field that does not read as a number is sent empty
 * (validateDraft() stops the save before that happens).
 * @param unit the user's weight unit
 */
function setInput(set: DraftSet, loggingType: LoggingType, unit: WeightUnit): PlanSetInput {
  const reps = parseReps(set.reps)
  const weight = parseDecimal(set.weight)
  const rpe = parseDecimal(set.rpe)
  const seconds = parseWhole(set.seconds)
  const meters = parseWhole(set.meters)
  // NaN and null both become null
  const valid = (value: number | null) => (value === null || Number.isNaN(value) ? null : value)
  const byReps = loggingType === 'weight_reps' || loggingType === 'reps'
  const range = byReps && reps !== null && reps !== 'invalid' ? reps : null
  return {
    set_type: set.set_type,
    target_reps_min: range?.min ?? null,
    target_reps_max: range?.max ?? null,
    target_weight_kg: loggingType === 'weight_reps' && valid(weight) !== null ? toKilograms(weight as number, unit) : null,
    target_rpe: byReps ? valid(rpe) : null,
    target_duration_seconds: loggingType === 'time' ? valid(seconds) : null,
    target_distance_meters: loggingType === 'distance' ? valid(meters) : null,
  }
}

/**
 * The body of POST or PUT /api/plans, from a draft.
 * @param unit the user's weight unit
 */
export function toPlanInput(draft: PlanDraft, unit: WeightUnit): PlanInput {
  // '' becomes null: the backend empties a field that is null
  const orNull = (text: string) => (text.trim() === '' ? null : text.trim())
  return {
    id: draft.id,
    ...(draft.version === null ? {} : { version: draft.version }),
    name: draft.name.trim(),
    goal: orNull(draft.goal),
    notes: orNull(draft.notes),
    days: draft.days.map(day => ({
      id: day.id,
      name: day.name.trim(),
      items: day.items.map((item) => {
        const rest = parseWhole(item.rest)
        return {
          id: item.id,
          exercise_id: item.exercise.id,
          superset_group: item.superset_group,
          rest_seconds: rest === null || Number.isNaN(rest) ? null : rest,
          notes: orNull(item.notes),
          // Only where it makes sense: an exercise swapped for a timed one
          // in the editor cannot keep it
          for_time: item.for_time === true && canBeForTime(item.exercise.logging_type),
          sets: item.sets.map(set => setInput(set, item.exercise.logging_type, unit)),
        }
      }),
    })),
  }
}

/**
 * An exercise of the draft shaped as the API sends one, so that the plan
 * page's summary line (itemSummary, plan-format.ts) can describe it while it
 * is being edited.
 * @param unit the user's weight unit
 */
export function draftItemAsPlanItem(item: DraftItem, unit: WeightUnit): PlanItem {
  const input = toPlanInput({ id: '', version: null, name: '', goal: '', notes: '', days: [{ id: '', name: '', items: [item] }] }, unit)
  const converted = input.days[0]!.items[0]!
  return {
    ...converted,
    exercise: item.exercise,
    sets: converted.sets.map(set => ({
      ...set,
      // The API sends these two as text
      target_weight_kg: set.target_weight_kg === null ? null : String(set.target_weight_kg),
      target_rpe: set.target_rpe === null ? null : String(set.target_rpe),
    })),
  }
}

// --- The rules ------------------------------------------------------------------

/**
 * What is wrong in a draft: a translation key for each field, by the field's
 * path in the draft, such as `days.0.items.1.sets.2.reps` → `plans.editor.errors.reps`.
 * Empty when the draft can be saved.
 */
export type DraftErrors = Record<string, string>

/**
 * Checks a draft with the backend's rules (PlanRequest), so that most
 * mistakes are shown before anything is sent.
 * @param unit the user's weight unit, for the weight's upper limit
 * @returns the errors, empty when the draft can be saved
 */
export function validateDraft(draft: PlanDraft, unit: WeightUnit): DraftErrors {
  const errors: DraftErrors = {}
  if (draft.name.trim() === '') errors.name = 'plans.editor.errors.nameRequired'
  else if (draft.name.trim().length > 100) errors.name = 'plans.editor.errors.tooLong'
  if (draft.goal.trim().length > 100) errors.goal = 'plans.editor.errors.tooLong'
  if (draft.notes.trim().length > 2000) errors.notes = 'plans.editor.errors.tooLong'

  draft.days.forEach((day, d) => {
    if (day.name.trim() === '') errors[`days.${d}.name`] = 'plans.editor.errors.dayNameRequired'
    else if (day.name.trim().length > 50) errors[`days.${d}.name`] = 'plans.editor.errors.tooLong'

    day.items.forEach((item, i) => {
      const at = `days.${d}.items.${i}`
      const rest = parseWhole(item.rest)
      if (rest !== null && (Number.isNaN(rest) || rest > 3600)) errors[`${at}.rest`] = 'plans.editor.errors.rest'
      if (item.notes.trim().length > 500) errors[`${at}.notes`] = 'plans.editor.errors.tooLong'

      item.sets.forEach((set, s) => {
        const field = `${at}.sets.${s}`
        const reps = parseReps(set.reps)
        if (reps === 'invalid' || (reps !== null && (reps.min < 1 || reps.max > 999 || reps.min > reps.max))) {
          errors[`${field}.reps`] = 'plans.editor.errors.reps'
        }
        const weight = parseDecimal(set.weight)
        if (weight !== null && (Number.isNaN(weight) || toKilograms(weight, unit) > 9999.999)) errors[`${field}.weight`] = 'plans.editor.errors.weight'
        const rpe = parseDecimal(set.rpe)
        // One decimal at most: 8.5 yes, 8.25 no (the backend's decimal:0,1)
        if (rpe !== null && (Number.isNaN(rpe) || rpe < 1 || rpe > 10 || Math.round(rpe * 10) !== rpe * 10)) errors[`${field}.rpe`] = 'plans.editor.errors.rpe'
        const seconds = parseWhole(set.seconds)
        if (seconds !== null && (Number.isNaN(seconds) || seconds < 1 || seconds > 86400)) errors[`${field}.seconds`] = 'plans.editor.errors.seconds'
        const meters = parseWhole(set.meters)
        if (meters !== null && (Number.isNaN(meters) || meters < 1 || meters > 1000000)) errors[`${field}.meters`] = 'plans.editor.errors.meters'
      })
    })
  })
  return errors
}

/** The backend's names of a set's fields, and the draft's. */
const SERVER_FIELDS: Record<string, string> = {
  target_reps_min: 'reps',
  target_reps_max: 'reps',
  target_weight_kg: 'weight',
  target_rpe: 'rpe',
  target_duration_seconds: 'seconds',
  target_distance_meters: 'meters',
  rest_seconds: 'rest',
}

/**
 * The draft's path of a field named by the backend in a 422:
 * `days.0.items.1.sets.2.target_reps_max` → `days.0.items.1.sets.2.reps`.
 * The indexes are the same on both sides, since the order is the position.
 */
export function draftField(serverField: string): string {
  const parts = serverField.split('.')
  const last = parts.at(-1) ?? ''
  return [...parts.slice(0, -1), SERVER_FIELDS[last] ?? last].join('.')
}

// --- Supersets ------------------------------------------------------------------

/**
 * Puts a day's supersets back in order after a change: the backend accepts
 * only neighbours, at least two (SupersetsAreNeighbours), so
 *
 * - an exercise dragged away from its superset leaves it;
 * - a superset left with one exercise is no superset;
 * - the numbers become 1, 2, 3… in the order they appear.
 *
 * Changes the list in place: the reducer calls it on its own copy.
 * @param items a day's exercises, in order
 */
export function normalizeSupersets(items: DraftItem[]): void {
  const seen = new Set<number>()
  let previous: number | null = null
  for (const item of items) {
    const group = item.superset_group
    if (group !== null && group !== previous && seen.has(group)) {
      // A second, separate run of a group already met: it leaves
      item.superset_group = null
      previous = null
      continue
    }
    if (group !== null) seen.add(group)
    previous = group
  }

  const sizes = new Map<number, number>()
  for (const item of items) {
    if (item.superset_group !== null) sizes.set(item.superset_group, (sizes.get(item.superset_group) ?? 0) + 1)
  }
  // New numbers, in order of appearance; groups of one are dropped
  const renumber = new Map<number, number>()
  for (const item of items) {
    const group = item.superset_group
    if (group === null) continue
    if ((sizes.get(group) ?? 0) < 2) {
      item.superset_group = null
      continue
    }
    if (!renumber.has(group)) renumber.set(group, renumber.size + 1)
    item.superset_group = renumber.get(group) ?? null
  }
}

// --- The reducer --------------------------------------------------------------------

/** A field of a set that the user types in. */
export type SetField = 'reps' | 'weight' | 'rpe' | 'seconds' | 'meters'

/** `day`, `item` and `set` are indexes. */
export type DraftAction
  = | { type: 'setPlanField', field: 'name' | 'goal' | 'notes', value: string }
    | { type: 'addDay', name: string }
    | { type: 'renameDay', day: number, name: string }
    | { type: 'moveDay', from: number, to: number }
    | { type: 'removeDay', day: number }
    | { type: 'addExercises', day: number, exercises: Exercise[] }
    | { type: 'removeItem', day: number, item: number }
    | { type: 'moveItem', day: number, from: number, to: number }
    | { type: 'moveItemToDay', day: number, item: number, toDay: number }
    | { type: 'setItemField', day: number, item: number, field: 'rest' | 'notes', value: string }
    | { type: 'setItemForTime', day: number, item: number, value: boolean }
    | { type: 'joinSuperset', day: number, items: number[] }
    | { type: 'leaveSuperset', day: number, item: number }
    | { type: 'addSet', day: number, item: number }
    | { type: 'removeSet', day: number, item: number, set: number }
    | { type: 'setSetField', day: number, item: number, set: number, field: SetField, value: string }
    | { type: 'setSetType', day: number, item: number, set: number, setType: SetType }
    | { type: 'replace', draft: PlanDraft }

/**
 * Moves one entry of a list to another place, in place: [a, b, c], 0 → 2
 * gives [b, c, a].
 */
function move<T>(list: T[], from: number, to: number): void {
  const [entry] = list.splice(from, 1)
  if (entry !== undefined) list.splice(to, 0, entry)
}

/**
 * Works on a structuredClone() of the draft. The draft it was given stays as
 * it was, which is also what makes "Discard changes" a simple swap.
 */
export function draftReducer(draft: PlanDraft, action: DraftAction): PlanDraft {
  if (action.type === 'replace') return action.draft

  const next = structuredClone(draft)
  const day = 'day' in action ? next.days[action.day] : undefined

  switch (action.type) {
    case 'setPlanField':
      next[action.field] = action.value
      break
    case 'addDay':
      if (next.days.length < LIMITS.days) next.days.push({ id: newId(), name: action.name, items: [] })
      break
    case 'renameDay':
      if (day) day.name = action.name
      break
    case 'moveDay':
      move(next.days, action.from, action.to)
      break
    case 'removeDay':
      next.days.splice(action.day, 1)
      break
    case 'addExercises':
      if (day) {
        // Only as many as still fit: at most 30 per day
        const room = LIMITS.items - day.items.length
        day.items.push(...action.exercises.slice(0, room).map(newItem))
      }
      break
    case 'removeItem':
      day?.items.splice(action.item, 1)
      break
    case 'moveItem':
      if (day) move(day.items, action.from, action.to)
      break
    case 'moveItemToDay': {
      const target = next.days[action.toDay]
      const [item] = day?.items.splice(action.item, 1) ?? []
      if (item && target) {
        // It arrives alone, at the end of the other day
        item.superset_group = null
        target.items.push(item)
      }
      break
    }
    case 'setItemField': {
      const item = day?.items[action.item]
      if (item) item[action.field] = action.value
      break
    }
    case 'setItemForTime': {
      const item = day?.items[action.item]
      if (item) item.for_time = action.value
      break
    }
    case 'joinSuperset':
      if (day) joinSuperset(day, action.items)
      break
    case 'leaveSuperset': {
      const item = day?.items[action.item]
      if (item) item.superset_group = null
      break
    }
    case 'addSet': {
      const item = day?.items[action.item]
      if (item && item.sets.length < LIMITS.sets) {
        // A copy of the last set, the usual next step; a new one when none
        const last = item.sets.at(-1)
        item.sets.push(last ? { ...last } : newSet(item.exercise.logging_type))
      }
      break
    }
    case 'removeSet':
      day?.items[action.item]?.sets.splice(action.set, 1)
      break
    case 'setSetField': {
      const set = day?.items[action.item]?.sets[action.set]
      if (set) set[action.field] = action.value
      break
    }
    case 'setSetType': {
      const set = day?.items[action.item]?.sets[action.set]
      if (set) set.set_type = action.setType
      break
    }
  }

  // Any change of order or membership may have broken a superset
  for (const changed of next.days) normalizeSupersets(changed.items)
  return next
}

/**
 * Joins some exercises of a day into a new superset: they move next to each
 * other, where the first of them was, in their order, and share a number.
 * @param day the day, a copy the reducer may change
 * @param indexes the chosen exercises' indexes, at least two
 */
function joinSuperset(day: DraftDay, indexes: number[]): void {
  const chosen = [...new Set(indexes)].sort((a, b) => a - b).filter(index => index < day.items.length)
  if (chosen.length < 2) return
  // A number no group of the day uses yet; normalizeSupersets() renumbers
  const group = Math.max(0, ...day.items.map(item => item.superset_group ?? 0)) + 1
  const members = chosen.map(index => day.items[index]).filter((item): item is DraftItem => item !== undefined)
  // The others, in order; then the members go in where the first one was
  const first = chosen[0] ?? 0
  const before = day.items.slice(0, first).filter(item => !members.includes(item))
  const after = day.items.slice(first).filter(item => !members.includes(item))
  for (const member of members) member.superset_group = group
  day.items = [...before, ...members, ...after]
}
