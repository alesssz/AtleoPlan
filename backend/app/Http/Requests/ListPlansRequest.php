<?php

namespace App\Http\Requests;

// Imports: Laravel's base Form Request
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the query string of GET /api/plans, the plan list
 * (docs/design/D1-ui.md D1.4.6):
 *
 *     /api/plans              the plans in use
 *     /api/plans?archived=1   the archived ones, behind their own filter
 *
 * A user has a handful of plans, so the list has no pages and no search.
 * On a GET, the rules read the query string (docs/concepts/C2-backend.md C2.5.2).
 */
class ListPlansRequest extends FormRequest
{
    /**
     * The rules: `archived` is optional, 1 or 0 (also true or false).
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'archived' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Whether the archived plans were asked for.
     */
    public function wantsArchived(): bool
    {
        // boolean(): the parameter as true or false; false when missing
        return $this->boolean('archived');
    }
}
