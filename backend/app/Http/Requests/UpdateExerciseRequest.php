<?php

namespace App\Http\Requests;

/**
 * Validates PATCH /api/exercises/{exercise}: changes to a personal exercise.
 *
 * The same rules as StoreExerciseRequest, which this class extends (inherits
 * from), with `sometimes` in front of each top-level field: a field is checked
 * only when it is sent, so the app may send just the fields that changed.
 * A field that is sent must still pass its rules, so `"name": ""` is refused.
 */
class UpdateExerciseRequest extends StoreExerciseRequest
{
    /**
     * The rules of StoreExerciseRequest, each top-level field made optional.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // parent::rules(): the rules of the class this one extends
        $rules = parent::rules();

        // `&$fieldRules`: a reference, so changing it changes the array itself.
        // The items of a list (aliases.*, muscles.*.id) need no `sometimes`:
        // they are checked only when their list is sent
        foreach ($rules as $field => &$fieldRules) {
            if (! str_contains($field, '.')) {
                array_unshift($fieldRules, 'sometimes');
            }
        }
        // A reference left behind would be a trap for any later loop
        unset($fieldRules);

        return $rules;
    }
}
