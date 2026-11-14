<?php

namespace App\Http\Resources;

use App\Models\PlanItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of one exercise in a day of a plan, inside PlanDayResource:
 *
 *     {
 *       "id": "0192f4a8-…",
 *       "exercise_id": 12,
 *       "superset_group": 1,
 *       "rest_seconds": 90,
 *       "notes": null,
 *       "for_time": false,
 *       "exercise": { …ExerciseResource: name, muscles, photos… },
 *       "sets": [ …PlanSetResource… ]
 *     }
 *
 * `exercise` is the same JSON as in the library (ExerciseResource), so the
 * app shows it with the same components. It is there also when the exercise
 * has been deleted since (PlanItem::exercise() reads deleted ones too).
 * `exercise_id` is repeated outside it because it is what the editor sends
 * back.
 *
 * @mixin PlanItem
 */
class PlanItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'superset_group' => $this->superset_group,
            // null: the user's default rest
            'rest_seconds' => $this->rest_seconds,
            'notes' => $this->notes,
            'for_time' => $this->for_time,
            'exercise' => new ExerciseResource($this->whenLoaded('exercise')),
            'sets' => PlanSetResource::collection($this->whenLoaded('sets')),
        ];
    }
}
