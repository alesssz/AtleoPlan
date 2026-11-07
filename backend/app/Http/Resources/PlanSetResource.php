<?php

namespace App\Http\Resources;

// Imports: the model it describes, the request, and Laravel's base resource
use App\Models\PlanSet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of one planned set, inside PlanItemResource:
 *
 *     {
 *       "set_type": "warm_up",
 *       "target_reps_min": 10,
 *       "target_reps_max": 10,
 *       "target_weight_kg": "40.000",
 *       "target_rpe": null,
 *       "target_duration_seconds": null,
 *       "target_distance_meters": null
 *     }
 *
 * - **No id:** a set's id changes on every save (SavePlan), so the app has no
 *   use for it. The order of the list is the order of the sets.
 * - **The weight and the RPE are text**, "40.000" and "8.5": the decimal cast
 *   keeps them exact (docs/design/D3-data-model.md D3.11), as for the user's
 *   weight_step. The app reads them with Number(); it sends numbers back.
 * - **Kilograms always**: the app converts to pounds for showing, when the
 *   user chose them (D3.2.3).
 *
 * @mixin PlanSet
 */
class PlanSetResource extends JsonResource
{
    /**
     * The fields to send.
     *
     * @param  Request  $request  the current request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // The enum becomes its string in JSON: "warm_up"
            'set_type' => $this->set_type,
            'target_reps_min' => $this->target_reps_min,
            'target_reps_max' => $this->target_reps_max,
            'target_weight_kg' => $this->target_weight_kg,
            'target_rpe' => $this->target_rpe,
            'target_duration_seconds' => $this->target_duration_seconds,
            'target_distance_meters' => $this->target_distance_meters,
        ];
    }
}
