<?php

/**
 * GET /api/home: everything Home shows (docs/design/D1-ui.md D1.4.2), with no
 * active plan and with one: the days, their estimate, the suggested day, the
 * session left open, the recent workouts.
 */

use App\Actions\Workouts\HomeSummary;
use App\Models\LoggedSet;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\SessionExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has nothing to suggest without an active plan', function () {
    $this->actingAs(User::factory()->create())->getJson('/api/home')
        ->assertOk()
        ->assertExactJson(['data' => [
            'active_plan' => null,
            'days' => [],
            'suggested_day_id' => null,
            'last_day' => null,
            'open_session' => null,
            'recent_sessions' => [],
        ]]);
});

it('gives the active plan\'s days with an estimate, and suggests the next one', function () {
    $user = User::factory()->create(['default_rest_seconds' => 90]);
    $plan = Plan::factory()->for($user)->create(['name' => 'Push Pull Legs']);
    [$a, $b] = PlanDay::factory()->for($plan)->count(2)->sequence(['name' => 'Day A', 'position' => 0], ['name' => 'Day B', 'position' => 1])->create();
    // Day A: 3 sets with 120 s of rest, 2 with the default 90 s
    PlanItem::factory()->for($a, 'day')->has(PlanSet::factory()->count(3), 'sets')->create(['rest_seconds' => 120]);
    PlanItem::factory()->for($a, 'day')->has(PlanSet::factory()->count(2), 'sets')->create(['position' => 1, 'rest_seconds' => null]);
    $user->activePlan()->associate($plan)->save();
    WorkoutSession::factory()->for($user)->create(['plan_id' => $plan->id, 'plan_day_id' => $a->id, 'day_name' => 'Day A']);

    $data = $this->actingAs($user)->getJson('/api/home')->assertOk()->json('data');

    // 3 × (40 + 120) + 2 × (40 + 90) = 740 s, about 12 minutes
    expect($data['active_plan']['name'])->toBe('Push Pull Legs')
        ->and($data['active_plan'])->not->toHaveKey('days')
        ->and($data['days'])->toBe([
            ['id' => $a->id, 'name' => 'Day A', 'exercises' => 2, 'estimated_minutes' => 12],
            ['id' => $b->id, 'name' => 'Day B', 'exercises' => 0, 'estimated_minutes' => 0],
        ])
        ->and($data['suggested_day_id'])->toBe($b->id)
        ->and($data['last_day']['name'])->toBe('Day A');
    expect(HomeSummary::SET_SECONDS)->toBe(40);
});

it('offers the most recent workout left open', function () {
    $user = User::factory()->create();
    WorkoutSession::factory()->for($user)->open()->create(['started_at' => now()->subDays(2)]);
    $latest = WorkoutSession::factory()->for($user)->open()->create(['started_at' => now()->subHour()]);

    $this->actingAs($user)->getJson('/api/home')->assertJsonPath('data.open_session.id', $latest->id);
});

it('sends the finished workouts of the last eight days, with their totals', function () {
    $user = User::factory()->create();
    $recent = WorkoutSession::factory()->for($user)->create(['started_at' => now()->subDays(2)]);
    LoggedSet::factory()->for(SessionExercise::factory()->for($recent, 'session'))->create(['reps' => 10, 'weight_kg' => 50]);
    WorkoutSession::factory()->for($user)->create(['started_at' => now()->subDays(9)]);
    WorkoutSession::factory()->create(['started_at' => now()->subDay()]);

    $this->actingAs($user)->getJson('/api/home')
        ->assertJsonPath('data.recent_sessions.*.id', [$recent->id])
        ->assertJsonPath('data.recent_sessions.0.volume_kg', '500.000');
});
