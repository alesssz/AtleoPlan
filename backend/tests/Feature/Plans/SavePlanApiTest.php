<?php

/**
 * POST /api/plans and PUT /api/plans/{plan}: saving a whole plan from the plan
 * editor. What is written, what is kept across saves, retries, the version, and
 * every refusal of PlanRequest and PlanPolicy.
 */

use App\Enums\SetType;
use App\Models\Exercise;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * A UUID as the device makes it.
 */
function deviceId(): string
{
    return (string) Str::uuid7();
}

/**
 * The body the editor sends for a plan of one day with two exercises in a
 * superset, the second with no sets.
 *
 * @param  Exercise  $first  the first exercise
 * @param  Exercise  $second  the second exercise
 * @return array<string, mixed>
 */
function editorBody(Exercise $first, Exercise $second): array
{
    return [
        'id' => deviceId(),
        'name' => 'Push Pull Legs',
        'goal' => 'Hypertrophy',
        'notes' => null,
        'days' => [[
            'id' => deviceId(),
            'name' => 'Day A – Push',
            'items' => [
                [
                    'id' => deviceId(),
                    'exercise_id' => $first->id,
                    'superset_group' => 1,
                    'rest_seconds' => 90,
                    'notes' => 'Shoulder blades back',
                    'for_time' => true,
                    'sets' => [
                        ['set_type' => 'warm_up', 'target_reps_min' => 10, 'target_reps_max' => 10, 'target_weight_kg' => 40],
                        ['set_type' => 'normal', 'target_reps_min' => 8, 'target_reps_max' => 10, 'target_weight_kg' => 82.5, 'target_rpe' => 8.5],
                    ],
                ],
                ['id' => deviceId(), 'exercise_id' => $second->id, 'superset_group' => 1, 'sets' => []],
            ],
        ]],
    ];
}

// --- Creating --------------------------------------------------------------

it('creates a whole plan, keeping the ids made on the device', function () {
    $user = User::factory()->create();
    [$bench, $row] = Exercise::factory()->count(2)->create();
    $body = editorBody($bench, $row);

    $this->actingAs($user)->postJson('/api/plans', $body)
        ->assertCreated()
        ->assertJsonPath('data.id', $body['id'])
        ->assertJsonPath('data.version', 1)
        ->assertJsonPath('data.days.0.items.*.id', array_column($body['days'][0]['items'], 'id'))
        ->assertJsonPath('data.days.0.items.0.sets.1.target_weight_kg', '82.500')
        // As fast as possible on the first; the second sends nothing: false
        ->assertJsonPath('data.days.0.items.0.for_time', true)
        ->assertJsonPath('data.days.0.items.1.for_time', false);

    $plan = Plan::with('days.items.sets')->find($body['id']);
    $item = $plan->days[0]->items[0];
    expect($plan->user_id)->toBe($user->id)
        ->and($plan->days[0]->id)->toBe($body['days'][0]['id'])
        // The positions are the places in the lists
        ->and($plan->days[0]->items->pluck('position')->all())->toBe([0, 1])
        ->and($item->superset_group)->toBe(1)
        ->and($item->sets->pluck('set_type')->all())->toBe([SetType::WarmUp, SetType::Normal])
        ->and($item->sets->pluck('position')->all())->toBe([0, 1])
        ->and($item->sets[1]->target_rpe)->toBe('8.5');
});

it('makes the ids itself when the body has none', function () {
    $user = User::factory()->create();
    $bench = Exercise::factory()->create();

    $id = $this->actingAs($user)->postJson('/api/plans', [
        'name' => 'Full body',
        'days' => [['name' => 'Day A', 'items' => [['exercise_id' => $bench->id, 'sets' => [['set_type' => 'failure']]]]]],
    ])->assertCreated()->json('data.id');

    $plan = Plan::with('days.items.sets')->find($id);
    expect(Str::isUuid($plan->days[0]->items[0]->id))->toBeTrue()
        // A set with its type alone: no targets
        ->and($plan->days[0]->items[0]->sets[0]->set_type)->toBe(SetType::Failure)
        ->and($plan->days[0]->items[0]->sets[0]->target_reps_min)->toBeNull();
});

