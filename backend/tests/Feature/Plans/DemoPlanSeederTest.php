<?php

/**
 * DemoPlanSeeder: the two example plans of the development database. What it
 * writes, that it waits for the exercise library, and that it can run again.
 */

use App\Models\Exercise;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\DemoPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * The public exercises the seeder looks for, made with the factory: one per
 * external id it names.
 */
function seedDemoExercises(): void
{
    // The seeder's private list, so the two cannot drift
    $externalIds = (new ReflectionClassConstant(DemoPlanSeeder::class, 'EXERCISES'))->getValue();
    foreach ($externalIds as $externalId) {
        Exercise::factory()->create(['external_id' => $externalId]);
    }
}

it('gives a user with no plans an active plan of three days and an archived one', function () {
    seedDemoExercises();
    $user = User::factory()->create();

    $this->seed(DemoPlanSeeder::class);

    $plans = $user->plans()->withCount('days')->orderBy('name')->get();
    expect($plans->pluck('name')->all())->toBe(['Full body', 'Push Pull Legs'])
        ->and($plans->pluck('days_count')->all())->toBe([1, 3])
        ->and($user->fresh()->active_plan_id)->toBe($plans[1]->id)
        ->and($plans[0]->archived_at)->not->toBeNull();
});

it('leaves alone a user who already has a plan, so it can run again', function () {
    seedDemoExercises();
    $user = User::factory()->create();

    $this->seed(DemoPlanSeeder::class);
    $this->seed(DemoPlanSeeder::class);

    expect($user->plans()->count())->toBe(2);
});

it('writes nothing, and says why, before the library is imported', function () {
    User::factory()->create();

    $this->artisan('db:seed', ['--class' => DemoPlanSeeder::class])
        ->expectsOutputToContain('run `make exercises-import` first')
        ->assertSuccessful();

    expect(Plan::count())->toBe(0);
});
