<?php

namespace App\Http\Resources;

use App\Models\SessionExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of one exercise of a workout, inside WorkoutSessionResource:
 *
 *     {
 *       "id": "0192…", "exercise_id": 12, "plan_item_id": "0192…",
 *       "superset_group": null, "notes": null,
 *       "exercise": { …ExerciseResource… },
 *       "sets": [ …LoggedSetResource… ]
 *     }
 *
 * `exercise` is there also when the exercise has been deleted since
 * (SessionExercise::exercise() reads deleted ones too).
 *
 * @mixin SessionExercise
 */
class SessionExerciseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'plan_item_id' => $this->plan_item_id,
            'superset_group' => $this->superset_group,
            'notes' => $this->notes,
            'exercise' => new ExerciseResource($this->whenLoaded('exercise')),
            'sets' => LoggedSetResource::collection($this->whenLoaded('sets')),
        ];
    }
}