it('answers a retry of the same plan with the plan already saved, and writes nothing', function () {
    $user = User::factory()->create();
    [$bench, $row] = Exercise::factory()->count(2)->create();
    $body = editorBody($bench, $row);

    $this->actingAs($user)->postJson('/api/plans', $body)->assertCreated();
    // The answer was lost; the device sends the same body again
    $this->actingAs($user)->postJson('/api/plans', $body)
        ->assertOk()
        ->assertJsonPath('data.id', $body['id']);

    expect(Plan::count())->toBe(1)
        ->and(PlanItem::count())->toBe(2)
        ->and(PlanSet::count())->toBe(2);
});

it('refuses an id that is someone else\'s plan, day or item', function () {
    $theirs = Plan::factory()->has(PlanDay::factory()->has(PlanItem::factory(), 'items'), 'days')->create();
    [$bench, $row] = Exercise::factory()->count(2)->create();
    $body = editorBody($bench, $row);
    $body['id'] = $theirs->id;
    $body['days'][0]['id'] = $theirs->days[0]->id;
    $body['days'][0]['items'][0]['id'] = $theirs->days[0]->items[0]->id;

    // The plan's id is refused. The days and items are then checked against
    // that plan, theirs, so they pass: the request is refused all the same
    $this->actingAs(User::factory()->create())->postJson('/api/plans', $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['id']);

    // With a new plan id, the day's and the item's ids are refused
    $body['id'] = deviceId();
    $this->actingAs(User::factory()->create())->postJson('/api/plans', $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['days.0.id', 'days.0.items.0.id']);
});

it('accepts public exercises and my own, not someone else\'s', function () {
    $user = User::factory()->create();
    $public = Exercise::factory()->create();
    $mine = Exercise::factory()->for($user, 'owner')->create();
    $theirs = Exercise::factory()->personal()->create();

    $this->actingAs($user)->postJson('/api/plans', editorBody($public, $mine))->assertCreated();
    $this->actingAs($user)->postJson('/api/plans', editorBody($public, $theirs))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['days.0.items.1.exercise_id'])
        ->assertJsonMissingValidationErrors(['days.0.items.0.exercise_id']);
});

it('refuses supersets whose exercises are apart, or alone', function (array $groups, string $message) {
    $user = User::factory()->create();
    $exercise = Exercise::factory()->create();
    $items = array_map(fn (?int $group) => ['exercise_id' => $exercise->id, 'superset_group' => $group, 'sets' => []], $groups);

    $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [['name' => 'Day A', 'items' => $items]]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['days.0.items' => $message]);
})->with([
    'apart: 1 – 1' => [[1, null, 1], 'The exercises of a superset must be next to each other.'],
    'apart: 1 2 1' => [[1, 2, 2, 1], 'The exercises of a superset must be next to each other.'],
    'alone: 1 2 2' => [[1, 2, 2], 'A superset needs at least two exercises.'],
]);

it('accepts supersets of neighbours', function () {
    $user = User::factory()->create();
    $exercise = Exercise::factory()->create();
    $items = array_map(fn (?int $group) => ['exercise_id' => $exercise->id, 'superset_group' => $group, 'sets' => []], [1, 1, null, 2, 2, 2]);

    $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [['name' => 'Day A', 'items' => $items]]])
        ->assertCreated();
});

