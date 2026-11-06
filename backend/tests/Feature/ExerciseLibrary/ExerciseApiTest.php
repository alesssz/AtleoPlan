<?php

/**
 * GET, POST, PATCH and DELETE on /api/exercises: reading one exercise,
 * creating, changing and deleting personal ones (docs/design/D1-ui.md
 * D1.4.4, D1.4.5), with every refusal of ExercisePolicy
 * (docs/design/D2-decisions.md D2.3): someone else's exercise, and a public
 * one, admins included.
 *
 * The list has its own file, ExerciseListTest.php; the rules of saving
 * (languages, muscles) are tested without HTTP in SavePersonalExerciseTest.php.
 */

use App\Enums\MuscleRole;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- Reading one ---------------------------------------------------------

it('answers 401 to a visitor', function () {
    $exercise = Exercise::factory()->create();

    $this->getJson("/api/exercises/{$exercise->id}")->assertUnauthorized();
    $this->postJson('/api/exercises', ['name' => 'Panca'])->assertUnauthorized();
    $this->patchJson("/api/exercises/{$exercise->id}", ['name' => 'Panca'])->assertUnauthorized();
    $this->deleteJson("/api/exercises/{$exercise->id}")->assertUnauthorized();
});

it('shows a public exercise with every field, in the request\'s language', function () {
    $barbell = Equipment::factory()->create(['slug' => 'barbell']);
    $chest = Muscle::factory()->create(['slug' => 'chest', 'name' => ['en' => 'Chest', 'it' => 'Petto']]);
    $exercise = Exercise::factory()->for($barbell)
        ->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')
        ->create([
            'name' => ['en' => 'Bench press', 'it' => 'Panca piana'],
            'instructions' => ['en' => ['Lie down.'], 'it' => ['Sdraiati.']],
        ]);

    $this->actingAs(User::factory()->create())
        ->getJson("/api/exercises/{$exercise->id}", ['Accept-Language' => 'it'])
        ->assertOk()
        // assertExactJson: this body and nothing else, so a column added to
        // the table cannot reach the app by accident
        ->assertExactJson(['data' => [
            'id' => $exercise->id,
            'name' => 'Panca piana',
            'aliases' => [],
            'description' => null,
            'instructions' => ['Sdraiati.'],
            'logging_type' => 'weight_reps',
            'youtube_url' => null,
            'is_mine' => false,
            'equipment' => ['id' => $barbell->id, 'slug' => 'barbell', 'name' => $barbell->name],
            'muscles' => [['id' => $chest->id, 'slug' => 'chest', 'name' => 'Petto', 'role' => 'primary']],
        ]]);
});

it('shows my own exercise', function () {
    $me = User::factory()->create();
    $exercise = Exercise::factory()->for($me, 'owner')->create();

    $this->actingAs($me)->getJson("/api/exercises/{$exercise->id}")
        ->assertOk()
        ->assertJsonPath('data.is_mine', true)
        ->assertJsonPath('data.equipment', null);
});

it('refuses someone else\'s personal exercise', function () {
    $exercise = Exercise::factory()->personal()->create();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/exercises/{$exercise->id}")
        ->assertForbidden();
});

it('answers 404 for a deleted exercise or one that does not exist', function () {
    $me = User::factory()->create();
    $exercise = Exercise::factory()->for($me, 'owner')->create();
    $exercise->delete();

    $this->actingAs($me)->getJson("/api/exercises/{$exercise->id}")->assertNotFound();
    $this->actingAs($me)->getJson('/api/exercises/999')->assertNotFound();
});

// --- Creating -------------------------------------------------------------

it('creates a personal exercise in the request\'s language', function () {
    $me = User::factory()->create();
    $barbell = Equipment::factory()->create();
    $chest = Muscle::factory()->create();
    $triceps = Muscle::factory()->create();

    $response = $this->actingAs($me)->postJson('/api/exercises', [
        'name' => 'Panca mia',
        'aliases' => ['panca stretta'],
        'description' => 'Con presa stretta.',
        'instructions' => ['Sdraiati.', 'Spingi.'],
        'logging_type' => 'reps',
        'equipment_id' => $barbell->id,
        'youtube_url' => 'https://youtu.be/abc',
        'muscles' => [
            ['id' => $triceps->id, 'role' => 'secondary'],
            ['id' => $chest->id, 'role' => 'primary'],
        ],
    ], ['Accept-Language' => 'it']);

    // 201 Created, with the new exercise
    $response->assertCreated()
        ->assertJsonPath('data.name', 'Panca mia')
        ->assertJsonPath('data.is_mine', true)
        ->assertJsonPath('data.logging_type', 'reps')
        ->assertJsonPath('data.muscles.0.id', $chest->id);

    // In the database: mine, and written in Italian only
    $exercise = Exercise::findOrFail($response->json('data.id'));
    expect($exercise->isOwnedBy($me))->toBeTrue()
        ->and($exercise->getTranslations('name'))->toBe(['it' => 'Panca mia'])
        ->and($exercise->getTranslations('instructions'))->toBe(['it' => ['Sdraiati.', 'Spingi.']])
        ->and($exercise->muscles)->toHaveCount(2);
});

