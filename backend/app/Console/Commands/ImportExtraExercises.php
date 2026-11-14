<?php

namespace App\Console\Commands;

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
 * backend/database/data/extra-exercises.json: for now calisthenics (frog stand,
 * front lever, burpees…). In this project `make exercises-import` runs it after
 * the free-exercise-db import, and `make exercises-extra` runs it alone.
 *
 * The file has free-exercise-db's shape, so ImportFreeExercise imports each
 * entry with the same rules: found again by its external_id (ours start
 * with "AtleoPlan_", so they never meet the dataset's), left alone unless
 * --update, never duplicated. Two keys are ours: `aliases` and `loggingType`.
 * There are no photos. The Italian, Spanish and German texts are in the
 * translation files with the dataset's, and `exercises:translate` writes
 * them.
 */
#[Signature('exercises:import-extra
    {--path= : The JSON file of the extra exercises (default: database/data/extra-exercises.json)}
    {--update : Also refresh the extra exercises already imported, from the file}')]
#[Description('Import the extra exercises kept in the repository (calisthenics)')]
class ImportExtraExercises extends Command
{
    public function handle(ImportFreeExercise $import): int
    {
        $file = $this->option('path') ?: database_path('data/extra-exercises.json');

        if (! File::exists($file)) {
            $this->error("Extra exercises not found: {$file} does not exist.");

            return self::FAILURE;
        }

        $rows = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);
        $update = (bool) $this->option('update');

        $counts = array_fill_keys(array_map(fn (ImportOutcome $o) => $o->value, ImportOutcome::cases()), 0);
        $errors = [];

        $this->info('Importing '.count($rows).' extra exercises from '.$file);

        foreach ($rows as $row) {
            // One exercise that fails does not stop the others
            try {
                // No photos
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
