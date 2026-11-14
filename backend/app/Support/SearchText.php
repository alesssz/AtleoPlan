<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Normalises an exercise's names and a search term the same way, so that case,
 * accents, dashes and dots do not matter. The exercise's side is stored in
 * `exercises.search_text` (Exercise::booted()); Exercise::search() matches the
 * term's words against it.
 */
final class SearchText
{
    /**
     * Between two names or aliases: a word cannot match across it, and joined
     * words stay apart ("pull up | pullups" → "pullup|pullups").
     */
    public const SEPARATOR = ' | ';

    /**
     * Lower case, transliterated ("Klimmzüge" → "klimmzuge"), every run of
     * other characters turned into one space: "Pull-Up (wide grip)" →
     * "pull up wide grip".
     */
    public static function normalize(string $text): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', ' ', Str::lower(Str::transliterate($text))) ?? '');
    }

    /**
     * Every language, not only the user's: an Italian who types "pull up"
     * finds "Trazioni alla sbarra" through its English name.
     *
     * @param  array<string, string>  $names  by language, as getTranslations('name') gives them
     * @param  array<string, list<string>>  $aliases  by language
     * @return string such as "pullups | trazioni alla sbarra | pull up"
     */
    public static function forExercise(array $names, array $aliases): string
    {
        $pieces = [...array_values($names), ...array_merge([], ...array_values($aliases))];
        $normalized = array_unique(array_filter(array_map(
            fn (mixed $piece) => self::normalize((string) $piece),
            $pieces,
        )));

        return implode(self::SEPARATOR, $normalized);
    }

    /**
     * @return list<string> empty when only spaces and punctuation were typed
     */
    public static function words(string $term): array
    {
        $normalized = self::normalize($term);

        return $normalized === '' ? [] : explode(' ', $normalized);
    }
}
