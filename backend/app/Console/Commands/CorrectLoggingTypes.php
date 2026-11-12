<?php

namespace App\Console\Commands;

// Imports: the action that corrects one exercise, the enums of its outcome
// and of the logging type, the two attributes that describe a command,
// Laravel's base class for commands, the File facade, and PHP's base
// exception class
use App\Actions\Exercises\CorrectLoggingType;
use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * `php artisan exercises:correct-logging-types`: puts right the logging
 * type of the public exercises that the free-exercise-db import guessed
 * wrong, such as Plank, guessed as reps and held for a time (DATA-3,
 * docs/concepts/C2-backend.md C2.14.6). The list is in the repository,
 * backend/database/data/logging-type-corrections.json.
 *
 * In this project `make exercises-import` runs it after the import, so a
 * new database is right from the start; `make exercises-correct` runs it
 * alone, for a library imported before the list existed
 * (docs/how-to/H1-database.md H1.19).
 *
 * Written like ImportExtraExercises, which explains the #[Signature] and
 * #[Description] attributes and handle() (docs/concepts/C2-backend.md C2.14.1).
 * The rules of one exercise are in the action CorrectLoggingType; here, the
 * file, the loop and the summary.
 */
#[Signature('exercises:correct-logging-types
    {--path= : The JSON file of the corrections (default: database/data/logging-type-corrections.json)}')]
#[Description('Correct the logging types the free-exercise-db import guessed wrong (DATA-3)')]
class CorrectLoggingTypes extends Command
{
    /**
     * Runs the corrections.
     *
     * @param  CorrectLoggingType  $correct  corrects one exercise, built by the service container
     * @return int Command::SUCCESS, or Command::FAILURE when an entry of the file is wrong
     */
    public function handle(CorrectLoggingType $correct): int
    {
        // The file: the option, or the one in the repository.
        // $this->option() reads an option typed after the command's name, null
        // when not typed; `?:` takes the right side when the left is empty.
        // database_path() gives backend/database/… as seen from the container
        $file = $this->option('path') ?: database_path('data/logging-type-corrections.json');

        // error() prints a red line; info() a green one, line() a plain one.
        // self::FAILURE is the exit code 1, which makes `make` stop
        if (! File::exists($file)) {
            $this->error("Corrections not found: {$file} does not exist.");

            return self::FAILURE;
        }

        // Every entry, as PHP arrays; a broken file throws instead of
        // quietly giving null
        $rows = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);

        // The totals for the summary, one counter per outcome:
        // ['corrected' => 0, 'already_right' => 0, …]. cases() lists the
        // enum's cases, array_map() takes each one's value, and
        // array_fill_keys() makes them the keys of an array of zeros
        $counts = array_fill_keys(array_map(fn (CorrectionOutcome $o) => $o->value, CorrectionOutcome::cases()), 0);
        // The entries that could not be read: id => the error's message
        $errors = [];
        // The exercises left alone because they are used, to name them:
        // the person running the command decides what to do with them
        $inUse = [];

        $this->info('Checking '.count($rows).' logging types from '.$file);

        foreach ($rows as $row) {
            // One wrong entry (a misspelt type) does not stop the others.
            // LoggingType::from() throws a ValueError on a value that is not
            // one of the enum's; a missing key is a TypeError: both Throwable
            try {
                // What the action did with this exercise
                $outcome = $correct->correct($row['id'], LoggingType::from($row['from']), LoggingType::from($row['to']));
                $counts[$outcome->value]++;
                if ($outcome === CorrectionOutcome::SkippedInUse) {
                    $inUse[] = $row['id'];
                }
            } catch (Throwable $e) {
                $errors[$row['id'] ?? '?'] = $e->getMessage();
            }
        }

        $this->info("Corrected: {$counts[CorrectionOutcome::Corrected->value]}");
        $this->info("Already right: {$counts[CorrectionOutcome::AlreadyRight->value]}");
        $this->info("Not in the library: {$counts[CorrectionOutcome::NotFound->value]}");
        $this->info("Kept, changed by an admin: {$counts[CorrectionOutcome::SkippedChangedByHand->value]}");
        $this->info("Kept, already in a plan or a workout: {$counts[CorrectionOutcome::SkippedInUse->value]}");
        foreach ($inUse as $id) {
            $this->line("  {$id}");
        }

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
