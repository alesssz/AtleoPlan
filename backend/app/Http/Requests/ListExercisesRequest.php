<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /api/exercises:
 *
 *     /api/exercises?filter[search]=panca&filter[muscle]=chest,triceps
 *         &filter[equipment]=barbell&filter[source]=mine&page=2&per_page=50
 *
 * spatie/laravel-query-builder refuses unknown filter names with a 400; this
 * checks the values, so a wrong one gets a clear 422 rather than an error
 * deeper down.
 */
class ListExercisesRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'filter' => ['sometimes', 'array'],
            'filter.search' => ['sometimes', 'nullable', 'string', 'max:100'],
            // Slugs, comma-separated: chest,triceps
            'filter.muscle' => ['sometimes', 'string', 'max:255'],
            'filter.equipment' => ['sometimes', 'string', 'max:255'],
            'filter.source' => ['sometimes', 'in:mine,public'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ];
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 50);
    }
}
