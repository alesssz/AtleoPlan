<?php

namespace App\Console\Commands;

use App\Actions\Exercises\CorrectLoggingType;
use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * `php artisan exercises:correct-logging-types`: puts right the logging type of
 * the public exercises that the free-exercise-db import guessed wrong, such as
 * Plank, guessed as reps and held for a time. The list is in the repository,
 * backend/database/data/logging-type-corrections.json.
 *
 * `make exercises-import` runs it after the import, so a new database is right
 * from the start; `make exercises-correct` runs it alone, for a library
 * imported before the list existed. The rules are in CorrectLoggingType.
 */
#[Signature('exercises:correct-logging-types
    {--path= : The JSON file of the corrections (default: database/data/logging-type-corrections.json)}')]
#[Description('Correct the logging types the free-exercise-db import guessed wrong')]
class CorrectLoggingTypes extends Command
{
    /**
     * @return int FAILURE when an entry of the file is wrong
     */
    public function handle(CorrectLoggingType $correct): int
    {
        $file = $this->option('path') ?: database_path('data/logging-type-corrections.json');

        if (! File::exists($file)) {
            $this->error("Corrections not found: {$file} does not exist.");

            return self::FAILURE;
        }

        $rows = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);

        // ['corrected' => 0, 'already_right' => 0, …]
        $counts = array_fill_keys(array_map(fn (CorrectionOutcome $o) => $o->value, CorrectionOutcome::cases()), 0);
        $errors = [];
        // Named in the output: whoever runs the command decides what to do
        // with them
        $inUse = [];

        $this->info('Checking '.count($rows).' logging types from '.$file);

        foreach ($rows as $row) {
            // One wrong entry does not stop the others. A misspelt type is a
            // ValueError, a missing key a TypeError: both Throwable
            try {
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
