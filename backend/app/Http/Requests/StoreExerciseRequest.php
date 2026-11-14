<?php

namespace App\Http\Requests;

use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/exercises: a new personal exercise, texts in the user's language:
 *
 *     {
 *       "name": "Panca mia",
 *       "aliases": ["panca stretta"],
 *       "description": "…",
 *       "instructions": ["Sdraiati sulla panca.", "Abbassa il bilanciere."],
 *       "logging_type": "weight_reps",
 *       "equipment_id": 1,
 *       "youtube_url": "https://youtu.be/…",
 *       "muscles": [{"id": 6, "role": "primary"}, {"id": 17, "role": "secondary"}]
 *     }
 *
 * Only `name` is required. Photos have endpoints of their own
 * (ExercisePhotoController).
 */
class StoreExerciseRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'aliases' => ['nullable', 'array', 'max:10'],
            'aliases.*' => ['string', 'max:100', 'distinct'],
            'description' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'array', 'max:30'],
            'instructions.*' => ['string', 'max:1000'],
            'logging_type' => [Rule::enum(LoggingType::class)],
            'equipment_id' => ['nullable', 'integer', 'exists:equipment,id'],
            // YouTube only: the editor embeds its preview
            'youtube_url' => ['nullable', 'url', 'max:255', 'regex:#^https://(www\.|m\.)?(youtube\.com|youtu\.be)/#i'],
            // There are 17 muscles
            'muscles' => ['nullable', 'array', 'max:17'],
            // The pivot's primary key allows a muscle once
            'muscles.*.id' => ['required', 'integer', 'distinct', 'exists:muscles,id'],
            'muscles.*.role' => ['required', Rule::enum(MuscleRole::class)],
        ];
    }
}
