<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /api/plans:
 *
 *     /api/plans              the plans in use
 *     /api/plans?archived=1   the archived ones
 *
 * A user has a handful of plans: no pages, no search.
 */
class ListPlansRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'archived' => ['sometimes', 'boolean'],
        ];
    }

    public function wantsArchived(): bool
    {
        return $this->boolean('archived');
    }
}
