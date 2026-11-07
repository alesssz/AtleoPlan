<?php

namespace App\Policies;

// Imports: the two models the checks compare
use App\Models\User;
use App\Models\WorkoutSession;

/**
 * Who may do what with a workout: only its owner (docs/design/D3-data-model.md
 * D3.6). A policy, like PlanPolicy (docs/concepts/C2-backend.md C2.5.1).
 *
 * Saving is not here: PUT /api/sessions/{id} creates the session when its id
 * is new, so there may be no row to ask about. SaveWorkoutSession checks the
 * owner of a known id itself (a 403), and the list reads
 * `$user->workoutSessions()`, which holds the same rule as view().
 *
 * `make:policy --model=WorkoutSession` also generated viewAny, create,
 * update, restore and forceDelete; they were removed, since nothing uses them.
 */
class WorkoutSessionPolicy
{
    /**
     * Seeing a workout: only my own.
     *
     * @param  User  $user  the signed-in user
     * @param  WorkoutSession  $session  the workout asked for
     */
    public function view(User $user, WorkoutSession $session): bool
    {
        return $session->user_id === $user->id;
    }

    /**
     * Deleting a workout: only my own.
     *
     * @param  User  $user  the signed-in user
     * @param  WorkoutSession  $session  the workout to delete
     */
    public function delete(User $user, WorkoutSession $session): bool
    {
        return $session->user_id === $user->id;
    }
}
