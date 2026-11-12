<?php

/**
 * The correction of the logging types the import guessed wrong (DATA-3,
 * docs/concepts/C2-backend.md C2.14.6, docs/how-to/H1-database.md H1.19): the
 * file database/data/logging-type-corrections.json, the action
 * CorrectLoggingType with its rules, and the command
 * `exercises:correct-logging-types`.
 *
 * The exercises are made by the factory with an external_id, as the import
 * would leave them, instead of importing the whole dataset: the rules are
 * the same, and the test needs no free-exercise-db on the computer. Only
 * Plank is used for the rules, with the three types that matter: reps (the
 * guess), time (the correction) and distance (a third type, chosen by hand).
 */

// Imports: the two actions (the one under test, and the import whose guess
// the file must match), the two enums, the three models the tests write,
// the trait that empties the database, and the File facade
use App\Actions\Exercises\CorrectLoggingType;
use App\Actions\Exercises\ImportFreeExercise;
use App\Enums\CorrectionOutcome;
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\PlanItem;
use App\Models\SessionExercise;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

// RefreshDatabase: every test starts from empty tables, on the
// atleoplan_test database (docs/concepts/C2-backend.md C2.11)
uses(RefreshDatabase::class);

/**
 * The corrections of the repository, decoded.
 *
 * A function at the top of a Pest file is a global PHP function, shared by
 * every test file: its name must not be used by another one
 * (docs/how-to/H1-database.md H1.19.4).
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
    // The factory fills the columns not in #[Fillable] too: factories
    // assign attributes with mass-assignment protection off
    return Exercise::factory()->create(['external_id' => $externalId, 'logging_type' => $type]);
}

// Scenario: Plank as the import leaves it, on reps, used by nobody.
// app() asks Laravel's service container for an object of the class, built
// with whatever its constructor needs, as the command receives it in handle()
// (docs/concepts/C2-backend.md C2.5.3)
it('corrects an exercise still on the guess', function () {
    // Plank, still on the guess
    $plank = guessedExercise('Plank', LoggingType::Reps);

    // What the action says it did
    $outcome = app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time);

    // fresh() reads the row again from the database: $plank is the object
    // made before, and would still say reps whatever the table holds
    expect($outcome)->toBe(CorrectionOutcome::Corrected)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Time);
});

// Scenario: a second run, after the first one corrected Plank
it('changes nothing on a second run', function () {
    guessedExercise('Plank', LoggingType::Time);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::AlreadyRight);
});

// Scenario: an admin set a type of their own in the admin panel
it('keeps a type an admin chose', function () {
    // Plank on neither the guess (reps) nor the correction (time)
    $plank = guessedExercise('Plank', LoggingType::Distance);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::SkippedChangedByHand)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Distance);
});

// Scenario: Plank on the guess, but someone already has it in a plan, or
// did it in a workout. The test runs twice, once per value of ->with() below
// (a Pest "dataset"), each value passed as $usedBy
it('leaves alone an exercise already in a plan or a workout', function (string $usedBy) {
    // Plank, still on the guess
    $plank = guessedExercise('Plank', LoggingType::Reps);
    // A plan item or an exercise of a workout pointing to it; the factory
    // makes the plan or the workout it belongs to
    $usedBy === 'plan'
        ? PlanItem::factory()->create(['exercise_id' => $plank->id])
        : SessionExercise::factory()->create(['exercise_id' => $plank->id]);

    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::SkippedInUse)
        ->and($plank->fresh()->logging_type)->toBe(LoggingType::Reps);
})->with(['plan', 'workout']);

// Scenario: an admin deleted Plank (a soft delete, docs/design/D3-data-model.md D3.7.2)
it('does not bring back an exercise deleted by an admin', function () {
    // Plank, on the guess, then deleted: the row stays, with deleted_at set
    $plank = guessedExercise('Plank', LoggingType::Reps);
    $plank->delete();

    // withTrashed() finds the deleted row, to check that it was not touched
    expect(app(CorrectLoggingType::class)->correct('Plank', LoggingType::Reps, LoggingType::Time))
        ->toBe(CorrectionOutcome::NotFound)
        ->and(Exercise::withTrashed()->find($plank->id)->logging_type)->toBe(LoggingType::Reps);
});

// Scenario: a library just imported, every exercise of the file on its
// guess; the real command, run twice ($this->artisan(), docs/concepts/C2-backend.md C2.14.2)
it('corrects every exercise of the file from the command', function () {
    // The file's entries, each made as the import leaves it
    $rows = loggingTypeCorrections();
    foreach ($rows as $row) {
        guessedExercise($row['id'], LoggingType::from($row['from']));
    }
    // How many there are, for the summary's lines
    $count = count($rows);

    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain("Corrected: {$count}")
        ->assertSuccessful();
    // A second run finds them right
    $this->artisan('exercises:correct-logging-types')
        ->expectsOutputToContain("Already right: {$count}")
        ->assertSuccessful();

    // value() reads one column of the first row; the model's cast still
    // applies, so it gives the enum's case, not the string "time"
    expect(Exercise::where('external_id', 'Plank')->value('logging_type'))->toBe(LoggingType::Time);
});

// Scenario: Plank already in a plan; the command must say which exercise
// it kept, so the person running it can decide what to do
it('names the exercises it kept because they are in use', function () {
    // Plank on the guess, in a plan
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

    // The file's entries
    $rows = loggingTypeCorrections();

    // The same exercises in the file and here, in any order
    // (toEqualCanonicalizing sorts both lists before comparing)
    expect(array_column($rows, 'id'))->toEqualCanonicalizing(array_keys($source));
    foreach ($rows as $row) {
        // `[$a, $b] = …`: the two values of the pair, in two variables
        [$category, $equipment] = $source[$row['id']];
        // Each "from" the guess, each "to" a real change; the second argument
        // of toBe() is the message shown when it fails: the exercise's id
        expect(ImportFreeExercise::loggingTypeFor($category, $equipment)->value)->toBe($row['from'], $row['id'])
            ->and(LoggingType::from($row['to']))->not->toBe(LoggingType::from($row['from']));
    }
});

// Scenario: --path pointing to a file that does not exist
it('fails, naming the file, when the file is missing', function () {
    $this->artisan('exercises:correct-logging-types', ['--path' => '/nowhere/corrections.json'])
        ->expectsOutputToContain('/nowhere/corrections.json does not exist')
        ->assertFailed();
});