it('refuses wrong values, with a message on the field', function (array $set, string $field) {
    $user = User::factory()->create();
    $exercise = Exercise::factory()->create();
    $body = ['name' => 'Plan', 'days' => [['name' => 'Day A', 'items' => [['exercise_id' => $exercise->id, 'sets' => [$set]]]]]];

    $this->actingAs($user)->postJson('/api/plans', $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(["days.0.items.0.sets.0.$field"]);
})->with([
    'reps 10–8' => [['target_reps_min' => 10, 'target_reps_max' => 8], 'target_reps_max'],
    'a maximum without a minimum' => [['target_reps_max' => 8], 'target_reps_min'],
    'four decimals of kg' => [['target_weight_kg' => 80.1234], 'target_weight_kg'],
    'RPE 11' => [['target_rpe' => 11], 'target_rpe'],
    'RPE 8.25' => [['target_rpe' => 8.25], 'target_rpe'],
    'an unknown set type' => [['set_type' => 'super'], 'set_type'],
]);

it('refuses a body whose lists are missing, so that nothing is deleted by mistake', function () {
    $user = User::factory()->create();
    $exercise = Exercise::factory()->create();

    $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan'])
        ->assertUnprocessable()->assertJsonValidationErrors('days');
    $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [['name' => 'Day A']]])
        ->assertUnprocessable()->assertJsonValidationErrors('days.0.items');
    $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [['name' => 'Day A', 'items' => [['exercise_id' => $exercise->id]]]]])
        ->assertUnprocessable()->assertJsonValidationErrors('days.0.items.0.sets');
});

it('refuses an id that is not a UUID, without asking the database', function () {
    $user = User::factory()->create();

    // Querying with these values would be a Postgres error, a 500; Laravel
    // skips the database rules once 'uuid' has failed
    $body = ['id' => 'abc', 'name' => 'Plan', 'days' => [['id' => 'day-1', 'name' => 'Day A', 'items' => [
        ['id' => 'item-1', 'exercise_id' => 'bench', 'sets' => []],
    ]]]];

    $this->actingAs($user)->postJson('/api/plans', $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['id', 'days.0.id', 'days.0.items.0.id', 'days.0.items.0.exercise_id']);
});

it('refuses the same id twice in one body', function () {
    $user = User::factory()->create();
    $exercise = Exercise::factory()->create();
    $id = deviceId();
    $item = ['id' => $id, 'exercise_id' => $exercise->id, 'sets' => []];

    // Twice in two different days: distinct compares across the whole body
    $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [
        ['name' => 'Day A', 'items' => [$item]],
        ['name' => 'Day B', 'items' => [$item]],
    ]])->assertUnprocessable()->assertJsonValidationErrors(['days.0.items.0.id', 'days.1.items.0.id']);
});

it('writes the messages in the request\'s language', function () {
    $user = User::factory()->create();
    $exercise = Exercise::factory()->create();
    $items = [['exercise_id' => $exercise->id, 'superset_group' => 1, 'sets' => []]];

    $this->actingAs($user)
        ->postJson('/api/plans', ['name' => '', 'days' => [['name' => 'Day A', 'items' => $items]]], ['Accept-Language' => 'it'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'name' => 'Il campo nome è obbligatorio.',
            'days.0.items' => 'Una superserie deve avere almeno due esercizi.',
        ]);
});

// --- Saving again ------------------------------------------------------------

