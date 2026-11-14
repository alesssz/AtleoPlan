<?php

namespace App\Actions\Exercises;

use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\PlanItem;
use App\Models\SessionExercise;

/**
 * Corrects the logging type of one public exercise that the free-exercise-db
 * import guessed wrong.
 *
 * The import guesses how sets are logged, since the source does not say
 * (ImportFreeExercise::loggingTypeFor()): a plank, body weight, is guessed as
 * reps, while it is held for a time. The right types are listed in the
 * repository, database/data/logging-type-corrections.json, one entry per
 * exercise:
 *
 *     { "id": "Plank", "from": "reps", "to": "time", "why": "…" }
 *
 * `exercises:correct-logging-types` calls this once per entry.
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
     * @param  string  $externalId  the exercise's id in free-exercise-db, such as "Plank"
     * @param  LoggingType  $from  the type the import guessed
     */
    public function correct(string $externalId, LoggingType $from, LoggingType $to): CorrectionOutcome
    {
        // One deleted by an admin is not found, and stays as they left it
        $exercise = Exercise::where('external_id', $externalId)->first();

        if ($exercise === null) {
            return CorrectionOutcome::NotFound;
        }

        if ($exercise->logging_type === $to) {
            return CorrectionOutcome::AlreadyRight;
        }

        if ($exercise->logging_type !== $from) {
            return CorrectionOutcome::SkippedChangedByHand;
        }

        // By anyone. The rows of a soft-deleted workout count too: it can be
        // brought back
        $inUse = PlanItem::where('exercise_id', $exercise->id)->exists()
            || SessionExercise::where('exercise_id', $exercise->id)->exists();

        if ($inUse) {
            return CorrectionOutcome::SkippedInUse;
        }

        $exercise->logging_type = $to;
        $exercise->save();

        return CorrectionOutcome::Corrected;
    }
}
