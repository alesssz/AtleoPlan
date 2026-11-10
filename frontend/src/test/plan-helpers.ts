/*
 * What the tests of the plan screens share: plans, days, exercises of a plan
 * and sets, shaped as the backend sends them, to put in fakeApi's table
 * (src/test/auth-helpers.tsx). Tests and checks: docs/concepts/C1-frontend.md C1.10.
 *
 * Each builder takes `changes`, the fields to replace:
 * `testPlanSet({ set_type: 'warm_up' })`.
 */
import type { Plan, PlanItem, PlanSet, PlanSummary } from '@/api/plans'
import { testExercise } from './exercise-helpers'

/**
 * A working set of 8–10 reps at 80 kg.
 * @param changes the fields to change
 */
export function testPlanSet(changes: Partial<PlanSet> = {}): PlanSet {
  return {
    set_type: 'normal',
    target_reps_min: 8,
    target_reps_max: 10,
    target_weight_kg: '80.000',
    target_rpe: null,
    target_duration_seconds: null,
    target_distance_meters: null,
    ...changes,
  }
}

/**
 * The bench press in a plan: two warm-ups at 40 kg, then four sets of 8–10
 * at 80 kg, with a 90-second rest.
 * @param changes the fields to change
 */
export function testPlanItem(changes: Partial<PlanItem> = {}): PlanItem {
  return {
    id: 'item-bench',
    exercise_id: 12,
    superset_group: null,
    rest_seconds: 90,
    notes: null,
    for_time: false,
    exercise: testExercise(),
    sets: [
      testPlanSet({ set_type: 'warm_up', target_reps_min: 10, target_reps_max: 10, target_weight_kg: '40.000' }),
      testPlanSet({ set_type: 'warm_up', target_reps_min: 10, target_reps_max: 10, target_weight_kg: '40.000' }),
      testPlanSet(),
      testPlanSet(),
      testPlanSet(),
      testPlanSet(),
    ],
    ...changes,
  }
}

/**
 * A plan in the list: "Push Pull Legs", active, with three days.
 * @param changes the fields to change
 */
export function testPlanSummary(changes: Partial<PlanSummary> = {}): PlanSummary {
  return {
    id: 'plan-ppl',
    name: 'Push Pull Legs',
    goal: 'Hypertrophy',
    notes: null,
    version: 3,
    is_active: true,
    archived_at: null,
    updated_at: '2026-11-07T09:00:00.000000Z',
    days_count: 3,
    ...changes,
  }
}

/**
 * A whole plan with two days. Day A: the bench press, then two exercises in
 * a superset (rows and pull-ups). Day B: a squat.
 * @param changes the fields to change
 */
export function testPlan(changes: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-ppl',
    name: 'Push Pull Legs',
    goal: 'Hypertrophy',
    notes: 'Deload every fourth week.',
    version: 3,
    is_active: false,
    archived_at: null,
    updated_at: '2026-11-07T09:00:00.000000Z',
    days: [
      {
        id: 'day-a',
        name: 'Day A – Push',
        items: [
          testPlanItem({ notes: 'Shoulder blades back' }),
          testPlanItem({
            id: 'item-row',
            exercise_id: 30,
            superset_group: 1,
            rest_seconds: null,
            exercise: testExercise({ id: 30, name: 'Bent Over Barbell Row', photos: [] }),
            sets: [testPlanSet({ target_reps_min: 10, target_reps_max: 10, target_weight_kg: '60.000' }), testPlanSet({ target_reps_min: 8, target_reps_max: 8, target_weight_kg: '70.000' })],
          }),
          testPlanItem({
            id: 'item-pullup',
            exercise_id: 31,
            superset_group: 1,
            exercise: testExercise({ id: 31, name: 'Pullups', logging_type: 'reps', photos: [] }),
            sets: [testPlanSet({ set_type: 'failure', target_reps_min: null, target_reps_max: null, target_weight_kg: null })],
          }),
        ],
      },
      {
        id: 'day-b',
        name: 'Day B – Legs',
        items: [
          testPlanItem({ id: 'item-squat', exercise_id: 40, exercise: testExercise({ id: 40, name: 'Barbell Squat' }), sets: [testPlanSet({ target_reps_min: 5, target_reps_max: 5, target_weight_kg: '100.000' })] }),
        ],
      },
    ],
    ...changes,
  }
}