it('saves a plan again, keeping the ids of days and items, moving and deleting', function () {
    $user = User::factory()->create();
    [$bench, $row, $squat] = Exercise::factory()->count(3)->create();
    $body = editorBody($bench, $row);
    $this->actingAs($user)->postJson('/api/plans', $body)->assertCreated();
    [$benchItem, $rowItem] = $body['days'][0]['items'];

    // The editor's changes: a new day B first, with the rows moved into it;
    // the bench press with one set of 100 kg; a squat added
    $benchItem['superset_group'] = null;
    $benchItem['sets'] = [['set_type' => 'normal', 'target_reps_min' => 5, 'target_reps_max' => 5, 'target_weight_kg' => 100]];
    $rowItem['superset_group'] = null;
    $dayB = ['id' => deviceId(), 'name' => 'Day B – Pull', 'items' => [$rowItem]];
    $dayA = [...$body['days'][0], 'items' => [$benchItem, ['id' => deviceId(), 'exercise_id' => $squat->id, 'sets' => []]]];
    $changed = [...$body, 'version' => 1, 'days' => [$dayB, $dayA]];

    $this->actingAs($user)->putJson("/api/plans/{$body['id']}", $changed)
        ->assertOk()
        ->assertJsonPath('data.version', 2)
        ->assertJsonPath('meta.changed_elsewhere', false)
        ->assertJsonPath('data.days.*.name', ['Day B – Pull', 'Day A – Push']);

    $plan = Plan::with('days.items.sets')->find($body['id']);
    expect($plan->days->pluck('id')->all())->toBe([$dayB['id'], $dayA['id']])
        // The rows kept their item, now in day B
        ->and($plan->days[0]->items->pluck('id')->all())->toBe([$rowItem['id']])
        ->and($plan->days[1]->items->pluck('id')->all())->toBe([$benchItem['id'], $dayA['items'][1]['id']])
        // The bench press's sets were rewritten: one, at 100 kg
        ->and($plan->days[1]->items[0]->sets->pluck('target_weight_kg')->all())->toBe(['100.000'])
        ->and(PlanSet::count())->toBe(1);
});

it('deletes the days and items left out', function () {
    $user = User::factory()->create();
    [$bench, $row] = Exercise::factory()->count(2)->create();
    $body = editorBody($bench, $row);
    $this->actingAs($user)->postJson('/api/plans', $body)->assertCreated();

    $this->actingAs($user)->putJson("/api/plans/{$body['id']}", [...$body, 'version' => 1, 'days' => []])
        ->assertOk()
        ->assertJsonPath('data.days', []);

    expect(PlanDay::count())->toBe(0)->and(PlanItem::count())->toBe(0)->and(PlanSet::count())->toBe(0);
});

it('empties a field left out: the body is the whole plan', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->create(['goal' => 'Strength']);

    $this->actingAs($user)->putJson("/api/plans/{$plan->id}", ['version' => 1, 'name' => 'Plan', 'days' => []])
        ->assertOk()
        ->assertJsonPath('data.goal', null);
});

it('leaves the rows that did not change as they were', function () {
    $user = User::factory()->create();
    [$bench, $row] = Exercise::factory()->count(2)->create();
    $body = editorBody($bench, $row);
    $this->actingAs($user)->postJson('/api/plans', $body)->assertCreated();
    $before = PlanItem::query()->pluck('updated_at', 'id');

    $this->travel(5)->minutes();
    $this->actingAs($user)->putJson("/api/plans/{$body['id']}", [...$body, 'version' => 1])->assertOk();

    // save() wrote nothing for them: their updated_at did not move
    expect(PlanItem::query()->pluck('updated_at', 'id')->all())->toEqual($before->all());
});

it('saves over a version changed elsewhere, and says so', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->create(['version' => 4]);

    // The editor started from version 3: the laptop saved version 4 meanwhile
    $this->actingAs($user)->putJson("/api/plans/{$plan->id}", ['version' => 3, 'name' => 'From the phone', 'days' => []])
        ->assertOk()
        ->assertJsonPath('data.name', 'From the phone')
        ->assertJsonPath('data.version', 5)
        ->assertJsonPath('meta.changed_elsewhere', true);
});

it('needs the version the editor started from', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->create();

    $this->actingAs($user)->putJson("/api/plans/{$plan->id}", ['name' => 'Plan', 'days' => []])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('version');
});

it('refuses to save someone else\'s plan', function () {
    $theirs = Plan::factory()->create(['name' => 'Theirs']);

    $this->actingAs(User::factory()->create())
        ->putJson("/api/plans/{$theirs->id}", ['version' => 1, 'name' => 'Mine now', 'days' => []])
        ->assertForbidden();

    expect($theirs->fresh()->name)->toBe('Theirs');
});
