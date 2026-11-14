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
 * `php artisan exercises:import`: fills the public exercise library from
 * free-exercise-db. `make exercises-import` also clones the dataset the first
 * time.
 *
 * The dataset is read from storage/app/free-exercise-db (ignored by Git);
 * the rules are in ImportFreeExercise. One exercise that fails does not stop
 * the others: its error is listed at the end, and the command fails.
 *
 * It can run again at any time: exercises already there are left alone, or
 * refreshed with `--update`, never duplicated.
 */
#[Signature('exercises:import
    {--path= : The folder of free-exercise-db (default: storage/app/free-exercise-db)}
    {--update : Also refresh the exercises already imported, from the source}
    {--without-photos : Import the texts only, no photos}
    {--limit= : Import only the first N exercises, to try it}')]
#[Description('Import the public exercise library from free-exercise-db')]
class ImportFreeExerciseDb extends Command
{
    public function handle(ImportFreeExercise $import): int
    {
        $path = $this->option('path') ?: storage_path('app/free-exercise-db');
        $jsonFile = $path.'/dist/exercises.json';
        $imagesPath = $path.'/exercises';

        if (! File::exists($jsonFile)) {
            $this->error("free-exercise-db not found: {$jsonFile} does not exist.");
            $this->line('Download it with `make exercises-import` (it clones the repository the first time),');
            $this->line('or give its folder with --path.');

            return self::FAILURE;
        }

        $rows = json_decode(File::get($jsonFile), true, flags: JSON_THROW_ON_ERROR);

        $limit = $this->option('limit');
        if ($limit !== null) {
            if (! ctype_digit((string) $limit) || (int) $limit < 1) {
                $this->error('--limit takes a whole number greater than 0.');

                return self::FAILURE;
            }
            $rows = array_slice($rows, 0, (int) $limit);
        }

        $update = (bool) $this->option('update');
        $withPhotos = ! $this->option('without-photos');

        $counts = array_fill_keys(array_map(fn (ImportOutcome $o) => $o->value, ImportOutcome::cases()), 0);
        $photos = 0;
        // source id => message
        $errors = [];

        $this->info('Importing '.count($rows).' exercises from '.$path);

        $this->withProgressBar($rows, function (array $row) use ($import, $imagesPath, $update, $withPhotos, &$counts, &$photos, &$errors) {
            try {
                $result = $import->import($row, $imagesPath, $update, $withPhotos);
                $counts[$result->outcome->value]++;
                $photos += $result->photosAdded;
            } catch (Throwable $e) {
                $errors[$row['id'] ?? '?'] = $e->getMessage();
            }
        });

        $this->newLine(2);
        $this->info("Created: {$counts[ImportOutcome::Created->value]}");
        $this->info("Updated: {$counts[ImportOutcome::Updated->value]}");
        $this->info("Unchanged: {$counts[ImportOutcome::Unchanged->value]}");
        $this->info("Skipped, deleted by an admin: {$counts[ImportOutcome::SkippedDeleted->value]}");
        $this->info("Photos added: {$photos}");

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
