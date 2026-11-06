<?php

namespace App\Http\Requests;

// Imports: Laravel's base Form Request
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the query string of GET /api/exercises, the library's list
 * (docs/design/D1-ui.md D1.4.3):
 *
 *     /api/exercises?filter[search]=panca&filter[muscle]=chest,triceps
 *         &filter[equipment]=barbell&filter[source]=mine&page=2&per_page=50
 *
 * The `filter[...]` parameters are read by spatie/laravel-query-builder in
 * ExerciseController::index (docs/concepts/C2-backend.md C2.5.2). The
 * package refuses unknown filter names by itself, with a 400; this request
 * checks the values, so that a wrong one gets a clear 422 instead of an
 * error deeper in the code. On a GET, the rules read the query string.
 */
class ListExercisesRequest extends FormRequest
{
    /**
     * The rules. Every parameter is optional.
     *
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

    /**
     * How many exercises per page: `per_page`, 50 when not given.
     */
    public function perPage(): int
    {
        // integer(): the parameter as an int, or the default when missing
        return $this->integer('per_page', 50);
    }
}
