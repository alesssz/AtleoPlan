/*
 * The summary of a plan's exercises (plan-format.ts): what each line says,
 * in two languages and two units, and how supersets are found.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { testExercise } from '@/test/exercise-helpers'
import { testPlanItem, testPlanSet } from '@/test/plan-helpers'
import { formatSeconds, groupSupersets, itemSummary, warmUpCount, type SummaryOptions } from './plan-format'

/** The options of an English reader in kilograms, with 90 s of default rest. */
let options: SummaryOptions

beforeEach(() => {
  // i18n.t: the same translate function the components get from useTranslation()
  options = { language: 'en', weightUnit: 'kg', defaultRestSeconds: 90, t: i18n.t }
})

describe('itemSummary', () => {
  it('sums up the working sets, the weight and the rest, warm-ups apart', () => {
    const item = testPlanItem()

    expect(itemSummary(item, options)).toBe('4 × 8–10 · 80 kg · 90 sec')
    expect(warmUpCount(item.sets)).toBe(2)
  })

  it('writes numbers and units in the reader\'s language and unit', async () => {
    await i18n.changeLanguage('it')
    const item = testPlanItem({ sets: [testPlanSet({ target_weight_kg: '82.500', target_rpe: '8.5' })], rest_seconds: 120 })

    expect(itemSummary(item, { ...options, language: 'it', t: i18n.t })).toBe('1 × 8–10 · 82,5 kg · RPE 8,5 · 2 min')
    expect(itemSummary(item, { ...options, weightUnit: 'lb' })).toBe('1 × 8–10 · 181.88 lb · RPE 8.5 · 2 min')
  })

  it('says when an exercise is done as fast as possible', () => {
    const item = testPlanItem({ for_time: true, sets: [testPlanSet({ target_reps_min: 50, target_reps_max: 50, target_weight_kg: null })] })

    expect(itemSummary(item, options)).toBe('1 × 50 · as fast as possible · 90 sec')
  })

  it('lists each set when they ask for different things', () => {
    const item = testPlanItem({
      rest_seconds: null,
      sets: [
        testPlanSet({ target_reps_min: 10, target_reps_max: 10, target_weight_kg: '60.000' }),
        testPlanSet({ target_reps_min: 8, target_reps_max: 8, target_weight_kg: '70.000' }),
        testPlanSet({ set_type: 'failure', target_reps_min: null, target_reps_max: null, target_weight_kg: '70.000' }),
      ],
    })

    // The user's default rest, since the exercise has none
    expect(itemSummary(item, { ...options, defaultRestSeconds: 150 })).toBe('3 × 10/8/max · 60–70 kg · 150 sec')
  })

  it('counts the sets when none has a target', () => {
    const item = testPlanItem({
      exercise: testExercise({ logging_type: 'reps' }),
      sets: [testPlanSet({ target_reps_min: null, target_reps_max: null }), testPlanSet({ target_reps_min: null, target_reps_max: null })],
    })

    // Logged by reps: no weight, even if a set had one
    expect(itemSummary(item, options)).toBe('2 sets · 90 sec')
  })

  it('shows times and distances for the exercises logged that way', () => {
    const plank = testPlanItem({ exercise: testExercise({ logging_type: 'time' }), sets: [testPlanSet({ target_duration_seconds: 60 })] })
    const run = testPlanItem({ exercise: testExercise({ logging_type: 'distance' }), sets: [testPlanSet({ target_distance_meters: 1500 })] })

    expect(itemSummary(plank, options)).toBe('1 × 1 min · 90 sec')
    expect(itemSummary(run, options)).toBe('1 × 1.5 km · 90 sec')
  })
})

describe('formatSeconds', () => {
  it('says whole minutes as minutes, anything else as seconds', () => {
    expect(formatSeconds(45, 'it')).toBe('45 s')
    expect(formatSeconds(180, 'it')).toBe('3 min')
    expect(formatSeconds(90, 'de')).toBe('90 Sek.')
  })
})

describe('groupSupersets', () => {
  it('joins neighbours with the same number, and leaves the others alone', () => {
    // Two lone exercises next to each other stay two blocks: "no group" is
    // not a group
    const items = [1, 1, null, null, 2, 2].map((group, index) => testPlanItem({ id: `item-${index}`, superset_group: group }))

    const blocks = groupSupersets(items).map(block => [block.group, block.items.map(item => item.id)])

    expect(blocks).toEqual([
      [1, ['item-0', 'item-1']],
      [null, ['item-2']],
      [null, ['item-3']],
      [2, ['item-4', 'item-5']],
    ])
  })
})
