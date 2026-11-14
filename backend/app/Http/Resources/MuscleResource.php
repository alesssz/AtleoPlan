<?php

namespace App\Http\Resources;

use App\Models\Muscle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * `{ "id": 6, "slug": "chest", "name": "Petto" }`, the name in the request's
 * language.
 *
 * @mixin Muscle
 */
class MuscleResource extends JsonResource
{
    /**
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
