<?php

namespace App\Http\Requests;

// Imports: Laravel's base Form Request
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the query string of GET /api/sessions, the user's workouts:
 *
 *     /api/sessions                    all, the most recent first
 *     /api/sessions?status=open        those still in progress (Home's banner)
 *     /api/sessions?status=finished    history (FEAT-4)
 *     …&page=2&per_page=20
 *
 * On a GET, the rules read the query string (docs/concepts/C2-backend.md C2.5.2).
 */
class ListSessionsRequest extends FormRequest
{
    /**
     * The rules: every parameter is optional.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:open,finished'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ];
    }

    /**
     * How many sessions per page: `per_page`, 20 when not given.
     */
    public function perPage(): int
    {
        return $this->integer('per_page', 20);
    }
}
