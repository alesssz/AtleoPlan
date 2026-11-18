<?php

/**
 * The three workout tables, without HTTP: what survives a deleted plan, what
 * Postgres refuses, the totals worked out by the database, and the suggested
 * day.
 *
 * A refusal is tested inside DB::transaction().
 */

use App\Models\Exercise;
use App\Models\LoggedSet;
use App\Models\Plan;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\SessionExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * A finished workout of one exercise: a warm-up of 40 × 10, then 80 × 8 and 80
 * × 7.
 *
 * @param  array<string, mixed>  $attributes  columns of the session
 */
function mondayWorkout(array $attributes = []): WorkoutSession
{
    $session = WorkoutSession::factory()->create($attributes);
    $exercise = SessionExercise::factory()->for($session, 'session')->create();
    LoggedSet::factory()->for($exercise)->warmUp()->create(['position' => 0]);
    LoggedSet::factory()->for($exercise)->create(['position' => 1, 'reps' => 8]);
    LoggedSet::factory()->for($exercise)->create(['position' => 2, 'reps' => 7]);

    return $session;
}

it('keeps the workout when its plan is deleted, with the names it copied', function () {
    $plan = Plan::factory()->has(PlanDay::factory()->has(PlanItem::factory(), 'items'), 'days')->create();
    $day = $plan->days[0];
    $session = WorkoutSession::factory()->for($plan->user)->create([
        'plan_id' => $plan->id, 'plan_day_id' => $day->id, 'plan_name' => 'Push Pull Legs', 'day_name' => 'Day A – Push',
    ]);
    $exercise = SessionExercise::factory()->for($session, 'session')->create(['plan_item_id' => $day->items[0]->id]);

    $plan->delete();

    $fresh = $session->fresh();
    expect($fresh->plan_id)->toBeNull()
        ->and($fresh->plan_day_id)->toBeNull()
        ->and($fresh->plan_name)->toBe('Push Pull Legs')
        ->and($exercise->fresh()->plan_item_id)->toBeNull();
});

it('keeps the workout when its plan is deleted, whichever cascade Postgres runs first', function () {
    // Postgres runs a delete's foreign-key actions by trigger name, which ends
    // in an OID compared as text: past 99999 a later key can run first.
    // Re-created in this order, the sessions' key runs before the days' one
    DB::statement('ALTER TABLE workout_sessions DROP CONSTRAINT workout_sessions_plan_id_foreign');
    DB::statement('ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_plan_id_foreign
        FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL');
    DB::statement('ALTER TABLE plan_days DROP CONSTRAINT plan_days_plan_id_foreign');
    DB::statement('ALTER TABLE plan_days ADD CONSTRAINT plan_days_plan_id_foreign
        FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE');
    $order = DB::scalar("SELECT string_agg(c.conname, ',' ORDER BY t.tgname) FROM pg_trigger t
        JOIN pg_constraint c ON c.oid = t.tgconstraint
        WHERE t.tgrelid = 'plans'::regclass AND t.tgname LIKE 'RI_ConstraintTrigger_a_%' AND t.tgtype & 8 = 8
        AND c.conname IN ('plan_days_plan_id_foreign', 'workout_sessions_plan_id_foreign')");
    expect($order)->toBe('workout_sessions_plan_id_foreign,plan_days_plan_id_foreign');

    $plan = Plan::factory()->has(PlanDay::factory(), 'days')->create();
    $session = WorkoutSession::factory()->for($plan->user)->create(['plan_id' => $plan->id, 'plan_day_id' => $plan->days[0]->id]);

    $plan->delete();
    // Deferred checks would wait for a commit, which the test never makes
    DB::statement('SET CONSTRAINTS ALL IMMEDIATE');

    $fresh = $session->fresh();
    expect($fresh->plan_id)->toBeNull()->and($fresh->plan_day_id)->toBeNull();
});

it('hides a deleted workout, and deletes its rows only for good', function () {
    $session = mondayWorkout();

    $session->delete();
    expect(WorkoutSession::count())->toBe(0)
        ->and(WorkoutSession::withTrashed()->count())->toBe(1)
        ->and(LoggedSet::count())->toBe(3);

    $session->forceDelete();
    expect(SessionExercise::count())->toBe(0)->and(LoggedSet::count())->toBe(0);
});

it('refuses to delete for good an exercise that a workout used', function () {
    $session = mondayWorkout();
    $exercise = $session->sessionExercises[0]->exercise;

    expect(fn () => DB::transaction(fn () => $exercise->forceDelete()))
        ->toThrow(QueryException::class, 'Foreign key violation');
});

it('refuses a feeling outside 1–5, and a negative weight or reps', function (string $table, array $values) {
    $set = LoggedSet::factory()->create();
    $id = $table === 'workout_sessions' ? $set->sessionExercise->workout_session_id : $set->id;

    expect(fn () => DB::transaction(fn () => DB::table($table)->where('id', $id)->update($values)))
        ->toThrow(QueryException::class, 'Check violation');
})->with([
    'feeling 6' => ['workout_sessions', ['feeling' => 6]],
    'weight -1' => ['logged_sets', ['weight_kg' => -1]],
    'reps -1' => ['logged_sets', ['reps' => -1]],
]);

it('works out the totals in the database, warm-ups excluded', function () {
    mondayWorkout();
    // An exercise skipped: no sets, so it is not "done"
    SessionExercise::factory()->for(WorkoutSession::first(), 'session')->create(['position' => 1]);

    $session = WorkoutSession::query()->withTotals()->first();

    // 80 × 8 + 80 × 7, the 40 × 10 warm-up left out
    expect((float) $session->volume_kg)->toBe(1200.0)
        ->and($session->sets_done)->toBe(2)
        ->and($session->exercises_done)->toBe(1);
});

it('suggests the day after the last one done, back to the first after the last', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->create();
    [$a, $b, $c] = PlanDay::factory()->for($plan)->count(3)
        ->sequence(['name' => 'A', 'position' => 0], ['name' => 'B', 'position' => 1], ['name' => 'C', 'position' => 2])
        ->create();
    $did = fn (PlanDay $day, int $hoursAgo, array $more = []) => WorkoutSession::factory()->for($user)
        ->create(['plan_id' => $plan->id, 'plan_day_id' => $day->id, 'started_at' => now()->subHours($hoursAgo), ...$more]);

    // Nothing done yet: the first day
    expect($plan->suggestedDay()->name)->toBe('A');

    $did($a, 50);
    expect($plan->suggestedDay()->name)->toBe('B');

    $did($c, 20);
    expect($plan->suggestedDay()->name)->toBe('A');

    // A session still open, or deleted, does not count
    $did($a, 10, ['finished_at' => null]);
    $did($b, 5)->delete();
    expect($plan->suggestedDay()->name)->toBe('A');
});

it('suggests the first day when the last one done was deleted', function () {
    $user = User::factory()->create();
    $plan = Plan::factory()->for($user)->create();
    [, $b] = PlanDay::factory()->for($plan)->count(2)->sequence(['name' => 'A', 'position' => 0], ['name' => 'B', 'position' => 1])->create();
    WorkoutSession::factory()->for($user)->create(['plan_id' => $plan->id, 'plan_day_id' => $b->id]);

    $b->delete();

    expect($plan->fresh()->suggestedDay()->name)->toBe('A');
});

it('keeps a workout of an exercise deleted since', function () {
    $session = mondayWorkout();
    $exercise = $session->sessionExercises[0];

    Exercise::query()->whereKey($exercise->exercise_id)->first()->delete();

    expect($exercise->fresh()->exercise->trashed())->toBeTrue();
});
