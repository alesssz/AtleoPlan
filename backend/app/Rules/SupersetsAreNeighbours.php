<?php

namespace App\Rules;

// Imports: Closure (the type of a function passed as a value), the interface
// every rule class implements, and the type of what $fail returns
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Checks the supersets of one day of a plan (docs/design/D3-data-model.md
 * D3.5.3): the exercises of a superset must be next to each other, and a
 * superset has at least two.
 *
 * Items of a day with the same `superset_group` form a superset. These are
 * fine (the number is the group, a dash is no group):
 *
 *     1 1 – 2 2 2      two supersets and an exercise on its own
 *
 * and these are refused:
 *
 *     1 – 1            the two halves of superset 1 are apart
 *     1 2 2            superset 1 has one exercise
 *
 * A custom validation rule: a class for a check that Laravel's rules cannot
 * express (docs/concepts/C2-backend.md C2.5.6). Created with
 * `make:rule SupersetsAreNeighbours`, it implements one method, validate(),
 * which calls $fail with a message when the value is wrong. PlanRequest uses
 * it on `days.*.items`, so it receives the list of items of one day at a time.
 */
class SupersetsAreNeighbours implements ValidationRule
{
    /**
     * Runs the check on one day's items.
     *
     * @param  string  $attribute  the field, such as "days.0.items"
     * @param  mixed  $value  the items sent for that day; other rules check that it is a list
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail  called with a
     *                                                                        message key to refuse
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Not a list: the 'array' rule of the same field already says so
        if (! is_array($value)) {
            return;
        }

        // How many items each group has so far: [1 => 2, 2 => 3]
        $sizes = [];
        // The group of the item before, null when it had none
        $previous = null;

        foreach ($value as $item) {
            // The item's group, as text so that 1 and "1" are the same key;
            // null when the item is not in a superset
            $group = is_array($item) && isset($item['superset_group']) ? (string) $item['superset_group'] : null;

            // A group seen before, but not on the item just before: its
            // exercises are apart. The message key is translated in the
            // request's language (lang/*/validation.php)
            if ($group !== null && $group !== $previous && isset($sizes[$group])) {
                $fail('validation.superset_neighbours')->translate();

                return;
            }

            if ($group !== null) {
                // `?? 0`: the first item of a group starts from zero
                $sizes[$group] = ($sizes[$group] ?? 0) + 1;
            }
            $previous = $group;
        }

        // A superset of one exercise is not a superset
        if ($sizes !== [] && min($sizes) < 2) {
            $fail('validation.superset_size')->translate();
        }
    }
}
