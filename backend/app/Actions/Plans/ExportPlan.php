<?php

namespace App\Actions\Plans;

use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;

/**
 * A plan as a file: the shape of GET /api/plans/{plan}/export, which the app
 * saves as `<plan>.atleoplan.json` and ImportPlan reads back, on the same
 * server or another:
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
 *   description when it does not. `external_id` is there for a public exercise
 *   only, the id of free-exercise-db or `AtleoPlan_…`,
 * the same on every server.
 * - **Texts in the request's language,** the app's (Accept-Language): the
 *   name, description and instructions, as the user reads them.
 * - **`format` and `version`** let a later version of the app read an older
 *   file, or refuse a file that is not a plan.
 */
class ExportPlan
{
    public const FORMAT = 'atleoplan.plan';

    /** Raised only by a change that breaks the shape. */
    public const VERSION = 1;

    /**
     * @return array<string, mixed>
     */
    public function export(Plan $plan): array
    {
        $plan->loadMissing(['days.items.sets', 'days.items.exercise.equipment', 'days.items.exercise.muscles']);

        // By id on this server: reference and description, filled while the
        // days are read
        $exercises = [];

        // Closures by reference: an arrow function would capture a copy of
        // $exercises, and the inner one would fill a copy lost at each day
        $days = $plan->days->map(function (PlanDay $day) use (&$exercises) {
            return [
                'name' => $day->name,
                'items' => $day->items->map(function (PlanItem $item) use (&$exercises) {
                    // A second item with the same exercise reuses its reference
                    $exercises[$item->exercise_id] ??= $this->exercise($item->exercise, 'e'.(count($exercises) + 1));

                    return [
                        'exercise' => $exercises[$item->exercise_id]['ref'],
                        'superset_group' => $item->superset_group,
                        'rest_seconds' => $item->rest_seconds,
                        'notes' => $item->notes,
                        'for_time' => $item->for_time,
                        'sets' => $item->sets->map(fn (PlanSet $set) => [
                            'set_type' => $set->set_type->value,
                            'target_reps_min' => $set->target_reps_min,
                            'target_reps_max' => $set->target_reps_max,
                            // Numbers in the file, as the editor sends them
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
            'exported_at' => now()->toJSON(),
            'plan' => [
                'name' => $plan->name,
                'goal' => $plan->goal,
                'notes' => $plan->notes,
                'days' => $days,
            ],
            // A list, without this server's ids as keys
            'exercises' => array_values($exercises),
        ];
    }

    /**
     * @param  Exercise  $exercise  possibly deleted since
     * @return array<string, mixed>
     */
    private function exercise(Exercise $exercise, string $ref): array
    {
        return [
            'ref' => $ref,
            // Only a public exercise's id means something on another server
            'external_id' => $exercise->owner_id === null ? $exercise->external_id : null,
            'name' => $exercise->name,
            'logging_type' => $exercise->logging_type->value,
            'equipment' => $exercise->equipment?->slug,
            'muscles' => $exercise->muscles->map(fn (Muscle $muscle) => [
                'muscle' => $muscle->slug,
                'role' => $muscle->pivot->role->value,
            ])->values()->all(),
            'description' => $exercise->description,
            'instructions' => $exercise->instructions ?? [],
            'youtube_url' => $exercise->youtube_url,
        ];
    }
}
