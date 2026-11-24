<?php

/**
 * The correction of the logging types the import guessed wrong: the file
 * database/data/logging-type-corrections.json, the action CorrectLoggingType
 * with its rules, and the command `exercises:correct-logging-types`.
 *
 * The exercises are made by the factory with an external_id, as the import
 * would leave them, instead of importing the whole dataset: the rules are
 * the same, and the test needs no free-exercise-db on the computer. Only
 * Plank is used for the rules, with the types that matter: reps and weight
 * and reps (the guesses), time (the correction) and distance (a third type,
 * chosen by hand, or a correction with no conversion of the sets).
 */

use App\Actions\Exercises\CorrectLoggingType;
use App\Actions\Exercises\ImportFreeExercise;
use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\LoggedSet;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\SessionExercise;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

/**
 * The corrections of the repository, decoded. Pest helpers are global
 * functions: the name must be unique across test files.
 *
 * @return list<array{id: string, from: string, to: string, why: string}>
 */
function loggingTypeCorrections(): array
{
    return json_decode(File::get(database_path('data/logging-type-corrections.json')), true, flags: JSON_THROW_ON_ERROR);
}

/**
 * Plank used as the guess had it, in a plan and a workout: "3 × 30" meant
 * seconds. The plan has a range and an effort target, the workout a set done
 * as fast as possible, which has its seconds already.
 *
 * @return array{item: PlanItem, ranged: PlanSet, planned: PlanSet, session: SessionExercise, held: LoggedSet, timed: LoggedSet}
 */
function plankInUse(Exercise $plank): array
{
    $item = PlanItem::factory()->create(['exercise_id' => $plank->id, 'for_time' => true]);
    $session = SessionExercise::factory()->create(['exercise_id' => $plank->id]);
    $set = ['target_weight_kg' => null, 'plan_item_id' => $item->id];

    return [
        'item' => $item,
        'ranged' => PlanSet::factory()->create([...$set, 'position' => 0, 'target_reps_min' => 20, 'target_reps_max' => 30, 'target_rpe' => 8]),
        'planned' => PlanSet::factory()->create([...$set, 'position' => 1, 'target_reps_min' => 30, 'target_reps_max' => 30]),
        'session' => $session,
        'held' => LoggedSet::factory()->create(['session_exercise_id' => $session->id, 'weight_kg' => null, 'reps' => 30]),
        'timed' => LoggedSet::factory()->create(['session_exercise_id' => $session->id, 'position' => 1, 'weight_kg' => null, 'reps' => 30, 'duration_seconds' => 41]),
    ];
}

/**
 * A public exercise as the import leaves it: an external_id, the guessed type.
 *
 * @param  string  $externalId  its id in free-exercise-db, such as "Plank"
 * @param  LoggingType  $type  its logging type now
 */
function guessedExercise(string $externalId, LoggingType $type): Exercise
{
    return Exercise::factory()->create(['external_id' => $externalId, 'logging_type' => $type]);
}

it('corrects an exercise still on the guess', function () {
    $plank = guessedExercise('Plank', LoggingType::Reps);

    $outcome = app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time)->outcome;

    expect($outcome)->toBe(CorrectionOutcome::Corrected)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Time);
});

it('changes nothing on a second run', function () {
    guessedExercise('Plank', LoggingType::Time);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time)->outcome)
        ->toBe(CorrectionOutcome::AlreadyRight);
});

it('keeps a type an admin chose', function () {
    // Plank on neither the guess (reps) nor the correction (time)
    $plank = guessedExercise('Plank', LoggingType::Distance);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time)->outcome)
        ->toBe(CorrectionOutcome::SkippedChangedByHand)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Distance);
});

