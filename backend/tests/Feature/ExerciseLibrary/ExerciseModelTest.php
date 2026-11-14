<?php

/**
 * The Exercise model and its tables: translations with their fallback, the
 * defaults and casts, the muscles with their role, soft deletes, and what
 * Postgres refuses.
 *
 * The refusals are checked inside DB::transaction(): on Postgres, an error
 * aborts the transaction a test runs in, so it must happen in a savepoint.
 */

use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('reads the name in the current language, falling back to English', function () {
    $exercise = Exercise::factory()->create(['name' => ['en' => 'Barbell bench press', 'it' => 'Panca piana']]);

    app()->setLocale('it');
    expect($exercise->name)->toBe('Panca piana');

    // No German: English instead
    app()->setLocale('de');
    expect($exercise->name)->toBe('Barbell bench press');
});

it('falls back to any language when English is missing too', function () {
    // A personal exercise, written in one language only
    $exercise = Exercise::factory()->personal()->create(['name' => ['it' => 'Panca mia']]);

    // fallbackAny, set in AppServiceProvider: without it, this would be ''
    app()->setLocale('de');
    expect($exercise->name)->toBe('Panca mia');
});

it('starts as a public exercise logged by weight and reps, with nothing machine-translated', function () {
    // create() with only a name: everything else takes its default
    $exercise = Exercise::create(['name' => ['en' => 'Plank']]);

    expect($exercise->isPublic())->toBeTrue()
        ->and($exercise->logging_type)->toBe(LoggingType::WeightReps)
        ->and($exercise->machine_translated)->toBe([]);
    // The same once read back from the database
    expect($exercise->fresh()->logging_type)->toBe(LoggingType::WeightReps);
});

it('belongs to its owner when created through the user', function () {
    $user = User::factory()->create();

    // Through the relation, owner_id is filled by itself
    $exercise = $user->exercises()->create(['name' => ['it' => 'Panca mia']]);

    expect($exercise->owner->is($user))->toBeTrue()
        ->and($exercise->isPublic())->toBeFalse()
        ->and($user->exercises()->count())->toBe(1);
});

it('does not let a request set the owner', function () {
    $someone = User::factory()->create();

    // owner_id is not in #[Fillable]: create() ignores it
    $exercise = Exercise::create(['name' => ['en' => 'Squat'], 'owner_id' => $someone->id]);

    expect($exercise->owner_id)->toBeNull();
});

it('lists its muscles with their role, and its equipment', function () {
    $barbell = Equipment::factory()->create(['slug' => 'barbell']);
    $chest = Muscle::factory()->create(['slug' => 'chest']);
    $triceps = Muscle::factory()->create(['slug' => 'triceps']);
    $exercise = Exercise::factory()->for($barbell)->create();

    $exercise->muscles()->attach($chest, ['role' => MuscleRole::Primary]);
    $exercise->muscles()->attach($triceps, ['role' => MuscleRole::Secondary]);

    // pivot->role is the enum, thanks to the ExerciseMuscle pivot class
    $roles = $exercise->muscles->mapWithKeys(fn (Muscle $muscle) => [$muscle->slug => $muscle->pivot->role]);
    expect($roles->all())->toBe(['chest' => MuscleRole::Primary, 'triceps' => MuscleRole::Secondary])
        ->and($exercise->equipment->slug)->toBe('barbell')
        ->and($chest->exercises->pluck('id')->all())->toBe([$exercise->id])
        ->and($exercise->muscles()->wherePivot('role', MuscleRole::Primary)->pluck('slug')->all())->toBe(['chest']);
});

it('hides a deleted exercise but keeps it for plans and history', function () {
    $exercise = Exercise::factory()->hasAttached(Muscle::factory(), ['role' => MuscleRole::Primary], 'muscles')->create();

    // A soft delete: only deleted_at is filled
    $exercise->delete();

    expect(Exercise::count())->toBe(0)
        ->and(Exercise::withTrashed()->count())->toBe(1);
    $this->assertSoftDeleted($exercise);
    // Its muscles are still there
    $this->assertDatabaseCount('exercise_muscle', 1);
});

it('removes the muscle rows when an exercise is deleted for good', function () {
    $exercise = Exercise::factory()->hasAttached(Muscle::factory()->count(2), ['role' => MuscleRole::Secondary], 'muscles')->create();

    // The cascade takes its pivot rows
    $exercise->forceDelete();

    $this->assertDatabaseCount('exercise_muscle', 0);
    // The muscles themselves stay
    $this->assertDatabaseCount('muscles', 2);
});

it('refuses to delete a user who still owns exercises', function () {
    $exercise = Exercise::factory()->personal()->create();

    expect(fn () => DB::transaction(fn () => $exercise->owner->delete()))
        ->toThrow(QueryException::class, 'Foreign key violation');
});

it('refuses to delete a muscle or equipment still in use', function () {
    $barbell = Equipment::factory()->create();
    $chest = Muscle::factory()->create();
    Exercise::factory()->for($barbell)->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')->create();

    expect(fn () => DB::transaction(fn () => $chest->delete()))->toThrow(QueryException::class, 'Foreign key violation');
    expect(fn () => DB::transaction(fn () => $barbell->delete()))->toThrow(QueryException::class, 'Foreign key violation');
});

it('refuses a logging type outside the list', function () {
    $exercise = Exercise::factory()->create();

    // Straight to the table, past the enum cast: the database's own check
    expect(fn () => DB::transaction(fn () => DB::table('exercises')->where('id', $exercise->id)->update(['logging_type' => 'laps'])))
        ->toThrow(QueryException::class, 'Check violation');
});

it('refuses a muscle twice on the same exercise', function () {
    $chest = Muscle::factory()->create();
    $exercise = Exercise::factory()->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')->create();

    // The primary key is the pair (exercise_id, muscle_id)
    expect(fn () => DB::transaction(fn () => $exercise->muscles()->attach($chest, ['role' => MuscleRole::Secondary])))
        ->toThrow(QueryException::class, 'Unique violation');
});
