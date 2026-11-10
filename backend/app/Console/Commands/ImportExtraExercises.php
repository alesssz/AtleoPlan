<?php

namespace App\Console\Commands;

// Imports: the action that imports one exercise, the enum of its outcome,
// the two attributes that describe a command, Laravel's base class for
// commands, the File facade, and PHP's base exception class
use App\Actions\Exercises\ImportFreeExercise;
use App\Enums\ImportOutcome;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * `php artisan exercises:import-extra`: adds to the public library the
 * exercises free-exercise-db does not have, kept in the repository in
 * backend/database/data/extra-exercises.json: for now calisthenics (frog
 * stand, front lever, burpees…). In this project `make exercises-import` runs
 * it after the free-exercise-db import, and `make exercises-extra` runs it
 * alone (docs/how-to/H1-database.md H1.17).
 *
 * The file has free-exercise-db's shape, so ImportFreeExercise imports each
 * entry with the same rules: found again by its external_id (ours start
 * with "AtleoPlan_", so they never meet the dataset's), left alone unless
 * --update, never duplicated. Two keys are ours: `aliases` and `loggingType`.
 * There are no photos. The Italian, Spanish and German texts are in the
 * translation files with the dataset's, and `exercises:translate` writes
 * them.
 *
 * A command of our own, written like ImportFreeExerciseDb, which explains the
 * #[Signature] and #[Description] attributes and handle()
 * (docs/concepts/C2-backend.md C2.14).
 */
#[Signature('exercises:import-extra
    {--path= : The JSON file of the extra exercises (default: database/data/extra-exercises.json)}
    {--update : Also refresh the extra exercises already imported, from the file}')]
#[Description('Import the extra exercises kept in the repository (calisthenics)')]
class ImportExtraExercises extends Command
{
    /**
     * Runs the import.
     *
     * @param  ImportFreeExercise  $import  imports one exercise, built by the service container
     * @return int Command::SUCCESS, or Command::FAILURE when something went wrong
     */
    public function handle(ImportFreeExercise $import): int
    {
        // The file: the option, or the one in the repository.
        // database_path() gives backend/database/… as seen from the container
        $file = $this->option('path') ?: database_path('data/extra-exercises.json');

        if (! File::exists($file)) {
            $this->error("Extra exercises not found: {$file} does not exist.");

            return self::FAILURE;
        }

        // Every exercise, as PHP arrays; a broken file throws instead of
        // quietly giving null
        $rows = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);
        $update = (bool) $this->option('update');

        // The totals for the summary, one counter per outcome, and the failures
        $counts = array_fill_keys(array_map(fn (ImportOutcome $o) => $o->value, ImportOutcome::cases()), 0);
        $errors = [];

        $this->info('Importing '.count($rows).' extra exercises from '.$file);

        foreach ($rows as $row) {
            // One exercise that fails does not stop the others
            try {
                // No photos: the images folder is never read ('', false)
                $result = $import->import($row, '', $update, false);
                $counts[$result->outcome->value]++;
            } catch (Throwable $e) {
                $errors[$row['id'] ?? '?'] = $e->getMessage();
            }
        }

        $this->info("Created: {$counts[ImportOutcome::Created->value]}");
        $this->info("Updated: {$counts[ImportOutcome::Updated->value]}");
        $this->info("Unchanged: {$counts[ImportOutcome::Unchanged->value]}");
        $this->info("Skipped, deleted by an admin: {$counts[ImportOutcome::SkippedDeleted->value]}");

        if ($errors !== []) {
            $this->error('Failed: '.count($errors));
            foreach ($errors as $id => $message) {
                $this->line("  {$id}: {$message}");
            }

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