describe('an exercise already in a plan or a workout', function () {
    it('moves the reps of its sets to seconds', function (LoggingType $guess) {
        $plank = guessedExercise('Plank', $guess);
        $used = plankInUse($plank);
        $version = $used['item']->day->plan->version;

        $result = app(CorrectLoggingType::class)->correct('Plank', $guess, LoggingType::Time);

        expect($result->outcome)->toBe(CorrectionOutcome::Corrected)
            ->and($result->plans)->toBe(1)
            ->and($result->workouts)->toBe(1)
            ->and($plank->fresh()->logging_type)->toBe(LoggingType::Time)
            // The plan reads 3 × 30 s; the most of a range, and no effort target
            ->and($used['ranged']->fresh()->only(['target_reps_min', 'target_reps_max', 'target_duration_seconds', 'target_rpe']))
            ->toBe(['target_reps_min' => null, 'target_reps_max' => null, 'target_duration_seconds' => 30, 'target_rpe' => null])
            ->and($used['planned']->fresh()->target_duration_seconds)->toBe(30)
            ->and($used['item']->fresh()->for_time)->toBeFalse()
            ->and($used['item']->day->plan->fresh()->version)->toBe($version + 1)
            // History reads 30 s; a set with its seconds keeps them
            ->and($used['held']->fresh()->only(['reps', 'duration_seconds']))->toBe(['reps' => null, 'duration_seconds' => 30])
            ->and($used['timed']->fresh()->only(['reps', 'duration_seconds']))->toBe(['reps' => null, 'duration_seconds' => 41]);
    })->with([LoggingType::Reps, LoggingType::WeightReps]);

    it('changes nothing on a second run', function () {
        $plank = guessedExercise('Plank', LoggingType::Reps);
        $used = plankInUse($plank);
        $correct = app(CorrectLoggingType::class);
        $correct->correct('Plank', LoggingType::Reps, LoggingType::Time);
        $version = $used['item']->day->plan->fresh()->version;

        expect($correct->correct('Plank', LoggingType::Reps, LoggingType::Time)->outcome)->toBe(CorrectionOutcome::AlreadyRight)
            ->and($used['item']->day->plan->fresh()->version)->toBe($version)
            ->and($used['held']->fresh()->duration_seconds)->toBe(30);
    });

    it('converts the sets of a deleted workout, which can be brought back', function () {
        $plank = guessedExercise('Plank', LoggingType::Reps);
        $used = plankInUse($plank);
        $used['session']->session->delete();

        app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time);

        expect($used['held']->fresh()->duration_seconds)->toBe(30);
    });

    // Scenario: a weight held for a time, such as a plate pinch: the time has
    // no place for the kilograms, so nothing changes
    it('leaves it alone when a set has a weight', function (string $where) {
        $plank = guessedExercise('Plank', LoggingType::WeightReps);
        $used = plankInUse($plank);
        $where === 'plan'
            ? $used['planned']->update(['target_weight_kg' => 20])
            : $used['held']->update(['weight_kg' => 20]);

        expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::WeightReps, LoggingType::Time)->outcome)
            ->toBe(CorrectionOutcome::SkippedWeighted)
            ->and($plank->fresh()->logging_type)->toBe(LoggingType::WeightReps)
            ->and($used['planned']->fresh()->target_reps_max)->toBe(30)
            ->and($used['held']->fresh()->reps)->toBe(30);
    })->with(['plan', 'workout']);

    it('leaves it alone when the new type has no conversion', function (string $usedBy) {
        $plank = guessedExercise('Plank', LoggingType::Reps);
        $usedBy === 'plan'
            ? PlanItem::factory()->create(['exercise_id' => $plank->id])
            : SessionExercise::factory()->create(['exercise_id' => $plank->id]);

        expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Distance)->outcome)
            ->toBe(CorrectionOutcome::SkippedInUse)
            ->and($plank->fresh()->logging_type)->toBe(LoggingType::Reps);
    })->with(['plan', 'workout']);
});

it('does not bring back an exercise deleted by an admin', function () {
    $plank = guessedExercise('Plank', LoggingType::Reps);
    $plank->delete();

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time)->outcome)
        ->toBe(CorrectionOutcome::NotFound)
        ->and(Exercise::withTrashed()->find($plank->id)->logging_type)->toBe(LoggingType::Reps);
});

it('corrects every exercise of the file from the command', function () {
    $rows = loggingTypeCorrections();
    foreach ($rows as $row) {
        guessedExercise($row['id'], LoggingType::from($row['from']));
    }
    $count = count($rows);

    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain("Corrected: {$count}, with their sets in 0 plans and 0 workouts")
        ->assertSuccessful();
    // A second run finds them right
    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain("Already right: {$count}")
        ->assertSuccessful();

    expect(Exercise::where('external_id', 'Plank')->value('logging_type'))->toBe(LoggingType::Time);
});

it('says how many plans and workouts it changed', function () {
    plankInUse(guessedExercise('Plank', LoggingType::Reps));

    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain('Corrected: 1, with their sets in 1 plans and 1 workouts')
        ->assertSuccessful();
});

// Scenario: Battling Ropes logged with a weight; the command must say which
// exercise it kept, so the person running it can decide what to do
it('names the exercises it kept', function () {
    $ropes = guessedExercise('Battling_Ropes', LoggingType::WeightReps);
    LoggedSet::factory()->create(['session_exercise_id' => SessionExercise::factory()->create(['exercise_id' => $ropes->id])]);

    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain('Kept, in a plan or a workout with a weight: 1')
        ->expectsOutputToContain('  Battling_Ropes')
        ->assertSuccessful();
});

// The file itself: a wrong "from" would make a correction never apply,
// without any error
it('has a file whose "from" is what the import guesses', function () {
    // The dataset's category and equipment of each entry, as they are in
    // free-exercise-db: the file's "from" must be the guess they give.
    // Kept here, since the dataset is not in the repository
    $source = [
        'Plank' => ['strength', 'body only'],
        'Side_Bridge' => ['strength', 'body only'],
        'Isometric_Chest_Squeezes' => ['plyometrics', 'body only'],
        'Isometric_Neck_Exercise_-_Front_And_Back' => ['strength', 'body only'],
        'Isometric_Neck_Exercise_-_Sides' => ['strength', 'body only'],
        'Mountain_Climbers' => ['plyometrics', null],
        'Balance_Board' => ['strength', 'other'],
        'Downward_Facing_Balance' => ['strength', 'exercise ball'],
        'Battling_Ropes' => ['strength', 'other'],
    ];

    $rows = loggingTypeCorrections();

    expect(array_column($rows, 'id'))->toEqualCanonicalizing(array_keys($source));
    foreach ($rows as $row) {
        [$category, $equipment] = $source[$row['id']];
        // Each "from" the guess, each "to" a real change
        expect(ImportFreeExercise::loggingTypeFor($category, $equipment)->value)->toBe($row['from'], $row['id'])
            ->and(LoggingType::from($row['to']))->not->toBe(LoggingType::from($row['from']));
    }
});

it('fails, naming the file, when the file is missing', function () {
    $this->artisan('exercises:correct-logging-types', ['--path' => '/nowhere/corrections.json'])
        ->expectsOutputToContain('/nowhere/corrections.json does not exist')
        ->assertFailed();
});
