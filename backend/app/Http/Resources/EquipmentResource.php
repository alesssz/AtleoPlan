<?php

namespace App\Http\Resources;

// Imports: the model it describes, the request, and Laravel's base resource
use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of a kind of equipment: `{ "id": 1, "slug": "barbell", "name": "Bilanciere" }`.
 * The same shape as MuscleResource, which explains it.
 *
 * @mixin Equipment
 */
class EquipmentResource extends JsonResource
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
            'slug' => $this->slug,
            'name' => $this->name,
        ];
    }
}
