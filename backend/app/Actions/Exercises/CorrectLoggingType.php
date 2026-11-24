<?php

namespace App\Actions\Exercises;

use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\LoggedSet;
use App\Models\Plan;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\SessionExercise;
use Illuminate\Support\Facades\DB;

/**
 * Corrects the logging type of one public exercise that the free-exercise-db
 * import guessed wrong, and the sets already written for the wrong type.
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
 * - **In a plan or a workout, from reps to time**: whoever used it while it
 *   was counted in reps wrote the seconds they meant as reps (a plank's
 *   "3 × 30"), so the number moves to seconds, unless a set has a weight,
 *   which a time cannot hold: then it is left alone.
 * - **In a plan or a workout, any other pair**: left alone, as there is no
 *   conversion that keeps the sets' meaning; SaveSessionRequest would refuse
 *   the old sets under the new type.
 * - **Otherwise** the type becomes `to`.
 */
class CorrectLoggingType
{
    /**
     * @param  string  $externalId  the exercise's id in free-exercise-db, such as "Plank"
     * @param  LoggingType  $from  the type the import guessed
     */
    public function correct(string $externalId, LoggingType $from, LoggingType $to): CorrectionResult
    {
        // One deleted by an admin is not found, and stays as they left it
        $exercise = Exercise::where('external_id', $externalId)->first();

        if ($exercise === null) {
            return new CorrectionResult(CorrectionOutcome::NotFound);
        }

        if ($exercise->logging_type === $to) {
            return new CorrectionResult(CorrectionOutcome::AlreadyRight);
        }

        if ($exercise->logging_type !== $from) {
            return new CorrectionResult(CorrectionOutcome::SkippedChangedByHand);
        }

        // By anyone. The rows of a soft-deleted workout count too: it can be
        // brought back, and must then be sent again as the new type wants
        $items = PlanItem::where('exercise_id', $exercise->id);
        $planSets = PlanSet::whereIn('plan_item_id', PlanItem::select('id')->where('exercise_id', $exercise->id));
        $loggedSets = LoggedSet::whereIn('session_exercise_id', SessionExercise::select('id')->where('exercise_id', $exercise->id));
        $inUse = $items->clone()->exists()
            || SessionExercise::where('exercise_id', $exercise->id)->exists();

        if (! $inUse) {
            $exercise->logging_type = $to;
            $exercise->save();

            return new CorrectionResult(CorrectionOutcome::Corrected);
        }

        $byReps = $from === LoggingType::Reps || $from === LoggingType::WeightReps;
        if (! $byReps || $to !== LoggingType::Time) {
            return new CorrectionResult(CorrectionOutcome::SkippedInUse);
        }

        // 0 kg is no weight: nothing is lost
        $weighted = $planSets->clone()->where('target_weight_kg', '>', 0)->exists()
            || $loggedSets->clone()->where('weight_kg', '>', 0)->exists();

        if ($weighted) {
            return new CorrectionResult(CorrectionOutcome::SkippedWeighted);
        }

        return DB::transaction(function () use ($exercise, $to, $items, $planSets, $loggedSets) {
            $planIds = $items->clone()->join('plan_days', 'plan_days.id', '=', 'plan_items.plan_day_id')
                ->distinct()->pluck('plan_days.plan_id');
            $workouts = SessionExercise::where('exercise_id', $exercise->id)->whereHas('sets')
                ->distinct()->count('workout_session_id');

            $exercise->logging_type = $to;
            $exercise->save();

            // Postgres reads every column's old value in SET, so the reps
            // are still there for the duration. "8–10" becomes 10 s, the
            // most that was asked; the effort target goes, as a time has none
            $planSets->update([
                'target_duration_seconds' => DB::raw('coalesce(target_duration_seconds, target_reps_max)'),
                'target_reps_min' => null,
                'target_reps_max' => null,
                'target_weight_kg' => null,
                'target_rpe' => null,
            ]);
            // Only an exercise counted in reps can be done as fast as possible
            $items->clone()->update(['for_time' => false]);
            // A set done as fast as possible already has its seconds: they stay
            $loggedSets->update([
                'duration_seconds' => DB::raw('coalesce(duration_seconds, reps)'),
                'reps' => null,
                'weight_kg' => null,
            ]);
            // A draft of the plan started before is saved with the warning
            // that the plan was changed elsewhere
            Plan::whereKey($planIds)->increment('version');

            return new CorrectionResult(CorrectionOutcome::Corrected, $planIds->count(), $workouts);
        });
    }
}
