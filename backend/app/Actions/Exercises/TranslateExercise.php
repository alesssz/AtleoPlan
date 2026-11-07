<?php

namespace App\Actions\Exercises;

// Imports: the model it writes, and the exception for a translation that
// does not fit the exercise
use App\Models\Exercise;
use InvalidArgumentException;

/**
 * Writes one language of one imported exercise: its name, its other names
 * and its steps, from the translation files of the repository
 * (backend/database/data/exercise-translations/{it,es,de}.json; DATA-1,
 * docs/design/D2-decisions.md D2.3). The command `exercises:translate`
 * (app/Console/Commands/TranslateExercises.php) reads the files and calls
 * this once per exercise and language.
 *
 * An action, like ImportFreeExercise (docs/concepts/C2-backend.md C2.5.3): the
 * rules live here, and a test calls it with one exercise.
 *
 * One entry of a translation file, keyed by the exercise's external_id:
 *
 *     "Upright_Barbell_Row": {
 *       "name": "Tirate al mento con bilanciere",
 *       "aliases": ["rematore alto", "upright row"],
 *       "instructions": ["Afferra un bilanciere con presa prona…", "…"]
 *     }
 *
 * The rules (docs/concepts/C2-backend.md C2.14.4):
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
 *   `machine_translated` list, until a person reviews it (D2.3).
 */
class TranslateExercise
{
    /**
     * Writes one language of one exercise.
     *
     * @param  Exercise  $exercise  the imported exercise
     * @param  string  $locale  it, es or de
     * @param  array{name: string, aliases: list<string>, instructions: list<string>}  $entry  the translation
     * @param  bool  $force  overwrite this language when the exercise already has it
     * @return bool true when written; false when kept as it was
     *
     * @throws InvalidArgumentException when the steps do not match the English
     */
    public function translate(Exercise $exercise, string $locale, array $entry, bool $force = false): bool
    {
        // getTranslation(…, false): the value in that language only, with no
        // fallback to English; '' when there is none
        if (! $force && $exercise->getTranslation('name', $locale, false) !== '') {
            return false;
        }

        // The English steps, the original the translation was made from
        $english = $exercise->getTranslation('instructions', 'en', false) ?: [];
        $steps = $entry['instructions'];
        if (count($steps) !== count($english)) {
            throw new InvalidArgumentException(sprintf('%d steps in %s, the English has %d', count($steps), $locale, count($english)));
        }

        $exercise->setTranslation('name', $locale, $entry['name']);
        $exercise->setTranslation('instructions', $locale, $steps);

        // Other names: written when there are some, removed otherwise, so a
        // forced run never leaves old aliases behind
        if ($entry['aliases'] !== []) {
            $exercise->setTranslation('aliases', $locale, $entry['aliases']);
        } else {
            $exercise->forgetTranslation('aliases', $locale);
        }

        // The language joins the list of those not reviewed yet, once.
        // array_unique() drops a repeat; array_values() renumbers 0, 1, 2…
        // so the JSON stays a list
        $exercise->machine_translated = array_values(array_unique([...$exercise->machine_translated, $locale]));

        $exercise->save();

        return true;
    }
}
