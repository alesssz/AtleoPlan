<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Refuses a list longer than its rules allow before the validator starts.
 *
 * The validator turns every rule with a `*` into one rule per element sent,
 * and only then reads `max:`; `distinct` then compares each element with all
 * the others. A body of a million sets would cost seconds and gigabytes
 * before being refused. Here each list with `array` and `max:` among its rules
 * is counted first, outer lists before the ones inside them, so a count is
 * never taken inside a list already too long.
 *
 * The message is the one `max:` gives.
 */
trait ChecksListLengthsFirst
{
    protected function prepareForValidation(): void
    {
        $limits = [];
        foreach ($this->rules() as $path => $rules) {
            $rules = is_string($rules) ? explode('|', $rules) : $rules;
            if (! in_array('array', $rules, true)) {
                continue;
            }
            foreach ($rules as $rule) {
                if (is_string($rule) && str_starts_with($rule, 'max:')) {
                    $limits[$path] = (int) Str::after($rule, 'max:');
                }
            }
        }

        // Outer lists first: fewer dots
        uksort($limits, fn (string $a, string $b) => substr_count($a, '.') <=> substr_count($b, '.'));

        foreach ($limits as $path => $max) {
            foreach (self::listsAt($this->all(), explode('.', $path), '') as $key => $list) {
                if (count($list) > $max) {
                    throw ValidationException::withMessages([
                        $key => __('validation.max.array', ['attribute' => str_replace('_', ' ', $key), 'max' => $max]),
                    ]);
                }
            }
        }
    }

    /**
     * The arrays found at a path, `*` standing for every element.
     *
     * @param  list<string>  $segments
     * @return iterable<string, array<mixed>> by the key the validator would name them, "days.2.items"
     */
    private static function listsAt(mixed $data, array $segments, string $prefix): iterable
    {
        if ($segments === []) {
            if (is_array($data)) {
                yield rtrim($prefix, '.') => $data;
            }

            return;
        }
        if (! is_array($data)) {
            return;
        }

        $segment = array_shift($segments);
        $keys = $segment === '*' ? array_keys($data) : [$segment];
        foreach ($keys as $key) {
            if (array_key_exists($key, $data)) {
                yield from self::listsAt($data[$key], $segments, $prefix.$key.'.');
            }
        }
    }
}
