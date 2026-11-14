<?php

namespace Database\Seeders;

use App\Actions\Plans\SavePlan;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Gives every user with no plans two example plans, for trying the plan screens
 * on the development database:
 *
 * - **Push Pull Legs**, three days, made the active plan: warm-ups, ranges
 *   of reps, a superset on two of the days, a pyramid, pull-ups to failure;
 * - **Full body**, one day, archived.
 *
 * Development data only, run by `make plans-demo`. Not called by
 * DatabaseSeeder: it needs the public library, imported after `make fresh`.
 *
 * Written through SavePlan, so the plans are exactly what the API would have
 * saved. Users who already have a plan are skipped, so it can run again.
 */
class DemoPlanSeeder extends Seeder
{
    /**
     * Short name => free-exercise-db id (exercises.external_id).
     *
     * @var array<string, string>
     */
    private const EXERCISES = [
        'bench' => 'Barbell_Bench_Press_-_Medium_Grip',
        'press' => 'Standing_Military_Press',
        'incline' => 'Incline_Dumbbell_Press',
        'lateral' => 'Side_Lateral_Raise',
        'pushdown' => 'Triceps_Pushdown',
        'deadlift' => 'Barbell_Deadlift',
        'pullup' => 'Pullups',
        'pulldown' => 'Wide-Grip_Lat_Pulldown',
        'cableRow' => 'Seated_Cable_Rows',
        'curl' => 'Barbell_Curl',
        'squat' => 'Barbell_Squat',
        'romanian' => 'Romanian_Deadlift',
        'legPress' => 'Leg_Press',
        'legCurl' => 'Lying_Leg_Curls',
        'calves' => 'Standing_Calf_Raises',
        'row' => 'Bent_Over_Barbell_Row',
    ];

    public function run(SavePlan $save): void
    {
        $ids = Exercise::query()->whereIn('external_id', self::EXERCISES)->pluck('id', 'external_id');

        // Any missing: the library has not been imported yet
        $missing = array_diff(self::EXERCISES, $ids->keys()->all());
        if ($missing !== []) {
            $this->command->warn('The exercise library is not imported: run `make exercises-import` first. Missing: '.implode(', ', $missing));

            return;
        }

        $exercise = fn (string $name): int => $ids[self::EXERCISES[$name]];

        foreach (User::query()->doesntHave('plans')->get() as $user) {
            $ppl = $save->create($user, $this->pushPullLegs($exercise));
            $user->activePlan()->associate($ppl)->save();

            $fullBody = $save->create($user, $this->fullBody($exercise));
            $fullBody->archived_at = now();
            $fullBody->save();

            $this->command->info("Two example plans for {$user->email}.");
        }
    }

    /**
     * @param  callable(string): int  $exercise  an exercise's id by its short name
     * @return array<string, mixed>
     */
    private function pushPullLegs(callable $exercise): array
    {
        return [
            'name' => 'Push Pull Legs',
            'goal' => 'Hypertrophy',
            'notes' => 'Deload every fourth week: same exercises, half the sets.',
            'days' => [
                ['name' => 'Day A – Push', 'items' => [
                    $this->item($exercise('bench'), [[10, 10, 40, 'warm_up'], [10, 10, 40, 'warm_up'], [8, 10, 80], [8, 10, 80], [8, 10, 80], [8, 10, 80]], rest: 120, notes: 'Shoulder blades back and down.'),
                    $this->item($exercise('press'), [[8, 10, 40], [8, 10, 40], [8, 10, 40]]),
                    $this->item($exercise('incline'), [[10, 12, 24], [10, 12, 24], [10, 12, 24]]),
                    // A superset: the two exercises in turn, then the rest
                    $this->item($exercise('lateral'), [[12, 15, 8], [12, 15, 8], [12, 15, 8]], rest: 0, superset: 1),
                    $this->item($exercise('pushdown'), [[12, 12, 25], [12, 12, 25], [12, 12, 25]], rest: 60, superset: 1),
                ]],
                ['name' => 'Day B – Pull', 'items' => [
                    $this->item($exercise('deadlift'), [[8, 8, 60, 'warm_up'], [5, 5, 120], [5, 5, 120], [5, 5, 120]], rest: 180),
                    // Pull-ups to failure: no target, the sets are only counted
                    $this->item($exercise('pullup'), [[null, null, null, 'failure'], [null, null, null, 'failure'], [null, null, null, 'failure']], rest: 120),
                    $this->item($exercise('pulldown'), [[10, 12, 50], [10, 12, 50], [10, 12, 50]]),
                    $this->item($exercise('cableRow'), [[10, 12, 50], [10, 12, 50], [10, 12, 50]]),
                    // A pyramid: each set asks for something else
                    $this->item($exercise('curl'), [[12, 12, 25], [10, 10, 30], [8, 8, 35]], rest: 60),
                ]],
                ['name' => 'Day C – Legs', 'items' => [
                    $this->item($exercise('squat'), [[10, 10, 60, 'warm_up'], [6, 8, 100], [6, 8, 100], [6, 8, 100], [6, 8, 100]], rest: 180),
                    $this->item($exercise('romanian'), [[8, 10, 80], [8, 10, 80], [8, 10, 80]], rest: 120),
                    $this->item($exercise('legPress'), [[12, 12, 150], [12, 12, 150], [12, 12, 150]]),
                    $this->item($exercise('legCurl'), [[12, 12, 35], [12, 12, 35], [12, 12, 35]], rest: 0, superset: 1),
                    $this->item($exercise('calves'), [[15, 15, 60], [15, 15, 60], [15, 15, 60], [15, 15, 60]], rest: 60, superset: 1),
                ]],
            ],
        ];
    }

    /**
     * @param  callable(string): int  $exercise  an exercise's id by its short name
     * @return array<string, mixed>
     */
    private function fullBody(callable $exercise): array
    {
        return [
            'name' => 'Full body',
            'goal' => 'Strength',
            'notes' => null,
            'days' => [
                ['name' => 'Day A', 'items' => [
                    $this->item($exercise('squat'), [[5, 5, 90], [5, 5, 90], [5, 5, 90]], rest: 180),
                    $this->item($exercise('bench'), [[5, 5, 70], [5, 5, 70], [5, 5, 70]], rest: 180),
                    $this->item($exercise('row'), [[8, 8, 60], [8, 8, 60], [8, 8, 60]]),
                ]],
            ],
        ];
    }

    /**
     * Each set is [fewest reps, most reps, kilograms, type], the type
     * `normal` when left out: [8, 10, 80] is 8–10 reps at 80 kg.
     *
     * @param  list<array{0: int|null, 1: int|null, 2: int|float|null, 3?: string}>  $sets
     * @param  int|null  $rest  null: the user's default
     * @return array<string, mixed>
     */
    private function item(int $exerciseId, array $sets, ?int $rest = 90, ?int $superset = null, ?string $notes = null): array
    {
        return [
            'exercise_id' => $exerciseId,
            'superset_group' => $superset,
            'rest_seconds' => $rest,
            'notes' => $notes,
            'sets' => array_map(fn (array $set) => [
                'set_type' => $set[3] ?? 'normal',
                'target_reps_min' => $set[0],
                'target_reps_max' => $set[1],
                'target_weight_kg' => $set[2],
            ], $sets),
        ];
    }
}
