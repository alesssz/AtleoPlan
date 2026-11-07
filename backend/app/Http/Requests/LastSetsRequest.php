<?php

namespace App\Http\Requests;

// Imports: Laravel's base Form Request
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates GET /api/sessions/last-sets?exercises=12,40,7: the exercises of
 * the day about to be done, whose sets of last time workout mode shows in
 * its "Last" column (docs/design/D1-ui.md D1.4.9).
 */
class LastSetsRequest extends FormRequest
{
    /**
     * The rules: a list of exercise ids, separated by commas, at most 50.
     * regex: digits, then any number of ",digits".
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
     * The exercise ids asked for, as whole numbers, without repeats.
     *
     * @return list<int>
     */
    public function exerciseIds(): array
    {
        // explode(): splits the text at each comma; array_map('intval', …)
        // turns every piece into a whole number
        return array_values(array_unique(array_map('intval', explode(',', (string) $this->query('exercises')))));
    }
}
