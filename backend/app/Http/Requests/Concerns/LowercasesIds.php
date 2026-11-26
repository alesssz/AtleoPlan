<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Arr;

/**
 * Writes the UUIDs sent in lowercase, as Postgres reads and returns them.
 *
 * Postgres compares `uuid` columns ignoring case, PHP does not: an id sent
 * again in capitals would miss the rows already read (`keyBy('id')`, `distinct`,
 * `in_array()`), be inserted a second time and hit the primary key.
 */
trait LowercasesIds
{
    /**
     * @param  string  ...$paths  such as "days.*.items.*.id", `*` standing for every element
     */
    protected function lowercaseIds(string ...$paths): void
    {
        $data = $this->all();
        foreach ($paths as $path) {
            $data = self::lowercaseAt($data, explode('.', $path));
        }

        // Only the fields named, so nothing else moves into the body
        $this->merge(Arr::only($data, array_map(fn (string $path) => explode('.', $path)[0], $paths)));
    }

    /**
     * @param  list<string>  $segments
     */
    private static function lowercaseAt(mixed $data, array $segments): mixed
    {
        if ($segments === []) {
            return is_string($data) ? strtolower($data) : $data;
        }
        if (! is_array($data)) {
            return $data;
        }

        $segment = array_shift($segments);
        foreach ($segment === '*' ? array_keys($data) : [$segment] as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = self::lowercaseAt($data[$key], $segments);
            }
        }

        return $data;
    }
}
