<?php

/**
 * The four plan tables and users.active_plan_id, without HTTP: the ids, the
 * order of the rows, what happens on delete, and what Postgres refuses.
 *
 * A refusal is tested inside DB::transaction(), so the Postgres error aborts
 * only a savepoint.
 */

use App\Enums\SetType;
use App\Models\Exercise;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * A plan with one day, one item and two sets, the shape most tests need.
 *
 * @param  array<string, mixed>  $attributes  columns of the plan
 */
function planWithOneItem(array $attributes = []): Plan
{
    return Plan::factory()
        ->has(PlanDay::factory()->has(PlanItem::factory()->has(PlanSet::factory()->count(2), 'sets'), 'items'), 'days')
        ->create($attributes);
}

it('makes a UUID for a plan, or keeps the one sent by the device', function () {
    $made = Plan::factory()->create();
    $sent = (string) Str::uuid7();
    $kept = Plan::factory()->create(['id' => $sent]);

    expect(Str::isUuid($made->id))->toBeTrue()
        ->and($kept->id)->toBe($sent);
});

it('reads days, items and sets in the order of their position', function () {
    $plan = Plan::factory()->create();
    // Positions in the opposite order of creation
    PlanDay::factory()->for($plan)->count(3)
        ->sequence(['name' => 'C', 'position' => 2], ['name' => 'A', 'position' => 0], ['name' => 'B', 'position' => 1])
        ->create();

    expect($plan->days->pluck('name')->all())->toBe(['A', 'B', 'C']);
});

it('reads the set type as an enum and the weights as exact text', function () {
    $set = PlanSet::factory()->warmUp()->create(['target_rpe' => 7.5]);

    $fresh = $set->fresh();

    expect($fresh->set_type)->toBe(SetType::WarmUp)
        ->and($fresh->target_weight_kg)->toBe('40.000')
        ->and($fresh->target_rpe)->toBe('7.5');
});

it('deletes the days, items and sets with their plan, and empties the active plan', function () {
    $plan = planWithOneItem();
    $user = $plan->user;
    $user->activePlan()->associate($plan)->save();

    $plan->delete();

    expect(PlanDay::count())->toBe(0)
        ->and(PlanItem::count())->toBe(0)
        ->and(PlanSet::count())->toBe(0)
        // nullOnDelete(): the user stays, with no active plan
        ->and($user->fresh()->active_plan_id)->toBeNull();
});

it('deletes a user\'s plans with the user', function () {
    $plan = planWithOneItem();

    $plan->user->delete();

    expect(Plan::count())->toBe(0)->and(PlanSet::count())->toBe(0);
});

it('refuses to delete for good an exercise that a plan uses', function () {
    $plan = planWithOneItem();
    $exercise = $plan->days[0]->items[0]->exercise;

    expect(fn () => DB::transaction(fn () => $exercise->forceDelete()))
        ->toThrow(QueryException::class, 'Foreign key violation');
});

it('keeps showing an exercise deleted after it was put in a plan', function () {
    $plan = planWithOneItem();
    $item = $plan->days[0]->items[0];

    // A soft delete: the exercise leaves the library, not the plan
    $item->exercise->delete();

    expect($item->fresh()->exercise)->toBeInstanceOf(Exercise::class)
        ->and($item->fresh()->exercise->trashed())->toBeTrue();
});

it('refuses a range of reps upside down, and an RPE outside 1–10', function (array $targets) {
    $item = PlanItem::factory()->create();

    expect(fn () => DB::transaction(fn () => $item->sets()->create(['position' => 0, ...$targets])))
        ->toThrow(QueryException::class, 'Check violation');
})->with([
    'reps 10–8' => [['target_reps_min' => 10, 'target_reps_max' => 8]],
    'RPE 11' => [['target_rpe' => 11]],
    'RPE 0.5' => [['target_rpe' => 0.5]],
]);

it('reaches every item of a plan through its days in one query', function () {
    $plan = Plan::factory()
        ->has(PlanDay::factory()->count(2)->has(PlanItem::factory()->count(2), 'items'), 'days')
        ->create();
    // Another plan's items must not count
    planWithOneItem();

    expect($plan->items()->count())->toBe(4);
});

it('gives each user at most one active plan', function () {
    $user = User::factory()->create();
    [$first, $second] = Plan::factory()->for($user)->count(2)->create();

    $user->activePlan()->associate($first)->save();
    $user->activePlan()->associate($second)->save();

    expect($user->fresh()->active_plan_id)->toBe($second->id);
});
