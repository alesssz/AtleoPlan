<?php

namespace App\Actions\Plans;

// Imports: the models it reads
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;

/**
 * A plan as a file: the shape of GET /api/plans/{plan}/export, which the app
 * saves as `<plan>.atleoplan.json` and ImportPlan reads back, on the same
 * server or another (docs/design/D3-data-model.md D3.5.8):
 *
 *     {
 *       "format": "atleoplan.plan", "version": 1,
 *       "exported_at": "2026-11-10T14:00:00.000000Z",
 *       "plan": {
 *         "name": "Calisthenics", "goal": null, "notes": null,
 *         "days": [
 *           { "name": "Day A", "items": [
 *             { "exercise": "e1", "superset_group": null, "rest_seconds": 90,
 *               "notes": null, "for_time": true,
 *               "sets": [ { "set_type": "normal", "target_reps_min": 50, "target_reps_max": 50,
 *                           "target_weight_kg": null, "target_rpe": null,
 *                           "target_duration_seconds": null, "target_distance_meters": null } ] }
 *           ] }
 *         ]
 *       },
 *       "exercises": [
 *         { "ref": "e1", "external_id": "Pushups", "name": "Push-ups",
 *           "logging_type": "reps", "equipment": "body-only",
 *           "muscles": [ { "muscle": "chest", "role": "primary" } ],
 *           "description": null, "instructions": ["…"], "youtube_url": null }
 *       ]
 *     }
 *
 * - **No ids of this server.** Days, items and sets have none: an import
 *   makes new ones. The exercises are named by a reference of the file,
 *   `e1`, `e2`…, listed once each in `exercises`.
 * - **Each exercise described in full** (no photos): the import uses an
 *   exercise already there when it finds one, and creates one from this
 *   description when it does not. `external_id` is there for a public
 *   exercise only, the id of free-exercise-db or `AtleoPlan_…`
 *   (D3.4.6), the same on every server.
 * - **Texts in the request's language,** the app's (Accept-Language): the
 *   name, description and instructions, as the user reads them.
 * - **`format` and `version`** let a later version of the app read an older
 *   file, or refuse a file that is not a plan.
 *
 * An action (docs/concepts/C2-backend.md C2.5.3): one job of the app in a
 * class of its own, out of the controller, testable and reusable. Created
 * with `make:class Actions/Plans/ExportPlan`; PlanController::export()
 * receives it as a parameter, built by Laravel's service container. How it
 * works: C2.5.8; how it was built: docs/how-to/H3-frontend.md H3.26.
 */
class ExportPlan
{
    /** What the file is: checked by the import. */
    public const FORMAT = 'atleoplan.plan';

    /** The version of the file's shape: 1 until a change breaks it. */
    public const VERSION = 1;

    /**
     * The plan as the file's content.
     *
     * @param  Plan  $plan  the plan; the policy has checked it is the user's
     * @return array<string, mixed> the content, which Laravel turns into JSON
     */
    public function export(Plan $plan): array
    {
        // Everything the file needs, in a few queries (eager loading, C2.6):
        // without it, every item would ask the database for its exercise on
        // its own. loadMissing() loads only the relations not loaded yet
        $plan->loadMissing(['days.items.sets', 'days.items.exercise.equipment', 'days.items.exercise.muscles']);

        // The exercises met so far, by their id on this server: their
        // reference and description. Filled while the days are read
        $exercises = [];

        // The days, as the file writes them. `$plan->days` is a Collection,
        // Laravel's list with methods: map() gives a new Collection of what
        // the function returns for each day, all() turns it into a plain
        // PHP array, which becomes a JSON list.
        // Two functions, each with `use (&$exercises)`: it receives the array
        // itself, not a copy, so what the inner one adds stays. An arrow
        // function (`fn () =>`) would not do for the outer one: it captures
        // the variables it uses by value, so the inner function would fill
        // a copy, lost at each day (docs/how-to/H3-frontend.md H3.26.2)
        $days = $plan->days->map(function (PlanDay $day) use (&$exercises) {
            return [
                'name' => $day->name,
                'items' => $day->items->map(function (PlanItem $item) use (&$exercises) {
                    // `??=`: the exercise's entry is made the first time only;
                    // a second item with the same exercise reuses its reference
                    $exercises[$item->exercise_id] ??= $this->exercise($item->exercise, 'e'.(count($exercises) + 1));

                    return [
                        'exercise' => $exercises[$item->exercise_id]['ref'],
                        'superset_group' => $item->superset_group,
                        'rest_seconds' => $item->rest_seconds,
                        'notes' => $item->notes,
                        'for_time' => $item->for_time,
                        // The sets, each with its set_type as its text: the
                        // model holds the enum SetType, `->value` is "normal"
                        'sets' => $item->sets->map(fn (PlanSet $set) => [
                            'set_type' => $set->set_type->value,
                            'target_reps_min' => $set->target_reps_min,
                            'target_reps_max' => $set->target_reps_max,
                            // The decimals are exact text in the model ("80.000");
                            // numbers in the file, as the editor sends them.
                            // (float): PHP's cast, text to a decimal number
                            'target_weight_kg' => $set->target_weight_kg === null ? null : (float) $set->target_weight_kg,
                            'target_rpe' => $set->target_rpe === null ? null : (float) $set->target_rpe,
                            'target_duration_seconds' => $set->target_duration_seconds,
                            'target_distance_meters' => $set->target_distance_meters,
                        ])->all(),
                    ];
                })->all(),
            ];
        })->all();

        return [
            'format' => self::FORMAT,
            'version' => self::VERSION,
            // now(): the current moment (a Carbon date); toJSON(), ISO 8601 text
            'exported_at' => now()->toJSON(),
            'plan' => [
                'name' => $plan->name,
                'goal' => $plan->goal,
                'notes' => $plan->notes,
                'days' => $days,
            ],
            // array_values(): a list, without this server's ids as keys
            'exercises' => array_values($exercises),
        ];
    }

    /**
     * One exercise, described for the file.
     *
     * @param  Exercise  $exercise  the exercise of an item (a deleted one too)
     * @param  string  $ref  its reference in the file
     * @return array<string, mixed>
     */
    private function exercise(Exercise $exercise, string $ref): array
    {
        return [
            'ref' => $ref,
            // Only a public exercise has an id that means something elsewhere
            'external_id' => $exercise->owner_id === null ? $exercise->external_id : null,
            // HasTranslations gives the request's language, or English
            'name' => $exercise->name,
            'logging_type' => $exercise->logging_type->value,
            // `?->`: null when the exercise has no equipment
            'equipment' => $exercise->equipment?->slug,
            // Each muscle with its role, primary or secondary: the role is a
            // column of the pivot table exercise_muscle, which a
            // many-to-many relation exposes as `$muscle->pivot` (D3.4.3)
            'muscles' => $exercise->muscles->map(fn (Muscle $muscle) => [
                'muscle' => $muscle->slug,
                'role' => $muscle->pivot->role->value,
            ])->values()->all(),
            'description' => $exercise->description,
            // A list of steps; none: an empty list rather than null
            'instructions' => $exercise->instructions ?? [],
            'youtube_url' => $exercise->youtube_url,
        ];
    }
}
