<?php

/**
 * GET /api/plans and GET /api/plans/{plan}: the plan list and one whole plan
 * (docs/design/D1-ui.md D1.4.6, D1.4.7), with who may see what.
 */

use App\Enums\MuscleRole;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// --- The list ------------------------------------------------------------

it('answers 401 to a visitor', function () {
    $plan = Plan::factory()->create();

    $this->getJson('/api/plans')->assertUnauthorized();
    $this->getJson("/api/plans/{$plan->id}")->assertUnauthorized();
});

it('lists only my plans, the active one first, then the most recently changed', function () {
    $user = User::factory()->create();
    // travel(): moves the clock, so that updated_at differs between plans
    $old = Plan::factory()->for($user)->create(['name' => 'Old']);
    $this->travel(1)->hours();
    $active = Plan::factory()->for($user)->create(['name' => 'Active']);
    $this->travel(1)->hours();
    $recent = Plan::factory()->for($user)->create(['name' => 'Recent']);
    Plan::factory()->create(['name' => 'Someone else\'s']);
    $user->activePlan()->associate($active)->save();

    $this->actingAs($user)->getJson('/api/plans')
        ->assertOk()
        ->assertJsonPath('data.*.name', ['Active', 'Recent', 'Old'])
        ->assertJsonPath('data.*.is_active', [true, false, false]);
});

it('sends each plan with its number of days, not the days', function () {
    $user = User::factory()->create();
    Plan::factory()->for($user)->has(PlanDay::factory()->count(3), 'days')->create();

    $plan = $this->actingAs($user)->getJson('/api/plans')->assertOk()->json('data.0');

    expect($plan['days_count'])->toBe(3)
        ->and($plan)->not->toHaveKey('days')
        ->and(array_keys($plan))->toBe(['id', 'name', 'goal', 'notes', 'version', 'is_active', 'archived_at', 'updated_at', 'days_count', 'last_used_at']);
});

it('says when each plan was last used: its latest finished workout, deleted ones left out', function () {
    $user = User::factory()->create();
    $used = Plan::factory()->for($user)->create(['name' => 'Used']);
    Plan::factory()->for($user)->create(['name' => 'Never used']);
    // Four workouts of the plan, on fixed dates (the test must give the same
    // answer any day it runs): finished on the 3rd and the 6th, a later one
    // deleted, and a later one still in progress
    WorkoutSession::factory()->for($user)->create(['plan_id' => $used->id, 'started_at' => '2026-11-03 18:00:00']);
    WorkoutSession::factory()->for($user)->create(['plan_id' => $used->id, 'started_at' => '2026-11-06 18:00:00']);
    WorkoutSession::factory()->for($user)->create(['plan_id' => $used->id, 'started_at' => '2026-11-07 18:00:00'])->delete();
    WorkoutSession::factory()->for($user)->open()->create(['plan_id' => $used->id, 'started_at' => '2026-11-08 18:00:00']);

    $plans = collect($this->actingAs($user)->getJson('/api/plans')->assertOk()->json('data'))->keyBy('name');

    expect($plans['Used']['last_used_at'])->toBe('2026-11-06T18:00:00.000000Z')
        ->and($plans['Never used']['last_used_at'])->toBeNull();
});

it('keeps archived plans apart, behind archived=1', function () {
    $user = User::factory()->create();
    Plan::factory()->for($user)->create(['name' => 'In use']);
    Plan::factory()->for($user)->archived()->create(['name' => 'Archived']);

    $this->actingAs($user)->getJson('/api/plans')
        ->assertJsonPath('data.*.name', ['In use']);
    $this->actingAs($user)->getJson('/api/plans?archived=1')
        ->assertJsonPath('data.*.name', ['Archived']);
    $this->actingAs($user)->getJson('/api/plans?archived=maybe')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('archived');
});

// --- One whole plan --------------------------------------------------------

