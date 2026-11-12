<?php

namespace App\Http\Resources;

// Imports: the enum of the muscles' role, the models it describes, the
// request, and Laravel's base resource. ExercisePhotoResource is in this same
// namespace, so it needs no `use`
use App\Enums\MuscleRole;
use App\Models\Exercise;
use App\Models\Muscle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of an exercise, the same in the library's list and in the
 * details page (docs/design/D1-ui.md D1.4.3, D1.4.4):
 *
 *     {
 *       "id": 12,
 *       "name": "Panca piana con bilanciere",
 *       "aliases": ["panca"],
 *       "description": null,
 *       "instructions": ["Sdraiati sulla panca.", "…"],
 *       "logging_type": "weight_reps",
 *       "youtube_url": null,
 *       "is_mine": false,
 *       "equipment": { "id": 1, "slug": "barbell", "name": "Bilanciere" },
 *       "muscles": [{ "id": 6, "slug": "chest", "name": "Petto", "role": "primary" }, …],
 *       "photos": [{ "id": 1, "url": "/storage/1/conversions/0-large.webp",
 *                    "thumb_url": "/storage/1/conversions/0-thumb.webp" }, …]
 *     }
 *
 * The texts are in the request's language, with HasTranslations' fallback
 * (docs/design/D3-data-model.md D3.4.5). The columns of the import (level,
 * category, external_id, machine_translated) are not sent: the app does not
 * show them yet. Each photo is an ExercisePhotoResource, with its large and
 * small conversions (docs/concepts/C2-backend.md C2.5.9); videos come in phase 2.
 *
 * @mixin Exercise
 */
class ExerciseResource extends JsonResource
{
    /**
     * The fields to send.
     *
     * @param  Request  $request  the current request; its user decides `is_mine`
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // A field with no text in any language reads as '' from
            // HasTranslations; `?:` ("this, or that if empty") gives the app
            // an empty list or null instead
            'aliases' => $this->aliases ?: [],
            'description' => $this->description ?: null,
            'instructions' => $this->instructions ?: [],
            'logging_type' => $this->logging_type,
            'youtube_url' => $this->youtube_url,
            // Whether the signed-in user owns it: the app shows the Mine badge
            // and the Edit button only then (D1.4.3, D1.4.4)
            'is_mine' => $this->isOwnedBy($request->user()),
            // whenLoaded(): the relation is sent only when the controller
            // loaded it with with() or load(). Otherwise the key is left out,
            // and the resource never runs a query by itself (one per row of a
            // list would be the "N+1 queries" problem)
            'equipment' => $this->whenLoaded('equipment', fn () => $this->equipment
                ? new EquipmentResource($this->equipment)
                : null),
            'muscles' => $this->whenLoaded('muscles', fn () => $this->muscles
                // Primary muscles first, then by name. Arrays compare item by
                // item, and false sorts before true
                ->sortBy(fn (Muscle $muscle) => [$muscle->pivot->role !== MuscleRole::Primary, $muscle->name])
                ->map(fn (Muscle $muscle) => [
                    'id' => $muscle->id,
                    'slug' => $muscle->slug,
                    'name' => $muscle->name,
                    'role' => $muscle->pivot->role,
                ])
                // values(): renumbers the keys 0, 1, 2…, so the JSON is a
                // list and not an object with the old keys
                ->values()),
            // The photos, in their order: the first is the cover. `media` is
            // the relation medialibrary adds to the model; getMedia('photos')
            // reads it, so with it loaded there is no query per exercise.
            // ExercisePhotoResource::collection(): one ExercisePhotoResource
            // per photo, with its `url` and its small `thumb_url`
            'photos' => $this->whenLoaded('media', fn () => ExercisePhotoResource::collection($this->getMedia('photos')->values())),
        ];
    }
}
