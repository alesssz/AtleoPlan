<?php

namespace App\Actions\Plans;

// Imports: the action that creates a personal exercise, the models, the
// Collection type, the DB facade for the transaction, and Str for text
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
 * ImportPlanRequest (docs/design/D3-data-model.md D3.5.8).
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
 *
 * An action (docs/concepts/C2-backend.md C2.5.3), created with
 * `make:class Actions/Plans/ImportPlan`. How it works: C2.5.8; how it was
 * built: docs/how-to/H3-frontend.md H3.26.
 */
class ImportPlan
{
    /**
     * The two actions it builds on, given by Laravel's service container
     * (a constructor's parameters with a class type are created for it).
     * `private` in the constructor's list declares the properties too.
     *
     * @param  SavePlan  $savePlan  saves the plan
     * @param  SavePersonalExercise  $saveExercise  creates a missing exercise
     */
    public function __construct(
        private SavePlan $savePlan,
        private SavePersonalExercise $saveExercise,
    ) {}

    /**
     * Imports the file's plan for $user.
     *
     * @param  User  $user  the owner of the new plan, the signed-in user
     * @param  array<string, mixed>  $file  the validated file
     * @return array{plan: Plan, created: list<string>} the new plan, and the
     *                                                  names of the exercises created
     */
    public function import(User $user, array $file): array
    {
        // All or nothing: a failure halfway leaves no exercise created for
        // a plan that does not exist. SavePlan and SavePersonalExercise
        // open transactions of their own inside it: Laravel makes them
        // savepoints of this one
        return DB::transaction(function () use ($user, $file) {
            // The references the plan uses, each once. collect() makes a
            // Collection of a plain array; flatMap() maps each day to its
            // items' references (array_column() takes one key of each
            // item) and joins the lists into one; unique() drops repeats
            $used = collect($file['plan']['days'])
                ->flatMap(fn (array $day) => array_column($day['items'], 'exercise'))
                ->unique();
            // The user's own exercises, read once; those created are added,
            // so a second reference to the same name finds the first
            $own = $user->exercises()->get();
            // The names of the exercises created, for the report
            $created = [];
            // The id on this server of each reference: ['e1' => 640, …]
            $ids = [];

            foreach ($file['exercises'] as $data) {
                // Described but not used by the plan: not looked for, not created
                if (! $used->contains($data['ref'])) {
                    continue;
                }
                // The exercise here, found or else created
                $exercise = $this->find($own, $data);
                if ($exercise === null) {
                    $exercise = $this->create($user, $data);
                    $own->push($exercise);
                    $created[] = $exercise->name;
                }
                $ids[$data['ref']] = $exercise->id;
            }

            // The plan as SavePlan takes it from the editor, without ids:
            // the file's items name a reference, the plan an exercise id
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
     * The exercise of this server that is the file's one, by the rules above.
     *
     * @param  Collection<int, Exercise>  $own  the user's own exercises
     * @param  array<string, mixed>  $data  the file's description of it
     * @return Exercise|null null when it is not here
     */
    private function find(Collection $own, array $data): ?Exercise
    {
        // 1. A public exercise with the same external id
        // empty(): true for a missing key, null or "", without a warning
        if (! empty($data['external_id'])) {
            // The public exercise with that id; null when this server lacks it
            $public = Exercise::query()->whereNull('owner_id')->where('external_id', $data['external_id'])->first();
            if ($public !== null) {
                return $public;
            }
        }

        // The name as compared: lower case, without spaces around it
        $name = Str::lower(trim($data['name']));

        // 2. One of the user's own, under any of its names. first() with a
        // function: the first exercise for which it returns true
        $mine = $own->first(fn (Exercise $exercise) => collect($exercise->getTranslations('name'))
            ->contains(fn (string $translation) => Str::lower(trim($translation)) === $name));
        if ($mine !== null) {
            return $mine;
        }

        // 3. A public exercise with this name in the request's language. The
        // name column is JSON, {"en": …, "it": …}: `->>` reads one key as text
        return Exercise::query()
            ->whereNull('owner_id')
            ->whereRaw('lower(trim(name->>?)) = ?', [app()->getLocale(), $name])
            ->first();
    }

    /**
     * Creates the file's exercise as the user's own, without photos.
     *
     * @param  User  $user  the owner
     * @param  array<string, mixed>  $data  the file's description of it
     * @return Exercise the new exercise
     */
    private function create(User $user, array $data): Exercise
    {
        // The slugs this server knows, as ids; the others left out.
        // pluck('id', 'slug'): a Collection of ids keyed by slug,
        // ['chest' => 4, …], so has() and [] find a muscle by its slug
        $muscleIds = Muscle::query()->whereIn('slug', array_column($data['muscles'] ?? [], 'muscle'))->pluck('id', 'slug');

        return $this->saveExercise->create($user, [
            'name' => trim($data['name']),
            'description' => $data['description'] ?? null,
            'instructions' => $data['instructions'] ?? null,
            'logging_type' => $data['logging_type'],
            // value('id'): one column of the first row found, or null
            'equipment_id' => isset($data['equipment']) ? Equipment::query()->where('slug', $data['equipment'])->value('id') : null,
            'youtube_url' => $data['youtube_url'] ?? null,
            'muscles' => collect($data['muscles'] ?? [])
                ->filter(fn (array $muscle) => $muscleIds->has($muscle['muscle']))
                ->map(fn (array $muscle) => ['id' => $muscleIds[$muscle['muscle']], 'role' => $muscle['role']])
                // A muscle listed twice in the file: once, or the pivot
                // table's key (exercise, muscle) would refuse the second
                ->unique('id')
                ->values()
                ->all(),
        ]);
    }
}
