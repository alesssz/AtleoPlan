<?php

namespace Database\Seeders;

// Imports: the action that saves a whole plan, the models it reads, and
// Laravel's base Seeder
use App\Actions\Plans\SavePlan;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Gives every user with no plans two example plans, for trying the plan
 * screens on the development database (docs/how-to/H3-frontend.md H3.13.1):
 *
 * - **Push Pull Legs**, three days, made the active plan: warm-ups, ranges
 *   of reps, a superset on two of the days, a pyramid, pull-ups to failure;
 * - **Full body**, one day, archived.
 *
 * Development data only, never run on the server. It is not called by
 * DatabaseSeeder: it needs the public library, which `make exercises-import`
 * fills after `make fresh`. Run it by hand, after the import:
 *
 *     make plans-demo
 *
 * which is `make artisan c="db:seed --class=DemoPlanSeeder"`.
 *
 * It writes through SavePlan, the action behind POST /api/plans, so the
 * plans are exactly what the API would have saved (docs/concepts/C2-backend.md
 * C2.5.5). It can run again: users who already have a plan are skipped.
 */
class DemoPlanSeeder extends Seeder
{
    /**
     * The exercises the plans use, by their id in free-exercise-db
     * (exercises.external_id): the name used below => that id.
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

    /**
     * Writes the two plans for each user who has none.
     *
     * Laravel calls run(), and fills its parameters from the service
     * container, as it does for a controller's: SavePlan arrives built.
     *
     * @param  SavePlan  $save  the action that saves a whole plan
     */
    public function run(SavePlan $save): void
    {
        // The exercises' ids in this database: external_id => id.
        // pluck('id', 'external_id') reads two columns into such an array
        $ids = Exercise::query()->whereIn('external_id', self::EXERCISES)->pluck('id', 'external_id');

        // array_diff(): the external ids not found. With any missing, nothing
        // is written: the library has not been imported yet
        $missing = array_diff(self::EXERCISES, $ids->keys()->all());
        if ($missing !== []) {
            // $this->command: the Artisan command running the seeder, to
            // print with; warn() prints in yellow
            $this->command->warn('The exercise library is not imported: run `make exercises-import` first. Missing: '.implode(', ', $missing));

            return;
        }

        // The id of each exercise by the short name used in the plans
        $exercise = fn (string $name): int => $ids[self::EXERCISES[$name]];

        // doesntHave('plans'): only the users with no plan at all
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
     * The body of "Push Pull Legs", as the plan editor would send it.
     *
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
     * The body of "Full body", one day of three exercises.
     *
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
     * One exercise of a day, as the editor sends it.
     *
     * Each set is a short list, [fewest reps, most reps, kilograms, type],
     * the type `normal` when left out: [8, 10, 80] is 8–10 reps at 80 kg.
     * The named arguments (`rest: 120`) say which optional value is which.
     *
     * @param  int  $exerciseId  the exercise's id
     * @param  list<array{0: int|null, 1: int|null, 2: int|float|null, 3?: string}>  $sets  the sets
     * @param  int|null  $rest  the rest after each set, in seconds; null: the user's default
     * @param  int|null  $superset  the superset's number; null: not in one
     * @param  string|null  $notes  the user's notes
     * @return array<string, mixed>
     */
    private function item(int $exerciseId, array $sets, ?int $rest = 90, ?int $superset = null, ?string $notes = null): array
    {
        return [
            'exercise_id' => $exerciseId,
            'superset_group' => $superset,
            'rest_seconds' => $rest,
            'notes' => $notes,
            // array_map(): the same function on each set, giving a new list
            'sets' => array_map(fn (array $set) => [
                'set_type' => $set[3] ?? 'normal',
                'target_reps_min' => $set[0],
                'target_reps_max' => $set[1],
                'target_weight_kg' => $set[2],
            ], $sets),
        ];
    }
}
