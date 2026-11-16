<?php

/**
 * The correction of the logging types the import guessed wrong: the file
 * database/data/logging-type-corrections.json, the action CorrectLoggingType
 * with its rules, and the command `exercises:correct-logging-types`.
 *
 * The exercises are made by the factory with an external_id, as the import
 * would leave them, instead of importing the whole dataset: the rules are
 * the same, and the test needs no free-exercise-db on the computer. Only
 * Plank is used for the rules, with the three types that matter: reps (the
 * guess), time (the correction) and distance (a third type, chosen by hand).
 */

use App\Actions\Exercises\CorrectLoggingType;
use App\Actions\Exercises\ImportFreeExercise;
use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\PlanItem;
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

    $outcome = app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time);

    expect($outcome)->toBe(CorrectionOutcome::Corrected)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Time);
});

it('changes nothing on a second run', function () {
    guessedExercise('Plank', LoggingType::Time);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::AlreadyRight);
});

it('keeps a type an admin chose', function () {
    // Plank on neither the guess (reps) nor the correction (time)
    $plank = guessedExercise('Plank', LoggingType::Distance);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::SkippedChangedByHand)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Distance);
});

it('leaves alone an exercise already in a plan or a workout', function (string $usedBy) {
    $plank = guessedExercise('Plank', LoggingType::Reps);
    $usedBy === 'plan'
        ? PlanItem::factory()->create(['exercise_id' => $plank->id])
        : SessionExercise::factory()->create(['exercise_id' => $plank->id]);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::SkippedInUse)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Reps);
})->with(['plan', 'workout']);

it('does not bring back an exercise deleted by an admin', function () {
    $plank = guessedExercise('Plank', LoggingType::Reps);
    $plank->delete();

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
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
        ->expectsOutputToContain("Corrected: {$count}")
        ->assertSuccessful();
    // A second run finds them right
    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain("Already right: {$count}")
        ->assertSuccessful();

    expect(Exercise::where('external_id', 'Plank')->value('logging_type'))->toBe(LoggingType::Time);
});

// Scenario: Plank already in a plan; the command must say which exercise
// it kept, so the person running it can decide what to do
it('names the exercises it kept because they are in use', function () {
    $plank = guessedExercise('Plank', LoggingType::Reps);
    PlanItem::factory()->create(['exercise_id' => $plank->id]);

    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain('Kept, already in a plan or a workout: 1')
        ->expectsOutputToContain('  Plank')
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
