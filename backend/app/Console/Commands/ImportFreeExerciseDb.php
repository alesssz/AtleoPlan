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
 * `php artisan exercises:import`: fills the public exercise library from
 * free-exercise-db (docs/design/D2-decisions.md D2.3, DATA-1). In this
 * project: `make exercises-import`, which also downloads the dataset the
 * first time (docs/how-to/H1-database.md H1.12).
 *
 * An Artisan command of our own (docs/concepts/C2-backend.md C2.14): a class in
 * app/Console/Commands, which Laravel finds and registers by itself. Two
 * attributes above the class describe it, as `make:command` writes them in
 * Laravel 13:
 * - #[Signature]: the command's name, then its options in braces. `--update`
 *   is a switch (true when typed); `--path=` and `--limit=` take a value. The
 *   text after ` : ` is the help shown by `php artisan help exercises:import`;
 * - #[Description]: the line shown by `php artisan list`.
 * Older code writes the same as two properties, `protected $signature` and
 * `protected $description`; both work. handle() does the work.
 *
 * It reads the dataset from a folder on disk, by default
 * backend/storage/app/free-exercise-db (a clone of the GitHub repository,
 * ignored by Git), and passes each exercise to ImportFreeExercise, where the
 * rules are. One exercise that fails does not stop the others: its error is
 * listed at the end, and the command ends with a failure code.
 *
 * It can run again at any time: exercises already there are left alone, or
 * refreshed with `--update`, never duplicated.
 */
#[Signature('exercises:import
    {--path= : The folder of free-exercise-db (default: storage/app/free-exercise-db)}
    {--update : Also refresh the exercises already imported, from the source}
    {--without-photos : Import the texts only, no photos}
    {--limit= : Import only the first N exercises, to try it}')]
#[Description('Import the public exercise library from free-exercise-db (DATA-1)')]
class ImportFreeExerciseDb extends Command
{
    /**
     * Runs the import.
     *
     * Laravel calls handle() and builds its parameters from the service
     * container, as for a controller's method (docs/concepts/C2-backend.md C2.5.3):
     * here the action. The return value is the exit code: 0 (SUCCESS) or 1
     * (FAILURE), which scripts and `make` read.
     *
     * @param  ImportFreeExercise  $import  imports one exercise
     * @return int Command::SUCCESS, or Command::FAILURE when something went wrong
     */
    public function handle(ImportFreeExercise $import): int
    {
        // The dataset's folder: the option, or the default. storage_path()
        // gives backend/storage/… as seen from inside the container
        $path = $this->option('path') ?: storage_path('app/free-exercise-db');
        // The file with every exercise, and the folder with the photos
        $jsonFile = $path.'/dist/exercises.json';
        $imagesPath = $path.'/exercises';

        if (! File::exists($jsonFile)) {
            // error() prints in red
            $this->error("free-exercise-db not found: {$jsonFile} does not exist.");
            $this->line('Download it with `make exercises-import` (it clones the repository the first time),');
            $this->line('or give its folder with --path.');

            return self::FAILURE;
        }

        // Every exercise, as PHP arrays. JSON_THROW_ON_ERROR: a broken file
        // throws an exception, instead of quietly giving null
        $rows = json_decode(File::get($jsonFile), true, flags: JSON_THROW_ON_ERROR);

        // --limit=N: only the first N, to try the import quickly
        $limit = $this->option('limit');
        if ($limit !== null) {
            if (! ctype_digit((string) $limit) || (int) $limit < 1) {
                $this->error('--limit takes a whole number greater than 0.');

                return self::FAILURE;
            }
            $rows = array_slice($rows, 0, (int) $limit);
        }

        // The options as booleans
        $update = (bool) $this->option('update');
        $withPhotos = ! $this->option('without-photos');

        // The totals for the summary: one counter per outcome, and the photos
        $counts = array_fill_keys(array_map(fn (ImportOutcome $o) => $o->value, ImportOutcome::cases()), 0);
        $photos = 0;
        // The exercises that failed: source id => message
        $errors = [];

        $this->info('Importing '.count($rows).' exercises from '.$path);

        // withProgressBar(): runs the function on each item and draws a bar
        // with the count, so a long import shows that it is moving.
        // `use (…)`: the variables the function may read; `&` lets it change them
        $this->withProgressBar($rows, function (array $row) use ($import, $imagesPath, $update, $withPhotos, &$counts, &$photos, &$errors) {
            // try/catch: an exception thrown inside `try` jumps to `catch`
            // instead of stopping the whole command
            try {
                // What was done with this exercise, and how many photos it got
                $result = $import->import($row, $imagesPath, $update, $withPhotos);
                $counts[$result->outcome->value]++;
                $photos += $result->photosAdded;
            } catch (Throwable $e) {
                // Any failure of this one exercise: noted, and on to the next
                $errors[$row['id'] ?? '?'] = $e->getMessage();
            }
        });

        // newLine(2): two empty lines after the bar
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
