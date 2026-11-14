<?php

namespace App\Actions\Exercises;

use App\Models\Exercise;
use InvalidArgumentException;

/**
 * Writes one language of one imported exercise (name, other names, steps) from
 * database/data/exercise-translations/{it,es,de}.json. Called by
 * `exercises:translate` once per exercise and language.
 *
 * An entry, keyed by the exercise's external_id:
 *
 *     "Upright_Barbell_Row": {
 *       "name": "Tirate al mento con bilanciere",
 *       "aliases": ["rematore alto", "upright row"],
 *       "instructions": ["Afferra un bilanciere con presa prona…", "…"]
 *     }
 *
 * The rules:
 * - **Only this language changes.** English, the original, and the other
 *   languages stay as they are: setTranslation() writes one key of the JSON
 *   column, where replaceTranslations() would drop the others.
 * - **A language already there is kept**, unless `$force`: it may have been
 *   reviewed and corrected by a person since, in the admin panel.
 * - **The steps must match the English, one for one.** A translation with a
 *   different number of steps was made from another version of the text
 *   (the English refreshed by `exercises:import --update`, say): it is
 *   refused rather than shown out of step.
 * - **It is marked machine-translated**: the language joins the exercise's
 *   `machine_translated` list, until a person reviews it.
 */
class TranslateExercise
{
    /**
     * @param  string  $locale  it, es or de
     * @param  array{name: string, aliases: list<string>, instructions: list<string>}  $entry
     * @return bool false when the language was kept as it was
     *
     * @throws InvalidArgumentException when the steps do not match the English
     */
    public function translate(Exercise $exercise, string $locale, array $entry, bool $force = false): bool
    {
        // `false`: this language only, no fallback
        if (! $force && $exercise->getTranslation('name', $locale, false) !== '') {
            return false;
        }

        $english = $exercise->getTranslation('instructions', 'en', false) ?: [];
        $steps = $entry['instructions'];
        if (count($steps) !== count($english)) {
            throw new InvalidArgumentException(sprintf('%d steps in %s, the English has %d', count($steps), $locale, count($english)));
        }

        $exercise->setTranslation('name', $locale, $entry['name']);
        $exercise->setTranslation('instructions', $locale, $steps);

        // Removed when empty, so a forced run never leaves old aliases behind
        if ($entry['aliases'] !== []) {
            $exercise->setTranslation('aliases', $locale, $entry['aliases']);
        } else {
            $exercise->forgetTranslation('aliases', $locale);
        }

        // array_values(), so the JSON stays a list
        $exercise->machine_translated = array_values(array_unique([...$exercise->machine_translated, $locale]));

        $exercise->save();

        return true;
    }
}
