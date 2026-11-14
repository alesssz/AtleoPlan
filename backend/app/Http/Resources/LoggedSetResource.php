<?php

namespace App\Http\Resources;

use App\Models\LoggedSet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of one completed set, inside SessionExerciseResource:
 *
 *     { "id": "0192…", "set_type": "normal", "weight_kg": "80.000", "reps": 8,
 *       "duration_seconds": null, "distance_meters": null,
 *       "completed_at": "2026-11-09T17:06:30.000000Z" }
 *
 * The weight is exact text in kilograms, as in a plan's sets (PlanSetResource);
 * moments are in UTC.
 *
 * @mixin LoggedSet
 */
class LoggedSetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'set_type' => $this->set_type,
            'weight_kg' => $this->weight_kg,
            'reps' => $this->reps,
            'duration_seconds' => $this->duration_seconds,
            'distance_meters' => $this->distance_meters,
            'completed_at' => $this->completed_at,
        ];
    }
}
