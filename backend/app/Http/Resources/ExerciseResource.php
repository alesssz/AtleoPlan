<?php

namespace App\Http\Resources;

use App\Enums\MuscleRole;
use App\Models\Exercise;
use App\Models\Muscle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of an exercise, the same in the library's list and in the
 * details page:
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
 * The texts are in the request's language, falling back to English, then to any
 * language there is. The import's columns (level, category, external_id,
 * machine_translated) are not sent: the app does not show them yet. Videos come
 * in phase 2.
 *
 * @mixin Exercise
 */
class ExerciseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // A field with no text in any language reads as ''
            'aliases' => $this->aliases ?: [],
            'description' => $this->description ?: null,
            'instructions' => $this->instructions ?: [],
            'logging_type' => $this->logging_type,
            'youtube_url' => $this->youtube_url,
            // The Mine badge and the Edit button
            'is_mine' => $this->isOwnedBy($request->user()),
            // Relations only when the controller loaded them: a resource
            // never queries by itself, which would be one query per row
            'equipment' => $this->whenLoaded('equipment', fn () => $this->equipment
                ? new EquipmentResource($this->equipment)
                : null),
            'muscles' => $this->whenLoaded('muscles', fn () => $this->muscles
                // Primary muscles first, then by name
                ->sortBy(fn (Muscle $muscle) => [$muscle->pivot->role !== MuscleRole::Primary, $muscle->name])
                ->map(fn (Muscle $muscle) => [
                    'id' => $muscle->id,
                    'slug' => $muscle->slug,
                    'name' => $muscle->name,
                    'role' => $muscle->pivot->role,
                ])
                // A JSON list, not an object keyed by the old indexes
                ->values()),
            // The cover first. getMedia() reads the loaded `media` relation
            'photos' => $this->whenLoaded('media', fn () => ExercisePhotoResource::collection($this->getMedia('photos')->values())),
        ];
    }
}
