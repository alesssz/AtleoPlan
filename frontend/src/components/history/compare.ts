/*
 * Better, the same or worse than last time, exercise by exercise
 * (docs/design/D1-ui.md D1.4.10, docs/design/D2-decisions.md D2.8). The
 * summary and a workout's page in history put it beside each exercise, and
 * count the verdicts: "3 better · 1 same · 1 worse". Plain functions, no
 * React, tested on their own (compare.test.ts).
 *
 * Why not a workout's total volume (weight × reps of everything): it adds up
 * unlike exercises (a kilogram of squat is not a kilogram of curl), and
 * counts nothing done with the body alone, so ten sets of pull-ups weighed 0.
 * Each exercise is compared with itself instead, by the rule that fits how
 * it is logged:
 *
 * | Logged as     | The best set is the one with           | Example          |
 * |---------------|----------------------------------------|------------------|
 * | weight × reps | the highest estimated one-rep max      | 82.5×8 beats 85×5 |
 * | reps          | the most added weight, then most reps  | +5×6 beats 12    |
 * | time          | the longest                            | 1:30 beats 1:15  |
 * | distance      | the longest                            | 500 m beats 400 m |
 *
 * The estimated one-rep max is Epley's: weight × (1 + reps / 30), as D2.8
 * sets for records. When the best sets tie, the total reps of the working
 * sets decide: 3×8 beats 2×8 at the same weight. Warm-ups never count.
 */
import type { LoggingType } from '@/api/exercises'
import type { SetType } from '@/api/plans'

/** One set's values, whichever way they arrived: from the phone (numbers) or the API (weights as text). */
export interface SetValues {
  /** Its type; warm-ups are left out. */
  set_type: SetType
  /** Kilograms, as a number or as the API's exact text ("80.000"); null for none. */
  weight_kg: number | string | null
  /** Reps; null for a timed or distance set. */
  reps: number | null
  /** Seconds, for a timed set. */
  duration_seconds: number | null
  /** Meters, for a distance set. */
  distance_meters: number | null
}

/** What an exercise did against last time. */
export type Verdict = 'better' | 'same' | 'worse' | 'first'

/** An exercise compared with last time. */
export interface Comparison {
  /** Better, the same, worse; or done for the first time. */
  verdict: Verdict
  /** Its best set this time. */
  best: SetValues
  /** Its best set last time; null the first time. */
  previousBest: SetValues | null
}

/**
 * A set's score by the rule of its logging type, as a list compared item
 * by item: [estimated one-rep max] or [added weight, reps], [seconds], [meters].
 * @param set the set
 * @param loggingType how its exercise is logged
 */
function score(set: SetValues, loggingType: LoggingType): number[] {
  // The weight as a number; 0 for none (the body alone)
  const weight = Number(set.weight_kg ?? 0)
  const reps = set.reps ?? 0
  switch (loggingType) {
    case 'weight_reps': return [weight * (1 + reps / 30)]
    case 'reps': return [weight, reps]
    case 'time': return [set.duration_seconds ?? 0]
    case 'distance': return [set.distance_meters ?? 0]
  }
}

/**
 * Compares two scores item by item: 1 when `a` is higher, -1 when lower, 0
 * when equal. Differences below 0.001 are equal: 80 × (1 + 8/30) computed
 * twice may differ in its last decimal.
 * @param a a score
 * @param b another score
 */
function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0)
    if (Math.abs(difference) > 0.001) return Math.sign(difference)
  }
  return 0
}

/**
 * The sets that count: warm-ups left out.
 * @param sets an exercise's sets
 */
function working(sets: readonly SetValues[]): SetValues[] {
  return sets.filter(set => set.set_type !== 'warm_up')
}

/**
 * An exercise's best set by the rule of its logging type; null when it has
 * no set that counts.
 * @param sets its sets
 * @param loggingType how it is logged
 */
export function bestSet(sets: readonly SetValues[], loggingType: LoggingType): SetValues | null {
  // reduce(): walks the sets keeping the best so far
  return working(sets).reduce<SetValues | null>((best, set) => (best === null || compareScores(score(set, loggingType), score(best, loggingType)) > 0 ? set : best), null)
}

/**
 * An exercise of this workout against last time.
 * @param sets this time's sets
 * @param previous last time's sets; empty when it was never done
 * @param loggingType how the exercise is logged
 * @returns the comparison; null when nothing that counts was done this time (skipped, or warm-ups only)
 */
export function compareExercise(sets: readonly SetValues[], previous: readonly SetValues[], loggingType: LoggingType): Comparison | null {
  const best = bestSet(sets, loggingType)
  if (best === null) return null
  const previousBest = bestSet(previous, loggingType)
  if (previousBest === null) return { verdict: 'first', best, previousBest: null }
  // The best sets first; when they tie, the total reps of the sets that count
  const totalReps = (list: readonly SetValues[]) => working(list).reduce((sum, set) => sum + (set.reps ?? 0), 0)
  const difference = compareScores(score(best, loggingType), score(previousBest, loggingType)) || Math.sign(totalReps(sets) - totalReps(previous))
  return { verdict: difference > 0 ? 'better' : difference < 0 ? 'worse' : 'same', best, previousBest }
}

/** How many exercises got each verdict. */
export type VerdictCount = Record<Verdict, number>

/**
 * Counts the verdicts of a workout's exercises: "3 better · 1 same · 1 worse".
 * @param comparisons one per exercise; null for one with nothing that counts
 */
export function countVerdicts(comparisons: readonly (Comparison | null)[]): VerdictCount {
  const count: VerdictCount = { better: 0, same: 0, worse: 0, first: 0 }
  for (const comparison of comparisons) if (comparison) count[comparison.verdict]++
  return count
}

/**
 * The volume of one exercise, weight × reps of its sets that count, in
 * kilograms. Meaningful only for an exercise logged as weight × reps, where
 * it is still shown, beside the exercise; never added across exercises.
 * @param sets the exercise's sets
 */
export function exerciseVolume(sets: readonly SetValues[]): number {
  return working(sets).reduce((sum, set) => sum + Number(set.weight_kg ?? 0) * (set.reps ?? 0), 0)
}

/** An exercise of a workout, as far as the comparison needs it. */
interface ComparedExercise {
  /** Which exercise. */
  exercise_id: number
  /** How it is logged. */
  exercise: { logging_type: LoggingType }
  /** This time's sets. */
  sets: readonly SetValues[]
}

/**
 * Every exercise of a workout against last time, in order.
 * @param exercises the workout's exercises
 * @param lastSets last time's sets, by exercise; an exercise missing was never done
 * @returns one comparison per exercise; null for one with nothing that counts
 */
export function compareWorkout(exercises: readonly ComparedExercise[], lastSets: readonly { exercise_id: number, sets: readonly SetValues[] }[]): (Comparison | null)[] {
  return exercises.map(item => compareExercise(item.sets, lastSets.find(entry => entry.exercise_id === item.exercise_id)?.sets ?? [], item.exercise.logging_type))
}