it('shows a whole plan: days, exercises and sets in order', function () {
    $user = User::factory()->create();
    $barbell = Equipment::factory()->create(['slug' => 'barbell']);
    $chest = Muscle::factory()->create(['slug' => 'chest']);
    $bench = Exercise::factory()->for($barbell)
        ->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')
        ->create(['name' => ['en' => 'Bench press']]);
    $plan = Plan::factory()->for($user)->create(['name' => 'Push Pull Legs', 'goal' => 'Hypertrophy']);
    $pull = PlanDay::factory()->for($plan)->create(['name' => 'Day B – Pull', 'position' => 1]);
    $push = PlanDay::factory()->for($plan)->create(['name' => 'Day A – Push', 'position' => 0]);
    $item = PlanItem::factory()->for($push, 'day')->for($bench)->create(['superset_group' => null, 'rest_seconds' => 120, 'notes' => 'Shoulder blades back']);
    PlanSet::factory()->for($item, 'item')->create(['position' => 1]);
    PlanSet::factory()->for($item, 'item')->warmUp()->create(['position' => 0]);

    $json = $this->actingAs($user)->getJson("/api/plans/{$plan->id}")->assertOk()->json('data');

    expect($json['name'])->toBe('Push Pull Legs')
        ->and($json['goal'])->toBe('Hypertrophy')
        ->and($json['version'])->toBe(1)
        ->and($json['is_active'])->toBeFalse()
        ->and(array_column($json['days'], 'name'))->toBe(['Day A – Push', 'Day B – Pull'])
        ->and(array_column($json['days'], 'id'))->toBe([$push->id, $pull->id])
        ->and($json['days'][1]['items'])->toBe([]);

    // The item: its own fields, the exercise as the library sends it, the sets
    $sent = $json['days'][0]['items'][0];
    expect($sent['id'])->toBe($item->id)
        ->and($sent['exercise_id'])->toBe($bench->id)
        ->and($sent['rest_seconds'])->toBe(120)
        ->and($sent['notes'])->toBe('Shoulder blades back')
        ->and($sent['exercise']['name'])->toBe('Bench press')
        ->and($sent['exercise']['equipment']['slug'])->toBe('barbell')
        ->and($sent['exercise']['muscles'][0]['slug'])->toBe('chest')
        ->and($sent['exercise']['photos'])->toBe([])
        ->and($sent['sets'])->toBe([
            ['set_type' => 'warm_up', 'target_reps_min' => 10, 'target_reps_max' => 10, 'target_weight_kg' => '40.000', 'target_rpe' => null, 'target_duration_seconds' => null, 'target_distance_meters' => null],
            ['set_type' => 'normal', 'target_reps_min' => 8, 'target_reps_max' => 10, 'target_weight_kg' => '80.000', 'target_rpe' => null, 'target_duration_seconds' => null, 'target_distance_meters' => null],
        ]);
});

it('still shows an exercise deleted since it was put in the plan', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->has(PlanDay::factory()->has(PlanItem::factory(), 'items'), 'days')->create();
    $plan->days[0]->items[0]->exercise->delete();

    $this->actingAs($user)->getJson("/api/plans/{$plan->id}")
        ->assertOk()
        ->assertJsonPath('data.days.0.items.0.exercise.id', $plan->days[0]->items[0]->exercise_id);
});

it('reads a whole plan in the same number of queries, whatever its size', function () {
    $user = User::factory()->create();
    $small = Plan::factory()->for($user)->has(PlanDay::factory()->has(PlanItem::factory(), 'items'), 'days')->create();
    $large = Plan::factory()->for($user)
        ->has(PlanDay::factory()->count(4)->has(PlanItem::factory()->count(5)->has(PlanSet::factory()->count(4), 'sets'), 'items'), 'days')
        ->create();

    // How many queries one request runs. enableQueryLog() makes Laravel
    // remember every query; flushQueryLog() forgets those of the setup
    $count = function (Plan $plan) use ($user): int {
        DB::enableQueryLog();
        DB::flushQueryLog();
        $this->actingAs($user)->getJson("/api/plans/{$plan->id}")->assertOk();

        return count(DB::getQueryLog());
    };

    expect($count($large))->toBe($count($small));
});

it('refuses someone else\'s plan with a 403, and a missing one with a 404', function () {
    $user = User::factory()->create();
    $theirs = Plan::factory()->create();

    $this->actingAs($user)->getJson("/api/plans/{$theirs->id}")->assertForbidden();
    // A valid UUID that no plan has
    $this->actingAs($user)->getJson('/api/plans/0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f20')->assertNotFound();
    // Not a UUID at all: a 404 too, not a database error
    $this->actingAs($user)->getJson('/api/plans/12')->assertNotFound();
});
