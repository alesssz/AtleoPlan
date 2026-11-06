<?php

namespace App\Http\Resources;

// Imports: the model it describes, the request, and Laravel's base resource
use App\Models\Muscle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of a muscle group: `{ "id": 6, "slug": "chest", "name": "Petto" }`.
 *
 * An API Resource (docs/concepts/C2-backend.md C2.5): the list of fields sent
 * to the React app, written out one by one. `name` is in the request's
 * language, thanks to HasTranslations on the model.
 *
 * @mixin Muscle
 */
class MuscleResource extends JsonResource
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
