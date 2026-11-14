<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /api/sessions/last-sets?exercises=12,40,7: the exercises of the day about
 * to be done.
 */
class LastSetsRequest extends FormRequest
{
    /**
     * At most 50 ids.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'exercises' => ['required', 'string', 'max:500', 'regex:/^\d+(,\d+){0,49}$/'],
        ];
    }

    /**
     * @return list<int> without repeats
     */
    public function exerciseIds(): array
    {
        return array_values(array_unique(array_map('intval', explode(',', (string) $this->query('exercises')))));
    }
}
