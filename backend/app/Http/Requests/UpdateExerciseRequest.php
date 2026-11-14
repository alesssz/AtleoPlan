<?php

namespace App\Http\Requests;

/**
 * PATCH /api/exercises/{exercise}: StoreExerciseRequest's rules with every
 * top-level field optional, so the app sends only what changed. A field sent
 * must still pass: `"name": ""` is refused.
 */
class UpdateExerciseRequest extends StoreExerciseRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        // List items (aliases.*) are checked only when their list is sent
        foreach ($rules as $field => &$fieldRules) {
            if (! str_contains($field, '.')) {
                array_unshift($fieldRules, 'sometimes');
            }
        }
        unset($fieldRules);

        return $rules;
    }
}
