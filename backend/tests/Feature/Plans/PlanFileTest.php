<?php

/**
 * A plan as a file and back: GET /api/plans/{plan}/export and
 * POST /api/plans/import (app/Actions/Plans/ExportPlan.php, ImportPlan.php;
 * docs/design/D3-data-model.md D3.5.8). What the file holds, how the import
 * finds or creates each exercise, and what it refuses.
 */

use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Enums\SetType;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * A plan of one day: a public exercise with an external id, for time, 50
 * reps; then one of the owner's own, two sets of 10 in a superset with it.
 *
 * @param  User  $owner  the plan's owner
 * @return Plan the plan, saved
 */
function planToExport(User $owner): Plan
{
    // A muscle and an equipment with the slugs of the real lists
    $chest = Muscle::factory()->create(['slug' => 'chest']);
    $bodyOnly = Equipment::factory()->create(['slug' => 'body-only']);
    // The public push-ups, with the id free-exercise-db gives them
    $pushups = Exercise::factory()->create(['external_id' => 'Pushups', 'name' => ['en' => 'Pushups', 'it' => 'Piegamenti'], 'logging_type' => LoggingType::Reps, 'equipment_id' => $bodyOnly->id]);
    $pushups->muscles()->attach($chest, ['role' => MuscleRole::Primary]);
    // The owner's own frog stand, timed, with two steps of instructions
    $frog = Exercise::factory()->for($owner, 'owner')->create(['name' => ['en' => 'Frog stand'], 'logging_type' => LoggingType::Time, 'instructions' => ['en' => ['Squat', 'Lean forward']]]);

    // The plan, its day, then each item with its sets
    $plan = Plan::factory()->for($owner)->create(['name' => 'Calisthenics', 'goal' => 'Skills']);
    $day = PlanDay::factory()->for($plan)->create(['name' => 'Day A', 'position' => 0]);
    $race = PlanItem::factory()->for($day, 'day')->for($pushups)->create(['position' => 0, 'superset_group' => 1, 'for_time' => true, 'rest_seconds' => 60]);
    PlanSet::factory()->for($race, 'item')->create(['position' => 0, 'set_type' => SetType::Normal, 'target_reps_min' => 50, 'target_reps_max' => 50, 'target_weight_kg' => null]);
    $hold = PlanItem::factory()->for($day, 'day')->for($frog)->create(['position' => 1, 'superset_group' => 1, 'rest_seconds' => null, 'notes' => 'Hands wide']);
    // sequence(): each of the two sets gets the next values, positions 0 and 1
    PlanSet::factory()->for($hold, 'item')->count(2)->sequence(['position' => 0], ['position' => 1])->create(['set_type' => SetType::Normal, 'target_reps_min' => null, 'target_reps_max' => null, 'target_weight_kg' => null, 'target_duration_seconds' => 30]);

    return $plan;
}

// --- Export ------------------------------------------------------------------------

it('exports a plan as a file: no ids, each exercise described once', function () {
    $owner = User::factory()->create();
    $plan = planToExport($owner);

    $file = $this->actingAs($owner)->getJson("/api/plans/{$plan->id}/export", ['Accept-Language' => 'it'])
        ->assertOk()
        ->assertJsonPath('format', 'atleoplan.plan')
        ->assertJsonPath('version', 1)
        ->assertJsonPath('plan.name', 'Calisthenics')
        ->assertJsonMissingPath('plan.id')
        ->assertJsonMissingPath('plan.days.0.id')
        ->json();

    // The day's two items, as the file writes them
    $items = $file['plan']['days'][0]['items'];
    expect(array_column($items, 'exercise'))->toBe(['e1', 'e2'])
        ->and($items[0])->toMatchArray(['superset_group' => 1, 'for_time' => true, 'rest_seconds' => 60])
        ->and($items[0]['sets'][0])->toMatchArray(['set_type' => 'normal', 'target_reps_min' => 50, 'target_weight_kg' => null])
        ->and($items[1]['sets'])->toHaveCount(2)
        // The public exercise by its external id, in the request's language
        ->and($file['exercises'][0])->toMatchArray(['ref' => 'e1', 'external_id' => 'Pushups', 'name' => 'Piegamenti', 'equipment' => 'body-only', 'muscles' => [['muscle' => 'chest', 'role' => 'primary']]])
        // The owner's own: no external id, described in full
        ->and($file['exercises'][1])->toMatchArray(['ref' => 'e2', 'external_id' => null, 'name' => 'Frog stand', 'logging_type' => 'time', 'instructions' => ['Squat', 'Lean forward']]);
});

