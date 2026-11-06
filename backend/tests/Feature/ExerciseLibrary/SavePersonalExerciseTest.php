<?php

/**
 * The action SavePersonalExercise, called directly, without HTTP: the rules
 * of saving a personal exercise (one language, muscles as a whole list,
 * partial changes). The API tests (ExerciseApiTest.php) check that the
 * endpoints call it; this file checks what it does.
 *
 * app(SavePersonalExercise::class) asks Laravel's service container for one,
 * as the controller's parameter does. app()->setLocale() stands in for the
 * Accept-Language header of a request.
 */

use App\Actions\Exercises\SavePersonalExercise;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates the exercise for its owner, in the current language', function () {
    $user = User::factory()->create();
    app()->setLocale('de');

    $exercise = app(SavePersonalExercise::class)->create($user, [
        'name' => 'Bankdrücken',
        'aliases' => ['Bank'],
        'logging_type' => 'time',
    ]);

    expect($exercise->isOwnedBy($user))->toBeTrue()
        ->and($exercise->getTranslations('name'))->toBe(['de' => 'Bankdrücken'])
        ->and($exercise->getTranslations('aliases'))->toBe(['de' => ['Bank']])
        ->and($exercise->logging_type)->toBe(LoggingType::Time)
        // Not sent: NULL in the database
        ->and($exercise->getRawOriginal('description'))->toBeNull();
});

it('replaces the other languages when changed in a new one', function () {
    $save = app(SavePersonalExercise::class);
    app()->setLocale('it');
    $exercise = $save->create(User::factory()->create(), ['name' => 'Panca', 'description' => 'Presa larga.']);

    // The user switched the app to English, then renamed the exercise
    app()->setLocale('en');
    $save->update($exercise, ['name' => 'Bench']);

    expect($exercise->fresh()->getTranslations('name'))->toBe(['en' => 'Bench'])
        // The description was not sent: still Italian
        ->and($exercise->fresh()->getTranslations('description'))->toBe(['it' => 'Presa larga.']);
});

it('empties a field sent as null', function () {
    $save = app(SavePersonalExercise::class);
    $exercise = $save->create(User::factory()->create(), ['name' => 'Panca', 'description' => 'Presa larga.', 'aliases' => ['a']]);

    $save->update($exercise, ['description' => null, 'aliases' => []]);

    // NULL, not {"en": null}
    expect($exercise->fresh()->getRawOriginal('description'))->toBeNull()
        ->and($exercise->fresh()->getRawOriginal('aliases'))->toBeNull();
});

it('makes the muscles exactly the list sent, and leaves them when none is sent', function () {
    $save = app(SavePersonalExercise::class);
    [$chest, $triceps, $shoulders] = Muscle::factory()->count(3)->create();
    $exercise = $save->create(User::factory()->create(), ['name' => 'Panca', 'muscles' => [
        ['id' => $chest->id, 'role' => 'primary'],
        ['id' => $triceps->id, 'role' => 'secondary'],
    ]]);

    // Triceps removed, shoulders added, chest becomes secondary
    $save->update($exercise, ['muscles' => [
        ['id' => $chest->id, 'role' => 'secondary'],
        ['id' => $shoulders->id, 'role' => 'primary'],
    ]]);
    // A change without `muscles`
    $save->update($exercise, ['name' => 'Panca stretta']);

    // muscle id => role, as the database has them now
    $roles = $exercise->fresh()->muscles->mapWithKeys(fn (Muscle $m) => [$m->id => $m->pivot->role])->all();
    expect($roles)->toEqualCanonicalizing([$chest->id => MuscleRole::Secondary, $shoulders->id => MuscleRole::Primary]);
});

it('removes every muscle when sent an empty list', function () {
    $save = app(SavePersonalExercise::class);
    $exercise = $save->create(User::factory()->create(), ['name' => 'Panca', 'muscles' => [
        ['id' => Muscle::factory()->create()->id, 'role' => 'primary'],
    ]]);

    $save->update($exercise, ['muscles' => []]);

    expect($exercise->fresh()->muscles)->toBeEmpty();
});
