<?php

namespace App\Actions\Plans;

use App\Actions\Exercises\SavePersonalExercise;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates a plan from a plan file (ExportPlan's shape), already validated by
 * ImportPlanRequest.
 *
 * **The plan is always new:** nothing of the user's is changed or replaced.
 * Its days, items and sets get new ids, as a plan sent without ids does
 * (SavePlan).
 *
 * **Each exercise of the file is looked for first**, in this order:
 * 1. a public exercise with the file's `external_id`: the same exercise of
 *    free-exercise-db or of the project's extras, on any server;
 * 2. one of the user's own exercises with the same name, in any language,
 *    ignoring case and spaces around it: no copy of an exercise they have;
 * 3. a public exercise with the same name in the request's language: an
 *    exercise of one's own in the file that the library has here;
 * 4. none: it is created as the user's own, from the file's description,
 *    without photos (SavePersonalExercise). Its name is in the report.
 * Only the exercises the plan uses are looked for. Deleted exercises never
 * match: a plan would bring them back to life unseen.
 *
 * Equipment and muscles are named by their slugs; one this server does not
 * have is left out, rather than refusing the whole file.
 */
class ImportPlan
{
    public function __construct(
        private SavePlan $savePlan,
        private SavePersonalExercise $saveExercise,
    ) {}

    /**
     * @param  array<string, mixed>  $file  validated
     * @return array{plan: Plan, created: list<string>} the names of the exercises created
     */
    public function import(User $user, array $file): array
    {
        // A failure halfway must not leave exercises created for a plan that
        // does not exist. The nested transactions become savepoints
        return DB::transaction(function () use ($user, $file) {
            $used = collect($file['plan']['days'])
                ->flatMap(fn (array $day) => array_column($day['items'], 'exercise'))
                ->unique();
            // Exercises created are added, so a second reference to the same
            // name finds the first
            $own = $user->exercises()->get();
            $created = [];
            // ['e1' => 640, …]
            $ids = [];

            foreach ($file['exercises'] as $data) {
                if (! $used->contains($data['ref'])) {
                    continue;
                }
                $exercise = $this->find($own, $data);
                if ($exercise === null) {
                    $exercise = $this->create($user, $data);
                    $own->push($exercise);
                    $created[] = $exercise->name;
                }
                $ids[$data['ref']] = $exercise->id;
            }

            // As the editor sends it, without ids
            $plan = $this->savePlan->create($user, [
                'name' => $file['plan']['name'],
                'goal' => $file['plan']['goal'] ?? null,
                'notes' => $file['plan']['notes'] ?? null,
                'days' => array_map(fn (array $day) => [
                    'name' => $day['name'],
                    'items' => array_map(fn (array $item) => [
                        'exercise_id' => $ids[$item['exercise']],
                        'superset_group' => $item['superset_group'] ?? null,
                        'rest_seconds' => $item['rest_seconds'] ?? null,
                        'notes' => $item['notes'] ?? null,
                        'for_time' => $item['for_time'] ?? false,
                        'sets' => $item['sets'],
                    ], $day['items']),
                ], $file['plan']['days']),
            ]);

            return ['plan' => $plan, 'created' => $created];
        });
    }

    /**
     * By the rules of the class comment.
     *
     * @param  Collection<int, Exercise>  $own  the user's own exercises
     * @param  array<string, mixed>  $data
     */
    private function find(Collection $own, array $data): ?Exercise
    {
        // 1
        if (! empty($data['external_id'])) {
            $public = Exercise::query()->whereNull('owner_id')->where('external_id', $data['external_id'])->first();
            if ($public !== null) {
                return $public;
            }
        }

        $name = Str::lower(trim($data['name']));

        // 2. Under any of its names
        $mine = $own->first(fn (Exercise $exercise) => collect($exercise->getTranslations('name'))
            ->contains(fn (string $translation) => Str::lower(trim($translation)) === $name));
        if ($mine !== null) {
            return $mine;
        }

        // 3
        return Exercise::query()
            ->whereNull('owner_id')
            ->whereRaw('lower(trim(name->>?)) = ?', [app()->getLocale(), $name])
            ->first();
    }

    /**
     * As the user's own, without photos.
     *
     * @param  array<string, mixed>  $data
     */
    private function create(User $user, array $data): Exercise
    {
        // ['chest' => 4, …]; unknown slugs are left out
        $muscleIds = Muscle::query()->whereIn('slug', array_column($data['muscles'] ?? [], 'muscle'))->pluck('id', 'slug');

        return $this->saveExercise->create($user, [
            'name' => trim($data['name']),
            'description' => $data['description'] ?? null,
            'instructions' => $data['instructions'] ?? null,
            'logging_type' => $data['logging_type'],
            'equipment_id' => isset($data['equipment']) ? Equipment::query()->where('slug', $data['equipment'])->value('id') : null,
            'youtube_url' => $data['youtube_url'] ?? null,
            'muscles' => collect($data['muscles'] ?? [])
                ->filter(fn (array $muscle) => $muscleIds->has($muscle['muscle']))
                ->map(fn (array $muscle) => ['id' => $muscleIds[$muscle['muscle']], 'role' => $muscle['role']])
                // The pivot's key would refuse a muscle listed twice
                ->unique('id')
                ->values()
                ->all(),
        ]);
    }
}