it('does not export someone else\'s plan', function () {
    $plan = planToExport(User::factory()->create());

    $this->actingAs(User::factory()->create())->getJson("/api/plans/{$plan->id}/export")->assertForbidden();
});

// --- Import -------------------------------------------------------------------------

it('imports a file as a new plan, finding the public exercise by its external id', function () {
    $owner = User::factory()->create();
    // Exported in Italian, imported in English: "Piegamenti" is no English
    // name, so only the external id can find the push-ups
    $file = $this->actingAs($owner)->getJson('/api/plans/'.planToExport($owner)->id.'/export', ['Accept-Language' => 'it'])->json();
    // Another user, on the same server: the public exercise is there, the
    // frog stand is not
    $other = User::factory()->create();

    $answer = $this->actingAs($other)->postJson('/api/plans/import', $file, ['Accept-Language' => 'en'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Calisthenics')
        ->assertJsonPath('data.goal', 'Skills')
        ->assertJsonPath('data.days.0.items.0.for_time', true)
        ->assertJsonPath('data.days.0.items.0.superset_group', 1)
        ->assertJsonPath('data.days.0.items.1.notes', 'Hands wide')
        ->assertJsonPath('meta.created_exercises', ['Frog stand']);

    // The new plan, read again from the database with its exercises
    $plan = Plan::with('days.items.exercise')->find($answer->json('data.id'));
    $items = $plan->days[0]->items;
    expect($plan->user_id)->toBe($other->id)
        ->and($items[0]->exercise->external_id)->toBe('Pushups')
        ->and($items[0]->exercise->owner_id)->toBeNull()
        // The frog stand created as the importer's own, from the file
        ->and($items[1]->exercise->owner_id)->toBe($other->id)
        ->and($items[1]->exercise->logging_type)->toBe(LoggingType::Time)
        ->and($items[1]->exercise->instructions)->toBe(['Squat', 'Lean forward']);
});

it('uses the importer\'s own exercise of the same name, and never creates one twice', function () {
    $owner = User::factory()->create();
    $file = $this->actingAs($owner)->getJson('/api/plans/'.planToExport($owner)->id.'/export')->json();
    $other = User::factory()->create();
    // The importer has a frog stand of their own, written differently
    $mine = Exercise::factory()->for($other, 'owner')->create(['name' => ['it' => '  FROG STAND ']]);

    $this->actingAs($other)->postJson('/api/plans/import', $file)
        ->assertCreated()
        ->assertJsonPath('data.days.0.items.1.exercise_id', $mine->id)
        ->assertJsonPath('meta.created_exercises', []);
    // A second import: the same plan again, still no new exercise
    $this->actingAs($other)->postJson('/api/plans/import', $file)
        ->assertJsonPath('meta.created_exercises', []);

    expect($other->plans()->count())->toBe(2)
        ->and($other->exercises()->count())->toBe(1);
});

it('creates a missing exercise without the muscles and equipment this server lacks', function () {
    $user = User::factory()->create();
    // The one muscle of the file this server has; no "serratus", no "wall-bars"
    Muscle::factory()->create(['slug' => 'shoulders']);
    // A file written by hand: one exercise used twice, one not used
    $file = [
        'format' => 'atleoplan.plan',
        'version' => 1,
        'plan' => ['name' => 'Handstands', 'days' => [['name' => 'Day A', 'items' => [
            ['exercise' => 'e1', 'sets' => [['set_type' => 'normal', 'target_duration_seconds' => 30]]],
            ['exercise' => 'e1', 'sets' => []],
        ]]]],
        'exercises' => [
            // A public exercise this server does not have, by its id
            ['ref' => 'e1', 'external_id' => 'AtleoPlan_Wall_Handstand', 'name' => 'Wall handstand', 'logging_type' => 'time', 'equipment' => 'wall-bars', 'muscles' => [['muscle' => 'shoulders', 'role' => 'primary'], ['muscle' => 'serratus', 'role' => 'secondary']]],
            // Not used by the plan: not created
            ['ref' => 'e2', 'name' => 'Unused', 'logging_type' => 'reps'],
        ],
    ];

    $answer = $this->actingAs($user)->postJson('/api/plans/import', $file)
        ->assertCreated()
        // Used twice, created once
        ->assertJsonPath('meta.created_exercises', ['Wall handstand']);

    // The exercise the import created
    $created = Exercise::with('muscles')->find($answer->json('data.days.0.items.0.exercise_id'));
    expect($created->owner_id)->toBe($user->id)
        ->and($created->external_id)->toBeNull()
        ->and($created->equipment_id)->toBeNull()
        ->and($created->muscles->pluck('slug')->all())->toBe(['shoulders'])
        ->and($answer->json('data.days.0.items.1.exercise_id'))->toBe($created->id)
        ->and($user->exercises()->count())->toBe(1);
});

it('finds a public exercise by its name when the file has it as a personal one', function () {
    // The library's frog stand, and someone importing a plan whose frog
    // stand was a personal exercise where it came from: no external id
    $public = Exercise::factory()->create(['name' => ['en' => 'Frog Stand', 'it' => 'Frog stand']]);
    $user = User::factory()->create();
    $file = [
        'format' => 'atleoplan.plan',
        'version' => 1,
        'plan' => ['name' => 'Skills', 'days' => [['name' => 'Day A', 'items' => [['exercise' => 'e1', 'sets' => []]]]]],
        'exercises' => [['ref' => 'e1', 'external_id' => null, 'name' => 'frog stand', 'logging_type' => 'time']],
    ];

    $this->actingAs($user)->postJson('/api/plans/import', $file, ['Accept-Language' => 'en'])
        ->assertCreated()
        ->assertJsonPath('data.days.0.items.0.exercise_id', $public->id)
        ->assertJsonPath('meta.created_exercises', []);
});

it('never brings back a deleted exercise', function () {
    $owner = User::factory()->create();
    $file = $this->actingAs($owner)->getJson('/api/plans/'.planToExport($owner)->id.'/export')->json();
    // The public push-ups deleted by an admin meanwhile
    Exercise::query()->where('external_id', 'Pushups')->first()->delete();
    $other = User::factory()->create();

    $this->actingAs($other)->postJson('/api/plans/import', $file)
        ->assertCreated()
        ->assertJsonPath('meta.created_exercises', ['Pushups', 'Frog stand']);
});

it('refuses a file that is not a plan, or names an exercise it does not describe', function (array $change, string $field) {
    $owner = User::factory()->create();
    $file = $this->actingAs($owner)->getJson('/api/plans/'.planToExport($owner)->id.'/export')->json();

    // array_replace_recursive(): the real file, with the dataset's change
    // written over it, key by key at every depth
    $this->actingAs($owner)->postJson('/api/plans/import', array_replace_recursive($file, $change))
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
    // Nothing written
    expect($owner->plans()->count())->toBe(1);
})->with([
    'another format' => [['format' => 'chronovault.export'], 'format'],
    'a later version' => [['version' => 2], 'version'],
    'an unknown exercise' => [['plan' => ['days' => [['items' => [['exercise' => 'e9']]]]]], 'plan.days.0.items.0.exercise'],
    'reps upside down' => [['plan' => ['days' => [['items' => [['sets' => [['target_reps_min' => 10, 'target_reps_max' => 8]]]]]]]], 'plan.days.0.items.0.sets.0.target_reps_max'],
    'a logging type unknown' => [['exercises' => [['logging_type' => 'laps']]], 'exercises.0.logging_type'],
]);
