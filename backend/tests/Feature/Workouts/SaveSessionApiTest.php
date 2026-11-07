<?php

/**
 * PUT /api/sessions/{id}: a whole workout sent by the phone, late and maybe
 * more than once (docs/design/D3-data-model.md D3.6.5). The five situations of
 * D3.6.5's table, the links to a plan that changed meanwhile, the values that
 * fit how an exercise is logged, and every refusal.
 */

use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\LoggedSet;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\SessionExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * A UUID as the phone makes it.
 */
function phoneId(): string
{
    return (string) Str::uuid7();
}

/**
 * A set as the phone sends it: 8 reps at 80 kg.
 *
 * @param  array<string, mixed>  $changes  the fields to change
 * @return array<string, mixed>
 */
function phoneSet(array $changes = []): array
{
    return [
        'id' => phoneId(),
        'set_type' => 'normal',
        'weight_kg' => 80,
        'reps' => 8,
        'duration_seconds' => null,
        'distance_meters' => null,
        'completed_at' => '2026-11-09T18:05:00+01:00',
        ...$changes,
    ];
}

/**
 * A finished free workout of one exercise and two sets, as the phone sends it.
 *
 * @param  Exercise  $exercise  the exercise done
 * @param  array<string, mixed>  $changes  the session's fields to change
 * @return array<string, mixed>
 */
function phoneSession(Exercise $exercise, array $changes = []): array
{
    return [
        'plan_id' => null,
        'plan_day_id' => null,
        'plan_name' => null,
        'day_name' => null,
        'started_at' => '2026-11-09T18:00:00+01:00',
        'finished_at' => '2026-11-09T19:00:00+01:00',
        'duration_seconds' => 3500,
        'feeling' => 4,
        'notes' => null,
        'exercises' => [[
            'id' => phoneId(),
            'exercise_id' => $exercise->id,
            'plan_item_id' => null,
            'superset_group' => null,
            'notes' => null,
            'sets' => [phoneSet(['set_type' => 'warm_up', 'weight_kg' => 40, 'reps' => 10]), phoneSet()],
        ]],
        ...$changes,
    ];
}

// --- The five situations of D3.6.5 -----------------------------------------------

it('saves a new workout with the ids of the phone, and answers 201', function () {
    $user = User::factory()->create();
    $id = phoneId();
    $body = phoneSession(Exercise::factory()->create());

    $this->actingAs($user)->putJson("/api/sessions/{$id}", $body)
        ->assertCreated()
        ->assertJsonPath('data.id', $id)
        ->assertJsonPath('data.feeling', 4)
        ->assertJsonPath('data.exercises.0.id', $body['exercises'][0]['id'])
        ->assertJsonPath('data.exercises.0.sets.*.id', array_column($body['exercises'][0]['sets'], 'id'))
        ->assertJsonPath('data.exercises.0.sets.1.weight_kg', '80.000');

    $session = WorkoutSession::find($id);
    expect($session->user_id)->toBe($user->id)
        // The offset of the phone kept the exact moment: 18:00 in Rome is 17:00 UTC
        ->and($session->started_at->utc()->format('H:i'))->toBe('17:00')
        ->and($session->sessionExercises[0]->sets->pluck('position')->all())->toBe([0, 1]);
});

it('changes nothing when the same workout arrives again', function () {
    $user = User::factory()->create();
    $id = phoneId();
    $body = phoneSession(Exercise::factory()->create());

    $this->actingAs($user)->putJson("/api/sessions/{$id}", $body)->assertCreated();
    $this->actingAs($user)->putJson("/api/sessions/{$id}", $body)->assertOk();

    expect(WorkoutSession::count())->toBe(1)
        ->and(SessionExercise::count())->toBe(1)
        ->and(LoggedSet::count())->toBe(2);
});

it('refuses the UUID of another user\'s workout', function () {
    $theirs = WorkoutSession::factory()->create();

    $this->actingAs(User::factory()->create())
        ->putJson("/api/sessions/{$theirs->id}", phoneSession(Exercise::factory()->create()))
        ->assertForbidden();

    expect($theirs->fresh()->sessionExercises)->toHaveCount(0);
});

it('removes the sets and exercises the phone no longer sends', function () {
    $user = User::factory()->create();
    $id = phoneId();
    $body = phoneSession(Exercise::factory()->create());
    $body['exercises'][] = ['id' => phoneId(), 'exercise_id' => Exercise::factory()->create()->id, 'sets' => []];
    $this->actingAs($user)->putJson("/api/sessions/{$id}", $body)->assertCreated();

    // On the phone: the warm-up unticked, the second exercise taken out
    array_shift($body['exercises'][0]['sets']);
    array_pop($body['exercises']);
    $this->actingAs($user)->putJson("/api/sessions/{$id}", $body)->assertOk();

    expect(SessionExercise::count())->toBe(1)
        ->and(LoggedSet::count())->toBe(1)
        // The set left is now the first
        ->and(LoggedSet::first()->position)->toBe(0);
});

it('leaves a workout deleted elsewhere deleted, and answers 410', function () {
    $user = User::factory()->create();
    $session = WorkoutSession::factory()->for($user)->create(['notes' => 'Before']);
    $session->delete();

    $this->actingAs($user)
        ->putJson("/api/sessions/{$session->id}", phoneSession(Exercise::factory()->create(), ['notes' => 'From an old send']))
        ->assertStatus(410);

    $fresh = WorkoutSession::withTrashed()->find($session->id);
    expect($fresh->trashed())->toBeTrue()
        ->and($fresh->notes)->toBe('Before')
        ->and(SessionExercise::count())->toBe(0);
});

