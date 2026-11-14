<?php

namespace App\Console\Commands;

use App\Actions\Exercises\TranslateExercise;
use App\Models\Exercise;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * `php artisan exercises:translate`: writes the Italian, Spanish and German
 * names, other names and steps of the imported exercises, from the translation
 * files of the repository. In this project it runs right after the import, in
 * `make exercises-import`.
 *
 * The files, keyed by external_id (TranslateExercise shows an entry), are
 * versioned with the code: a fresh database gets the same translations with
 * no service to call. A language an exercise already has is kept, unless
 * `--force`.
 */
#[Signature('exercises:translate
    {--locale=* : Only these languages (it, es, de); all three when not given}
    {--force : Overwrite the languages the exercises already have}
    {--path= : The folder of the translation files (default: database/data/exercise-translations)}')]
#[Description('Translate the imported exercises into Italian, Spanish and German')]
class TranslateExercises extends Command
{
    /** Every language of the app but English, the original. */
    private const LOCALES = ['it', 'es', 'de'];

    public function handle(TranslateExercise $translate): int
    {
        $path = $this->option('path') ?: database_path('data/exercise-translations');
        $locales = $this->option('locale') ?: self::LOCALES;

        $unknown = array_diff($locales, self::LOCALES);
        if ($unknown !== []) {
            $this->error('Unknown language: '.implode(', ', $unknown).'. Use it, es or de.');

            return self::FAILURE;
        }

        // One deleted by an admin is translated too, ready if it is brought back
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
            $written = $kept = $notImported = 0;
            $errors = [];

            $this->info("Translating into {$locale}: ".count($entries).' exercises in the file');
            // A numeric-looking key arrives as an int
            $this->withProgressBar($entries, function (array $entry, mixed $bar, int|string $externalId) use ($translate, $exercises, $locale, $force, &$written, &$kept, &$notImported, &$errors) {
                $exercise = $exercises->get($externalId);
                // An import with --limit, or a source that changed
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
