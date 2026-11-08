<?php

/**
 * GET /api/sessions, GET and DELETE /api/sessions/{id}, and
 * GET /api/sessions/last-sets: listing, reading and deleting workouts, and the
 * sets of last time for workout mode (docs/design/D1-ui.md D1.4.9, D1.4.11).
 */

use App\Models\Exercise;
use App\Models\LoggedSet;
use App\Models\SessionExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * A finished workout of one exercise with sets of these reps at 80 kg.
 *
 * @param  User  $user  the owner
 * @param  Exercise  $exercise  the exercise done
 * @param  int  $daysAgo  when it started
 * @param  list<int>  $reps  one set per value
 * @param  array<string, mixed>  $attributes  columns of the session
 */
function workoutOf(User $user, Exercise $exercise, int $daysAgo, array $reps, array $attributes = []): WorkoutSession
{
    $session = WorkoutSession::factory()->for($user)->create(['started_at' => now()->subDays($daysAgo), ...$attributes]);
    $row = SessionExercise::factory()->for($session, 'session')->for($exercise)->create();
    foreach ($reps as $position => $count) {
        LoggedSet::factory()->for($row)->create(['position' => $position, 'reps' => $count]);
    }

    return $session;
}

// --- The list ---------------------------------------------------------------------

it('lists only my workouts, the most recent first, with their totals', function () {
    $user = User::factory()->create();
    $bench = Exercise::factory()->create();
    workoutOf($user, $bench, 3, [8, 8]);
    workoutOf($user, $bench, 1, [8, 7]);
    workoutOf(User::factory()->create(), $bench, 0, [5]);

    $this->actingAs($user)->getJson('/api/sessions')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.volume_kg', '1200.000')
        ->assertJsonPath('data.0.sets_done', 2)
        ->assertJsonPath('data.0.reps_done', 15)
        ->assertJsonPath('data.1.volume_kg', '1280.000')
        ->assertJsonPath('meta.total', 2);
});

it('lists the workouts in progress, or the finished ones', function () {
    $user = User::factory()->create();
    WorkoutSession::factory()->for($user)->create();
    $open = WorkoutSession::factory()->for($user)->open()->create();

    $this->actingAs($user)->getJson('/api/sessions?status=open')->assertJsonPath('data.*.id', [$open->id]);
    $this->actingAs($user)->getJson('/api/sessions?status=finished')->assertJsonCount(1, 'data');
    $this->actingAs($user)->getJson('/api/sessions?status=paused')->assertUnprocessable()->assertJsonValidationErrors('status');
});

// --- One workout ---------------------------------------------------------------------

it('shows a whole workout: exercises, sets and totals', function () {
    $user = User::factory()->create();
    $session = workoutOf($user, Exercise::factory()->create(['name' => ['en' => 'Bench press']]), 0, [10, 8]);

    $this->actingAs($user)->getJson("/api/sessions/{$session->id}")
        ->assertOk()
        ->assertJsonPath('data.exercises.0.exercise.name', 'Bench press')
        ->assertJsonPath('data.exercises.0.sets.*.reps', [10, 8])
        ->assertJsonPath('data.volume_kg', '1440.000');
});

