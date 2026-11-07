<?php

namespace App\Console\Commands;

// Imports: the action that writes one translation, the model, the two
// attributes that describe a command, Laravel's base class for commands, the
// File facade, and PHP's base exception class
use App\Actions\Exercises\TranslateExercise;
use App\Models\Exercise;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * `php artisan exercises:translate`: writes the Italian, Spanish and German
 * names, other names and steps of the imported exercises, from the
 * translation files of the repository (DATA-1, docs/design/D2-decisions.md
 * D2.3). In this project it runs right after the import, in
 * `make exercises-import` (docs/how-to/H1-database.md H1.14).
 *
 * The files are backend/database/data/exercise-translations/it.json, es.json
 * and de.json, one object per language keyed by the exercises' external_id
 * (TranslateExercise shows an entry). They are data of the app, versioned
 * with the code: a fresh database gets the same translations, with no
 * service to call.
 *
 * An Artisan command of our own, like `exercises:import`
 * (docs/concepts/C2-backend.md C2.14). It can run again at any time: a
 * language an exercise already has is kept, unless `--force`.
 */
#[Signature('exercises:translate
    {--locale=* : Only these languages (it, es, de); all three when not given}
    {--force : Overwrite the languages the exercises already have}
    {--path= : The folder of the translation files (default: database/data/exercise-translations)}')]
#[Description('Translate the imported exercises into Italian, Spanish and German (DATA-1)')]
class TranslateExercises extends Command
{
    /** The languages there are files for: every language of the app but English. */
    private const LOCALES = ['it', 'es', 'de'];

    /**
     * Runs the translation.
     *
     * @param  TranslateExercise  $translate  writes one language of one exercise
     * @return int Command::SUCCESS, or Command::FAILURE when something went wrong
     */
    public function handle(TranslateExercise $translate): int
    {
        $path = $this->option('path') ?: database_path('data/exercise-translations');
        // `--locale=it --locale=de` gives ['it', 'de']: the `*` in the
        // signature makes the option a list. None given: all three
        $locales = $this->option('locale') ?: self::LOCALES;

        // array_diff(): the languages asked for that are not ours
        $unknown = array_diff($locales, self::LOCALES);
        if ($unknown !== []) {
            $this->error('Unknown language: '.implode(', ', $unknown).'. Use it, es or de.');

            return self::FAILURE;
        }

        // The imported exercises, by external_id. withTrashed(): one deleted
        // by an admin is translated too; it stays deleted, and is ready if it
        // is brought back. keyBy(): a collection keyed by that column
        $exercises = Exercise::withTrashed()->whereNotNull('external_id')->get()->keyBy('external_id');
        $force = (bool) $this->option('force');
        $failed = false;

        foreach ($locales as $locale) {
            $file = "{$path}/{$locale}.json";
            if (! File::exists($file)) {
                $this->error("No translation file: {$file}");
                $failed = true;

                continue;
            }

            /** @var array<string, array{name: string, aliases: list<string>, instructions: list<string>}> $entries */
            $entries = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);
            // The totals for this language, and the exercises that failed
            $written = $kept = $notImported = 0;
            $errors = [];

            $this->info("Translating into {$locale}: ".count($entries).' exercises in the file');
            // withProgressBar() calls the function with each value, the bar,
            // and the value's key: here the entry, the bar (unused), the
            // external_id. A key that looks like a number arrives as an int,
            // hence the `int|string`
            $this->withProgressBar($entries, function (array $entry, mixed $bar, int|string $externalId) use ($translate, $exercises, $locale, $force, &$written, &$kept, &$notImported, &$errors) {
                $exercise = $exercises->get($externalId);
                // In the file, but not in the library: an import with
                // --limit, or a source that changed. Nothing to translate
                if ($exercise === null) {
                    $notImported++;

                    return;
                }
                try {
                    $translate->translate($exercise, $locale, $entry, $force) ? $written++ : $kept++;
                } catch (Throwable $e) {
                    $errors[$externalId] = $e->getMessage();
                }
            });

            $this->newLine(2);
            $this->info("Written: {$written}");
            $this->info("Kept, already in {$locale}: {$kept}");
            $this->info("Not in the library: {$notImported}");
            if ($errors !== []) {
                $failed = true;
                $this->error('Failed: '.count($errors));
                foreach ($errors as $id => $message) {
                    $this->line("  {$id}: {$message}");
                }
            }
            $this->newLine();
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
