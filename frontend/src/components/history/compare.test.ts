/*
 * Better, the same or worse than last time (compare.ts): one rule per way
 * of logging, warm-ups left out, ties decided by the total reps.
 */
import { describe, expect, it } from 'vitest'
import { bestSet, compareExercise, compareWorkout, countVerdicts, exerciseVolume, hasTimedSets, type SetValues } from './compare'

/**
 * A normal set by reps, with a weight or none.
 * @param weight kilograms, as a number or as the API's text; null for none
 * @param reps the reps
 * @param type its type
 */
function set(weight: number | string | null, reps: number, type: SetValues['set_type'] = 'normal'): SetValues {
  return { set_type: type, weight_kg: weight, reps, duration_seconds: null, distance_meters: null }
}

describe('compareExercise', () => {
  it('weight × reps: the best estimated one-rep max wins, warm-ups left out', () => {
    // 82.5 × 8 → 104.5; 85 × 5 → 99.2: more reps at a little less is better
    const today = [set(40, 10, 'warm_up'), set(82.5, 8), set(82.5, 7)]
    const last = [set(100, 10, 'warm_up'), set(85, 5)]

    expect(compareExercise(today, last, 'weight_reps')).toEqual({ verdict: 'better', best: set(82.5, 8), previousBest: set(85, 5) })
    // The API's weights are text: the same verdict
    expect(compareExercise([set('85.000', 5)], [set('82.500', 8)], 'weight_reps')?.verdict).toBe('worse')
  })

  it('reps: more added weight wins, then more reps; the body alone counts', () => {
    expect(compareExercise([set(null, 12)], [set(null, 10)], 'reps')?.verdict).toBe('better')
    expect(compareExercise([set(5, 6)], [set(null, 12)], 'reps')?.verdict).toBe('better')
    expect(compareExercise([set(null, 9)], [set(null, 10)], 'reps')?.verdict).toBe('worse')
  })

  it('a tie of the best sets is decided by the total reps', () => {
    expect(compareExercise([set(80, 8), set(80, 8), set(80, 8)], [set(80, 8), set(80, 8)], 'weight_reps')?.verdict).toBe('better')
    expect(compareExercise([set(80, 8), set(80, 6)], [set(80, 8), set(80, 6)], 'weight_reps')?.verdict).toBe('same')
  })

  it('time and distance: the longest', () => {
    const timed = (seconds: number): SetValues => ({ set_type: 'normal', weight_kg: null, reps: null, duration_seconds: seconds, distance_meters: null })
    expect(compareExercise([timed(90)], [timed(75)], 'time')?.verdict).toBe('better')
    const run = (meters: number): SetValues => ({ set_type: 'normal', weight_kg: null, reps: null, duration_seconds: null, distance_meters: meters })
    expect(compareExercise([run(400)], [run(500)], 'distance')?.verdict).toBe('worse')
  })

  it('reps for time: the same reps in less time wins', () => {
    // 50 in 1:05 against 50 in 1:12
    const race = (seconds: number): SetValues => ({ ...set(null, 50), duration_seconds: seconds })

    expect(compareExercise([race(65)], [race(72)], 'reps')?.verdict).toBe('better')
    expect(compareExercise([race(80)], [race(72)], 'reps')?.verdict).toBe('worse')
    expect(bestSet([race(80), race(70)], 'reps')?.duration_seconds).toBe(70)
  })

  it('compares with last time done the same way: for time, or for reps', () => {
    const race = { ...set(null, 50), duration_seconds: 72 }
    // Last time of each kind, as GET /api/sessions/last-sets gives them
    const lastSets = [
      { exercise_id: 31, sets: [set(null, 15), set(null, 15)] },
      { exercise_id: 31, sets: [race] },
    ]
    const today = [{ exercise_id: 31, exercise: { logging_type: 'reps' as const }, sets: [{ ...race, duration_seconds: 65 }] }]

    expect(hasTimedSets([race])).toBe(true)
    expect(hasTimedSets([set(null, 15)])).toBe(false)
    expect(compareWorkout(today, lastSets)[0]).toMatchObject({ verdict: 'better', previousBest: race })
  })

  it('says "first" when never done before, and nothing for an exercise skipped', () => {
    expect(compareExercise([set(80, 8)], [], 'weight_reps')?.verdict).toBe('first')
    expect(compareExercise([], [set(80, 8)], 'weight_reps')).toBeNull()
    expect(compareExercise([set(40, 10, 'warm_up')], [set(80, 8)], 'weight_reps')).toBeNull()
  })
})

describe('the helpers', () => {
  it('finds the best set, counts the verdicts, and adds an exercise\'s volume', () => {
    expect(bestSet([set(100, 1), set(80, 10)], 'weight_reps')).toEqual(set(80, 10))
    const comparisons = [compareExercise([set(82.5, 8)], [set(80, 8)], 'weight_reps'), compareExercise([set(80, 8)], [set(80, 8)], 'weight_reps'), null]
    expect(countVerdicts(comparisons)).toEqual({ better: 1, same: 1, worse: 0, first: 0 })
    // 80 × 8 + 80 × 6; the warm-up left out
    expect(exerciseVolume([set(40, 10, 'warm_up'), set('80.000', 8), set(80, 6)])).toBe(1120)
  })
})
