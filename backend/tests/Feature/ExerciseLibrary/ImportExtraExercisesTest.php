<?php

/**
 * The extra exercises (docs/how-to/H1-database.md H1.17): the file
 * database/data/extra-exercises.json, the command `exercises:import-extra`
 * that adds them to the public library, and their translations, written by
 * `exercises:translate` from the same files as free-exercise-db's.
 *
 * The real file of the repository is imported, not a sample: a mistake in it
 * (a muscle we do not have, a logging type misspelt, a missing translation)
 * fails here, not on someone's database.
 */

use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\User;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

// Before each test: the fixed lists the exercises point to
beforeEach(function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);
});

/**
 * The extra exercises of the repository, decoded.
 *
 * @return list<array<string, mixed>>
 */
function extraExercises(): array
{
    return json_decode(File::get(database_path('data/extra-exercises.json')), true, flags: JSON_THROW_ON_ERROR);
}

it('imports every extra exercise once, however many times it runs', function () {
    $count = count(extraExercises());

    $this->artisan('exercises:import-extra')
        ->expectsOutputToContain("Created: {$count}")
        ->assertSuccessful();
    // A second run finds them by external_id and leaves them alone
    $this->artisan('exercises:import-extra')
        ->expectsOutputToContain("Unchanged: {$count}")
        ->assertSuccessful();

    expect(Exercise::where('external_id', 'like', 'AtleoPlan\_%')->count())->toBe($count);
});

it('keeps their logging type, English aliases, equipment and muscles', function () {
    $this->artisan('exercises:import-extra')->assertSuccessful();

    $frogStand = Exercise::where('external_id', 'AtleoPlan_Frog_Stand')->firstOrFail();
    $swing = Exercise::where('external_id', 'AtleoPlan_Two-Arm_Kettlebell_Swing')->firstOrFail();

    // Held for a time, although body weight would guess reps
    expect($frogStand->logging_type)->toBe(LoggingType::Time)
        ->and($frogStand->getTranslation('aliases', 'en'))->toBe(['crow pose', 'frog balance'])
        ->and($frogStand->equipment->slug)->toBe('body-only')
        ->and($frogStand->muscles->pluck('slug')->sort()->values()->all())->toBe(['abdominals', 'forearms', 'shoulders', 'triceps'])
        ->and($frogStand->isPublic())->toBeTrue()
        // A weight and reps, with a kettlebell
        ->and($swing->logging_type)->toBe(LoggingType::WeightReps)
        ->and($swing->equipment->slug)->toBe('kettlebells');
});

it('makes them found in Italian once translated', function () {
    $this->artisan('exercises:import-extra')->assertSuccessful();
    $this->artisan('exercises:translate')->assertSuccessful();

    $user = User::factory()->create();
    $names = fn (string $term) => $this->actingAs($user)
        ->getJson('/api/exercises?filter[search]='.urlencode($term), ['Accept-Language' => 'it'])
        ->assertOk()
        ->json('data.*.name');

    expect($names('trazioni al petto'))->toBe(['Trazioni al petto'])
        ->and($names('frog stand'))->toBe(['Frog stand'])
        ->and($names('voltabraccia'))->toBe(['Voltabraccia']);
});

it('has every extra exercise in the three translation files, step for step', function () {
    foreach (['it', 'es', 'de'] as $locale) {
        $entries = json_decode(File::get(database_path("data/exercise-translations/{$locale}.json")), true, flags: JSON_THROW_ON_ERROR);
        foreach (extraExercises() as $exercise) {
            expect($entries)->toHaveKey($exercise['id'])
                ->and(count($entries[$exercise['id']]['instructions']))->toBe(count($exercise['instructions']), "{$locale} {$exercise['id']}");
        }
    }
});

it('fails, naming the file, when the file is missing', function () {
    $this->artisan('exercises:import-extra', ['--path' => '/nowhere/extra.json'])
        ->expectsOutputToContain('Extra exercises not found: /nowhere/extra.json does not exist.')
        ->assertFailed();
});