// --- Links to a plan that may have changed --------------------------------------

it('keeps the links to the user\'s plan, day and item', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->has(PlanDay::factory()->has(PlanItem::factory(), 'items'), 'days')->create();
    $item = $plan->days[0]->items[0];
    $body = phoneSession($item->exercise, ['plan_id' => $plan->id, 'plan_day_id' => $plan->days[0]->id, 'plan_name' => 'Push Pull Legs']);
    $body['exercises'][0]['plan_item_id'] = $item->id;

    $this->actingAs($user)->putJson('/api/sessions/'.phoneId(), $body)
        ->assertCreated()
        ->assertJsonPath('data.plan_id', $plan->id)
        ->assertJsonPath('data.plan_day_id', $plan->days[0]->id)
        ->assertJsonPath('data.exercises.0.plan_item_id', $item->id);
});

it('saves a workout whose plan was deleted meanwhile, without the links', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->has(PlanDay::factory()->has(PlanItem::factory(), 'items'), 'days')->create();
    $item = $plan->days[0]->items[0];
    $body = phoneSession($item->exercise, ['plan_id' => $plan->id, 'plan_day_id' => $plan->days[0]->id, 'plan_name' => 'Push Pull Legs', 'day_name' => 'Day A']);
    $body['exercises'][0]['plan_item_id'] = $item->id;
    // On the laptop, while the phone was offline
    $plan->delete();

    $this->actingAs($user)->putJson('/api/sessions/'.phoneId(), $body)
        ->assertCreated()
        ->assertJsonPath('data.plan_id', null)
        ->assertJsonPath('data.plan_day_id', null)
        ->assertJsonPath('data.plan_name', 'Push Pull Legs')
        ->assertJsonPath('data.exercises.0.plan_item_id', null);
});

it('does not link someone else\'s plan', function () {
    $theirs = Plan::factory()->has(PlanDay::factory(), 'days')->create();
    $body = phoneSession(Exercise::factory()->create(), ['plan_id' => $theirs->id, 'plan_day_id' => $theirs->days[0]->id]);

    $this->actingAs(User::factory()->create())->putJson('/api/sessions/'.phoneId(), $body)
        ->assertCreated()
        ->assertJsonPath('data.plan_id', null)
        ->assertJsonPath('data.plan_day_id', null);
});

// --- The values of a set ----------------------------------------------------------

it('asks for the values that fit how the exercise is logged, and only those', function (LoggingType $type, array $set, array $errors) {
    $exercise = Exercise::factory()->create(['logging_type' => $type]);
    $body = phoneSession($exercise);
    $body['exercises'][0]['sets'] = [phoneSet($set)];

    $this->actingAs(User::factory()->create())->putJson('/api/sessions/'.phoneId(), $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(array_map(fn (string $field) => "exercises.0.sets.0.{$field}", $errors));
})->with([
    'weight and reps, no weight' => [LoggingType::WeightReps, ['weight_kg' => null], ['weight_kg']],
    'reps only, with a weight' => [LoggingType::Reps, [], ['weight_kg']],
    'time, with reps and no time' => [LoggingType::Time, ['weight_kg' => null], ['reps', 'duration_seconds']],
    'distance, with nothing' => [LoggingType::Distance, ['weight_kg' => null, 'reps' => null], ['distance_meters']],
]);

it('accepts a timed set with its time alone', function () {
    $plank = Exercise::factory()->create(['logging_type' => LoggingType::Time]);
    $body = phoneSession($plank);
    $body['exercises'][0]['sets'] = [phoneSet(['weight_kg' => null, 'reps' => null, 'duration_seconds' => 60])];

    $this->actingAs(User::factory()->create())->putJson('/api/sessions/'.phoneId(), $body)
        ->assertCreated()
        ->assertJsonPath('data.exercises.0.sets.0.duration_seconds', 60);
});

it('says in the user\'s language what does not fit', function () {
    $exercise = Exercise::factory()->create(['logging_type' => LoggingType::Reps]);
    $body = phoneSession($exercise);
    $body['exercises'][0]['sets'] = [phoneSet()];

    $this->actingAs(User::factory()->create())
        ->putJson('/api/sessions/'.phoneId(), $body, ['Accept-Language' => 'it'])
        ->assertJsonValidationErrors(['exercises.0.sets.0.weight_kg' => 'Il campo peso non si usa per come è registrato questo esercizio.']);
});

// --- Refusals -------------------------------------------------------------------------

it('refuses the ids of another workout\'s exercises and sets', function () {
    $other = LoggedSet::factory()->create();
    $body = phoneSession(Exercise::factory()->create());
    $body['exercises'][0]['id'] = $other->session_exercise_id;
    $body['exercises'][0]['sets'][0]['id'] = $other->id;

    $this->actingAs(User::factory()->create())->putJson('/api/sessions/'.phoneId(), $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['exercises.0.id', 'exercises.0.sets.0.id']);
});

it('refuses an end before the start, and a feeling of 6', function () {
    $body = phoneSession(Exercise::factory()->create(), ['finished_at' => '2026-11-09T17:00:00+01:00', 'feeling' => 6]);

    $this->actingAs(User::factory()->create())->putJson('/api/sessions/'.phoneId(), $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['finished_at', 'feeling']);
});

it('answers 404 to an address that is not a UUID, and 401 to a visitor', function () {
    // The visitor first: actingAs() signs in for every request after it
    $this->putJson('/api/sessions/'.phoneId(), [])->assertUnauthorized();
    $this->actingAs(User::factory()->create())->putJson('/api/sessions/12', [])->assertNotFound();
});