it('gives last time for each of its exercises, from the workouts before it', function () {
    $user = User::factory()->create();
    $bench = Exercise::factory()->create();
    $squat = Exercise::factory()->create();
    // The bench press ten days ago (5 reps), three days ago (8, 8), in a
    // workout deleted two days ago (12); today, the one read (8, 8, 8); and
    // tomorrow's, which must not count for today
    workoutOf($user, $bench, 10, [5]);
    $before = workoutOf($user, $bench, 3, [8, 8]);
    workoutOf($user, $bench, 2, [12])->delete();
    $today = workoutOf($user, $bench, 0, [8, 8, 8], ['started_at' => now()->subHour()]);
    workoutOf($user, $bench, -1, [10]);
    // The squat, done today for the first time: nothing to compare with
    SessionExercise::factory()->for($today, 'session')->for($squat)->has(LoggedSet::factory(), 'sets')->create(['position' => 1]);

    $this->actingAs($user)->getJson("/api/sessions/{$today->id}")
        ->assertOk()
        ->assertJsonCount(1, 'meta.last_sets')
        ->assertJsonPath('meta.last_sets.0.exercise_id', $bench->id)
        ->assertJsonPath('meta.last_sets.0.session_id', $before->id)
        ->assertJsonPath('meta.last_sets.0.sets.*.reps', [8, 8]);

    // Read later, a workout is compared with the one before *it*
    $this->actingAs($user)->getJson("/api/sessions/{$before->id}")->assertJsonPath('meta.last_sets.0.sets.*.reps', [5]);
});

it('refuses someone else\'s workout, and does not find a deleted one', function () {
    $user = User::factory()->create();
    $theirs = WorkoutSession::factory()->create();
    $deleted = WorkoutSession::factory()->for($user)->create();
    $deleted->delete();

    $this->actingAs($user)->getJson("/api/sessions/{$theirs->id}")->assertForbidden();
    $this->actingAs($user)->getJson("/api/sessions/{$deleted->id}")->assertNotFound();
});

it('deletes my workout softly, and refuses someone else\'s', function () {
    $user = User::factory()->create();
    $mine = WorkoutSession::factory()->for($user)->create();
    $theirs = WorkoutSession::factory()->create();

    $this->actingAs($user)->deleteJson("/api/sessions/{$mine->id}")->assertNoContent();
    $this->actingAs($user)->deleteJson("/api/sessions/{$theirs->id}")->assertForbidden();

    expect(WorkoutSession::withTrashed()->find($mine->id)->trashed())->toBeTrue()
        ->and($theirs->fresh()->trashed())->toBeFalse();
});

// --- Last time --------------------------------------------------------------------------

it('gives the sets of the last finished workout of each exercise', function () {
    $user = User::factory()->create();
    [$bench, $squat, $neverDone] = Exercise::factory()->count(3)->create();
    workoutOf($user, $bench, 7, [10, 10]);
    $last = workoutOf($user, $bench, 2, [8, 7]);
    workoutOf($user, $squat, 4, [5, 5, 5]);

    $answer = $this->actingAs($user)
        ->getJson("/api/sessions/last-sets?exercises={$bench->id},{$squat->id},{$neverDone->id}")
        ->assertOk()
        ->json('data');

    // One entry per exercise done before; the one never done is left out
    $byExercise = collect($answer)->keyBy('exercise_id');
    expect($byExercise->keys()->all())->toEqualCanonicalizing([$bench->id, $squat->id])
        ->and($byExercise[$bench->id]['session_id'])->toBe($last->id)
        ->and(array_column($byExercise[$bench->id]['sets'], 'reps'))->toBe([8, 7])
        ->and(array_column($byExercise[$squat->id]['sets'], 'reps'))->toBe([5, 5, 5]);
});

it('does not count a workout in progress, deleted, skipped or someone else\'s', function () {
    $user = User::factory()->create();
    $bench = Exercise::factory()->create();
    $kept = workoutOf($user, $bench, 5, [8]);
    workoutOf($user, $bench, 3, [9], ['finished_at' => null]);
    workoutOf($user, $bench, 2, [10])->delete();
    workoutOf($user, $bench, 1, []);
    workoutOf(User::factory()->create(), $bench, 0, [12]);

    $this->actingAs($user)->getJson("/api/sessions/last-sets?exercises={$bench->id}")
        ->assertJsonPath('data.0.session_id', $kept->id)
        ->assertJsonPath('data.0.sets.0.reps', 8);
});

it('refuses a list of exercises that is not one', function () {
    $this->actingAs(User::factory()->create())->getJson('/api/sessions/last-sets?exercises=12,abc')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('exercises');
});
