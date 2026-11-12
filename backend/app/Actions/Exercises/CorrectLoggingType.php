<?php

namespace App\Actions\Exercises;

// Imports: the enums of the outcome and of the logging type, and the three
// models it reads (the exercise, and the two tables that may already use it)
use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\PlanItem;
use App\Models\SessionExercise;

/**
 * Corrects the logging type of one public exercise that the
 * free-exercise-db import guessed wrong (DATA-3,
 * docs/concepts/C2-backend.md C2.14.6).
 *
 * The import guesses how sets are logged, since the source does not say
 * (ImportFreeExercise::loggingTypeFor()): a plank, body weight, is guessed as
 * reps, while it is held for a time. The right types are listed in the
 * repository, database/data/logging-type-corrections.json, one entry per
 * exercise:
 *
 *     { "id": "Plank", "from": "reps", "to": "time", "why": "…" }
 *
 * The command `exercises:correct-logging-types`
 * (app/Console/Commands/CorrectLoggingTypes.php) reads the file and calls
 * this once per entry. An action, like ImportFreeExercise: the rules live
 * here, so that a test can call it with one entry
 * (tests/Feature/ExerciseLibrary/CorrectLoggingTypesTest.php).
 *
 * The rules, in this order:
 * - **Not in the library**, or deleted by an admin: nothing to do.
 * - **Already on `to`**: nothing to do; running it again changes nothing.
 * - **On neither `from` nor `to`**: an admin chose a third type, which is kept.
 * - **In a plan or a workout already**: left alone. Its sets were written for
 *   the old type (reps), which the new one (time) does not accept: sending
 *   that workout again would be refused by SaveSessionRequest.
 * - **Otherwise** the type becomes `to`.
 */
class CorrectLoggingType
{
    /**
     * Corrects one exercise.
     *
     * @param  string  $externalId  the exercise's id in free-exercise-db, such as "Plank"
     * @param  LoggingType  $from  the type the import guessed
     * @param  LoggingType  $to  the right type
     * @return CorrectionOutcome what was done
     */
    public function correct(string $externalId, LoggingType $from, LoggingType $to): CorrectionOutcome
    {
        // The public exercise with this external id, or null: where() starts
        // an Eloquent query on the exercises table, first() runs it and
        // gives the first row as an Exercise model. Without withTrashed(),
        // as in ImportFreeExercise: one deleted by an admin is not found,
        // and stays as they left it (docs/concepts/C2-backend.md C2.6)
        $exercise = Exercise::where('external_id', $externalId)->first();

        if ($exercise === null) {
            return CorrectionOutcome::NotFound;
        }

        // The column is cast to the enum (app/Models/Exercise.php casts()),
        // so `===` compares two enum cases: the same case is the same object
        if ($exercise->logging_type === $to) {
            return CorrectionOutcome::AlreadyRight;
        }

        if ($exercise->logging_type !== $from) {
            return CorrectionOutcome::SkippedChangedByHand;
        }

        // Used by a plan item or by an exercise of a workout, by anyone.
        // exists() asks the database for one row at most, not a count.
        // SessionExercise has no soft deletes of its own: the rows of a
        // deleted workout still count, since it can be brought back
        $inUse = PlanItem::where('exercise_id', $exercise->id)->exists()
            || SessionExercise::where('exercise_id', $exercise->id)->exists();

        if ($inUse) {
            return CorrectionOutcome::SkippedInUse;
        }

        // logging_type is in #[Fillable], but assigning it directly says
        // that this is the only column changed. save() writes an UPDATE of
        // the changed columns, and runs the model's events: the `saving` one
        // rewrites search_text, which stays the same here (app/Models/Exercise.php)
        $exercise->logging_type = $to;
        $exercise->save();

        return CorrectionOutcome::Corrected;
    }
}
