<?php

namespace App\Http\Resources;

// Imports: the model it describes, the request, and Laravel's base resource
use App\Models\PlanDay;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of one day of a plan, inside PlanResource:
 *
 *     { "id": "0192f4a7-…", "name": "Day A – Push", "items": [ … ] }
 *
 * No `position`: the order of the list is the order of the days, and the
 * editor sends them back in the same way (PlanRequest).
 *
 * @mixin PlanDay
 */
class PlanDayResource extends JsonResource
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
            'id' => $this->id,
            'name' => $this->name,
            'items' => PlanItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
