<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * The supersets of one day of a plan: items with the same `superset_group` must
 * be next to each other, at least two of them. Applied by PlanRequest to
 * `days.*.items`.
 *
 *     1 1 – 2 2 2      fine: two supersets and an exercise on its own
 *     1 – 1            refused: superset 1 is split
 *     1 2 2            refused: superset 1 has one exercise
 */
class SupersetsAreNeighbours implements ValidationRule
{
    /**
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // The field's 'array' rule reports this already
        if (! is_array($value)) {
            return;
        }

        $sizes = [];
        $previous = null;

        foreach ($value as $item) {
            // As text, so that 1 and "1" are the same group
            $group = is_array($item) && isset($item['superset_group']) ? (string) $item['superset_group'] : null;

            if ($group !== null && $group !== $previous && isset($sizes[$group])) {
                $fail('validation.superset_neighbours')->translate();

                return;
            }

            if ($group !== null) {
                $sizes[$group] = ($sizes[$group] ?? 0) + 1;
            }
            $previous = $group;
        }

        if ($sizes !== [] && min($sizes) < 2) {
            $fail('validation.superset_size')->translate();
        }
    }
}
