<?php

namespace App\Support;

// Imports: Laravel's string helpers
use Illuminate\Support\Str;

/**
 * The text an exercise is searched by, and the words of a search, written so
 * that the two compare the way a person expects (docs/design/D3-data-model.md
 * D3.4.6): case, accents, dashes, dots and the like do not matter.
 *
 * The exercise's side is kept in the column `exercises.search_text`, filled
 * by the model every time it is saved (Exercise::booted()): every name and
 * alias, in every language, normalised, separated by " | ". The search's side
 * is cut into words by words(); Exercise::search() then finds an exercise
 * when the words written together appear in it ("pull up" → "pullup", in
 * "Pullups"), or when each word starts a word of it ("squat jump" → "Jump
 * Squat", while "up" does not find "supina").
 *
 * A class of static methods with no state, in app/Support: helpers that are
 * neither a model nor an action. `final`: nothing extends it. It has no
 * Laravel in it beyond Str, so its test needs no database
 * (tests/Unit/SearchTextTest.php).
 */
final class SearchText
{
    /**
     * The separator between two pieces of an exercise's search text. A word
     * cannot match across it, and written together the pieces stay apart:
     * "pull up | pullups" becomes "pullup|pullups".
     */
    public const SEPARATOR = ' | ';

    /**
     * One piece of text, normalised: lower case, accents taken off, every run
     * of characters that are not letters or digits turned into one space.
     *
     * Str::transliterate() writes accented and foreign letters with plain
     * ones ("Klimmzüge" → "Klimmzuge", "Ápice" → "Apice"); a character it
     * cannot write becomes "?", which the next step removes anyway.
     * preg_replace() with `[^a-z0-9]+` turns every run of other characters
     * (spaces, dashes, dots, slashes, apostrophes) into a single space, and
     * trim() drops the ones at the ends.
     *
     * @param  string  $text  any text, such as "Pull-Up (wide grip)"
     * @return string such as "pull up wide grip"; '' when nothing is left
     */
    public static function normalize(string $text): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', ' ', Str::lower(Str::transliterate($text))) ?? '');
    }

    /**
     * The search text of an exercise: its name and aliases in every language,
     * each normalised, without repeats, separated by " | ".
     *
     * Every language, not only the user's: an Italian who types "pull up"
     * finds "Trazioni alla sbarra" through its English name, and an English
     * interface finds "trazioni" through the Italian one.
     *
     * @param  array<string, string>  $names  the name by language, as getTranslations('name') gives it
     * @param  array<string, list<string>>  $aliases  the aliases by language
     * @return string such as "pullups | trazioni alla sbarra | pull up | trazioni presa prona"
     */
    public static function forExercise(array $names, array $aliases): string
    {
        // Every piece of text, names first, then the aliases of each language.
        // array_merge(...$lists) joins the lists into one; `[]` when there are none
        $pieces = [...array_values($names), ...array_merge([], ...array_values($aliases))];
        // Each piece normalised, the empty ones dropped, each kept once
        $normalized = array_unique(array_filter(array_map(
            fn (mixed $piece) => self::normalize((string) $piece),
            $pieces,
        )));

        return implode(self::SEPARATOR, $normalized);
    }

    /**
     * The words of what the user typed, each normalised.
     *
     * @param  string  $term  what the user typed, such as "Squat-jump"
     * @return list<string> such as ['squat', 'jump']; empty when nothing but
     *                      spaces and punctuation was typed
     */
    public static function words(string $term): array
    {
        $normalized = self::normalize($term);

        // explode(): the text cut at each space; nothing typed gives no words
        return $normalized === '' ? [] : explode(' ', $normalized);
    }
}
