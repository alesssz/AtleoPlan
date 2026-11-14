<?php

/**
 * DELETE /api/plans/{plan} and the three actions on a plan: activate, archive,
 * unarchive, with PlanPolicy's refusals.
 */

use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- Deleting ----------------------------------------------------------------

it('deletes my plan with its days, and leaves me with no active plan', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->has(PlanDay::factory()->count(2), 'days')->create();
    $user->activePlan()->associate($plan)->save();

    $this->actingAs($user)->deleteJson("/api/plans/{$plan->id}")->assertNoContent();

    expect(Plan::count())->toBe(0)
        ->and(PlanDay::count())->toBe(0)
        ->and($user->fresh()->active_plan_id)->toBeNull();
});

it('refuses to delete someone else\'s plan', function () {
    $theirs = Plan::factory()->create();

    $this->actingAs(User::factory()->create())->deleteJson("/api/plans/{$theirs->id}")->assertForbidden();

    expect(Plan::count())->toBe(1);
});

// --- The active plan ---------------------------------------------------------

it('makes a plan the active one, in place of the one before', function () {
    $user = User::factory()->create();
    [$first, $second] = Plan::factory()->for($user)->count(2)->create();
    $user->activePlan()->associate($first)->save();

    $this->actingAs($user)->postJson("/api/plans/{$second->id}/activate")
        ->assertOk()
        ->assertJsonPath('data.is_active', true);

    expect($user->fresh()->active_plan_id)->toBe($second->id);
});

it('refuses to make active an archived plan, or someone else\'s', function () {
    $user = User::factory()->create();
    $archived = Plan::factory()->for($user)->archived()->create();
    $theirs = Plan::factory()->create();

    $this->actingAs($user)->postJson("/api/plans/{$archived->id}/activate")->assertForbidden();
    $this->actingAs($user)->postJson("/api/plans/{$theirs->id}/activate")->assertForbidden();

    expect($user->fresh()->active_plan_id)->toBeNull();
});

// --- Archiving ---------------------------------------------------------------

it('archives a plan, which stops being the active one', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->create();
    $user->activePlan()->associate($plan)->save();

    $this->actingAs($user)->postJson("/api/plans/{$plan->id}/archive")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($plan->fresh()->archived_at)->not->toBeNull()
        ->and($user->fresh()->active_plan_id)->toBeNull();
    $this->actingAs($user)->getJson('/api/plans')->assertJsonCount(0, 'data');
});

it('brings an archived plan back, not active', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->archived()->create();

    $this->actingAs($user)->postJson("/api/plans/{$plan->id}/unarchive")
        ->assertOk()
        ->assertJsonPath('data.archived_at', null)
        ->assertJsonPath('data.is_active', false);

    $this->actingAs($user)->getJson('/api/plans')->assertJsonCount(1, 'data');
});

it('refuses to archive or bring back someone else\'s plan', function () {
    $theirs = Plan::factory()->create();
    $user = User::factory()->create();

    $this->actingAs($user)->postJson("/api/plans/{$theirs->id}/archive")->assertForbidden();
    $this->actingAs($user)->postJson("/api/plans/{$theirs->id}/unarchive")->assertForbidden();
});