it('creates an exercise from its name alone', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/exercises', ['name' => 'Plank'])
        ->assertCreated()
        ->assertJsonPath('data.logging_type', 'weight_reps')
        ->assertJsonPath('data.muscles', []);
});

it('ignores fields a user may not set: owner, import columns', function () {
    $me = User::factory()->create();
    $someone = User::factory()->create();

    $id = $this->actingAs($me)->postJson('/api/exercises', [
        'name' => 'Panca',
        'owner_id' => $someone->id,
        'external_id' => 'Barbell_Bench_Press',
        'machine_translated' => ['it'],
    ])->assertCreated()->json('data.id');

    // Only the fields in the Form Request's rules reach the action
    $exercise = Exercise::findOrFail($id);
    expect($exercise->isOwnedBy($me))->toBeTrue()
        ->and($exercise->external_id)->toBeNull()
        ->and($exercise->machine_translated)->toBe([]);
});

it('refuses invalid data, with a message per field', function (array $data, string $field) {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/exercises', ['name' => 'Panca', ...$data])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
})->with([
    'no name' => [['name' => ''], 'name'],
    'a name too long' => [['name' => str_repeat('a', 101)], 'name'],
    'an unknown logging type' => [['logging_type' => 'laps'], 'logging_type'],
    'equipment that does not exist' => [['equipment_id' => 999], 'equipment_id'],
    'a muscle that does not exist' => [['muscles' => [['id' => 999, 'role' => 'primary']]], 'muscles.0.id'],
    'a muscle without a role' => [['muscles' => [['id' => 1]]], 'muscles.0.role'],
    'the same alias twice' => [['aliases' => ['panca', 'panca']], 'aliases.0'],
    'a link that is not YouTube' => [['youtube_url' => 'https://vimeo.com/123'], 'youtube_url'],
    'text where a list goes' => [['instructions' => 'Sdraiati.'], 'instructions'],
]);

it('refuses the same muscle twice', function () {
    $chest = Muscle::factory()->create();

    $this->actingAs(User::factory()->create())
        ->postJson('/api/exercises', ['name' => 'Panca', 'muscles' => [
            ['id' => $chest->id, 'role' => 'primary'],
            ['id' => $chest->id, 'role' => 'secondary'],
        ]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['muscles.0.id']);
});

it('answers the errors in the user\'s language', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/exercises', ['youtube_url' => 'https://vimeo.com/1'], ['Accept-Language' => 'it'])
        ->assertJsonPath('errors.name.0', 'Il campo nome è obbligatorio.')
        ->assertJsonPath('errors.youtube_url.0', 'Il formato di link YouTube non è valido.');
});

// --- Changing -------------------------------------------------------------

it('changes my exercise, only in the fields sent', function () {
    $me = User::factory()->create();
    $exercise = Exercise::factory()->for($me, 'owner')->create([
        'name' => ['it' => 'Panca'],
        'description' => ['it' => 'Presa larga.'],
    ]);

    $this->actingAs($me)
        ->patchJson("/api/exercises/{$exercise->id}", ['name' => 'Panca stretta'], ['Accept-Language' => 'it'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Panca stretta')
        // Not sent, so unchanged
        ->assertJsonPath('data.description', 'Presa larga.');
});

it('refuses to change someone else\'s exercise', function () {
    $exercise = Exercise::factory()->personal()->create(['name' => ['en' => 'Theirs']]);

    $this->actingAs(User::factory()->create())
        ->patchJson("/api/exercises/{$exercise->id}", ['name' => 'Mine now'])
        ->assertForbidden();

    expect($exercise->fresh()->name)->toBe('Theirs');
});

it('refuses to change a public exercise, even to an admin', function (bool $admin) {
    $exercise = Exercise::factory()->create();
    // A user, or an admin, by the dataset below
    $user = User::factory()->state(['is_admin' => $admin])->create();

    $this->actingAs($user)
        ->patchJson("/api/exercises/{$exercise->id}", ['name' => 'Renamed'])
        ->assertForbidden();
})->with(['a user' => false, 'an admin' => true]);

it('refuses an empty name when changing', function () {
    $me = User::factory()->create();
    $exercise = Exercise::factory()->for($me, 'owner')->create();

    $this->actingAs($me)
        ->patchJson("/api/exercises/{$exercise->id}", ['name' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// --- Deleting -------------------------------------------------------------

it('deletes my exercise, keeping the row for plans and history', function () {
    $me = User::factory()->create();
    $exercise = Exercise::factory()->for($me, 'owner')->create();

    $this->actingAs($me)->deleteJson("/api/exercises/{$exercise->id}")->assertNoContent();

    // A soft delete: deleted_at is filled
    $this->assertSoftDeleted($exercise);
});

it('refuses to delete someone else\'s exercise or a public one', function (Closure $makeExercise) {
    // The exercise of the scenario, made by the dataset's function
    $exercise = $makeExercise();

    $this->actingAs(User::factory()->admin()->create())
        ->deleteJson("/api/exercises/{$exercise->id}")
        ->assertForbidden();

    $this->assertNotSoftDeleted($exercise);
})->with([
    // Functions, so that the rows are created inside the test, after the
    // database has been reset
    'someone else\'s' => [fn () => Exercise::factory()->personal()->create()],
    'a public one' => [fn () => Exercise::factory()->create()],
]);
